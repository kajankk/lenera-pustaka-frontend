import api from '../utils/api'
import { API_ENDPOINTS, STORAGE_KEYS } from '../utils/constants'

export const authService = {
  // Login with username
  async login(credentials) {
    const response = await api.post(API_ENDPOINTS.LOGIN, credentials)
    const { token, user } = response.data.data

    // Store token and user data
    localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token)
    localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(user))

    return { token, user }
  },

  // Register
  async register(userData) {
    const response = await api.post(API_ENDPOINTS.REGISTER, userData)
    return response.data
  },

  // Logout
  async logout() {
    try {
      await api.post(API_ENDPOINTS.LOGOUT)
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      // Always clear local storage
      localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN)
      localStorage.removeItem(STORAGE_KEYS.USER_DATA)
    }
  },

  // Google Auth
  async googleAuth(googleToken) {
    const response = await api.post(API_ENDPOINTS.GOOGLE_AUTH, { token: googleToken })
    const { token, user } = response.data.data

    localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token)
    localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(user))

    return { token, user }
  },

  // Forgot Password
  async forgotPassword(username) {
    const response = await api.post(API_ENDPOINTS.FORGOT_PASSWORD, { username })
    return response.data
  },

  // Reset Password
  async resetPassword(resetData) {
    const response = await api.post(API_ENDPOINTS.RESET_PASSWORD, resetData)
    return response.data
  },

  // Refresh Token
  async refreshToken(refreshToken) {
    const response = await api.post(API_ENDPOINTS.REFRESH_TOKEN, { refreshToken })
    const { token } = response.data.data

    localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token)
    return token
  },

  // Get current user from localStorage safely
  getCurrentUser() {
    try {
      const userData = localStorage.getItem(STORAGE_KEYS.USER_DATA)
      return userData ? JSON.parse(userData) : null
    } catch (err) {
      console.error('Error parsing user data from localStorage', err)
      return null
    }
  },

  // Check if user is authenticated
  isAuthenticated() {
    return !!localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN)
  }
}
