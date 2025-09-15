export const API_BASE_URL = 'https://lentera-pustaka.up.railway.app'

export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  BOOKS: '/books',
  DASHBOARD: '/dashboard',
  READER: '/read'
}

export const API_ENDPOINTS = {
  // Auth
  LOGIN: '/api/auth/login',
  LOGOUT: '/api/auth/logout',
  REGISTER: '/api/auth/register',
  GOOGLE_AUTH: '/api/auth/google',
  FORGOT_PASSWORD: '/api/auth/forgot-password',
  RESET_PASSWORD: '/api/auth/reset-password',
  REFRESH_TOKEN: '/api/auth/refresh-token',

  // Books
  BOOKS: '/api/books',
  BOOK_DETAIL: (slug) => `/api/books/${slug}`,
  BOOK_READ: (slug) => `/api/books/${slug}/read`,
  BOOK_DOWNLOAD: (slug) => `/api/books/${slug}/download`,

  // Dashboard
  DASHBOARD: '/api/dashboard'
}

export const THEMES = {
  LIGHT: 'light',
  DARK: 'dark'
}

export const STORAGE_KEYS = {
  AUTH_TOKEN: 'authToken',
  THEME: 'theme',
  USER_DATA: 'userData'
}

export const PAGINATION_DEFAULTS = {
  PAGE: 1,
  LIMIT: 12,
  SORT_FIELD: 'updateAt',
  SORT_ORDER: 'DESC'
}