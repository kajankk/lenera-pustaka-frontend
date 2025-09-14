import api from '../utils/api';
import { API_ENDPOINTS, PAGINATION_DEFAULTS } from '../utils/constants'

export const bookService = {
  // Get paginated books
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

  // Get book detail by slug
  async getBookDetail(slug) {
    const response = await api.get(API_ENDPOINTS.BOOK_DETAIL(slug))
    return response.data
  },

  // Start reading a book
  async startReading(slug) {
    const response = await api.get(API_ENDPOINTS.BOOK_READ(slug))
    return response.data
  },

  // Create new book (for admin/upload)
  async createBook(formData) {
    const response = await api.post(API_ENDPOINTS.BOOKS, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    return response.data
  },

  // Update book
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

  // Delete book
  async deleteBook(id) {
    const response = await api.delete(API_ENDPOINTS.BOOKS, {
      params: { id }
    })
    return response.data
  },

  // Download book
  async downloadBook(bookId, filename = 'book.epub') {
    const response = await api.get(API_ENDPOINTS.BOOK_DOWNLOAD, {
      params: { id: bookId },
      responseType: 'blob'
    })

    // Create download link
    const url = window.URL.createObjectURL(new Blob([response.data]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', filename)
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(url)

    return true
  }
}