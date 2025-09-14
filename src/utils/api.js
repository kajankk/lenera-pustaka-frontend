import axios from 'axios'
import { API_BASE_URL, STORAGE_KEYS } from '../utils/constants'

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  }
})

// Request interceptor untuk menambahkan auth token
api.interceptors.request.use(
  (config) => {
    console.log(`Making ${config.method?.toUpperCase()} request to:`, config.baseURL + config.url)

    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN)
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    console.error('Request interceptor error:', error)
    return Promise.reject(error)
  }
)

// Response interceptor untuk handle errors
api.interceptors.response.use(
  (response) => {
    console.log('API Response:', response.status, response.data)
    return response
  },
  (error) => {
    console.error('API Error:', error)

    // Handle network errors
    if (error.code === 'ECONNREFUSED') {
      console.error('Connection refused - server might be down')
      error.message = 'Tidak dapat terhubung ke server. Pastikan backend berjalan di http://localhost:8080'
    } else if (error.code === 'ENOTFOUND') {
      console.error('Host not found')
      error.message = 'Server tidak ditemukan'
    } else if (error.code === 'ECONNABORTED') {
      console.error('Request timeout')
      error.message = 'Koneksi timeout'
    } else if (!error.response) {
      console.error('Network error - no response')
      error.message = 'Tidak dapat terhubung ke server'
    }

    // Handle 401 unauthorized
    if (error.response?.status === 401) {
      console.log('Unauthorized - clearing auth data')
      localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN)
      localStorage.removeItem(STORAGE_KEYS.USER_DATA)
      // Only redirect if not already on login page
      if (!window.location.pathname.includes('/auth') && !window.location.pathname.includes('/login')) {
        window.location.href = '/auth'
      }
    }

    // Handle 500 server errors
    if (error.response?.status >= 500) {
      error.message = 'Terjadi kesalahan pada server'
    }

    return Promise.reject(error)
  }
)

export default api