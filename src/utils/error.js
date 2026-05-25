export function getErrorMessage(error, fallback = 'Thao tác thất bại. Vui lòng thử lại.') {
  const data = error?.response?.data
  if (!data) return fallback
  if (typeof data === 'string') return data
  if (data.message) return data.message
  if (data.error) return data.error
  if (data.fieldErrors && typeof data.fieldErrors === 'object') {
    const first = Object.values(data.fieldErrors).find(Boolean)
    if (first) return first
  }
  return fallback
}

export function getFieldErrors(error) {
  const data = error?.response?.data
  if (data?.fieldErrors && typeof data.fieldErrors === 'object') return data.fieldErrors
  return {}
}
