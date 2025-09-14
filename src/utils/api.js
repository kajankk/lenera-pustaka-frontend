import axios from 'axios'
import { API_BASE_URL, STORAGE_KEYS, API_ENDPOINTS } from '../utils/constants'

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' }
})

let isRefreshing = false
let failedQueue = []

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => error ? prom.reject(error) : prom.resolve(token))
  failedQueue = []
}

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN)
    if (token) config.headers.Authorization = `Bearer ${token}`
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor dengan auto refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    // Handle network errors
    if (!error.response) {
      error.message = 'Tidak dapat terhubung ke server'
      return Promise.reject(error)
    }

    // Handle 401 dengan auto refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (originalRequest.url?.includes('/refresh-token')) {
        localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN)
        localStorage.removeItem('refreshToken')
        localStorage.removeItem(STORAGE_KEYS.USER_DATA)
        window.location.href = '/login'
        return Promise.reject(error)
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        }).then(token => {
          originalRequest.headers.Authorization = `Bearer ${token}`
          return api(originalRequest)
        })
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        const refreshToken = localStorage.getItem('refreshToken')
        if (!refreshToken) throw new Error('No refresh token')

        const refreshResponse = await axios.post(`${API_BASE_URL}${API_ENDPOINTS.REFRESH_TOKEN}`, {
          refreshToken
        })

        const { token: newToken } = refreshResponse.data.data
        localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, newToken)

        processQueue(null, newToken)
        originalRequest.headers.Authorization = `Bearer ${newToken}`
        return api(originalRequest)

      } catch (refreshError) {
        processQueue(refreshError, null)
        localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN)
        localStorage.removeItem('refreshToken')
        localStorage.removeItem(STORAGE_KEYS.USER_DATA)

        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login'
        }
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    if (error.response?.status >= 500) {
      error.message = 'Terjadi kesalahan pada server'
    }

    return Promise.reject(error)
  }
)

export default api