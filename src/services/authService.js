// authService.js - Fixed Google Auth
import api from '../utils/api'
import { API_ENDPOINTS, STORAGE_KEYS } from '../utils/constants'

export const authService = {
  async login(credentials) {
    const response = await api.post(API_ENDPOINTS.LOGIN, credentials)
    const responseData = response.data.data

    const token = responseData.token
    const refreshToken = responseData.refreshToken
    const user = responseData

    localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token)
    localStorage.setItem('refreshToken', refreshToken)
    localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(user))

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

  // FIXED: Menggunakan field 'idToken' sesuai backend expectation
  async googleAuth(googleIdToken) {
    const response = await api.post(API_ENDPOINTS.GOOGLE_AUTH, {
      idToken: googleIdToken  // Changed from 'token' to 'idToken'
    })
    const responseData = response.data.data

    const token = responseData.token
    const refreshToken = responseData.refreshToken
    const user = responseData

    localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token)
    localStorage.setItem('refreshToken', refreshToken)
    localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(user))

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
    const refreshToken = localStorage.getItem('refreshToken')
    if (!refreshToken) throw new Error('No refresh token available')

    const response = await api.post(API_ENDPOINTS.REFRESH_TOKEN, { refreshToken })
    const { token: newToken } = response.data.data

    localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, newToken)
    return newToken
  },

  clearAuthData() {
    localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN)
    localStorage.removeItem('refreshToken')
    localStorage.removeItem(STORAGE_KEYS.USER_DATA)
  },

  getCurrentUser() {
    try {
      const userData = localStorage.getItem(STORAGE_KEYS.USER_DATA)
      return userData && userData !== 'undefined' ? JSON.parse(userData) : null
    } catch (err) {
      localStorage.removeItem(STORAGE_KEYS.USER_DATA)
      return null
    }
  },

  isAuthenticated() {
    return !!localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN)
  }
}