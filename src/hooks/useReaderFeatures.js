// hooks/useReaderFeatures.js
import { useState, useEffect, useCallback } from 'react'
import { bookService } from '../services/bookService'
import { useAuth } from '../context/AuthContext'

export const useReaderFeatures = (bookSlug) => {
  const { isAuthenticated } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // ============ READING PROGRESS ============
  const [readingProgress, setReadingProgress] = useState(null)

  const saveProgress = useCallback(async (progressData) => {
    if (!isAuthenticated || !bookSlug) return null

    try {
      const response = await bookService.saveReadingProgress(bookSlug, progressData)
      setReadingProgress(response.data)
      return response
    } catch (error) {
      console.error('Error saving progress:', error)
      setError('Gagal menyimpan progress')
      return null
    }
  }, [bookSlug, isAuthenticated])

  const loadProgress = useCallback(async () => {
    if (!isAuthenticated || !bookSlug) return null

    try {
      const response = await bookService.getReadingProgress(bookSlug)
      setReadingProgress(response.data)
      return response.data
    } catch (error) {
      console.error('Error loading progress:', error)
      return null
    }
  }, [bookSlug, isAuthenticated])

  // ============ BOOKMARKS ============
  const [bookmarks, setBookmarks] = useState([])

  const addBookmark = useCallback(async (bookmarkData) => {
    if (!isAuthenticated || !bookSlug) return null

    try {
      setLoading(true)
      const response = await bookService.addBookmark(bookSlug, bookmarkData)
      setBookmarks(prev => [...prev, response.data])
      return response
    } catch (error) {
      console.error('Error adding bookmark:', error)
      setError('Gagal menambahkan bookmark')
      return null
    } finally {
      setLoading(false)
    }
  }, [bookSlug, isAuthenticated])

  const loadBookmarks = useCallback(async () => {
    if (!isAuthenticated || !bookSlug) return []

    try {
      const response = await bookService.getBookmarks(bookSlug)
      setBookmarks(response.data || [])
      return response.data
    } catch (error) {
      console.error('Error loading bookmarks:', error)
      return []
    }
  }, [bookSlug, isAuthenticated])

  const deleteBookmark = useCallback(async (bookmarkId) => {
    if (!isAuthenticated || !bookSlug) return false

    try {
      await bookService.deleteBookmark(bookSlug, bookmarkId)
      setBookmarks(prev => prev.filter(b => b.id !== bookmarkId))
      return true
    } catch (error) {
      console.error('Error deleting bookmark:', error)
      setError('Gagal menghapus bookmark')
      return false
    }
  }, [bookSlug, isAuthenticated])

  // ============ HIGHLIGHTS ============
  const [highlights, setHighlights] = useState([])

  const addHighlight = useCallback(async (highlightData) => {
    if (!isAuthenticated || !bookSlug) return null

    try {
      setLoading(true)
      const response = await bookService.addHighlight(bookSlug, highlightData)
      setHighlights(prev => [...prev, response.data])
      return response
    } catch (error) {
      console.error('Error adding highlight:', error)
      setError('Gagal menambahkan highlight')
      return null
    } finally {
      setLoading(false)
    }
  }, [bookSlug, isAuthenticated])

  const loadHighlights = useCallback(async () => {
    if (!isAuthenticated || !bookSlug) return []

    try {
      const response = await bookService.getHighlights(bookSlug)
      setHighlights(response.data || [])
      return response.data
    } catch (error) {
      console.error('Error loading highlights:', error)
      return []
    }
  }, [bookSlug, isAuthenticated])

  const deleteHighlight = useCallback(async (highlightId) => {
    if (!isAuthenticated || !bookSlug) return false

    try {
      await bookService.deleteHighlight(bookSlug, highlightId)
      setHighlights(prev => prev.filter(h => h.id !== highlightId))
      return true
    } catch (error) {
      console.error('Error deleting highlight:', error)
      setError('Gagal menghapus highlight')
      return false
    }
  }, [bookSlug, isAuthenticated])

  // ============ NOTES ============
  const [notes, setNotes] = useState([])

  const addNote = useCallback(async (noteData) => {
    if (!isAuthenticated || !bookSlug) return null

    try {
      setLoading(true)
      const response = await bookService.addNote(bookSlug, noteData)
      setNotes(prev => [...prev, response.data])
      return response
    } catch (error) {
      console.error('Error adding note:', error)
      setError('Gagal menambahkan catatan')
      return null
    } finally {
      setLoading(false)
    }
  }, [bookSlug, isAuthenticated])

  const loadNotes = useCallback(async () => {
    if (!isAuthenticated || !bookSlug) return []

    try {
      const response = await bookService.getNotes(bookSlug)
      setNotes(response.data || [])
      return response.data
    } catch (error) {
      console.error('Error loading notes:', error)
      return []
    }
  }, [bookSlug, isAuthenticated])

  const deleteNote = useCallback(async (noteId) => {
    if (!isAuthenticated || !bookSlug) return false

    try {
      await bookService.deleteNote(bookSlug, noteId)
      setNotes(prev => prev.filter(n => n.id !== noteId))
      return true
    } catch (error) {
      console.error('Error deleting note:', error)
      setError('Gagal menghapus catatan')
      return false
    }
  }, [bookSlug, isAuthenticated])

  // ============ SEARCH IN BOOK ============
  const [searchResults, setSearchResults] = useState(null)
  const [searching, setSearching] = useState(false)

  const searchInBook = useCallback(async (query, page = 1, limit = 10) => {
    if (!isAuthenticated || !bookSlug || !query.trim()) return null

    try {
      setSearching(true)
      const response = await bookService.searchInBook(bookSlug, query.trim(), page, limit)
      setSearchResults(response.data)
      return response.data
    } catch (error) {
      console.error('Error searching in book:', error)
      setError('Gagal mencari dalam buku')
      return null
    } finally {
      setSearching(false)
    }
  }, [bookSlug, isAuthenticated])

  // ============ TRANSLATION ============
  const [translations, setTranslations] = useState(new Map())

  const translateText = useCallback(async (text, targetLanguage = 'id') => {
    if (!isAuthenticated || !bookSlug || !text.trim()) return null

    const cacheKey = `${text}_${targetLanguage}`
    if (translations.has(cacheKey)) {
      return translations.get(cacheKey)
    }

    try {
      const response = await bookService.translateText(bookSlug, {
        text: text.trim(),
        targetLanguage
      })

      const translationData = response.data
      setTranslations(prev => new Map(prev).set(cacheKey, translationData))
      return translationData
    } catch (error) {
      console.error('Error translating text:', error)
      setError('Gagal menerjemahkan teks')
      return null
    }
  }, [bookSlug, isAuthenticated, translations])

  // ============ VOICE FEATURES ============
  const [voiceNotes, setVoiceNotes] = useState([])
  const [isRecording, setIsRecording] = useState(false)

  const addVoiceNote = useCallback(async (audioFile, page, position) => {
    if (!isAuthenticated || !bookSlug) return null

    try {
      setLoading(true)
      const response = await bookService.addVoiceNote(bookSlug, audioFile, page, position)
      setVoiceNotes(prev => [...prev, response.data])
      return response
    } catch (error) {
      console.error('Error adding voice note:', error)
      setError('Gagal menambahkan catatan suara')
      return null
    } finally {
      setLoading(false)
    }
  }, [bookSlug, isAuthenticated])

  const loadVoiceNotes = useCallback(async () => {
    if (!isAuthenticated || !bookSlug) return []

    try {
      const response = await bookService.getVoiceNotes(bookSlug)
      setVoiceNotes(response.data || [])
      return response.data
    } catch (error) {
      console.error('Error loading voice notes:', error)
      return []
    }
  }, [bookSlug, isAuthenticated])

  // ============ AI FEATURES ============
  const generateSummary = useCallback(async (chapter, options = {}) => {
    if (!isAuthenticated || !bookSlug) return null

    try {
      setLoading(true)
      const response = await bookService.generateChapterSummary(bookSlug, {
        chapter,
        length: options.length || 'medium',
        style: options.style || 'academic'
      })
      return response.data
    } catch (error) {
      console.error('Error generating summary:', error)
      setError('Gagal membuat rangkuman')
      return null
    } finally {
      setLoading(false)
    }
  }, [bookSlug, isAuthenticated])

  const askQuestion = useCallback(async (question, context = '') => {
    if (!isAuthenticated || !bookSlug || !question.trim()) return null

    try {
      setLoading(true)
      const response = await bookService.askQuestionAboutBook(bookSlug, {
        question: question.trim(),
        context,
        answerStyle: 'detailed'
      })
      return response.data
    } catch (error) {
      console.error('Error asking question:', error)
      setError('Gagal mendapatkan jawaban')
      return null
    } finally {
      setLoading(false)
    }
  }, [bookSlug, isAuthenticated])

  const generateQuiz = useCallback(async (chapter, options = {}) => {
    if (!isAuthenticated || !bookSlug) return null

    try {
      setLoading(true)
      const response = await bookService.generateChapterQuiz(bookSlug, {
        chapter,
        difficulty: options.difficulty || 'medium',
        questionCount: options.questionCount || 5,
        type: options.type || 'mixed'
      })
      return response.data
    } catch (error) {
      console.error('Error generating quiz:', error)
      setError('Gagal membuat kuis')
      return null
    } finally {
      setLoading(false)
    }
  }, [bookSlug, isAuthenticated])

  // ============ EXPORT FEATURES ============
  const exportHighlightsAndNotes = useCallback(async (format = 'PDF') => {
    if (!isAuthenticated || !bookSlug) return null

    try {
      setLoading(true)
      const response = await bookService.exportHighlightsAndNotes(bookSlug, format)
      return response.data
    } catch (error) {
      console.error('Error exporting:', error)
      setError('Gagal mengekspor data')
      return null
    } finally {
      setLoading(false)
    }
  }, [bookSlug, isAuthenticated])

  // ============ INITIALIZATION ============
  useEffect(() => {
    if (isAuthenticated && bookSlug) {
      loadProgress()
      loadBookmarks()
      loadHighlights()
      loadNotes()
      loadVoiceNotes()
    }
  }, [bookSlug, isAuthenticated, loadProgress, loadBookmarks, loadHighlights, loadNotes, loadVoiceNotes])

  // Clear error after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(''), 5000)
      return () => clearTimeout(timer)
    }
  }, [error])

  return {
    // States
    loading,
    error,
    isAuthenticated,

    // Reading Progress
    readingProgress,
    saveProgress,
    loadProgress,

    // Bookmarks
    bookmarks,
    addBookmark,
    loadBookmarks,
    deleteBookmark,

    // Highlights
    highlights,
    addHighlight,
    loadHighlights,
    deleteHighlight,

    // Notes
    notes,
    addNote,
    loadNotes,
    deleteNote,

    // Search
    searchResults,
    searching,
    searchInBook,

    // Translation
    translateText,
    translations,

    // Voice Features
    voiceNotes,
    isRecording,
    setIsRecording,
    addVoiceNote,
    loadVoiceNotes,

    // AI Features
    generateSummary,
    askQuestion,
    generateQuiz,

    // Export
    exportHighlightsAndNotes,

    // Utility
    clearError: () => setError('')
  }
}