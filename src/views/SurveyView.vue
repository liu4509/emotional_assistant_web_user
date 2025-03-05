<template>
  <a-layout class="survey-container">
    <a-card title="心情测评问卷" :bordered="false">
      <a-alert v-if="!isLoggedIn" type="warning" message="请先登录后参与测评" banner />

      <a-form
        v-else
        :model="formState"
        @finish="handleSubmit"
        :label-col="{ span: 24 }"
        :wrapper-col="{ span: 24 }"
      >
        <a-form-item
          v-for="(question, index) in currentSurvey.questions"
          :key="index"
          :label="question.title"
          :label-col="{ span: 24 }"
          :wrapper-col="{ span: 24 }"
        >
          <a-radio-group
            v-if="question.type === 'radio'"
            v-model:value="formState.answers[index]"
            style="display: flex; flex-direction: column; gap: 8px"
          >
            <a-radio
              v-for="(option, oIndex) in question.options"
              :key="oIndex"
              :value="option.score"
            >
              {{ option.label }}
            </a-radio>
          </a-radio-group>
        </a-form-item>

        <a-form-item :wrapper-col="{ offset: 6 }">
          <a-button type="primary" html-type="submit">提交问卷</a-button>
        </a-form-item>
      </a-form>

      <a-modal v-model:visible="showResult" title="测评结果" :footer="null" width="800px">
        <div class="recommendation-section">
          <a-typography-title :level="4">{{ resultTitle }}</a-typography-title>
          <a-row :gutter="[16, 16]">
            <a-col v-for="(item, index) in recommendations" :key="index" :span="8">
              <a-card hoverable @click="router.push(item.route)">
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
import { ref, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import { message } from 'ant-design-vue'

const router = useRouter()

// 模拟问卷数据（实际应从接口获取）
const currentSurvey = reactive({
  id: 1,
  questions: [
    {
      type: 'radio',
      title: '最近一周内，你感到愉快的时间占比多少？',
      options: [
        { label: '超过80%', score: 5 },
        { label: '50%-80%', score: 4 },
        { label: '30%-50%', score: 3 },
        { label: '低于30%', score: 2 },
        { label: '几乎没有', score: 1 },
      ],
    },
    {
      type: 'radio',
      title: '您现在感觉如何？',
      options: [
        { label: '非常快乐', score: 5 },
        { label: '快乐', score: 4 },
        { label: '一般', score: 3 },
        { label: '悲伤', score: 2 },
        { label: '非常悲伤', score: 1 },
      ],
    },
    {
      type: 'radio',
      title: '您是否感到焦虑或紧张？',
      options: [
        { label: '从不', score: 5 },
        { label: '很少', score: 4 },
        { label: '有时', score: 3 },
        { label: '经常', score: 2 },
        { label: '总是', score: 1 },
      ],
    },
    {
      type: 'radio',
      title: '您现在的心情是平静的还是烦躁的？',
      options: [
        { label: '非常平静', score: 5 },
        { label: '平静', score: 4 },
        { label: '一般', score: 3 },
        { label: '烦躁', score: 2 },
        { label: '非常烦躁', score: 1 },
      ],
    },
    {
      type: 'radio',
      title: '您对未来的态度是乐观的还是悲观的？',
      options: [
        { label: '非常乐观', score: 5 },
        { label: '乐观', score: 4 },
        { label: '中立', score: 3 },
        { label: '悲观', score: 2 },
        { label: '非常悲观', score: 1 },
      ],
    },
    {
      type: 'radio',
      title: '您现在是否有压力感？',
      options: [
        { label: '没有压力', score: 5 },
        { label: '轻微压力', score: 4 },
        { label: '中等压力', score: 3 },
        { label: '较大压力', score: 2 },
        { label: '极大压力', score: 1 },
      ],
    },
  ],
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

const showResult = ref(false)
const totalScore = ref(0)

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
      { title: '咨询问答', route: '/qa', description: '解答您的困惑' },
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
  totalScore.value = formState.answers.reduce((sum, score) => sum + score, 0)
  showResult.value = true
  message.success('问卷提交成功！')
}
</script>

<style scoped>
.survey-container {
  padding: 24px;
  max-width: 800px;
  margin: 0 auto;
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
