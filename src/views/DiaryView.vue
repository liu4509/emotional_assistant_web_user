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

        <a-button type="primary" html-type="submit" :loading="isSubmitting">保存日记</a-button>
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
import { ref, onMounted, onBeforeUnmount, computed } from 'vue'
import * as echarts from 'echarts'
import { Alert, message } from 'ant-design-vue'
import dayjs from 'dayjs'
import { getMyDiaries, createDiarie } from '@/api/diarie'

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
const isSubmitting = ref(false)
const myDiaries = ref([])
const isLoading = ref(false)
const moodTips = ref([])

// 从API数据转换为图表数据
const convertToChartData = (diary) => {
  // 从接口返回的moods数组中获取第一个mood
  const mood = diary.moods && diary.moods.length > 0 ? diary.moods[0] : null

  return {
    id: diary.id,
    date: dayjs(diary.createTime).format('YYYY-MM-DD HH:mm:ss'),
    score: mood ? mood.score : 0,
    tags: mood ? [mood.label] : [],
    content: diary.content
  }
}

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

// 获取我的日记列表
const fetchMyDiaries = async () => {
  try {
    isLoading.value = true
    const response = await getMyDiaries()
    if (response.code === 200 && response.data) {
      myDiaries.value = response.data

      // 将API返回的日记数据转换为图表可用的格式
      chartData.value = myDiaries.value
        .slice(-5) // 只取最近5条
        .map(diary => convertToChartData(diary))

      // 更新图表
      updateChart()

      // 根据最近一条日记生成心情建议
      if (chartData.value.length > 0) {
        const latestScore = chartData.value[chartData.value.length - 1].score
        moodTips.value = generateTips(latestScore)
      }
    } else {
      message.error(response.message || '获取日记列表失败')
    }
  } catch (error) {
    console.error('获取日记列表失败:', error)
    message.error('获取日记列表失败')
  } finally {
    isLoading.value = false
  }
}

const handleSubmit = async () => {
  if (!form.value.tags) {
    return message.error('请选择心情标签')
  }
  if (!form.value.content.trim()) {
    return message.error('请输入日记内容')
  }

  try {
    isSubmitting.value = true

    // 准备要提交的数据
    const data = {
      content: form.value.content,
      moodValues: [form.value.tags] // API需要的是情绪值数组
    }

    // 调用创建日记API
    const response = await createDiarie(data)

    if (response.code === 201 && response.data) {
      const newDiary = response.data

      // 将新日记添加到列表
      myDiaries.value.push(newDiary)

      // 转换为图表数据
      const newChartRecord = convertToChartData(newDiary)

      // 更新图表数据（保留最近5条）
      chartData.value = [...chartData.value, newChartRecord].slice(-5)

      // 生成心情建议
      const selectedTag = moodTags.find((t) => t.value === form.value.tags)
      const tipsList = generateTips(selectedTag.score)
      const randomTip = tipsList[Math.floor(Math.random() * tipsList.length)]
      moodTips.value = tipsList

      // 显示保存成功消息
      message.success({
        content: `日记保存成功！🎉\n 情绪指数：${selectedTag.score}\n专属建议：${randomTip}`,
        duration: 3,
      })

      // 更新图表
      updateChart()

      // 清空表单
      form.value.content = ''
      form.value.tags = null
    } else {
      message.error(response.message || '保存日记失败')
    }
  } catch (error) {
    console.error('保存日记失败:', error)
    message.error('保存日记失败')
  } finally {
    isSubmitting.value = false
  }
}

const updateChart = () => {
  if (!chartInstance) return

  const option = {
    xAxis: {
      type: 'category',
      data: chartData.value
        .sort((a, b) => dayjs(a.date).unix() - dayjs(b.date).unix())
        .map((r) => dayjs(r.date).format('MM/DD HH:mm')),
    },
    yAxis: {
      type: 'value',
      name: '情绪值',
      axisLabel: {
        formatter: function (value) {
          // 找到最接近该值的情绪标签
          const closestMood = MOOD_CONFIG.reduce((prev, curr) => {
            return Math.abs(curr.score - value) < Math.abs(prev.score - value) ? curr : prev;
          });
          return closestMood.label;
        }
      }
    },
    tooltip: {
      formatter: (params) => {
        const dataIndex = params.dataIndex;
        const item = chartData.value[dataIndex];
        return `${params.name}<br/>心情标签：${item.tags.join(', ')}<br/>分数：${params.value}<br/>内容：${item.content.substring(0, 20)}...`
      },
    },
    series: [
      {
        data: chartData.value.map((r) => r.score),
        type: 'line',
        smooth: true, // 使线条更柔和平滑
        itemStyle: {
          color: '#1890ff',
        },
        lineStyle: {
          width: 2,
          shadowColor: 'rgba(0, 0, 0, 0.2)',
          shadowBlur: 10
        },
        areaStyle: {
          // 添加柔和的渐变区域
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(24, 144, 255, 0.6)' },
              { offset: 1, color: 'rgba(24, 144, 255, 0.1)' }
            ]
          }
        }
      },
    ],
  }
  chartInstance.setOption(option)
}

const currentTime = ref(dayjs().format('YYYY-MM-DD HH:mm:ss'))
let timer = null

onMounted(() => {
  // 获取日记列表
  fetchMyDiaries()

  // 初始化图表
  initChart()

  // 更新当前时间
  timer = setInterval(() => {
    currentTime.value = dayjs().format('YYYY-MM-DD HH:mm:ss')
  }, 1000)

  // 窗口大小改变时重绘图表
  window.addEventListener('resize', () => chartInstance?.resize())
})

onBeforeUnmount(() => {
  clearInterval(timer)
  // 销毁图表实例
  if (chartInstance) {
    chartInstance.dispose()
    chartInstance = null
  }
})
</script>

<style scoped>
.diary-container {
  padding: 24px;
  max-width: 800px;
  margin: 0 auto;
}
</style>
