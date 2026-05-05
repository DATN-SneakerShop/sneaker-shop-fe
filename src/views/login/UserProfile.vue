<template>
  <div style="padding: 24px">
    <a-card title="Hồ sơ cá nhân" :loading="loading" style="max-width: 600px; margin: 0 auto">
      <a-descriptions bordered :column="1">
        <a-descriptions-item label="Họ và tên">
          <b>{{ user.fullName }}</b>
        </a-descriptions-item>
        <a-descriptions-item label="Email">
          {{ user.email }}
        </a-descriptions-item>
        <a-descriptions-item label="Quyền hạn">
          <template v-if="displayRoles.length">
            <a-tag v-for="role in displayRoles" :key="role" color="blue">
              {{ role }}
            </a-tag>
          </template>
          <a-tag v-else color="blue">N/A</a-tag>
        </a-descriptions-item>
      </a-descriptions>
    </a-card>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { message } from 'ant-design-vue'

import api from '@/api/axios'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const user = ref(authStore.currentUser || {})
const loading = ref(true)

const displayRoles = computed(() => authStore.userRoles)

const loadProfile = async () => {
  try {
    const res = await api.get('/auth/me')
    authStore.updateCurrentUser(res.data)
    user.value = authStore.currentUser
  } catch {
    message.error('Lỗi tải hồ sơ')
  } finally {
    loading.value = false
  }
}

onMounted(loadProfile)
</script>
