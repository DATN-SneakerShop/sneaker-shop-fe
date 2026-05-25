<template>
  <div style="padding: 24px">
    <a-card title="Hệ thống quản trị người dùng">
      <template #extra>
        <a-button v-if="isAdmin" type="primary" @click="openAddModal"> + Thêm tài khoản </a-button>
      </template>

      <a-table :dataSource="users" :columns="filteredColumns" rowKey="id" :loading="loading">
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'roles'">
            <a-tag v-for="role in record.roles" :key="role.id" color="blue">
              {{ role.name }}
            </a-tag>
          </template>
          <template v-if="column.key === 'action'">
            <a-space>
              <a-button
                type="link"
                @click="openEditModal(record)"
                :disabled="record.id === 1"
              >
                Sửa
              </a-button>

              <a-button type="link" style="color: #faad14" @click="openHistoryModal(record)">Lịch sử</a-button>

              <a-button
                type="link"
                danger
                @click="confirmDelete(record)"
                :disabled="record.id === 1"
              >
                Xóa
              </a-button>
            </a-space>
          </template>
        </template>
      </a-table>
    </a-card>

    <a-modal v-model:visible="isAddVisible" title="Thêm tài khoản" @ok="handleAdd" :confirmLoading="loadingSubmit">
      <a-form :model="addForm" :rules="rules" ref="addFormRef" layout="vertical">
        <a-form-item label="Họ tên" name="fullName">
          <a-input v-model:value="addForm.fullName" />
        </a-form-item>
        <a-form-item label="Email" name="email">
          <a-input v-model:value="addForm.email" />
        </a-form-item>
        <a-form-item label="Mật khẩu" name="password">
          <a-input-password v-model:value="addForm.password" />
        </a-form-item>
        <a-form-item label="Quyền" name="roleCodes">
          <a-select v-model:value="addForm.roleCodes" mode="multiple" placeholder="Chọn quyền">
            <a-select-option value="ADMIN">ADMIN</a-select-option>
            <a-select-option value="SALES">SALES</a-select-option>
            <a-select-option value="CUSTOMER">CUSTOMER</a-select-option>
          </a-select>
        </a-form-item>
      </a-form>
    </a-modal>

    <a-modal v-model:visible="isEditVisible" title="Cập nhật tài khoản" @ok="handleUpdate" :confirmLoading="loadingSubmit">
      <a-form :model="editForm" ref="editFormRef" layout="vertical">
        <a-form-item label="Họ tên" name="fullName" :rules="[{ required: true, message: 'Nhập họ tên' }]">
          <a-input v-model:value="editForm.fullName" />
        </a-form-item>
        <a-form-item label="Email" name="email" :rules="[{ required: true, message: 'Nhập email' }]">
          <a-input v-model:value="editForm.email" />
        </a-form-item>
        <a-form-item label="Mật khẩu mới (Để trống nếu không đổi)" name="password">
          <a-input-password v-model:value="editForm.password" />
        </a-form-item>
        <a-form-item label="Quyền" name="roleCodes" :rules="[{ required: true, message: 'Chọn quyền' }]">
          <a-select v-model:value="editForm.roleCodes" mode="multiple">
            <a-select-option value="ADMIN">ADMIN</a-select-option>
            <a-select-option value="SALES">SALES</a-select-option>
            <a-select-option value="CUSTOMER">CUSTOMER</a-select-option>
          </a-select>
        </a-form-item>
      </a-form>
    </a-modal>

    <a-modal v-model:visible="isHistoryVisible" title="Lịch sử hoạt động tài khoản" width="800px" :footer="null">
      <a-table :dataSource="historyLogs" :columns="historyColumns" rowKey="id" :loading="loadingHistory" :pagination="{ pageSize: 5 }">
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'createdAt'">
            {{ formatDate(record.createdAt) }}
          </template>
        </template>
      </a-table>
    </a-modal>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, createVNode } from 'vue';
import { message, Modal } from 'ant-design-vue';
import { getErrorMessage } from '@/utils/error';
import { ExclamationCircleOutlined } from '@ant-design/icons-vue';
import api from '@/api/axios';
import dayjs from 'dayjs';

const users = ref([]);
const loading = ref(false);
const loadingSubmit = ref(false);

const isAddVisible = ref(false);
const isEditVisible = ref(false);
const isHistoryVisible = ref(false);
const historyLogs = ref([]);
const loadingHistory = ref(false);

const addFormRef = ref(null);
const editFormRef = ref(null);

const addForm = ref({ fullName: '', email: '', password: '', roleCodes: [] });
const editForm = ref({ id: null, fullName: '', email: '', password: '', roleCodes: [] });

const rules = {
  fullName: [{ required: true, message: 'Vui lòng nhập họ tên' }],
  email: [{ required: true, message: 'Vui lòng nhập email' }],
  password: [{ required: true, message: 'Vui lòng nhập mật khẩu' }],
  roleCodes: [{ required: true, message: 'Vui lòng chọn ít nhất 1 quyền' }]
};

const isAdmin = computed(() => {
  const roles = JSON.parse(localStorage.getItem('userRoles') || '[]');
  return roles.includes('ADMIN');
});

const columns = [
  { title: 'Họ tên', dataIndex: 'fullName', key: 'fullName' },
  { title: 'Email', dataIndex: 'email', key: 'email' },
  { title: 'Vai trò', key: 'roles' },
  { title: 'Thao tác', key: 'action' }
];

const filteredColumns = computed(() => {
  return isAdmin.value ? columns : columns.filter(c => c.key !== 'action');
});

const historyColumns = [
  { title: 'Thời gian', key: 'createdAt', width: 170 },
  { title: 'Hành động', dataIndex: 'action', width: 150 },
  { title: 'Chi tiết', dataIndex: 'summary' }
];

const fetchUsers = async () => {
  loading.value = true;
  try {
    const res = await api.get('/management/users');
    users.value = res.data;
  } catch (err) {
    message.error('Không thể tải danh sách tài khoản');
  } finally {
    loading.value = false;
  }
};

const openAddModal = () => {
  addForm.value = { fullName: '', email: '', password: '', roleCodes: [] };
  isAddVisible.value = true;
};

const handleAdd = async () => {
  try {
    await addFormRef.value.validate();
    loadingSubmit.value = true;
    const payload = { ...addForm.value, username: addForm.value.email };
    await api.post('/management/users', payload);
    message.success('Thêm thành công');
    isAddVisible.value = false;
    fetchUsers();
  } catch (err) {
    message.error(getErrorMessage(err, 'Thất bại'));
  } finally {
    loadingSubmit.value = false;
  }
};

const openEditModal = (record) => {
  editForm.value = {
    id: record.id,
    fullName: record.fullName,
    email: record.email,
    password: '',
    roleCodes: record.roles ? record.roles.map(r => r.code) : []
  };
  isEditVisible.value = true;
};

const handleUpdate = async () => {
  try {
    await editFormRef.value.validate();
    loadingSubmit.value = true;
    const payload = { ...editForm.value, username: editForm.value.email };
    await api.put(`/management/users/${editForm.value.id}`, payload);
    message.success('Cập nhật thành công');
    isEditVisible.value = false;
    fetchUsers();
  } catch (err) {
    message.error(getErrorMessage(err, 'Thất bại'));
  } finally {
    loadingSubmit.value = false;
  }
};

// YÊU CẦU 4: HÀM HIỂN THỊ MODAL CẢNH BÁO KHI XÓA
const confirmDelete = (record) => {
  Modal.confirm({
    title: 'CẢNH BÁO THAO TÁC NHẠY CẢM!',
    icon: createVNode(ExclamationCircleOutlined),
    content: `Bạn có CHẮC CHẮN muốn xóa tài khoản "${record.fullName}" (${record.email}) không? Hành động này không thể hoàn tác và sẽ được ghi vào nhật ký hệ thống!`,
    okText: 'Xóa vĩnh viễn',
    okType: 'danger',
    cancelText: 'Hủy bỏ',
    onOk() {
      return handleDelete(record.id);
    },
    onCancel() {
      console.log('Đã hủy xóa');
    },
  });
};

const handleDelete = async (id) => {
  try {
    await api.delete(`/management/users/${id}`);
    message.success('Đã xóa tài khoản thành công');
    fetchUsers();
  } catch (err) {
    message.error('Lỗi khi xóa tài khoản');
  }
};

const openHistoryModal = async (record) => {
  isHistoryVisible.value = true;
  loadingHistory.value = true;
  try {
    const res = await api.get('/management/logs');
    historyLogs.value = res.data.filter(log =>
      log.module === 'AUTH' &&
      log.summary && log.summary.includes(record.email)
    );
  } catch (err) {
    message.error('Lỗi khi tải lịch sử');
  } finally {
    loadingHistory.value = false;
  }
};

const formatDate = (date) => (date ? dayjs(date).format('DD/MM/YYYY HH:mm:ss') : 'N/A');

onMounted(() => {
  fetchUsers();
});
</script>
