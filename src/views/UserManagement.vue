<template>
  <div style="padding: 24px">
    <a-card title="Hệ thống quản trị người dùng">
      <template #extra>
        <a-button type="primary" @click="openAddModal"> + Thêm tài khoản </a-button>
      </template>

      <a-table :dataSource="users" :columns="columns" rowKey="id" :loading="loading">
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
        <a-form-item label="Tên đăng nhập" name="username">
          <a-input v-model:value="addForm.username" placeholder="Ví dụ: nhanvien01" />
        </a-form-item>

        <a-form-item label="Họ và tên" name="fullName">
          <a-input v-model:value="addForm.fullName" placeholder="Nguyễn Văn A" />
        </a-form-item>

        <a-form-item label="Email" name="email">
          <a-input v-model:value="addForm.email" placeholder="example@gmail.com" />
        </a-form-item>

        <a-form-item label="Mật khẩu" name="password">
          <a-input-password v-model:value="addForm.password" placeholder="Tối thiểu 6 ký tự" />
        </a-form-item>

        <a-form-item label="Phân quyền" name="roleCodes">
          <a-checkbox-group v-model:value="addForm.roleCodes" :options="roleOptions" />
        </a-form-item>
      </a-form>
    </a-modal>

    <a-modal v-model:open="isEditVisible" title="Cập nhật thông tin" @ok="handleUpdate" :confirmLoading="loadingSubmit">
      <a-form ref="editFormRef" :model="editForm" :rules="rules" layout="vertical">
        <a-form-item label="Tên đăng nhập (Không thể sửa)">
          <a-input v-model:value="editForm.username" disabled />
        </a-form-item>
        <a-form-item label="Họ và tên" name="fullName"><a-input v-model:value="editForm.fullName" /></a-form-item>
        <a-form-item label="Email" name="email"><a-input v-model:value="editForm.email" /></a-form-item>
        <a-form-item label="Mật khẩu mới (Để trống nếu không đổi)">
          <a-input-password v-model:value="editForm.password" />
        </a-form-item>
        <a-form-item label="Phân quyền" name="roleCodes">
          <a-checkbox-group v-model:value="editForm.roleCodes" :options="roleOptions" />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import api from '@/api/axios';
import { message } from 'ant-design-vue';

const users = ref([]);
const loading = ref(false);
const loadingSubmit = ref(false);
const isAddVisible = ref(false);
const isEditVisible = ref(false);
const addFormRef = ref(null);
const editFormRef = ref(null);

const roleOptions = ['ADMIN', 'SALES', 'INVENTORY'];
const addForm = ref({ username: '', fullName: '', email: '', password: '', roleCodes: [] });
const editForm = ref({ id: null, username: '', fullName: '', email: '', password: '', roleCodes: [] });

// BỘ RULES VALIDATE CHUẨN
const rules = {
  username: [
    { required: true, message: 'Tên đăng nhập là bắt buộc' },
    { min: 3, message: 'Tên đăng nhập phải có ít nhất 3 ký tự' }
  ],
  fullName: [{ required: true, message: 'Họ tên không được để trống' }],
  email: [
    { required: true, message: 'Email không được để trống' },
    { type: 'email', message: 'Email không đúng định dạng!' }
  ],
  password: [
    { required: true, message: 'Mật khẩu là bắt buộc' },
    { min: 6, message: 'Mật khẩu phải từ 6 ký tự trở lên' }
  ],
  roleCodes: [{ required: true, message: 'Vui lòng chọn ít nhất một quyền' }]
};

const columns = [
  { title: 'Tên đăng nhập', dataIndex: 'username', key: 'username' },
  { title: 'Họ tên', dataIndex: 'fullName', key: 'fullName' },
  { title: 'Email', dataIndex: 'email', key: 'email' },
  { title: 'Quyền hạn', key: 'roles' },
  { title: 'Thao tác', key: 'action' },
];

const fetchUsers = async () => {
  loading.value = true;
  try {
    const res = await api.get('/management/users');
    users.value = res.data;
  } catch (err) {
    message.error('Lỗi tải danh sách người dùng');
  } finally {
    loading.value = false;
  }
};

const openAddModal = () => {
  addForm.value = { username: '', fullName: '', email: '', password: '', roleCodes: [] };
  isAddVisible.value = true;
};

const handleAdd = async () => {
  try {
    loading.value = true;
    // Gọi validate của Ant Design trước (nếu bro dùng Form Ref)
    if (addFormRef.value) await addFormRef.value.validate();

    await api.post('/management/users', addForm.value);

    message.success('Thêm người dùng thành công');
    isAddVisible.value = false;
    fetchUsers(); // Load lại bảng
  } catch (err) {
    // Đọc tin nhắn lỗi từ BE (ví dụ: "Tên đăng nhập đã tồn tại!")
    const errorBody = err.response?.data;
    message.error(typeof errorBody === 'string' ? errorBody : "Tên đăng nhập hoặc Email đã tồn tại");
  } finally {
    loading.value = false;
  }
};

const openEditModal = (record) => {
  editForm.value = {
    id: record.id,
    username: record.username,
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

    await api.put(`/management/users/${editForm.value.id}`, editForm.value);
    message.success('Cập nhật thành công');
    isEditVisible.value = false;
    fetchUsers();
  } catch (err) {
    if (err.name === 'ValidationError') return;
    message.error(err.response?.data || 'Cập nhật thất bại');
  } finally {
    loadingSubmit.value = false;
  }
};

const handleDelete = async (id) => {
  try {
    await api.delete(`/management/users/${id}`);
    message.success('Đã xóa người dùng');
    fetchUsers();
  } catch (err) {
    message.error(err.response?.data || 'Không thể xóa');
  }
};

onMounted(fetchUsers);
</script>