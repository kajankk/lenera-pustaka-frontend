import { useState, useEffect, useCallback } from 'react'
import { bookService } from '../services/bookService'

export const useBooks = (initialParams = {}) => {
  const [books, setBooks] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    limit: 12,
    total: 0
  })
  const [currentSearchParams, setCurrentSearchParams] = useState(initialParams)

  const fetchBooks = useCallback(async (params = {}, page = 1) => {
    setLoading(true)
    setError('')

    try {
      console.log('Fetching books with params:', { ...params, page, limit: pagination.limit })

      const response = await bookService.getBooks({
        ...params,
        page: page,
        limit: pagination.limit
      })

      console.log('API Response:', response)

      // Validasi response structure
      if (!response.data) {
        throw new Error('Invalid API response structure')
      }

      const booksData = Array.isArray(response.data.list) ? response.data.list : []
      const total = response.data.total || 0
      const limit = response.data.limit || 12
      const currentPage = response.data.page || page

      console.log(`Loaded ${booksData.length} books, total: ${total}, page: ${currentPage}`)

      setBooks(booksData)
      setPagination({
        currentPage: currentPage,
        totalPages: Math.ceil(total / limit),
        total: total,
        limit: limit
      })

      // Update current search params
      setCurrentSearchParams(params)

    } catch (err) {
      setError(err.message || 'Gagal memuat daftar ebook')
      setBooks([])
      console.error('Error fetching books:', err)
    } finally {
      setLoading(false)
    }
  }, [pagination.limit])

  const searchBooks = useCallback((searchParams) => {
    console.log('Searching books with params:', searchParams)
    fetchBooks(searchParams, 1)
  }, [fetchBooks])

  const goToPage = useCallback((page) => {
    console.log('Going to page:', page, 'with params:', currentSearchParams)
    fetchBooks(currentSearchParams, page)
  }, [fetchBooks, currentSearchParams])

  const refetch = useCallback(() => {
    fetchBooks(currentSearchParams, pagination.currentPage)
  }, [fetchBooks, currentSearchParams, pagination.currentPage])

  // Initial load
  useEffect(() => {
    fetchBooks(initialParams, 1)
  }, []) // Hapus dependency fetchBooks untuk menghindari loop

  return {
    books,
    loading,
    error,
    pagination,
    searchBooks,
    goToPage,
    refetch
  }
}