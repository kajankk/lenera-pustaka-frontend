import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { bookService } from '../../services/bookService'
import { useTheme } from '../../hooks/useTheme'
import { useAuth } from '../../context/AuthContext'

const BookDetail = ({ book, onBookUpdate }) => {
  const navigate = useNavigate()
  const { theme } = useTheme()
  const { isAuthenticated, user } = useAuth()

  const [state, setState] = useState({
    isDownloading: false,
    activeTab: 'description',
    modals: { share: false, rating: false, review: false, editReview: false, reply: false, editReply: false },
    newRating: 5,
    newReview: { comment: '', title: '' },
    editReview: { comment: '', title: '' },
    newReply: '',
    editReply: '',
    editingReview: null,
    editingReply: null,
    replyToReview: null,
    userRating: null,
    userReview: null,
    expandedReplies: new Set(),
    reviews: [],
    loading: false
  })

  const [notification, setNotification] = useState(null)

  // Utility functions
  const formatFileSize = (bytes) => {
    if (!bytes) return 'N/A'
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${['B', 'KB', 'MB', 'GB'][i]}`
  }

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

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
    })
  }

  const showNotification = (message, type = 'info') => {
    setNotification({ message, type, id: Date.now() })
    setTimeout(() => setNotification(null), 4000)
  }

  const getFileFormat = () => {
    if (book.fileFormat) return book.fileFormat.toLowerCase()
    if (book.fileUrl) {
      const url = book.fileUrl.toLowerCase()
      if (url.includes('.pdf')) return 'pdf'
      if (url.includes('.epub')) return 'epub'
    }
    return 'epub'
  }

  const getAuthors = () => {
    if (book.authorNames && book.authorSlugs) {
      const names = book.authorNames.split(', ')
      const slugs = book.authorSlugs.split(', ')
      return names.map((name, i) => ({ id: i + 1, name: name.trim(), slug: slugs[i]?.trim() || name.toLowerCase().replace(/\s+/g, '-') }))
    }
    return []
  }

  const getGenres = () => book.genres ? book.genres.split(', ').map((g, i) => ({ id: i + 1, name: g.trim() })) : []

  const loadReviews = useCallback(async () => {
    if (!book.slug) return
    try {
      setState(prev => ({ ...prev, loading: true }))
      const response = await bookService.getReviews(book.slug, 1, 100)
      if ((response.result === 'Success' || response.status === 'SUCCESS') && response.data) {
        setState(prev => ({ ...prev, reviews: Array.isArray(response.data) ? response.data : [], loading: false }))
      } else {
        setState(prev => ({ ...prev, reviews: [], loading: false }))
      }
    } catch (error) {
      console.error('Error loading reviews:', error)
      setState(prev => ({ ...prev, reviews: [], loading: false }))
    }
  }, [book.slug])

  const buildReviewTree = (reviews) => {
    if (!reviews || !Array.isArray(reviews)) return []
    const reviewMap = new Map()
    const rootReviews = []

    reviews.forEach(review => {
      if (!review.parentId && review.reactionType === 'COMMENT') {
        reviewMap.set(review.id, { ...review, replies: [], feedbacks: [] })
      }
    })

    reviews.forEach(item => {
      if (item.parentId && reviewMap.has(item.parentId)) {
        const parent = reviewMap.get(item.parentId)
        if (item.reactionType === 'COMMENT') parent.replies.push(item)
        else if (item.reactionType === 'HELPFUL' || item.reactionType === 'NOT_HELPFUL') parent.feedbacks.push(item)
      }
    })

    reviewMap.forEach(review => rootReviews.push(review))
    rootReviews.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    rootReviews.forEach(review => review.replies.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)))
    return rootReviews
  }

  const setModal = (modal, value) => setState(prev => ({ ...prev, modals: { ...prev.modals, [modal]: value } }))

  const handleStartReading = () => {
    const format = getFileFormat()
    navigate(`/${book.slug}/${format === 'pdf' ? 'read-pdf' : 'read'}`)
  }

  const handleDownload = async () => {
    if (state.isDownloading) return
    setState(prev => ({ ...prev, isDownloading: true }))
    try {
      const format = getFileFormat()
      const ext = format === 'pdf' ? 'pdf' : 'epub'
      const filename = `${book.title.replace(/[^a-zA-Z0-9\s-]/g, '').replace(/\s+/g, '_')}.${ext}`
      await bookService.downloadBook(book.slug, filename)
      showNotification(`Buku berhasil diunduh dalam format ${ext.toUpperCase()}!`, 'success')
    } catch (error) {
      showNotification(error.message || 'Gagal mengunduh ebook. Silakan coba lagi.', 'error')
    } finally {
      setState(prev => ({ ...prev, isDownloading: false }))
    }
  }

  const handleShare = () => {
    const url = window.location.href
    const title = `${book.title} - Lentera Pustaka`
    const text = book.description ? `${book.description.substring(0, 100)}...` : `Baca "${book.title}" di Lentera Pustaka`

    if (navigator.share) {
      navigator.share({ title, text, url }).catch(console.error)
    } else if (navigator.clipboard) {
      navigator.clipboard.writeText(url)
        .then(() => showNotification('Link berhasil disalin ke clipboard!', 'success'))
        .catch(() => setModal('share', true))
    } else {
      setModal('share', true)
    }
  }

  const handleAddRating = async () => {
    if (!isAuthenticated) {
      showNotification('Silakan login terlebih dahulu', 'warning')
      setTimeout(() => navigate('/login', { state: { from: window.location.pathname } }), 1500)
      return
    }
    try {
      await bookService.addOrUpdateRating(book.slug, state.newRating)
      setModal('rating', false)
      setState(prev => ({ ...prev, newRating: 5 }))
      showNotification(state.userRating ? 'Rating berhasil diupdate!' : 'Rating berhasil ditambahkan!', 'success')
      await loadReviews()
      if (onBookUpdate) await onBookUpdate()
    } catch (error) {
      showNotification(error.response?.data?.message || error.message || 'Gagal menambahkan rating', 'error')
    }
  }

  const handleDeleteRating = async () => {
    if (!state.userRating || !window.confirm('Hapus rating Anda?')) return
    try {
      await bookService.deleteRating(book.slug)
      showNotification('Rating berhasil dihapus!', 'success')
      await loadReviews()
      if (onBookUpdate) await onBookUpdate()
    } catch (error) {
      showNotification(error.response?.data?.message || error.message || 'Gagal menghapus rating', 'error')
    }
  }

  const handleAddReview = async () => {
    if (!isAuthenticated) {
      showNotification('Silakan login terlebih dahulu', 'warning')
      setTimeout(() => navigate('/login', { state: { from: window.location.pathname } }), 1500)
      return
    }
    if (!state.newReview.comment.trim() || state.newReview.comment.trim().length < 10) {
      showNotification('Review harus minimal 10 karakter', 'warning')
      return
    }
    try {
      await bookService.addReview(book.slug, { title: state.newReview.title || null, comment: state.newReview.comment })
      setModal('review', false)
      setState(prev => ({ ...prev, newReview: { comment: '', title: '' } }))
      showNotification('Review berhasil ditambahkan!', 'success')
      await loadReviews()
      if (onBookUpdate) await onBookUpdate()
    } catch (error) {
      showNotification(error.response?.data?.message || error.message || 'Gagal menambahkan review', 'error')
    }
  }

  const handleUpdateReview = async () => {
    if (!isAuthenticated || !state.editReview.comment.trim() || state.editReview.comment.trim().length < 10) {
      showNotification('Review harus minimal 10 karakter', 'warning')
      return
    }
    try {
      await bookService.updateReview(book.slug, { title: state.editReview.title || null, comment: state.editReview.comment })
      setModal('editReview', false)
      setState(prev => ({ ...prev, editingReview: null, editReview: { comment: '', title: '' } }))
      showNotification('Review berhasil diupdate!', 'success')
      await loadReviews()
      if (onBookUpdate) await onBookUpdate()
    } catch (error) {
      showNotification(error.response?.data?.message || error.message || 'Gagal mengupdate review', 'error')
    }
  }

  const handleDeleteReview = async () => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus review ini?')) return
    try {
      await bookService.deleteReview(book.slug)
      showNotification('Review berhasil dihapus!', 'success')
      await loadReviews()
      if (onBookUpdate) await onBookUpdate()
    } catch (error) {
      showNotification(error.response?.data?.message || error.message || 'Gagal menghapus review', 'error')
    }
  }

  const handleAddReply = async () => {
    if (!isAuthenticated || !state.newReply.trim()) {
      showNotification('Balasan tidak boleh kosong', 'warning')
      return
    }
    try {
      await bookService.addReply(book.slug, state.replyToReview.id, state.newReply)
      setModal('reply', false)
      setState(prev => ({ ...prev, replyToReview: null, newReply: '' }))
      showNotification('Balasan berhasil ditambahkan!', 'success')
      await loadReviews()
    } catch (error) {
      showNotification(error.response?.data?.message || error.message || 'Gagal menambahkan balasan', 'error')
    }
  }

  const handleUpdateReply = async () => {
    if (!isAuthenticated || !state.editReply.trim()) {
      showNotification('Balasan tidak boleh kosong', 'warning')
      return
    }
    try {
      await bookService.updateReply(book.slug, state.editingReply.id, state.editReply)
      setModal('editReply', false)
      setState(prev => ({ ...prev, editingReply: null, editReply: '' }))
      showNotification('Balasan berhasil diupdate!', 'success')
      await loadReviews()
    } catch (error) {
      showNotification(error.response?.data?.message || error.message || 'Gagal mengupdate balasan', 'error')
    }
  }

  const handleDeleteReply = async (replyId) => {
    if (!window.confirm('Hapus balasan ini?')) return
    try {
      await bookService.deleteReply(book.slug, replyId)
      showNotification('Balasan berhasil dihapus!', 'success')
      await loadReviews()
    } catch (error) {
      showNotification(error.response?.data?.message || error.message || 'Gagal menghapus balasan', 'error')
    }
  }

  const handleFeedback = async (reviewId, feedbackType) => {
    if (!isAuthenticated) {
      showNotification('Silakan login untuk memberikan feedback', 'warning')
      return
    }
    try {
      await bookService.addOrUpdateFeedback(book.slug, reviewId, feedbackType)
      showNotification('Feedback berhasil ditambahkan!', 'success')
      await loadReviews()
    } catch (error) {
      showNotification(error.response?.data?.message || error.message || 'Gagal menambahkan feedback', 'error')
    }
  }

  const handleDeleteFeedback = async (reviewId) => {
    if (!window.confirm('Hapus feedback Anda?')) return
    try {
      await bookService.deleteFeedback(book.slug, reviewId)
      showNotification('Feedback berhasil dihapus!', 'success')
      await loadReviews()
    } catch (error) {
      showNotification(error.response?.data?.message || error.message || 'Gagal menghapus feedback', 'error')
    }
  }

  const toggleReplies = (reviewId) => {
    setState(prev => {
      const newExpanded = new Set(prev.expandedReplies)
      newExpanded.has(reviewId) ? newExpanded.delete(reviewId) : newExpanded.add(reviewId)
      return { ...prev, expandedReplies: newExpanded }
    })
  }

  const ReviewItem = ({ review }) => {
    const isOwner = user && review.userName && user.username && review.userName.toLowerCase() === user.username.toLowerCase()
    const helpfulCount = review.feedbacks?.filter(f => f.reactionType === 'HELPFUL').length || 0
    const notHelpfulCount = review.feedbacks?.filter(f => f.reactionType === 'NOT_HELPFUL').length || 0
    const userFeedback = user ? review.feedbacks?.find(f => f.userName === user.username) : null

    return (
      <div className="discussion-item">
        <div className="discussion-header">
          <div className="user-info">
            <div className="user-avatar">{review.userName?.charAt(0).toUpperCase() || '?'}</div>
            <div className="user-details">
              <h5>{review.userName || 'Pengguna'}</h5>
              <p>{formatDate(review.createdAt)}</p>
            </div>
          </div>
        </div>

        <div className="discussion-content">
          {review.title && <div className="discussion-title">{review.title}</div>}
          <div className="discussion-text" style={{ whiteSpace: 'pre-line', wordBreak: 'break-word' }}>
            {review.comment}
          </div>
        </div>

        <div className="discussion-actions">
          {isAuthenticated && !isOwner && (
            <>
              <button className="action-btn" onClick={() => { setModal('reply', true); setState(prev => ({ ...prev, replyToReview: review })) }}>Balas</button>
              <button className={`action-btn ${userFeedback?.reactionType === 'HELPFUL' ? 'active' : ''}`} onClick={() => handleFeedback(review.id, 'HELPFUL')}>Membantu ({helpfulCount})</button>
              <button className={`action-btn ${userFeedback?.reactionType === 'NOT_HELPFUL' ? 'active' : ''}`} onClick={() => handleFeedback(review.id, 'NOT_HELPFUL')}>Tidak Membantu ({notHelpfulCount})</button>
              {userFeedback && <button className="action-btn" style={{ color: '#dc2626', marginLeft: 'auto' }} onClick={() => handleDeleteFeedback(review.id)} title="Hapus feedback saya">Hapus Feedback</button>}
            </>
          )}
          {isAuthenticated && isOwner && (
            <>
              <button className="action-btn" onClick={() => { setModal('editReview', true); setState(prev => ({ ...prev, editingReview: review, editReview: { comment: review.comment || '', title: review.title || '' } })) }}>Edit</button>
              <button className="action-btn" style={{ color: '#dc2626' }} onClick={handleDeleteReview}>Hapus</button>
              <div style={{ marginLeft: 'auto', fontSize: '0.875rem', color: '#6b7280' }}>{helpfulCount} membantu · {notHelpfulCount} tidak membantu</div>
            </>
          )}
          {review.replies?.length > 0 && <button className="action-btn" onClick={() => toggleReplies(review.id)}>{state.expandedReplies.has(review.id) ? '▼' : '▶'} {review.replies.length} balasan</button>}
        </div>

        {state.expandedReplies.has(review.id) && review.replies?.map(reply => {
          const isReplyOwner = user && reply.userName === user.username
          return (
            <div key={reply.id} className="discussion-item" style={{ marginLeft: '2rem', marginTop: '1rem' }}>
              <div className="discussion-header">
                <div className="user-info">
                  <div className="user-avatar">{reply.userName?.charAt(0).toUpperCase() || '?'}</div>
                  <div className="user-details">
                    <h5>{reply.userName || 'Pengguna'}</h5>
                    <p>{formatDate(reply.createdAt)}</p>
                  </div>
                </div>
              </div>
              <div className="discussion-content">
                <div className="discussion-text" style={{ whiteSpace: 'pre-line', wordBreak: 'break-word' }}>{reply.comment}</div>
              </div>
              {isAuthenticated && isReplyOwner && (
                <div className="discussion-actions">
                  <button className="action-btn" onClick={() => { setModal('editReply', true); setState(prev => ({ ...prev, editingReply: reply, editReply: reply.comment || '' })) }}>Edit</button>
                  <button className="action-btn" style={{ color: '#dc2626' }} onClick={() => handleDeleteReply(reply.id)}>Hapus</button>
                </div>
              )}
            </div>
          )
        })}
      </div>
    )
  }

  const authors = getAuthors()
  const genres = getGenres()
  const reviewsTree = buildReviewTree(state.reviews)
  const fileFormat = getFileFormat()
  const reactionStats = {
    comments: book.totalComments || 0,
    ratings: book.totalRatings || 0,
    averageRating: book.averageRating || 0
  }

  useEffect(() => { loadReviews() }, [loadReviews])
  useEffect(() => {
    if (isAuthenticated && user && state.reviews.length > 0) {
      const userReview = state.reviews.find(r => r.userName === user.username && r.reactionType === 'COMMENT' && !r.parentId)
      const ratingItem = state.reviews.find(r => r.userName === user.username && r.reactionType === 'RATING')
      setState(prev => ({ ...prev, userRating: ratingItem ? { rating: ratingItem.rating, id: ratingItem.id } : null, userReview: userReview || null }))
    }
  }, [isAuthenticated, user, state.reviews])
  useEffect(() => { document.title = `${book.title} - Lentera Pustaka` }, [book])

  const tabs = [
    { id: 'description', label: 'Deskripsi', icon: '📄' },
    { id: 'details', label: 'Detail', icon: 'ℹ️' },
    { id: 'reviews', label: `Review (${reviewsTree.length})`, icon: '💬' },
    { id: 'analytics', label: 'Statistik', icon: '📊' }
  ]

  const Modal = ({ show, title, onClose, children }) => show ? (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content card" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{title}</h3>
          <button className="btn btn-secondary btn-small" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  ) : null

  return (
    <div className="container">
      {notification && (
        <div className={`notification notification-${notification.type}`}>
          <span>{notification.type === 'success' ? '✅' : notification.type === 'error' ? '❌' : notification.type === 'warning' ? '⚠️' : 'ℹ️'}</span>
          <span>{notification.message}</span>
        </div>
      )}

      <div className="book-detail-container">
        <div className="book-detail-main">
          <div className="book-cover-section">
            <div className="book-cover-wrapper">
              {book.coverImageUrl ? (
                <img src={book.coverImageUrl} alt={`Cover ${book.title}`} className="book-cover-image" loading="lazy" onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex' }} />
              ) : null}
              <div className={`book-cover-placeholder ${book.coverImageUrl ? 'hidden' : ''}`}>
                <div className="placeholder-icon">📚</div>
                <div className="placeholder-text">Cover {fileFormat.toUpperCase()}</div>
              </div>
            </div>

            <div className="book-actions">
              <button className="btn btn-primary btn-action" onClick={handleStartReading}><span>📖</span><span>Mulai Membaca</span></button>
              <button className="btn btn-secondary btn-action" onClick={handleDownload} disabled={state.isDownloading}>
                <span>{state.isDownloading ? '⏳' : '💾'}</span><span>{state.isDownloading ? 'Mengunduh...' : `Unduh ${fileFormat.toUpperCase()}`}</span>
              </button>
              <div className="action-row">
                <button className="btn btn-secondary btn-small" onClick={handleShare}>Bagikan</button>
                <button className="btn btn-secondary btn-small" onClick={() => { setModal('rating', true); setState(prev => ({ ...prev, newRating: state.userRating?.rating || 5 })) }}>{state.userRating ? 'Edit Rating' : 'Beri Rating'}</button>
                <button className="btn btn-secondary btn-small" onClick={() => state.userReview ? (setModal('editReview', true), setState(prev => ({ ...prev, editingReview: state.userReview, editReview: { comment: state.userReview.comment || '', title: state.userReview.title || '' } }))) : setModal('review', true)}>{state.userReview ? 'Edit Review' : 'Tulis Review'}</button>
              </div>

              {isAuthenticated && (state.userRating || state.userReview) && (
                <div style={{
                  padding: '0.75rem',
                  background: theme === 'light' ? 'rgba(34, 83, 48, 0.08)' : 'rgba(222, 150, 190, 0.12)',
                  border: `1px solid ${theme === 'light' ? 'rgba(34, 83, 48, 0.2)' : 'rgba(222, 150, 190, 0.3)'}`,
                  borderRadius: '8px',
                  fontSize: '0.875rem',
                  marginBottom: '0.75rem'
                }}>
                  <div style={{
                    fontWeight: '600',
                    marginBottom: '0.5rem',
                    color: theme === 'light' ? '#225330' : '#de96be'
                  }}>Kontribusi Anda:</div>
                  {state.userRating && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                      <span>Rating: {state.userRating.rating}/5 ⭐</span>
                      <button className="btn btn-secondary btn-small" style={{ marginLeft: 'auto', padding: '0.25rem 0.5rem', fontSize: '0.75rem' }} onClick={handleDeleteRating} title="Hapus rating">✕</button>
                    </div>
                  )}
                  {state.userReview && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span>Review: {state.userReview.title || 'Tanpa judul'}</span>
                      <button className="btn btn-secondary btn-small" style={{ marginLeft: 'auto', padding: '0.25rem 0.5rem', fontSize: '0.75rem' }} onClick={handleDeleteReview} title="Hapus review">✕</button>
                    </div>
                  )}
                </div>
              )}

              <div className="book-quick-stats" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem' }}>
                {[
                  { label: 'Dilihat', value: book.viewCount || 0, icon: '👁️' },
                  { label: 'Diunduh', value: book.downloadCount || 0, icon: '📥' },
                  { label: 'Rating', value: reactionStats.averageRating ? `${reactionStats.averageRating.toFixed(1)}/5` : 'Belum ada', icon: '⭐' },
                  { label: 'Review', value: reactionStats.comments, icon: '💬' }
                ].map(stat => (
                  <div key={stat.label} className="stat-item" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem', backgroundColor: theme === 'light' ? '#f9fafb' : '#1f2937', borderRadius: '8px', border: `1px solid ${theme === 'light' ? '#e5e7eb' : '#374151'}` }}>
                    <div className="stat-icon" style={{ fontSize: '1.25rem' }}>{stat.icon}</div>
                    <div className="stat-details" style={{ flex: 1, minWidth: 0 }}>
                      <div className="stat-label" style={{ fontSize: '0.75rem', color: theme === 'light' ? '#6b7280' : '#9ca3af', marginBottom: '0.125rem' }}>{stat.label}</div>
                      <div className="stat-value" style={{ fontSize: '0.875rem', fontWeight: '600', color: theme === 'light' ? '#111827' : '#f9fafb', lineHeight: '1.2', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {typeof stat.value === 'number' ? stat.value.toLocaleString('id-ID') : stat.value}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="book-info-section">
            <div className="book-header">
              <h1 className="book-title">{book.title}</h1>
              {authors?.length > 0 && (
                <div className="book-authors">
                  oleh {authors.map((author, index) => (
                    <span key={author.id} className="author-name">{author.name}{index < authors.length - 1 && ', '}</span>
                  ))}
                </div>
              )}

              <div className="book-meta">
                {[
                  { icon: '🏢', text: book.publisher },
                  { icon: '📅', text: book.publicationYear },
                  { icon: '🌍', text: book.language },
                  { icon: '📂', text: book.category },
                  { icon: '📄', text: fileFormat.toUpperCase() }
                ].map((item, i) => (
                  <div key={i} className="meta-item"><span>{item.icon}</span><span>{item.text}</span></div>
                ))}
              </div>

              {genres?.length > 0 && (
                <div className="book-genres">
                  {genres.map(genre => (
                    <span key={genre.id} className="genre-tag" style={{ backgroundColor: (theme === 'light' ? '#225330' : '#de96be') + '20', color: theme === 'light' ? '#225330' : '#de96be', borderColor: theme === 'light' ? '#225330' : '#de96be' }}>
                      {genre.name}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="book-tabs" style={{ justifyContent: 'center' }}>
              {tabs.map(tab => (
                <button key={tab.id} className={`tab-button ${state.activeTab === tab.id ? 'active' : ''}`} onClick={() => setState(prev => ({ ...prev, activeTab: tab.id }))} style={{ fontFamily: 'inherit' }}>
                  <span className="tab-icon" style={{ fontFamily: 'inherit' }}>{tab.icon}</span>
                  <span className="tab-label" style={{ fontFamily: 'inherit' }}>{tab.label}</span>
                </button>
              ))}
            </div>

            <div className="book-tab-content">
              {state.activeTab === 'description' && (
                <div className="tab-content-wrapper">
                  {book.description && (
                    <div className="book-description">
                      <h3 className="section-title">Deskripsi</h3>
                      <div className="description-text">
                        {book.description.split('\n').map((paragraph, index) => paragraph.trim() && <p key={index}>{paragraph}</p>)}
                      </div>
                    </div>
                  )}

                  <div className="key-info-grid">
                    {[
                      { title: 'Statistik Buku', items: [
                        { label: 'Total Halaman:', value: book.totalPages ? book.totalPages.toLocaleString('id-ID') : 'N/A' },
                        { label: 'Total Kata:', value: book.totalWord ? book.totalWord.toLocaleString('id-ID') : 'N/A' },
                        { label: 'Estimasi Baca:', value: formatReadingTime(book.estimatedReadTime) },
                        { label: 'Level Kesulitan:', value: getDifficultyLabel(book.difficultyLevel) }
                      ]},
                      { title: 'Informasi File', items: [
                        { label: 'Format File:', value: fileFormat.toUpperCase() },
                        { label: 'Ukuran File:', value: formatFileSize(book.fileSize) }
                      ]}
                    ].map((card, i) => (
                      <div key={i} className="info-card">
                        <h4>{card.title}</h4>
                        <div className="info-items">
                          {card.items.map((item, j) => (
                            <div key={j} className="info-item"><span>{item.label}</span><span>{item.value}</span></div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {state.activeTab === 'details' && (
                <div className="tab-content-wrapper">
                  <div className="metadata-grid">
                    <div className="metadata-section">
                      <h4>Informasi Penulis</h4>
                      <div className="metadata-items">
                        {authors?.map(author => (
                          <div key={author.id} className="metadata-item">
                            <span className="meta-label">Nama:</span>
                            <span className="meta-value">{author.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="metadata-section">
                      <h4>Detail Publikasi</h4>
                      <div className="metadata-items">
                        {[
                          { label: 'Penerbit:', value: book.publisher },
                          { label: 'Tahun Terbit:', value: book.publicationYear },
                          { label: 'Bahasa:', value: book.language },
                          { label: 'Kategori:', value: book.category }
                        ].map((item, i) => (
                          <div key={i} className="metadata-item">
                            <span className="meta-label">{item.label}</span>
                            <span className="meta-value">{item.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {genres?.length > 0 && (
                      <div className="metadata-section tags-section">
                        <h4>Genre & Tag</h4>
                        <div className="tags-container">
                          {genres.map(genre => (
                            <span key={genre.id} className="tag-item" style={{ backgroundColor: (theme === 'light' ? '#225330' : '#de96be') + '20', color: theme === 'light' ? '#225330' : '#de96be', borderColor: theme === 'light' ? '#225330' : '#de96be' }}>
                              {genre.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {state.activeTab === 'reviews' && (
                <div className="tab-content-wrapper">
                  <div className="discussions-section">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                      <h3 className="section-title">Review({reviewsTree.length})</h3>
                      {!state.userReview && <button className="btn btn-primary btn-small" onClick={() => setModal('review', true)}>Tulis Review</button>}
                    </div>

                    {state.loading ? (
                      <div className="text-center" style={{ padding: '3rem', color: '#6b7280' }}>
                        <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⏳</div>
                        <p>Memuat review...</p>
                      </div>
                    ) : reviewsTree.length === 0 ? (
                      <div className="text-center" style={{ padding: '3rem', color: '#6b7280' }}>
                        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>💬</div>
                        <p>Belum ada review untuk buku ini.</p>
                        <p>Jadilah yang pertama memberikan review!</p>
                      </div>
                    ) : (
                      <div className="discussions-list">
                        {reviewsTree.map(review => <ReviewItem key={review.id} review={review} />)}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {state.activeTab === 'analytics' && (
                <div className="tab-content-wrapper">
                  <div className="key-info-grid">
                    {[
                      { title: 'Statistik Interaksi', items: [
                        { label: 'Total Dilihat:', value: (book.viewCount || 0).toLocaleString('id-ID') },
                        { label: 'Total Unduhan:', value: (book.downloadCount || 0).toLocaleString('id-ID') },
                        { label: 'Total Review:', value: reactionStats.comments.toLocaleString('id-ID') },
                        { label: 'Total Rating:', value: reactionStats.ratings.toLocaleString('id-ID') },
                        { label: 'Rata-rata Rating:', value: reactionStats.averageRating ? `${reactionStats.averageRating.toFixed(1)}/5` : 'Belum ada' }
                      ]},
                      { title: 'Informasi Teknis', items: [
                        { label: 'ID Buku:', value: book.id },
                        { label: 'Slug:', value: book.slug },
                        { label: 'Format File:', value: fileFormat.toUpperCase() },
                        { label: 'Ukuran File:', value: formatFileSize(book.fileSize) }
                      ]}
                    ].map((card, i) => (
                      <div key={i} className="info-card">
                        <h4>{card.title}</h4>
                        <div className="info-items">
                          {card.items.map((item, j) => (
                            <div key={j} className="info-item"><span>{item.label}</span><span>{item.value}</span></div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <Modal show={state.modals.share} title="Bagikan Buku" onClose={() => setModal('share', false)}>
          <input type="text" className="form-control" value={window.location.href} readOnly onClick={(e) => e.target.select()} />
          <button className="btn btn-primary btn-small w-full" style={{ marginTop: '0.5rem' }} onClick={() => {
            navigator.clipboard.writeText(window.location.href)
            showNotification('Link berhasil disalin!', 'success')
            setModal('share', false)
          }}>Salin Link</button>
        </Modal>

        <Modal show={state.modals.rating} title={state.userRating ? 'Edit Rating' : 'Beri Rating'} onClose={() => setModal('rating', false)}>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', fontSize: '2rem', marginBottom: '1rem' }}>
            {[1, 2, 3, 4, 5].map(star => (
              <button key={star} onClick={() => setState(prev => ({ ...prev, newRating: star }))} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '2rem', padding: '0.25rem' }}>
                {star <= state.newRating ? '⭐' : '☆'}
              </button>
            ))}
          </div>
          <div style={{ textAlign: 'center', marginBottom: '1rem', fontSize: '1.125rem', fontWeight: '600' }}>{state.newRating}/5</div>
          <button className="btn btn-primary w-full" onClick={handleAddRating}>{state.userRating ? 'Update Rating' : 'Tambah Rating'}</button>
        </Modal>

        <Modal show={state.modals.review} title="Tulis Review" onClose={() => setModal('review', false)}>
          <input type="text" className="form-control" placeholder="Judul review (opsional)" value={state.newReview.title} onChange={(e) => setState(prev => ({ ...prev, newReview: { ...prev.newReview, title: e.target.value } }))} style={{ marginBottom: '0.75rem' }} />
          <textarea className="form-control" placeholder="Tulis review Anda... (minimal 10 karakter)" value={state.newReview.comment} onChange={(e) => setState(prev => ({ ...prev, newReview: { ...prev.newReview, comment: e.target.value } }))} rows={5} style={{ marginBottom: '0.75rem' }} />
          <button className="btn btn-primary w-full" onClick={handleAddReview}>Kirim Review</button>
        </Modal>

        <Modal show={state.modals.editReview} title="Edit Review" onClose={() => setModal('editReview', false)}>
          <input type="text" className="form-control" placeholder="Judul review (opsional)" value={state.editReview.title} onChange={(e) => setState(prev => ({ ...prev, editReview: { ...prev.editReview, title: e.target.value } }))} style={{ marginBottom: '0.75rem' }} />
          <textarea className="form-control" placeholder="Tulis review Anda... (minimal 10 karakter)" value={state.editReview.comment} onChange={(e) => setState(prev => ({ ...prev, editReview: { ...prev.editReview, comment: e.target.value } }))} rows={5} style={{ marginBottom: '0.75rem' }} />
          <button className="btn btn-primary w-full" onClick={handleUpdateReview}>Update Review</button>
        </Modal>

        <Modal show={state.modals.reply} title="Balas Review" onClose={() => setModal('reply', false)}>
          <div style={{ marginBottom: '1rem', padding: '0.75rem', backgroundColor: theme === 'light' ? '#f9fafb' : '#1f2937', borderRadius: '8px' }}>
            <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>{state.replyToReview?.userName}</div>
            <div style={{ fontSize: '0.875rem', color: theme === 'light' ? '#6b7280' : '#9ca3af' }}>{state.replyToReview?.comment}</div>
          </div>
          <textarea className="form-control" placeholder="Tulis balasan Anda..." value={state.newReply} onChange={(e) => setState(prev => ({ ...prev, newReply: e.target.value }))} rows={4} style={{ marginBottom: '0.75rem' }} />
          <button className="btn btn-primary w-full" onClick={handleAddReply}>Kirim Balasan</button>
        </Modal>

        <Modal show={state.modals.editReply} title="Edit Balasan" onClose={() => setModal('editReply', false)}>
          <textarea className="form-control" placeholder="Edit balasan Anda..." value={state.editReply} onChange={(e) => setState(prev => ({ ...prev, editReply: e.target.value }))} rows={4} style={{ marginBottom: '0.75rem' }} />
          <button className="btn btn-primary w-full" onClick={handleUpdateReply}>Update Balasan</button>
        </Modal>
      </div>
    </div>
  )
}

export default BookDetail