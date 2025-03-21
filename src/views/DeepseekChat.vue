<template>
  <div class="deepseek-container">
    <!-- 左侧侧边栏 -->
    <div class="sidebar">
      <div class="sidebar-header">
        <h2>情绪助手 AI Chat</h2>
      </div>
      <div class="sidebar-new-chat">
        <button @click="createNewChat" class="new-chat-btn">
          <span class="plus-icon">+</span> 新建对话
        </button>
      </div>
      <div class="sidebar-history">
        <div v-for="chat in chatHistory" :key="chat.id"
          :class="['history-item', { active: currentChatId === chat.id }]">
          <span class="history-title" @click="selectChat(chat.id)">{{ chat.title }}</span>
          <button class="delete-btn" @click.stop="deleteChat(chat.id)" title="删除对话">
            <span class="delete-icon">×</span>
          </button>
        </div>
      </div>
    </div>

    <!-- 主内容区 -->
    <div class="main-content">
      <!-- 头部 -->
      <div class="main-header">
        <h1>{{ currentChat ? currentChat.title : 'DeepSeek Chat' }}</h1>
      </div>

      <!-- 消息区域 -->
      <div class="messages-container" ref="messagesContainer">
        <template v-if="currentChat && currentChat.messages?.length > 0">
          <transition-group name="message-fade">
            <div v-for="message in currentChat.messages" :key="message.id"
              :class="['message', message.sender === 'ai' ? 'ai-message' : 'user-message']">
              <div class="avatar">{{ message.sender === 'ai' ? 'AI' : 'U' }}</div>
              <div class="message-content">
                <p v-if="message.status === 'loading'" class="typing">
                  <span class="dot"></span>
                  <span class="dot"></span>
                  <span class="dot"></span>
                </p>
                <div v-else class="message-wrapper">
                  <p v-html="formatMessage(message.content)"></p>
                  <div v-if="message.status === 'error'" class="message-error">
                    <a-tooltip title="发送失败，点击重试">
                      <redo-outlined class="retry-icon" @click="retryMessage(message)" />
                    </a-tooltip>
                  </div>
                </div>
              </div>
            </div>
          </transition-group>
        </template>

        <div v-else class="welcome-container">
          <div class="welcome-message">
            <h2>欢迎使用 情绪助手 AI Chat</h2>
            <p>这是一个强大的AI助手，可以帮助您回答问题、排查情绪问题、提供情绪疏导等。</p>

            <div class="suggested-questions">
              <h3>您可以尝试以下问题：</h3>
              <div class="question-list">
                <div v-for="(question, index) in suggestedQuestions" :key="index" class="question-item"
                  @click="sendMessage(question)">
                  {{ question }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 输入区域 -->
      <div class="input-container">
        <div class="input-box">
          <textarea ref="inputEl" v-model="userInput" placeholder="输入您的问题..."
            @keydown.enter.ctrl.prevent="sendMessage(userInput)" :disabled="isProcessing"></textarea>
          <button class="send-button" @click="sendMessage(userInput)" :disabled="!userInput.trim() || isProcessing">
            <span v-if="isProcessing" class="sending-loader"></span>
            <span v-else>发送</span>
          </button>
        </div>
        <div class="input-features">
          <span>支持 Markdown 格式</span>
          <span>·</span>
          <span>Ctrl+Enter 发送</span>
          <span>·</span>
          <span>保留对话上下文</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, nextTick, watch } from 'vue'
import {
  getChatList,
  createChat,
  updateChatTitle,
  deleteChat as deleteChatApi,
  getChatMessages,
  createMessage,
  getAIResponse
} from '@/api/chat'
import { message } from 'ant-design-vue'
import { RedoOutlined } from '@ant-design/icons-vue'

// 模拟API服务保留为备用
const mockApiService = {
  // ... 保留原有的模拟代码，以备不时之需
}

// 模拟消息数据保留为备用
const mockMessages = {
  // ... 保留原有的模拟数据，以备不时之需
}

export default {
  name: 'DeepseekChat',
  components: {
    RedoOutlined
  },
  setup() {
    // 状态管理
    const chatHistory = ref([])
    const currentChatId = ref(null)
    const userInput = ref('')
    const isProcessing = ref(false)
    const messagesContainer = ref(null)
    const inputEl = ref(null)
    const isHistoryLoaded = ref(false) // 历史记录加载状态标记
    const historyCache = ref({}) // 缓存已加载的对话详情
    const tempChat = ref(null) // 临时对话状态，未发送消息前不保存到历史

    // 计算属性
    const currentChat = computed(() => {
      // 如果有临时对话且正在查看临时对话
      if (tempChat.value && (!currentChatId.value || currentChatId.value === 'temp')) {
        return tempChat.value
      }
      // 否则从历史记录中查找
      return chatHistory.value.find(chat => chat.id === currentChatId.value) || null
    })

    // 建议问题
    const suggestedQuestions = [
      "我常常感觉到焦虑怎么办?",
      "很难对别人敞开心扉怎么办?",
      "我对人际关系感到恐惧怎么办?",
      "我很难控制自己的情绪怎么办?"
    ]

    // 从本地存储中获取缓存数据
    const getCachedData = () => {
      try {
        const cachedHistory = localStorage.getItem('chat_history')
        const cachedDetails = localStorage.getItem('chat_details')

        if (cachedHistory) {
          chatHistory.value = JSON.parse(cachedHistory)
          isHistoryLoaded.value = true
        }

        if (cachedDetails) {
          historyCache.value = JSON.parse(cachedDetails)
        }

        return !!cachedHistory
      } catch (error) {
        console.error('读取缓存数据失败:', error)
        return false
      }
    }

    // 将数据保存到本地存储
    const saveToCache = () => {
      try {
        localStorage.setItem('chat_history', JSON.stringify(chatHistory.value))
        localStorage.setItem('chat_details', JSON.stringify(historyCache.value))
      } catch (error) {
        console.error('保存缓存数据失败:', error)
      }
    }

    // 加载历史对话
    const loadChatHistory = async () => {
      // 如果已经加载过历史，则不重复加载
      if (isHistoryLoaded.value) return

      try {
        // 尝试从本地存储加载
        const hasCachedData = getCachedData()

        // 如果没有缓存数据，则从API获取
        if (!hasCachedData) {
          isProcessing.value = true
          const response = await getChatList()
          if (response.code === 200 && response.data) {
            chatHistory.value = response.data
            isHistoryLoaded.value = true
            saveToCache() // 保存到缓存
          } else {
            message.error(response.message || '获取聊天历史失败')
          }
          isProcessing.value = false
        }
      } catch (error) {
        console.error('加载历史对话失败:', error)
        isProcessing.value = false
        message.error('加载历史对话失败')
      }
    }

    // 加载特定对话详情
    const loadChatDetails = async (chatId) => {
      // 跳过临时对话的加载
      if (chatId === 'temp') return

      try {
        isProcessing.value = true

        // 检查缓存中是否已有该对话的详情数据
        if (historyCache.value[chatId] && historyCache.value[chatId].messages) {
          // 从缓存中获取对话详情
          const index = chatHistory.value.findIndex(chat => chat.id === chatId)
          if (index !== -1) {
            chatHistory.value[index] = historyCache.value[chatId]
          }
        } else {
          // 从API获取对话详情(消息列表)
          const response = await getChatMessages(chatId)

          if (response.code === 200 && response.data) {
            // 获取当前对话的基本信息
            const index = chatHistory.value.findIndex(chat => chat.id === chatId)
            if (index !== -1) {
              // 更新对话中的消息列表
              const chatData = { ...chatHistory.value[index], messages: response.data }
              chatHistory.value[index] = chatData

              // 更新缓存
              historyCache.value[chatId] = chatData
              saveToCache()
            }
          } else {
            message.error(response.message || '获取对话消息失败')
          }
        }

        // 滚动到底部
        await nextTick()
        scrollToBottom()
      } catch (error) {
        console.error('加载对话详情失败:', error)
        message.error('加载对话详情失败')
      } finally {
        isProcessing.value = false
      }
    }

    // 选择对话
    const selectChat = (chatId) => {
      if (currentChatId.value === chatId) return

      // 如果当前正在查看临时对话，但没有发送消息，则丢弃临时对话
      if (currentChatId.value === 'temp' && tempChat.value) {
        tempChat.value = null
      }

      currentChatId.value = chatId
      loadChatDetails(chatId)
    }

    // 创建新对话 - 只创建临时状态，不加入历史
    const createNewChat = () => {
      // 创建临时对话，不立即加入历史记录
      tempChat.value = {
        id: 'temp', // 临时ID
        title: '新对话',
        messages: []
      }

      // 设置当前查看的对话为临时对话
      currentChatId.value = 'temp'

      // 聚焦到输入框
      nextTick(() => {
        if (inputEl.value) {
          inputEl.value.focus()
        }
      })
    }

    // 发送消息
    const sendMessage = async (presetMessage) => {
      const message = presetMessage || userInput.value.trim()
      if (!message || isProcessing.value) return

      // 确保有一个当前对话
      if (!currentChatId.value && !tempChat.value) {
        createNewChat()
      }

      try {
        isProcessing.value = true

        // 添加用户消息数据结构
        const userMessage = {
          content: message,
          sender: 'user',
          status: 'done'
        }

        let chatIndex = -1
        let currentChatObj = null

        // 处理临时对话的情况
        if (currentChatId.value === 'temp' || tempChat.value) {
          // 首次发消息，将临时对话转为正式对话
          try {
            // 创建新对话
            const response = await createChat({
              title: message.length > 20 ? message.substring(0, 20) + '...' : message
            })

            if (response.code === 201 && response.data) {
              // 使用服务器返回的新对话数据
              const newChat = {
                ...response.data,
                messages: []
              }

              // 添加到历史记录的开头
              chatHistory.value.unshift(newChat)
              currentChatId.value = newChat.id
              currentChatObj = newChat
              tempChat.value = null // 清除临时对话

              // 更新缓存
              saveToCache()

              chatIndex = 0 // 新对话肯定在第一位
            } else {
              throw new Error(response.message || '创建对话失败')
            }
          } catch (error) {
            console.error('创建新对话失败:', error)
            message.error('创建新对话失败: ' + (error.message || '未知错误'))
            isProcessing.value = false
            return
          }
        } else {
          // 正常历史对话的情况
          // 获取当前对话对象的索引
          chatIndex = chatHistory.value.findIndex(chat => chat.id === currentChatId.value)
          if (chatIndex !== -1) {
            currentChatObj = chatHistory.value[chatIndex]
          } else {
            message.error('对话不存在')
            isProcessing.value = false
            return
          }
        }

        // 清空输入
        userInput.value = ''

        if (chatIndex !== -1 && currentChatObj) {
          try {
            // 先将用户消息临时添加到UI，设置为pending状态
            const pendingUserMsg = {
              id: `pending-${Date.now()}`,
              content: message,
              sender: 'user',
              timestamp: new Date().toISOString(),
              status: 'pending',
              chatId: currentChatObj.id,
              originalContent: message // 保存原始内容用于重发
            }

            if (!chatHistory.value[chatIndex].messages) {
              chatHistory.value[chatIndex].messages = []
            }

            chatHistory.value[chatIndex].messages.push(pendingUserMsg)

            // 滚动到底部
            await nextTick()
            scrollToBottom()

            // 创建用户消息
            const userMsgResponse = await createMessage(currentChatObj.id, {
              content: message,
              sender: 'user'
            })

            if (userMsgResponse.code !== 201 || !userMsgResponse.data) {
              throw new Error(userMsgResponse.message || '发送消息失败')
            }

            // 用服务器返回的消息替换临时消息
            const pendingIndex = chatHistory.value[chatIndex].messages.findIndex(m => m.id === pendingUserMsg.id)
            if (pendingIndex !== -1) {
              chatHistory.value[chatIndex].messages.splice(pendingIndex, 1, userMsgResponse.data)
            }

            // 添加AI加载中消息到界面
            const loadingMessage = {
              id: `loading-${Date.now()}`,
              content: '',
              sender: 'ai',
              timestamp: new Date().toISOString(),
              status: 'loading',
              chatId: currentChatObj.id
            }
            chatHistory.value[chatIndex].messages.push(loadingMessage)

            // 滚动到底部
            await nextTick()
            scrollToBottom()

            try {
              // 获取AI响应，设置超时处理
              const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('请求超时，网络可能不稳定')), 30000)
              )

              const aiResponse = await Promise.race([
                getAIResponse({
                  content: message,
                  chatId: currentChatObj.id
                }),
                timeoutPromise
              ])

              if (aiResponse.code !== 201 || !aiResponse.data) {
                throw new Error(aiResponse.message || '获取AI响应失败')
              }

              // 替换加载中消息为实际响应
              const loadingIndex = chatHistory.value[chatIndex].messages.findIndex(m => m.id === loadingMessage.id)
              if (loadingIndex !== -1) {
                chatHistory.value[chatIndex].messages.splice(loadingIndex, 1, aiResponse.data)
              }
            } catch (error) {
              console.error('AI响应获取失败:', error)

              // 替换加载消息为错误状态
              const loadingIndex = chatHistory.value[chatIndex].messages.findIndex(m => m.id === loadingMessage.id)
              if (loadingIndex !== -1) {
                const errorMsg = {
                  ...loadingMessage,
                  content: '获取回复失败，请稍后重试',
                  status: 'error',
                  error: error.message
                }
                chatHistory.value[chatIndex].messages.splice(loadingIndex, 1, errorMsg)
              }

              message.error('获取AI响应失败: ' + (error.message || '未知错误'))
            }

            // 更新缓存
            historyCache.value[currentChatId.value] = chatHistory.value[chatIndex]
            saveToCache()

            // 再次滚动到底部
            await nextTick()
            scrollToBottom()
          } catch (error) {
            console.error('处理消息失败:', error)

            // 查找之前添加的待处理消息，将其标记为错误状态
            const pendingMsgIndex = chatHistory.value[chatIndex].messages?.findIndex(m => m.status === 'pending')
            if (pendingMsgIndex !== -1) {
              chatHistory.value[chatIndex].messages[pendingMsgIndex].status = 'error'
              chatHistory.value[chatIndex].messages[pendingMsgIndex].error = error.message
            }

            message.error('发送消息失败: ' + (error.message || '未知错误'))

            // 移除加载中消息，如果存在的话
            const loadingIndex = chatHistory.value[chatIndex].messages?.findIndex(m => m.status === 'loading')
            if (loadingIndex !== -1) {
              chatHistory.value[chatIndex].messages.splice(loadingIndex, 1)
            }

            // 更新缓存
            historyCache.value[currentChatId.value] = chatHistory.value[chatIndex]
            saveToCache()
          }
        }
      } catch (error) {
        console.error('发送消息失败:', error)
        message.error('发送消息失败: ' + (error.message || '未知错误'))
      } finally {
        isProcessing.value = false
        // 发送完消息后聚焦输入框
        if (inputEl.value) {
          inputEl.value.focus()
        }
      }
    }

    // 重新发送消息
    const retryMessage = async (failedMessage) => {
      if (isProcessing.value) return

      try {
        isProcessing.value = true

        // 获取当前对话索引
        const chatIndex = chatHistory.value.findIndex(chat => chat.id === currentChatId.value)
        if (chatIndex === -1) {
          throw new Error('对话不存在')
        }

        const currentChatObj = chatHistory.value[chatIndex]

        // 查找失败消息的索引
        const msgIndex = chatHistory.value[chatIndex].messages.findIndex(m => m.id === failedMessage.id)
        if (msgIndex === -1) {
          throw new Error('消息不存在')
        }

        // 如果是用户消息重试
        if (failedMessage.sender === 'user') {
          // 更新状态为处理中
          chatHistory.value[chatIndex].messages[msgIndex].status = 'pending'

          // 尝试重新发送
          const userMsgResponse = await createMessage(currentChatObj.id, {
            content: failedMessage.originalContent || failedMessage.content,
            sender: 'user'
          })

          if (userMsgResponse.code !== 201 || !userMsgResponse.data) {
            throw new Error(userMsgResponse.message || '重新发送消息失败')
          }

          // 替换为服务器返回的消息
          chatHistory.value[chatIndex].messages.splice(msgIndex, 1, userMsgResponse.data)

          // 添加AI加载中消息
          const loadingMessage = {
            id: `loading-${Date.now()}`,
            content: '',
            sender: 'ai',
            timestamp: new Date().toISOString(),
            status: 'loading',
            chatId: currentChatObj.id
          }
          chatHistory.value[chatIndex].messages.push(loadingMessage)

          // 更新UI
          await nextTick()
          scrollToBottom()

          // 获取AI响应
          try {
            const aiResponse = await getAIResponse({
              content: userMsgResponse.data.content,
              chatId: currentChatObj.id
            })

            if (aiResponse.code !== 201 || !aiResponse.data) {
              throw new Error(aiResponse.message || '获取AI响应失败')
            }

            // 替换加载中消息
            const loadingIndex = chatHistory.value[chatIndex].messages.findIndex(m => m.id === loadingMessage.id)
            if (loadingIndex !== -1) {
              chatHistory.value[chatIndex].messages.splice(loadingIndex, 1, aiResponse.data)
            }

            message.success('消息重新发送成功')
          } catch (error) {
            // 处理AI响应失败
            const loadingIndex = chatHistory.value[chatIndex].messages.findIndex(m => m.id === loadingMessage.id)
            if (loadingIndex !== -1) {
              const errorMsg = {
                ...loadingMessage,
                content: '获取回复失败，请稍后重试',
                status: 'error',
                error: error.message
              }
              chatHistory.value[chatIndex].messages.splice(loadingIndex, 1, errorMsg)
            }

            throw error
          }
        }
        // 如果是AI消息重试
        else if (failedMessage.sender === 'ai') {
          // 更新状态为加载中
          const retryingMessage = {
            ...failedMessage,
            content: '',
            status: 'loading'
          }
          chatHistory.value[chatIndex].messages.splice(msgIndex, 1, retryingMessage)

          // 获取上一条用户消息
          let userMessage = null
          for (let i = msgIndex - 1; i >= 0; i--) {
            if (chatHistory.value[chatIndex].messages[i].sender === 'user') {
              userMessage = chatHistory.value[chatIndex].messages[i]
              break
            }
          }

          if (!userMessage) {
            throw new Error('找不到相关的用户消息')
          }

          // 获取AI响应
          const aiResponse = await getAIResponse({
            content: userMessage.content,
            chatId: currentChatObj.id
          })

          if (aiResponse.code !== 201 || !aiResponse.data) {
            throw new Error(aiResponse.message || '获取AI响应失败')
          }

          // 替换消息
          chatHistory.value[chatIndex].messages.splice(msgIndex, 1, aiResponse.data)
          message.success('AI响应已重新获取')
        }

        // 更新缓存
        historyCache.value[currentChatId.value] = chatHistory.value[chatIndex]
        saveToCache()

        // 滚动到底部
        await nextTick()
        scrollToBottom()
      } catch (error) {
        console.error('重试消息失败:', error)
        message.error('重试失败: ' + (error.message || '未知错误'))
      } finally {
        isProcessing.value = false
      }
    }

    // 滚动到底部
    const scrollToBottom = () => {
      if (messagesContainer.value) {
        messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
      }
    }

    // 格式化消息内容（处理简单的markdown）
    const formatMessage = (content) => {
      if (!content) return ''

      // 处理代码块
      let formatted = content.replace(/```(\w*)\n([\s\S]*?)```/g, '<pre class="code-block"><code>$2</code></pre>')

      // 处理行内代码
      formatted = formatted.replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>')

      // 处理换行
      formatted = formatted.replace(/\n/g, '<br>')

      return formatted
    }

    // 监听对话变化，自动滚动到底部
    watch(() => currentChat.value?.messages?.length, () => {
      nextTick(scrollToBottom)
    })

    // 删除对话
    const deleteChat = async (chatId) => {
      try {
        isProcessing.value = true
        const response = await deleteChatApi(chatId)

        if (response.code === 200) {
          // 从历史记录中删除
          const index = chatHistory.value.findIndex(chat => chat.id === chatId)
          if (index !== -1) {
            chatHistory.value.splice(index, 1)
          }

          // 从缓存中删除
          if (historyCache.value[chatId]) {
            delete historyCache.value[chatId]
          }

          // 保存到缓存
          saveToCache()

          // 如果删除的是当前对话，则选择其他对话
          if (currentChatId.value === chatId) {
            if (chatHistory.value.length > 0) {
              // 选择第一个对话
              selectChat(chatHistory.value[0].id)
            } else {
              // 如果没有对话了，清空当前状态
              currentChatId.value = null
              tempChat.value = null
            }
          }

          message.success(response.data || '删除成功')
        } else {
          message.error(response.message || '删除对话失败')
        }
      } catch (error) {
        console.error('删除对话失败:', error)
        message.error('删除对话失败: ' + (error.message || '未知错误'))
      } finally {
        isProcessing.value = false
      }
    }

    // 组件挂载后加载历史对话
    onMounted(async () => {
      await loadChatHistory()
      // 如果有历史对话，默认选择第一个
      // if (chatHistory.value.length > 0) {
      //   selectChat(chatHistory.value[0].id)
      // } else {
      // 如果没有历史对话，自动创建新对话
      createNewChat()
      // }
    })

    return {
      chatHistory,
      currentChatId,
      currentChat,
      userInput,
      isProcessing,
      suggestedQuestions,
      messagesContainer,
      inputEl,
      selectChat,
      createNewChat,
      sendMessage,
      formatMessage,
      getCachedData,
      saveToCache,
      tempChat,
      deleteChat,
      retryMessage
    }
  }
}
</script>

<style scoped>
/* 基础样式 */
.deepseek-container {
  display: flex;
  width: 100%;
  height: 90vh;
  background-color: #f0f2f5;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
}

/* 侧边栏样式 */
.sidebar {
  width: 260px;
  background-color: #1e293b;
  color: white;
  display: flex;
  flex-direction: column;
  height: 100%;
  transition: width 0.3s ease;
}

.sidebar-header {
  padding: 20px;
  border-bottom: 1px solid #2d3748;
  text-align: center;
}

.sidebar-new-chat {
  padding: 16px;
}

.new-chat-btn {
  width: 100%;
  padding: 12px;
  background-color: #3b82f6;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s ease;
}

.new-chat-btn:hover {
  background-color: #2563eb;
}

.plus-icon {
  margin-right: 8px;
  font-size: 1.2em;
}

.sidebar-history {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.history-item {
  padding: 12px 16px;
  margin: 4px 0;
  border-radius: 6px;
  cursor: pointer;
  transition: background-color 0.2s ease;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.history-title {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
}

.delete-btn {
  background: none;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  font-size: 1.2rem;
  line-height: 1;
  padding: 0 4px;
  margin-left: 8px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0.6;
  transition: all 0.2s ease;
}

.delete-btn:hover {
  color: #ef4444;
  opacity: 1;
  background-color: rgba(239, 68, 68, 0.1);
}

.history-item:hover .delete-btn {
  opacity: 1;
}

.history-item:hover {
  background-color: #2d3748;
}

.history-item.active {
  background-color: #2d3748;
}

/* 主内容区样式 */
.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  background-color: white;
  height: 100%;
  transition: margin-left 0.3s ease;
}

.main-header {
  padding: 16px 24px;
  border-bottom: 1px solid #e2e8f0;
  background-color: #f8fafc;
}

/* 消息区域 */
.messages-container {
  flex: 1;
  padding: 24px;
  overflow-y: auto;
  background-color: #f8fafc;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.message {
  display: flex;
  gap: 16px;
  max-width: 100%;
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.message-fade-enter-active,
.message-fade-leave-active {
  transition: opacity 0.5s ease, transform 0.5s ease;
}

.message-fade-enter-from,
.message-fade-leave-to {
  opacity: 0;
  transform: translateY(20px);
}

.avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  font-weight: bold;
}

.ai-message .avatar {
  background-color: #0ea5e9;
  color: white;
}

.user-message .avatar {
  background-color: #8b5cf6;
  color: white;
}

.message-content {
  background-color: #ffffff;
  padding: 16px;
  border-radius: 8px;
  max-width: 80%;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  overflow-x: auto;
}

.ai-message .message-content {
  background-color: #f1f5f9;
}

.user-message .message-content {
  background-color: #e0e7ff;
}

/* 消息内容样式 */
.message-content p {
  margin: 0;
  line-height: 1.6;
}

.code-block {
  background-color: #1e293b;
  color: #e2e8f0;
  padding: 12px;
  border-radius: 6px;
  overflow-x: auto;
  margin: 10px 0;
}

.inline-code {
  background-color: #e2e8f0;
  color: #1e293b;
  padding: 2px 4px;
  border-radius: 4px;
  font-family: monospace;
}

/* 输入区域 */
.input-container {
  padding: 16px 24px;
  border-top: 1px solid #e2e8f0;
  background-color: white;
}

.input-box {
  display: flex;
  gap: 10px;
  margin-bottom: 8px;
}

textarea {
  flex: 1;
  height: 60px;
  padding: 12px;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  resize: none;
  font-family: inherit;
  font-size: 0.95rem;
  transition: border-color 0.2s ease;
}

textarea:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
}

.send-button {
  min-width: 80px;
  padding: 0 20px;
  background-color: #3b82f6;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.send-button:hover:not(:disabled) {
  background-color: #2563eb;
}

.send-button:disabled {
  background-color: #94a3b8;
  cursor: not-allowed;
}

.input-features {
  display: flex;
  gap: 8px;
  color: #64748b;
  font-size: 0.875rem;
}

/* 欢迎界面 */
.welcome-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  text-align: center;
}

.welcome-message {
  max-width: 600px;
  animation: fadeIn 0.8s ease;
}

.welcome-message h2 {
  margin-bottom: 16px;
  color: #0f172a;
}

.welcome-message p {
  color: #64748b;
  margin-bottom: 32px;
}

.suggested-questions {
  margin-top: 32px;
}

.suggested-questions h3 {
  margin-bottom: 16px;
  font-size: 1.1rem;
  color: #334155;
}

.question-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 12px;
}

.question-item {
  padding: 12px 16px;
  background-color: #f1f5f9;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: left;
}

.question-item:hover {
  background-color: #e0e7ff;
  transform: translateY(-2px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

/* 加载动画 */
.typing {
  display: flex;
  align-items: center;
  justify-content: flex-start;
}

.dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: #94a3b8;
  margin-right: 6px;
  animation: typing 1.4s infinite ease-in-out both;
}

.dot:nth-child(1) {
  animation-delay: 0s;
}

.dot:nth-child(2) {
  animation-delay: 0.2s;
}

.dot:nth-child(3) {
  animation-delay: 0.4s;
}

.sending-loader {
  display: inline-block;
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: white;
  animation: spin 1s infinite linear;
}

/* 关键帧动画 */
@keyframes typing {

  0%,
  80%,
  100% {
    transform: scale(0.6);
    opacity: 0.6;
  }

  40% {
    transform: scale(1);
    opacity: 1;
  }
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }

  100% {
    transform: rotate(360deg);
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .deepseek-container {
    flex-direction: column;
  }

  .sidebar {
    width: 100%;
    height: auto;
    max-height: 30vh;
  }

  .main-content {
    height: 70vh;
  }

  .question-list {
    grid-template-columns: 1fr;
  }
}

.message-wrapper {
  position: relative;
  width: 100%;
}

.message-error {
  position: absolute;
  right: -30px;
  top: 0;
}

.retry-icon {
  color: #f5222d;
  font-size: 18px;
  cursor: pointer;
  padding: 4px;
  border-radius: 50%;
  background-color: rgba(245, 34, 45, 0.1);
  transition: all 0.3s;
}

.retry-icon:hover {
  background-color: rgba(245, 34, 45, 0.2);
  transform: scale(1.1);
}
</style>
