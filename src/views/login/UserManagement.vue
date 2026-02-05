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
              <a-button type="link" @click="openEditModal(record)">Sửa</a-button>
              <a-popconfirm title="Xác nhận xóa?" @confirm="handleDelete(record.id)">
                <a-button type="link" danger>Xóa</a-button>
              </a-popconfirm>
            </a-space>
          </template>
        </template>
      </a-table>
    </a-card>

    <a-modal v-model:visible="isAddVisible" title="Thêm tài khoản" @ok="handleAdd" :confirmLoading="loadingSubmit">
      <a-form :model="addForm" :rules="rules" ref="addFormRef" layout="vertical">
        <a-form-item label="Họ và tên" name="fullName">
          <a-input v-model:value="addForm.fullName" placeholder="Nguyễn Văn A" />
        </a-form-item>
        <a-form-item label="Email" name="email">
          <a-input v-model:value="addForm.email" placeholder="email@example.com" />
        </a-form-item>
        <a-form-item label="Mật khẩu" name="password">
          <a-input-password v-model:value="addForm.password" />
        </a-form-item>

        <a-form-item label="Quyền hạn" name="roleCodes">
          <a-select v-model:value="addForm.roleCodes" mode="multiple" placeholder="Chọn các quyền hạn">
            <a-select-option value="ADMIN">ADMIN</a-select-option>
            <a-select-option value="SALES">SALES</a-select-option>
            <a-select-option value="INVENTORY">INVENTORY</a-select-option>
            <a-select-option value="CUSTOMER">CUSTOMER</a-select-option>
          </a-select>
        </a-form-item>
      </a-form>
    </a-modal>

    <a-modal v-model:visible="isEditVisible" title="Cập nhật tài khoản" @ok="handleUpdate"
      :confirmLoading="loadingSubmit">
      <a-form :model="editForm" :rules="rules" ref="editFormRef" layout="vertical">
        <a-form-item label="Họ và tên" name="fullName">
          <a-input v-model:value="editForm.fullName" />
        </a-form-item>
        <a-form-item label="Email" name="email">
          <a-input v-model:value="editForm.email" />
        </a-form-item>
        <a-form-item label="Mật khẩu mới (để trống nếu không đổi)" name="password">
          <a-input-password v-model:value="editForm.password" />
        </a-form-item>

        <a-form-item label="Quyền hạn" name="roleCodes">
          <a-select v-model:value="editForm.roleCodes" mode="multiple" placeholder="Chọn các quyền hạn">
            <a-select-option value="ADMIN">ADMIN</a-select-option>
            <a-select-option value="SALES">SALES</a-select-option>
            <a-select-option value="INVENTORY">INVENTORY</a-select-option>
            <a-select-option value="CUSTOMER">CUSTOMER</a-select-option>
          </a-select>
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import api from '@/api/axios';
import { message } from 'ant-design-vue';

const users = ref([]);
const loading = ref(false);
const loadingSubmit = ref(false);
const isAddVisible = ref(false);
const isEditVisible = ref(false);
const addFormRef = ref(null);
const editFormRef = ref(null);

const isAdmin = computed(() => {
  const roles = JSON.parse(localStorage.getItem('userRoles') || '[]');
  return roles.includes('ADMIN');
});

// Column: Đã xoá Tên đăng nhập
const filteredColumns = [
  { title: 'Họ và tên', dataIndex: 'fullName', key: 'fullName' },
  { title: 'Email', dataIndex: 'email', key: 'email' },
  { title: 'Quyền hạn', key: 'roles' },
  { title: 'Thao tác', key: 'action', width: 150 }
];

const rules = {
  fullName: [{ required: true, message: 'Vui lòng nhập họ tên' }],
  email: [{ required: true, type: 'email', message: 'Vui lòng nhập email hợp lệ' }],
  roleCodes: [{ required: true, message: 'Vui lòng chọn ít nhất một quyền' }]
};

const addForm = ref({ fullName: '', email: '', password: '', roleCodes: [] });
const editForm = ref({ id: null, fullName: '', email: '', password: '', roleCodes: [] });

const fetchUsers = async () => {
  loading.value = true;
  try {
    const res = await api.get('/management/users');
    users.value = res.data;
  } catch (err) {
    message.error('Không thể tải danh sách');
  } finally {
    loading.value = false;
  }
};

const openAddModal = () => {
  addForm.value = { fullName: '', email: '', password: '', roleCodes: ['CUSTOMER'] };
  isAddVisible.value = true;
};

const handleAdd = async () => {
  try {
    await addFormRef.value.validate();
    loadingSubmit.value = true;
    // Gán email vào username để BE không bị lỗi null
    const payload = { ...addForm.value, username: addForm.value.email };
    await api.post('/management/users', payload);
    message.success('Thêm thành công');
    isAddVisible.value = false;
    fetchUsers();
  } catch (err) {
    message.error(err.response?.data || 'Thất bại');
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
    // Map từ mảng Object Role sang mảng mã code để Select hiển thị đúng
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
    message.error(err.response?.data || 'Thất bại');
  } finally {
    loadingSubmit.value = false;
  }
};

const handleDelete = async (id) => {
  try {
    await api.delete(`/management/users/${id}`);
    message.success('Đã xóa');
    fetchUsers();
  } catch (err) {
    message.error('Lỗi khi xóa');
  }
};

onMounted(fetchUsers);
</script>