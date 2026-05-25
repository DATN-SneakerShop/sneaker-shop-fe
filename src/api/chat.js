import api from './axios'

export const CHAT_IMAGE_BASE_URL = 'http://localhost:8080/'

function withImageBase(url) {
  if (!url) return ''
  if (/^https?:\/\//i.test(url)) return url
  return `${CHAT_IMAGE_BASE_URL}${String(url).replace(/^\/+/, '')}`
}

export function resolveChatImageUrl(url) {
  return withImageBase(url)
}

export async function getOrCreateCustomerConversation() {
  const { data } = await api.post('/chat/customer/conversations/current')
  return data
}

export async function getCustomerConversation() {
  const { data } = await api.get('/chat/customer/conversations/current')
  return data
}

export async function getCustomerMessages(conversationId) {
  const { data } = await api.get(`/chat/customer/conversations/${conversationId}/messages`)
  return data || []
}

export async function sendCustomerMessage(conversationId, content) {
  const { data } = await api.post(`/chat/customer/conversations/${conversationId}/messages`, { content })
  return data
}

export async function sendCustomerImage(conversationId, file, content = '') {
  const formData = new FormData()
  formData.append('file', file)
  if (content) formData.append('content', content)
  const { data } = await api.post(`/chat/customer/conversations/${conversationId}/images`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data
}

export async function markCustomerChatRead(conversationId) {
  await api.put(`/chat/customer/conversations/${conversationId}/read`)
}

export async function listAdminChatConversations(params = {}) {
  const { data } = await api.get('/admin/chat/conversations', { params })
  return data || []
}

export async function getAdminChatMessages(conversationId) {
  const { data } = await api.get(`/admin/chat/conversations/${conversationId}/messages`)
  return data || []
}

export async function sendAdminChatMessage(conversationId, content) {
  const { data } = await api.post(`/admin/chat/conversations/${conversationId}/messages`, { content })
  return data
}

export async function sendAdminChatImage(conversationId, file, content = '') {
  const formData = new FormData()
  formData.append('file', file)
  if (content) formData.append('content', content)
  const { data } = await api.post(`/admin/chat/conversations/${conversationId}/images`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data
}

export async function markAdminChatRead(conversationId) {
  await api.put(`/admin/chat/conversations/${conversationId}/read`)
}

export async function updateAdminChatStatus(conversationId, status) {
  const { data } = await api.put(`/admin/chat/conversations/${conversationId}/status`, { status })
  return data
}
