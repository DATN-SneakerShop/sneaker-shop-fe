const NEW_ADDRESS_API_BASE = 'https://esgoo.net/api-tinhthanh-new'
const LEGACY_OPEN_API_BASE = 'https://provinces.open-api.vn/api'
const NEW_MODEL_DISTRICT_CODE_PREFIX = '__VN_NEW_MODEL__'

let provinceCache = null
const districtCache = new Map()
const wardCache = new Map()

export const NEW_MODEL_DISTRICT_NAME = 'Theo đơn vị hành chính mới'

export function normalizeAddressName(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/^(tinh|thanh pho|tp\.?|quan|huyen|thi xa|thi tran|phuong|xa|dac khu)\s+/i, '')
    .replace(/\s+/g, ' ')
}

function unwrapEsgooList(payload) {
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload?.data)) return payload.data
  if (Array.isArray(payload?.results)) return payload.results
  return []
}

function getUnitCode(item) {
  return String(item?.code ?? item?.id ?? item?.value ?? item?.ma ?? '').trim()
}

function getUnitName(item) {
  return String(
    item?.full_name ||
    item?.fullName ||
    item?.name_with_type ||
    item?.name ||
    item?.label ||
    ''
  ).trim()
}

function mapUnit(item) {
  return {
    code: getUnitCode(item),
    name: getUnitName(item),
    raw: item,
  }
}

function uniqueUnits(units) {
  const seen = new Set()
  return units.filter((unit) => {
    const key = `${unit.code}|||${normalizeAddressName(unit.name)}`
    if (!unit.code || !unit.name || seen.has(key)) return false
    seen.add(key)
    return true
  })
}

async function fetchJson(url) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Cannot load address data: ${url}`)
  return res.json()
}

async function fetchNewProvinces() {
  const payload = await fetchJson(`${NEW_ADDRESS_API_BASE}/4/0.htm`)
  const data = unwrapEsgooList(payload).map(mapUnit)
  const units = uniqueUnits(data)
  if (!units.length) throw new Error('New province data is empty')
  return units.map((province) => ({
    ...province,
    source: 'NEW_2025',
    districts: [],
  }))
}

async function fetchLegacyProvinces() {
  const payload = await fetchJson(`${LEGACY_OPEN_API_BASE}/?depth=3`)
  const data = Array.isArray(payload) ? payload : []
  if (!data.length) throw new Error('Legacy province data is empty')
  return data.map((province) => ({
    code: String(province.code),
    name: province.name,
    source: 'LEGACY',
    raw: province,
    districts: (province.districts || []).map((district) => ({
      code: String(district.code),
      name: district.name,
      source: 'LEGACY',
      raw: district,
      wards: (district.wards || []).map((ward) => ({
        code: String(ward.code),
        name: ward.name,
        source: 'LEGACY',
        raw: ward,
      })),
    })),
  }))
}

export async function fetchVietnamProvinces({ force = false } = {}) {
  if (!force && provinceCache) return provinceCache
  try {
    provinceCache = await fetchNewProvinces()
  } catch (newApiError) {
    console.warn('Không tải được API 34 tỉnh/phường xã mới, fallback API cũ:', newApiError)
    provinceCache = await fetchLegacyProvinces()
  }
  return provinceCache
}

export async function fetchVietnamDistricts(provinceCode) {
  if (!provinceCode) return []
  const provinces = await fetchVietnamProvinces()
  const province = provinces.find((item) => String(item.code) === String(provinceCode))
  if (!province) return []

  if (province.source === 'LEGACY') {
    return province.districts || []
  }

  if (districtCache.has(String(provinceCode))) return districtCache.get(String(provinceCode))

  const syntheticDistrict = {
    code: `${NEW_MODEL_DISTRICT_CODE_PREFIX}${province.code}`,
    name: NEW_MODEL_DISTRICT_NAME,
    source: 'NEW_2025',
    provinceCode: province.code,
    wards: [],
    note: 'Sau sắp xếp 2025, địa chỉ giao hàng dùng Tỉnh/Thành phố và Phường/Xã mới. Trường Quận/Huyện được giữ để đồng bộ form cũ.',
  }

  districtCache.set(String(provinceCode), [syntheticDistrict])
  province.districts = [syntheticDistrict]
  return [syntheticDistrict]
}

async function fetchNewWardsByProvince(provinceCode) {
  const endpoints = [
    `${NEW_ADDRESS_API_BASE}/5/${provinceCode}.htm`,
    `${NEW_ADDRESS_API_BASE}/6/${provinceCode}.htm`,
  ]

  let lastError = null
  for (const url of endpoints) {
    try {
      const payload = await fetchJson(url)
      const units = uniqueUnits(unwrapEsgooList(payload).map(mapUnit))
      if (units.length) return units.map((ward) => ({ ...ward, source: 'NEW_2025' }))
    } catch (error) {
      lastError = error
    }
  }
  throw lastError || new Error('New ward data is empty')
}

export async function fetchVietnamWards(provinceCode, districtCode) {
  if (!provinceCode || !districtCode) return []
  const provinces = await fetchVietnamProvinces()
  const province = provinces.find((item) => String(item.code) === String(provinceCode))
  if (!province) return []

  if (province.source === 'LEGACY') {
    const district = (province.districts || []).find((item) => String(item.code) === String(districtCode))
    return district?.wards || []
  }

  const cacheKey = String(provinceCode)
  if (wardCache.has(cacheKey)) return wardCache.get(cacheKey)

  const wards = await fetchNewWardsByProvince(provinceCode)
  wardCache.set(cacheKey, wards)

  const districts = await fetchVietnamDistricts(provinceCode)
  if (districts[0]) districts[0].wards = wards
  return wards
}

export function findAddressUnitByName(list, name) {
  const normalized = normalizeAddressName(name)
  if (!normalized) return null
  return (list || []).find((item) => normalizeAddressName(item.name) === normalized) || null
}

export function toAddressOptions(units) {
  return (units || []).map((unit) => ({
    value: unit.code,
    label: unit.name,
    unit,
  }))
}
