// hooks/useDiscussions.js
import { useState, useEffect, useCallback } from 'react'
import { bookService } from '../services/bookService'
import { useAuth } from '../context/AuthContext'

export const useDiscussions = (bookSlug) => {
  const { isAuthenticated } = useAuth()
  const [discussions, setDiscussions] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)

  const loadDiscussions = useCallback(async (page = 1, append = false) => {
    if (!bookSlug) return

    try {
      setLoading(true)
      const response = await bookService.getDiscussions(bookSlug, page, 20)
      const newDiscussions = response.data || []

      if (append) {
        setDiscussions(prev => [...prev, ...newDiscussions])
      } else {
        setDiscussions(newDiscussions)
      }

      setHasMore(newDiscussions.length === 20)
      setCurrentPage(page)
    } catch (error) {
      console.error('Error loading discussions:', error)
      setError('Gagal memuat diskusi')
    } finally {
      setLoading(false)
    }
  }, [bookSlug])

  const addDiscussion = useCallback(async (discussionData) => {
    if (!isAuthenticated || !bookSlug) return null

    try {
      setLoading(true)
      const response = await bookService.addDiscussion(bookSlug, discussionData)
      setDiscussions(prev => [response.data, ...prev])
      return response
    } catch (error) {
      console.error('Error adding discussion:', error)
      setError('Gagal menambahkan diskusi')
      return null
    } finally {
      setLoading(false)
    }
  }, [bookSlug, isAuthenticated])

  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      loadDiscussions(currentPage + 1, true)
    }
  }, [loading, hasMore, currentPage, loadDiscussions])

  useEffect(() => {
    if (bookSlug) {
      loadDiscussions(1)
    }
  }, [bookSlug, loadDiscussions])

  return {
    discussions,
    loading,
    error,
    hasMore,
    addDiscussion,
    loadMore,
    refresh: () => loadDiscussions(1),
    clearError: () => setError('')
  }
}