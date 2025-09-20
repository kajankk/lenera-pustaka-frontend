import api from "/src/utils/api.js";
import { API_ENDPOINTS, PAGINATION_DEFAULTS } from "/src/utils/constants.js"

export const bookService = {
  // ============ BOOK CRUD ENDPOINTS ============

  // Get paginated books - public access
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

  // Get book detail by slug - public access
  async getBookDetail(slug) {
    const response = await api.get(API_ENDPOINTS.BOOK_DETAIL(slug))
    return response.data
  },

  // Start reading a book - public access
  async startReading(slug) {
    const response = await api.get(API_ENDPOINTS.BOOK_READ(slug))
    return response.data
  },

  // Download book - public access
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

  // ============ USER STATS ENDPOINTS - Requires Auth ============

  async getHighlights(slug) {
    const response = await api.get(API_ENDPOINTS.GET_HIGHLIGHTS(slug))
    return response.data
  },

  async getNotes(slug) {
    const response = await api.get(API_ENDPOINTS.GET_NOTES(slug))
    return response.data
  },

  async getBookmarks(slug) {
    const response = await api.get(API_ENDPOINTS.GET_BOOKMARKS(slug))
    return response.data
  },

  // ============ REACTIONS ENDPOINTS ============

  async getReactions(slug, page = 1, limit = 50) {
    const response = await api.get(`/api/books/${slug}/reactions`, {
      params: { page, limit }
    })
    return response.data
  },

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

  async getReactionStats(slug) {
    const response = await api.get(`/api/books/${slug}/reactions/stats`)
    return response.data
  },

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

  async updateReaction(slug, reactionId, reactionData) {
    const response = await api.put(`/api/books/${slug}/reactions/${reactionId}`, {
      type: reactionData.type,
      rating: reactionData.rating,
      comment: reactionData.comment,
      title: reactionData.title
    })
    return response.data
  },

  async removeReaction(slug, reactionId) {
    const response = await api.delete(`/api/books/${slug}/reactions/${reactionId}`)
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
          this.getBookmarks(slug).catch(() => ({ data: [] }))
        ]) : Promise.resolve([])
      ])

      let bookStats = { highlights: 0, notes: 0, bookmarks: 0, reactions: 0 }

      if (isAuth && userStats.status === 'fulfilled') {
        const [highlights, notes, bookmarks] = userStats.value
        bookStats = {
          highlights: highlights.status === 'fulfilled' ? highlights.value.data?.length || 0 : 0,
          notes: notes.status === 'fulfilled' ? notes.value.data?.length || 0 : 0,
          bookmarks: bookmarks.status === 'fulfilled' ? bookmarks.value.data?.length || 0 : 0,
          reactions: reactionStats.status === 'fulfilled' ? reactionStats.value.data?.total || 0 : 0
        }
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
        userReaction
      }
    } catch (error) {
      console.error('Error fetching book data:', error)
      throw error
    }
  }
}