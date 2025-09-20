import React from 'react'
import { useAuth } from '../../context/AuthContext'

const BookDiscussions = ({ bookSlug, discussions, loading, onDiscussionUpdate }) => {
  const { isAuthenticated } = useAuth()

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getReactionTypeLabel = (type) => {
    const types = {
      like: '👍 Suka',
      dislike: '👎 Tidak Suka',
      love: '❤️ Cinta',
      laugh: '😂 Lucu',
      wow: '😮 Wow',
      sad: '😢 Sedih',
      angry: '😠 Marah',
      review: '⭐ Ulasan',
      rating: '⭐ Rating',
      comment: '💬 Komentar'
    }
    return types[type] || type
  }

  const getRatingStars = (rating) => {
    if (!rating) return ''
    return '⭐'.repeat(Math.min(rating, 5))
  }

  const getReactionIcon = (type) => {
    const icons = {
      like: '👍',
      dislike: '👎',
      love: '❤️',
      sad: '😢',
      angry: '😠',
      rating: '⭐',
      comment: '💬'
    }
    return icons[type] || '💭'
  }

  // Group discussions by type for better organization
  const groupedDiscussions = discussions.reduce((acc, discussion) => {
    const type = discussion.type || 'comment'
    if (!acc[type]) acc[type] = []
    acc[type].push(discussion)
    return acc
  }, {})

  if (loading) {
    return (
      <div className="book-discussions">
        <div className="loading-discussions">
          <p>Memuat diskusi...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="book-discussions">
      <div className="discussions-header">
        <h3>Diskusi & Komentar</h3>
        <p className="discussions-subtitle">
          Komentar dan reaksi pembaca terhadap buku ini ({discussions.length} total)
        </p>
        {!isAuthenticated && (
          <p className="auth-notice">
            <span>Login untuk memberikan reaksi dan komentar</span>
          </p>
        )}
      </div>

      {(!discussions || discussions.length === 0) ? (
        <div className="empty-state">
          <div className="empty-icon">💬</div>
          <p>Belum ada komentar untuk buku ini.</p>
          <p>Jadilah yang pertama memberikan reaksi dan komentar!</p>
        </div>
      ) : (
        <div className="discussions-content">
          {/* Show ratings with comments first */}
          {groupedDiscussions.rating && (
            <div className="discussion-group">
              <h4 className="group-title">
                <span className="group-icon">⭐</span>
                Rating & Ulasan ({groupedDiscussions.rating.length})
              </h4>
              <div className="discussions-list">
                {groupedDiscussions.rating.map((reaction) => (
                  <div key={reaction.id} className="discussion-item card rating-discussion">
                    <div className="discussion-header">
                      <div className="user-info">
                        <div className="user-avatar">
                          {reaction.user?.avatar ? (
                            <img
                              src={reaction.user.avatar}
                              alt={reaction.user.name}
                              className="avatar-image"
                            />
                          ) : (
                            <div className="avatar-placeholder">
                              {reaction.user?.name?.charAt(0)?.toUpperCase() || '?'}
                            </div>
                          )}
                        </div>
                        <div className="user-details">
                          <span className="user-name">
                            {reaction.user?.name || 'Pengguna Anonim'}
                          </span>
                          <div className="reaction-meta">
                            {reaction.rating && (
                              <span className="reaction-rating">
                                {getRatingStars(reaction.rating)} ({reaction.rating}/5)
                              </span>
                            )}
                            <span className="reaction-date">
                              {formatDate(reaction.createdAt)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {reaction.comment && (
                      <div className="discussion-content">
                        <p>{reaction.comment}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Show regular comments */}
          {groupedDiscussions.comment && (
            <div className="discussion-group">
              <h4 className="group-title">
                <span className="group-icon">💬</span>
                Komentar ({groupedDiscussions.comment.length})
              </h4>
              <div className="discussions-list">
                {groupedDiscussions.comment.map((reaction) => (
                  <div key={reaction.id} className="discussion-item card comment-discussion">
                    <div className="discussion-header">
                      <div className="user-info">
                        <div className="user-avatar">
                          {reaction.user?.avatar ? (
                            <img
                              src={reaction.user.avatar}
                              alt={reaction.user.name}
                              className="avatar-image"
                            />
                          ) : (
                            <div className="avatar-placeholder">
                              {reaction.user?.name?.charAt(0)?.toUpperCase() || '?'}
                            </div>
                          )}
                        </div>
                        <div className="user-details">
                          <span className="user-name">
                            {reaction.user?.name || 'Pengguna Anonim'}
                          </span>
                          <div className="reaction-meta">
                            <span className="reaction-date">
                              {formatDate(reaction.createdAt)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="discussion-content">
                      <p>{reaction.comment}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Show other reactions with comments */}
          {Object.entries(groupedDiscussions).filter(([type]) =>
            !['rating', 'comment'].includes(type)
          ).map(([type, reactions]) => (
            <div key={type} className="discussion-group">
              <h4 className="group-title">
                <span className="group-icon">{getReactionIcon(type)}</span>
                {getReactionTypeLabel(type)} ({reactions.length})
              </h4>
              <div className="discussions-list">
                {reactions.map((reaction) => (
                  <div key={reaction.id} className="discussion-item card reaction-discussion">
                    <div className="discussion-header">
                      <div className="user-info">
                        <div className="user-avatar">
                          {reaction.user?.avatar ? (
                            <img
                              src={reaction.user.avatar}
                              alt={reaction.user.name}
                              className="avatar-image"
                            />
                          ) : (
                            <div className="avatar-placeholder">
                              {reaction.user?.name?.charAt(0)?.toUpperCase() || '?'}
                            </div>
                          )}
                        </div>
                        <div className="user-details">
                          <span className="user-name">
                            {reaction.user?.name || 'Pengguna Anonim'}
                          </span>
                          <div className="reaction-meta">
                            <span className="reaction-type">
                              {getReactionTypeLabel(reaction.type)}
                            </span>
                            <span className="reaction-date">
                              {formatDate(reaction.createdAt)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="discussion-content">
                      <p>{reaction.comment}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {discussions && discussions.length > 0 && (
        <div className="discussions-footer">
          <p>
            Total {discussions.length} diskusi dari pembaca
          </p>
          {isAuthenticated && (
            <p className="tip">
              💡 Berikan reaksi dan komentar Anda di bagian reaksi di atas
            </p>
          )}
        </div>
      )}
    </div>
  )
}

export default BookDiscussions