import axios from 'axios'

const API_URL = 'http://localhost:8080/api/vouchers'

// 🔥 Lấy tất cả voucher
export const getVouchers = async () => {
  const res = await axios.get(API_URL)
  return res.data
}

// 🔥 Lọc theo trạng thái
export const getVouchersByStatus = async (status) => {
  const res = await axios.get(`${API_URL}/status`, {
    params: { status }
  })
  return res.data
}
