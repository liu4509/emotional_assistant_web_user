<template>
  <a-layout class="survey-container">
    <a-card title="心情测评问卷" :bordered="false">
      <a-alert v-if="!isLoggedIn" type="warning" message="请先登录后参与测评" banner />

      <div v-else-if="isLoading" class="loading-container">
        <a-spin tip="加载问卷中..." />
      </div>

      <div v-else-if="loadError" class="error-container">
        <a-alert type="error" :message="loadError" banner />
        <a-button type="primary" @click="fetchRandomQuestionnaire" style="margin-top: 16px">重试</a-button>
      </div>

      <a-form v-else :model="formState" @finish="handleSubmit" :label-col="{ span: 24 }" :wrapper-col="{ span: 24 }">
        <h3 v-if="currentSurvey.title">{{ currentSurvey.title }}</h3>
        <p v-if="currentSurvey.description" class="survey-description">{{ currentSurvey.description }}</p>

        <a-form-item v-for="(question, index) in currentSurvey.questions" :key="question.id" :label="question.content"
          :name="['answers', index]" :rules="[{ required: true, message: '请选择一个选项' }]">
          <a-radio-group v-model:value="formState.answers[index]"
            style="display: flex; flex-direction: column; gap: 8px">
            <a-radio v-for="option in question.options" :key="option.id" :value="option.score">
              {{ option.content }}
            </a-radio>
          </a-radio-group>
        </a-form-item>

        <a-form-item :wrapper-col="{ span: 24 }" style="text-align: center; margin-top: 24px;">
          <a-button type="primary" html-type="submit" :loading="isSubmitting">提交问卷</a-button>
        </a-form-item>
      </a-form>

      <a-modal v-model:visible="showResult" title="测评结果" :footer="null" width="800px">
        <div class="recommendation-section">
          <a-typography-title :level="4">{{ resultTitle }}</a-typography-title>
          <a-row :gutter="[16, 16]">
            <a-col v-for="(item, index) in recommendations" :key="index" :span="8">
              <a-card hoverable @click="navigateToPage(item.route)">
                <template #actions>
                  <span>立即前往</span>
                </template>
                <a-card-meta :title="item.title" :description="item.description" />
              </a-card>
            </a-col>
          </a-row>
        </div>
      </a-modal>
    </a-card>
  </a-layout>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import { getQuestionnaireRandomId } from '@/api/questionnaire'

const router = useRouter()

// 状态变量
const currentSurvey = reactive({
  id: null,
  title: '',
  description: '',
  questions: [],
  scoreRanges: {
    veryPositive: [21, 25],
    positive: [17, 20],
    neutral: [13, 16],
    negative: [9, 12],
    veryNegative: [5, 8],
  },
})

const formState = reactive({
  answers: [],
})

const isLoading = ref(false)
const isSubmitting = ref(false)
const loadError = ref('')
const showResult = ref(false)
const totalScore = ref(0)

// 请求随机问卷
const fetchRandomQuestionnaire = async () => {
  isLoading.value = true
  loadError.value = ''
  formState.answers = []

  try {
    const response = await getQuestionnaireRandomId()

    if (response.code === 200 && response.data) {
      // 更新问卷数据
      currentSurvey.id = response.data.id
      currentSurvey.title = response.data.title
      currentSurvey.description = response.data.description
      currentSurvey.questions = response.data.questions

      // 初始化答案数组
      formState.answers = new Array(response.data.questions.length).fill(null)
    } else {
      loadError.value = response.message || '获取问卷失败'
    }
  } catch (error) {
    console.error('获取问卷失败:', error)
    loadError.value = '获取问卷失败，请重试'
  } finally {
    isLoading.value = false
  }
}

const resultTitle = computed(() => {
  if (totalScore.value >= 21) return '非常积极 🎉'
  if (totalScore.value >= 17) return '积极 😊'
  if (totalScore.value >= 13) return '中立 😐'
  if (totalScore.value >= 9) return '消极 😟'
  return '非常消极 😭'
})

const recommendations = computed(() => {
  const mapping = {
    veryPositive: [
      { title: '游戏推荐', route: '/games', description: '适合放松的趣味游戏' },
      { title: '旅行攻略', route: '/travel', description: '发现美好目的地' },
    ],
    positive: [
      { title: '心理知识', route: '/articles', description: '了解情绪管理技巧' },
      { title: '旅行攻略', route: '/travel', description: '规划下一段旅程' },
    ],
    neutral: [
      { title: '音乐视频', route: '/media', description: '放松心情的精选内容' },
      { title: '旅行攻略', route: '/travel', description: '探索新体验' },
    ],
    negative: [
      { title: '心理训练', route: '/training', description: '情绪调节练习' },
      { title: '心理知识', route: '/articles', description: '专业指导文章' },
      { title: '旅行攻略', route: '/travel', description: '换个环境调整心情' },
    ],
    veryNegative: [
      { title: '心理辅导', route: '/training', description: '专业调节训练' },
      { title: '咨询问答', route: '/chat', description: '解答您的困惑' },
    ],
  }

  return totalScore.value >= 21
    ? mapping.veryPositive
    : totalScore.value >= 17
      ? mapping.positive
      : totalScore.value >= 13
        ? mapping.neutral
        : totalScore.value >= 9
          ? mapping.negative
          : mapping.veryNegative
})

const isLoggedIn = ref(true) // 实际应连接登录状态

const handleSubmit = () => {
  // 验证所有问题是否都已回答
  if (formState.answers.some(answer => answer === null)) {
    message.warning('请回答所有问题')
    return
  }

  isSubmitting.value = true

  // 计算总分
  totalScore.value = formState.answers.reduce((sum, score) => sum + (score || 0), 0)

  // 模拟提交到服务器的延迟
  setTimeout(() => {
    isSubmitting.value = false
    showResult.value = true
    message.success('问卷提交成功！')
  }, 500)
}

const navigateToPage = (route) => {
  // 根据分数确定情绪状态参数
  let emotionCategory = '';
  if (totalScore.value >= 21) emotionCategory = 'veryPositive';
  else if (totalScore.value >= 17) emotionCategory = 'positive';
  else if (totalScore.value >= 13) emotionCategory = 'neutral';
  else if (totalScore.value >= 9) emotionCategory = 'negative';
  else emotionCategory = 'veryNegative';

  // 携带情绪状态参数跳转到目标页面
  router.push({
    path: route,
    query: { emotion: emotionCategory }
  });
}

// 页面加载时获取随机问卷
onMounted(() => {
  fetchRandomQuestionnaire()
})
</script>

<style scoped>
.survey-container {
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

.survey-description {
  margin-bottom: 24px;
  color: rgba(0, 0, 0, 0.65);
}

.recommendation-section {
  margin-top: 20px;
}

:deep(.ant-card-hoverable) {
  cursor: pointer;
  transition: all 0.3s;
}

:deep(.ant-card-hoverable:hover) {
  transform: translateY(-4px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}
</style>
