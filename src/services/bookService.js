import api from "/src/utils/api.js";
import { API_ENDPOINTS, PAGINATION_DEFAULTS } from "/src/utils/constants.js"

export const bookService = {
  // ============ EXISTING ENDPOINTS ============

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

  // Create new book (for admin/upload) - requires auth
  async createBook(formData) {
    const response = await api.post(API_ENDPOINTS.BOOKS, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    return response.data
  },

  // Update book - requires auth
  async updateBook(id, bookData, file) {
    const formData = new FormData()
    formData.append('id', id)
    formData.append('ebook', JSON.stringify(bookData))

    if (file) {
      formData.append('file', file)
    }

    const response = await api.put(API_ENDPOINTS.BOOKS, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    return response.data
  },

  // Delete book - requires auth
  async deleteBook(id) {
    const response = await api.delete(API_ENDPOINTS.BOOKS, {
      params: { id }
    })
    return response.data
  },

  // Download book - public access, no auth required
  async downloadBook(bookSlug, filename = 'book.epub') {
    try {
      // Construct the correct download URL based on backend endpoint
      const downloadUrl = `/api/books/${bookSlug}/download`

      const response = await api.get(downloadUrl, {
        responseType: 'blob',
        timeout: 30000, // 30 seconds timeout untuk download
        headers: {
          'Accept': 'application/octet-stream'
        }
      })

      // Check if response is actually a blob
      if (!response.data || !(response.data instanceof Blob)) {
        throw new Error('Response bukan file yang valid')
      }

      // Get filename from response headers if available
      const contentDisposition = response.headers['content-disposition']
      let actualFilename = filename

      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/)
        if (filenameMatch && filenameMatch[1]) {
          actualFilename = filenameMatch[1].replace(/['"]/g, '')
        }
      }

      // Create and trigger download
      const url = window.URL.createObjectURL(response.data)
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', actualFilename)
      link.style.display = 'none'
      document.body.appendChild(link)
      link.click()

      // Cleanup
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      return true
    } catch (error) {
      console.error('Download error:', error)

      // Handle different error types
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

  // ============ NEW FEATURES ============

  // 1. Save Reading Progress (sync) - requires auth
  async saveReadingProgress(slug, progressData) {
    const response = await api.post(`/api/books/${slug}/progress`, {
      page: progressData.page,
      position: progressData.position,
      percentage: progressData.percentage,
      timestamp: progressData.timestamp || new Date().toISOString()
    })
    return response.data
  },

  // 2. Get Reading Progress - requires auth
  async getReadingProgress(slug) {
    const response = await api.get(`/api/books/${slug}/progress`)
    return response.data
  },

  // 3. Add Bookmark (sync) - requires auth
  async addBookmark(slug, bookmarkData) {
    const response = await api.post(`/api/books/${slug}/bookmarks`, {
      page: bookmarkData.page,
      position: bookmarkData.position,
      title: bookmarkData.title,
      note: bookmarkData.note
    })
    return response.data
  },

  // 4. Get Bookmarks - requires auth
  async getBookmarks(slug) {
    const response = await api.get(`/api/books/${slug}/bookmarks`)
    return response.data
  },

  // 5. Search in Book - requires auth
  async searchInBook(slug, query, page = 1, limit = 10) {
    const response = await api.get(`/api/books/${slug}/search`, {
      params: { query, page, limit }
    })
    return response.data
  },

  // 6. Add Highlight (sync) - requires auth
  async addHighlight(slug, highlightData) {
    const response = await api.post(`/api/books/${slug}/highlights`, {
      text: highlightData.text,
      startCfi: highlightData.startCfi,
      endCfi: highlightData.endCfi,
      color: highlightData.color,
      note: highlightData.note,
      page: highlightData.page
    })
    return response.data
  },

  // 7. Get Highlights - requires auth
  async getHighlights(slug) {
    const response = await api.get(`/api/books/${slug}/highlights`)
    return response.data
  },

  // 8. Add Note (sync) - requires auth
  async addNote(slug, noteData) {
    const response = await api.post(`/api/books/${slug}/notes`, {
      content: noteData.content,
      page: noteData.page,
      position: noteData.position,
      type: noteData.type || 'personal'
    })
    return response.data
  },

  // 9. Get Notes - requires auth
  async getNotes(slug) {
    const response = await api.get(`/api/books/${slug}/notes`)
    return response.data
  },

  // 10. Export Highlights & Notes - requires auth
  async exportHighlightsAndNotes(slug, format = 'PDF') {
    const response = await api.post(`/api/books/${slug}/export`, null, {
      params: { format }
    })
    return response.data
  },

  // 11. Translate Text (Free) - requires auth
  async translateText(slug, translationData) {
    const response = await api.post(`/api/books/${slug}/translate`, {
      text: translationData.text,
      targetLanguage: translationData.targetLanguage,
      sourceLanguage: translationData.sourceLanguage || 'auto'
    })
    return response.data
  },

  // 12. Get Dual Language View - requires auth
  async getDualLanguageView(slug, targetLanguage, page = 1) {
    const response = await api.get(`/api/books/${slug}/dual-language`, {
      params: { targetLanguage, page }
    })
    return response.data
  },

  // 13. Translate Highlight - requires auth
  async translateHighlight(slug, translateData) {
    const response = await api.post(`/api/books/${slug}/translate-highlight`, {
      highlightId: translateData.highlightId,
      targetLanguage: translateData.targetLanguage
    })
    return response.data
  },

  // 14. Add Reaction/Rating - requires auth
  async addReaction(slug, reactionData) {
    const response = await api.post(`/api/books/${slug}/reactions`, {
      type: reactionData.type, // 'like', 'love', 'wow', 'sad', 'angry'
      rating: reactionData.rating, // 1-5 stars
      comment: reactionData.comment
    })
    return response.data
  },

  // 15. Get Discussions - public/auth based on settings
  async getDiscussions(slug, page = 1, limit = 20) {
    const response = await api.get(`/api/books/${slug}/discussions`, {
      params: { page, limit }
    })
    return response.data
  },

  // Add Discussion - requires auth
  async addDiscussion(slug, discussionData) {
    const response = await api.post(`/api/books/${slug}/discussions`, {
      title: discussionData.title,
      content: discussionData.content,
      type: discussionData.type || 'general'
    })
    return response.data
  },

  // 16. Generate Text-to-Speech - requires auth
  async generateTextToSpeech(slug, ttsData) {
    const response = await api.post(`/api/books/${slug}/tts`, {
      text: ttsData.text,
      voice: ttsData.voice || 'default',
      speed: ttsData.speed || 1.0,
      language: ttsData.language || 'id-ID'
    })
    return response.data
  },

  // 17. Sync Audio with Text - requires auth
  async syncAudioWithText(slug, syncData) {
    const response = await api.post(`/api/books/${slug}/sync-audio`, {
      audioTimestamp: syncData.audioTimestamp,
      textPosition: syncData.textPosition,
      page: syncData.page
    })
    return response.data
  },

  // 18. Add Voice Note - requires auth
  async addVoiceNote(slug, audioFile, page, position) {
    const formData = new FormData()
    formData.append('audio', audioFile)
    formData.append('page', page.toString())
    if (position) formData.append('position', position)

    const response = await api.post(`/api/books/${slug}/voice-notes`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    return response.data
  },

  // Get Voice Notes - requires auth
  async getVoiceNotes(slug) {
    const response = await api.get(`/api/books/${slug}/voice-notes`)
    return response.data
  },

  // 19. Extract Vocabulary - requires auth
  async extractVocabulary(slug, vocabData) {
    const response = await api.post(`/api/books/${slug}/vocab-builder`, {
      difficulty: vocabData.difficulty || 'intermediate',
      language: vocabData.language || 'en',
      count: vocabData.count || 20
    })
    return response.data
  },

  // 20. Generate Chapter Summary - requires auth
  async generateChapterSummary(slug, summaryData) {
    const response = await api.post(`/api/books/${slug}/summary`, {
      chapter: summaryData.chapter,
      length: summaryData.length || 'medium', // short, medium, long
      style: summaryData.style || 'academic'
    })
    return response.data
  },

  // 21. Ask Question About Book - requires auth
  async askQuestionAboutBook(slug, qaData) {
    const response = await api.post(`/api/books/${slug}/qa`, {
      question: qaData.question,
      context: qaData.context || '',
      answerStyle: qaData.answerStyle || 'detailed'
    })
    return response.data
  },

  // 22. Add Comment to Note - requires auth
  async addCommentToNote(slug, noteId, commentData) {
    const response = await api.post(`/api/books/${slug}/notes/${noteId}/comments`, {
      content: commentData.content,
      parentCommentId: commentData.parentCommentId
    })
    return response.data
  },

  // 23. Generate Shareable Quote - requires auth
  async generateShareableQuote(slug, quoteData) {
    const response = await api.post(`/api/books/${slug}/share-quote`, {
      text: quoteData.text,
      page: quoteData.page,
      style: quoteData.style || 'modern',
      includeBookInfo: quoteData.includeBookInfo !== false
    })
    return response.data
  },

  // 24. Get Highlight Trends - requires auth
  async getHighlightTrends(slug) {
    const response = await api.get(`/api/books/${slug}/highlights/trends`)
    return response.data
  },

  // 25. Get Bookmark Suggestions - requires auth
  async getBookmarkSuggestions(slug) {
    const response = await api.get(`/api/books/${slug}/bookmark-suggest`)
    return response.data
  },

  // 26. Generate Chapter Quiz - requires auth
  async generateChapterQuiz(slug, quizData) {
    const response = await api.post(`/api/books/${slug}/quiz`, {
      chapter: quizData.chapter,
      difficulty: quizData.difficulty || 'medium',
      questionCount: quizData.questionCount || 5,
      type: quizData.type || 'mixed' // multiple-choice, true-false, mixed
    })
    return response.data
  },

  // 27. Generate AI Highlights - requires auth
  async generateAIHighlights(slug, aiData) {
    const response = await api.post(`/api/books/${slug}/ai-highlight`, {
      type: aiData.type || 'important', // important, quotes, definitions, themes
      chapter: aiData.chapter,
      limit: aiData.limit || 10
    })
    return response.data
  },

  // 28. Auto Tag Notes - requires auth
  async autoTagNotes(slug, taggingData) {
    const response = await api.post(`/api/books/${slug}/notes/tags`, {
      noteIds: taggingData.noteIds || [],
      autoGenerate: taggingData.autoGenerate !== false
    })
    return response.data
  },

  // 29. Process Voice Command - requires auth
  async processVoiceCommand(slug, audioFile) {
    const formData = new FormData()
    formData.append('audio', audioFile)

    const response = await api.post(`/api/books/${slug}/voice-control`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    return response.data
  },

  // 30. Create Collaborative Note - requires auth
  async createCollaborativeNote(slug, collabData) {
    const response = await api.post(`/api/books/${slug}/collab-notes`, {
      content: collabData.content,
      page: collabData.page,
      position: collabData.position,
      collaborators: collabData.collaborators || [],
      permissions: collabData.permissions || 'edit'
    })
    return response.data
  },

  // Get Collaborative Notes - requires auth
  async getCollaborativeNotes(slug) {
    const response = await api.get(`/api/books/${slug}/collab-notes`)
    return response.data
  },

  // ============ UTILITY FUNCTIONS ============

  // Delete bookmark - requires auth
  async deleteBookmark(slug, bookmarkId) {
    const response = await api.delete(`/api/books/${slug}/bookmarks/${bookmarkId}`)
    return response.data
  },

  // Delete highlight - requires auth
  async deleteHighlight(slug, highlightId) {
    const response = await api.delete(`/api/books/${slug}/highlights/${highlightId}`)
    return response.data
  },

  // Delete note - requires auth
  async deleteNote(slug, noteId) {
    const response = await api.delete(`/api/books/${slug}/notes/${noteId}`)
    return response.data
  },

  // Update highlight - requires auth
  async updateHighlight(slug, highlightId, updateData) {
    const response = await api.put(`/api/books/${slug}/highlights/${highlightId}`, updateData)
    return response.data
  },

  // Update note - requires auth
  async updateNote(slug, noteId, updateData) {
    const response = await api.put(`/api/books/${slug}/notes/${noteId}`, updateData)
    return response.data
  },

  // Get reading statistics - requires auth
  async getReadingStats(slug) {
    const response = await api.get(`/api/books/${slug}/stats`)
    return response.data
  }
}