import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { bookService } from '../../services/bookService'
import { useTheme } from '../../hooks/useTheme'
import { useAuth } from '../../context/AuthContext'
import { useDiscussions } from '../../hooks/useDiscussions'
import { useVocabulary } from '../../hooks/useVocabulary'

// New feature components
import BookReactions from './BookReactions'
import BookDiscussions from './BookDiscussions'
import BookAnalytics from './BookAnalytics'
import BookExportModal from './BookExportModal'

const BookDetail = ({ book }) => {
  const navigate = useNavigate()
  const { theme } = useTheme()
  const { isAuthenticated, user } = useAuth()
  const [isDownloading, setIsDownloading] = useState(false)
  const [activeTab, setActiveTab] = useState('description')
  const [showExportModal, setShowExportModal] = useState(false)

  // New feature states
  const [userReaction, setUserReaction] = useState(null)
  const [bookStats, setBookStats] = useState({
    highlights: 0,
    notes: 0,
    bookmarks: 0,
    reactions: 0
  })
  const [aiInsights, setAIInsights] = useState(null)
  const [vocabularyData, setVocabularyData] = useState(null)

  const { discussions } = useDiscussions(book.slug)
  const { vocabulary, extractVocabulary } = useVocabulary(book.slug)

  const handleStartReading = () => navigate(`/${book.slug}/read`)

  const handleDownload = async () => {
    if (isDownloading) return

    setIsDownloading(true)
    try {
      const sanitizedTitle = book.title.replace(/[^a-zA-Z0-9\s-]/g, '').replace(/\s+/g, '_')
      const filename = `${sanitizedTitle}.epub`

      await bookService.downloadBook(book.slug, filename)
      alert('Buku berhasil diunduh!')
    } catch (error) {
      console.error('Error downloading book:', error)
      alert(error.message || 'Gagal mengunduh ebook. Silakan coba lagi.')
    } finally {
      setIsDownloading(false)
    }
  }

  const handleReaction = async (type, rating = null, comment = '') => {
    if (!isAuthenticated) {
      alert('Silakan login untuk memberikan reaksi')
      return
    }

    try {
      const reactionData = { type, rating, comment }
      const response = await bookService.addReaction(book.slug, reactionData)
      setUserReaction(response.data)

      // Update book stats
      setBookStats(prev => ({
        ...prev,
        reactions: prev.reactions + 1
      }))
    } catch (error) {
      console.error('Error adding reaction:', error)
      alert('Gagal menambahkan reaksi')
    }
  }

  const loadBookStats = async () => {
    if (!isAuthenticated) return

    try {
      const [highlightsRes, notesRes, bookmarksRes] = await Promise.all([
        bookService.getHighlights(book.slug),
        bookService.getNotes(book.slug),
        bookService.getBookmarks(book.slug)
      ])

      setBookStats({
        highlights: highlightsRes.data?.length || 0,
        notes: notesRes.data?.length || 0,
        bookmarks: bookmarksRes.data?.length || 0,
        reactions: book.reactionCount || 0
      })
    } catch (error) {
      console.error('Error loading book stats:', error)
    }
  }

  const loadAIInsights = async () => {
    if (!isAuthenticated) return

    try {
      const [trendsRes, suggestionsRes] = await Promise.all([
        bookService.getHighlightTrends(book.slug),
        bookService.getBookmarkSuggestions(book.slug)
      ])

      setAIInsights({
        trends: trendsRes.data,
        suggestions: suggestionsRes.data
      })
    } catch (error) {
      console.error('Error loading AI insights:', error)
    }
  }

  const handleExportData = () => {
    if (!isAuthenticated) {
      alert('Silakan login untuk mengekspor data')
      return
    }
    setShowExportModal(true)
  }

  const handleExtractVocabulary = async () => {
    if (!isAuthenticated) {
      alert('Silakan login untuk menggunakan fitur ini')
      return
    }

    try {
      await extractVocabulary({
        difficulty: 'intermediate',
        language: 'en',
        count: 25
      })
    } catch (error) {
      console.error('Error extracting vocabulary:', error)
    }
  }

  useEffect(() => {
    if (isAuthenticated && book.slug) {
      loadBookStats()
      loadAIInsights()
    }
  }, [isAuthenticated, book.slug])

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

  const tabs = [
    { id: 'description', label: 'Deskripsi', icon: '📄' },
    { id: 'metadata', label: 'Info Detail', icon: 'ℹ️' },
    { id: 'discussions', label: `Diskusi (${discussions.length})`, icon: '💬' },
    { id: 'analytics', label: 'Analitik', icon: '📊' },
    ...(isAuthenticated ? [{ id: 'vocabulary', label: 'Kosakata', icon: '📚' }] : [])
  ]

  return (
    <div className="book-detail-container">
      <button className="btn btn-secondary" onClick={() => navigate('/books')}>
        ← Kembali
      </button>

      <div className="book-detail-main">
        {/* Cover Section */}
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

          {/* Actions */}
          <div className="book-actions">
            <button className="btn btn-primary btn-action" onClick={handleStartReading}>
              <span>📖</span>
              <span>Mulai Membaca</span>
            </button>
            <button
              className="btn btn-secondary btn-action"
              onClick={handleDownload}
              disabled={isDownloading}
            >
              <span>{isDownloading ? '⏳' : '💾'}</span>
              <span>{isDownloading ? 'Mengunduh...' : 'Unduh EPUB'}</span>
            </button>

            {/* New Action Buttons - Only for authenticated users */}
            {isAuthenticated && (
              <>
                <button
                  className="btn btn-secondary btn-action"
                  onClick={handleExportData}
                >
                  <span>📤</span>
                  <span>Ekspor Data</span>
                </button>
                <button
                  className="btn btn-secondary btn-action"
                  onClick={handleExtractVocabulary}
                >
                  <span>🔤</span>
                  <span>Ekstrak Kosakata</span>
                </button>
              </>
            )}
          </div>

          {/* Enhanced Quick Stats */}
          <div className="book-quick-stats">
            <div className="stat-item">
              <div className="stat-label">Dilihat</div>
              <div className="stat-value">{formatNumber(book.viewCount)}</div>
            </div>
            <div className="stat-item">
              <div className="stat-label">Diunduh</div>
              <div className="stat-value">{formatNumber(book.downloadCount)}</div>
            </div>
            <div className="stat-item">
              <div className="stat-label">Rating</div>
              <div className="stat-value">
                {book.averageRating ? `${book.averageRating.toFixed(1)}/5` : 'N/A'}
              </div>
            </div>
          </div>

          {/* User Reading Stats - Only for authenticated users */}
          {isAuthenticated && bookStats && (
            <div className="user-reading-stats card">
              <h4 style={{
                fontSize: '0.9rem',
                marginBottom: '0.75rem',
                color: theme === 'dark' ? 'var(--primary-pink)' : 'var(--primary-green)'
              }}>
                Aktivitas Anda
              </h4>
              <div className="stats-grid">
                <div className="stat-item">
                  <div className="stat-icon">🖍️</div>
                  <div className="stat-count">{bookStats.highlights}</div>
                  <div className="stat-label">Highlight</div>
                </div>
                <div className="stat-item">
                  <div className="stat-icon">📝</div>
                  <div className="stat-count">{bookStats.notes}</div>
                  <div className="stat-label">Catatan</div>
                </div>
                <div className="stat-item">
                  <div className="stat-icon">🔖</div>
                  <div className="stat-count">{bookStats.bookmarks}</div>
                  <div className="stat-label">Bookmark</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Info Section */}
        <div className="book-info-section">
          <div className="book-header">
            <h1 className="book-title" style={{
              color: theme === 'dark' ? 'var(--primary-pink)' : 'var(--primary-green)'
            }}>
              {book.title}
            </h1>

            {/* Authors */}
            {book.authors?.length > 0 && (
              <div className="book-authors">
                <span>oleh </span>
                {book.authors.map((author, index) => (
                  <span key={author.id} className="author-name">
                    {author.name}
                    {index < book.authors.length - 1 && ', '}
                  </span>
                ))}
              </div>
            )}

            {/* Genres */}
            {book.genres?.length > 0 && (
              <div className="book-genres">
                {book.genres.map(genre => (
                  <span key={genre.id} className="genre-tag" style={{
                    backgroundColor: genre.colorHex + '20',
                    color: genre.colorHex
                  }}>
                    {genre.name}
                  </span>
                ))}
              </div>
            )}

            {/* Reactions Component - Only for authenticated users */}
            {isAuthenticated && (
              <BookReactions
                bookSlug={book.slug}
                userReaction={userReaction}
                onReaction={handleReaction}
              />
            )}
          </div>

          {/* Enhanced Tabs */}
          <div className="book-tabs">
            {tabs.map(tab => (
              <button
                key={tab.id}
                className={`btn btn-secondary btn-small ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="book-tab-content">
            {/* Description Tab */}
            {activeTab === 'description' && book.description && (
              <div className="book-description">
                <h3>Deskripsi</h3>
                <p>{book.description}</p>
              </div>
            )}

            {/* Metadata Tab */}
            {activeTab === 'metadata' && (
              <div className="book-metadata">
                <h3>Informasi Detail</h3>
                <div className="metadata-grid">
                  {/* Basic Info */}
                  <div className="metadata-section">
                    <h4>Informasi Dasar</h4>
                    <div className="metadata-items">
                      {[
                        { label: 'Penerbit', value: book.publisher },
                        { label: 'Tahun Terbit', value: book.publicationYear },
                        { label: 'ISBN', value: book.isbn },
                        { label: 'Bahasa', value: book.language },
                        { label: 'Kategori', value: book.category },
                        { label: 'Status Hak Cipta', value: book.copyrightStatus }
                      ].filter(item => item.value).map(item => (
                        <div key={item.label} className="metadata-item">
                          <span className="meta-label">{item.label}:</span>
                          <span className="meta-value">{item.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Reading Info */}
                  <div className="metadata-section">
                    <h4>Informasi Membaca</h4>
                    <div className="metadata-items">
                      {book.totalPages > 0 && (
                        <div className="metadata-item">
                          <span className="meta-label">Jumlah Halaman:</span>
                          <span className="meta-value">{formatNumber(book.totalPages)}</span>
                        </div>
                      )}
                      {book.totalWord > 0 && (
                        <div className="metadata-item">
                          <span className="meta-label">Jumlah Kata:</span>
                          <span className="meta-value">{formatNumber(book.totalWord)}</span>
                        </div>
                      )}
                      <div className="metadata-item">
                        <span className="meta-label">Estimasi Waktu Baca:</span>
                        <span className="meta-value">{formatReadingTime(book.estimatedReadTime)}</span>
                      </div>
                      <div className="metadata-item">
                        <span className="meta-label">Level Kesulitan:</span>
                        <span className="meta-value">{getDifficultyLabel(book.difficultyLevel)}</span>
                      </div>
                      <div className="metadata-item">
                        <span className="meta-label">Format File:</span>
                        <span className="meta-value">{book.fileFormat?.toUpperCase() || 'EPUB'}</span>
                      </div>
                      <div className="metadata-item">
                        <span className="meta-label">Ukuran File:</span>
                        <span className="meta-value">{formatFileSize(book.fileSize)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Tags */}
                  {book.tags?.length > 0 && (
                    <div className="metadata-section tags-section">
                      <h4>Tag</h4>
                      <div className="tags-container">
                        {book.tags.map(tag => (
                          <span key={tag.id} className="tag-item">
                            #{tag.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Reviews */}
                  {(book.totalReviews > 0 || book.averageRating > 0) && (
                    <div className="metadata-section">
                      <h4>Ulasan</h4>
                      <div className="metadata-items">
                        <div className="metadata-item">
                          <span className="meta-label">Rating Rata-rata:</span>
                          <span className="meta-value">{book.averageRating.toFixed(1)}/5 ⭐</span>
                        </div>
                        <div className="metadata-item">
                          <span className="meta-label">Jumlah Ulasan:</span>
                          <span className="meta-value">{formatNumber(book.totalReviews)}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Discussions Tab */}
            {activeTab === 'discussions' && (
              <BookDiscussions bookSlug={book.slug} />
            )}

            {/* Analytics Tab */}
            {activeTab === 'analytics' && (
              <BookAnalytics
                book={book}
                bookStats={bookStats}
                aiInsights={aiInsights}
                isAuthenticated={isAuthenticated}
              />
            )}

            {/* Vocabulary Tab - Only for authenticated users */}
            {activeTab === 'vocabulary' && isAuthenticated && (
              <div className="book-vocabulary">
                <h3>Kosakata & Pembelajaran</h3>

                {vocabulary.length === 0 ? (
                  <div className="empty-state">
                    <p>Belum ada kosakata yang diekstrak.</p>
                    <button
                      className="btn btn-primary"
                      onClick={handleExtractVocabulary}
                    >
                      Ekstrak Kosakata Sekarang
                    </button>
                  </div>
                ) : (
                  <div className="vocabulary-content">
                    <div className="vocabulary-stats">
                      <div className="stat-card">
                        <div className="stat-number">{vocabulary.length}</div>
                        <div className="stat-label">Kata Ditemukan</div>
                      </div>
                    </div>

                    <div className="vocabulary-list">
                      {vocabulary.map((word, index) => (
                        <div key={index} className="vocabulary-item card">
                          <div className="word-header">
                            <span className="word-text">{word.word}</span>
                            <span className="word-difficulty">{word.difficulty || 'Sedang'}</span>
                          </div>
                          {word.definition && (
                            <div className="word-definition">{word.definition}</div>
                          )}
                          {word.examples && word.examples.length > 0 && (
                            <div className="word-examples">
                              <strong>Contoh:</strong>
                              <ul>
                                {word.examples.map((example, idx) => (
                                  <li key={idx}>{example}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Export Modal */}
      {showExportModal && (
        <BookExportModal
          bookSlug={book.slug}
          bookTitle={book.title}
          onClose={() => setShowExportModal(false)}
        />
      )}
    </div>
  )
}

export default BookDetail