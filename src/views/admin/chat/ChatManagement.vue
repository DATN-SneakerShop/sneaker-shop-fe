<template>
  <div class="chat-admin-page">
    <div class="page-head">
      <div>
        <h2>Tin nhắn khách hàng</h2>
        <p>Quản lý hội thoại, trả lời khách và xử lý yêu cầu hỗ trợ.</p>
      </div>
      <a-space>
        <a-select v-model:value="filters.status" allow-clear placeholder="Trạng thái" style="width: 150px" @change="loadConversations">
          <a-select-option value="OPEN">Đang mở</a-select-option>
          <a-select-option value="PENDING">Chờ trả lời</a-select-option>
          <a-select-option value="RESOLVED">Đã xử lý</a-select-option>
          <a-select-option value="CLOSED">Đã đóng</a-select-option>
        </a-select>
        <a-checkbox v-model:checked="filters.unreadOnly" @change="loadConversations">Chưa đọc</a-checkbox>
        <a-button @click="loadConversations">Làm mới</a-button>
      </a-space>
    </div>

    <div class="chat-admin-grid">
      <aside class="conversation-list">
        <a-input-search
          v-model:value="filters.keyword"
          placeholder="Tìm khách, SĐT, email, nội dung..."
          allow-clear
          @search="loadConversations"
        />

        <a-spin :spinning="loadingConversations">
          <div class="conversation-scroll">
            <button
              v-for="item in conversations"
              :key="item.id"
              type="button"
              class="conversation-card"
              :class="{ active: selectedConversation?.id === item.id }"
              @click="selectConversation(item)"
            >
              <div class="conversation-top">
                <strong>{{ item.customerName || 'Khách hàng' }}</strong>
                <a-badge v-if="item.staffUnreadCount" :count="item.staffUnreadCount" />
              </div>
              <p>{{ item.lastMessage || 'Chưa có tin nhắn' }}</p>
              <div class="conversation-meta">
                <span>{{ statusLabel(item.status) }}</span>
                <span>{{ formatDateTime(item.lastMessageAt || item.updatedAt) }}</span>
              </div>
            </button>

            <a-empty v-if="!conversations.length && !loadingConversations" description="Chưa có cuộc trò chuyện" />
          </div>
        </a-spin>
      </aside>

      <section class="chat-box">
        <template v-if="selectedConversation">
          <header class="chat-box-head">
            <div>
              <h3>{{ selectedConversation.customerName || 'Khách hàng' }}</h3>
              <p>
                {{ selectedConversation.customerPhone || 'Chưa có SĐT' }}
                <span v-if="selectedConversation.customerEmail"> · {{ selectedConversation.customerEmail }}</span>
              </p>
            </div>
            <a-space>
              <a-tag :color="statusColor(selectedConversation.status)">{{ statusLabel(selectedConversation.status) }}</a-tag>
              <a-button size="small" @click="setStatus('RESOLVED')">Đã xử lý</a-button>
              <a-button size="small" danger @click="setStatus('CLOSED')">Đóng</a-button>
            </a-space>
          </header>

          <div ref="messagesRef" class="message-list">
            <a-spin v-if="loadingMessages" />
            <template v-else>
              <div
                v-for="msg in messages"
                :key="msg.id"
                class="message-row"
                :class="{ staff: msg.senderType !== 'CUSTOMER' }"
              >
                <div class="message-bubble">
                  <div class="message-name">{{ msg.senderName || senderLabel(msg.senderType) }}</div>
                  <p v-if="msg.content">{{ msg.content }}</p>
                  <img
                    v-if="msg.imageUrl"
                    :src="resolveChatImageUrl(msg.imageUrl)"
                    alt="Ảnh trong chat"
                    class="message-image"
                  >
                  <span>{{ formatDateTime(msg.createdAt) }}</span>
                </div>
              </div>
              <a-empty v-if="!messages.length" description="Chưa có tin nhắn" />
            </template>
          </div>

          <footer class="reply-box">
            <input ref="fileInputRef" type="file" accept="image/jpeg,image/png,image/webp" hidden @change="handleFileChange">
            <a-button :disabled="sending" @click="fileInputRef?.click()">Gửi ảnh</a-button>
            <a-textarea
              v-model:value="replyText"
              :maxlength="1000"
              :auto-size="{ minRows: 1, maxRows: 4 }"
              placeholder="Nhập phản hồi cho khách..."
              @keydown.enter.exact.prevent="sendReply"
            />
            <a-button type="primary" :loading="sending" :disabled="!replyText.trim()" @click="sendReply">Gửi</a-button>
          </footer>
        </template>

        <a-empty v-else class="empty-chat" description="Chọn một cuộc trò chuyện để trả lời khách hàng" />
      </section>
    </div>
  </div>
</template>

<script setup>
import { nextTick, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { message, Modal } from 'ant-design-vue'
import {
  getAdminChatMessages,
  listAdminChatConversations,
  markAdminChatRead,
  resolveChatImageUrl,
  sendAdminChatImage,
  sendAdminChatMessage,
  updateAdminChatStatus,
} from '@/api/chat'
import { getErrorMessage } from '@/utils/error'

const filters = reactive({ status: undefined, keyword: '', unreadOnly: false })
const conversations = ref([])
const selectedConversation = ref(null)
const messages = ref([])
const replyText = ref('')
const loadingConversations = ref(false)
const loadingMessages = ref(false)
const sending = ref(false)
const messagesRef = ref(null)
const fileInputRef = ref(null)
let pollingId = null

async function loadConversations() {
  loadingConversations.value = true
  try {
    conversations.value = await listAdminChatConversations({
      status: filters.status || undefined,
      keyword: filters.keyword || undefined,
      unreadOnly: filters.unreadOnly || undefined,
    })
    if (selectedConversation.value) {
      const fresh = conversations.value.find((item) => item.id === selectedConversation.value.id)
      if (fresh) selectedConversation.value = fresh
    }
  } catch (error) {
    message.error(getErrorMessage(error, 'Không thể tải danh sách chat'))
  } finally {
    loadingConversations.value = false
  }
}

async function selectConversation(item) {
  selectedConversation.value = item
  await loadMessages()
  startPolling()
}

async function loadMessages() {
  if (!selectedConversation.value?.id) return
  loadingMessages.value = true
  try {
    messages.value = await getAdminChatMessages(selectedConversation.value.id)
    await markAdminChatRead(selectedConversation.value.id).catch(() => {})
    await scrollBottom()
    await loadConversations()
  } catch (error) {
    message.error(getErrorMessage(error, 'Không thể tải tin nhắn'))
  } finally {
    loadingMessages.value = false
  }
}

async function sendReply() {
  const content = replyText.value.trim()
  if (!content || !selectedConversation.value?.id) return
  sending.value = true
  try {
    await sendAdminChatMessage(selectedConversation.value.id, content)
    replyText.value = ''
    await loadMessages()
  } catch (error) {
    message.error(getErrorMessage(error, 'Gửi phản hồi thất bại'))
  } finally {
    sending.value = false
  }
}

function handleFileChange(event) {
  const file = event.target.files?.[0]
  event.target.value = ''
  if (!file || !selectedConversation.value?.id) return
  if (!file.type.startsWith('image/')) {
    message.warning('Chỉ được gửi file ảnh')
    return
  }
  if (file.size > 5 * 1024 * 1024) {
    message.warning('Ảnh chat không được vượt quá 5MB')
    return
  }
  Modal.confirm({
    title: 'Gửi ảnh cho khách?',
    content: file.name,
    okText: 'Gửi ảnh',
    cancelText: 'Hủy',
    async onOk() {
      sending.value = true
      try {
        await sendAdminChatImage(selectedConversation.value.id, file, replyText.value.trim())
        replyText.value = ''
        await loadMessages()
      } catch (error) {
        message.error(getErrorMessage(error, 'Gửi ảnh thất bại'))
      } finally {
        sending.value = false
      }
    },
  })
}

async function setStatus(status) {
  if (!selectedConversation.value?.id) return
  try {
    selectedConversation.value = await updateAdminChatStatus(selectedConversation.value.id, status)
    message.success('Đã cập nhật trạng thái cuộc trò chuyện')
    await loadConversations()
  } catch (error) {
    message.error(getErrorMessage(error, 'Cập nhật trạng thái thất bại'))
  }
}

function startPolling() {
  stopPolling()
  pollingId = window.setInterval(() => {
    loadConversations().catch(() => {})
    if (selectedConversation.value?.id) getAdminChatMessages(selectedConversation.value.id).then((data) => {
      messages.value = data
      scrollBottom()
    }).catch(() => {})
  }, 4000)
}

function stopPolling() {
  if (pollingId) {
    window.clearInterval(pollingId)
    pollingId = null
  }
}

async function scrollBottom() {
  await nextTick()
  if (messagesRef.value) messagesRef.value.scrollTop = messagesRef.value.scrollHeight
}

function formatDateTime(value) {
  if (!value) return ''
  return new Date(value).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })
}

function statusLabel(status) {
  return ({ OPEN: 'Đang mở', PENDING: 'Chờ shop trả lời', RESOLVED: 'Đã xử lý', CLOSED: 'Đã đóng' }[status] || status || 'Không rõ')
}

function statusColor(status) {
  return ({ OPEN: 'blue', PENDING: 'orange', RESOLVED: 'green', CLOSED: 'default' }[status] || 'default')
}

function senderLabel(type) {
  return type === 'CUSTOMER' ? 'Khách hàng' : 'Nhân viên'
}

onMounted(async () => {
  await loadConversations()
  startPolling()
})
onBeforeUnmount(stopPolling)
</script>

<style scoped>
.chat-admin-page { display: flex; flex-direction: column; gap: 18px; }
.page-head { display: flex; justify-content: space-between; gap: 16px; align-items: flex-start; flex-wrap: wrap; }
.page-head h2 { margin: 0; font-size: 24px; font-weight: 800; }
.page-head p { margin: 4px 0 0; color: #64748b; }
.chat-admin-grid { display: grid; grid-template-columns: 360px minmax(0, 1fr); min-height: 650px; border: 1px solid #e5e7eb; border-radius: 20px; overflow: hidden; background: #fff; }
.conversation-list { border-right: 1px solid #e5e7eb; padding: 14px; background: #f8fafc; }
.conversation-scroll { margin-top: 12px; max-height: 600px; overflow: auto; display: flex; flex-direction: column; gap: 10px; }
.conversation-card { width: 100%; text-align: left; border: 1px solid #e5e7eb; background: #fff; border-radius: 16px; padding: 12px; cursor: pointer; transition: .2s; }
.conversation-card:hover, .conversation-card.active { border-color: #1677ff; box-shadow: 0 10px 24px rgba(22,119,255,.12); }
.conversation-top, .conversation-meta { display: flex; justify-content: space-between; gap: 8px; align-items: center; }
.conversation-card p { margin: 7px 0; color: #475569; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.conversation-meta { font-size: 12px; color: #64748b; }
.chat-box { min-width: 0; display: flex; flex-direction: column; background: #fff; }
.chat-box-head { padding: 16px 18px; border-bottom: 1px solid #e5e7eb; display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; }
.chat-box-head h3 { margin: 0; font-weight: 800; }
.chat-box-head p { margin: 4px 0 0; color: #64748b; }
.message-list { flex: 1; height: 520px; overflow: auto; padding: 20px; background: #f8fafc; }
.message-row { display: flex; justify-content: flex-start; margin: 10px 0; }
.message-row.staff { justify-content: flex-end; }
.message-bubble { max-width: 72%; background: #fff; border: 1px solid #e5e7eb; border-radius: 18px; padding: 11px 13px; box-shadow: 0 6px 16px rgba(15,23,42,.05); }
.message-row.staff .message-bubble { background: #111827; color: #fff; border-color: #111827; }
.message-name { font-weight: 800; font-size: 12px; margin-bottom: 4px; opacity: .8; }
.message-bubble p { margin: 0; white-space: pre-wrap; word-break: break-word; }
.message-bubble span { display: block; margin-top: 6px; font-size: 11px; opacity: .65; }
.message-image { display: block; max-width: 260px; max-height: 260px; object-fit: cover; border-radius: 14px; margin-top: 6px; }
.reply-box { border-top: 1px solid #e5e7eb; padding: 14px; display: flex; gap: 10px; align-items: flex-end; }
.reply-box :deep(.ant-input) { border-radius: 14px; }
.empty-chat { margin-top: 220px; }
@media (max-width: 900px) { .chat-admin-grid { grid-template-columns: 1fr; } .conversation-list { border-right: 0; border-bottom: 1px solid #e5e7eb; } }
</style>
