<template>
  <a-layout class="training-container">
    <a-card :title="currentScene.title" :bordered="false">
      <div v-if="isLoading" class="loading-container">
        <a-spin tip="加载训练场景中..." />
      </div>

      <div v-else-if="loadError" class="error-container">
        <a-alert type="error" :message="loadError" banner />
        <a-button type="primary" @click="fetchRandomScenario" style="margin-top: 16px">重试</a-button>
      </div>

      <template v-else>
        <a-alert v-if="showRetryAlert" type="warning" message="建议选择更积极的应对方式" banner style="margin-bottom: 16px" />

        <div class="scene-description">
          {{ currentScene.description }}
        </div>

        <div v-if="currentQuestionIndex < currentScene.questions.length">
          <h3 class="question-title">{{ currentQuestion.content }}</h3>

          <a-radio-group v-model:value="selectedOption" vertical style="margin: 24px 0">
            <a-radio v-for="option in currentQuestion.options" :key="option.id" :value="option.id" :class="{
              'best-option': option.is_correct && showBestHint,
              'error-option': isWrongChoice && selectedOption === option.id,
            }">
              {{ option.content }}
            </a-radio>
          </a-radio-group>

          <a-button type="primary" :disabled="!selectedOption" @click="handleAnswer">
            {{ isLastQuestion ? '完成训练' : '下一步' }}
          </a-button>
        </div>

        <a-modal v-model:visible="showResult" title="训练结果" :footer="null" width="800px" @afterClose="handleModalClose">
          <a-typography-title :level="4">
            您的得分：{{ totalScore }} 总分：{{ maxScore }}
          </a-typography-title>
          <div class="result-feedback">
            {{ resultFeedback }}
          </div>
          <a-button type="primary" @click="restartTraining" style="margin-top: 16px">
            重新开始训练
          </a-button>
        </a-modal>
      </template>
    </a-card>
  </a-layout>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { message } from 'ant-design-vue'
import { getRandomScenario } from '@/api/scenario'

// 状态变量
const currentScene = reactive({
  id: null,
  title: '',
  description: '',
  questions: []
})

const isLoading = ref(false)
const loadError = ref('')
const currentQuestionIndex = ref(0)
const selectedOption = ref(null)
const answerHistory = reactive([])
const showBestHint = ref(false)
const showRetryAlert = ref(false)
const retryCount = ref(0)
const showResult = ref(false)

// 计算属性
const currentQuestion = computed(() => {
  if (!currentScene.questions.length || currentQuestionIndex.value >= currentScene.questions.length) {
    return null
  }
  return currentScene.questions[currentQuestionIndex.value]
})

const isLastQuestion = computed(() => {
  return currentQuestionIndex.value === currentScene.questions.length - 1
})

const isWrongChoice = computed(() => {
  if (!selectedOption.value || !currentQuestion.value) return false
  const option = currentQuestion.value.options.find(o => o.id === selectedOption.value)
  return option && !option.is_correct
})

// 请求随机场景
const fetchRandomScenario = async () => {
  isLoading.value = true
  loadError.value = ''

  try {
    const response = await getRandomScenario()

    if (response.code === 200 && response.data) {
      // 更新场景数据
      currentScene.id = response.data.id
      currentScene.title = response.data.title
      currentScene.description = response.data.description

      // 排序问题（如果需要）
      currentScene.questions = response.data.questions.sort((a, b) => a.order - b.order)

      // 重置状态
      currentQuestionIndex.value = 0
      selectedOption.value = null
      answerHistory.splice(0)
      showBestHint.value = false
      showRetryAlert.value = false
      retryCount.value = 0
    } else {
      loadError.value = response.message || '获取训练场景失败'
    }
  } catch (error) {
    console.error('获取训练场景失败:', error)
    loadError.value = '获取训练场景失败，请重试'
  } finally {
    isLoading.value = false
  }
}

const handleAnswer = () => {
  if (!currentQuestion.value) return

  const option = currentQuestion.value.options.find(o => o.id === selectedOption.value)
  if (!option) return

  if (!option.is_correct && retryCount.value === 0) {
    showBestHint.value = true
    showRetryAlert.value = true
    retryCount.value += 1
    return
  }

  // 记录答案
  answerHistory.push({
    questionId: currentQuestion.value.id,
    optionId: selectedOption.value,
    isCorrect: option.is_correct,
    isRetry: retryCount.value > 0,
  })

  // 如果是最后一个问题，显示结果
  if (isLastQuestion.value) {
    showResult.value = true
  } else {
    // 否则进入下一个问题
    currentQuestionIndex.value += 1
    selectedOption.value = null
    showBestHint.value = false
    showRetryAlert.value = false
    retryCount.value = 0
  }
}

// 评分计算
const maxScore = computed(() => {
  return 100
})

const totalScore = computed(() => {
  if (answerHistory.length === 0 || currentScene.questions.length === 0) return 0

  const correctCount = answerHistory.filter(record => record.isCorrect).length
  // 计算得分比例并换算为100分制，取整数，并确保不超过100分
  return Math.min(100, Math.round((correctCount / currentScene.questions.length) * 100))
})

const resultFeedback = computed(() => {
  const ratio = totalScore.value / maxScore.value
  if (ratio >= 0.8) return '您展现了优秀的情绪调节能力！建议继续保持积极应对方式...'
  if (ratio >= 0.6) return '您的情绪调节能力良好，仍有提升空间...'
  return '建议多练习积极应对策略，以下资源可能对您有帮助...'
})

const restartTraining = () => {
  currentQuestionIndex.value = 0
  selectedOption.value = null
  answerHistory.splice(0)
  showResult.value = false
  showBestHint.value = false
  showRetryAlert.value = false
  retryCount.value = 0
}

const handleModalClose = () => {
  // 调用重置训练状态的方法
  fetchRandomScenario()
}

// 页面加载时获取随机场景
onMounted(() => {
  fetchRandomScenario()
})
</script>

<style scoped>
.training-container {
  padding: 24px;
  max-width: 800px;
  margin: 0 auto;
}

.loading-container,
.error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 0;
}

.best-option {
  background-color: #f6ffed;
  border: 1px solid #b7eb8f;
  padding: 8px;
  border-radius: 4px;
  margin: 4px 0;
}

.error-option {
  background-color: #fff1f0;
  border: 1px solid #ffa39e;
}

.scene-description {
  margin: 16px 0;
  color: rgba(0, 0, 0, 0.85);
  line-height: 1.6;
}

.question-title {
  font-size: 16px;
  font-weight: 500;
  margin: 20px 0 10px;
}

.result-feedback {
  margin-top: 16px;
  padding: 16px;
  background-color: #fafafa;
  border-radius: 4px;
}
</style>
