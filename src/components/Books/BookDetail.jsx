import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { bookService } from '../../services/bookService'
import { useTheme } from '../../hooks/useTheme'
import { useAuth } from '../../context/AuthContext'

const BookDetail = ({ book }) => {
  const navigate = useNavigate()
  const { theme } = useTheme()
  const { isAuthenticated, user } = useAuth()

    console.log('Full user object:', user)  // <-- tambahkan ini
    console.log('isAuthenticated:', isAuthenticated)  // <-- dan ini

  const [state, setState] = useState({
    isDownloading: false,
    activeTab: 'description',
    showShareModal: false,
    showRatingModal: false,
    showReviewModal: false,
    showReplyModal: false,
    showEditReviewModal: false,
    editingReview: null,
    replyToReview: null,
    userRating: null,
    userReview: null,
    newRating: 5,
    newReview: { comment: '', title: '' },
    editReview: { comment: '', title: '' },
    newReply: '',
    expandedReplies: new Set(),
    reviews: [],
    loading: false
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

  const formatDate = useCallback((dateString) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }, [])

  const showNotification = useCallback((message, type = 'info') => {
    setNotification({ message, type, id: Date.now() })
    setTimeout(() => setNotification(null), 4000)
  }, [])

  const getFileFormat = useCallback(() => {
    if (book.fileFormat) return book.fileFormat.toLowerCase()
    if (book.fileUrl) {
      const url = book.fileUrl.toLowerCase()
      if (url.includes('.pdf') || url.endsWith('.pdf')) return 'pdf'
      if (url.includes('.epub') || url.endsWith('.epub')) return 'epub'
    }
    return 'epub'
  }, [book.fileFormat, book.fileUrl])

  const getAuthors = useCallback(() => {
    if (book.authorNames && book.authorSlugs) {
      const names = book.authorNames.split(', ')
      const slugs = book.authorSlugs.split(', ')
      return names.map((name, index) => ({
        id: index + 1,
        name: name.trim(),
        slug: slugs[index]?.trim() || name.toLowerCase().replace(/\s+/g, '-')
      }))
    }
    return []
  }, [book.authorNames, book.authorSlugs])

  const getGenres = useCallback(() => {
    if (book.genres) {
      return book.genres.split(', ').map((genre, index) => ({
        id: index + 1,
        name: genre.trim()
      }))
    }
    return []
  }, [book.genres])

  const getReactionStats = useCallback(() => {
    return {
      comments: book.totalComments || 0,
      ratings: book.totalRatings || 0,
      averageRating: book.averageRating || 0
    }
  }, [book])

    const loadReviews = useCallback(async () => {
     if (!book.slug) return
     try {
       setState(prev => ({ ...prev, loading: true }))
       const response = await bookService.getReviews(book.slug, 1, 100)
       console.log('Reviews response:', response)

       // API returns { result: "Success", data: [...] }
       if ((response.result === 'Success' || response.status === 'SUCCESS') && response.data) {
         setState(prev => ({
           ...prev,
           reviews: Array.isArray(response.data) ? response.data : [],
           loading: false
         }))
       } else {
         setState(prev => ({ ...prev, reviews: [], loading: false }))
       }
     } catch (error) {
       console.error('Error loading reviews:', error)
       setState(prev => ({ ...prev, reviews: [], loading: false }))
     }
    }, [book.slug])

  const buildReviewTree = useCallback((reviews) => {
    if (!reviews || !Array.isArray(reviews)) return []

    const reviewMap = new Map()
    const rootReviews = []

    // First pass: identify root reviews (no parentId)
    reviews.forEach(review => {
      if (!review.parentId && review.reactionType === 'COMMENT') {
        reviewMap.set(review.id, { ...review, replies: [], feedbacks: [] })
      }
    })

    // Second pass: attach replies and feedbacks
    reviews.forEach(item => {
      if (item.parentId && reviewMap.has(item.parentId)) {
        const parent = reviewMap.get(item.parentId)

        if (item.reactionType === 'COMMENT') {
          parent.replies.push(item)
        } else if (item.reactionType === 'HELPFUL' || item.reactionType === 'NOT_HELPFUL') {
          parent.feedbacks.push(item)
        }
      }
    })

    // Collect root reviews
    reviewMap.forEach(review => {
      rootReviews.push(review)
    })

    // Sort reviews and replies
    rootReviews.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    rootReviews.forEach(review => {
      review.replies.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
    })

    return rootReviews
  }, [])

  const getReviewsTree = useCallback(() => {
    return buildReviewTree(state.reviews)
  }, [state.reviews, buildReviewTree])

  const handleStartReading = useCallback(() => {
    const fileFormat = getFileFormat()
    if (fileFormat === 'pdf') {
      navigate(`/${book.slug}/read-pdf`)
    } else {
      navigate(`/${book.slug}/read`)
    }
  }, [navigate, book.slug, getFileFormat])

  const handleDownload = useCallback(async () => {
    if (state.isDownloading) return
    setState(prev => ({ ...prev, isDownloading: true }))
    try {
      const fileFormat = getFileFormat()
      const extension = fileFormat === 'pdf' ? 'pdf' : 'epub'
      const filename = `${book.title.replace(/[^a-zA-Z0-9\s-]/g, '').replace(/\s+/g, '_')}.${extension}`
      await bookService.downloadBook(book.slug, filename)
      showNotification(`Buku berhasil diunduh dalam format ${extension.toUpperCase()}!`, 'success')
    } catch (error) {
      showNotification(error.message || 'Gagal mengunduh ebook. Silakan coba lagi.', 'error')
    } finally {
      setState(prev => ({ ...prev, isDownloading: false }))
    }
  }, [state.isDownloading, book, showNotification, getFileFormat])

  const handleShare = useCallback(() => {
    const url = window.location.href
    const title = `${book.title} - Lentera Pustaka`
    const text = book.description ? `${book.description.substring(0, 100)}...` : `Baca "${book.title}" di Lentera Pustaka`

    if (navigator.share) {
      navigator.share({ title, text, url }).catch(console.error)
    } else if (navigator.clipboard) {
      navigator.clipboard.writeText(url)
        .then(() => showNotification('Link berhasil disalin ke clipboard!', 'success'))
        .catch(() => setState(prev => ({ ...prev, showShareModal: true })))
    } else {
      setState(prev => ({ ...prev, showShareModal: true }))
    }
  }, [book.title, book.description, showNotification])

  const handleAddRating = useCallback(async () => {
    if (!isAuthenticated) {
      showNotification('Silakan login terlebih dahulu', 'warning')
      setTimeout(() => {
        navigate('/login', { state: { from: window.location.pathname } })
      }, 1500)
      return
    }
    try {
      const response = await bookService.addOrUpdateRating(book.slug, state.newRating)
      setState(prev => ({ ...prev, showRatingModal: false, newRating: 5 }))
      showNotification(state.userRating ? 'Rating berhasil diupdate!' : 'Rating berhasil ditambahkan!', 'success')
      await loadReviews()
    } catch (error) {
      showNotification(error.response?.data?.message || error.message || 'Gagal menambahkan rating', 'error')
    }
  }, [isAuthenticated, navigate, book.slug, state.newRating, state.userRating, showNotification, loadReviews])

  const handleDeleteRating = useCallback(async () => {
    if (!state.userRating) return
    if (!window.confirm('Hapus rating Anda?')) return
    try {
      await bookService.deleteRating(book.slug)
      showNotification('Rating berhasil dihapus!', 'success')
      await loadReviews()
    } catch (error) {
      showNotification(error.response?.data?.message || error.message || 'Gagal menghapus rating', 'error')
    }
  }, [book.slug, state.userRating, showNotification, loadReviews])

  const handleAddReview = useCallback(async () => {
    if (!isAuthenticated) {
      showNotification('Silakan login terlebih dahulu', 'warning')
      setTimeout(() => {
        navigate('/login', { state: { from: window.location.pathname } })
      }, 1500)
      return
    }
    if (!state.newReview.comment.trim()) {
      showNotification('Review tidak boleh kosong', 'warning')
      return
    }
    if (state.newReview.comment.trim().length < 10) {
      showNotification('Review harus minimal 10 karakter', 'warning')
      return
    }
    try {
      await bookService.addReview(book.slug, {
        title: state.newReview.title || null,
        comment: state.newReview.comment
      })
      setState(prev => ({
        ...prev,
        showReviewModal: false,
        newReview: { comment: '', title: '' }
      }))
      showNotification('Review berhasil ditambahkan!', 'success')
      await loadReviews()
    } catch (error) {
      showNotification(error.response?.data?.message || error.message || 'Gagal menambahkan review', 'error')
    }
  }, [isAuthenticated, navigate, book.slug, state.newReview, showNotification, loadReviews])

  const handleUpdateReview = useCallback(async () => {
    if (!isAuthenticated) {
      showNotification('Silakan login untuk mengupdate review', 'warning')
      return
    }
    if (!state.editReview.comment.trim()) {
      showNotification('Review tidak boleh kosong', 'warning')
      return
    }
    if (state.editReview.comment.trim().length < 10) {
      showNotification('Review harus minimal 10 karakter', 'warning')
      return
    }
    try {
      await bookService.updateReview(book.slug, {
        title: state.editReview.title || null,
        comment: state.editReview.comment
      })
      setState(prev => ({
        ...prev,
        showEditReviewModal: false,
        editingReview: null,
        editReview: { comment: '', title: '' }
      }))
      showNotification('Review berhasil diupdate!', 'success')
      await loadReviews()
    } catch (error) {
      showNotification(error.response?.data?.message || error.message || 'Gagal mengupdate review', 'error')
    }
  }, [isAuthenticated, book.slug, state.editReview, showNotification, loadReviews])

  const handleDeleteReview = useCallback(async () => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus review ini?')) return
    try {
      await bookService.deleteReview(book.slug)
      showNotification('Review berhasil dihapus!', 'success')
      await loadReviews()
    } catch (error) {
      showNotification(error.response?.data?.message || error.message || 'Gagal menghapus review', 'error')
    }
  }, [book.slug, showNotification, loadReviews])

  const handleAddReply = useCallback(async () => {
    if (!isAuthenticated) {
      showNotification('Silakan login untuk membalas review', 'warning')
      return
    }
    if (!state.newReply.trim()) {
      showNotification('Balasan tidak boleh kosong', 'warning')
      return
    }
    try {
      await bookService.addReply(book.slug, state.replyToReview.id, state.newReply)
      setState(prev => ({
        ...prev,
        showReplyModal: false,
        replyToReview: null,
        newReply: ''
      }))
      showNotification('Balasan berhasil ditambahkan!', 'success')
      await loadReviews()
    } catch (error) {
      showNotification(error.response?.data?.message || error.message || 'Gagal menambahkan balasan', 'error')
    }
  }, [isAuthenticated, book.slug, state.replyToReview, state.newReply, showNotification, loadReviews])

  const handleDeleteReply = useCallback(async (replyId) => {
    if (!window.confirm('Hapus balasan ini?')) return
    try {
      await bookService.deleteReply(book.slug, replyId)
      showNotification('Balasan berhasil dihapus!', 'success')
      await loadReviews()
    } catch (error) {
      showNotification(error.response?.data?.message || error.message || 'Gagal menghapus balasan', 'error')
    }
  }, [book.slug, showNotification, loadReviews])

  const handleFeedback = useCallback(async (reviewId, feedbackType) => {
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
  }, [isAuthenticated, book.slug, showNotification, loadReviews])

  const handleReplyToReview = useCallback((review) => {
    setState(prev => ({
      ...prev,
      showReplyModal: true,
      replyToReview: review
    }))
  }, [])

  const handleEditReview = useCallback((review) => {
    setState(prev => ({
      ...prev,
      showEditReviewModal: true,
      editingReview: review,
      editReview: {
        comment: review.comment || '',
        title: review.title || ''
      }
    }))
  }, [])

  const toggleReplies = useCallback((reviewId) => {
    setState(prev => {
      const newExpanded = new Set(prev.expandedReplies)
      if (newExpanded.has(reviewId)) {
        newExpanded.delete(reviewId)
      } else {
        newExpanded.add(reviewId)
      }
      return { ...prev, expandedReplies: newExpanded }
    })
  }, [])

    const ReviewItem = ({ review }) => {
      const isOwner = user && review.userName && user.username &&
        (review.userName.toLowerCase() === user.username.toLowerCase())

      const helpfulCount = review.feedbacks?.filter(f => f.reactionType === 'HELPFUL').length || 0
      const notHelpfulCount = review.feedbacks?.filter(f => f.reactionType === 'NOT_HELPFUL').length || 0
      const userFeedback = user ? review.feedbacks?.find(f => f.userName === user.username) : null

      console.log('ReviewItem debug:', {
        reviewUserName: review.userName,
        currentUsername: user?.username,
        isOwner,
        isAuthenticated
      })

    return (
      <div className="discussion-item">
        <div className="discussion-header">
          <div className="user-info">
            <div className="user-avatar">
              {review.userName?.charAt(0).toUpperCase() || '?'}
            </div>
            <div className="user-details">
              <h5>{review.userName || 'Pengguna'}</h5>
              <p>{formatDate(review.createdAt)}</p>
            </div>
          </div>
        </div>

        <div className="discussion-content">
          {review.title && (
            <div className="discussion-title">{review.title}</div>
          )}
          <div className="discussion-text">{review.comment}</div>
        </div>

        <div className="discussion-actions">
          {isAuthenticated && !isOwner && (
            <>
              <button className="action-btn" onClick={() => handleReplyToReview(review)}>
                Balas
              </button>
              <button
                className={`action-btn ${userFeedback?.reactionType === 'HELPFUL' ? 'active' : ''}`}
                onClick={() => handleFeedback(review.id, 'HELPFUL')}
              >
                Membantu ({helpfulCount})
              </button>
              <button
                className={`action-btn ${userFeedback?.reactionType === 'NOT_HELPFUL' ? 'active' : ''}`}
                onClick={() => handleFeedback(review.id, 'NOT_HELPFUL')}
              >
                Tidak Membantu ({notHelpfulCount})
              </button>
            </>
          )}
          {isAuthenticated && isOwner && (
            <>
              <button className="action-btn" onClick={() => handleEditReview(review)}>
                Edit
              </button>
              <button className="action-btn" style={{ color: '#dc2626' }} onClick={handleDeleteReview}>
                Hapus
              </button>
              <div style={{ marginLeft: 'auto', fontSize: '0.875rem', color: '#6b7280' }}>
                {helpfulCount} membantu · {notHelpfulCount} tidak membantu
              </div>
            </>
          )}
          {review.replies?.length > 0 && (
            <button className="action-btn" onClick={() => toggleReplies(review.id)}>
              {state.expandedReplies.has(review.id) ? '▼' : '▶'} {review.replies.length} balasan
            </button>
          )}
        </div>

      {state.expandedReplies.has(review.id) && review.replies?.map(reply => {
        const isReplyOwner = user && reply.userName === user.username
          return (
            <div key={reply.id} className="discussion-item" style={{ marginLeft: '2rem', marginTop: '1rem' }}>
              <div className="discussion-header">
                <div className="user-info">
                  <div className="user-avatar">
                    {reply.userName?.charAt(0).toUpperCase() || '?'}
                  </div>
                  <div className="user-details">
                    <h5>{reply.userName || 'Pengguna'}</h5>
                    <p>{formatDate(reply.createdAt)}</p>
                  </div>
                </div>
              </div>
              <div className="discussion-content">
                <div className="discussion-text">{reply.comment}</div>
              </div>
              {isAuthenticated && isReplyOwner && (
                <div className="discussion-actions">
                  <button className="action-btn" style={{ color: '#dc2626' }} onClick={() => handleDeleteReply(reply.id)}>
                    Hapus
                  </button>
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
  const reactionStats = getReactionStats()
  const reviewsTree = getReviewsTree()
  const fileFormat = getFileFormat()

  useEffect(() => {
    loadReviews()
  }, [loadReviews])

    useEffect(() => {
      if (isAuthenticated && user && state.reviews.length > 0) {
        const userReview = state.reviews.find(r =>
          r.userName === user.username && r.reactionType === 'COMMENT' && !r.parentId
        )

        let userRating = null
        if (userReview?.rating) {
          userRating = { rating: userReview.rating, id: userReview.id }
        }

        setState(prev => ({
          ...prev,
          userRating: userRating,
          userReview: userReview || null
        }))
      }
    }, [isAuthenticated, user, state.reviews])

  useEffect(() => {
    document.title = `${book.title} - Lentera Pustaka`
  }, [book])

  const tabs = [
    { id: 'description', label: 'Deskripsi', icon: '📄' },
    { id: 'details', label: 'Detail', icon: 'ℹ️' },
    { id: 'reviews', label: `Review (${reviewsTree.length})`, icon: '💬' },
    { id: 'analytics', label: 'Statistik', icon: '📊' }
  ]

  return (
    <div className="container">
      {notification && (
        <div className={`notification notification-${notification.type}`}>
          <span>
            {notification.type === 'success' ? '✅' :
             notification.type === 'error' ? '❌' :
             notification.type === 'warning' ? '⚠️' : 'ℹ️'}
          </span>
          <span>{notification.message}</span>
        </div>
      )}

      <div className="book-detail-container">
        <div className="book-detail-main">
          <div className="book-cover-section">
            <div className="book-cover-wrapper">
              {book.coverImageUrl ? (
                <img
                  src={book.coverImageUrl}
                  alt={`Cover ${book.title}`}
                  className="book-cover-image"
                  loading="lazy"
                  onError={(e) => {
                    e.target.style.display = 'none'
                    e.target.nextSibling.style.display = 'flex'
                  }}
                />
              ) : null}
              <div className={`book-cover-placeholder ${book.coverImageUrl ? 'hidden' : ''}`}>
                <div className="placeholder-icon">📚</div>
                <div className="placeholder-text">Cover {fileFormat.toUpperCase()}</div>
              </div>
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
                <span>{state.isDownloading ? 'Mengunduh...' : `Unduh ${fileFormat.toUpperCase()}`}</span>
              </button>
              <div className="action-row">
                <button className="btn btn-secondary btn-small" onClick={handleShare}>
                  Bagikan
                </button>
                <button
                  className="btn btn-secondary btn-small"
                  onClick={() => setState(prev => ({
                    ...prev,
                    showRatingModal: true,
                    newRating: state.userRating?.rating || 5
                  }))}
                >
                  {state.userRating ? 'Edit Rating' : 'Beri Rating'}
                </button>
                <button
                  className="btn btn-secondary btn-small"
                  onClick={() => {
                    if (state.userReview) {
                      handleEditReview(state.userReview)
                    } else {
                      setState(prev => ({ ...prev, showReviewModal: true }))
                    }
                  }}
                >
                  {state.userReview ? 'Edit Review' : 'Tulis Review'}
                </button>
              </div>

              <div className="book-quick-stats" style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '0.75rem'
              }}>
                {[
                  { label: 'Dilihat', value: book.viewCount || 0, icon: '👁️' },
                  { label: 'Diunduh', value: book.downloadCount || 0, icon: '📥' },
                  { label: 'Rating', value: reactionStats.averageRating ? `${reactionStats.averageRating.toFixed(1)}/5` : 'Belum ada', icon: '⭐' },
                  { label: 'Review', value: reactionStats.comments, icon: '💬' }
                ].map(stat => (
                  <div key={stat.label} className="stat-item" style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.75rem',
                    backgroundColor: theme === 'light' ? '#f9fafb' : '#1f2937',
                    borderRadius: '8px',
                    border: `1px solid ${theme === 'light' ? '#e5e7eb' : '#374151'}`
                  }}>
                    <div className="stat-icon" style={{ fontSize: '1.25rem' }}>{stat.icon}</div>
                    <div className="stat-details" style={{ flex: 1, minWidth: 0 }}>
                      <div className="stat-label" style={{
                        fontSize: '0.75rem',
                        color: theme === 'light' ? '#6b7280' : '#9ca3af',
                        marginBottom: '0.125rem'
                      }}>{stat.label}</div>
                      <div className="stat-value" style={{
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        color: theme === 'light' ? '#111827' : '#f9fafb',
                        lineHeight: '1.2',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {typeof stat.value === 'number' ? formatNumber(stat.value) : stat.value}
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
                    <span key={author.id} className="author-name">
                      {author.name}
                      {index < authors.length - 1 && ', '}
                    </span>
                  ))}
                </div>
              )}

              <div className="book-meta">
                <div className="meta-item">
                  <span>🏢</span>
                  <span>{book.publisher}</span>
                </div>
                <div className="meta-item">
                  <span>📅</span>
                  <span>{book.publicationYear}</span>
                </div>
                <div className="meta-item">
                  <span>🌍</span>
                  <span>{book.language}</span>
                </div>
                <div className="meta-item">
                  <span>📂</span>
                  <span>{book.category}</span>
                </div>
                <div className="meta-item">
                  <span>📄</span>
                  <span>{fileFormat.toUpperCase()}</span>
                </div>
              </div>

              {genres?.length > 0 && (
                <div className="book-genres">
                  {genres.map(genre => (
                    <span
                      key={genre.id}
                      className="genre-tag"
                      style={{
                        backgroundColor: (theme === 'light' ? '#225330' : '#de96be') + '20',
                        color: theme === 'light' ? '#225330' : '#de96be',
                        borderColor: theme === 'light' ? '#225330' : '#de96be'
                      }}
                    >
                      {genre.name}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="book-tabs">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  className={`tab-button ${state.activeTab === tab.id ? 'active' : ''}`}
                  onClick={() => setState(prev => ({ ...prev, activeTab: tab.id }))}
                >
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
                      <h3 className="section-title">Deskripsi</h3>
                      <div className="description-text">
                        {book.description.split('\n').map((paragraph, index) =>
                          paragraph.trim() && <p key={index}>{paragraph}</p>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="key-info-grid">
                    <div className="info-card">
                      <h4>Statistik Buku</h4>
                      <div className="info-items">
                        <div className="info-item">
                          <span>Total Halaman:</span>
                          <span>{book.totalPages ? formatNumber(book.totalPages) : 'N/A'}</span>
                        </div>
                        <div className="info-item">
                          <span>Total Kata:</span>
                          <span>{book.totalWord ? formatNumber(book.totalWord) : 'N/A'}</span>
                        </div>
                        <div className="info-item">
                          <span>Estimasi Baca:</span>
                          <span>{formatReadingTime(book.estimatedReadTime)}</span>
                        </div>
                        <div className="info-item">
                          <span>Level Kesulitan:</span>
                          <span>{getDifficultyLabel(book.difficultyLevel)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="info-card">
                      <h4>Informasi File</h4>
                      <div className="info-items">
                        <div className="info-item">
                          <span>Format File:</span>
                          <span>{fileFormat.toUpperCase()}</span>
                        </div>
                        <div className="info-item">
                          <span>Ukuran File:</span>
                          <span>{formatFileSize(book.fileSize)}</span>
                        </div>
                      </div>
                    </div>
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
                          <div key={author.id}>
                            <div className="metadata-item">
                              <span className="meta-label">Nama:</span>
                              <span className="meta-value">{author.name}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="metadata-section">
                      <h4>Detail Publikasi</h4>
                      <div className="metadata-items">
                        <div className="metadata-item">
                          <span className="meta-label">Penerbit:</span>
                          <span className="meta-value">{book.publisher}</span>
                        </div>
                        <div className="metadata-item">
                          <span className="meta-label">Tahun Terbit:</span>
                          <span className="meta-value">{book.publicationYear}</span>
                        </div>
                        <div className="metadata-item">
                          <span className="meta-label">Bahasa:</span>
                          <span className="meta-value">{book.language}</span>
                        </div>
                        <div className="metadata-item">
                          <span className="meta-label">Kategori:</span>
                          <span className="meta-value">{book.category}</span>
                        </div>
                      </div>
                    </div>

                    {genres?.length > 0 && (
                      <div className="metadata-section tags-section">
                        <h4>Genre & Tag</h4>
                        <div className="tags-container">
                          {genres.map(genre => (
                            <span
                              key={genre.id}
                              className="tag-item"
                              style={{
                                backgroundColor: (theme === 'light' ? '#225330' : '#de96be') + '20',
                                color: theme === 'light' ? '#225330' : '#de96be',
                                borderColor: theme === 'light' ? '#225330' : '#de96be'
                              }}
                            >
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
                      <h3 className="section-title">Review & Diskusi ({reviewsTree.length})</h3>
                      {!state.userReview && (
                        <button
                          className="btn btn-primary btn-small"
                          onClick={() => setState(prev => ({ ...prev, showReviewModal: true }))}
                        >
                          Tulis Review
                        </button>
                      )}
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
                        {reviewsTree.map(review => (
                          <ReviewItem key={review.id} review={review} />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {state.activeTab === 'analytics' && (
                <div className="tab-content-wrapper">
                  <div className="key-info-grid">
                    <div className="info-card">
                      <h4>Statistik Interaksi</h4>
                      <div className="info-items">
                        <div className="info-item">
                          <span>Total Dilihat:</span>
                          <span>{formatNumber(book.viewCount || 0)}</span>
                        </div>
                        <div className="info-item">
                          <span>Total Unduhan:</span>
                          <span>{formatNumber(book.downloadCount || 0)}</span>
                        </div>
                        <div className="info-item">
                          <span>Total Review:</span>
                          <span>{formatNumber(reactionStats.comments)}</span>
                        </div>
                        <div className="info-item">
                          <span>Total Rating:</span>
                          <span>{formatNumber(reactionStats.ratings)}</span>
                        </div>
                        <div className="info-item">
                          <span>Rata-rata Rating:</span>
                          <span>{reactionStats.averageRating ? `${reactionStats.averageRating.toFixed(1)}/5` : 'Belum ada'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="info-card">
                      <h4>Informasi Teknis</h4>
                      <div className="info-items">
                        <div className="info-item">
                          <span>ID Buku:</span>
                          <span>{book.id}</span>
                        </div>
                        <div className="info-item">
                          <span>Slug:</span>
                          <span>{book.slug}</span>
                        </div>
                        <div className="info-item">
                          <span>Format File:</span>
                          <span>{fileFormat.toUpperCase()}</span>
                        </div>
                        <div className="info-item">
                          <span>Ukuran File:</span>
                          <span>{formatFileSize(book.fileSize)}</span>
                        </div>
                      </div>
                    </div>
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
                <input type="text" className="form-control" value={window.location.href} readOnly onClick={(e) => e.target.select()} />
                <button className="btn btn-primary btn-small w-full" style={{ marginTop: '0.5rem' }} onClick={() => {
                  navigator.clipboard.writeText(window.location.href)
                  showNotification('Link berhasil disalin!', 'success')
                  setState(prev => ({ ...prev, showShareModal: false }))
                }}>Salin Link</button>
                                       </div>
                                     </div>
                                   </div>
                                 )}

                                 {state.showRatingModal && (
                                   <div className="modal-overlay" onClick={() => setState(prev => ({ ...prev, showRatingModal: false }))}>
                                     <div className="modal-content card" onClick={e => e.stopPropagation()}>
                                       <div className="modal-header">
                                         <h3>{state.userRating ? 'Edit Rating' : 'Beri Rating'}</h3>
                                         <button className="btn btn-secondary btn-small" onClick={() => setState(prev => ({ ...prev, showRatingModal: false }))}>✕</button>
                                       </div>
                                       <div className="modal-body">
                                         <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', fontSize: '2rem', marginBottom: '1rem' }}>
                                           {[1, 2, 3, 4, 5].map(star => (
                                             <button
                                               key={star}
                                               onClick={() => setState(prev => ({ ...prev, newRating: star }))}
                                               style={{
                                                 background: 'none',
                                                 border: 'none',
                                                 cursor: 'pointer',
                                                 fontSize: '2rem',
                                                 padding: '0.25rem'
                                               }}
                                             >
                                               {star <= state.newRating ? '⭐' : '☆'}
                                             </button>
                                           ))}
                                         </div>
                                         <div style={{ textAlign: 'center', marginBottom: '1rem', fontSize: '1.125rem', fontWeight: '600' }}>
                                           {state.newRating}/5
                                         </div>
                                         <button className="btn btn-primary w-full" onClick={handleAddRating}>
                                           {state.userRating ? 'Update Rating' : 'Tambah Rating'}
                                         </button>
                                       </div>
                                     </div>
                                   </div>
                                 )}

                                 {state.showReviewModal && (
                                   <div className="modal-overlay" onClick={() => setState(prev => ({ ...prev, showReviewModal: false }))}>
                                     <div className="modal-content card" onClick={e => e.stopPropagation()}>
                                       <div className="modal-header">
                                         <h3>Tulis Review</h3>
                                         <button className="btn btn-secondary btn-small" onClick={() => setState(prev => ({ ...prev, showReviewModal: false }))}>✕</button>
                                       </div>
                                       <div className="modal-body">
                                         <input
                                           type="text"
                                           className="form-control"
                                           placeholder="Judul review (opsional)"
                                           value={state.newReview.title}
                                           onChange={(e) => setState(prev => ({
                                             ...prev,
                                             newReview: { ...prev.newReview, title: e.target.value }
                                           }))}
                                           style={{ marginBottom: '0.75rem' }}
                                         />
                                         <textarea
                                           className="form-control"
                                           placeholder="Tulis review Anda... (minimal 10 karakter)"
                                           value={state.newReview.comment}
                                           onChange={(e) => setState(prev => ({
                                             ...prev,
                                             newReview: { ...prev.newReview, comment: e.target.value }
                                           }))}
                                           rows={5}
                                           style={{ marginBottom: '0.75rem' }}
                                         />
                                         <button className="btn btn-primary w-full" onClick={handleAddReview}>
                                           Kirim Review
                                         </button>
                                       </div>
                                     </div>
                                   </div>
                                 )}

                                 {state.showEditReviewModal && (
                                   <div className="modal-overlay" onClick={() => setState(prev => ({ ...prev, showEditReviewModal: false }))}>
                                     <div className="modal-content card" onClick={e => e.stopPropagation()}>
                                       <div className="modal-header">
                                         <h3>Edit Review</h3>
                                         <button className="btn btn-secondary btn-small" onClick={() => setState(prev => ({ ...prev, showEditReviewModal: false }))}>✕</button>
                                       </div>
                                       <div className="modal-body">
                                         <input
                                           type="text"
                                           className="form-control"
                                           placeholder="Judul review (opsional)"
                                           value={state.editReview.title}
                                           onChange={(e) => setState(prev => ({
                                             ...prev,
                                             editReview: { ...prev.editReview, title: e.target.value }
                                           }))}
                                           style={{ marginBottom: '0.75rem' }}
                                         />
                                         <textarea
                                           className="form-control"
                                           placeholder="Tulis review Anda... (minimal 10 karakter)"
                                           value={state.editReview.comment}
                                           onChange={(e) => setState(prev => ({
                                             ...prev,
                                             editReview: { ...prev.editReview, comment: e.target.value }
                                           }))}
                                           rows={5}
                                           style={{ marginBottom: '0.75rem' }}
                                         />
                                         <button className="btn btn-primary w-full" onClick={handleUpdateReview}>
                                           Update Review
                                         </button>
                                       </div>
                                     </div>
                                   </div>
                                 )}

                                 {state.showReplyModal && (
                                   <div className="modal-overlay" onClick={() => setState(prev => ({ ...prev, showReplyModal: false }))}>
                                     <div className="modal-content card" onClick={e => e.stopPropagation()}>
                                       <div className="modal-header">
                                         <h3>Balas Review</h3>
                                         <button className="btn btn-secondary btn-small" onClick={() => setState(prev => ({ ...prev, showReplyModal: false }))}>✕</button>
                                       </div>
                                       <div className="modal-body">
                                         <div style={{ marginBottom: '1rem', padding: '0.75rem', backgroundColor: theme === 'light' ? '#f9fafb' : '#1f2937', borderRadius: '8px' }}>
                                           <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>
                                             {state.replyToReview?.userName}
                                           </div>
                                           <div style={{ fontSize: '0.875rem', color: theme === 'light' ? '#6b7280' : '#9ca3af' }}>
                                             {state.replyToReview?.comment}
                                           </div>
                                         </div>
                                         <textarea
                                           className="form-control"
                                           placeholder="Tulis balasan Anda..."
                                           value={state.newReply}
                                           onChange={(e) => setState(prev => ({ ...prev, newReply: e.target.value }))}
                                           rows={4}
                                           style={{ marginBottom: '0.75rem' }}
                                         />
                                         <button className="btn btn-primary w-full" onClick={handleAddReply}>
                                           Kirim Balasan
                                         </button>
                                       </div>
                                     </div>
                                   </div>
                                 )}
                               </div>
                             </div>
                           )
                         }

                         export default BookDetail