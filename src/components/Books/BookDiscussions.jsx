import React from 'react'
import { useAuth } from '../../context/AuthContext'

const BookDiscussions = ({ bookSlug, discussions, loading, onDiscussionUpdate }) => {
  const { isAuthenticated } = useAuth()

  const formatDate = (dateString) => new Date(dateString).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })

  const getReactionData = (type) => {
    const data = {
      like: { icon: '👍', label: 'Suka' },
      dislike: { icon: '👎', label: 'Tidak Suka' },
      love: { icon: '❤️', label: 'Cinta' },
      sad: { icon: '😢', label: 'Sedih' },
      angry: { icon: '😠', label: 'Marah' },
      rating: { icon: '⭐', label: 'Rating' },
      comment: { icon: '💬', label: 'Komentar' }
    }
    return data[type] || { icon: '💭', label: type }
  }

  const UserAvatar = ({ user }) => (
    <div className="user-avatar">
      {user?.avatar ? <img src={user.avatar} alt={user.name} className="avatar-image" /> : <div className="avatar-placeholder">{user?.name?.charAt(0)?.toUpperCase() || '?'}</div>}
    </div>
  )

  const DiscussionItem = ({ reaction, showRating = false }) => (
    <div className="discussion-item card">
      <div className="discussion-header">
        <div className="user-info">
          <UserAvatar user={reaction.user} />
          <div className="user-details">
            <span className="user-name">{reaction.user?.name || 'Pengguna Anonim'}</span>
            <div className="reaction-meta">
              {showRating && reaction.rating && <span className="reaction-rating">{'⭐'.repeat(Math.min(reaction.rating, 5))} ({reaction.rating}/5)</span>}
              <span className="reaction-date">{formatDate(reaction.createdAt)}</span>
            </div>
          </div>
        </div>
      </div>
      {reaction.comment && <div className="discussion-content"><p>{reaction.comment}</p></div>}
    </div>
  )

  if (loading) return <div className="book-discussions"><div className="loading-discussions"><p>Memuat diskusi...</p></div></div>

  const groupedDiscussions = discussions.reduce((acc, discussion) => {
    const type = discussion.type || 'comment'
    if (!acc[type]) acc[type] = []
    acc[type].push(discussion)
    return acc
  }, {})

  return (
    <div className="book-discussions">
      <div className="discussions-header">
        <h3>Diskusi & Komentar</h3>
        <p className="discussions-subtitle">Komentar dan reaksi pembaca terhadap buku ini ({discussions.length} total)</p>
        {!isAuthenticated && <p className="auth-notice"><span>Login untuk memberikan reaksi dan komentar</span></p>}
      </div>

      {(!discussions || discussions.length === 0) ? (
        <div className="empty-state">
          <div className="empty-icon">💬</div>
          <p>Belum ada komentar untuk buku ini.</p>
          <p>Jadilah yang pertama memberikan reaksi dan komentar!</p>
        </div>
      ) : (
        <div className="discussions-content">
          {Object.entries(groupedDiscussions).map(([type, reactions]) => {
            const { icon, label } = getReactionData(type)
            return (
              <div key={type} className="discussion-group">
                <h4 className="group-title"><span className="group-icon">{icon}</span>{label} ({reactions.length})</h4>
                <div className="discussions-list">
                  {reactions.map(reaction => <DiscussionItem key={reaction.id} reaction={reaction} showRating={type === 'rating'} />)}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {discussions && discussions.length > 0 && (
        <div className="discussions-footer">
          <p>Total {discussions.length} diskusi dari pembaca</p>
          {isAuthenticated && <p className="tip">💡 Berikan reaksi dan komentar Anda di bagian reaksi di atas</p>}
        </div>
      )}
    </div>
  )
}

export default BookDiscussions