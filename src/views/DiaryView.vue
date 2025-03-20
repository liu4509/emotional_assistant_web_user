<template>
  <a-layout class="diary-container">
    <a-card title="新建日记" :bordered="false">
      <a-form @submit="handleSubmit">
        <a-form-item label="日期">
          <a-form-item label="记录时间">
            {{ currentTime }}
          </a-form-item>
        </a-form-item>

        <a-form-item label="心情标签">
          <a-select v-model:value="form.tags" :options="moodTags" />
        </a-form-item>

        <a-form-item label="日记内容">
          <a-textarea v-model:value="form.content" :rows="4" placeholder="记录今天发生的事..." />
        </a-form-item>

        <a-button type="primary" html-type="submit">保存日记</a-button>
      </a-form>
    </a-card>

    <a-card title="情绪趋势分析" style="margin-top: 24px">
      <div ref="chartRef" style="width: 100%; height: 400px"></div>
    </a-card>

    <a-card title="情绪建议" style="margin-top: 24px">
      <a-alert v-for="(tip, index) in moodTips" :key="index" :message="tip" type="info" show-icon
        style="margin-bottom: 12px" />
    </a-card>
  </a-layout>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import * as echarts from 'echarts'
import { Alert, message } from 'ant-design-vue'
import dayjs from 'dayjs'

// 心情标签配置
const MOOD_CONFIG = [
  { value: 'happy', label: '😊 快乐', score: 4 },
  { value: 'bliss', label: '😇 幸福', score: 5 },
  { value: 'excited', label: '🤩 兴奋', score: 4 },
  { value: 'content', label: '😌 满足', score: 3 },
  { value: 'relaxed', label: '🛀 轻松', score: 3 },
  { value: 'calm', label: '🧘 平静', score: 1 },
  { value: 'tired', label: '😴 疲惫', score: -1 },
  { value: 'anxious', label: '😰 焦虑', score: -2 },
  { value: 'frustrated', label: '😞 沮丧', score: -2 },
  { value: 'sad', label: '😢 难过', score: -3 },
  { value: 'grief', label: '😭 悲伤', score: -5 },
  { value: 'angry', label: '😠 愤怒', score: -5 },
]

const moodTags = MOOD_CONFIG

const form = ref({
  content: '',
  tags: null,
})

const chartRef = ref(null)
let chartInstance = null
const chartData = ref([])

const initChart = () => {
  chartInstance = echarts.init(chartRef.value)
  updateChart()
}

const generateTips = (score) => {
  const tipsCollection = {
    high: [
      '你今天的能量超棒！继续保持这个状态吧～',
      '看到你积极的状态真为你高兴，明天也要加油哦！',
      '快乐是会传染的，把你的好心情分享给朋友吧',
    ],
    medium: [
      '平和的心态是智慧的体现，试着做几分钟深呼吸',
      '泡杯花茶放松下，记录三件让你感恩的小事',
      '这样的状态适合读本好书，推荐《当下的力量》',
    ],
    low: [
      '情绪波动是成长的机会，给自己一个温暖的拥抱',
      '试试对着镜子微笑，你会发现不一样的自己',
      '洗个热水澡早点休息，明天又是崭新的一天',
    ],
  }

  if (score >= 10) return tipsCollection.high
  if (score >= 5) return tipsCollection.medium
  return tipsCollection.low
}

const handleSubmit = () => {
  if (!form.value.tags) {
    return message.error('请选择心情标签')
  }
  if (!form.value.content.trim()) {
    return message.error('请输入日记内容')
  }

  const selectedTag = moodTags.find((t) => t.value === form.value.tags)
  const newRecord = {
    date: currentTime.value,
    score: selectedTag.score,
    tags: [selectedTag.label],
    content: form.value.content,
  }
  console.log('[数据记录] 新增条目：', newRecord)

  // 更新图表数据（保留最近5条）
  chartData.value = [...chartData.value, newRecord].slice(-5)
  console.log('[图表数据] 更新后数据：', chartData.value)

  // 显示保存结果
  const tipsList = generateTips(newRecord.score)
  const randomTip = tipsList[Math.floor(Math.random() * tipsList.length)]
  console.log('[情绪建议] 生成建议列表：', tipsList)
  message.success({
    content: `日记保存成功！🎉\n 情绪指数：${newRecord.score}\n专属建议：${randomTip}`,
    // description: `情绪指数：${newRecord.score}\n专属建议：${randomTip}`,
    duration: 3,
  })

  // 更新图表视图
  try {
    updateChart()
    console.log('[图表操作] 图表更新完成')
  } catch (e) {
    console.error('[图表错误] 更新失败：', e)
    message.error('图表更新失败，请稍后重试')
  }
}

const updateChart = () => {
  const option = {
    xAxis: {
      type: 'category',
      data: chartData.value
        .sort((a, b) => dayjs(a.date).unix() - dayjs(b.date).unix())
        .map((r) => dayjs(r.date).format('MM/DD HH:mm')),
    },
    yAxis: { type: 'value' },
    tooltip: {
      formatter: (params) => {
        return `${params.name}<br/>心情标签：${chartData.value[params.dataIndex].tags.join(', ')}<br/>分数：${params.value}`
      },
    },
    series: [
      {
        data: chartData.value.slice(-5).map((r) => r.score),
        type: 'line',
        itemStyle: {
          color: '#1890ff',
        },
        lineStyle: {
          width: 2,
        },
      },
    ],
  }
  chartInstance.setOption(option)
}

const currentTime = ref(dayjs().format('YYYY-MM-DD HH:mm:ss'))
let timer = null

onMounted(() => {
  initChart()
  timer = setInterval(() => {
    currentTime.value = dayjs().format('YYYY-MM-DD HH:mm:ss')
  }, 1000)
  window.addEventListener('resize', () => chartInstance?.resize())
})

onBeforeUnmount(() => {
  clearInterval(timer)
})
</script>

<style scoped>
.diary-container {
  padding: 24px;
  max-width: 800px;
  margin: 0 auto;
}
</style>
