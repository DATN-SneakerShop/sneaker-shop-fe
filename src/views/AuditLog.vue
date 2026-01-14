<template>
    <div style="padding: 24px">
        <a-card title="Hoạt động gần đây">
            <template #extra>
                <a-space>
                    <a-input-search v-model:value="searchText" placeholder="Tìm theo nội dung..." style="width: 250px"
                        @search="handleSearch" />
                    <a-button @click="fetchLogs" type="primary" ghost>
                        Làm mới
                    </a-button>
                </a-space>
            </template>

            <a-table :dataSource="filteredLogs" :columns="columns" rowKey="id" :loading="loading"
                :pagination="{ pageSize: 10, showSizeChanger: false }">

                <template #bodyCell="{ column, record }">
                    <template v-if="column.key === 'action'">
                        <a-tag :color="getActionColor(record.action)">
                            {{ record.action }}
                        </a-tag>
                    </template>

                    <template v-if="column.key === 'entityName'">
                        <span style="font-weight: 500">
                            <user-outlined v-if="record.entityName?.includes('User')" />
                            <file-text-outlined v-else />
                            {{ record.entityName || 'N/A' }}
                        </span>
                    </template>

                    <template v-if="column.key === 'createdAt'">
                        <span style="color: #8c8c8c">{{ formatDate(record.createdAt) }}</span>
                    </template>
                </template>
            </a-table>
        </a-card>
    </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import api from '@/api/axios';
import { message } from 'ant-design-vue';
import { UserOutlined, FileTextOutlined } from '@ant-design/icons-vue';
import dayjs from 'dayjs';

const logs = ref([]);
const loading = ref(false);
const searchText = ref('');

const columns = [
    { title: 'Thời gian', dataIndex: 'createdAt', key: 'createdAt', width: 200, sorter: (a, b) => dayjs(a.createdAt).unix() - dayjs(b.createdAt).unix() },
    { title: 'Thao tác', dataIndex: 'action', key: 'action', width: 120 },
    { title: 'Đối tượng', dataIndex: 'entityName', key: 'entityName', width: 180 },
    { title: 'Chi tiết hoạt động', dataIndex: 'summary', key: 'summary' },
    { title: 'IP Address', dataIndex: 'ipAddress', key: 'ipAddress', width: 150 },
];

const fetchLogs = async () => {
    loading.value = true;
    try {
        const res = await api.get('/management/logs');
        logs.value = res.data;
    } catch (err) {
        message.error('Không thể tải nhật ký hệ thống');
    } finally {
        loading.value = false;
    }
};

const handleSearch = () => {
    console.log("Searching for:", searchText.value);
};

const filteredLogs = computed(() => {
    if (!searchText.value) return logs.value;
    const s = searchText.value.toLowerCase();
    return logs.value.filter(log =>
        (log.summary?.toLowerCase().includes(s)) ||
        (log.action?.toLowerCase().includes(s)) ||
        (log.entityName?.toLowerCase().includes(s))
    );
});

// Đổi từ Badge sang Tag cho giống phong cách hiện đại trong ảnh
const getActionColor = (action) => {
    switch (action) {
        case 'CREATE': return 'green';
        case 'UPDATE': return 'blue';
        case 'DELETE': return 'red';
        default: return 'orange';
    }
};

const formatDate = (date) => (date ? dayjs(date).format('DD/MM/YYYY HH:mm:ss') : 'N/A');

onMounted(fetchLogs);
</script>