import api from '../utils/api'
import { API_ENDPOINTS, STORAGE_KEYS } from '../utils/constants'

const storage = {
  set: (key, value) => localStorage.setItem(key, value),
  get: (key) => localStorage.getItem(key),
  remove: (key) => localStorage.removeItem(key)
}

export const authService = {
  async login(credentials) {
    const response = await api.post(API_ENDPOINTS.LOGIN, credentials)
    const { token, refreshToken, ...user } = response.data.data

    storage.set(STORAGE_KEYS.AUTH_TOKEN, token)
    storage.set('refreshToken', refreshToken)
    storage.set(STORAGE_KEYS.USER_DATA, JSON.stringify(user))

    return { token, user, refreshToken }
  },

  async register(userData) {
    const response = await api.post(API_ENDPOINTS.REGISTER, userData)
    return response.data
  },

  async logout() {
    try {
      await api.post(API_ENDPOINTS.LOGOUT)
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      this.clearAuthData()
    }
  },

  async googleAuth(googleIdToken) {
    const response = await api.post(API_ENDPOINTS.GOOGLE_AUTH, {
      idToken: googleIdToken
    })
    const { token, refreshToken, ...user } = response.data.data

    storage.set(STORAGE_KEYS.AUTH_TOKEN, token)
    storage.set('refreshToken', refreshToken)
    storage.set(STORAGE_KEYS.USER_DATA, JSON.stringify(user))

    return { token, user, refreshToken }
  },

  async forgotPassword(username) {
    const response = await api.post(API_ENDPOINTS.FORGOT_PASSWORD, { username })
    return response.data
  },

  async resetPassword(resetData) {
    const response = await api.post(API_ENDPOINTS.RESET_PASSWORD, resetData)
    return response.data
  },

  async refreshToken() {
    const refreshToken = storage.get('refreshToken')
    if (!refreshToken) throw new Error('No refresh token available')

    const response = await api.post(API_ENDPOINTS.REFRESH_TOKEN, { refreshToken })
    const { token: newToken } = response.data.data

    storage.set(STORAGE_KEYS.AUTH_TOKEN, newToken)
    return newToken
  },

  clearAuthData() {
    [STORAGE_KEYS.AUTH_TOKEN, 'refreshToken', STORAGE_KEYS.USER_DATA]
      .forEach(key => storage.remove(key))
  },

  getCurrentUser() {
    try {
      const userData = storage.get(STORAGE_KEYS.USER_DATA)
      return userData && userData !== 'undefined' ? JSON.parse(userData) : null
    } catch (err) {
      storage.remove(STORAGE_KEYS.USER_DATA)
      return null
    }
  },

  isAuthenticated() {
    return !!storage.get(STORAGE_KEYS.AUTH_TOKEN)
  }
}