// utils/constants.js - Updated to match backend endpoints exactly
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

  // Books - Main CRUD
  BOOKS: '/api/books',
  BOOK_DETAIL: (slug) => `/api/books/${slug}`,
  BOOK_READ: (slug) => `/api/books/${slug}/read`,
  BOOK_DOWNLOAD: (slug) => `/api/books/${slug}/download`,

  // Reading Progress - Requires Auth
  SAVE_PROGRESS: (slug) => `/api/books/${slug}/progress`,
  GET_PROGRESS: (slug) => `/api/books/${slug}/progress`,

  // Bookmarks - Requires Auth
  ADD_BOOKMARK: (slug) => `/api/books/${slug}/bookmarks`,
  GET_BOOKMARKS: (slug) => `/api/books/${slug}/bookmarks`,
  UPDATE_BOOKMARK: (slug, bookmarkId) => `/api/books/${slug}/bookmarks/${bookmarkId}`,
  DELETE_BOOKMARK: (slug, bookmarkId) => `/api/books/${slug}/bookmarks/${bookmarkId}`,

  // Highlights - Requires Auth
  ADD_HIGHLIGHT: (slug) => `/api/books/${slug}/highlights`,
  GET_HIGHLIGHTS: (slug) => `/api/books/${slug}/highlights`,
  UPDATE_HIGHLIGHT: (slug, highlightId) => `/api/books/${slug}/highlights/${highlightId}`,
  DELETE_HIGHLIGHT: (slug, highlightId) => `/api/books/${slug}/highlights/${highlightId}`,

  // Notes - Requires Auth
  ADD_NOTE: (slug) => `/api/books/${slug}/notes`,
  GET_NOTES: (slug) => `/api/books/${slug}/notes`,
  UPDATE_NOTE: (slug, noteId) => `/api/books/${slug}/notes/${noteId}`,
  DELETE_NOTE: (slug, noteId) => `/api/books/${slug}/notes/${noteId}`,

  // Reactions & Comments - Mixed Auth Requirements
  GET_REACTIONS: (slug) => `/api/books/${slug}/reactions`,
  ADD_REACTION: (slug) => `/api/books/${slug}/reactions`, // Requires Auth
  GET_REACTION_REPLIES: (slug, reactionId) => `/api/books/${slug}/reactions/${reactionId}/replies`,
  GET_REACTION_STATS: (slug) => `/api/books/${slug}/reactions/stats`,
  UPDATE_REACTION: (slug, reactionId) => `/api/books/${slug}/reactions/${reactionId}`, // Requires Auth
  DELETE_REACTION: (slug, reactionId) => `/api/books/${slug}/reactions/${reactionId}`, // Requires Auth

  // Search - Public Access
  SEARCH_IN_BOOK: (slug) => `/api/books/${slug}/search`,

  // Translation - Public Access
  TRANSLATE_TEXT: (slug) => `/api/books/${slug}/translate`,
  TRANSLATE_HIGHLIGHT: (slug) => `/api/books/${slug}/translate-highlight`, // Requires Auth

  // Audio & TTS - Public Access
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
    YELLOW: '#FFFF00',
    GREEN: '#90EE90',
    PINK: '#FFB6C1',
    BLUE: '#87CEEB',
    PURPLE: '#DDA0DD',
    ORANGE: '#FFA500',
    RED: '#FF6B6B'
  },
  NOTE_COLORS: {
    YELLOW: '#FFEB3B',
    BLUE: '#2196F3',
    GREEN: '#4CAF50',
    PINK: '#E91E63',
    PURPLE: '#9C27B0',
    ORANGE: '#FF9800'
  },
  BOOKMARK_COLORS: {
    GOLD: '#FFD700',
    RED: '#FF4444',
    BLUE: '#4444FF',
    GREEN: '#44FF44',
    PURPLE: '#AA44FF'
  }
}

// Authentication status for different endpoints
export const AUTH_REQUIREMENTS = {
  // Public Access (no auth required)
  PUBLIC: [
    'GET /api/books',
    'GET /api/books/{slug}',
    'GET /api/books/{slug}/read',
    'GET /api/books/{slug}/download',
    'GET /api/books/{slug}/reactions',
    'GET /api/books/{slug}/reactions/stats',
    'GET /api/books/{slug}/reactions/{reactionId}/replies'
  ],

  // Requires Authentication
  AUTH_REQUIRED: [
    'POST /api/books',
    'PUT /api/books',
    'DELETE /api/books/{id}',
    'POST /api/books/{slug}/progress',
    'GET /api/books/{slug}/progress',
    'POST /api/books/{slug}/bookmarks',
    'GET /api/books/{slug}/bookmarks',
    'PUT /api/books/{slug}/bookmarks/{bookmarkId}',
    'DELETE /api/books/{slug}/bookmarks/{bookmarkId}',
    'POST /api/books/{slug}/highlights',
    'GET /api/books/{slug}/highlights',
    'PUT /api/books/{slug}/highlights/{highlightId}',
    'DELETE /api/books/{slug}/highlights/{highlightId}',
    'POST /api/books/{slug}/notes',
    'GET /api/books/{slug}/notes',
    'PUT /api/books/{slug}/notes/{noteId}',
    'DELETE /api/books/{slug}/notes/{noteId}',
    'POST /api/books/{slug}/reactions',
    'PUT /api/books/{slug}/reactions/{reactionId}',
    'DELETE /api/books/{slug}/reactions/{reactionId}',
    'GET /api/books/{slug}/search',
    'POST /api/books/{slug}/translate',
    'POST /api/books/{slug}/translate-highlight',
    'POST /api/books/{slug}/tts',
    'POST /api/books/{slug}/sync-audio'
  ]
}

export const FEATURE_FLAGS = {
  ENABLE_VOICE_FEATURES: true,
  ENABLE_AI_FEATURES: true,
  ENABLE_TRANSLATION: true,
  ENABLE_COLLABORATION: true,
  ENABLE_DISCUSSIONS: true,
  ENABLE_ANALYTICS: true,
  ENABLE_GUEST_READING: true, // Allow reading without login
  ENABLE_GUEST_DOWNLOAD: true, // Allow download without login
  ENABLE_AUTO_SAVE: true,
  ENABLE_OFFLINE_READING: false
}

// Reaction types matching backend
export const REACTION_TYPES = {
  LIKE: 'like',
  LOVE: 'love',
  WOW: 'wow',
  SAD: 'sad',
  ANGRY: 'angry',
  COMMENT: 'comment',
  RATING: 'rating'
}

// Reading status options
export const READING_STATUS = {
  NOT_STARTED: 'NOT_STARTED',
  READING: 'READING',
  COMPLETED: 'COMPLETED',
  PAUSED: 'PAUSED',
  GUEST_READING: 'GUEST_READING'
}

// Error messages
export const ERROR_MESSAGES = {
  AUTH_REQUIRED: 'Silakan login terlebih dahulu untuk menggunakan fitur ini.',
  NETWORK_ERROR: 'Terjadi kesalahan jaringan. Silakan coba lagi.',
  SERVER_ERROR: 'Terjadi kesalahan pada server. Silakan coba lagi nanti.',
  NOT_FOUND: 'Data tidak ditemukan.',
  UNAUTHORIZED: 'Anda tidak memiliki akses untuk melakukan aksi ini.',
  VALIDATION_ERROR: 'Data yang dimasukkan tidak valid.'
}

// Success messages
export const SUCCESS_MESSAGES = {
  BOOKMARK_ADDED: 'Bookmark berhasil ditambahkan',
  HIGHLIGHT_ADDED: 'Highlight berhasil ditambahkan',
  NOTE_ADDED: 'Catatan berhasil ditambahkan',
  PROGRESS_SAVED: 'Progress membaca berhasil disimpan',
  REACTION_ADDED: 'Reaksi berhasil ditambahkan'
}