// hooks/useVocabulary.js
import { useState, useCallback } from 'react'
import { bookService } from '../services/bookService'
import { useAuth } from '../context/AuthContext'

export const useVocabulary = (bookSlug) => {
  const { isAuthenticated } = useAuth()
  const [vocabulary, setVocabulary] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const extractVocabulary = useCallback(async (options = {}) => {
    if (!isAuthenticated || !bookSlug) return null

    try {
      setLoading(true)
      const response = await bookService.extractVocabulary(bookSlug, {
        difficulty: options.difficulty || 'intermediate',
        language: options.language || 'en',
        count: options.count || 20
      })
      setVocabulary(response.data?.words || [])
      return response.data
    } catch (error) {
      console.error('Error extracting vocabulary:', error)
      setError('Gagal mengekstrak kosakata')
      return null
    } finally {
      setLoading(false)
    }
  }, [bookSlug, isAuthenticated])

  return {
    vocabulary,
    loading,
    error,
    extractVocabulary,
    clearError: () => setError('')
  }
}