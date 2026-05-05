<template>
  <div class="voucher-create">
    <a-page-header
  :title="isEdit ? 'Chỉnh sửa voucher' : 'Tạo voucher'"
  :sub-title="isEdit ? 'Cập nhật thông tin voucher' : 'Thiết lập thông tin voucher'"
/>

    <a-row :gutter="16">
      <a-col :span="form.isPublic ? 24 : 16">
        <a-card title="Thông tin cơ bản" :bordered="false">
          <div class="template-selection" style="margin-bottom: 24px;">
            <h3 style="margin-bottom: 16px; color: #1890ff; font-weight: bold;">
              <thunderbolt-outlined /> Chọn mẫu thiết lập nhanh:
            </h3>
            <a-row gutter="12">
              <a-col :span="4" v-for="tpl in voucherTemplates" :key="tpl.type">
                <a-card
                  hoverable
                  size="small"
                  :style="selectedTemplate === tpl.type ? 'border: 2px solid #1890ff; background: #e6f7ff' : 'border: 1px solid #f0f0f0'"
                  @click="applyTemplate(tpl)"
                >
                  <div style="text-align: center; padding: 5px 0">
                    <component :is="tpl.icon" style="font-size: 20px; color: #1890ff" />
                    <div style="font-weight: bold; margin-top: 5px; font-size: 12px">{{ tpl.title }}</div>
                    <div style="font-size: 10px; color: #8c8c8c; line-height: 1.2">{{ tpl.desc }}</div>
                  </div>
                </a-card>
              </a-col>
            </a-row>
          </div>

          <a-divider />

          <a-form layout="vertical">
            <a-row :gutter="16">
              <a-col :span="12">
                <a-form-item label="Mã voucher">
                  <a-input v-model:value="form.code" disabled placeholder="Mã tự sinh sau khi lưu" />
                </a-form-item>
              </a-col>

              <a-col :span="12">
                <a-form-item label="Tên voucher" required>
                  <a-input v-model:value="form.name" placeholder="Ví dụ: Voucher Sinh Nhật" />
                </a-form-item>
              </a-col>

              <a-col :span="8">
                <a-form-item label="Loại giảm">
                  <a-select v-model:value="form.type">
                    <a-select-option value="PERCENT">% (Phần trăm)</a-select-option>
                    <a-select-option value="FIXED">VNĐ (Số tiền cố định)</a-select-option>
                  </a-select>
                </a-form-item>
              </a-col>

              <a-col :span="8">
                <a-form-item label="Giá trị giảm">
                  <a-input-number
                    v-model:value="form.value"
                    :min="form.type === 'PERCENT' ? 1 : 1000"
                    :max="form.type === 'PERCENT' ? 100 : 100000000"
                    :formatter="value => formatMoneyInput(value)"
                    :parser="value => value.replace(/\D/g, '')"
                    style="width:100%"
                  />
                </a-form-item>
              </a-col>

              <a-col :span="8" v-if="form.type === 'PERCENT'">
                <a-form-item label="Giảm tối đa">
                  <a-input-number
                    v-model:value="form.maxDiscount"
                    :min="1"
                    :formatter="value => formatMoneyInput(value)"
                    :parser="value => value.replace(/\D/g, '')"
                    style="width:100%"
                    placeholder="Không giới hạn"
                  />
                </a-form-item>
              </a-col>

              <a-col :span="12">
                <a-form-item label="Giá trị đơn tối thiểu">
                  <a-input-number
                    v-model:value="form.minOrderValue"
                    :min="0"
                    :formatter="value => formatMoneyInput(value)"
                    :parser="value => value.replace(/\D/g, '')"
                    style="width:100%"
                  />
                </a-form-item>
              </a-col>

              <a-col :span="12">
                <a-form-item label="Số lượng phát hành">
                  <a-input-number v-model:value="form.quantity" :min="1" style="width:100%" />
                </a-form-item>
              </a-col>

              <a-col :span="24">
                <a-form-item label="Mô tả ưu đãi">
                  <a-textarea v-model:value="form.description" :rows="2" placeholder="Ghi chú điều kiện áp dụng..." />
                </a-form-item>
              </a-col>

              <a-col :span="14">
                <a-form-item label="Thời gian áp dụng" required>
                  <a-range-picker v-model:value="dateRange" style="width:100%" format="DD/MM/YYYY" />
                </a-form-item>
              </a-col>

              <a-col :span="10">
                <a-form-item label="Chế độ hiển thị">
                  <a-radio-group v-model:value="form.isPublic" button-style="solid">
                    <a-radio-button :value="true">Công khai</a-radio-button>
                    <a-radio-button :value="false">Riêng tư</a-radio-button>
                  </a-radio-group>
                </a-form-item>
              </a-col>
            </a-row>

            <a-divider />

            <a-space>
              <a-button @click="goBack">Quay lại</a-button>
              <a-button @click="reset">Làm mới form</a-button>
              <a-button type="primary" @click="submit" size="large">Xác nhận tạo Voucher</a-button>
            </a-space>
          </a-form>
        </a-card>
      </a-col>

      <a-col v-if="!form.isPublic" :span="8">
        <a-card title="Khách hàng mục tiêu" :bodyStyle="{ padding: '12px' }">
          <a-input-search
            v-model:value="customerFilter"
            placeholder="Tìm tên, email..."
            style="margin-bottom: 12px"
            allow-clear
          />

          <a-table
  size="small"
  :data-source="filteredCustomers"
  :pagination="{ pageSize: 7, size: 'small' }"
  row-key="id"
  :row-selection="rowSelection"
  bordered
  :scroll="{ x: 800 }"
>
  <a-table-column title="Khách hàng" fixed="left" width="160px">
    <template #default="{ record }">
      <div style="font-weight: bold">{{ record.ten }}</div>
      <div style="font-size: 11px; color: #8c8c8c">{{ record.email }}</div>
    </template>
  </a-table-column>

  <a-table-column title="Hạng" width="90px" align="center">
    <template #default="{ record }">
      <a-tag :color="record.loaiKhach === 'VIP' ? 'gold' : 'blue'">
        {{ record.loaiKhach }}
      </a-tag>
    </template>
  </a-table-column>

  <a-table-column title="Ngày sinh" width="100px">
    <template #default="{ record }">
      {{ formatDate(record.ngaySinh) }}
    </template>
  </a-table-column>

  <a-table-column title="Tổng đơn" dataIndex="totalOrders" width="80px" align="center" />

  <a-table-column title="Tổng chi">
    <template #default="{ record }">
      <span style="font-weight: 600; color: #f5222d">
        {{ formatMoney(record.totalSpent) }}
      </span>
    </template>
  </a-table-column>

  <a-table-column title="Ngày lập" width="100px">
    <template #default="{ record }">
      {{ formatDate(record.createdAt) }}
    </template>
  </a-table-column>
</a-table>
          <div style="margin-top: 10px; color: #8c8c8c">
            Đã chọn: <b>{{ selectedCustomerIds.length }}</b> khách hàng
          </div>
        </a-card>
      </a-col>
    </a-row>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import api from '@/api/axios'
import { message } from 'ant-design-vue'
import { useRouter } from 'vue-router'
import { useRoute } from 'vue-router'
import dayjs from 'dayjs'
import {
  UserAddOutlined,
  GiftOutlined,
  CrownOutlined,
  HistoryOutlined,
  ShoppingCartOutlined,
  ThunderboltOutlined
} from '@ant-design/icons-vue'

const router = useRouter()

// --- TRẠNG THÁI DỮ LIỆU ---
const selectedTemplate = ref('')
const customers = ref([])
const selectedCustomerIds = ref([])
const customerFilter = ref('')
const dateRange = ref([])

const form = ref({
  code: '',
  name: '',
  description: '',
  type: 'PERCENT',
  value: 0,
  maxDiscount: null,
  minOrderValue: 0,
  quantity: 1,
  isPublic: true
})

// --- DANH SÁCH MẪU THIẾT LẬP ---
const voucherTemplates = [
  { type: 'FREESHIP', title: 'Free Ship', icon: ThunderboltOutlined, desc: 'Giảm 500k ship' },
  { type: 'NEWBIE', title: 'Khách mới', icon: UserAddOutlined, desc: 'Đăng ký < 7 ngày' },
  { type: 'BIRTHDAY', title: 'Sinh nhật', icon: GiftOutlined, desc: 'Trong tháng này' },
  { type: 'VIP', title: 'Tri ân VIP', icon: CrownOutlined, desc: 'Chi tiêu > 10tr' },
  { type: 'RECALL', title: 'Khách cũ', icon: HistoryOutlined, desc: '30 ngày chưa mua' },
  { type: 'FIRST_ORDER', title: 'Đơn đầu', icon: ShoppingCartOutlined, desc: 'Đăng ký > 7 ngày' }
]

// --- LOGIC APPLY TEMPLATE ---
const applyTemplate = (tpl) => {
  selectedTemplate.value = tpl.type
  const now = new Date()
  form.value.isPublic = false // Chuyển sang riêng tư để hiện bảng khách

  const sevenDaysAgo = new Date(); sevenDaysAgo.setDate(now.getDate() - 7)
  const thirtyDaysAgo = new Date(); thirtyDaysAgo.setDate(now.getDate() - 30)

  switch (tpl.type) {
    case 'FREESHIP':
      form.value.name = `Miễn phí vận chuyển tháng ${now.getMonth() + 1}`
      form.value.type = 'SHIPPING'
      form.value.value = 500000
      form.value.maxDiscount = null
      form.value.minOrderValue = 0
      form.value.quantity = 9999
      form.value.description = 'Giảm tối đa 500k phí ship. Mỗi khách dùng 1 lần.'
      selectedCustomerIds.value = []
      form.value.isPublic = true

      // ĐÃ FIX LỖI ESLINT: Tính ngày cuối tháng trực tiếp bên trong mảng, không khai báo const
      dateRange.value = [
        dayjs(now),
        dayjs(new Date(now.getFullYear(), now.getMonth() + 1, 0))
      ]
      break;
    case 'NEWBIE':
      form.value.name = 'Ưu đãi thành viên mới (Tự động)'
      form.value.type = 'PERCENT'
      form.value.value = 15
      form.value.maxDiscount = 50000
      form.value.minOrderValue = 0
      form.value.quantity = 9999
      form.value.description = 'Dành cho khách hàng mới gia nhập trong vòng 7 ngày.'
      form.value.isPublic = true
      form.value.limitCustomerDays = 7
      selectedCustomerIds.value = []
      dateRange.value = [
        dayjs(now),
        dayjs(now).add(10, 'day')
      ]
      message.success('Đã thiết lập mẫu Khách mới tự động áp dụng trong 7 ngày!')
      break
    case 'BIRTHDAY':
      form.value.name = `Quà tặng sinh nhật tháng ${now.getMonth() + 1}`
      form.value.type = 'PERCENT'
      form.value.value = 20
      form.value.maxDiscount = 200000
      form.value.minOrderValue = 0
      form.value.quantity = 9999
      form.value.description = 'Dành riêng cho khách hàng có sinh nhật trong tháng này.'

      // THIẾT LẬP TỰ ĐỘNG
      form.value.isPublic = true // Để công khai
      form.value.applyBirthdayMonth = true // Bật lọc theo tháng sinh nhật
      selectedCustomerIds.value = [] // Không cần chọn khách thủ công

      // Hạn dùng từ nay đến cuối tháng
      dateRange.value = [
        dayjs(now),
        dayjs(new Date(now.getFullYear(), now.getMonth() + 1, 0))
      ]
      message.success('Đã thiết lập mẫu Sinh nhật tự động áp dụng cho khách có sinh nhật trong tháng!')
      break
    case 'VIP':
      form.value.name = 'Tri ân khách hàng VIP (Tự động)'
      form.value.type = 'FIXED'; form.value.value = 500000; form.value.minOrderValue = 2000000
      form.value.description = 'Dành cho khách hàng thân thiết có tổng chi tiêu trên 10 triệu.'
      form.value.isPublic = true // Công khai để tự động áp dụng
      form.value.minCustomerSpent = 10000000 // Điều kiện: Tổng chi >= 10tr
      selectedCustomerIds.value = []
      dateRange.value = [dayjs(now), dayjs(now).add(10, 'day')] // Hạn 10 ngày
      message.success('Đã thiết lập mẫu VIP tự động áp dụng cho khách chi tiêu > 10tr!')
      break
    case 'RECALL':
      form.value.name = 'Món quà trở lại (Tự động)'
      form.value.type = 'PERCENT'; form.value.value = 25; form.value.maxDiscount = 300000
      form.value.description = 'Dành cho khách hàng đã hơn 30 ngày chưa phát sinh đơn hàng mới.'
      form.value.isPublic = true
      form.value.maxDaysSinceLastOrder = 30 // Điều kiện: Đơn cuối cách đây > 30 ngày
      selectedCustomerIds.value = []
      dateRange.value = [dayjs(now), dayjs(now).add(10, 'day')]
      message.success('Đã thiết lập mẫu Khách cũ tự động áp dụng!')
      break
    case 'FIRST_ORDER':
      form.value.name = 'Ưu đãi đơn hàng đầu tiên (Tự động)'
      form.value.type = 'FIXED'; form.value.value = 100000; form.value.minOrderValue = 300000
      form.value.description = 'Chỉ áp dụng cho khách hàng chưa từng mua hàng tại shop.'
      form.value.isPublic = true
      form.value.isFirstOrderOnly = true // Điều kiện: Số đơn hàng = 0
      selectedCustomerIds.value = []
      dateRange.value = [dayjs(now), dayjs(now).add(10, 'day')]
      message.success('Đã thiết lập mẫu Đơn đầu tự động áp dụng cho khách chưa mua hàng!')
      break
  }

  if (!form.value.isPublic) {
    if (selectedCustomerIds.value.length > 0) {
      message.success(`Đã tự động chọn ${selectedCustomerIds.value.length} khách hàng phù hợp!`)
    } else {
      message.warning('Không có khách hàng nào đạt điều kiện của mẫu này.')
    }
  } else if (tpl.type === 'FREESHIP') {

    message.success('Đã tải mẫu Free Ship công khai cho toàn hệ thống!')
  }
}

// --- UTILS ---
const formatMoneyInput = (val) => val ? val.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',') : ''
const formatMoney = v => v ? v.toLocaleString('vi-VN') + ' đ' : '0 đ'
const formatDate = (date) => date ? new Date(date).toLocaleDateString('vi-VN') : '---'

const goBack = () => router.back()
const reset = () => {
  form.value = { name: '', type: 'PERCENT', value: 0, maxDiscount: null, minOrderValue: 0, quantity: 1, isPublic: true }
  dateRange.value = []; selectedCustomerIds.value = []; selectedTemplate.value = ''
}

const filteredCustomers = computed(() =>
  customers.value.filter(c =>
    (c.ten || '').toLowerCase().includes(customerFilter.value.toLowerCase()) ||
    (c.email || '').toLowerCase().includes(customerFilter.value.toLowerCase())
  )
)

const rowSelection = computed(() => ({
  selectedRowKeys: selectedCustomerIds.value,
  onChange: keys => selectedCustomerIds.value = keys
}))

const submit = async () => {
  try {
    // 1. Kiểm tra ngày tháng
    if (!dateRange.value || dateRange.value.length < 2) {
      return message.error('Vui lòng chọn thời gian áp dụng!');
    }

    // --- THÊM: Kiểm tra nếu Riêng tư mà chưa chọn khách ---
    if (!form.value.isPublic && selectedCustomerIds.value.length === 0) {
      return message.error('Voucher riêng tư cần chọn ít nhất 1 khách hàng!');
    }

    const start = dateRange.value[0];
    const end = dateRange.value[1];

    const payload = {
      ...form.value,
      startDate: start ? start.format('YYYY-MM-DDTHH:mm:ss') : null,
      endDate: end ? end.format('YYYY-MM-DDTHH:mm:ss') : null,
      value: Number(form.value.value),
      maxDiscount: form.value.maxDiscount ? Number(form.value.maxDiscount) : null,
      minOrderValue: Number(form.value.minOrderValue)
    };

    const voucherId = route.query.id;

    if (voucherId) {
      // --- TRƯỜNG HỢP CHỈNH SỬA ---
      await api.put(`/vouchers/${voucherId}`, payload);

      // SỬA LỖI TẠI ĐÂY:
      // Nếu Public thì gửi mảng rỗng [] để xóa khách cũ.
      // Nếu Private thì gửi mảng ID khách hàng đã chọn.
      // Ép sang Number để Java nhận đúng kiểu Long
const customerPayload = form.value.isPublic
  ? []
  : selectedCustomerIds.value.map(id => Number(id));

await api.post(`/vouchers/${voucherId}/customers`, customerPayload);

      message.success('Cập nhật voucher thành công!');
    } else {
      // --- TRƯỜNG HỢP TẠO MỚI ---
      const res = await api.post('/vouchers', payload);

      // Tương tự, nếu là Riêng tư thì mới cần gửi khách hàng
      if (!form.value.isPublic && selectedCustomerIds.value.length > 0) {
        await api.post(`/vouchers/${res.data.id}/customers`, selectedCustomerIds.value);
      }

      message.success('Tạo voucher thành công!');
    }

    reset();
    router.push('/voucher');
  } catch (err) {
    console.error(err);
    message.error('Thao tác thất bại: ' + (err.response?.data?.message || 'Lỗi hệ thống'));
  }
};
const route = useRoute()
const isEdit = computed(() => !!route.query.id)
// --- KHỞI TẠO ---
onMounted(async () => {
  // 1. Load danh sách tất cả khách hàng (để hiện thị bảng)
  try {
    const res = await api.get('/vouchers/customers-list')
    customers.value = res.data
  } catch {
    message.error('Không thể tải danh sách khách hàng')
  }

  // 2. Nếu là Chỉnh sửa: Load chi tiết Voucher và Khách hàng đã gán
  if (isEdit.value) {
    try {
      const res = await api.get(`/vouchers/${route.query.id}`)
      const v = res.data

      form.value = { ...v }
      dateRange.value = [dayjs(v.startDate), dayjs(v.endDate)]

      if (!v.isPublic) {
        // 🔥 SỬA TẠI ĐÂY: Lấy danh sách khách hàng đã gán cho Voucher này
        const custRes = await api.get(`/vouchers/${v.id}/customers`)

        // Đảm bảo ép kiểu về Number để bảng Table nhận diện được RowKey
        selectedCustomerIds.value = custRes.data.map(c => Number(c.id))

        console.log("Danh sách khách đã chọn:", selectedCustomerIds.value)
      }
    } catch (err) {
      console.error(err)
      message.error('Không tìm thấy thông tin voucher')
    }
  }
})
</script>

<style scoped>
.template-selection .ant-card {
  transition: all 0.3s cubic-bezier(0.645, 0.045, 0.355, 1);
  cursor: pointer;
}
.template-selection .ant-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}
.ant-card {
  border-radius: 8px;
}
</style>
