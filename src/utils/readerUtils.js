// utils/readerUtils.js - Utility functions for reader features
export const readerUtils = {
  // Generate unique ID for annotations
  generateAnnotationId: () => {
    return `annotation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  },

  // Format file size
  formatFileSize: (bytes) => {
    if (!bytes) return 'N/A'
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`
  },

  // Format reading time
  formatReadingTime: (minutes) => {
    if (!minutes) return 'N/A'
    if (minutes < 60) return `${minutes} menit`
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    return remainingMinutes > 0 ? `${hours} jam ${remainingMinutes} menit` : `${hours} jam`
  },

  // Calculate reading progress percentage
  calculateProgress: (currentPage, totalPages) => {
    if (!currentPage || !totalPages || totalPages === 0) return 0
    return Math.round((currentPage / totalPages) * 100)
  },

  // Debounce function
  debounce: (func, wait) => {
    let timeout
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout)
        func(...args)
      }
      clearTimeout(timeout)
      timeout = setTimeout(later, wait)
    }
  },

  // Throttle function
  throttle: (func, limit) => {
    let inThrottle
    return function() {
      const args = arguments
      const context = this
      if (!inThrottle) {
        func.apply(context, args)
        inThrottle = true
        setTimeout(() => inThrottle = false, limit)
      }
    }
  },

  // Sanitize text for search
  sanitizeText: (text) => {
    return text.replace(/[^\w\s]/gi, '').toLowerCase().trim()
  },

  // Generate color variations for highlights
  generateColorVariations: (baseColor, count = 5) => {
    const colors = [baseColor]
    // Add logic to generate color variations if needed
    return colors
  },

  // Extract text excerpt around position
  extractExcerpt: (text, position, length = 100) => {
    if (!text || typeof position !== 'number') return ''

    const start = Math.max(0, position - Math.floor(length / 2))
    const end = Math.min(text.length, start + length)

    let excerpt = text.substring(start, end)

    // Add ellipsis if needed
    if (start > 0) excerpt = '...' + excerpt
    if (end < text.length) excerpt = excerpt + '...'

    return excerpt
  },

  // Validate email format
  isValidEmail: (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  },

  // Format date for display
  formatDate: (dateString, options = {}) => {
    const defaultOptions = {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }

    return new Date(dateString).toLocaleDateString('id-ID', {
      ...defaultOptions,
      ...options
    })
  },

  // Generate reading statistics
  generateReadingStats: (sessions) => {
    if (!Array.isArray(sessions) || sessions.length === 0) {
      return {
        totalTime: 0,
        averageTime: 0,
        totalSessions: 0,
        pagesRead: 0,
        wordsRead: 0
      }
    }

    const totalTime = sessions.reduce((sum, session) => sum + (session.duration || 0), 0)
    const totalSessions = sessions.length
    const averageTime = totalTime / totalSessions
    const pagesRead = sessions.reduce((sum, session) => sum + (session.pagesRead || 0), 0)
    const wordsRead = sessions.reduce((sum, session) => sum + (session.wordsRead || 0), 0)

    return {
      totalTime: Math.round(totalTime),
      averageTime: Math.round(averageTime),
      totalSessions,
      pagesRead,
      wordsRead
    }
  },

  // Generate CFI (Canonical Fragment Identifier) for EPUB
  generateCFI: (spineIndex, elementId, textOffset = 0) => {
    return `epubcfi(/6/${spineIndex * 2}[${elementId}]!/4/2/1:${textOffset})`
  },

  // Parse CFI to extract position information
  parseCFI: (cfi) => {
    if (!cfi || typeof cfi !== 'string') return null

    try {
      // Basic CFI parsing - can be enhanced based on needs
      const matches = cfi.match(/\/6\/(\d+)\[([^\]]+)\].*:(\d+)/)
      if (matches) {
        return {
          spineIndex: parseInt(matches[1]) / 2,
          elementId: matches[2],
          textOffset: parseInt(matches[3])
        }
      }
    } catch (error) {
      console.error('Error parsing CFI:', error)
    }

    return null
  },

  // Local storage helpers with error handling
  localStorage: {
    get: (key, defaultValue = null) => {
      try {
        const item = localStorage.getItem(key)
        return item ? JSON.parse(item) : defaultValue
      } catch (error) {
        console.error(`Error getting localStorage item ${key}:`, error)
        return defaultValue
      }
    },

    set: (key, value) => {
      try {
        localStorage.setItem(key, JSON.stringify(value))
        return true
      } catch (error) {
        console.error(`Error setting localStorage item ${key}:`, error)
        return false
      }
    },

    remove: (key) => {
      try {
        localStorage.removeItem(key)
        return true
      } catch (error) {
        console.error(`Error removing localStorage item ${key}:`, error)
        return false
      }
    }
  },

  // Audio utilities
  audio: {
    // Check if browser supports audio recording
    isRecordingSupported: () => {
      return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)
    },

    // Get available audio devices
    getAudioDevices: async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices()
        return devices.filter(device => device.kind === 'audioinput')
      } catch (error) {
        console.error('Error getting audio devices:', error)
        return []
      }
    },

    // Format duration from seconds
    formatDuration: (seconds) => {
      if (!seconds || seconds < 0) return '0:00'

      const minutes = Math.floor(seconds / 60)
      const remainingSeconds = Math.floor(seconds % 60)

      return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
    }
  },

  // Text analysis utilities
  textAnalysis: {
    // Count words in text
    countWords: (text) => {
      if (!text || typeof text !== 'string') return 0
      return text.trim().split(/\s+/).filter(word => word.length > 0).length
    },

    // Calculate reading time based on word count
    calculateReadingTime: (wordCount, wordsPerMinute = 200) => {
      return Math.ceil(wordCount / wordsPerMinute)
    },

    // Extract keywords from text
    extractKeywords: (text, maxKeywords = 10) => {
      if (!text || typeof text !== 'string') return []

      // Simple keyword extraction - can be enhanced
      const words = text.toLowerCase()
        .replace(/[^\w\s]/g, '')
        .split(/\s+/)
        .filter(word => word.length > 3)

      const wordCount = {}
      words.forEach(word => {
        wordCount[word] = (wordCount[word] || 0) + 1
      })

      return Object.entries(wordCount)
        .sort(([,a], [,b]) => b - a)
        .slice(0, maxKeywords)
        .map(([word]) => word)
    }
  }
}