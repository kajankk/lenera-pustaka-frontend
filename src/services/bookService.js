import api from "/src/utils/api.js";
import { API_ENDPOINTS, PAGINATION_DEFAULTS } from "/src/utils/constants.js"

export const bookService = {
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
  }
}