// utils/constants.js - Enhanced version with new endpoints
export const API_BASE_URL = 'http://localhost:8080'

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

  // New Features - Reading Progress
  SAVE_PROGRESS: (slug) => `/api/books/${slug}/progress`,
  GET_PROGRESS: (slug) => `/api/books/${slug}/progress`,

  // New Features - Bookmarks
  ADD_BOOKMARK: (slug) => `/api/books/${slug}/bookmarks`,
  GET_BOOKMARKS: (slug) => `/api/books/${slug}/bookmarks`,
  DELETE_BOOKMARK: (slug, bookmarkId) => `/api/books/${slug}/bookmarks/${bookmarkId}`,

  // New Features - Search
  SEARCH_IN_BOOK: (slug) => `/api/books/${slug}/search`,

  // New Features - Highlights
  ADD_HIGHLIGHT: (slug) => `/api/books/${slug}/highlights`,
  GET_HIGHLIGHTS: (slug) => `/api/books/${slug}/highlights`,
  DELETE_HIGHLIGHT: (slug, highlightId) => `/api/books/${slug}/highlights/${highlightId}`,
  UPDATE_HIGHLIGHT: (slug, highlightId) => `/api/books/${slug}/highlights/${highlightId}`,

  // New Features - Notes
  ADD_NOTE: (slug) => `/api/books/${slug}/notes`,
  GET_NOTES: (slug) => `/api/books/${slug}/notes`,
  DELETE_NOTE: (slug, noteId) => `/api/books/${slug}/notes/${noteId}`,
  UPDATE_NOTE: (slug, noteId) => `/api/books/${slug}/notes/${noteId}`,

  // New Features - Translation
  TRANSLATE_TEXT: (slug) => `/api/books/${slug}/translate`,
  TRANSLATE_HIGHLIGHT: (slug) => `/api/books/${slug}/translate-highlight`,

  // New Features - Reactions & Discussions
  ADD_REACTION: (slug) => `/api/books/${slug}/reactions`,
  GET_DISCUSSIONS: (slug) => `/api/books/${slug}/discussions`,
  ADD_DISCUSSION: (slug) => `/api/books/${slug}/discussions`,

  // New Features - Audio & Voice
  GENERATE_TTS: (slug) => `/api/books/${slug}/tts`,
  SYNC_AUDIO: (slug) => `/api/books/${slug}/sync-audio`,

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
  USER_DATA: 'userData',
  READER_SETTINGS: 'readerSettings',
  READING_PROGRESS: 'readingProgress'
}

export const PAGINATION_DEFAULTS = {
  PAGE: 1,
  LIMIT: 12,
  SORT_FIELD: 'updateAt',
  SORT_ORDER: 'DESC'
}

export const READER_DEFAULTS = {
  FONT_SIZE: 16,
  READING_MODE: 'default',
  AUTO_SAVE_INTERVAL: 30000, // 30 seconds
  HIGHLIGHT_COLORS: {
    YELLOW: '#ffff00',
    GREEN: '#90EE90',
    PINK: '#FFB6C1',
    BLUE: '#87CEEB',
    PURPLE: '#DDA0DD'
  }
}

export const FEATURE_FLAGS = {
  ENABLE_VOICE_FEATURES: true,
  ENABLE_AI_FEATURES: true,
  ENABLE_TRANSLATION: true,
  ENABLE_COLLABORATION: true,
  ENABLE_DISCUSSIONS: true,
  ENABLE_ANALYTICS: true
}