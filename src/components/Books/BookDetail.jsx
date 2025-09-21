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
    isDownloading: false, activeTab: 'description', showShareModal: false, userReaction: null,
    bookStats: { highlights: 0, notes: 0, bookmarks: 0, reactions: 0 }, reactionStats: null,
    discussions: [], loadingStats: false, loadingDiscussions: false, readingProgress: null,
    relatedBooks: [], loadingRelated: false, isBookmarked: false, discussionCount: 0
  })

  const [notification, setNotification] = useState(null)

  const formatFileSize = useCallback((bytes) => {
    if (!bytes) return 'N/A'
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`
  }, [])

  const formatReadingTime = useCallback((minutes) => {
    if (!minutes) return 'N/A'
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return hours > 0 ? `${hours} jam ${mins > 0 ? `${mins} menit` : ''}` : `${minutes} menit`
  }, [])

  const getDifficultyLabel = useCallback((level) => {
    if (!level) return 'N/A'
    const labels = ['Mudah', 'Sedang', 'Sulit', 'Sangat Sulit']
    const index = level <= 3 ? 0 : level <= 6 ? 1 : level <= 8 ? 2 : 3
    return `${labels[index]} (${level}/10)`
  }, [])

  const formatNumber = useCallback((num) => num?.toLocaleString('id-ID') || '0', [])

  const showNotification = useCallback((message, type = 'info') => {
    setNotification({ message, type, id: Date.now() })
    setTimeout(() => setNotification(null), 4000)
  }, [])

  const handleStartReading = useCallback(() => navigate(`/${book.slug}/read`), [navigate, book.slug])

  const handleDownload = useCallback(async () => {
    if (state.isDownloading) return
    setState(prev => ({ ...prev, isDownloading: true }))
    try {
      const filename = `${book.title.replace(/[^a-zA-Z0-9\s-]/g, '').replace(/\s+/g, '_')}.epub`
      await bookService.downloadBook(book.slug, filename)
      showNotification('Buku berhasil diunduh!', 'success')
      book.downloadCount = (book.downloadCount || 0) + 1
    } catch (error) {
      showNotification(error.message || 'Gagal mengunduh ebook. Silakan coba lagi.', 'error')
    } finally {
      setState(prev => ({ ...prev, isDownloading: false }))
    }
  }, [state.isDownloading, book, showNotification])

  const handleShare = useCallback(() => {
    const url = window.location.href
    const title = `${book.title} - Lentera Pustaka`
    const text = book.description ? `${book.description.substring(0, 100)}...` : `Baca "${book.title}" di Lentera Pustaka`
    if (navigator.share) {
      navigator.share({ title, text, url }).catch(console.error)
    } else if (navigator.clipboard) {
      navigator.clipboard.writeText(url).then(() => showNotification('Link berhasil disalin ke clipboard!', 'success')).catch(() => setState(prev => ({ ...prev, showShareModal: true })))
    } else {
      setState(prev => ({ ...prev, showShareModal: true }))
    }
  }, [book.title, book.description, showNotification])

  const handleAddToBookmarks = useCallback(async () => {
    if (!isAuthenticated) {
      showNotification('Silakan login untuk menambahkan ke bookmark', 'warning')
      return
    }
    try {
      setState(prev => ({ ...prev, isBookmarked: !prev.isBookmarked }))
      showNotification(state.isBookmarked ? 'Dihapus dari bookmark' : 'Ditambahkan ke bookmark', 'success')
    } catch (error) {
      showNotification('Gagal mengubah bookmark', 'error')
    }
  }, [isAuthenticated, state.isBookmarked, showNotification])

  const loadUserStats = useCallback(async () => {
    if (!isAuthenticated || !book.slug) return
    try {
      const [highlightsRes, notesRes, bookmarksRes, progressRes] = await Promise.allSettled([
        bookService.getHighlights(book.slug), bookService.getNotes(book.slug),
        bookService.getBookmarks(book.slug), bookService.getReadingProgress(book.slug)
      ])
      setState(prev => ({
        ...prev,
        bookStats: {
          ...prev.bookStats,
          highlights: highlightsRes.status === 'fulfilled' ? highlightsRes.value.data?.length || 0 : 0,
          notes: notesRes.status === 'fulfilled' ? notesRes.value.data?.length || 0 : 0,
          bookmarks: bookmarksRes.status === 'fulfilled' ? bookmarksRes.value.data?.length || 0 : 0
        },
        readingProgress: progressRes.status === 'fulfilled' ? progressRes.value.data : null
      }))
    } catch (error) {
      console.error('Error loading user stats:', error)
    }
  }, [isAuthenticated, book.slug])

  const loadReactionStats = useCallback(async () => {
    if (!book.slug) return
    try {
      const response = await bookService.getReactionStats(book.slug)
      const stats = response.data
      setState(prev => ({ ...prev, reactionStats: stats, bookStats: { ...prev.bookStats, reactions: stats?.total || 0 } }))
      if (stats?.total) book.reactionCount = stats.total
    } catch (error) {
      console.error('Error loading reaction stats:', error)
    }
  }, [book.slug])

  const loadDiscussions = useCallback(async () => {
    if (!book.slug) return
    setState(prev => ({ ...prev, loadingDiscussions: true }))
    try {
      const response = await bookService.getReactions(book.slug, 1, 50)
      const reactionsWithComments = response.data?.filter(reaction => reaction.comment && reaction.comment.trim() !== '') || []
      setState(prev => ({ ...prev, discussions: reactionsWithComments, discussionCount: reactionsWithComments.length, loadingDiscussions: false }))
    } catch (error) {
      setState(prev => ({ ...prev, discussions: [], discussionCount: 0, loadingDiscussions: false }))
    }
  }, [book.slug])

  const loadUserReaction = useCallback(async () => {
    if (!isAuthenticated || !book.slug || !user?.id) return
    try {
      const response = await bookService.getReactions(book.slug, 1, 100)
      const userReaction = response.data?.find(reaction => reaction.user?.id === user.id || reaction.userId === user.id)
      setState(prev => ({ ...prev, userReaction: userReaction || null }))
    } catch (error) {
      setState(prev => ({ ...prev, userReaction: null }))
    }
  }, [isAuthenticated, book.slug, user?.id])

  const loadRelatedBooks = useCallback(async () => {
    if (!book.slug) return
    setState(prev => ({ ...prev, loadingRelated: true }))
    try {
      const params = { limit: 6, genreId: book.genres?.[0]?.id, searchTitle: book.authors?.[0]?.name }
      const response = await bookService.getBooks(params)
      const relatedBooks = response.data?.data?.filter(b => b.slug !== book.slug) || []
      setState(prev => ({ ...prev, relatedBooks: relatedBooks.slice(0, 6), loadingRelated: false }))
    } catch (error) {
      setState(prev => ({ ...prev, relatedBooks: [], loadingRelated: false }))
    }
  }, [book.slug, book.genres, book.authors])

  const loadAllData = useCallback(async () => {
    setState(prev => ({ ...prev, loadingStats: true }))
    try {
      await Promise.all([loadUserStats(), loadReactionStats(), loadDiscussions(), loadUserReaction(), loadRelatedBooks()])
    } finally {
      setState(prev => ({ ...prev, loadingStats: false }))
    }
  }, [loadUserStats, loadReactionStats, loadDiscussions, loadUserReaction, loadRelatedBooks])

  const handleReaction = useCallback(async (type, rating = null, comment = '') => {
    if (!isAuthenticated) {
      showNotification('Silakan login untuk memberikan reaksi', 'warning')
      return
    }
    try {
      const response = await bookService.addReaction(book.slug, { type, rating, comment })
      setState(prev => ({ ...prev, userReaction: response.data }))
      await Promise.all([loadReactionStats(), loadDiscussions()])
      showNotification('Reaksi berhasil ditambahkan!', 'success')
    } catch (error) {
      showNotification(error.message || 'Gagal menambahkan reaksi', 'error')
    }
  }, [isAuthenticated, book.slug, loadReactionStats, loadDiscussions, showNotification])

  useEffect(() => {
    if (book.slug) loadAllData()
  }, [book.slug, loadAllData])

  useEffect(() => {
    document.title = `${book.title} - Lentera Pustaka`
    const setMeta = (name, content) => {
      let meta = document.querySelector(`meta[name="${name}"]`) || document.querySelector(`meta[property="${name}"]`)
      if (!meta) {
        meta = document.createElement('meta')
        meta.setAttribute(name.startsWith('og:') || name.startsWith('twitter:') ? 'property' : 'name', name)
        document.head.appendChild(meta)
      }
      meta.setAttribute('content', content)
    }
    setMeta('description', book.description || `Baca "${book.title}" di Lentera Pustaka`)
    setMeta('og:title', book.title)
    setMeta('og:description', book.description || `Baca "${book.title}" di Lentera Pustaka`)
    setMeta('og:type', 'book')
    setMeta('og:url', window.location.href)
    if (book.coverImageUrl) setMeta('og:image', book.coverImageUrl)
    setMeta('twitter:card', 'summary_large_image')
  }, [book.title, book.description, book.coverImageUrl])

  const tabs = [
    { id: 'description', label: 'Deskripsi', icon: '📄' },
    { id: 'metadata', label: 'Info Detail', icon: 'ℹ️' },
    { id: 'discussions', label: `Diskusi (${state.discussionCount})`, icon: '💬' },
    { id: 'analytics', label: 'Analitik', icon: '📊' },
    { id: 'related', label: 'Buku Serupa', icon: '📚' }
  ]

  return (
    <div className="book-detail-container">
      {notification && (
        <div className={`notification notification-${notification.type}`}>
          <div className="notification-content">
            <span className="notification-icon">{notification.type === 'success' ? '✅' : notification.type === 'error' ? '❌' : notification.type === 'warning' ? '⚠️' : 'ℹ️'}</span>
            <span className="notification-message">{notification.message}</span>
          </div>
        </div>
      )}

      <nav className="breadcrumb">
        <button className="btn btn-secondary btn-small" onClick={() => navigate('/books')}>← Kembali ke Daftar Buku</button>
        <span className="breadcrumb-separator">/</span>
        <span className="breadcrumb-current">{book.title}</span>
      </nav>

      <div className="book-detail-main">
        <div className="book-cover-section">
          <div className="book-cover-wrapper">
            {book.coverImageUrl ? (
              <img src={book.coverImageUrl} alt={`Cover ${book.title}`} className="book-cover-image" loading="lazy" onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex' }} />
            ) : null}
            <div className={`book-cover-placeholder ${book.coverImageUrl ? 'hidden' : ''}`}>
              <div className="placeholder-icon">📚</div>
              <div className="placeholder-text">Cover EPUB</div>
            </div>
          </div>

          <div className="book-actions">
            <button className="btn btn-primary btn-action" onClick={handleStartReading}>
              <span>📖</span>
              <span>{state.readingProgress?.percentage > 0 ? `Lanjutkan (${Math.round(state.readingProgress.percentage)}%)` : 'Mulai Membaca'}</span>
            </button>
            <button className="btn btn-secondary btn-action" onClick={handleDownload} disabled={state.isDownloading}>
              <span>{state.isDownloading ? '⏳' : '💾'}</span>
              <span>{state.isDownloading ? 'Mengunduh...' : 'Unduh EPUB'}</span>
            </button>
            <div className="action-row">
              <button className={`btn btn-secondary btn-small ${state.isBookmarked ? 'active' : ''}`} onClick={handleAddToBookmarks} title="Tambah ke bookmark">{state.isBookmarked ? '🔖' : '📌'} Bookmark</button>
              <button className="btn btn-secondary btn-small" onClick={handleShare} title="Bagikan buku">🔗 Bagikan</button>
            </div>

            <div className="book-quick-stats">
              {[
                { label: 'Dilihat', value: book.viewCount || 0, icon: '👁️' },
                { label: 'Diunduh', value: book.downloadCount || 0, icon: '📥' },
                { label: 'Rating', value: book.averageRating ? `${book.averageRating.toFixed(1)}/5` : 'Belum ada', icon: '⭐' }
              ].map(stat => (
                <div key={stat.label} className="stat-item">
                  <div className="stat-icon">{stat.icon}</div>
                  <div className="stat-details">
                    <div className="stat-label">{stat.label}</div>
                    <div className="stat-value">{typeof stat.value === 'number' ? formatNumber(stat.value) : stat.value}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="book-info-section">
          <div className="book-header">
            <h1 className="book-title">{book.title}</h1>
            {book.authors?.length > 0 && (
              <div className="book-authors">
                <span>oleh </span>
                {book.authors.map((author, index) => (
                  <span key={author.id} className="author-name">{author.name}{index < book.authors.length - 1 && ', '}</span>
                ))}
              </div>
            )}
            {book.series && (
              <div className="book-series">Seri: <span className="series-name">{book.series}</span>{book.seriesNumber && <span className="series-number"> #{book.seriesNumber}</span>}</div>
            )}
            {book.genres?.length > 0 && (
              <div className="book-genres">
                {book.genres.map(genre => (
                  <span key={genre.id} className="genre-tag" style={{ backgroundColor: (genre.colorHex || '#6B7280') + '20', color: genre.colorHex || '#6B7280', borderColor: genre.colorHex || '#6B7280' }}>{genre.name}</span>
                ))}
              </div>
            )}
            {state.readingProgress && (
              <div className="reading-progress-display">
                <div className="progress-header">
                  <span>Progres Baca Anda: {Math.round(state.readingProgress.percentage)}%</span>
                  <span className="last-read">Terakhir: {new Date(state.readingProgress.lastReadAt).toLocaleDateString('id-ID')}</span>
                </div>
                <div className="progress-bar"><div className="progress-fill" style={{ width: `${state.readingProgress.percentage}%` }} /></div>
              </div>
            )}
            {isAuthenticated && <BookReactions bookSlug={book.slug} userReaction={state.userReaction} onReaction={handleReaction} reactionStats={state.reactionStats} />}
          </div>

          <div className="book-tabs">
            {tabs.map(tab => (
              <button key={tab.id} className={`btn btn-secondary btn-small tab-button ${state.activeTab === tab.id ? 'active' : ''}`} onClick={() => setState(prev => ({ ...prev, activeTab: tab.id }))}>
                <span className="tab-icon">{tab.icon}</span>
                <span className="tab-label">{tab.label}</span>
              </button>
            ))}
          </div>

          <div className="book-tab-content">
            {state.activeTab === 'description' && (
              <div className="tab-content-wrapper">
                {book.description && (
                  <div className="book-description">
                    <h3>Deskripsi</h3>
                    <div className="description-text">
                      {book.description.split('\n').map((paragraph, index) => paragraph.trim() && <p key={index}>{paragraph}</p>)}
                    </div>
                  </div>
                )}
                <div className="key-info-grid">
                  <div className="info-card">
                    <h4>📊 Statistik</h4>
                    <div className="info-items">
                      <div className="info-item"><span>Halaman:</span><span>{book.totalPages ? formatNumber(book.totalPages) : 'N/A'}</span></div>
                      <div className="info-item"><span>Kata:</span><span>{book.totalWord ? formatNumber(book.totalWord) : 'N/A'}</span></div>
                      <div className="info-item"><span>Waktu Baca:</span><span>{formatReadingTime(book.estimatedReadTime)}</span></div>
                      <div className="info-item"><span>Kesulitan:</span><span>{getDifficultyLabel(book.difficultyLevel)}</span></div>
                    </div>
                  </div>
                  <div className="info-card">
                    <h4>📚 Publikasi</h4>
                    <div className="info-items">
                      {[
                        { label: 'Penerbit', value: book.publisher },
                        { label: 'Tahun', value: book.publicationYear },
                        { label: 'Bahasa', value: book.language },
                        { label: 'ISBN', value: book.isbn }
                      ].filter(item => item.value).map(item => <div key={item.label} className="info-item"><span>{item.label}:</span><span>{item.value}</span></div>)}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {state.activeTab === 'metadata' && (
              <div className="tab-content-wrapper">
                <div className="metadata-grid">
                  <div className="metadata-section">
                    <h4>📋 Informasi Dasar</h4>
                    <div className="metadata-items">
                      {[
                        { label: 'Judul Asli', value: book.originalTitle },
                        { label: 'Penerjemah', value: book.translator },
                        { label: 'Editor', value: book.editor },
                        { label: 'Ilustrator', value: book.illustrator }
                      ].filter(item => item.value).map(item => <div key={item.label} className="metadata-item"><span className="meta-label">{item.label}:</span><span className="meta-value">{item.value}</span></div>)}
                    </div>
                  </div>
                  <div className="metadata-section">
                    <h4>🔧 Detail Teknis</h4>
                    <div className="metadata-items">
                      {[
                        { label: 'Format', value: 'EPUB' },
                        { label: 'Ukuran File', value: formatFileSize(book.fileSize) },
                        { label: 'Kompresi', value: book.compressionType || 'Standard' },
                        { label: 'DRM', value: book.hasDRM ? 'Ya' : 'Tidak' }
                      ].filter(item => item.value && item.value !== 'N/A').map(item => <div key={item.label} className="metadata-item"><span className="meta-label">{item.label}:</span><span className="meta-value">{item.value}</span></div>)}
                    </div>
                  </div>
                  {book.tags?.length > 0 && (
                    <div className="metadata-section tags-section">
                      <h4>🏷️ Tag</h4>
                      <div className="tags-container">
                        {book.tags.map(tag => <span key={tag.id} className="tag-item">{tag.name}</span>)}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {state.activeTab === 'discussions' && <BookDiscussions bookSlug={book.slug} discussions={state.discussions} loading={state.loadingDiscussions} onDiscussionUpdate={loadDiscussions} />}
            {state.activeTab === 'analytics' && <BookAnalytics book={book} bookStats={state.bookStats} reactionStats={state.reactionStats} isAuthenticated={isAuthenticated} readingProgress={state.readingProgress} />}

            {state.activeTab === 'related' && (
              <div className="tab-content-wrapper">
                <div className="related-books-section">
                  <h3>Buku Serupa</h3>
                  {state.loadingRelated ? (
                    <div className="loading-related"><div className="loading-spinner"></div><p>Memuat buku serupa...</p></div>
                  ) : state.relatedBooks.length > 0 ? (
                    <div className="related-books-grid">
                      {state.relatedBooks.map(relatedBook => (
                        <div key={relatedBook.id} className="related-book-card" onClick={() => navigate(`/books/${relatedBook.slug}`)}>
                          <div className="related-book-cover">
                            {relatedBook.coverImageUrl ? <img src={relatedBook.coverImageUrl} alt={relatedBook.title} /> : <div className="placeholder-cover">📚</div>}
                          </div>
                          <div className="related-book-info">
                            <h5 className="related-book-title">{relatedBook.title}</h5>
                            {relatedBook.authors?.[0] && <p className="related-book-author">{relatedBook.authors[0].name}</p>}
                            <div className="related-book-meta">
                              {relatedBook.averageRating && <span className="related-rating">⭐ {relatedBook.averageRating.toFixed(1)}</span>}
                              <span className="related-views">👁️ {formatNumber(relatedBook.viewCount || 0)}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="empty-state"><div className="empty-icon">📚</div><p>Tidak ada buku serupa yang ditemukan.</p></div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {state.showShareModal && (
        <div className="modal-overlay" onClick={() => setState(prev => ({ ...prev, showShareModal: false }))}>
          <div className="modal-content card" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Bagikan Buku</h3>
              <button className="btn btn-secondary btn-small" onClick={() => setState(prev => ({ ...prev, showShareModal: false }))}>✕</button>
            </div>
            <div className="modal-body">
              <div className="share-options">
                <div className="share-url">
                  <input type="text" className="form-control" value={window.location.href} readOnly onClick={(e) => e.target.select()} />
                  <button className="btn btn-primary btn-small" onClick={() => { navigator.clipboard.writeText(window.location.href); showNotification('Link berhasil disalin!', 'success'); setState(prev => ({ ...prev, showShareModal: false })) }}>Salin</button>
                </div>
                <div className="share-social">
                  <h4>Bagikan ke:</h4>
                  <div className="social-buttons">
                    <a href={`https://wa.me/?text=${encodeURIComponent(`${book.title} - ${window.location.href}`)}`} target="_blank" rel="noopener noreferrer" className="btn btn-secondary social-btn">💬 WhatsApp</a>
                    <a href={`https://t.me/share/url?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(book.title)}`} target="_blank" rel="noopener noreferrer" className="btn btn-secondary social-btn">✈️ Telegram</a>
                    <a href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(book.title)}&url=${encodeURIComponent(window.location.href)}`} target="_blank" rel="noopener noreferrer" className="btn btn-secondary social-btn">🐦 Twitter</a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default BookDetail