import request from '@/utils/request'

/**
 * 用户登录
 * @param {Object} data
 * @param {string} data.username - 用户名
 * @param {string} data.password - 密码
 * @returns {Promise}
 */
export function login(data) {
  return request({
    url: '/user/login',
    method: 'post',
    data,
  });
}

/**
 * 用户注册
 * @param {Object} data
 * @param {string} data.username - 用户名
 * @param {string} data.password - 密码
 * @param {string} data.email - 邮箱
 * @param {string} data.captcha - 验证码
 * @returns {Promise}
 */
export function register(data) {
  return request({
    url: '/user/register',
    method: 'post',
    data,
  });
}

/**
 * 更新用户信息
 * @param {Object} data
 * @param {string} data.avatar - 头像
 * @param {string} data.email - 邮箱
 * @returns {Promise}
 */
export function updateUserInfo(data) {
  return request({
    url: '/user/update',
    method: 'post',
    data,
  });
}

/**
 * 更新用户密码
 * @param {Object} data
 * @param {string} data.currentPassword - 旧密码
 * @param {string} data.password - 新密码
 * @param {string} data.verifyCode - 验证码
 * @returns {Promise}
 */
export function updateUserPassword(data) {
  return request({
    url: '/user/update_password',
    method: 'post',
    data,
  });
}

/**
 * 获取用户信息
 * @returns {Promise}
 */
export function getUserInfo() {
  return request({
    url: '/user/info',
    method: 'get',
  })
}


/**
 * 验证码发送
 * @param {Object} params
 * @param {string} params.address - 邮箱地址
 * @param {number} params.ttl - 过期时间 （可选）
 * @returns {Promise}
 */
export function sendVerifyCodeAPI(params) {
  return request({
    url: '/user/register-captcha',
    method: 'get',
    params,
  })
}

