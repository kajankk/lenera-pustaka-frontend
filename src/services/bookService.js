import api from "/src/utils/api.js";
import { API_ENDPOINTS, PAGINATION_DEFAULTS } from "/src/utils/constants.js"

export const bookService = {
  // ============ BOOK CRUD ENDPOINTS ============

  // Create book - Requires Auth (Admin)
  async createBook(formData) {
    const response = await api.post(API_ENDPOINTS.BOOKS, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    return response.data
  },

  // Get paginated books - Public access
  async getBooks(params = {}) {
    const {
      page = PAGINATION_DEFAULTS.PAGE,
      limit = PAGINATION_DEFAULTS.LIMIT,
      sortField = PAGINATION_DEFAULTS.SORT_FIELD,
      sortOrder = PAGINATION_DEFAULTS.SORT_ORDER,
      searchTitle,
      seriesId,
      genreId,
      subGenreId
    } = params

    const response = await api.get(API_ENDPOINTS.BOOKS, {
      params: {
        page,
        limit,
        sortField,
        sortOrder,
        ...(searchTitle && { searchTitle }),
        ...(seriesId && { seriesId }),
        ...(genreId && { genreId }),
        ...(subGenreId && { subGenreId })
      }
    })

    return response.data
  },

  // Get book detail by slug - Public access
  async getBookDetail(slug) {
    const response = await api.get(API_ENDPOINTS.BOOK_DETAIL(slug))
    return response.data
  },

  // Update book - Requires Auth (Admin)
  async updateBook(id, formData) {
    const response = await api.put(API_ENDPOINTS.BOOKS, formData, {
      params: { id },
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    return response.data
  },

  // Delete book - Requires Auth (Admin)
  async deleteBook(id) {
    const response = await api.delete(`${API_ENDPOINTS.BOOKS}/${id}`)
    return response.data
  },

  // ============ READING & PROGRESS ENDPOINTS - Requires Auth ============

  // Start reading a book - Requires Auth
  async startReading(slug) {
    const response = await api.get(API_ENDPOINTS.BOOK_READ(slug))
    return response.data
  },

  // Save reading progress - Requires Auth
  async saveReadingProgress(slug, progressData) {
    const response = await api.post(`/api/books/${slug}/progress`, {
      page: progressData.page,
      position: progressData.position,
      percentage: progressData.percentage,
      lastReadAt: progressData.lastReadAt,
      totalPages: progressData.totalPages,
      chapterTitle: progressData.chapterTitle,
      notes: progressData.notes
    })
    return response.data
  },

  // Get reading progress - Requires Auth
  async getReadingProgress(slug) {
    const response = await api.get(`/api/books/${slug}/progress`)
    return response.data
  },

  // ============ BOOKMARKS ENDPOINTS - Requires Auth ============

  // Add bookmark - Requires Auth
  async addBookmark(slug, bookmarkData) {
    const response = await api.post(`/api/books/${slug}/bookmarks`, {
      title: bookmarkData.title,
      page: bookmarkData.page,
      position: bookmarkData.position,
      notes: bookmarkData.notes,
      chapterTitle: bookmarkData.chapterTitle
    })
    return response.data
  },

  // Get bookmarks - Requires Auth
  async getBookmarks(slug) {
    const response = await api.get(API_ENDPOINTS.GET_BOOKMARKS(slug))
    return response.data
  },

  // Update bookmark - Requires Auth
  async updateBookmark(slug, bookmarkId, bookmarkData) {
    const response = await api.put(`/api/books/${slug}/bookmarks/${bookmarkId}`, {
      title: bookmarkData.title,
      page: bookmarkData.page,
      position: bookmarkData.position,
      notes: bookmarkData.notes,
      chapterTitle: bookmarkData.chapterTitle
    })
    return response.data
  },

  // Delete bookmark - Requires Auth
  async deleteBookmark(slug, bookmarkId) {
    const response = await api.delete(`/api/books/${slug}/bookmarks/${bookmarkId}`)
    return response.data
  },

  // ============ HIGHLIGHTS ENDPOINTS - Requires Auth ============

  // Add highlight - Requires Auth
  async addHighlight(slug, highlightData) {
    const response = await api.post(`/api/books/${slug}/highlights`, {
      text: highlightData.text,
      color: highlightData.color,
      page: highlightData.page,
      startPosition: highlightData.startPosition,
      endPosition: highlightData.endPosition,
      notes: highlightData.notes,
      chapterTitle: highlightData.chapterTitle
    })
    return response.data
  },

  // Get highlights - Requires Auth
  async getHighlights(slug) {
    const response = await api.get(API_ENDPOINTS.GET_HIGHLIGHTS(slug))
    return response.data
  },

  // Update highlight - Requires Auth
  async updateHighlight(slug, highlightId, highlightData) {
    const response = await api.put(`/api/books/${slug}/highlights/${highlightId}`, {
      text: highlightData.text,
      color: highlightData.color,
      page: highlightData.page,
      startPosition: highlightData.startPosition,
      endPosition: highlightData.endPosition,
      notes: highlightData.notes,
      chapterTitle: highlightData.chapterTitle
    })
    return response.data
  },

  // Delete highlight - Requires Auth
  async deleteHighlight(slug, highlightId) {
    const response = await api.delete(`/api/books/${slug}/highlights/${highlightId}`)
    return response.data
  },

  // ============ NOTES ENDPOINTS - Requires Auth ============

  // Add note - Requires Auth
  async addNote(slug, noteData) {
    const response = await api.post(`/api/books/${slug}/notes`, {
      title: noteData.title,
      content: noteData.content,
      page: noteData.page,
      position: noteData.position,
      chapterTitle: noteData.chapterTitle,
      isPrivate: noteData.isPrivate || false
    })
    return response.data
  },

  // Get notes - Requires Auth
  async getNotes(slug) {
    const response = await api.get(API_ENDPOINTS.GET_NOTES(slug))
    return response.data
  },

  // Update note - Requires Auth
  async updateNote(slug, noteId, noteData) {
    const response = await api.put(`/api/books/${slug}/notes/${noteId}`, {
      title: noteData.title,
      content: noteData.content,
      page: noteData.page,
      position: noteData.position,
      chapterTitle: noteData.chapterTitle,
      isPrivate: noteData.isPrivate || false
    })
    return response.data
  },

  // Delete note - Requires Auth
  async deleteNote(slug, noteId) {
    const response = await api.delete(`/api/books/${slug}/notes/${noteId}`)
    return response.data
  },

  // ============ REACTIONS ENDPOINTS - Requires Auth ============

  // Get reactions - Public access
  async getReactions(slug, page = 1, limit = 50) {
    const response = await api.get(`/api/books/${slug}/reactions`, {
      params: { page, limit }
    })
    return response.data
  },

  // Add reaction - Requires Auth
  async addReaction(slug, reactionData) {
    const response = await api.post(`/api/books/${slug}/reactions`, {
      type: reactionData.type,
      rating: reactionData.rating,
      comment: reactionData.comment,
      title: reactionData.title,
      page: reactionData.page,
      position: reactionData.position,
      parentId: reactionData.parentId
    })
    return response.data
  },

  // Get reaction replies - Public access
  async getReactionReplies(slug, reactionId) {
    const response = await api.get(`/api/books/${slug}/reactions/${reactionId}/replies`)
    return response.data
  },

  // Get reaction stats - Public access
  async getReactionStats(slug) {
    const response = await api.get(`/api/books/${slug}/reactions/stats`)
    return response.data
  },

  // Update reaction - Requires Auth
  async updateReaction(slug, reactionId, reactionData) {
    const response = await api.put(`/api/books/${slug}/reactions/${reactionId}`, {
      type: reactionData.type,
      rating: reactionData.rating,
      comment: reactionData.comment,
      title: reactionData.title
    })
    return response.data
  },

  // Remove reaction - Requires Auth
  async removeReaction(slug, reactionId) {
    const response = await api.delete(`/api/books/${slug}/reactions/${reactionId}`)
    return response.data
  },

  // ============ UTILITY ENDPOINTS ============

  // Download book - Public access
  async downloadBook(bookSlug, filename = 'book.epub') {
    try {
      const response = await api.get(API_ENDPOINTS.BOOK_DOWNLOAD(bookSlug), {
        responseType: 'blob',
        timeout: 30000,
        headers: { 'Accept': 'application/octet-stream' }
      })

      if (!response.data || !(response.data instanceof Blob)) {
        throw new Error('Response bukan file yang valid')
      }

      const url = window.URL.createObjectURL(response.data)
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', filename)
      link.style.display = 'none'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      return true
    } catch (error) {
      if (error.code === 'ECONNABORTED') {
        throw new Error('Download timeout. File terlalu besar atau koneksi lambat.')
      } else if (error.response?.status === 404) {
        throw new Error('File tidak ditemukan.')
      } else if (error.response?.status === 403) {
        throw new Error('Tidak memiliki akses untuk mengunduh file ini.')
      } else if (error.response?.status >= 500) {
        throw new Error('Terjadi kesalahan pada server. Coba lagi nanti.')
      } else {
        throw new Error('Gagal mengunduh buku. Silakan coba lagi.')
      }
    }
  },

  // Search in book - Public access
  async searchInBook(slug, query, page = 1, limit = 10) {
    const response = await api.get(`/api/books/${slug}/search`, {
      params: { query, page, limit }
    })
    return response.data
  },

  // Translate text - Requires Auth
  async translateText(slug, translationData) {
    const response = await api.post(`/api/books/${slug}/translate`, {
      text: translationData.text,
      targetLanguage: translationData.targetLanguage,
      sourceLanguage: translationData.sourceLanguage,
      page: translationData.page,
      position: translationData.position
    })
    return response.data
  },

  // Translate highlight - Requires Auth
  async translateHighlight(slug, translationData) {
    const response = await api.post(`/api/books/${slug}/translate-highlight`, {
      highlightId: translationData.highlightId,
      targetLanguage: translationData.targetLanguage,
      sourceLanguage: translationData.sourceLanguage
    })
    return response.data
  },

  // Generate text to speech - Requires Auth
  async generateTextToSpeech(slug, ttsData) {
    const response = await api.post(`/api/books/${slug}/tts`, {
      text: ttsData.text,
      voice: ttsData.voice,
      speed: ttsData.speed,
      pitch: ttsData.pitch,
      language: ttsData.language,
      page: ttsData.page,
      position: ttsData.position
    })
    return response.data
  },

  // Sync audio with text - Requires Auth
  async syncAudioWithText(slug, syncData) {
    const response = await api.post(`/api/books/${slug}/sync-audio`, {
      audioUrl: syncData.audioUrl,
      textContent: syncData.textContent,
      timestamps: syncData.timestamps,
      page: syncData.page,
      chapterTitle: syncData.chapterTitle
    })
    return response.data
  },

  // ============ UTILITY FUNCTIONS ============

  // Check if user is authenticated
  isAuthenticated() {
    const token = localStorage.getItem('authToken')
    return token !== null && token !== ''
  },

  // Get current user data
  getCurrentUser() {
    try {
      const userData = localStorage.getItem('userData')
      return userData ? JSON.parse(userData) : null
    } catch (error) {
      console.error('Error parsing user data:', error)
      return null
    }
  },

  // Get user reaction for a book
  async getUserReaction(slug) {
    try {
      // Get all reactions and find user's reaction
      const response = await this.getReactions(slug, 1, 100)
      const currentUser = this.getCurrentUser()

      if (!currentUser) return { data: null }

      const userReaction = response.data?.find(reaction =>
        reaction.user?.id === currentUser.id || reaction.userId === currentUser.id
      )

      return { data: userReaction || null }
    } catch (error) {
      return { data: null }
    }
  },

  // Enhanced batch operations for better performance
  async getBookData(slug) {
    try {
      const isAuth = this.isAuthenticated()

      const [bookDetail, reactionStats, reactions, userStats] = await Promise.allSettled([
        this.getBookDetail(slug),
        this.getReactionStats(slug),
        this.getReactions(slug, 1, 50),
        isAuth ? Promise.allSettled([
          this.getHighlights(slug).catch(() => ({ data: [] })),
          this.getNotes(slug).catch(() => ({ data: [] })),
          this.getBookmarks(slug).catch(() => ({ data: [] })),
          this.getReadingProgress(slug).catch(() => ({ data: null }))
        ]) : Promise.resolve([])
      ])

      let bookStats = { highlights: 0, notes: 0, bookmarks: 0, reactions: 0 }
      let readingProgress = null

      if (isAuth && userStats.status === 'fulfilled') {
        const [highlights, notes, bookmarks, progress] = userStats.value
        bookStats = {
          highlights: highlights.status === 'fulfilled' ? highlights.value.data?.length || 0 : 0,
          notes: notes.status === 'fulfilled' ? notes.value.data?.length || 0 : 0,
          bookmarks: bookmarks.status === 'fulfilled' ? bookmarks.value.data?.length || 0 : 0,
          reactions: reactionStats.status === 'fulfilled' ? reactionStats.value.data?.total || 0 : 0
        }
        readingProgress = progress.status === 'fulfilled' ? progress.value.data : null
      }

      // Filter discussions (reactions with comments)
      const allReactions = reactions.status === 'fulfilled' ? reactions.value.data || [] : []
      const discussions = allReactions.filter(reaction =>
        reaction.comment && reaction.comment.trim() !== ''
      )

      // Find user reaction
      const currentUser = this.getCurrentUser()
      const userReaction = isAuth && currentUser ?
        allReactions.find(reaction =>
          reaction.user?.id === currentUser.id || reaction.userId === currentUser.id
        ) : null

      return {
        book: bookDetail.status === 'fulfilled' ? bookDetail.value.data : null,
        reactionStats: reactionStats.status === 'fulfilled' ? reactionStats.value.data : null,
        discussions,
        bookStats,
        userReaction,
        readingProgress
      }
    } catch (error) {
      console.error('Error fetching book data:', error)
      throw error
    }
  },

  // Batch operations for user's book activities
  async getUserBookActivities(slug) {
    if (!this.isAuthenticated()) {
      return {
        highlights: [],
        notes: [],
        bookmarks: [],
        progress: null
      }
    }

    try {
      const [highlights, notes, bookmarks, progress] = await Promise.allSettled([
        this.getHighlights(slug),
        this.getNotes(slug),
        this.getBookmarks(slug),
        this.getReadingProgress(slug)
      ])

      return {
        highlights: highlights.status === 'fulfilled' ? highlights.value.data || [] : [],
        notes: notes.status === 'fulfilled' ? notes.value.data || [] : [],
        bookmarks: bookmarks.status === 'fulfilled' ? bookmarks.value.data || [] : [],
        progress: progress.status === 'fulfilled' ? progress.value.data : null
      }
    } catch (error) {
      console.error('Error fetching user book activities:', error)
      return {
        highlights: [],
        notes: [],
        bookmarks: [],
        progress: null
      }
    }
  },

  // Helper method for creating FormData for book operations
  createBookFormData(bookData, file = null) {
    const formData = new FormData()

    // Add book data
    Object.keys(bookData).forEach(key => {
      if (bookData[key] !== null && bookData[key] !== undefined) {
        formData.append(key, bookData[key])
      }
    })

    // Add file if provided
    if (file) {
      formData.append('file', file)
    }

    return formData
  },

  // Validate file before upload
  validateBookFile(file) {
    const allowedTypes = ['.epub', '.pdf', '.mobi', '.azw', '.azw3']
    const maxSize = 50 * 1024 * 1024 // 50MB

    if (!file) {
      throw new Error('File is required')
    }

    if (file.size > maxSize) {
      throw new Error('File size must be less than 50MB')
    }

    const fileExtension = file.name.toLowerCase().substr(file.name.lastIndexOf('.'))
    if (!allowedTypes.includes(fileExtension)) {
      throw new Error(`File type ${fileExtension} is not supported. Allowed types: ${allowedTypes.join(', ')}`)
    }

    return true
  }
}