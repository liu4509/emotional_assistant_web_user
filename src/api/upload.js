import request from '@/utils/request'

/**
 * 上传图片 弃用
 * @param {FormData} formData - 包含图片文件的FormData对象，文件字段名必须为'file'
 * @returns {Promise<{success: boolean, status: number, data: {url: string}}>}
 */
export function uploadImage(formData) {
  return request({
    url: '/upload/image',
    method: 'post',
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })
}

/**
 * 上传文件 七牛云
 * @param {FormData} formData - 包含图片文件的FormData对象，文件字段名必须为'file'
 * @returns {Promise<{success: boolean, status: number, data: {url: string}}>}
 */
export function uploadFile(formData) {
  return request({
    url: '/upload/file',
    method: 'post',
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })
}
