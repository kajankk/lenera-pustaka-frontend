import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { bookService } from '../../services/bookService'
import { useTheme } from '../../hooks/useTheme'
import { useAuth } from '../../context/AuthContext'
import { useDiscussions } from '../../hooks/useDiscussions'
import BookReactions from './BookReactions'
import BookDiscussions from './BookDiscussions'
import BookAnalytics from './BookAnalytics'
import BookExportModal from './BookExportModal'

const BookDetail = ({ book }) => {
  const navigate = useNavigate()
  const { theme } = useTheme()
  const { isAuthenticated, user } = useAuth()
  const { discussions } = useDiscussions(book.slug)

  const [state, setState] = useState({
    isDownloading: false,
    activeTab: 'description',
    showExportModal: false,
    userReaction: null,
    bookStats: { highlights: 0, notes: 0, bookmarks: 0, reactions: 0 },
    aiInsights: null
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

  // Event handlers
  const handleStartReading = () => navigate(`/${book.slug}/read`)

  const handleDownload = async () => {
    if (state.isDownloading) return
    setState(prev => ({ ...prev, isDownloading: true }))

    try {
      const filename = `${book.title.replace(/[^a-zA-Z0-9\s-]/g, '').replace(/\s+/g, '_')}.epub`
      await bookService.downloadBook(book.slug, filename)
      alert('Buku berhasil diunduh!')
    } catch (error) {
      console.error('Error downloading book:', error)
      alert(error.message || 'Gagal mengunduh ebook. Silakan coba lagi.')
    } finally {
      setState(prev => ({ ...prev, isDownloading: false }))
    }
  }

  const handleReaction = async (type, rating = null, comment = '') => {
    if (!isAuthenticated) return alert('Silakan login untuk memberikan reaksi')

    try {
      const response = await bookService.addReaction(book.slug, { type, rating, comment })
      setState(prev => ({
        ...prev,
        userReaction: response.data,
        bookStats: { ...prev.bookStats, reactions: prev.bookStats.reactions + 1 }
      }))
    } catch (error) {
      console.error('Error adding reaction:', error)
      alert('Gagal menambahkan reaksi')
    }
  }

  // Data loading
  const loadData = async () => {
    if (!isAuthenticated) return

    try {
      const [highlightsRes, notesRes, bookmarksRes, trendsRes, suggestionsRes] = await Promise.all([
        bookService.getHighlights(book.slug),
        bookService.getNotes(book.slug),
        bookService.getBookmarks(book.slug),
        bookService.getHighlightTrends(book.slug),
        bookService.getBookmarkSuggestions(book.slug)
      ])

      setState(prev => ({
        ...prev,
        bookStats: {
          highlights: highlightsRes.data?.length || 0,
          notes: notesRes.data?.length || 0,
          bookmarks: bookmarksRes.data?.length || 0,
          reactions: book.reactionCount || 0
        },
        aiInsights: {
          trends: trendsRes.data,
          suggestions: suggestionsRes.data
        }
      }))
    } catch (error) {
      console.error('Error loading data:', error)
    }
  }

  useEffect(() => {
    if (isAuthenticated && book.slug) loadData()
  }, [isAuthenticated, book.slug])

  const tabs = [
    { id: 'description', label: 'Deskripsi', icon: '📄' },
    { id: 'metadata', label: 'Info Detail', icon: 'ℹ️' },
    { id: 'discussions', label: `Diskusi (${discussions.length})`, icon: '💬' },
    { id: 'analytics', label: 'Analitik', icon: '📊' }
  ]

  const metadataItems = [
    { label: 'Penerbit', value: book.publisher },
    { label: 'Tahun Terbit', value: book.publicationYear },
    { label: 'ISBN', value: book.isbn },
    { label: 'Bahasa', value: book.language },
    { label: 'Jumlah Halaman', value: book.totalPages > 0 ? formatNumber(book.totalPages) : null },
    { label: 'Jumlah Kata', value: book.totalWord > 0 ? formatNumber(book.totalWord) : null },
    { label: 'Estimasi Waktu Baca', value: formatReadingTime(book.estimatedReadTime) },
    { label: 'Level Kesulitan', value: getDifficultyLabel(book.difficultyLevel) },
    { label: 'Ukuran File', value: formatFileSize(book.fileSize) }
  ].filter(item => item.value)

  return (
    <div className="book-detail-container">
      <button className="btn btn-secondary" onClick={() => navigate('/books')}>
        ← Kembali
      </button>

      <div className="book-detail-main">
        {/* Cover & Actions */}
        <div className="book-cover-section">
          <div className="book-cover-wrapper">
            {book.coverImageUrl ? (
              <img src={book.coverImageUrl} alt={`Cover ${book.title}`} className="book-cover-image" loading="lazy" />
            ) : (
              <div className="book-cover-placeholder">
                <div className="placeholder-icon">📚</div>
                <div className="placeholder-text">Cover EPUB</div>
              </div>
            )}
          </div>

          <div className="book-actions">
            <button className="btn btn-primary btn-action" onClick={handleStartReading}>
              <span>📖</span><span>Mulai Membaca</span>
            </button>
            <button className="btn btn-secondary btn-action" onClick={handleDownload} disabled={state.isDownloading}>
              <span>{state.isDownloading ? '⏳' : '💾'}</span>
              <span>{state.isDownloading ? 'Mengunduh...' : 'Unduh EPUB'}</span>
            </button>

            <div className="book-quick-stats">
              {[
                { label: 'Dilihat', value: book.viewCount },
                { label: 'Diunduh', value: book.downloadCount },
                { label: 'Rating', value: book.averageRating ? `${book.averageRating.toFixed(1)}/5` : 'N/A' }
              ].map(stat => (
                <div key={stat.label} className="stat-item">
                  <div className="stat-label">{stat.label}</div>
                  <div className="stat-value">{typeof stat.value === 'number' ? formatNumber(stat.value) : stat.value}</div>
                </div>
              ))}
            </div>

            {isAuthenticated && (
              <div className="user-reading-stats card">
                <h4 style={{ fontSize: '0.9rem', marginBottom: '0.75rem', color: theme === 'dark' ? 'var(--primary-pink)' : 'var(--primary-green)' }}>
                  Aktivitas Anda
                </h4>
                <div className="stats-grid">
                  {[
                    { icon: '🖍️', count: state.bookStats.highlights, label: 'Highlight' },
                    { icon: '📝', count: state.bookStats.notes, label: 'Catatan' },
                    { icon: '🔖', count: state.bookStats.bookmarks, label: 'Bookmark' }
                  ].map(stat => (
                    <div key={stat.label} className="stat-item">
                      <div className="stat-icon">{stat.icon}</div>
                      <div className="stat-count">{stat.count}</div>
                      <div className="stat-label">{stat.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Book Info */}
        <div className="book-info-section">
          <div className="book-header">
            <h1 className="book-title" style={{ color: theme === 'dark' ? 'var(--primary-pink)' : 'var(--primary-green)' }}>
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
                  <span key={genre.id} className="genre-tag" style={{ backgroundColor: genre.colorHex + '20', color: genre.colorHex }}>
                    {genre.name}
                  </span>
                ))}
              </div>
            )}

            {isAuthenticated && (
              <BookReactions bookSlug={book.slug} userReaction={state.userReaction} onReaction={handleReaction} />
            )}
          </div>

          <div className="book-tabs">
            {tabs.map(tab => (
              <button key={tab.id} className={`btn btn-secondary btn-small ${state.activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setState(prev => ({ ...prev, activeTab: tab.id }))}>
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>

          <div className="book-tab-content">
            {state.activeTab === 'description' && book.description && (
              <div className="book-description"><h3>Deskripsi</h3><p>{book.description}</p></div>
            )}

            {state.activeTab === 'metadata' && (
              <div className="book-metadata">
                <h3>Informasi Detail</h3>
                <div className="metadata-items">
                  {metadataItems.map(item => (
                    <div key={item.label} className="metadata-item">
                      <span className="meta-label">{item.label}:</span>
                      <span className="meta-value">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {state.activeTab === 'discussions' && <BookDiscussions bookSlug={book.slug} />}
            {state.activeTab === 'analytics' && (
              <BookAnalytics book={book} bookStats={state.bookStats} aiInsights={state.aiInsights} isAuthenticated={isAuthenticated} />
            )}
          </div>
        </div>
      </div>

      {state.showExportModal && (
        <BookExportModal bookSlug={book.slug} bookTitle={book.title}
          onClose={() => setState(prev => ({ ...prev, showExportModal: false }))} />
      )}
    </div>
  )
}

export default BookDetail