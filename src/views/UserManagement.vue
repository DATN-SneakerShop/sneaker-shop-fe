<template>
  <div style="padding: 24px">
    <a-card title="Hệ thống quản trị người dùng">
      <template #extra>
        <a-button v-if="userRole === 'ADMIN'" type="primary" @click="openAddModal"> + Thêm tài khoản </a-button>
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
              <a-popconfirm title="Xác nhận xóa người dùng này?" @confirm="handleDelete(record.id)">
                <a-button type="link" danger>Xóa</a-button>
              </a-popconfirm>
            </a-space>
          </template>
        </template>
      </a-table>
    </a-card>

    <a-modal v-model:open="isAddVisible" title="Tạo người dùng mới" @ok="handleAdd" :confirmLoading="loadingSubmit">
      <a-form ref="addFormRef" :model="addForm" :rules="rules" layout="vertical">
        <a-form-item label="Tên đăng nhập" name="username"><a-input v-model:value="addForm.username" /></a-form-item>
        <a-form-item label="Họ và tên" name="fullName"><a-input v-model:value="addForm.fullName" /></a-form-item>
        <a-form-item label="Email" name="email"><a-input v-model:value="addForm.email" /></a-form-item>
        <a-form-item label="Mật khẩu" name="password"><a-input-password
            v-model:value="addForm.password" /></a-form-item>
        <a-form-item label="Phân quyền" name="roleCodes">
          <a-checkbox-group v-model:value="addForm.roleCodes" :options="['ADMIN', 'SALES', 'INVENTORY']" />
        </a-form-item>
      </a-form>
    </a-modal>

    <a-modal v-model:open="isEditVisible" title="Cập nhật" @ok="handleUpdate" :confirmLoading="loadingSubmit">
      <a-form ref="editFormRef" :model="editForm" :rules="rules" layout="vertical">
        <a-form-item label="Tên đăng nhập"><a-input v-model:value="editForm.username" disabled /></a-form-item>
        <a-form-item label="Họ và tên" name="fullName"><a-input v-model:value="editForm.fullName" /></a-form-item>
        <a-form-item label="Email" name="email"><a-input v-model:value="editForm.email" /></a-form-item>
        <a-form-item label="Mật khẩu mới"><a-input-password v-model:value="editForm.password" /></a-form-item>
        <a-form-item label="Phân quyền" name="roleCodes">
          <a-checkbox-group v-model:value="editForm.roleCodes" :options="['ADMIN', 'SALES', 'INVENTORY']" />
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

const userRole = ref(localStorage.getItem('userRole') || '');

const addForm = ref({ username: '', fullName: '', email: '', password: '', roleCodes: [] });
const editForm = ref({ id: null, username: '', fullName: '', email: '', password: '', roleCodes: [] });

const columns = [
  { title: 'Tên đăng nhập', dataIndex: 'username', key: 'username' },
  { title: 'Họ tên', dataIndex: 'fullName', key: 'fullName' },
  { title: 'Email', dataIndex: 'email', key: 'email' },
  { title: 'Quyền hạn', key: 'roles' },
  { title: 'Thao tác', key: 'action' },
];

const filteredColumns = computed(() => {
  return userRole.value === 'ADMIN' ? columns : columns.filter(c => c.key !== 'action');
});

const rules = {
  username: [{ required: true, message: 'Bắt buộc' }],
  fullName: [{ required: true, message: 'Bắt buộc' }],
  email: [{ required: true, type: 'email', message: 'Sai định dạng' }],
  roleCodes: [{ required: true, message: 'Chọn ít nhất 1 quyền' }]
};

const fetchUsers = async () => {
  loading.value = true;
  try {
    const res = await api.get('/management/users');
    users.value = res.data;
  } catch (err) {
    message.error('Lỗi kết nối server');
  } finally { loading.value = false; }
};

const openAddModal = () => {
  addForm.value = { username: '', fullName: '', email: '', password: '', roleCodes: [] };
  isAddVisible.value = true;
};

const handleAdd = async () => {
  try {
    await addFormRef.value.validate();
    loadingSubmit.value = true;
    await api.post('/management/users', addForm.value);
    message.success('Thêm thành công');
    isAddVisible.value = false;
    fetchUsers();
  } catch (err) { message.error(err.response?.data || 'Lỗi'); }
  finally { loadingSubmit.value = false; }
};

const openEditModal = (record) => {
  editForm.value = {
    id: record.id, username: record.username, fullName: record.fullName,
    email: record.email, password: '',
    roleCodes: record.roles ? record.roles.map(r => r.code) : []
  };
  isEditVisible.value = true;
};

const handleUpdate = async () => {
  try {
    await editFormRef.value.validate();
    loadingSubmit.value = true;
    await api.put(`/management/users/${editForm.value.id}`, editForm.value);
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
  } catch (err) { message.error('Không có quyền'); }
};

onMounted(fetchUsers);
</script>