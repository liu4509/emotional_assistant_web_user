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
        <template v-if="currentChat && currentChat.messages.length > 0">
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
                <p v-else v-html="formatMessage(message.content)"></p>
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

// 模拟API服务
const mockApiService = {
  // 模拟获取历史对话列表
  getChatHistory() {
    return new Promise(resolve => {
      setTimeout(() => {
        resolve([
          { id: '1', title: '我常常感觉到焦虑怎么办', messages: [] },
          { id: '2', title: '我很难控制自己的情绪，经常发脾气怎么办', messages: [] },
          { id: '3', title: '很难对别人敞开心扉，认为别人会嘲笑我的经历', messages: [] },
        ])
      }, 500)
    })
  },

  // 模拟获取对话详情
  getChatDetails(chatId) {
    return new Promise(resolve => {
      setTimeout(() => {
        resolve({
          id: chatId,
          title: chatId === '1' ? '我常常感觉到焦虑怎么办' :
            chatId === '2' ? '我很难控制自己的情绪，经常发脾气怎么办' : '很难对别人敞开心扉，认为别人会嘲笑我的经历',
          messages: mockMessages[chatId] || []
        })
      }, 600)
    })
  },

  // 模拟发送消息到AI
  sendMessageToAI(message, context = []) {
    return new Promise(resolve => {
      setTimeout(() => {
        let response

        // 根据关键词生成情绪健康相关的回复
        if (message.toLowerCase().includes('焦虑') || message.toLowerCase().includes('紧张')) {
          response = "焦虑是一种常见的情绪反应，许多人都会经历。以下是一些可能帮助你缓解焦虑的方法：\n\n1. **深呼吸练习**：慢慢吸气数到4，屏住呼吸数到2，然后慢慢呼气数到6。重复几次可以帮助稳定情绪。\n\n2. **正念冥想**：花几分钟专注于当下，观察自己的呼吸和感受，不加判断。\n\n3. **规律运动**：每天30分钟的温和运动可以减轻焦虑症状。\n\n4. **健康饮食**：减少咖啡因和糖的摄入，增加水果、蔬菜和全谷物的摄入。\n\n5. **充足睡眠**：确保每晚有7-9小时的优质睡眠。\n\n6. **寻求专业帮助**：如果焦虑严重影响你的日常生活，考虑咨询心理医生或治疗师。\n\n记住，处理焦虑是一个过程，找到适合你的方法可能需要时间。你愿意分享是什么具体情况引发你的焦虑吗？"
        } else if (message.toLowerCase().includes('发脾气') || message.toLowerCase().includes('控制情绪') || message.toLowerCase().includes('愤怒')) {
          response = `控制情绪尤其是愤怒情绪确实可能很具挑战性。以下是一些可能对你有帮助的策略：\n\n1. **识别触发因素**：了解什么会引发你的愤怒，提前做好准备。\n\n2. **暂停技术**：当你感到情绪开始上升时，给自己10秒钟的冷静期。深呼吸并数到10。\n\n3. **情绪日记**：记录你的情绪波动，帮助识别模式和触发因素。\n\n4. **练习表达技巧**：学习用"我"为主语的表达方式，例如"我感到沮丧"而不是"你让我沮丧"。\n\n5. **寻求专业帮助**：心理治疗师可以教你认知行为技巧来管理情绪。\n\n6. **规律的自我照顾**：确保充足的睡眠、健康饮食和规律运动，这些都会影响情绪稳定性。\n\n你能否分享一下最近一次你难以控制情绪的具体情况？`
        } else if (message.toLowerCase().includes('敞开心扉') || message.toLowerCase().includes('嘲笑') || message.toLowerCase().includes('社交焦虑')) {
          response = `担心被他人评判或嘲笑是很自然的感受，许多人都经历过这种社交焦虑。这里有一些可能对你有帮助的建议：\n\n1. **从小处开始**：选择一个你信任的人，分享一些较小的、不那么脆弱的事情，逐渐建立舒适感。\n\n2. **寻找安全空间**：考虑加入支持小组或找专业咨询师，这些是练习开放自己的安全环境。\n\n3. **挑战负面想法**：当你想"他们会嘲笑我"时，问自己这种想法的证据是什么，是否有其他可能性。\n\n4. **设立界限**：了解自己愿意分享什么，不愿意分享什么，这是健康的自我保护。\n\n5. **自我接纳**：努力接受自己的经历和感受，减少自我评判。\n\n请记住，建立信任和开放自己需要时间，这是一个过程。你有没有具体的经历让你特别担心被他人知道？`
        } else if (message.toLowerCase().includes('抑郁') || message.toLowerCase().includes('沮丧')) {
          response = `感到沮丧或抑郁时，请记住你并不孤单，这些感受是很常见的，也是可以得到帮助的。以下是一些可能有帮助的建议：\n\n1. **寻求专业帮助**：心理治疗师、心理医生可以提供专业支持，包括心理治疗和必要时的药物治疗。\n\n2. **保持联系**：尽管可能感到想要独处，但与朋友、家人保持联系很重要。\n\n3. **设定小目标**：将任务分解成小的、可管理的步骤，完成后给自己肯定。\n\n4. **规律作息**：尝试保持规律的饮食、睡眠和运动习惯。\n\n5. **自我关爱**：做一些你喜欢的事情，给自己一些关心和照顾。\n\n如果你有自伤或自杀的想法，请立即联系心理健康专业人士或拨打心理危机热线。你的感受是重要的，而且情况是可以好转的。你愿意分享更多关于你感受的细节吗？`
        } else if (message.toLowerCase().includes('失眠') || message.toLowerCase().includes('睡不着')) {
          response = `睡眠问题可能与情绪健康密切相关，这里有一些可能帮助改善睡眠的建议：\n\n1. **规律作息**：尽量每天相同时间睡觉和起床，包括周末。\n\n2. **创造舒适环境**：保持卧室安静、黑暗和凉爽。\n\n3. **放松仪式**：睡前进行放松活动，如阅读、温水浴或冥想。\n\n4. **限制屏幕时间**：睡前至少一小时避免使用手机、电脑等电子设备。\n\n5. **注意饮食**：避免睡前摄入咖啡因、酒精和大量食物。\n\n6. **白天活动**：规律运动可以帮助入睡，但避免睡前剧烈运动。\n\n如果失眠问题持续存在并影响日常生活，建议咨询医生或睡眠专家。你的失眠持续多久了？有没有具体的事情让你在夜间难以入睡？`
        } else if (message.toLowerCase().includes('压力') || message.toLowerCase().includes('工作压力') || message.toLowerCase().includes('学习压力')) {
          response = `面对压力是现代生活的常态，但有效的压力管理方法可以帮助你应对：\n\n1. **识别压力源**：了解什么具体情况或事件触发你的压力反应。\n\n2. **时间管理**：使用待办事项列表，将任务分解为小步骤，设定优先级。\n\n3. **设立界限**：学会说"不"，避免过度承诺。\n\n4. **寻求支持**：与朋友、家人或同事分享你的感受和担忧。\n\n5. **健康生活方式**：保持均衡饮食，规律运动，充足睡眠。\n\n6. **放松技巧**：练习深呼吸、渐进式肌肉放松或冥想。\n\n7. **注意工作与生活平衡**：确保有足够的休息和娱乐时间。\n\n适度的压力可以是动力，但长期过度压力可能影响身心健康。你能分享具体是什么导致你现在感到压力吗？`
        } else {
          response = `感谢你分享你的感受。作为一个情绪助手，我在这里倾听和支持你。情绪和心理健康是非常重要的，每个人都有自己独特的经历和感受。无论你经历什么，请记住照顾自己的情绪健康是重要的，有时寻求专业帮助也是自我照顾的一部分。\n\n你可以更具体地告诉我你当前的情绪状态或面临的挑战吗？我可以提供更有针对性的支持和建议。`
        }

        resolve({
          id: Date.now().toString(),
          content: response,
          sender: 'ai',
          timestamp: new Date().toISOString(),
          status: 'done'
        })
      }, 1500) // 增加延迟以显示加载效果
    })
  }
}

// 模拟消息数据
const mockMessages = {
  '1': [
    { id: '101', content: '我常常感觉到焦虑怎么办', sender: 'user', timestamp: '2023-05-10T10:15:00Z', status: 'done' },
    { id: '102', content: '焦虑是一种常见的情绪反应，许多人都会经历。以下是一些可能帮助你缓解焦虑的方法：\n\n1. **深呼吸练习**：慢慢吸气数到4，屏住呼吸数到2，然后慢慢呼气数到6。重复几次可以帮助稳定情绪。\n\n2. **正念冥想**：花几分钟专注于当下，观察自己的呼吸和感受，不加判断。\n\n3. **规律运动**：每天30分钟的温和运动可以减轻焦虑症状。\n\n4. **健康饮食**：减少咖啡因和糖的摄入，增加水果、蔬菜和全谷物的摄入。\n\n5. **充足睡眠**：确保每晚有7-9小时的优质睡眠。\n\n6. **寻求专业帮助**：如果焦虑严重影响你的日常生活，考虑咨询心理医生或治疗师。\n\n记住，处理焦虑是一个过程，找到适合你的方法可能需要时间。你愿意分享是什么具体情况引发你的焦虑吗？这样我可以提供更有针对性的建议。', sender: 'ai', timestamp: '2023-05-10T10:15:30Z', status: 'done' }
  ],
  '2': [
    { id: '201', content: '我很难控制自己的情绪，经常发脾气怎么办', sender: 'user', timestamp: '2023-05-11T09:30:00Z', status: 'done' },
    { id: '202', content: '控制情绪尤其是愤怒情绪确实可能很具挑战性。以下是一些可能对你有帮助的策略：\n\n1. **识别触发因素**：了解什么会引发你的愤怒，提前做好准备。\n\n2. **暂停技术**：当你感到情绪开始上升时，给自己10秒钟的冷静期。深呼吸并数到10。\n\n3. **情绪日记**：记录你的情绪波动，帮助识别模式和触发因素。\n\n4. **练习表达技巧**：学习用"我"为主语的表达方式，例如"我感到沮丧"而不是"你让我沮丧"。\n\n5. **寻求专业帮助**：心理治疗师可以教你认知行为技巧来管理情绪。\n\n6. **规律的自我照顾**：确保充足的睡眠、健康饮食和规律运动，这些都会影响情绪稳定性。\n\n你能否分享一下最近一次你难以控制情绪的具体情况？这样我可以提供更具体的建议。', sender: 'ai', timestamp: '2023-05-11T09:31:00Z', status: 'done' }
  ],
  '3': [
    { id: '301', content: '很难对别人敞开心扉，认为别人会嘲笑我的经历', sender: 'user', timestamp: '2023-05-12T14:25:00Z', status: 'done' },
    { id: '302', content: '担心被他人评判或嘲笑是很自然的感受，许多人都经历过这种社交焦虑。这里有一些可能对你有帮助的建议：\n\n1. **从小处开始**：选择一个你信任的人，分享一些较小的、不那么脆弱的事情，逐渐建立舒适感。\n\n2. **寻找安全空间**：考虑加入支持小组或找专业咨询师，这些是练习开放自己的安全环境。\n\n3. **挑战负面想法**：当你想"他们会嘲笑我"时，问自己这种想法的证据是什么，是否有其他可能性。\n\n4. **设立界限**：了解自己愿意分享什么，不愿意分享什么，这是健康的自我保护。\n\n5. **自我接纳**：努力接受自己的经历和感受，减少自我评判。\n\n请记住，建立信任和开放自己需要时间，这是一个过程。你有没有具体的经历让你特别担心被他人知道？', sender: 'ai', timestamp: '2023-05-12T14:26:30Z', status: 'done' }
  ]
}

export default {
  name: 'DeepseekChat',
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
    const tempChat = ref(null) // 新增：临时对话状态，未发送消息前不保存到历史

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
          const history = await mockApiService.getChatHistory()
          chatHistory.value = history
          isHistoryLoaded.value = true
          saveToCache() // 保存到缓存
        }
      } catch (error) {
        console.error('加载历史对话失败:', error)
      }
    }

    // 加载特定对话详情
    const loadChatDetails = async (chatId) => {
      // 跳过临时对话的加载
      if (chatId === 'temp') return

      try {
        isProcessing.value = true

        // 检查缓存中是否已有该对话的详情数据
        if (historyCache.value[chatId]) {
          // 从缓存中获取对话详情
          const index = chatHistory.value.findIndex(chat => chat.id === chatId)
          if (index !== -1) {
            chatHistory.value[index] = historyCache.value[chatId]
          }
        } else {
          // 从API获取对话详情
          const details = await mockApiService.getChatDetails(chatId)

          // 更新对话详情
          const index = chatHistory.value.findIndex(chat => chat.id === chatId)
          if (index !== -1) {
            chatHistory.value[index] = details

            // 更新缓存
            historyCache.value[chatId] = details
            saveToCache()
          }
        }

        // 滚动到底部
        await nextTick()
        scrollToBottom()
      } catch (error) {
        console.error('加载对话详情失败:', error)
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

        // 添加用户消息
        const userMessage = {
          id: Date.now().toString(),
          content: message,
          sender: 'user',
          timestamp: new Date().toISOString(),
          status: 'done'
        }

        let chatIndex = -1

        // 处理临时对话的情况
        if (currentChatId.value === 'temp' || tempChat.value) {
          // 首次发消息，将临时对话转为正式对话
          const newChatId = Date.now().toString()
          const newChat = {
            ...tempChat.value,
            id: newChatId,
            messages: [...(tempChat.value?.messages || []), userMessage]
          }

          // 添加到历史记录的开头
          chatHistory.value.unshift(newChat)
          currentChatId.value = newChatId
          tempChat.value = null // 清除临时对话

          // 更新缓存
          saveToCache()

          chatIndex = 0 // 新对话肯定在第一位
        } else {
          // 正常历史对话的情况
          // 获取当前对话对象的索引
          chatIndex = chatHistory.value.findIndex(chat => chat.id === currentChatId.value)
          if (chatIndex !== -1) {
            // 添加用户消息
            chatHistory.value[chatIndex].messages.push(userMessage)
          }
        }

        // 清空输入
        userInput.value = ''

        if (chatIndex !== -1) {
          // 添加AI加载中消息
          const loadingMessage = {
            id: `loading-${Date.now()}`,
            content: '',
            sender: 'ai',
            timestamp: new Date().toISOString(),
            status: 'loading'
          }
          chatHistory.value[chatIndex].messages.push(loadingMessage)

          // 滚动到底部
          await nextTick()
          scrollToBottom()

          // 获取当前对话的上下文（最后5条消息）
          const context = chatHistory.value[chatIndex].messages
            .filter(m => m.status === 'done')
            .slice(-5)
            .map(m => ({ role: m.sender === 'user' ? 'user' : 'assistant', content: m.content }))

          // 调用API获取AI响应
          const aiResponse = await mockApiService.sendMessageToAI(message, context)

          // 更新对话标题（如果是新对话）
          if (chatHistory.value[chatIndex].messages.length <= 2) {
            // 截取用户消息的前10个字符作为标题
            chatHistory.value[chatIndex].title = message.length > 10
              ? message.substring(0, 10) + '...'
              : message
          }

          // 替换加载中消息为实际响应
          const loadingIndex = chatHistory.value[chatIndex].messages.findIndex(m => m.id === loadingMessage.id)
          if (loadingIndex !== -1) {
            chatHistory.value[chatIndex].messages.splice(loadingIndex, 1, aiResponse)
          }

          // 更新缓存
          historyCache.value[currentChatId.value] = chatHistory.value[chatIndex]
          saveToCache()

          // 再次滚动到底部
          await nextTick()
          scrollToBottom()
        }
      } catch (error) {
        console.error('发送消息失败:', error)
      } finally {
        isProcessing.value = false
        // 发送完消息后聚焦输入框
        if (inputEl.value) {
          inputEl.value.value = ''
          inputEl.value.focus()
        }
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
    watch(() => currentChat.value?.messages.length, () => {
      nextTick(scrollToBottom)
    })

    // 删除对话
    const deleteChat = (chatId) => {
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
    }

    // 组件挂载后加载历史对话
    onMounted(async () => {
      await loadChatHistory()
      // 如果有历史对话，默认选择第一个
      if (chatHistory.value.length > 0) {
        selectChat(chatHistory.value[0].id)
      } else {
        // 如果没有历史对话，不自动创建新对话，让用户点击"新建对话"按钮
        currentChatId.value = null
        tempChat.value = null
      }
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
      deleteChat
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
</style>
