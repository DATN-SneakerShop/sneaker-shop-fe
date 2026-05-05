<template>
  <div style="padding: 24px">
    <a-card title="👥 Danh sách khách hàng">
      <template #extra>
        <a-popconfirm title="Dọn sạch dữ liệu?"
          @confirm="async () => { await clearAllCustomerData(); fetchCustomers() }">
          <a-button danger ghost>♻️ Clear All</a-button>
        </a-popconfirm>
      </template>

      <div style="margin-bottom:16px">
        <a-space>
          <a-input-search v-model:value="keyword" placeholder="Tìm tên, email..." style="width:300px"
            @search="fetchCustomers" />
          <a-select v-model:value="filterLoai" style="width:200px" @change="fetchCustomers">
            <a-select-option value="ALL">Tất cả tài khoản khách</a-select-option>
            <a-select-option value="VIP">Hạng VIP</a-select-option>
            <a-select-option value="NORMAL">Hạng Thường</a-select-option>
          </a-select>
        </a-space>
      </div>

      <a-table :dataSource="customers" :columns="columns" rowKey="id" :loading="loading" bordered>
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'ten'">
            <b>{{ record.ten || record.fullName || 'N/A' }}</b>
          </template>
          <template v-if="column.key === 'action'">
            <a-space>
              <a-button type="primary" size="small" ghost @click="openAddressModal(record)">
                <template #icon><environment-outlined /></template> Địa chỉ
              </a-button>

              <a-button size="small" @click="openEditModal(record)">
                <template #icon><edit-outlined /></template> Sửa
              </a-button>
            </a-space>
          </template>
        </template>
      </a-table>
    </a-card>

    <a-modal v-model:visible="editModalVisible" title="✏️ Cập nhật thông tin khách hàng" @ok="handleUpdateCustomer" :confirmLoading="editLoading" okText="Lưu thay đổi" cancelText="Hủy">
      <a-form layout="vertical">
        <a-form-item label="Họ tên" required>
          <a-input v-model:value="editForm.ten" placeholder="Nhập họ tên khách hàng..." />
        </a-form-item>
        <a-form-item label="Số điện thoại">
          <a-input v-model:value="editForm.phone" placeholder="Nhập số điện thoại..." />
        </a-form-item>
        <a-form-item label="Ngày sinh">
          <a-input type="date" v-model:value="editForm.ngaySinh" />
        </a-form-item>

        <a-form-item label="Điểm tích lũy">
          <a-input-number v-model:value="editForm.diemTichLuy" style="width: 100%" :min="0" placeholder="Nhập điểm tích lũy..." />
        </a-form-item>
      </a-form>
    </a-modal>

    <a-modal v-model:visible="addressModalVisible" :title="`📍 Địa chỉ: ${currentCustomer?.ten || currentCustomer?.fullName}`" width="850px"
      :footer="null">
      <a-button type="primary" style="margin-bottom:16px" @click="showAddAddressForm = !showAddAddressForm">
        {{ showAddAddressForm ? 'Hủy' : '+ Thêm địa chỉ mới' }}
      </a-button>

      <a-card v-if="showAddAddressForm" style="margin-bottom:20px; background:#fafafa">
        <a-form layout="vertical">
          <a-row :gutter="16">
            <a-col :span="8">
              <a-form-item label="Nhãn">
                <a-input v-model:value="addressForm.label" placeholder="Nhà, công ty..." />
              </a-form-item>
            </a-col>
            <a-col :span="8">
              <a-form-item label="Người nhận">
                <a-input v-model:value="addressForm.recipientName" />
              </a-form-item>
            </a-col>
            <a-col :span="8">
              <a-form-item label="SĐT">
                <a-input v-model:value="addressForm.phone" />
              </a-form-item>
            </a-col>
          </a-row>

          <a-row :gutter="16">
            <a-col :span="8">
              <a-form-item label="Tỉnh/TP" required>
                <a-select v-model:value="addressForm.province" show-search placeholder="Chọn Tỉnh/TP" :options="provinceOptions" @change="onProvinceChange"/>
              </a-form-item>
            </a-col>
            <a-col :span="8">
              <a-form-item label="Quận/Huyện" required>
                <a-select v-model:value="addressForm.district" show-search placeholder="Chọn Quận/Huyện" :options="districtOptions" @change="onDistrictChange" :disabled="!addressForm.province"/>
              </a-form-item>
            </a-col>
            <a-col :span="8">
              <a-form-item label="Phường/Xã" required>
                <a-select v-model:value="addressForm.ward" show-search placeholder="Chọn Phường/Xã" :options="wardOptions" :disabled="!addressForm.district"/>
              </a-form-item>
            </a-col>
          </a-row>

          <a-form-item label="Địa chỉ chi tiết (Số nhà, tên đường)">
            <a-input v-model:value="addressForm.detailAddress" />
          </a-form-item>

          <a-checkbox v-model:checked="addressForm.isDefault" :true-value="1" :false-value="0">Đặt làm mặc định</a-checkbox>

          <a-button type="primary" block style="margin-top:10px" @click="handleSaveAddress">Xác nhận lưu địa chỉ</a-button>
        </a-form>
      </a-card>

      <a-table :dataSource="addressList"
        :columns="[{ title: 'Nhãn', dataIndex: 'label' }, { title: 'Địa chỉ', key: 'fullAddress' }, { title: 'Mặc định', key: 'isDefault' }, { title: 'Xóa', key: 'op' }]"
        rowKey="id" :loading="addressLoading" pagination="false">
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'fullAddress'">
            {{ record.detailAddress }}, {{ record.ward }}, {{ record.district }}, {{ record.province }}
          </template>
          <template v-if="column.key === 'isDefault'">
            <a-tag v-if="record.isDefault === 1" color="green">Mặc định</a-tag>
          </template>
          <template v-if="column.key === 'op'">
            <a-button type="text" danger @click="handleDeleteAddress(record.id)"><delete-outlined /></a-button>
          </template>
        </template>
      </a-table>
    </a-modal>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from "vue"
import { message } from "ant-design-vue"
import { EnvironmentOutlined, DeleteOutlined, EditOutlined } from '@ant-design/icons-vue' // Đổi Icon Bút chì
import {
  getAllCustomers,  // Gọi API lấy thẳng Customer thay vì User
  updateCustomer,   // Gọi API Cập nhật
  filterCustomersByRank,
  searchCustomers,
  clearAllCustomerData,
  getCustomerAddresses,
  saveCustomerAddress,
  deleteCustomerAddress
} from "@/api/customer"

const customers = ref([])
const loading = ref(false)
const filterLoai = ref("ALL")
const keyword = ref("")

// Chỉnh lại cột Tên khớp với thuộc tính 'ten' của bảng Customer
const columns = [
  { title: "Tên khách hàng", dataIndex: "ten", key: "ten" },
  { title: "Email", dataIndex: "email", key: "email" },
  { title: "Số điện thoại", dataIndex: "phone", key: "phone" },
  { title: "Điểm", dataIndex: "diemTichLuy", key: "diem" }, // 🔥 Thêm cột này
  { title: "Hạng khách", dataIndex: "loaiKhach", key: "loaiKhach" },
  { title: "Thao tác", key: "action", align: 'center', width: 250 }
]

/* ================= CHỈNH SỬA THÔNG TIN STATE ================= */
const editModalVisible = ref(false)
const editLoading = ref(false)
const editForm = ref({ id: null, ten: '', phone: '', ngaySinh: '', diemTichLuy: 0 }) // Thêm diemTichLuy

const openEditModal = (record) => {
  editForm.value = {
    ...record,
    id: record.id,
    ten: record.ten || record.fullName || '',
    phone: record.phone || '',
    ngaySinh: record.ngaySinh || '',
    diemTichLuy: record.diemTichLuy || 0
  }
  editModalVisible.value = true
}

const handleUpdateCustomer = async () => {
  if (!editForm.value.ten) return message.warning("Vui lòng nhập họ tên khách hàng!")

  editLoading.value = true
  try {
    await updateCustomer(editForm.value.id, editForm.value)
    message.success("Cập nhật thông tin thành công!")
    editModalVisible.value = false
    fetchCustomers() // Refresh lại bảng sau khi lưu
  } catch {
    message.error("Lỗi cập nhật. Vui lòng thử lại!")
  } finally {
    editLoading.value = false
  }
}

/* ================= API BẢN ĐỒ VIỆT NAM ================= */
const provincesData = ref([])
const districtsData = ref([])
const wardsData = ref([])

const fetchVietnamProvinces = async () => {
  try {
    const res = await fetch("https://provinces.open-api.vn/api/?depth=3")
    provincesData.value = await res.json()
  } catch {
    console.error("Không thể tải dữ liệu bản đồ Việt Nam")
  }
}

const provinceOptions = computed(() => provincesData.value.map(p => ({ label: p.name, value: p.name })))
const districtOptions = computed(() => districtsData.value.map(d => ({ label: d.name, value: d.name })))
const wardOptions = computed(() => wardsData.value.map(w => ({ label: w.name, value: w.name })))

const onProvinceChange = (val) => {
  addressForm.value.district = null
  addressForm.value.ward = null
  const p = provincesData.value.find(x => x.name === val)
  districtsData.value = p ? p.districts : []
  wardsData.value = []
}

const onDistrictChange = (val) => {
  addressForm.value.ward = null
  const d = districtsData.value.find(x => x.name === val)
  wardsData.value = d ? d.wards : []
}

/* ================= ĐỊA CHỈ STATE ================= */
const addressModalVisible = ref(false)
const addressLoading = ref(false)
const addressList = ref([])
const currentCustomer = ref(null)
const showAddAddressForm = ref(false)
const addressForm = ref({
  label: '', recipientName: '', phone: '', province: null,
  district: null, ward: null, detailAddress: '', isDefault: 0
})

/* ================= LOGIC FETCH ================= */
const fetchCustomers = async () => {
  loading.value = true
  try {
    if (filterLoai.value === "ALL" && !keyword.value) {
      // 🔥 Gọi trực tiếp vào bảng Customer để lấy data chuẩn xác nhất
      const res = await getAllCustomers()
      customers.value = res.data
    } else if (keyword.value) {
      const res = await searchCustomers(keyword.value)
      customers.value = res.data
    } else {
      const res = await filterCustomersByRank({ loaiKhach: filterLoai.value })
      customers.value = res.data
    }
  } catch {
    message.error("Không thể tải danh sách khách hàng")
  } finally {
    loading.value = false
  }
}

const openAddressModal = async (record) => {
  currentCustomer.value = record
  addressModalVisible.value = true
  showAddAddressForm.value = false
  fetchAddresses()
}

const fetchAddresses = async () => {
  addressLoading.value = true
  try {
    const res = await getCustomerAddresses(currentCustomer.value.id)
    addressList.value = res.data
  } finally {
    addressLoading.value = false
  }
}

const handleSaveAddress = async () => {
  if(!addressForm.value.recipientName || !addressForm.value.phone || !addressForm.value.detailAddress) {
    return message.warning("Vui lòng nhập Tên, SĐT và Địa chỉ chi tiết!")
  }
  if(!addressForm.value.province || !addressForm.value.district || !addressForm.value.ward) {
    return message.warning("Vui lòng chọn Tỉnh/Quận/Phường!")
  }

  try {
    const payload = {
      label: addressForm.value.label,
      recipientName: addressForm.value.recipientName,
      phone: addressForm.value.phone,
      province: addressForm.value.province,
      district: addressForm.value.district,
      ward: addressForm.value.ward,
      detailAddress: addressForm.value.detailAddress,
      isDefault: addressForm.value.isDefault ? 1 : 0,
      customerId: currentCustomer.value.id
    }

    await saveCustomerAddress(payload)
    message.success("Thêm địa chỉ thành công")
    showAddAddressForm.value = false

    // Reset form
    addressForm.value = { label: '', recipientName: '', phone: '', province: null, district: null, ward: null, detailAddress: '', isDefault: 0 }

    fetchAddresses()
  } catch  {
    message.error("Lỗi khi lưu địa chỉ")
  }
}

const handleDeleteAddress = async (id) => {
  try {
    await deleteCustomerAddress(id)
    message.success("Đã xóa địa chỉ")
    fetchAddresses()
  } catch {
    message.error("Lỗi xóa địa chỉ")
  }
}

onMounted(() => {
  fetchCustomers()
  fetchVietnamProvinces()
})
</script>
