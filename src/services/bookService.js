import api from "/src/utils/api.js";
import { API_ENDPOINTS, PAGINATION_DEFAULTS } from "/src/utils/constants.js"

export const bookService = {
  // ============ BOOK CRUD ENDPOINTS ============

  async createBook(formData) {
    const response = await api.post(API_ENDPOINTS.BOOKS, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    return response.data
  },

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

  async getBookDetail(slug) {
    const response = await api.get(API_ENDPOINTS.BOOK_DETAIL(slug))
    return response.data
  },

  async updateBook(id, formData) {
    const response = await api.put(API_ENDPOINTS.BOOKS, formData, {
      params: { id },
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    return response.data
  },

  async deleteBook(id) {
    const response = await api.delete(`${API_ENDPOINTS.BOOKS}/${id}`)
    return response.data
  },

  // ============ READING & PROGRESS ENDPOINTS ============

  async startReading(slug) {
    const response = await api.get(API_ENDPOINTS.BOOK_READ(slug))
    return response.data
  },

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

  async getReadingProgress(slug) {
    const response = await api.get(`/api/books/${slug}/progress`)
    return response.data
  },

  // ============ BOOKMARKS ENDPOINTS ============

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

  async getBookmarks(slug) {
    const response = await api.get(API_ENDPOINTS.GET_BOOKMARKS(slug))
    return response.data
  },

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

  async deleteBookmark(slug, bookmarkId) {
    const response = await api.delete(`/api/books/${slug}/bookmarks/${bookmarkId}`)
    return response.data
  },

  // ============ HIGHLIGHTS ENDPOINTS ============

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

  async getHighlights(slug) {
    const response = await api.get(API_ENDPOINTS.GET_HIGHLIGHTS(slug))
    return response.data
  },

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

  async deleteHighlight(slug, highlightId) {
    const response = await api.delete(`/api/books/${slug}/highlights/${highlightId}`)
    return response.data
  },

  // ============ NOTES ENDPOINTS ============

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

  async getNotes(slug) {
    const response = await api.get(API_ENDPOINTS.GET_NOTES(slug))
    return response.data
  },

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

  async deleteNote(slug, noteId) {
    const response = await api.delete(`/api/books/${slug}/notes/${noteId}`)
    return response.data
  },

  // ============ RATING ENDPOINTS ============

  // Add or update rating
  async addOrUpdateRating(slug, rating) {
    const response = await api.post(`/api/books/${slug}/rating`, {
      rating: rating
    })
    return response.data
  },

  // Delete rating
  async deleteRating(slug) {
    const response = await api.delete(`/api/books/${slug}/rating`)
    return response.data
  },

  // ============ REVIEW ENDPOINTS ============

  // Get reviews with pagination
  async getReviews(slug, page = 1, limit = 10) {
    const response = await api.get(`/api/books/${slug}/reviews`, {
      params: { page, limit }
    })
    return response.data
  },

  // Add review
  async addReview(slug, reviewData) {
    const response = await api.post(`/api/books/${slug}/reviews`, {
      title: reviewData.title || null,
      comment: reviewData.comment
    })
    return response.data
  },

  // Update review
  async updateReview(slug, reviewData) {
    const response = await api.put(`/api/books/${slug}/reviews`, {
      title: reviewData.title || null,
      comment: reviewData.comment
    })
    return response.data
  },

  // Delete review
  async deleteReview(slug) {
    const response = await api.delete(`/api/books/${slug}/reviews`)
    return response.data
  },

  // ============ REPLY ENDPOINTS ============

  // Add reply to a review
  async addReply(slug, parentId, comment) {
    const response = await api.post(`/api/books/${slug}/reviews/${parentId}/replies`, {
      comment: comment
    })
    return response.data
  },

  // Update reply
  async updateReply(slug, replyId, comment) {
    const response = await api.put(`/api/books/${slug}/replies/${replyId}`, {
      comment: comment
    })
    return response.data
  },

  // Delete reply
  async deleteReply(slug, replyId) {
    const response = await api.delete(`/api/books/${slug}/replies/${replyId}`)
    return response.data
  },

  // ============ FEEDBACK ENDPOINTS ============

  // Add or update feedback (HELPFUL/NOT_HELPFUL)
  async addOrUpdateFeedback(slug, reviewId, type) {
    const response = await api.post(`/api/books/${slug}/reviews/${reviewId}/feedback`, {
      type: type // "HELPFUL" or "NOT_HELPFUL"
    })
    return response.data
  },

  // Delete feedback
  async deleteFeedback(slug, reviewId) {
    const response = await api.delete(`/api/books/${slug}/reviews/${reviewId}/feedback`)
    return response.data
  },

  // ============ UTILITY ENDPOINTS ============

  async downloadBook(bookSlug, filename = 'book.epub') {
    try {
      const response = await api.get(`/api/books/${bookSlug}/download`, {
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

  async searchInBook(slug, query, page = 1, limit = 10) {
    const response = await api.get(`/api/books/${slug}/search`, {
      params: { query, page, limit }
    })
    return response.data
  },

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

  async translateHighlight(slug, translationData) {
    const response = await api.post(`/api/books/${slug}/translate-highlight`, {
      highlightId: translationData.highlightId,
      targetLanguage: translationData.targetLanguage,
      sourceLanguage: translationData.sourceLanguage
    })
    return response.data
  },

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

  isAuthenticated() {
    const token = localStorage.getItem('authToken')
    return token !== null && token !== ''
  },

  getCurrentUser() {
    try {
      const userData = localStorage.getItem('userData')
      return userData ? JSON.parse(userData) : null
    } catch (error) {
      console.error('Error parsing user data:', error)
      return null
    }
  },

  // Get user's rating and review for a book
  async getUserRatingAndReview(slug) {
    try {
      const [reviews] = await Promise.all([
        this.getReviews(slug, 1, 100)
      ])

      const currentUser = this.getCurrentUser()
      if (!currentUser) return { rating: null, review: null }

      const userReview = reviews.data?.find(r =>
        String(r.userId) === String(currentUser.id) && r.reactionType === 'COMMENT' && !r.parentId
      )

      // Rating akan ada di response lain, kita return dari review jika ada
      return {
        rating: userReview?.rating || null,
        review: userReview || null
      }
    } catch (error) {
      console.error('Error getting user rating and review:', error)
      return { rating: null, review: null }
    }
  },

  // Enhanced batch operations for better performance
  async getBookData(slug) {
    try {
      const isAuth = this.isAuthenticated()

      const [bookDetail, reviews, userStats] = await Promise.allSettled([
        this.getBookDetail(slug),
        this.getReviews(slug, 1, 50),
        isAuth ? Promise.allSettled([
          this.getHighlights(slug).catch(() => ({ data: [] })),
          this.getNotes(slug).catch(() => ({ data: [] })),
          this.getBookmarks(slug).catch(() => ({ data: [] })),
          this.getReadingProgress(slug).catch(() => ({ data: null }))
        ]) : Promise.resolve([])
      ])

      let bookStats = { highlights: 0, notes: 0, bookmarks: 0 }
      let readingProgress = null

      if (isAuth && userStats.status === 'fulfilled') {
        const [highlights, notes, bookmarks, progress] = userStats.value
        bookStats = {
          highlights: highlights.status === 'fulfilled' ? highlights.value.data?.length || 0 : 0,
          notes: notes.status === 'fulfilled' ? notes.value.data?.length || 0 : 0,
          bookmarks: bookmarks.status === 'fulfilled' ? bookmarks.value.data?.length || 0 : 0
        }
        readingProgress = progress.status === 'fulfilled' ? progress.value.data : null
      }

      const allReviews = reviews.status === 'fulfilled' ? reviews.value.data || [] : []

      // Find user's rating and review
      const currentUser = this.getCurrentUser()
      let userRating = null
      let userReview = null

      if (isAuth && currentUser) {
        userReview = allReviews.find(r =>
          String(r.userId) === String(currentUser.id) &&
          r.reactionType === 'COMMENT' &&
          !r.parentId
        )

        // Rating might be embedded in review or separate
        if (userReview?.rating) {
          userRating = { rating: userReview.rating, id: userReview.id }
        }
      }

      return {
        book: bookDetail.status === 'fulfilled' ? bookDetail.value.data : null,
        reviews: allReviews,
        bookStats,
        userRating,
        userReview,
        readingProgress
      }
    } catch (error) {
      console.error('Error fetching book data:', error)
      throw error
    }
  },

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

  createBookFormData(bookData, file = null) {
    const formData = new FormData()

    Object.keys(bookData).forEach(key => {
      if (bookData[key] !== null && bookData[key] !== undefined) {
        formData.append(key, bookData[key])
      }
    })

    if (file) {
      formData.append('file', file)
    }

    return formData
  },

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