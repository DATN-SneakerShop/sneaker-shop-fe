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
        <a-form-item label="Tên đăng nhập" name="username"><a-input v-model:value="addForm.username" /></a-form-item>
        <a-form-item label="Họ tên" name="fullName"><a-input v-model:value="addForm.fullName" /></a-form-item>
        <a-form-item label="Email" name="email"><a-input v-model:value="addForm.email" /></a-form-item>
        <a-form-item label="Mật khẩu" name="password"><a-input-password
            v-model:value="addForm.password" /></a-form-item>
        <a-form-item label="Quyền hạn" name="selectedRole">
          <a-radio-group v-model:value="addForm.selectedRole">
            <a-radio value="ADMIN">Admin</a-radio>
            <a-radio value="SALES">Sales</a-radio>
            <a-radio value="INVENTORY">Inventory</a-radio>
            <a-radio value="CUSTOMER">Customer</a-radio>
          </a-radio-group>
        </a-form-item>
      </a-form>
    </a-modal>

    <a-modal v-model:visible="isEditVisible" title="Cập nhật tài khoản" @ok="handleUpdate"
      :confirmLoading="loadingSubmit">
      <a-form :model="editForm" :rules="rules" ref="editFormRef" layout="vertical">
        <a-form-item label="Họ tên" name="fullName"><a-input v-model:value="editForm.fullName" /></a-form-item>
        <a-form-item label="Email" name="email"><a-input v-model:value="editForm.email" /></a-form-item>
        <a-form-item label="Mật khẩu (để trống nếu không đổi)" name="password"><a-input-password
            v-model:value="editForm.password" /></a-form-item>
        <a-form-item label="Quyền hạn" name="selectedRole">
          <a-radio-group v-model:value="editForm.selectedRole">
            <a-radio value="ADMIN">Admin</a-radio>
            <a-radio value="SALES">Sales</a-radio>
            <a-radio value="INVENTORY">Inventory</a-radio>
            <a-radio value="CUSTOMER">Customer</a-radio>
          </a-radio-group>
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, reactive } from 'vue';
import api from '@/api/axios';
import { message } from 'ant-design-vue';

const users = ref([]);
const loading = ref(false);
const loadingSubmit = ref(false);
const isAddVisible = ref(false);
const isEditVisible = ref(false);
const addFormRef = ref(null);
const editFormRef = ref(null);

const userRoles = computed(() => JSON.parse(localStorage.getItem('userRoles') || '[]'));
const isAdmin = computed(() => userRoles.value.includes('ADMIN'));

const addForm = ref({ username: '', fullName: '', email: '', password: '', selectedRole: 'CUSTOMER' });
const editForm = ref({ id: null, fullName: '', email: '', password: '', selectedRole: '' });

const columns = [
  { title: 'Tên đăng nhập', dataIndex: 'username', key: 'username' },
  { title: 'Họ tên', dataIndex: 'fullName', key: 'fullName' },
  { title: 'Email', dataIndex: 'email', key: 'email' },
  { title: 'Quyền hạn', key: 'roles' },
  { title: 'Thao tác', key: 'action' },
];

const filteredColumns = computed(() => isAdmin.value ? columns : columns.filter(c => c.key !== 'action'));

const rules = {
  username: [{ required: true, message: 'Bắt buộc' }],
  fullName: [{ required: true, message: 'Bắt buộc' }],
  email: [{ required: true, type: 'email', message: 'Sai định dạng' }],
  selectedRole: [{ required: true, message: 'Chọn 1 quyền' }]
};

const fetchUsers = async () => {
  loading.value = true;
  try {
    const res = await api.get('/management/users');
    users.value = res.data;
  } catch (err) { message.error('Lỗi tải dữ liệu'); }
  finally { loading.value = false; }
};

const openAddModal = () => {
  addForm.value = { username: '', fullName: '', email: '', password: '', selectedRole: 'CUSTOMER' };
  isAddVisible.value = true;
};

const handleAdd = async () => {
  try {
    await addFormRef.value.validate();
    loadingSubmit.value = true;
    const payload = { ...addForm.value, roleCodes: [addForm.value.selectedRole] };
    await api.post('/management/users', payload);
    message.success('Thêm thành công');
    isAddVisible.value = false;
    fetchUsers();
  } catch (err) { message.error(err.response?.data || 'Thất bại'); }
  finally { loadingSubmit.value = false; }
};

const openEditModal = (record) => {
  editForm.value = {
    id: record.id,
    fullName: record.fullName,
    email: record.email,
    password: '',
    selectedRole: record.roles?.[0]?.code || 'CUSTOMER'
  };
  isEditVisible.value = true;
};

const handleUpdate = async () => {
  try {
    await editFormRef.value.validate();
    loadingSubmit.value = true;
    const payload = { ...editForm.value, roleCodes: [editForm.value.selectedRole] };
    await api.put(`/management/users/${editForm.value.id}`, payload);
    message.success('Cập nhật thành công');
    isEditVisible.value = false;
    fetchUsers();
  } catch (err) { message.error('Thất bại'); }
  finally { loadingSubmit.value = false; }
};

const handleDelete = async (id) => {
  try {
    await api.delete(`/management/users/${id}`);
    message.success('Đã xóa');
    fetchUsers();
  } catch (err) { message.error('Lỗi xóa'); }
};

onMounted(fetchUsers);
</script>