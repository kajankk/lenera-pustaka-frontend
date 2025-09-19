// components/Books/BookReactions.jsx
import React, { useState } from 'react'
import { useTheme } from '../../hooks/useTheme'

const BookReactions = ({ bookSlug, userReaction, onReaction }) => {
  const { theme } = useTheme()
  const [showRatingModal, setShowRatingModal] = useState(false)
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')

  const reactions = [
    { type: 'like', emoji: '👍', label: 'Suka' },
    { type: 'love', emoji: '❤️', label: 'Cinta' },
    { type: 'wow', emoji: '😮', label: 'Wow' },
    { type: 'sad', emoji: '😢', label: 'Sedih' },
    { type: 'angry', emoji: '😠', label: 'Marah' }
  ]

  const handleQuickReaction = (type) => {
    onReaction(type)
  }

  const handleRating = async () => {
    await onReaction('rating', rating, comment)
    setShowRatingModal(false)
    setComment('')
    setRating(5)
  }

  return (
    <div className="book-reactions">
      <div className="quick-reactions">
        <span style={{ fontSize: '0.9rem', marginRight: '1rem', opacity: 0.8 }}>
          Reaksi Anda:
        </span>
        {reactions.map(reaction => (
          <button
            key={reaction.type}
            className={`btn btn-secondary btn-small reaction-btn ${
              userReaction?.type === reaction.type ? 'active' : ''
            }`}
            onClick={() => handleQuickReaction(reaction.type)}
            title={reaction.label}
          >
            {reaction.emoji}
          </button>
        ))}
        <button
          className="btn btn-primary btn-small"
          onClick={() => setShowRatingModal(true)}
        >
          ⭐ Beri Rating
        </button>
      </div>

      {/* Rating Modal */}
      {showRatingModal && (
        <div className="modal-overlay" onClick={() => setShowRatingModal(false)}>
          <div className="modal-content card" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Beri Rating & Ulasan</h3>
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

              <div className="form-group">
                <label>Komentar (opsional):</label>
                <textarea
                  className="form-control"
                  rows="3"
                  placeholder="Tulis ulasan Anda..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                />
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
    </div>
  )
}

export default BookReactions