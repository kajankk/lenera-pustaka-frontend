// utils/constants.js - Enhanced version with new endpoints
export const API_BASE_URL = 'https://lentera-pustaka.up.railway.app'

export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  BOOKS: '/books',
  DASHBOARD: '/dashboard',
  READER: '/read',
  PROFILE: '/profile',
  ADMIN: '/admin'
}

export const API_ENDPOINTS = {
  // ============ AUTH ENDPOINTS ============
  LOGIN: '/api/auth/login',
  LOGOUT: '/api/auth/logout',
  REGISTER: '/api/auth/register',
  GOOGLE_AUTH: '/api/auth/google',
  VERIFY_EMAIL: '/api/auth/verify-email',
  RESEND_VERIFICATION: '/api/auth/resend-verification',
  FORGOT_PASSWORD: '/api/auth/forgot-password',
  RESET_PASSWORD: '/api/auth/reset-password',
  REFRESH_TOKEN: '/api/auth/refresh-token',

  // ============ BOOK CRUD ENDPOINTS ============
  BOOKS: '/api/books',
  BOOK_DETAIL: (slug) => `/api/books/${slug}`,
  BOOK_UPDATE: '/api/books', // PUT with id param
  BOOK_DELETE: (id) => `/api/books/${id}`,

  // ============ READING & PROGRESS ENDPOINTS ============
  BOOK_READ: (slug) => `/api/books/${slug}/read`,
  SAVE_PROGRESS: (slug) => `/api/books/${slug}/progress`,
  GET_PROGRESS: (slug) => `/api/books/${slug}/progress`,

  // ============ BOOKMARKS ENDPOINTS ============
  ADD_BOOKMARK: (slug) => `/api/books/${slug}/bookmarks`,
  GET_BOOKMARKS: (slug) => `/api/books/${slug}/bookmarks`,
  UPDATE_BOOKMARK: (slug, bookmarkId) => `/api/books/${slug}/bookmarks/${bookmarkId}`,
  DELETE_BOOKMARK: (slug, bookmarkId) => `/api/books/${slug}/bookmarks/${bookmarkId}`,

  // ============ HIGHLIGHTS ENDPOINTS ============
  ADD_HIGHLIGHT: (slug) => `/api/books/${slug}/highlights`,
  GET_HIGHLIGHTS: (slug) => `/api/books/${slug}/highlights`,
  UPDATE_HIGHLIGHT: (slug, highlightId) => `/api/books/${slug}/highlights/${highlightId}`,
  DELETE_HIGHLIGHT: (slug, highlightId) => `/api/books/${slug}/highlights/${highlightId}`,

  // ============ NOTES ENDPOINTS ============
  ADD_NOTE: (slug) => `/api/books/${slug}/notes`,
  GET_NOTES: (slug) => `/api/books/${slug}/notes`,
  UPDATE_NOTE: (slug, noteId) => `/api/books/${slug}/notes/${noteId}`,
  DELETE_NOTE: (slug, noteId) => `/api/books/${slug}/notes/${noteId}`,

  // ============ REACTIONS ENDPOINTS ============
  GET_REACTIONS: (slug) => `/api/books/${slug}/reactions`,
  ADD_REACTION: (slug) => `/api/books/${slug}/reactions`,
  GET_REACTION_REPLIES: (slug, reactionId) => `/api/books/${slug}/reactions/${reactionId}/replies`,
  GET_REACTION_STATS: (slug) => `/api/books/${slug}/reactions/stats`,
  UPDATE_REACTION: (slug, reactionId) => `/api/books/${slug}/reactions/${reactionId}`,
  DELETE_REACTION: (slug, reactionId) => `/api/books/${slug}/reactions/${reactionId}`,

  // ============ UTILITY ENDPOINTS ============
  BOOK_DOWNLOAD: (slug) => `/api/books/${slug}/download`,
  SEARCH_IN_BOOK: (slug) => `/api/books/${slug}/search`,
  TRANSLATE_TEXT: (slug) => `/api/books/${slug}/translate`,
  TRANSLATE_HIGHLIGHT: (slug) => `/api/books/${slug}/translate-highlight`,
  GENERATE_TTS: (slug) => `/api/books/${slug}/tts`,
  SYNC_AUDIO: (slug) => `/api/books/${slug}/sync-audio`,

  // ============ DASHBOARD ENDPOINT ============
  DASHBOARD: '/api/dashboard'
}

export const THEMES = {
  LIGHT: 'light',
  DARK: 'dark',
  SEPIA: 'sepia',
  NIGHT: 'night'
}

export const STORAGE_KEYS = {
  AUTH_TOKEN: 'authToken',
  REFRESH_TOKEN: 'refreshToken',
  THEME: 'theme',
  USER_DATA: 'userData',
  READER_SETTINGS: 'readerSettings',
  READING_PROGRESS: 'readingProgress',
  BOOKMARKS: 'bookmarks',
  HIGHLIGHTS: 'highlights',
  NOTES: 'notes',
  LAST_READ_BOOK: 'lastReadBook'
}

export const PAGINATION_DEFAULTS = {
  PAGE: 1,
  LIMIT: 12,
  SORT_FIELD: 'updateAt',
  SORT_ORDER: 'DESC',
  SEARCH_LIMIT: 10,
  REACTION_LIMIT: 50
}

export const READER_DEFAULTS = {
  FONT_SIZE: 16,
  LINE_HEIGHT: 1.6,
  FONT_FAMILY: 'Georgia',
  READING_MODE: 'default',
  AUTO_SAVE_INTERVAL: 30000, // 30 seconds
  HIGHLIGHT_COLORS: {
    YELLOW: '#ffff00',
    GREEN: '#90EE90',
    PINK: '#FFB6C1',
    BLUE: '#87CEEB',
    PURPLE: '#DDA0DD',
    ORANGE: '#FFA500',
    RED: '#FFB6BA'
  },
  THEME_COLORS: {
    LIGHT: {
      background: '#ffffff',
      text: '#333333',
      accent: '#007bff'
    },
    DARK: {
      background: '#1a1a1a',
      text: '#ffffff',
      accent: '#007bff'
    },
    SEPIA: {
      background: '#f4f1ea',
      text: '#5c4b3a',
      accent: '#8b4513'
    },
    NIGHT: {
      background: '#0d1117',
      text: '#c9d1d9',
      accent: '#58a6ff'
    }
  }
}

export const REACTION_TYPES = {
  LIKE: 'LIKE',
  LOVE: 'LOVE',
  LAUGH: 'LAUGH',
  WOW: 'WOW',
  SAD: 'SAD',
  ANGRY: 'ANGRY',
  RATING: 'RATING',
  COMMENT: 'COMMENT'
}

export const FILE_TYPES = {
  SUPPORTED_EBOOKS: ['.epub', '.pdf', '.mobi', '.azw', '.azw3'],
  SUPPORTED_IMAGES: ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
  SUPPORTED_AUDIO: ['.mp3', '.wav', '.ogg', '.m4a'],
  MAX_FILE_SIZE: 50 * 1024 * 1024 // 50MB
}

export const VALIDATION_RULES = {
  PASSWORD: {
    MIN_LENGTH: 8,
    REQUIRE_UPPERCASE: true,
    REQUIRE_LOWERCASE: true,
    REQUIRE_NUMBERS: true,
    REQUIRE_SPECIAL: false
  },
  USERNAME: {
    MIN_LENGTH: 3,
    MAX_LENGTH: 30,
    PATTERN: /^[a-zA-Z0-9_]+$/
  },
  BOOK_TITLE: {
    MIN_LENGTH: 1,
    MAX_LENGTH: 255
  },
  NOTE_CONTENT: {
    MAX_LENGTH: 5000
  },
  COMMENT_CONTENT: {
    MAX_LENGTH: 1000
  }
}

export const FEATURE_FLAGS = {
  ENABLE_VOICE_FEATURES: true,
  ENABLE_AI_FEATURES: true,
  ENABLE_TRANSLATION: true,
  ENABLE_COLLABORATION: true,
  ENABLE_DISCUSSIONS: true,
  ENABLE_ANALYTICS: true,
  ENABLE_OFFLINE_READING: false,
  ENABLE_SOCIAL_FEATURES: true,
  ENABLE_ADMIN_PANEL: true,
  ENABLE_FILE_UPLOAD: true
}

export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Koneksi internet bermasalah. Silakan coba lagi.',
  AUTH_ERROR: 'Sesi Anda telah berakhir. Silakan login kembali.',
  NOT_FOUND: 'Data yang dicari tidak ditemukan.',
  PERMISSION_DENIED: 'Anda tidak memiliki akses untuk melakukan tindakan ini.',
  SERVER_ERROR: 'Terjadi kesalahan pada server. Silakan coba lagi nanti.',
  VALIDATION_ERROR: 'Data yang Anda masukkan tidak valid.',
  FILE_TOO_LARGE: 'Ukuran file terlalu besar. Maksimal 50MB.',
  UNSUPPORTED_FILE: 'Format file tidak didukung.',
  GENERIC_ERROR: 'Terjadi kesalahan yang tidak terduga.'
}

export const SUCCESS_MESSAGES = {
  LOGIN_SUCCESS: 'Berhasil masuk!',
  REGISTER_SUCCESS: 'Pendaftaran berhasil! Silakan verifikasi email Anda.',
  UPDATE_SUCCESS: 'Data berhasil diperbarui!',
  DELETE_SUCCESS: 'Data berhasil dihapus!',
  BOOKMARK_ADDED: 'Bookmark berhasil ditambahkan!',
  HIGHLIGHT_ADDED: 'Highlight berhasil ditambahkan!',
  NOTE_ADDED: 'Catatan berhasil ditambahkan!',
  REACTION_ADDED: 'Reaksi berhasil ditambahkan!',
  DOWNLOAD_SUCCESS: 'File berhasil diunduh!',
  PROGRESS_SAVED: 'Progres baca berhasil disimpan!'
}

export const LANGUAGES = {
  ID: 'id',
  EN: 'en',
  AR: 'ar',
  ZH: 'zh',
  ES: 'es',
  FR: 'fr',
  DE: 'de',
  JA: 'ja',
  KO: 'ko',
  RU: 'ru'
}

export const TTS_VOICES = {
  ID_FEMALE: 'id-ID-female',
  ID_MALE: 'id-ID-male',
  EN_FEMALE: 'en-US-female',
  EN_MALE: 'en-US-male',
  AR_FEMALE: 'ar-SA-female',
  AR_MALE: 'ar-SA-male'
}

export const SORT_OPTIONS = {
  NEWEST: { field: 'updateAt', order: 'DESC', label: 'Terbaru' },
  OLDEST: { field: 'updateAt', order: 'ASC', label: 'Terlama' },
  TITLE_AZ: { field: 'title', order: 'ASC', label: 'Judul A-Z' },
  TITLE_ZA: { field: 'title', order: 'DESC', label: 'Judul Z-A' },
  RATING_HIGH: { field: 'rating', order: 'DESC', label: 'Rating Tertinggi' },
  RATING_LOW: { field: 'rating', order: 'ASC', label: 'Rating Terendah' },
  POPULAR: { field: 'views', order: 'DESC', label: 'Terpopuler' }
}