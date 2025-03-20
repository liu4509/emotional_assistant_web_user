<template>
  <a-layout class="training-container">
    <a-card :title="currentScene.title" :bordered="false">
      <a-alert
        v-if="showRetryAlert"
        type="warning"
        message="建议选择更积极的应对方式"
        banner
        style="margin-bottom: 16px"
      />

      <div class="scene-description">
        {{ currentScene.description }}
      </div>

      <a-radio-group v-model:value="selectedOption" vertical style="margin: 24px 0">
        <a-radio
          v-for="option in currentScene.options"
          :key="option.id"
          :value="option.id"
          :class="{
            'best-option': option.isBest && showBestHint,
            'error-option': isWrongChoice,
          }"
        >
          {{ option.text }}
        </a-radio>
      </a-radio-group>

      <a-button type="primary" :disabled="!selectedOption" @click="handleAnswer">
        {{ isLastStep ? '完成训练' : '下一步' }}
      </a-button>

      <a-modal v-model:visible="showResult" title="训练结果" :footer="null" width="800px">
        <a-typography-title :level="4">
          您的得分：{{ totalScore }} / {{ maxScore }}
        </a-typography-title>
        <div class="result-feedback">
          {{ resultFeedback }}
        </div>
        <a-button type="primary" @click="restartTraining" style="margin-top: 16px">
          重新开始训练
        </a-button>
      </a-modal>
    </a-card>
  </a-layout>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { message } from 'ant-design-vue'

// 场景数据结构示例
const trainingData = reactive({
  scenes: {
    scene1: {
      id: 'scene1',
      title: '工作汇报压力应对',
      description:
        '假设你正在准备一个重要的工作汇报，但在汇报前，你得知了些可能影响你情绪的负面消息...',
      options: [
        {
          id: 'option1',
          text: '开始焦虑，惶恐难安',
          // TODO: 不使用分值 直接恭喜 该功能在于引导用户正确选项来指导行为
          score: 1,
          isBest: false,
          next: 'scene2',
        },
        {
          id: 'option2',
          text: '立即思考如何应对负面消息',
          score: 3,
          isBest: true,
          next: 'scene2',
        },
      ],
    },
    scene2: {
      id: 'scene2',
      title: '情绪调整策略选择',
      description: '你决定通过哪种方式调整情绪?',
      options: [
        {
          id: 'option3',
          text: '认知改变: 将挑战视为机遇',
          score: 3,
          isBest: true,
          next: 'end',
        },
        {
          id: 'option4',
          text: '情绪低落想要放弃',
          score: 1,
          isBest: false,
          next: 'end',
        },
      ],
    },
  },
  startScene: 'scene1',
})

const currentSceneId = ref(trainingData.startScene)
const selectedOption = ref(null)
const answerHistory = reactive([])
const showBestHint = ref(false)
const showRetryAlert = ref(false)
const retryCount = ref(0)
const showResult = ref(false) // 定义 showResult

const currentScene = computed(() => trainingData.scenes[currentSceneId.value])

const isWrongChoice = computed(() => {
  if (!selectedOption.value) return false
  const option = currentScene.value.options.find((o) => o.id === selectedOption.value)
  return !option.isBest
})

const isLastStep = computed(() => {
  const option = currentScene.value.options.find((o) => o.id === selectedOption.value)
  return option?.next === 'end'
})

const handleAnswer = () => {
  const option = currentScene.value.options.find((o) => o.id === selectedOption.value)

  if (!option.isBest && retryCount.value === 0) {
    showBestHint.value = true
    showRetryAlert.value = true
    retryCount.value += 1
    return
  }

  answerHistory.push({
    sceneId: currentSceneId.value,
    optionId: selectedOption.value,
    score: option.score,
    isRetry: retryCount.value > 0,
  })

  if (option.next === 'end') {
    showResult.value = true
  } else {
    currentSceneId.value = option.next
    selectedOption.value = null
    showBestHint.value = false
    showRetryAlert.value = false
    retryCount.value = 0
  }
}

// 评分计算相关逻辑
const totalScore = computed(() => {
  return answerHistory.reduce((sum, item) => sum + item.score, 0)
})

const maxScore = computed(() => {
  return Object.values(trainingData.scenes).reduce((sum, scene) => {
    return sum + Math.max(...scene.options.map((o) => o.score))
  }, 0)
})

const resultFeedback = computed(() => {
  const ratio = totalScore.value / maxScore.value
  if (ratio >= 0.8) return '您展现了优秀的情绪调节能力！建议继续保持积极应对方式...'
  if (ratio >= 0.6) return '您的情绪调节能力良好，仍有提升空间...'
  return '建议多练习积极应对策略，以下资源可能对您有帮助...'
})

const restartTraining = () => {
  currentSceneId.value = trainingData.startScene
  selectedOption.value = null
  answerHistory.splice(0)
  showResult.value = false
  retryCount.value = 0
}
</script>

<style scoped>
.training-container {
  padding: 24px;
  max-width: 800px;
  margin: 0 auto;
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

.result-feedback {
  margin-top: 16px;
  padding: 16px;
  background-color: #fafafa;
  border-radius: 4px;
}
</style>
