import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { bookService } from '../../services/bookService'
import { useTheme } from '../../hooks/useTheme'
import { useAuth } from '../../context/AuthContext'

const BookDetail = ({ book }) => {
  const navigate = useNavigate()
  const { theme } = useTheme()
  const { isAuthenticated, user } = useAuth()

  const [state, setState] = useState({
    isDownloading: false,
    activeTab: 'description',
    showShareModal: false,
    showEmotionModal: false,
    showRatingModal: false,
    showCommentModal: false,
    showReplyModal: false,
    showReactToCommentModal: false,
    showEditCommentModal: false,
    editingComment: null,
    replyToReaction: null,
    reactToComment: null,
    userReaction: null,
    userRating: null,
    newEmotion: { type: 'LIKE' },
    newRating: { rating: 5 },
    newComment: { comment: '', title: '', rating: null },
    editComment: { comment: '', title: '', rating: null },
    newReply: { comment: '' },
    newCommentReaction: { type: 'LIKE' },
    expandedReplies: new Set(),
    reactions: [],
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
      total: (book.totalLikes || 0) + (book.totalLoves || 0) + (book.totalDislikes || 0) +
             (book.totalAngry || 0) + (book.totalSad || 0),
      likes: book.totalLikes || 0,
      loves: book.totalLoves || 0,
      dislikes: book.totalDislikes || 0,
      angry: book.totalAngry || 0,
      sad: book.totalSad || 0,
      comments: book.totalComments || 0,
      ratings: book.totalRatings || 0,
      averageRating: book.averageRating || 0
    }
  }, [book])

  const loadReactions = useCallback(async () => {
    if (!book.slug) return
    try {
      setState(prev => ({ ...prev, loading: true }))
      const response = await bookService.getReactions(book.slug)
      if (response.result === 'Success' && response.data) {
        setState(prev => ({
          ...prev,
          reactions: response.data,
          loading: false
        }))
      }
    } catch (error) {
      console.error('Error loading reactions:', error)
      setState(prev => ({ ...prev, loading: false }))
    }
  }, [book.slug])

  const buildCommentTree = useCallback((reactions) => {
    if (!reactions || !Array.isArray(reactions)) return []
    const comments = reactions.filter(r => r.comment && r.comment.trim() !== '')
    const commentMap = new Map()
    const rootComments = []

    comments.forEach(comment => {
      commentMap.set(comment.id, { ...comment, children: [] })
    })

    comments.forEach(comment => {
      if (comment.parentId && commentMap.has(comment.parentId)) {
        commentMap.get(comment.parentId).children.push(commentMap.get(comment.id))
      } else if (!comment.parentId) {
        rootComments.push(commentMap.get(comment.id))
      }
    })

    rootComments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

    const sortChildren = (comment) => {
      if (comment.children && comment.children.length > 0) {
        comment.children.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
        comment.children.forEach(sortChildren)
      }
    }

    rootComments.forEach(sortChildren)
    return rootComments
  }, [])

  const getDiscussions = useCallback(() => {
    return buildCommentTree(state.reactions)
  }, [state.reactions, buildCommentTree])

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

  const handleAddEmotion = useCallback(async () => {
    if (!isAuthenticated) {
      showNotification('Silakan login untuk memberikan reaksi', 'warning')
      return
    }
    try {
      const payload = {
        type: state.newEmotion.type,
        reactionId: state.userReaction?.id || null
      }
      await bookService.addReaction(book.slug, payload)
      setState(prev => ({ ...prev, showEmotionModal: false, newEmotion: { type: 'LIKE' } }))
      showNotification(state.userReaction ? 'Reaksi berhasil diupdate!' : 'Reaksi berhasil ditambahkan!', 'success')
      await loadReactions()
    } catch (error) {
      showNotification(error.message || 'Gagal menambahkan reaksi', 'error')
    }
  }, [isAuthenticated, book.slug, state.newEmotion, state.userReaction, showNotification, loadReactions])

  const handleAddRating = useCallback(async () => {
    if (!isAuthenticated) {
      showNotification('Silakan login untuk memberikan rating', 'warning')
      return
    }
    try {
      const payload = {
        type: 'RATING',
        rating: state.newRating.rating,
        reactionId: state.userRating?.id || state.userReaction?.id || null
      }
      await bookService.addReaction(book.slug, payload)
      setState(prev => ({ ...prev, showRatingModal: false, newRating: { rating: 5 } }))
      showNotification(state.userRating ? 'Rating berhasil diupdate!' : 'Rating berhasil ditambahkan!', 'success')
      await loadReactions()
    } catch (error) {
      showNotification(error.message || 'Gagal menambahkan rating', 'error')
    }
  }, [isAuthenticated, book.slug, state.newRating, state.userRating, state.userReaction, showNotification, loadReactions])

  const handleAddComment = useCallback(async () => {
    if (!isAuthenticated) {
      showNotification('Silakan login untuk menulis komentar', 'warning')
      return
    }
    if (!state.newComment.comment.trim()) {
      showNotification('Komentar tidak boleh kosong', 'warning')
      return
    }
    try {
      const payload = {
        type: 'COMMENT',
        comment: state.newComment.comment,
        title: state.newComment.title || null,
        rating: state.newComment.rating || null
      }
      await bookService.addReaction(book.slug, payload)
      setState(prev => ({
        ...prev,
        showCommentModal: false,
        newComment: { comment: '', title: '', rating: null }
      }))
      showNotification('Komentar berhasil ditambahkan!', 'success')
      await loadReactions()
    } catch (error) {
      showNotification(error.message || 'Gagal menambahkan komentar', 'error')
    }
  }, [isAuthenticated, book.slug, state.newComment, showNotification, loadReactions])

  const handleUpdateComment = useCallback(async () => {
    if (!isAuthenticated) {
      showNotification('Silakan login untuk mengupdate komentar', 'warning')
      return
    }
    if (!state.editComment.comment.trim()) {
      showNotification('Komentar tidak boleh kosong', 'warning')
      return
    }
    try {
      const payload = {
        type: 'COMMENT',
        comment: state.editComment.comment,
        title: state.editComment.title || null,
        rating: state.editComment.rating || null,
        reactionId: state.editingComment.id
      }
      await bookService.addReaction(book.slug, payload)
      setState(prev => ({
        ...prev,
        showEditCommentModal: false,
        editingComment: null,
        editComment: { comment: '', title: '', rating: null }
      }))
      showNotification('Komentar berhasil diupdate!', 'success')
      await loadReactions()
    } catch (error) {
      showNotification(error.message || 'Gagal mengupdate komentar', 'error')
    }
  }, [isAuthenticated, book.slug, state.editComment, state.editingComment, showNotification, loadReactions])

  const handleAddReply = useCallback(async () => {
    if (!isAuthenticated) {
      showNotification('Silakan login untuk membalas komentar', 'warning')
      return
    }
    if (!state.newReply.comment.trim()) {
      showNotification('Balasan tidak boleh kosong', 'warning')
      return
    }
    try {
      await bookService.addReply(book.slug, state.replyToReaction.id, state.newReply)
      setState(prev => ({
        ...prev,
        showReplyModal: false,
        replyToReaction: null,
        newReply: { comment: '' }
      }))
      showNotification('Balasan berhasil ditambahkan!', 'success')
      await loadReactions()
    } catch (error) {
      showNotification(error.message || 'Gagal menambahkan balasan', 'error')
    }
  }, [isAuthenticated, book.slug, state.replyToReaction, state.newReply, showNotification, loadReactions])

  const handleAddCommentReaction = useCallback(async () => {
    if (!isAuthenticated) {
      showNotification('Silakan login untuk memberikan reaksi', 'warning')
      return
    }
    try {
      const payload = {
        type: state.newCommentReaction.type,
        parentId: state.reactToComment.id
      }
      await bookService.addReaction(book.slug, payload)
      setState(prev => ({
        ...prev,
        showReactToCommentModal: false,
        reactToComment: null,
        newCommentReaction: { type: 'LIKE' }
      }))
      showNotification('Reaksi pada komentar berhasil ditambahkan!', 'success')
      await loadReactions()
    } catch (error) {
      showNotification(error.message || 'Gagal menambahkan reaksi', 'error')
    }
  }, [isAuthenticated, book.slug, state.newCommentReaction, state.reactToComment, showNotification, loadReactions])

  const handleDeleteReaction = useCallback(async (reactionId) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus ini?')) return
    try {
      await bookService.removeReaction(book.slug, reactionId)
      showNotification('Berhasil dihapus!', 'success')
      await loadReactions()
    } catch (error) {
      showNotification(error.message || 'Gagal menghapus', 'error')
    }
  }, [book.slug, showNotification, loadReactions])

  const handleDeleteEmotion = useCallback(async () => {
    if (!state.userReaction) return
    if (!window.confirm('Hapus reaksi emosi Anda?')) return
    try {
      await bookService.removeReaction(book.slug, state.userReaction.id)
      showNotification('Reaksi berhasil dihapus!', 'success')
      await loadReactions()
    } catch (error) {
      showNotification(error.message || 'Gagal menghapus reaksi', 'error')
    }
  }, [book.slug, state.userReaction, showNotification, loadReactions])

  const handleDeleteRating = useCallback(async () => {
    const targetReaction = state.userRating || state.userReaction
    if (!targetReaction) return
    if (!window.confirm('Hapus rating Anda?')) return
    try {
      await bookService.removeReaction(book.slug, targetReaction.id)
      showNotification('Rating berhasil dihapus!', 'success')
      await loadReactions()
    } catch (error) {
      showNotification(error.message || 'Gagal menghapus rating', 'error')
    }
  }, [book.slug, state.userRating, state.userReaction, showNotification, loadReactions])

  const handleReplyToComment = useCallback((comment) => {
    setState(prev => ({
      ...prev,
      showReplyModal: true,
      replyToReaction: comment
    }))
  }, [])

  const handleReactToComment = useCallback((comment) => {
    setState(prev => ({
      ...prev,
      showReactToCommentModal: true,
      reactToComment: comment
    }))
  }, [])

  const handleEditComment = useCallback((comment) => {
    setState(prev => ({
      ...prev,
      showEditCommentModal: true,
      editingComment: comment,
      editComment: {
        comment: comment.comment || '',
        title: comment.title || '',
        rating: comment.rating || null
      }
    }))
  }, [])

  const toggleReplies = useCallback((commentId) => {
    setState(prev => {
      const newExpanded = new Set(prev.expandedReplies)
      if (newExpanded.has(commentId)) {
        newExpanded.delete(commentId)
      } else {
        newExpanded.add(commentId)
      }
      return { ...prev, expandedReplies: newExpanded }
    })
  }, [])

  const CommentItem = ({ comment, depth = 0 }) => {
    const isOwner = user && comment.userId === user.id

    return (
      <div className="discussion-item" style={{ marginLeft: `${depth * 1.5}rem` }}>
        <div className="discussion-header">
          <div className="user-info">
            <div className="user-avatar">
              {comment.userName?.charAt(0).toUpperCase() || '👤'}
            </div>
            <div className="user-details">
              <h5>{comment.userName || 'Pengguna'}</h5>
              <p>{formatDate(comment.createdAt)}</p>
            </div>
          </div>
          <div className="reaction-info">
            {comment.rating && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <span>⭐</span>
                <span style={{ fontWeight: '600' }}>{comment.rating}/5</span>
              </div>
            )}
          </div>
        </div>

        <div className="discussion-content">
          {comment.title && (
            <div className="discussion-title">{comment.title}</div>
          )}
          <div className="discussion-text">{comment.comment}</div>
        </div>

        <div className="discussion-actions">
          {isAuthenticated && !isOwner && (
            <>
              <button className="action-btn" onClick={() => handleReplyToComment(comment)}>
                💬 Balas
              </button>
              {!comment.parentId && (
                <button className="action-btn" onClick={() => handleReactToComment(comment)}>
                  😊 Reaksi
                </button>
              )}
            </>
          )}
          {isOwner && (
            <>
              <button className="action-btn" onClick={() => handleEditComment(comment)}>
                ✏️ Edit
              </button>
              <button className="action-btn" style={{ color: '#dc2626' }} onClick={() => handleDeleteReaction(comment.id)}>
                🗑️ Hapus
              </button>
            </>
          )}
          {comment.children?.length > 0 && (
            <button className="action-btn" onClick={() => toggleReplies(comment.id)}>
              {state.expandedReplies.has(comment.id) ? '▼' : '▶'} {comment.children.length} balasan
            </button>
          )}
        </div>

        {state.expandedReplies.has(comment.id) && comment.children?.map(child => (
          <CommentItem key={child.id} comment={child} depth={depth + 1} />
        ))}
      </div>
    )
  }

  const authors = getAuthors()
  const genres = getGenres()
  const reactionStats = getReactionStats()
  const discussions = getDiscussions()
  const fileFormat = getFileFormat()

  useEffect(() => {
    loadReactions()
  }, [loadReactions])

  useEffect(() => {
    if (isAuthenticated && user && state.reactions.length > 0) {
      const userMainReaction = state.reactions.find(r =>
        r.userId === user.id && !r.parentId && !r.comment
      )

      const userRating = state.reactions.find(r =>
        r.userId === user.id && !r.parentId && !r.comment && r.reactionType === 'RATING'
      )

      setState(prev => ({
        ...prev,
        userReaction: userMainReaction || null,
        userRating: userRating || null
      }))
    }
  }, [isAuthenticated, user, state.reactions])

  useEffect(() => {
    document.title = `${book.title} - Lentera Pustaka`
  }, [book])

  const tabs = [
    { id: 'description', label: 'Deskripsi', icon: '📄' },
    { id: 'details', label: 'Detail', icon: 'ℹ️' },
    { id: 'discussions', label: `Diskusi (${discussions.length})`, icon: '💬' },
    { id: 'analytics', label: 'Statistik', icon: '📊' }
  ]

  const reactionEmojis = {
    LIKE: '👍',
    LOVE: '❤️',
    DISLIKE: '👎',
    ANGRY: '😠',
    SAD: '😢'
  }

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
                  🔗 Bagikan
                </button>
                {isAuthenticated && (
                  <>
                    <button
                      className="btn btn-secondary btn-small"
                      onClick={() => setState(prev => ({
                        ...prev,
                        showEmotionModal: true,
                        newEmotion: { type: state.userReaction?.reactionType || 'LIKE' }
                      }))}
                    >
                      {state.userReaction ? '✏️ Edit Reaksi' : '😊 Beri Reaksi'}
                    </button>
                    <button
                      className="btn btn-secondary btn-small"
                      onClick={() => setState(prev => ({
                        ...prev,
                        showRatingModal: true,
                        newRating: { rating: state.userRating?.rating || state.userReaction?.rating || 5 }
                      }))}
                    >
                      {state.userRating || state.userReaction?.rating ? '✏️ Edit Rating' : '⭐ Beri Rating'}
                    </button>
                  </>
                )}
              </div>

              {isAuthenticated && (state.userReaction || state.userRating) && (
                <div style={{
                  padding: '0.75rem',
                  background: theme === 'light' ? '#f0fdf4' : '#064e3b',
                  borderRadius: '8px',
                  fontSize: '0.875rem'
                }}>
                  <div style={{ fontWeight: '600', marginBottom: '0.5rem' }}>Reaksi Anda:</div>
                  {state.userReaction && state.userReaction.reactionType !== 'RATING' && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                      <span>{reactionEmojis[state.userReaction.reactionType]} {state.userReaction.reactionType}</span>
                      <button
                        className="btn btn-secondary btn-small"
                        style={{ marginLeft: 'auto', padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                        onClick={handleDeleteEmotion}
                      >
                        ✕
                      </button>
                    </div>
                  )}
                  {(state.userRating || state.userReaction?.rating) && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span>⭐ Rating: {state.userRating?.rating || state.userReaction?.rating}/5</span>
                      <button
                        className="btn btn-secondary btn-small"
                        style={{ marginLeft: 'auto', padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                        onClick={handleDeleteRating}
                      >
                        ✕
                      </button>
                    </div>
                  )}
                </div>
              )}

              <div className="book-quick-stats" style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '0.75rem'
              }}>
                {[
                  { label: 'Dilihat', value: book.viewCount || 0, icon: '👁️' },
                  { label: 'Diunduh', value: book.downloadCount || 0, icon: '📥' },
                  { label: 'Rating', value: reactionStats.averageRating ? `${reactionStats.averageRating.toFixed(1)}/5` : 'Belum ada', icon: '⭐' },
                  { label: 'Reaksi', value: reactionStats.total, icon: '😊' }
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

              <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                {[
                  { key: 'likes', value: book.totalLikes, emoji: '👍', label: 'Suka' },
                  { key: 'loves', value: book.totalLoves, emoji: '❤️', label: 'Cinta' },
                  { key: 'dislikes', value: book.totalDislikes, emoji: '👎', label: 'Tidak Suka' },
                  { key: 'angry', value: book.totalAngry, emoji: '😠', label: 'Marah' },
                  { key: 'sad', value: book.totalSad, emoji: '😢', label: 'Sedih' },
                  { key: 'comments', value: book.totalComments, emoji: '💬', label: 'Komentar' }
                ].filter(stat => stat.value > 0).map(stat => (
                  <div key={stat.key} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <span>{stat.emoji}</span>
                    <span style={{ fontSize: '0.875rem', fontWeight: '600' }}>{stat.value}</span>
                  </div>
                ))}
              </div>
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
                      <h4>📊 Statistik Buku</h4>
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
                      <h4>📁 Informasi File</h4>
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
                      <h4>👤 Informasi Penulis</h4>
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
                      <h4>📚 Detail Publikasi</h4>
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
                        <h4>🏷️ Genre & Tag</h4>
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

              {state.activeTab === 'discussions' && (
                <div className="tab-content-wrapper">
                  <div className="discussions-section">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                      <h3 className="section-title">Diskusi & Komentar ({discussions.length})</h3>
                      {isAuthenticated && (
                        <button
                          className="btn btn-primary btn-small"
                          onClick={() => setState(prev => ({ ...prev, showCommentModal: true }))}
                        >
                          💬 Tulis Komentar
                        </button>
                      )}
                    </div>

                    {state.loading ? (
                      <div className="text-center" style={{ padding: '3rem', color: '#6b7280' }}>
                        <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⏳</div>
                        <p>Memuat diskusi...</p>
                      </div>
                    ) : discussions.length === 0 ? (
                      <div className="text-center" style={{ padding: '3rem', color: '#6b7280' }}>
                        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>💬</div>
                        <p>Belum ada diskusi untuk buku ini.</p>
                        <p>Jadilah yang pertama memberikan komentar!</p>
                      </div>
                    ) : (
                      <div className="discussions-list">
                        {discussions.map(discussion => (
                          <CommentItem key={discussion.id} comment={discussion} depth={0} />
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
                      <h4>📊 Statistik Interaksi</h4>
                      <div className="info-items">
                        <div className="info-item">
                          <span>👁️ Total Dilihat:</span>
                          <span>{formatNumber(book.viewCount || 0)}</span>
                        </div>
                        <div className="info-item">
                          <span>📥 Total Unduhan:</span>
                          <span>{formatNumber(book.downloadCount || 0)}</span>
                        </div>
                        <div className="info-item">
                          <span>💬 Total Komentar:</span>
                          <span>{formatNumber(reactionStats.comments)}</span>
                        </div>
                        <div className="info-item">
                          <span>⭐ Total Rating:</span>
                          <span>{formatNumber(reactionStats.ratings)}</span>
                        </div>
                        <div className="info-item">
                          <span>📊 Rata-rata Rating:</span>
                          <span>{reactionStats.averageRating ? `${reactionStats.averageRating.toFixed(1)}/5` : 'Belum ada'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="info-card">
                      <h4>😊 Distribusi Reaksi</h4>
                      <div className="info-items">
                        {Object.entries(reactionStats).filter(([key]) =>
                          ['likes', 'loves', 'dislikes', 'angry', 'sad'].includes(key)
                        ).map(([key, value]) => (
                          <div key={key} className="info-item">
                            <span>{reactionEmojis[key.slice(0, -1).toUpperCase()]} {key.charAt(0).toUpperCase() + key.slice(1)}:</span>
                            <span>{formatNumber(value)}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="info-card">
                      <h4>📈 Informasi Teknis</h4>
                      <div className="info-items">
                        <div className="info-item">
                          <span>🆔 ID Buku:</span>
                          <span>{book.id}</span>
                        </div>
                        <div className="info-item">
                          <span>🔗 Slug:</span>
                          <span>{book.slug}</span>
                        </div>
                        <div className="info-item">
                          <span>📁 Format File:</span>
                          <span>{fileFormat.toUpperCase()}</span>
                        </div>
                        <div className="info-item">
                          <span>💾 Ukuran File:</span>
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
                }}>📋 Salin Link</button>
              </div>
            </div>
          </div>
        )}

        {state.showEmotionModal && (
          <div className="modal-overlay" onClick={() => setState(prev => ({ ...prev, showEmotionModal: false }))}>
            <div className="modal-content card" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h3>{state.userReaction ? 'Edit Reaksi Emosi' : 'Berikan Reaksi Emosi'}</h3>
                <button className="btn btn-secondary btn-small" onClick={() => setState(prev => ({ ...prev, showEmotionModal: false }))}>✕</button>
              </div>
              <div className="modal-body">
                <div className="form-group">
                  <label>Pilih Reaksi Emosi:</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem', marginTop: '0.5rem' }}>
                    {['LIKE', 'LOVE', 'DISLIKE', 'ANGRY', 'SAD'].map(emotion => (
                      <button key={emotion} className={`btn ${state.newEmotion.type === emotion ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() => setState(prev => ({ ...prev, newEmotion: { type: emotion } }))}>
                        {reactionEmojis[emotion]} {emotion}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="modal-actions">
                  <button className="btn btn-secondary" onClick={() => setState(prev => ({ ...prev, showEmotionModal: false }))}>Batal</button>
                  <button className="btn btn-primary" onClick={handleAddEmotion}>{state.userReaction ? 'Update Reaksi' : 'Kirim Reaksi'}</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {state.showRatingModal && (
          <div className="modal-overlay" onClick={() => setState(prev => ({ ...prev, showRatingModal: false }))}>
            <div className="modal-content card" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h3>{state.userRating || state.userReaction?.rating ? 'Edit Rating' : 'Berikan Rating'}</h3>
                <button className="btn btn-secondary btn-small" onClick={() => setState(prev => ({ ...prev, showRatingModal: false }))}>✕</button>
              </div>
              <div className="modal-body">
                <div className="form-group">
                  <label>Rating (1-5):</label>
                  <div className="rating-input" style={{ display: 'flex', gap: '0.5rem', fontSize: '2rem', justifyContent: 'center', margin: '1rem 0' }}>
                    {[1, 2, 3, 4, 5].map(star => (
                      <span key={star} className={`star ${star <= state.newRating.rating ? 'active' : ''}`}
                        onClick={() => setState(prev => ({ ...prev, newRating: { rating: star } }))}
                        style={{ cursor: 'pointer', opacity: star <= state.newRating.rating ? 1 : 0.3 }}>⭐</span>
                    ))}
                  </div>
                  <p style={{ textAlign: 'center', color: '#6b7280' }}>Rating Anda: {state.newRating.rating}/5</p>
                </div>
                <div className="modal-actions">
                  <button className="btn btn-secondary" onClick={() => setState(prev => ({ ...prev, showRatingModal: false }))}>Batal</button>
                  <button className="btn btn-primary" onClick={handleAddRating}>{state.userRating || state.userReaction?.rating ? 'Update Rating' : 'Kirim Rating'}</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {state.showCommentModal && (
          <div className="modal-overlay" onClick={() => setState(prev => ({ ...prev, showCommentModal: false }))}>
            <div className="modal-content card" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Tulis Komentar</h3>
                <button className="btn btn-secondary btn-small" onClick={() => setState(prev => ({ ...prev, showCommentModal: false }))}>✕</button>
              </div>
              <div className="modal-body">
                <div className="form-group">
                  <label>Judul (opsional):</label>
                  <input type="text" className="form-control" value={state.newComment.title}
                    onChange={(e) => setState(prev => ({ ...prev, newComment: { ...prev.newComment, title: e.target.value } }))}
                    placeholder="Berikan judul untuk komentar Anda..." />
                </div>
                <div className="form-group">
                  <label>Komentar: *</label>
                  <textarea className="form-control textarea-control" value={state.newComment.comment}
                    onChange={(e) => setState(prev => ({ ...prev, newComment: { ...prev.newComment, comment: e.target.value } }))}
                    placeholder="Tulis komentar Anda tentang buku ini..." rows="5" />
                </div>
                <div className="form-group">
                  <label>Rating (opsional):</label>
                  <div className="rating-input" style={{ display: 'flex', gap: '0.5rem', fontSize: '1.5rem', margin: '0.5rem 0' }}>
                    {[1, 2, 3, 4, 5].map(star => (
                      <span key={star} className={`star ${state.newComment.rating && star <= state.newComment.rating ? 'active' : ''}`}
                        onClick={() => setState(prev => ({ ...prev, newComment: { ...prev.newComment, rating: prev.newComment.rating === star ? null : star } }))}
                        style={{ cursor: 'pointer', opacity: state.newComment.rating && star <= state.newComment.rating ? 1 : 0.3 }}>⭐</span>
                    ))}
                    {state.newComment.rating && (
                      <button className="btn btn-secondary btn-small" style={{ marginLeft: '0.5rem' }}
                        onClick={() => setState(prev => ({ ...prev, newComment: { ...prev.newComment, rating: null } }))}>✕ Hapus Rating</button>
                    )}
                  </div>
                  {state.newComment.rating && <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>Rating: {state.newComment.rating}/5</p>}
                </div>
                <div className="modal-actions">
                  <button className="btn btn-secondary" onClick={() => setState(prev => ({ ...prev, showCommentModal: false, newComment: { comment: '', title: '', rating: null } }))}>Batal</button>
                  <button className="btn btn-primary" onClick={handleAddComment} disabled={!state.newComment.comment.trim()}>Kirim Komentar</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {state.showEditCommentModal && (
          <div className="modal-overlay" onClick={() => setState(prev => ({ ...prev, showEditCommentModal: false }))}>
            <div className="modal-content card" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Edit Komentar</h3>
                <button className="btn btn-secondary btn-small" onClick={() => setState(prev => ({ ...prev, showEditCommentModal: false }))}>✕</button>
              </div>
              <div className="modal-body">
                <div className="form-group">
                  <label>Judul (opsional):</label>
                  <input type="text" className="form-control" value={state.editComment.title}
                    onChange={(e) => setState(prev => ({ ...prev, editComment: { ...prev.editComment, title: e.target.value } }))}
                    placeholder="Berikan judul untuk komentar Anda..." />
                </div>
                <div className="form-group">
                  <label>Komentar: *</label>
                  <textarea className="form-control textarea-control" value={state.editComment.comment}
                    onChange={(e) => setState(prev => ({ ...prev, editComment: { ...prev.editComment, comment: e.target.value } }))}
                    placeholder="Tulis komentar Anda tentang buku ini..." rows="5" />
                </div>
                <div className="form-group">
                  <label>Rating (opsional):</label>
                  <div className="rating-input" style={{ display: 'flex', gap: '0.5rem', fontSize: '1.5rem', margin: '0.5rem 0' }}>
                    {[1, 2, 3, 4, 5].map(star => (
                      <span key={star} className={`star ${state.editComment.rating && star <= state.editComment.rating ? 'active' : ''}`}
                        onClick={() => setState(prev => ({ ...prev, editComment: { ...prev.editComment, rating: prev.editComment.rating === star ? null : star } }))}
                        style={{ cursor: 'pointer', opacity: state.editComment.rating && star <= state.editComment.rating ? 1 : 0.3 }}>⭐</span>
                    ))}
                    {state.editComment.rating && (
                      <button className="btn btn-secondary btn-small" style={{ marginLeft: '0.5rem' }}
                        onClick={() => setState(prev => ({ ...prev, editComment: { ...prev.editComment, rating: null } }))}>✕ Hapus Rating</button>
                    )}
                  </div>
                  {state.editComment.rating && <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>Rating: {state.editComment.rating}/5</p>}
                </div>
                <div className="modal-actions">
                  <button className="btn btn-secondary" onClick={() => setState(prev => ({ ...prev, showEditCommentModal: false, editingComment: null, editComment: { comment: '', title: '', rating: null } }))}>Batal</button>
                  <button className="btn btn-primary" onClick={handleUpdateComment} disabled={!state.editComment.comment.trim()}>Update Komentar</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {state.showReplyModal && (
          <div className="modal-overlay" onClick={() => setState(prev => ({ ...prev, showReplyModal: false }))}>
            <div className="modal-content card" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Balas Komentar</h3>
                <button className="btn btn-secondary btn-small" onClick={() => setState(prev => ({ ...prev, showReplyModal: false }))}>✕</button>
              </div>
              <div className="modal-body">
                <div style={{ padding: '1rem', background: theme === 'light' ? '#f9fafb' : '#1f2937', borderRadius: '8px', marginBottom: '1rem' }}>
                  <div style={{ fontWeight: '600', marginBottom: '0.5rem' }}>Membalas komentar dari {state.replyToReaction?.userName}:</div>
                  <div style={{ color: '#6b7280', fontStyle: 'italic' }}>"{state.replyToReaction?.comment}"</div>
                </div>
                <div className="form-group">
                  <label>Balasan Anda:</label>
                  <textarea className="form-control textarea-control" value={state.newReply.comment}
                    onChange={(e) => setState(prev => ({ ...prev, newReply: { ...prev.newReply, comment: e.target.value } }))}
                    placeholder="Tulis balasan Anda..." rows="4" />
                </div>
                <div className="modal-actions">
                  <button className="btn btn-secondary" onClick={() => setState(prev => ({ ...prev, showReplyModal: false, replyToReaction: null, newReply: { comment: '' } }))}>Batal</button>
                  <button className="btn btn-primary" onClick={handleAddReply} disabled={!state.newReply.comment.trim()}>Kirim Balasan</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {state.showReactToCommentModal && (
          <div className="modal-overlay" onClick={() => setState(prev => ({ ...prev, showReactToCommentModal: false }))}>
            <div className="modal-content card" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Beri Reaksi pada Komentar</h3>
                <button className="btn btn-secondary btn-small" onClick={() => setState(prev => ({ ...prev, showReactToCommentModal: false }))}>✕</button>
              </div>
              <div className="modal-body">
                <div style={{ padding: '1rem', background: theme === 'light' ? '#f9fafb' : '#1f2937', borderRadius: '8px', marginBottom: '1rem' }}>
                  <div style={{ fontWeight: '600', marginBottom: '0.5rem' }}>Memberikan reaksi pada komentar dari {state.reactToComment?.userName}:</div>
                  <div style={{ color: '#6b7280', fontStyle: 'italic' }}>"{state.reactToComment?.comment?.substring(0, 100)}{state.reactToComment?.comment?.length > 100 ? '...' : ''}"</div>
                </div>
                <div className="form-group">
                  <label>Pilih Reaksi:</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem', marginTop: '0.5rem' }}>
                    {['LIKE', 'LOVE', 'DISLIKE', 'ANGRY', 'SAD'].map(emotion => (
                      <button key={emotion} className={`btn ${state.newCommentReaction.type === emotion ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() => setState(prev => ({ ...prev, newCommentReaction: { type: emotion } }))}>
                        {reactionEmojis[emotion]} {emotion}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="modal-actions">
                  <button className="btn btn-secondary" onClick={() => setState(prev => ({ ...prev, showReactToCommentModal: false, reactToComment: null, newCommentReaction: { type: 'LIKE' } }))}>Batal</button>
                  <button className="btn btn-primary" onClick={handleAddCommentReaction}>Kirim Reaksi</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default BookDetail