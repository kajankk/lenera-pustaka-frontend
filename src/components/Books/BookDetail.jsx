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
    showReactionModal: false,
    showReplyModal: false,
    replyToReaction: null,
    userReaction: null,
    newReaction: { type: 'LIKE', rating: 5, comment: '', title: '' },
    newReply: { comment: '' },
    expandedReplies: new Set() // Track which comment threads are expanded
  })

  const [notification, setNotification] = useState(null)

  // Utility functions
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

  // Get reaction stats from book data
  const getReactionStats = useCallback(() => {
    if (book.reactionStatsResponses && book.reactionStatsResponses.length > 0) {
      const stats = book.reactionStatsResponses[0]
      return {
        total: (stats.totalLikes || 0) + (stats.totalLoves || 0) + (stats.totalDislikes || 0) +
               (stats.totalAngry || 0) + (stats.totalSad || 0),
        likes: stats.totalLikes || 0,
        loves: stats.totalLoves || 0,
        dislikes: stats.totalDislikes || 0,
        angry: stats.totalAngry || 0,
        sad: stats.totalSad || 0,
        comments: stats.totalComments || 0,
        ratings: stats.totalRatings || 0,
        averageRating: stats.averageRating || 0
      }
    }
    return { total: 0, likes: 0, loves: 0, dislikes: 0, angry: 0, sad: 0, comments: 0, ratings: 0, averageRating: 0 }
  }, [book.reactionStatsResponses])

  // Enhanced function to build nested comment tree
  const buildCommentTree = useCallback((reactions) => {
    if (!reactions) return []

    const comments = reactions.filter(r => r.comment && r.comment.trim() !== '')
    const commentMap = new Map()
    const rootComments = []

    // First pass: create map of all comments
    comments.forEach(comment => {
      commentMap.set(comment.id, {
        ...comment,
        children: []
      })
    })

    // Second pass: build tree structure
    comments.forEach(comment => {
      if (comment.parentId && commentMap.has(comment.parentId)) {
        // This is a reply, add it to parent's children
        commentMap.get(comment.parentId).children.push(commentMap.get(comment.id))
      } else {
        // This is a root comment
        rootComments.push(commentMap.get(comment.id))
      }
    })

    return rootComments
  }, [])

  // Get discussions with nested replies
  const getDiscussions = useCallback(() => {
    return buildCommentTree(book.reactionResponses)
  }, [book.reactionResponses, buildCommentTree])

  // Event handlers
  const handleStartReading = useCallback(() => navigate(`/${book.slug}/read`), [navigate, book.slug])

  const handleDownload = useCallback(async () => {
    if (state.isDownloading) return
    setState(prev => ({ ...prev, isDownloading: true }))
    try {
      const filename = `${book.title.replace(/[^a-zA-Z0-9\s-]/g, '').replace(/\s+/g, '_')}.epub`
      await bookService.downloadBook(book.slug, filename)
      showNotification('Buku berhasil diunduh!', 'success')
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
      navigator.clipboard.writeText(url)
        .then(() => showNotification('Link berhasil disalin ke clipboard!', 'success'))
        .catch(() => setState(prev => ({ ...prev, showShareModal: true })))
    } else {
      setState(prev => ({ ...prev, showShareModal: true }))
    }
  }, [book.title, book.description, showNotification])

  const handleAddReaction = useCallback(async () => {
    if (!isAuthenticated) {
      showNotification('Silakan login untuk memberikan reaksi', 'warning')
      return
    }

    try {
      const response = await bookService.addReaction(book.slug, state.newReaction)
      setState(prev => ({
        ...prev,
        userReaction: response.data,
        showReactionModal: false,
        newReaction: { type: 'LIKE', rating: 5, comment: '', title: '' }
      }))
      showNotification('Reaksi berhasil ditambahkan!', 'success')
      window.location.reload()
    } catch (error) {
      showNotification(error.message || 'Gagal menambahkan reaksi', 'error')
    }
  }, [isAuthenticated, book.slug, state.newReaction, showNotification])

  const handleAddReply = useCallback(async () => {
    if (!isAuthenticated) {
      showNotification('Silakan login untuk membalas komentar', 'warning')
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
      window.location.reload()
    } catch (error) {
      showNotification(error.message || 'Gagal menambahkan balasan', 'error')
    }
  }, [isAuthenticated, book.slug, state.replyToReaction, state.newReply, showNotification])

  // Function to handle reply to any comment (including nested replies)
  const handleReplyToComment = useCallback((comment) => {
    setState(prev => ({
      ...prev,
      showReplyModal: true,
      replyToReaction: comment
    }))
  }, [])

  // Function to toggle expanded replies
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

  // Recursive component to render comment tree
  const CommentItem = ({ comment, depth = 0 }) => (
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
          <span className="reaction-badge" style={{
            backgroundColor: comment.reactionType === 'LIKE' ? '#dcfce7' :
                            comment.reactionType === 'LOVE' ? '#fce7f3' :
                            comment.reactionType === 'DISLIKE' ? '#fef2f2' : '#f3f4f6',
            color: comment.reactionType === 'LIKE' ? '#166534' :
                   comment.reactionType === 'LOVE' ? '#be185d' :
                   comment.reactionType === 'DISLIKE' ? '#991b1b' : '#374151'
          }}>
            {reactionEmojis[comment.reactionType] || '💬'} {comment.reactionType}
          </span>
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
        {isAuthenticated && (
          <button
            className="action-btn"
            onClick={() => handleReplyToComment(comment)}
          >
            💬 Balas
          </button>
        )}
        {comment.children?.length > 0 && (
          <button
            className="action-btn"
            onClick={() => toggleReplies(comment.id)}
          >
            {state.expandedReplies.has(comment.id) ? '▼' : '▶'} {comment.children.length} balasan
          </button>
        )}
      </div>

      {/* Render nested replies */}
      {state.expandedReplies.has(comment.id) && comment.children?.map(child => (
        <CommentItem key={child.id} comment={child} depth={depth + 1} />
      ))}
    </div>
  )

  const reactionStats = getReactionStats()
  const discussions = getDiscussions()

  // Get user's existing reaction
  useEffect(() => {
    if (isAuthenticated && user && book.reactionResponses) {
      const userReaction = book.reactionResponses.find(r =>
        r.userId === user.id || (r.user && r.user.id === user.id)
      )
      setState(prev => ({ ...prev, userReaction }))
    }
  }, [isAuthenticated, user, book.reactionResponses])

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
  }, [book])

  const tabs = [
    { id: 'description', label: 'Deskripsi', icon: '📄' },
    { id: 'details', label: 'Detail Lengkap', icon: 'ℹ️' },
    { id: 'discussions', label: `Diskusi (${discussions.length})`, icon: '💬' },
    { id: 'analytics', label: 'Statistik', icon: '📊' }
  ]

  const reactionEmojis = {
    LIKE: '👍',
    LOVE: '❤️',
    DISLIKE: '👎',
    ANGRY: '😠',
    SAD: '😢',
    COMMENT: '💬'
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
        <div className="breadcrumb">
          <button
            className="btn btn-secondary btn-small"
            onClick={() => navigate('/books')}
          >
            ← Kembali ke Daftar Buku
          </button>
          <span className="breadcrumb-separator">/</span>
          <span className="breadcrumb-current">{book.title}</span>
        </div>

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
                <div className="placeholder-text">Cover EPUB</div>
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
                <span>{state.isDownloading ? 'Mengunduh...' : 'Unduh EPUB'}</span>
              </button>
              <div className="action-row">
                <button className="btn btn-secondary btn-small" onClick={handleShare}>
                  🔗 Bagikan
                </button>
                {isAuthenticated && (
                  <button
                    className="btn btn-secondary btn-small"
                    onClick={() => setState(prev => ({ ...prev, showReactionModal: true }))}
                  >
                    {state.userReaction ? '✏️ Edit Reaksi' : '💭 Beri Reaksi'}
                  </button>
                )}
              </div>

              {/* Fixed horizontal layout for quick stats */}
              <div className="book-quick-stats" style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '0.75rem',
                '@media (minWidth: 768px)': {
                  gridTemplateColumns: 'repeat(4, 1fr)'
                }
              }}>
                {[
                  { label: 'Dilihat', value: book.viewCount || 0, icon: '👁️' },
                  { label: 'Diunduh', value: book.downloadCount || 0, icon: '📥' },
                  { label: 'Rating', value: reactionStats.averageRating ? `${reactionStats.averageRating.toFixed(1)}/5` : 'Belum ada', icon: '⭐' },
                  { label: 'Reaksi', value: reactionStats.total, icon: '💬' }
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
              {book.authors?.length > 0 && (
                <div className="book-authors">
                  oleh {book.authors.map((author, index) => (
                    <span key={author.id} className="author-name">
                      {author.name}
                      {index < book.authors.length - 1 && ', '}
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
                {book.copyrightStatus && (
                  <div className="meta-item">
                    <span>©️</span>
                    <span>{book.copyrightStatus}</span>
                  </div>
                )}
              </div>

              {book.genres && (
                <div className="book-genres">
                  {Array.isArray(book.genres) ? (
                    // Jika genres adalah array of objects
                    book.genres.map(genre => (
                      <span
                        key={genre.id || genre}
                        className="genre-tag"
                        style={{
                          backgroundColor: (genre.colorHex || (theme === 'light' ? '#225330' : '#de96be')) + '20',
                          color: genre.colorHex || (theme === 'light' ? '#225330' : '#de96be'),
                          borderColor: genre.colorHex || (theme === 'light' ? '#225330' : '#de96be')
                        }}
                      >
                        {genre.name || genre}
                      </span>
                    ))
                  ) : (
                    // Jika genres adalah string (dari backend)
                    book.genres.split(', ').map((genre, index) => (
                      <span
                        key={index}
                        className="genre-tag"
                        style={{
                          backgroundColor: (theme === 'light' ? '#225330' : '#de96be') + '20',
                          color: theme === 'light' ? '#225330' : '#de96be',
                          borderColor: theme === 'light' ? '#225330' : '#de96be'
                        }}
                      >
                        {genre.trim()}
                      </span>
                    ))
                  )}
                </div>
              )}

              {/* Reaction Stats Display */}
              <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                {Object.entries(reactionStats).filter(([key, value]) =>
                  key !== 'total' && key !== 'averageRating' && key !== 'ratings' && value > 0
                ).map(([key, value]) => (
                  <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <span>{reactionEmojis[key.toUpperCase()] || '👍'}</span>
                    <span style={{ fontSize: '0.875rem', fontWeight: '600' }}>{value}</span>
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
                          <span>{book.fileFormat?.toUpperCase() || 'EPUB'}</span>
                        </div>
                        <div className="info-item">
                          <span>Ukuran File:</span>
                          <span>{formatFileSize(book.fileSize)}</span>
                        </div>
                        {book.fileUrl && (
                          <div className="info-item">
                            <span>Status File:</span>
                            <span style={{ color: theme === 'light' ? '#225330' : '#de96be', fontWeight: '600' }}>✅ Tersedia</span>
                          </div>
                        )}
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
                        {book.authors?.map(author => (
                          <div key={author.id}>
                            <div className="metadata-item">
                              <span className="meta-label">Nama:</span>
                              <span className="meta-value">{author.name}</span>
                            </div>
                            {author.birthDate && (
                              <div className="metadata-item">
                                <span className="meta-label">Tanggal Lahir:</span>
                                <span className="meta-value">{new Date(author.birthDate).toLocaleDateString('id-ID')}</span>
                              </div>
                            )}
                            {author.birthPlace && (
                              <div className="metadata-item">
                                <span className="meta-label">Tempat Lahir:</span>
                                <span className="meta-value">{author.birthPlace}</span>
                              </div>
                            )}
                            {author.nationality && (
                              <div className="metadata-item">
                                <span className="meta-label">Kebangsaan:</span>
                                <span className="meta-value">{author.nationality}</span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {book.contributors && (
                      <div className="metadata-section">
                        <h4>🤝 Kontributor</h4>
                        <div className="metadata-items">
                          {Array.isArray(book.contributors) ? (
                            // Jika contributors adalah array of objects
                            book.contributors.map((contributor, index) => (
                              <div key={index} className="metadata-item">
                                <span className="meta-label">{contributor.role}:</span>
                                <span className="meta-value">{contributor.name}</span>
                              </div>
                            ))
                          ) : (
                            // Jika contributors adalah string (dari backend)
                            <div className="metadata-item">
                              <span className="meta-label">Kontributor:</span>
                              <span className="meta-value">{book.contributors}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

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
                        {book.copyrightStatus && (
                          <div className="metadata-item">
                            <span className="meta-label">Status Hak Cipta:</span>
                            <span className="meta-value">{book.copyrightStatus}</span>
                          </div>
                        )}
                        {book.isbn && (
                          <div className="metadata-item">
                            <span className="meta-label">ISBN:</span>
                            <span className="meta-value">{book.isbn}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {book.genres && (
                      <div className="metadata-section tags-section">
                        <h4>🏷️ Genre & Tag</h4>
                        <div className="tags-container">
                          {Array.isArray(book.genres) ? (
                            book.genres.map(genre => (
                              <span
                                key={genre.id || genre}
                                className="tag-item"
                                style={{
                                  backgroundColor: (genre.colorHex || (theme === 'light' ? '#225330' : '#de96be')) + '20',
                                  color: genre.colorHex || (theme === 'light' ? '#225330' : '#de96be'),
                                  borderColor: genre.colorHex || (theme === 'light' ? '#225330' : '#de96be')
                                }}
                              >
                                {genre.name || genre} {genre.isFiction ? '(Fiksi)' : '(Non-Fiksi)'}
                              </span>
                            ))
                          ) : (
                            book.genres.split(', ').map((genre, index) => (
                              <span
                                key={index}
                                className="tag-item"
                                style={{
                                  backgroundColor: (theme === 'light' ? '#225330' : '#de96be') + '20',
                                  color: theme === 'light' ? '#225330' : '#de96be',
                                  borderColor: theme === 'light' ? '#225330' : '#de96be'
                                }}
                              >
                                {genre.trim()}
                              </span>
                            ))
                          )}
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
                          onClick={() => setState(prev => ({ ...prev, showReactionModal: true }))}
                        >
                          💬 Tulis Komentar
                        </button>
                      )}
                    </div>

                    {discussions.length === 0 ? (
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
                        {Object.entries(reactionStats).filter(([key, value]) =>
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
                          <span>{book.fileFormat?.toUpperCase() || 'EPUB'}</span>
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

        {/* Share Modal */}
        {state.showShareModal && (
          <div className="modal-overlay" onClick={() => setState(prev => ({ ...prev, showShareModal: false }))}>
            <div className="modal-content card" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Bagikan Buku</h3>
                <button
                  className="btn btn-secondary btn-small"
                  onClick={() => setState(prev => ({ ...prev, showShareModal: false }))}
                >
                  ✕
                </button>
              </div>
              <div className="modal-body">
                <div style={{ marginBottom: '1rem' }}>
                  <input
                    type="text"
                    className="form-control"
                    value={window.location.href}
                    readOnly
                    onClick={(e) => e.target.select()}
                  />
                  <button
                    className="btn btn-primary btn-small w-full"
                    style={{ marginTop: '0.5rem' }}
                    onClick={() => {
                      navigator.clipboard.writeText(window.location.href)
                      showNotification('Link berhasil disalin!', 'success')
                      setState(prev => ({ ...prev, showShareModal: false }))
                    }}
                  >
                    📋 Salin Link
                  </button>
                </div>
                <div>
                  <h4 style={{ marginBottom: '0.75rem' }}>Bagikan ke:</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <a
                      href={`https://wa.me/?text=${encodeURIComponent(`${book.title} - ${window.location.href}`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-secondary btn-small"
                      style={{ textDecoration: 'none', textAlign: 'center' }}
                    >
                      💬 WhatsApp
                    </a>
                    <a
                      href={`https://t.me/share/url?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(book.title)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-secondary btn-small"
                      style={{ textDecoration: 'none', textAlign: 'center' }}
                    >
                      ✈️ Telegram
                    </a>
                    <a
                      href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(book.title)}&url=${encodeURIComponent(window.location.href)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-secondary btn-small"
                      style={{ textDecoration: 'none', textAlign: 'center' }}
                    >
                      🐦 Twitter
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Reaction Modal */}
        {state.showReactionModal && (
          <div className="modal-overlay" onClick={() => setState(prev => ({ ...prev, showReactionModal: false }))}>
            <div className="modal-content card" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h3>{state.userReaction ? 'Edit Reaksi' : 'Berikan Reaksi'}</h3>
                <button
                  className="btn btn-secondary btn-small"
                  onClick={() => setState(prev => ({ ...prev, showReactionModal: false }))}
                >
                  ✕
                </button>
              </div>
              <div className="modal-body">
                <div className="form-group">
                  <label>Jenis Reaksi:</label>
                  <select
                    className="form-control select-control"
                    value={state.newReaction.type}
                    onChange={(e) => setState(prev => ({
                      ...prev,
                      newReaction: { ...prev.newReaction, type: e.target.value }
                    }))}
                  >
                    <option value="LIKE">👍 Suka</option>
                    <option value="LOVE">❤️ Cinta</option>
                    <option value="DISLIKE">👎 Tidak Suka</option>
                    <option value="ANGRY">😠 Marah</option>
                    <option value="SAD">😢 Sedih</option>
                    <option value="COMMENT">💬 Komentar</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Rating (1-5):</label>
                  <div className="rating-input">
                    {[1, 2, 3, 4, 5].map(star => (
                      <span
                        key={star}
                        className={`star ${star <= state.newReaction.rating ? 'active' : ''}`}
                        onClick={() => setState(prev => ({
                          ...prev,
                          newReaction: { ...prev.newReaction, rating: star }
                        }))}
                      >
                        ⭐
                      </span>
                    ))}
                  </div>
                </div>

                <div className="form-group">
                  <label>Judul (opsional):</label>
                  <input
                    type="text"
                    className="form-control"
                    value={state.newReaction.title}
                    onChange={(e) => setState(prev => ({
                      ...prev,
                      newReaction: { ...prev.newReaction, title: e.target.value }
                    }))}
                    placeholder="Berikan judul untuk reaksi Anda..."
                  />
                </div>

                <div className="form-group">
                  <label>Komentar:</label>
                  <textarea
                    className="form-control textarea-control"
                    value={state.newReaction.comment}
                    onChange={(e) => setState(prev => ({
                      ...prev,
                      newReaction: { ...prev.newReaction, comment: e.target.value }
                    }))}
                    placeholder="Tulis komentar Anda tentang buku ini..."
                  />
                </div>

                <div className="modal-actions">
                  <button
                    className="btn btn-secondary"
                    onClick={() => setState(prev => ({ ...prev, showReactionModal: false }))}
                  >
                    Batal
                  </button>
                  <button
                    className="btn btn-primary"
                    onClick={handleAddReaction}
                  >
                    {state.userReaction ? 'Update Reaksi' : 'Kirim Reaksi'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Reply Modal */}
        {state.showReplyModal && (
          <div className="modal-overlay" onClick={() => setState(prev => ({ ...prev, showReplyModal: false }))}>
            <div className="modal-content card" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Balas Komentar</h3>
                <button
                  className="btn btn-secondary btn-small"
                  onClick={() => setState(prev => ({ ...prev, showReplyModal: false }))}
                >
                  ✕
                </button>
              </div>
              <div className="modal-body">
                <div style={{ padding: '1rem', background: theme === 'light' ? '#f9fafb' : '#1f2937', borderRadius: '8px', marginBottom: '1rem' }}>
                  <div style={{ fontWeight: '600', marginBottom: '0.5rem' }}>
                    Membalas komentar dari {state.replyToReaction?.userName}:
                  </div>
                  <div style={{ color: '#6b7280', fontStyle: 'italic' }}>
                    "{state.replyToReaction?.comment}"
                  </div>
                </div>

                <div className="form-group">
                  <label>Balasan Anda:</label>
                  <textarea
                    className="form-control textarea-control"
                    value={state.newReply.comment}
                    onChange={(e) => setState(prev => ({
                      ...prev,
                      newReply: { ...prev.newReply, comment: e.target.value }
                    }))}
                    placeholder="Tulis balasan Anda..."
                  />
                </div>

                <div className="modal-actions">
                  <button
                    className="btn btn-secondary"
                    onClick={() => setState(prev => ({
                      ...prev,
                      showReplyModal: false,
                      replyToReaction: null,
                      newReply: { comment: '' }
                    }))}
                  >
                    Batal
                  </button>
                  <button
                    className="btn btn-primary"
                    onClick={handleAddReply}
                    disabled={!state.newReply.comment.trim()}
                  >
                    Kirim Balasan
                  </button>
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