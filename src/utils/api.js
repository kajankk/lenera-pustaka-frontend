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

// List of public endpoint patterns
const PUBLIC_ENDPOINT_PATTERNS = [
  /^\/api\/books$/, // GET /api/books (list books)
  /^\/api\/books\/[^\/]+$/, // GET /api/books/{slug} (book detail)
  /^\/api\/books\/[^\/]+\/read$/, // GET /api/books/{slug}/read
  /^\/api\/books\/[^\/]+\/download$/, // GET /api/books/{slug}/download
  /^\/auth\/login$/, // Login endpoint
  /^\/auth\/register$/, // Register endpoint
  /^\/auth\/forgot-password$/, // Forgot password
]

// Check if endpoint is public
const isPublicEndpoint = (url) => {
  // Remove base URL if present
  const cleanUrl = url.replace(API_BASE_URL, '').replace(/^\/+/, '/')

  return PUBLIC_ENDPOINT_PATTERNS.some(pattern => pattern.test(cleanUrl))
}

// Request interceptor - only add auth token for protected endpoints
api.interceptors.request.use(
  (config) => {
    // Build full URL for checking
    const fullUrl = config.baseURL ?
      `${config.baseURL}${config.url}`.replace(/\/+/g, '/') :
      config.url

    // Only add auth token if it's not a public endpoint
    if (!isPublicEndpoint(fullUrl)) {
      const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN)
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
    }

    // Set appropriate timeout for download requests
    if (config.url && config.url.includes('/download')) {
      config.timeout = 30000 // 30 seconds for downloads
    }

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
      // Improve error message for network issues
      if (error.code === 'ECONNABORTED') {
        error.message = 'Request timeout - koneksi terlalu lambat'
      } else if (error.code === 'ERR_NETWORK') {
        error.message = 'Tidak dapat terhubung ke server'
      } else {
        error.message = 'Terjadi kesalahan jaringan'
      }
      return Promise.reject(error)
    }

    // Build full URL for checking
    const fullUrl = originalRequest.baseURL ?
      `${originalRequest.baseURL}${originalRequest.url}`.replace(/\/+/g, '/') :
      originalRequest.url

    // Handle 401 dengan auto refresh - only for protected endpoints
    if (error.response?.status === 401 && !originalRequest._retry && !isPublicEndpoint(fullUrl)) {
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

    // Handle server errors
    if (error.response?.status >= 500) {
      error.message = 'Terjadi kesalahan pada server'
    }

    return Promise.reject(error)
  }
)

export default api