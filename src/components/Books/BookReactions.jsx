import React, { useState } from 'react'
import { useTheme } from '../../hooks/useTheme'

const BookReactions = ({ bookSlug, userReaction, onReaction, reactionStats }) => {
  const { theme } = useTheme()
  const [showRatingModal, setShowRatingModal] = useState(false)
  const [showCommentModal, setShowCommentModal] = useState(false)
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')

  const reactions = [
    { type: "like", emoji: "👍", label: "Suka" },
    { type: "dislike", emoji: "👎", label: "Tidak Suka" },
    { type: "love", emoji: "❤️", label: "Cinta" },
    { type: "sad", emoji: "😢", label: "Sedih" },
    { type: "angry", emoji: "😠", label: "Marah" }
  ]

  const handleQuickReaction = (type) => {
    onReaction(type)
  }

  const handleRating = async () => {
    await onReaction('rating', rating, '')
    setShowRatingModal(false)
    setRating(5)
  }

  const handleComment = async () => {
    if (!comment.trim()) {
      alert('Silakan tulis komentar terlebih dahulu')
      return
    }
    await onReaction('comment', null, comment)
    setShowCommentModal(false)
    setComment('')
  }

  const getReactionCount = (type) => {
    return reactionStats?.[type] || 0
  }

  const getUserReactionDisplay = () => {
    if (!userReaction) return null

    if (userReaction.type === 'rating') {
      return `⭐ ${userReaction.rating}/5`
    }

    const reaction = reactions.find(r => r.type === userReaction.type)
    return reaction ? `${reaction.emoji} ${reaction.label}` : userReaction.type
  }

  return (
    <div className="book-reactions">
      {/* Current User's Reaction Display */}
      {userReaction && (
        <div className="current-reaction">
          <span style={{ fontSize: '0.9rem', opacity: 0.8 }}>
            Reaksi Anda: {getUserReactionDisplay()}
          </span>
        </div>
      )}

      {/* Quick Reactions */}
      <div className="quick-reactions">
        <span style={{ fontSize: '0.9rem', marginRight: '1rem', opacity: 0.8 }}>
          Berikan reaksi:
        </span>
        {reactions.map(reaction => (
          <button
            key={reaction.type}
            className={`btn btn-secondary btn-small reaction-btn ${
              userReaction?.type === reaction.type ? 'active' : ''
            }`}
            onClick={() => handleQuickReaction(reaction.type)}
            title={`${reaction.label} (${getReactionCount(reaction.type)})`}
          >
            {reaction.emoji}
            {getReactionCount(reaction.type) > 0 && (
              <span className="reaction-count">{getReactionCount(reaction.type)}</span>
            )}
          </button>
        ))}
      </div>

      {/* Action Buttons */}
      <div className="reaction-actions">
        <button
          className={`btn btn-primary btn-small ${userReaction?.type === 'rating' ? 'active' : ''}`}
          onClick={() => setShowRatingModal(true)}
        >
          ⭐ Beri Rating
          {userReaction?.rating && ` (${userReaction.rating}/5)`}
        </button>

        <button
          className={`btn btn-secondary btn-small ${userReaction?.comment ? 'active' : ''}`}
          onClick={() => setShowCommentModal(true)}
        >
          💬 Tulis Komentar
          {userReaction?.comment && ' ✓'}
        </button>
      </div>

      {/* Reaction Statistics Display */}
      {reactionStats && (
        <div className="reaction-stats">
          <div className="stats-summary">
            <span>Total reaksi: {reactionStats.total || 0}</span>
            {reactionStats.averageRating && (
              <span> • Rating rata-rata: {reactionStats.averageRating.toFixed(1)}/5</span>
            )}
          </div>
        </div>
      )}

      {/* Rating Modal */}
      {showRatingModal && (
        <div className="modal-overlay" onClick={() => setShowRatingModal(false)}>
          <div className="modal-content card" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Beri Rating</h3>
              <button
                className="btn btn-secondary btn-small"
                onClick={() => setShowRatingModal(false)}
              >
                Tutup
              </button>
            </div>

            <div className="modal-body">
              <div className="form-group">
                <label>Rating (1-5 bintang):</label>
                <div className="star-rating">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      key={star}
                      className={`star-btn ${star <= rating ? 'active' : ''}`}
                      onClick={() => setRating(star)}
                    >
                      ⭐
                    </button>
                  ))}
                </div>
                <small>Rating saat ini: {rating} bintang</small>
              </div>

              <button
                className="btn btn-primary"
                onClick={handleRating}
                style={{ width: '100%' }}
              >
                Kirim Rating
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Comment Modal */}
      {showCommentModal && (
        <div className="modal-overlay" onClick={() => setShowCommentModal(false)}>
          <div className="modal-content card" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Tulis Komentar</h3>
              <button
                className="btn btn-secondary btn-small"
                onClick={() => setShowCommentModal(false)}
              >
                Tutup
              </button>
            </div>

            <div className="modal-body">
              <div className="form-group">
                <label>Komentar Anda:</label>
                <textarea
                  className="form-control"
                  rows="4"
                  placeholder="Tulis komentar Anda tentang buku ini..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                />
              </div>

              <button
                className="btn btn-primary"
                onClick={handleComment}
                style={{ width: '100%' }}
                disabled={!comment.trim()}
              >
                Kirim Komentar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default BookReactions