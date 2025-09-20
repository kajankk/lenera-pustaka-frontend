import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { bookService } from '../../services/bookService'
import { useTheme } from '../../hooks/useTheme'
import { useAuth } from '../../context/AuthContext'
import BookReactions from './BookReactions'
import BookDiscussions from './BookDiscussions'
import BookAnalytics from './BookAnalytics'

const BookDetail = ({ book }) => {
  const navigate = useNavigate()
  const { theme } = useTheme()
  const { isAuthenticated, user } = useAuth()

  const [state, setState] = useState({
    isDownloading: false,
    activeTab: 'description',
    showExportModal: false,
    userReaction: null,
    bookStats: { highlights: 0, notes: 0, bookmarks: 0, reactions: 0 },
    reactionStats: null,
    discussions: [],
    loadingStats: false,
    loadingDiscussions: false,
    notification: null,
    discussionCount: 0
  })

  // Utility functions
  const formatFileSize = (bytes) => bytes ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : 'N/A'
  const formatReadingTime = (minutes) => {
    if (!minutes) return 'N/A'
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return hours > 0 ? `${hours} jam ${mins > 0 ? `${mins} menit` : ''}` : `${minutes} menit`
  }
  const getDifficultyLabel = (level) => {
    if (!level) return 'N/A'
    const labels = ['Mudah', 'Sedang', 'Sulit', 'Sangat Sulit']
    const index = level <= 3 ? 0 : level <= 6 ? 1 : level <= 8 ? 2 : 3
    return `${labels[index]} (${level}/10)`
  }
  const formatNumber = (num) => num?.toLocaleString('id-ID') || '0'

  // Notification system
  const showNotification = (message, type = 'info') => {
    setState(prev => ({
      ...prev,
      notification: { message, type, id: Date.now() }
    }))

    setTimeout(() => {
      setState(prev => ({
        ...prev,
        notification: null
      }))
    }, 4000)
  }

  // Event handlers
  const handleStartReading = () => navigate(`/${book.slug}/read`)

  const handleDownload = async () => {
    if (state.isDownloading) return
    setState(prev => ({ ...prev, isDownloading: true }))

    try {
      const filename = `${book.title.replace(/[^a-zA-Z0-9\s-]/g, '').replace(/\s+/g, '_')}.epub`
      await bookService.downloadBook(book.slug, filename)
      showNotification('Buku berhasil diunduh!', 'success')

      // Update download count in book object
      book.downloadCount = (book.downloadCount || 0) + 1
    } catch (error) {
      console.error('Error downloading book:', error)
      showNotification(error.message || 'Gagal mengunduh ebook. Silakan coba lagi.', 'error')
    } finally {
      setState(prev => ({ ...prev, isDownloading: false }))
    }
  }

  // Data loading functions
  const loadUserStats = useCallback(async () => {
    if (!isAuthenticated) return

    try {
      const [highlightsRes, notesRes, bookmarksRes] = await Promise.allSettled([
        bookService.getHighlights(book.slug),
        bookService.getNotes(book.slug),
        bookService.getBookmarks(book.slug)
      ])

      setState(prev => ({
        ...prev,
        bookStats: {
          ...prev.bookStats,
          highlights: highlightsRes.status === 'fulfilled' ? highlightsRes.value.data?.length || 0 : 0,
          notes: notesRes.status === 'fulfilled' ? notesRes.value.data?.length || 0 : 0,
          bookmarks: bookmarksRes.status === 'fulfilled' ? bookmarksRes.value.data?.length || 0 : 0
        }
      }))
    } catch (error) {
      console.error('Error loading user stats:', error)
    }
  }, [isAuthenticated, book.slug])

  const loadReactionStats = useCallback(async () => {
    try {
      const response = await bookService.getReactionStats(book.slug)
      const stats = response.data

      setState(prev => ({
        ...prev,
        reactionStats: stats,
        bookStats: {
          ...prev.bookStats,
          reactions: stats?.total || 0
        }
      }))

      // Update book's reaction count if available
      if (stats?.total) {
        book.reactionCount = stats.total
      }
    } catch (error) {
      console.error('Error loading reaction stats:', error)
    }
  }, [book.slug])

  // Load discussions from reactions with comments
  const loadDiscussions = useCallback(async () => {
    setState(prev => ({ ...prev, loadingDiscussions: true }))

    try {
      const response = await bookService.getReactions(book.slug, 1, 50)
      const reactionsWithComments = response.data?.filter(reaction =>
        reaction.comment && reaction.comment.trim() !== ''
      ) || []

      setState(prev => ({
        ...prev,
        discussions: reactionsWithComments,
        discussionCount: reactionsWithComments.length,
        loadingDiscussions: false
      }))
    } catch (error) {
      console.error('Error loading discussions:', error)
      setState(prev => ({
        ...prev,
        discussions: [],
        discussionCount: 0,
        loadingDiscussions: false
      }))
    }
  }, [book.slug])

  const loadUserReaction = useCallback(async () => {
    if (!isAuthenticated) return

    try {
      // Check if user has any reaction by getting all reactions and finding current user's
      const response = await bookService.getReactions(book.slug, 1, 50)
      const userReaction = response.data?.find(reaction =>
        reaction.user?.id === user?.id || reaction.userId === user?.id
      )

      setState(prev => ({
        ...prev,
        userReaction: userReaction || null
      }))
    } catch (error) {
      setState(prev => ({
        ...prev,
        userReaction: null
      }))
    }
  }, [isAuthenticated, book.slug, user?.id])

  const loadAllData = useCallback(async () => {
    setState(prev => ({ ...prev, loadingStats: true }))

    try {
      await Promise.all([
        loadUserStats(),
        loadReactionStats(),
        loadDiscussions(),
        loadUserReaction()
      ])
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setState(prev => ({ ...prev, loadingStats: false }))
    }
  }, [loadUserStats, loadReactionStats, loadDiscussions, loadUserReaction])

  // Handle reaction with proper state updates
  const handleReaction = async (type, rating = null, comment = '') => {
    if (!isAuthenticated) {
      showNotification('Silakan login untuk memberikan reaksi', 'warning')
      return
    }

    try {
      const response = await bookService.addReaction(book.slug, { type, rating, comment })

      setState(prev => ({
        ...prev,
        userReaction: response.data
      }))

      // Reload all relevant data after adding reaction
      await Promise.all([
        loadReactionStats(),
        loadDiscussions() // This will update discussion count automatically
      ])

      showNotification('Reaksi berhasil ditambahkan!', 'success')
    } catch (error) {
      console.error('Error adding reaction:', error)
      showNotification(error.message || 'Gagal menambahkan reaksi', 'error')
    }
  }

  // Load data on component mount and authentication changes
  useEffect(() => {
    if (book.slug) {
      loadAllData()
    }
  }, [book.slug, loadAllData])

  const tabs = [
    { id: 'description', label: 'Deskripsi', icon: '📄' },
    { id: 'metadata', label: 'Info Detail', icon: 'ℹ️' },
    { id: 'discussions', label: `Diskusi (${state.discussionCount})`, icon: '💬' },
    { id: 'analytics', label: 'Analitik', icon: '📊' }
  ]

  return (
    <div className="book-detail-container">
      {/* Notification */}
      {state.notification && (
        <div className={`notification notification-${state.notification.type}`}>
          <div className="notification-content">
            <span className="notification-icon">
              {state.notification.type === 'success' && '✅'}
              {state.notification.type === 'error' && '❌'}
              {state.notification.type === 'warning' && '⚠️'}
              {state.notification.type === 'info' && 'ℹ️'}
            </span>
            <span className="notification-message">{state.notification.message}</span>
          </div>
        </div>
      )}

      <button className="btn btn-secondary" onClick={() => navigate('/books')}>
        ← Kembali
      </button>

      <div className="book-detail-main">
        {/* Cover & Actions */}
        <div className="book-cover-section">
          <div className="book-cover-wrapper">
            {book.coverImageUrl ? (
              <img
                src={book.coverImageUrl}
                alt={`Cover ${book.title}`}
                className="book-cover-image"
                loading="lazy"
              />
            ) : (
              <div className="book-cover-placeholder">
                <div className="placeholder-icon">📚</div>
                <div className="placeholder-text">Cover EPUB</div>
              </div>
            )}
          </div>

          <div className="book-actions">
            <button className="btn btn-primary btn-action" onClick={handleStartReading}>
              <span>📖</span>
              <span>Mulai Membaca</span>
            </button>

            <button
              className="btn btn-secondary btn-action"
              onClick={handleDownload}
              disabled={state.isDownloading}
            >
              <span>{state.isDownloading ? '⏳' : '💾'}</span>
              <span>{state.isDownloading ? 'Mengunduh...' : 'Unduh EPUB'}</span>
            </button>

            <div className="book-quick-stats">
              {[
                { label: 'Dilihat', value: book.viewCount || 0 },
                { label: 'Diunduh', value: book.downloadCount || 0 },
                { label: 'Rating', value: book.averageRating ? `${book.averageRating.toFixed(1)}/5` : 'Belum ada' }
              ].map(stat => (
                <div key={stat.label} className="stat-item">
                  <div className="stat-label">{stat.label}</div>
                  <div className="stat-value">
                    {typeof stat.value === 'number' ? formatNumber(stat.value) : stat.value}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Book Info */}
        <div className="book-info-section">
          <div className="book-header">
            <h1 className="book-title" style={{
              color: theme === 'dark' ? 'var(--primary-pink)' : 'var(--primary-green)'
            }}>
              {book.title}
            </h1>

            {book.authors?.length > 0 && (
              <div className="book-authors">
                <span>oleh </span>
                {book.authors.map((author, index) => (
                  <span key={author.id} className="author-name">
                    {author.name}{index < book.authors.length - 1 && ', '}
                  </span>
                ))}
              </div>
            )}

            {book.genres?.length > 0 && (
              <div className="book-genres">
                {book.genres.map(genre => (
                  <span
                    key={genre.id}
                    className="genre-tag"
                    style={{
                      backgroundColor: genre.colorHex + '20',
                      color: genre.colorHex
                    }}
                  >
                    {genre.name}
                  </span>
                ))}
              </div>
            )}

            {isAuthenticated && (
              <BookReactions
                bookSlug={book.slug}
                userReaction={state.userReaction}
                onReaction={handleReaction}
                reactionStats={state.reactionStats}
              />
            )}
          </div>

          <div className="book-tabs">
            {tabs.map(tab => (
              <button
                key={tab.id}
                className={`btn btn-secondary btn-small ${state.activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setState(prev => ({ ...prev, activeTab: tab.id }))}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>

          <div className="book-tab-content">
            {state.activeTab === 'description' && book.description && (
              <div className="book-description">
                <h3>Deskripsi</h3>
                <p>{book.description}</p>
              </div>
            )}

            {state.activeTab === 'metadata' && (
              <div className="book-metadata">
                <h3>Informasi Detail</h3>
                <div className="metadata-items">
                  {[
                    { label: 'Penerbit', value: book.publisher },
                    { label: 'Tahun Terbit', value: book.publicationYear },
                    { label: 'ISBN', value: book.isbn },
                    { label: 'Bahasa', value: book.language },
                    { label: 'Jumlah Halaman', value: book.totalPages > 0 ? formatNumber(book.totalPages) : null },
                    { label: 'Jumlah Kata', value: book.totalWord > 0 ? formatNumber(book.totalWord) : null },
                    { label: 'Estimasi Waktu Baca', value: formatReadingTime(book.estimatedReadTime) },
                    { label: 'Level Kesulitan', value: getDifficultyLabel(book.difficultyLevel) },
                    { label: 'Ukuran File', value: formatFileSize(book.fileSize) }
                  ].filter(item => item.value && item.value !== 'N/A').map(item => (
                    <div key={item.label} className="metadata-item">
                      <span className="meta-label">{item.label}:</span>
                      <span className="meta-value">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {state.activeTab === 'discussions' && (
              <BookDiscussions
                bookSlug={book.slug}
                discussions={state.discussions}
                loading={state.loadingDiscussions}
                onDiscussionUpdate={loadDiscussions}
              />
            )}

            {state.activeTab === 'analytics' && (
              <BookAnalytics
                book={book}
                bookStats={state.bookStats}
                reactionStats={state.reactionStats}
                isAuthenticated={isAuthenticated}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default BookDetail