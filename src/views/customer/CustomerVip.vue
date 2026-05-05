<template>
    <div style="padding: 24px">
        <a-card title="👑 Danh sách khách hàng VIP">

            <template #extra>
                <span style="font-weight:600; color:#555; display:flex; align-items:center;">
                    Lọc khách VIP theo điểm:
                </span>
                <a-space>

                    <!-- FILTER ĐIỂM -->
                    <a-input-number v-model:value="minPoint" :min="20000" :max="100000" style="width:100px" />

                    <a-input-number v-model:value="maxPoint" :min="20000" :max="100000" style="width:100px" />

                    <a-slider v-model:value="rangePoint" range :min="20000" :max="100000" style="width:200px"
                        @change="handleSliderChange" />

                    <a-button type="primary" @click="openAddModal">
                        + Thêm
                    </a-button>

                    <a-button @click="openAllHistory">
                        📜 Lịch sử VIP
                    </a-button>

                    <a-popconfirm title="Xoá vĩnh viễn toàn bộ data?" @confirm="handleClearData">
                        <a-button danger>♻️ Clear Data</a-button>
                    </a-popconfirm>

                </a-space>
            </template>

            <!-- tổng + khoảng điểm -->
            <div style="margin-bottom:10px">
                Tổng số khách VIP: <b>{{ customers.length }}</b> |
                 Khoảng điểm: <b>{{ minPoint }} - {{ maxPoint }}</b>
            </div>

            <a-table :dataSource="customers" :columns="columns" rowKey="id" :loading="loading">

                <template #bodyCell="{ column, record }">

                    <template v-if="column.key === 'loaiKhach'">
                        <a-tag color="gold">
                            {{ record.loaiKhach }}
                        </a-tag>
                    </template>

                    <template v-if="column.key === 'uuDaiTheoDiem'">
                        <a-tag color="green">
                            {{ record.uuDaiTheoDiem }}%
                        </a-tag>
                    </template>

                    <template v-if="column.key === 'uuDaiTheoNhom'">
                        <a-tag color="blue">
                            {{ record.uuDaiTheoNhom }}%
                        </a-tag>
                    </template>

                    <template v-if="column.key === 'action'">
                        <a-space>
                            <a-button type="link" @click="openEditModal(record)">
                                Sửa
                            </a-button>

                            <a-popconfirm title="Xóa khách hàng?" @confirm="handleDelete(record.id)">
                                <a-button type="link" danger>Xóa</a-button>
                            </a-popconfirm>
                        </a-space>
                    </template>

                </template>
            </a-table>
        </a-card>

        <!-- lịch sử -->
        <a-modal v-model:open="isHistoryVisible" title="📜 Nhật ký biến động VIP" width="900px" :footer="null">
            <a-table :dataSource="historyTimeline" rowKey="id" size="small" bordered :pagination="{ pageSize: 8 }">

                <a-table-column title="Thời gian">
                    <template #default="{ record }">
                        {{ dayjs(record.changedAt).format('DD/MM/YYYY HH:mm') }}
                    </template>
                </a-table-column>

                <a-table-column title="Khách hàng" dataIndex="customerName" />

                <a-table-column title="Nội dung biến động">
                    <template #default="{ record }">

                        <div v-if="record.hasPoint">
                            <a-tag color="orange">ĐIỂM</a-tag>
                            {{ record.oldPoint }} →
                            <b style="color:#1890ff">{{ record.newPoint }}</b>
                        </div>

                        <div v-if="record.hasRank">
                            <a-tag color="purple">HẠNG</a-tag>
                            {{ record.oldRank }} →
                            <b style="color:#722ed1">{{ record.newRank }}</b>
                        </div>

                    </template>
                </a-table-column>

            </a-table>
        </a-modal>

        <!-- modal thêm -->
        <a-modal v-model:open="isAddVisible" title="Thêm khách hàng" @ok="handleAdd" :confirmLoading="loadingSubmit">
            <a-form ref="addFormRef" :model="addForm" :rules="rules" layout="vertical">
                <a-form-item label="Họ tên" name="ten">
                    <a-input v-model:value="addForm.ten" />
                </a-form-item>

                <a-form-item label="Email" name="email">
                    <a-input v-model:value="addForm.email" />
                </a-form-item>

                <a-form-item label="Ngày sinh">
                    <a-date-picker v-model:value="addForm.ngaySinh" style="width:100%" />
                </a-form-item>

                <a-form-item label="Điểm">
                    <a-input-number v-model:value="addForm.diemTichLuy" style="width:100%" />
                </a-form-item>
            </a-form>
        </a-modal>

        <!-- modal sửa -->
        <a-modal v-model:open="isEditVisible" title="Sửa thông tin" @ok="handleUpdate" :confirmLoading="loadingSubmit">
            <a-form ref="editFormRef" :model="editForm" :rules="rules" layout="vertical">
                <a-form-item label="Họ tên" name="ten">
                    <a-input v-model:value="editForm.ten" />
                </a-form-item>

                <a-form-item label="Email" name="email">
                    <a-input v-model:value="editForm.email" />
                </a-form-item>

                <a-form-item label="Ngày sinh">
                    <a-date-picker v-model:value="editForm.ngaySinh" style="width:100%" />
                </a-form-item>

                <a-form-item label="Điểm">
                    <a-input-number v-model:value="editForm.diemTichLuy" style="width:100%" />
                </a-form-item>
            </a-form>
        </a-modal>

    </div>
</template>

<script setup>

import { ref, onMounted, watch } from "vue"
import api from "@/api/axios"
import { message } from "ant-design-vue"
import dayjs from "dayjs"

const columns = [
    { title: "Tên khách hàng", dataIndex: "ten", key: "ten" },
    { title: "Email", dataIndex: "email", key: "email" },
    { title: "Hạng", dataIndex: "loaiKhach", key: "loaiKhach" },
    { title: "Điểm", dataIndex: "diemTichLuy", key: "diemTichLuy" },
    { title: "Ưu đãi điểm", dataIndex: "uuDaiTheoDiem", key: "uuDaiTheoDiem" },
    { title: "Ưu đãi nhóm", dataIndex: "uuDaiTheoNhom", key: "uuDaiTheoNhom" },
    { title: "Thao tác", key: "action" }
]

const customers = ref([])
const loading = ref(false)
const loadingSubmit = ref(false)

const isAddVisible = ref(false)
const isEditVisible = ref(false)
const isHistoryVisible = ref(false)

const historyTimeline = ref([])

const addFormRef = ref(null)
const editFormRef = ref(null)

const minPoint = ref(20000)
const maxPoint = ref(100000)
const rangePoint = ref([20000, 100000])

const addForm = ref({
    ten: "", email: "", ngaySinh: null, diemTichLuy: 0
})

const editForm = ref({
    id: null, ten: "", email: "", ngaySinh: null, diemTichLuy: 0
})

const rules = {
    ten: [{ required: true, message: "Nhập tên" }],
    email: [{ required: true, type: "email", message: "Email không hợp lệ" }]
}

const fetchCustomers = async () => {
    loading.value = true
    try {
        const res = await api.get("/khach-hang/filter", { params: { loaiKhach: "VIP" } })

        customers.value = res.data.filter(c =>
            c.diemTichLuy >= minPoint.value &&
            c.diemTichLuy <= maxPoint.value
        )

    } finally {
        loading.value = false
    }
}

const handleSliderChange = (value) => {
    minPoint.value = value[0]
    maxPoint.value = value[1]
}

watch([minPoint, maxPoint], () => {
    rangePoint.value = [minPoint.value, maxPoint.value]
    fetchCustomers()
})

const handleAdd = async () => {
    try {
        await addFormRef.value.validate()
        loadingSubmit.value = true

        await api.post("/khach-hang", {
            ...addForm.value,
            ngaySinh: addForm.value.ngaySinh
                ? dayjs(addForm.value.ngaySinh).format("YYYY-MM-DD")
                : null
        })

        message.success("Thêm thành công")
        isAddVisible.value = false
        fetchCustomers()

    } catch {
        message.error("Lỗi thêm khách hàng")
    } finally {
        loadingSubmit.value = false
    }
}

const openEditModal = (r) => {
    editForm.value = {
        ...r,
        ngaySinh: r.ngaySinh ? dayjs(r.ngaySinh) : null
    }
    isEditVisible.value = true
}

const handleUpdate = async () => {
    try {
        await editFormRef.value.validate()
        loadingSubmit.value = true

        await api.put(`/khach-hang/${editForm.value.id}`, {
            ...editForm.value,
            ngaySinh: editForm.value.ngaySinh
                ? dayjs(editForm.value.ngaySinh).format("YYYY-MM-DD")
                : null
        })

        message.success("Cập nhật thành công")
        isEditVisible.value = false
        fetchCustomers()

    } catch {
        message.error("Lỗi cập nhật")
    } finally {
        loadingSubmit.value = false
    }
}

const handleClearData = async () => {
    await api.delete("/khach-hang/all")
    message.success("Database đã trống!")
    fetchCustomers()
}

const handleDelete = async (id) => {
    await api.delete(`/khach-hang/${id}`)
    fetchCustomers()
}

const openAllHistory = async () => {
    try {
        const res = await api.get("/khach-hang/history/all")

        const timeline = [
            ...res.data.pointHistory.map(i => ({ ...i, hasPoint: true, hasRank: false })),
            ...res.data.rankHistory.map(i => ({ ...i, hasPoint: false, hasRank: true }))
        ]

        timeline.sort((a, b) => new Date(b.changedAt) - new Date(a.changedAt))

        historyTimeline.value = timeline
        isHistoryVisible.value = true

    } catch {
        message.error("Lỗi tải lịch sử")
    }
}

const openAddModal = () => {
    isAddVisible.value = true
    addForm.value = { ten: "", email: "", ngaySinh: null, diemTichLuy: 0 }
}

onMounted(fetchCustomers)

</script>