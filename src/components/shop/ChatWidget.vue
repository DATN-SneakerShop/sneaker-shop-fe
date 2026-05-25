<template>
  <div class="chat-widget">
    <button class="chat-fab" type="button" @click="handleOpen">
      <span class="chat-fab-icon">💬</span>
      <span>Chat với shop</span>
    </button>

    <a-modal
      v-model:open="loginModalOpen"
      title="Đăng nhập để chat với shop"
      ok-text="Đăng nhập ngay"
      cancel-text="Để sau"
      @ok="goLogin"
    >
      <p>Bạn cần đăng nhập tài khoản để nhắn tin, gửi ảnh và xem lịch sử hỗ trợ từ shop.</p>
    </a-modal>

    <section v-if="open" class="chat-panel" aria-label="Chat với shop">
      <header class="chat-header">
        <div>
          <strong>SneakerShop hỗ trợ</strong>
          <p>Shop thường phản hồi trong vài phút</p>
        </div>
        <button type="button" class="chat-close" @click="open = false">×</button>
      </header>

      <div ref="bodyRef" class="chat-body">
        <a-spin v-if="loading" />
        <template v-else>
          <div v-if="!messages.length" class="chat-empty">
            Xin chào 👋 Bạn cần shop tư vấn size, sản phẩm hay đơn hàng nào?
          </div>

          <div
            v-for="msg in messages"
            :key="msg.id"
            class="chat-message"
            :class="{ mine: msg.senderType === 'CUSTOMER' }"
          >
            <div class="bubble">
              <p v-if="msg.content">{{ msg.content }}</p>
              <img
                v-if="msg.imageUrl"
                :src="resolveChatImageUrl(msg.imageUrl)"
                alt="Ảnh trong chat"
                class="chat-image"
              >
              <span class="time">{{ formatTime(msg.createdAt) }}</span>
            </div>
          </div>
        </template>
      </div>

      <footer class="chat-footer">
        <input
          ref="fileInputRef"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          hidden
          @change="handleFileChange"
        >
        <button class="image-btn" type="button" :disabled="sending" @click="fileInputRef?.click()">📎</button>
        <textarea
          v-model="text"
          maxlength="1000"
          placeholder="Nhập tin nhắn..."
          rows="1"
          @keydown.enter.exact.prevent="sendText"
        />
        <button class="send-btn" type="button" :disabled="sending || !text.trim()" @click="sendText">
          Gửi
        </button>
      </footer>
    </section>
  </div>
</template>

<script setup>
import { nextTick, onBeforeUnmount, ref } from 'vue'
import { Modal, message } from 'ant-design-vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import {
  getOrCreateCustomerConversation,
  getCustomerMessages,
  markCustomerChatRead,
  resolveChatImageUrl,
  sendCustomerImage,
  sendCustomerMessage,
} from '@/api/chat'
import { getErrorMessage } from '@/utils/error'

const router = useRouter()
const authStore = useAuthStore()
const open = ref(false)
const loginModalOpen = ref(false)
const loading = ref(false)
const sending = ref(false)
const conversation = ref(null)
const messages = ref([])
const text = ref('')
const bodyRef = ref(null)
const fileInputRef = ref(null)
let pollingId = null

function handleOpen() {
  authStore.restoreSession()
  if (!authStore.isAuthenticated) {
    loginModalOpen.value = true
    return
  }
  open.value = true
  initChat()
}

function goLogin() {
  loginModalOpen.value = false
  router.push('/login')
}

async function initChat() {
  loading.value = true
  try {
    conversation.value = await getOrCreateCustomerConversation()
    await loadMessages()
    startPolling()
  } catch (error) {
    message.error(getErrorMessage(error, 'Không thể mở chat với shop'))
  } finally {
    loading.value = false
  }
}

async function loadMessages() {
  if (!conversation.value?.id) return
  messages.value = await getCustomerMessages(conversation.value.id)
  await markCustomerChatRead(conversation.value.id).catch(() => {})
  await scrollBottom()
}

function startPolling() {
  stopPolling()
  pollingId = window.setInterval(() => {
    if (open.value) loadMessages().catch(() => {})
  }, 4000)
}

function stopPolling() {
  if (pollingId) {
    window.clearInterval(pollingId)
    pollingId = null
  }
}

async function sendText() {
  const content = text.value.trim()
  if (!content || !conversation.value?.id) return
  sending.value = true
  try {
    await sendCustomerMessage(conversation.value.id, content)
    text.value = ''
    await loadMessages()
  } catch (error) {
    message.error(getErrorMessage(error, 'Gửi tin nhắn thất bại'))
  } finally {
    sending.value = false
  }
}

function handleFileChange(event) {
  const file = event.target.files?.[0]
  event.target.value = ''
  if (!file || !conversation.value?.id) return
  if (!file.type.startsWith('image/')) {
    message.warning('Chỉ được gửi file ảnh')
    return
  }
  if (file.size > 5 * 1024 * 1024) {
    message.warning('Ảnh chat không được vượt quá 5MB')
    return
  }
  Modal.confirm({
    title: 'Gửi ảnh này cho shop?',
    content: file.name,
    okText: 'Gửi ảnh',
    cancelText: 'Hủy',
    async onOk() {
      sending.value = true
      try {
        await sendCustomerImage(conversation.value.id, file, text.value.trim())
        text.value = ''
        await loadMessages()
      } catch (error) {
        message.error(getErrorMessage(error, 'Gửi ảnh thất bại'))
      } finally {
        sending.value = false
      }
    },
  })
}

async function scrollBottom() {
  await nextTick()
  if (bodyRef.value) bodyRef.value.scrollTop = bodyRef.value.scrollHeight
}

function formatTime(value) {
  if (!value) return ''
  return new Date(value).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
}

onBeforeUnmount(stopPolling)
</script>

<style scoped>
.chat-widget { position: fixed; right: 22px; bottom: 22px; z-index: 1500; font-family: Inter, sans-serif; }
.chat-fab { border: 0; border-radius: 999px; padding: 13px 18px; background: #111827; color: #fff; display: flex; gap: 8px; align-items: center; font-weight: 800; box-shadow: 0 18px 40px rgba(17,24,39,.25); cursor: pointer; }
.chat-fab:hover { transform: translateY(-2px); }
.chat-fab-icon { font-size: 18px; }
.chat-panel { position: absolute; right: 0; bottom: 62px; width: min(380px, calc(100vw - 32px)); height: 540px; background: #fff; border-radius: 24px; box-shadow: 0 26px 80px rgba(15,23,42,.24); overflow: hidden; display: flex; flex-direction: column; border: 1px solid #e5e7eb; }
.chat-header { padding: 16px 18px; background: linear-gradient(135deg,#111827,#374151); color: #fff; display: flex; justify-content: space-between; align-items: center; }
.chat-header strong { font-size: 16px; }
.chat-header p { margin: 3px 0 0; color: #d1d5db; font-size: 12px; }
.chat-close { border: 0; background: rgba(255,255,255,.14); color: #fff; width: 30px; height: 30px; border-radius: 50%; font-size: 22px; cursor: pointer; }
.chat-body { flex: 1; overflow-y: auto; padding: 16px; background: #f8fafc; }
.chat-empty { padding: 18px; background: #fff; border: 1px dashed #cbd5e1; border-radius: 16px; color: #475569; font-size: 14px; }
.chat-message { display: flex; margin: 9px 0; justify-content: flex-start; }
.chat-message.mine { justify-content: flex-end; }
.bubble { max-width: 78%; border-radius: 18px; padding: 10px 12px; background: #fff; color: #111827; box-shadow: 0 5px 18px rgba(15,23,42,.07); }
.chat-message.mine .bubble { background: #111827; color: #fff; }
.bubble p { margin: 0; white-space: pre-wrap; word-break: break-word; }
.time { display: block; font-size: 11px; opacity: .65; margin-top: 5px; }
.chat-image { display: block; max-width: 220px; max-height: 220px; border-radius: 14px; margin-top: 6px; object-fit: cover; }
.chat-footer { padding: 12px; border-top: 1px solid #e5e7eb; display: flex; gap: 8px; align-items: flex-end; background: #fff; }
.chat-footer textarea { flex: 1; resize: none; min-height: 40px; max-height: 86px; border: 1px solid #d1d5db; border-radius: 14px; padding: 10px 12px; outline: none; }
.image-btn, .send-btn { border: 0; border-radius: 14px; min-height: 40px; padding: 0 13px; cursor: pointer; font-weight: 700; }
.image-btn { background: #f3f4f6; }
.send-btn { background: #ff4500; color: #fff; }
.send-btn:disabled, .image-btn:disabled { opacity: .55; cursor: not-allowed; }
@media (max-width: 520px) { .chat-widget { right: 14px; bottom: 14px; } .chat-panel { height: 70vh; } }
</style>
