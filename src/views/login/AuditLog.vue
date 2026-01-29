<template>
    <div style="padding: 24px">
        <template v-if="isAdmin">
            <a-card title="Hoạt động gần đây">
                <template #extra>
                    <a-space>
                        <a-input-search v-model:value="searchText" placeholder="Tìm theo nội dung..."
                            style="width: 250px" @search="handleSearch" />
                        <a-button @click="fetchLogs" type="primary" ghost :loading="loading"> Làm mới </a-button>
                    </a-space>
                </template>

                <a-table :dataSource="filteredLogs" :columns="columns" rowKey="id" :loading="loading"
                    :pagination="{ pageSize: 10, showSizeChanger: true }">
                    <template #bodyCell="{ column, record }">
                        <template v-if="column.key === 'timestamp'">
                            {{ formatDate(record.timestamp) }}
                        </template>

                        <template v-else-if="column.key === 'action'">
                            <a-tag :color="getActionColor(record.action)">
                                {{ record.action }}
                            </a-tag>
                        </template>

                        <template v-else-if="column.key === 'performedBy'">
                            <a-tag color="cyan">{{ record.performedBy || 'Hệ thống' }}</a-tag>
                        </template>
                    </template>
                </a-table>
            </a-card>
        </template>

        <template v-else>
            <a-result status="403" title="403" sub-title="Xin lỗi, bạn không có quyền truy cập nhật ký hệ thống.">
                <template #extra>
                    <a-button type="primary" @click="$router.push('/')">Quay lại trang chủ</a-button>
                </template>
            </a-result>
        </template>
    </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import api from '@/api/axios';
import { message } from 'ant-design-vue';
import dayjs from 'dayjs';

const logs = ref([]);
const loading = ref(false);
const searchText = ref('');

/**
 * LOGIC KIỂM TRA QUYỀN ADMIN
 * Lấy từ localStorage mà tao đã fix ở file Login.vue
 */
const userRoles = computed(() => {
    try {
        return JSON.parse(localStorage.getItem('userRoles') || '[]');
    } catch (e) {
        return [];
    }
});
const isAdmin = computed(() => userRoles.value.includes('ADMIN'));

const columns = [
    { title: 'Thời gian', dataIndex: 'timestamp', key: 'timestamp', width: 180 },
    { title: 'Thao tác', dataIndex: 'action', key: 'action', width: 120 },
    { title: 'Đối tượng', dataIndex: 'entityName', key: 'entityName', width: 120 },
    { title: 'Chi tiết hoạt động', dataIndex: 'summary', key: 'summary' },
    { title: 'Người thực hiện', dataIndex: 'performedBy', key: 'performedBy', width: 150 },
    { title: 'IP Address', dataIndex: 'ipAddress', key: 'ipAddress', width: 130 },
];

const fetchLogs = async () => {
    // Nếu không phải Admin thì không gọi API tốn tài nguyên
    if (!isAdmin.value) return;

    loading.value = true;
    try {
        const res = await api.get('/management/logs');
        logs.value = res.data;
    } catch (err) {
        console.error("Log error details:", err.response);
        if (err.response?.status === 403) {
            message.error('Phiên đăng nhập hết hạn hoặc bạn không có quyền Admin!');
        } else {
            message.error('Lỗi server: Không thể tải danh sách nhật ký.');
        }
    } finally {
        loading.value = false;
    }
};

const handleSearch = () => {
    // Logic tìm kiếm đã nằm trong computed 'filteredLogs'
};

const filteredLogs = computed(() => {
    if (!searchText.value) return logs.value;
    const s = searchText.value.toLowerCase();
    return logs.value.filter(log =>
        (log.summary?.toLowerCase().includes(s)) ||
        (log.action?.toLowerCase().includes(s)) ||
        (log.performedBy?.toLowerCase().includes(s)) ||
        (log.entityName?.toLowerCase().includes(s))
    );
});

const getActionColor = (action) => {
    switch (action) {
        case 'CREATE': return 'green';
        case 'UPDATE': return 'orange';
        case 'DELETE':
        case 'HARD_DELETE': return 'red';
        case 'LOGIN': return 'cyan';
        case 'UPDATE_PROFILE': return 'purple';
        default: return 'blue';
    }
};

const formatDate = (date) => (date ? dayjs(date).format('DD/MM/YYYY HH:mm:ss') : 'N/A');

onMounted(() => {
    if (isAdmin.value) {
        fetchLogs();
    } else {
        message.warning('Truy cập bị từ chối!');
    }
});
</script>