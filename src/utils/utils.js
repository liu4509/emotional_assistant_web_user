import { uploadFile } from '@/api/upload'

import { message as ElMessage } from 'ant-design-vue'
// 格式化时间
export const formatDate = (timestamp) => {
  if (!timestamp) return '-'
  const date = new Date(timestamp)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${year}-${month}-${day} ${hours}:${minutes}`
}

/**
 * 格式化时长（秒）为 MM:SS 格式
 * @param {number} seconds 秒数
 * @returns {string} 格式化后的时长
 */
export function formatDuration(seconds) {
  if (!seconds) return '0:00'

  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = Math.floor(seconds % 60)
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
}

/**
 * 格式化数字（用于显示播放量等）
 * @param {number} num 数字
 * @returns {string} 格式化后的数字
 */
export function formatNumber(num) {
  if (num >= 10000) {
    return (num / 10000).toFixed(1) + '万'
  }
  return num.toString()
}

export const uploadImageUtil = async (event) => {
  const file = event.target.files[0]
  if (!file) return

  // 验证文件类型
  if (!['image/jpeg', 'image/png'].includes(file.type)) {
    ElMessage.error('只能上传JPG/PNG格式的图片')
    return
  }

  // 验证文件大小（最大2MB）
  if (file.size / 1024 / 1024 > 2) {
    ElMessage.error('图片大小不能超过2MB')
    return
  }

  // 创建FormData
  const formData = new FormData()
  formData.append('file', file)

  const res = await uploadFile(formData)

  if (res.code === 201 && res.data) {
    ElMessage.success('图片上传成功')
    return res.data
  } else {
    ElMessage.error(res.message || '图片上传失败')
  }
}

export const uploadAudioUtil = async (event) => {
  const file = event.target.files[0]
  if (!file) return

  // 验证文件类型
  if (!['audio/mpeg', 'audio/mp3', 'audio/wav'].includes(file.type)) {
    ElMessage.error('只能上传MP3/WAV格式的音频')
    return
  }

  // 验证文件大小（最大10MB）
  if (file.size / 1024 / 1024 > 10) {
    ElMessage.error('音频大小不能超过10MB')
    return
  }

  // 创建FormData
  const formData = new FormData()
  formData.append('file', file)

  const res = await uploadFile(formData)

  if (res.code === 201 && res.data) {
    ElMessage.success('音频上传成功')
    return res.data
  } else {
    ElMessage.error(res.message || '音频上传失败')
  }
}

export const uploadVideoUtil = async (event) => {
  const file = event.target.files[0]
  if (!file) return

  // 验证文件类型
  if (
    !['video/mp4', 'video/avi', 'video/mov', 'video/wmv', 'video/flv', 'video/mpeg'].includes(
      file.type,
    )
  ) {
    ElMessage.error('只能上传MP4/AVI/MOV/WMV/FLV/MPEG格式的视频')
    return
  }

  // 验证文件大小（最大100MB）
  if (file.size / 1024 / 1024 > 100) {
    ElMessage.error('视频大小不能超过100MB')
    return
  }

  // 创建FormData
  const formData = new FormData()
  formData.append('file', file)

  const res = await uploadFile(formData)

  if (res.code === 201 && res.data) {
    ElMessage.success('视频上传成功')
    return res.data
  } else {
    ElMessage.error(res.message || '视频上传失败')
  }
}
