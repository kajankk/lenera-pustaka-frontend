// components/Books/BookDiscussions.jsx
import React from 'react'
import { useDiscussions } from '../../hooks/useDiscussions'
import { useAuth } from '../../context/AuthContext'

const BookDiscussions = ({ bookSlug }) => {
  const { isAuthenticated } = useAuth()
  const { discussions, loading, error, hasMore, loadMore } = useDiscussions(bookSlug)

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getDiscussionTypeLabel = (type) => {
    const types = {
      general: 'Umum',
      question: 'Pertanyaan',
      review: 'Ulasan',
      theory: 'Teori',
      analysis: 'Analisis'
    }
    return types[type] || 'Umum'
  }

  if (error) {
    return <div className="error">{error}</div>
  }

  return (
    <div className="book-discussions">
      <div className="discussions-header">
        <h3>Diskusi Komunitas</h3>
        {!isAuthenticated && (
          <p className="auth-notice">
            <span>Login untuk bergabung dalam diskusi</span>
          </p>
        )}
      </div>

      {discussions.length === 0 && !loading ? (
        <div className="empty-state">
          <p>Belum ada diskusi untuk buku ini.</p>
          <p>Mulai membaca dan bergabunglah dalam diskusi di halaman reader!</p>
        </div>
      ) : (
        <div className="discussions-preview">
          {discussions.slice(0, 3).map((discussion) => (
            <div key={discussion.id} className="discussion-preview-item card">
              <div className="discussion-header">
                <div className="discussion-type-badge">
                  {getDiscussionTypeLabel(discussion.type)}
                </div>
                <small className="discussion-date">
                  {formatDate(discussion.createdAt)}
                </small>
              </div>

              <h4 className="discussion-title">{discussion.title}</h4>

              <div className="discussion-content">
                {discussion.content.length > 150
                  ? `${discussion.content.substring(0, 150)}...`
                  : discussion.content
                }
              </div>

              <div className="discussion-meta">
                <span className="discussion-author">
                  oleh {discussion.author?.fullName || 'Anonim'}
                </span>
                {discussion.replyCount > 0 && (
                  <span className="discussion-replies">
                    {discussion.replyCount} balasan
                  </span>
                )}
              </div>
            </div>
          ))}

          {discussions.length > 3 && (
            <div className="discussions-more">
              <p>Lihat semua diskusi dan bergabung saat membaca buku!</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default BookDiscussions