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

  const Modal = ({ show, onClose, title, children }) => show && (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content card" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{title}</h3>
          <button className="btn btn-secondary btn-small" onClick={onClose}>Tutup</button>
        </div>
        {children}
      </div>
    </div>
  )

  return (
    <div className="book-reactions">
      {userReaction && (
        <div className="current-reaction">
          <span style={{ fontSize: '0.9rem', opacity: 0.8 }}>
            Reaksi Anda: {userReaction.type === 'rating' ? `⭐ ${userReaction.rating}/5` : reactions.find(r => r.type === userReaction.type)?.emoji + ' ' + reactions.find(r => r.type === userReaction.type)?.label}
          </span>
        </div>
      )}

      <div className="quick-reactions">
        <span style={{ fontSize: '0.9rem', marginRight: '1rem', opacity: 0.8 }}>Berikan reaksi:</span>
        {reactions.map(reaction => (
          <button key={reaction.type} className={`btn btn-secondary btn-small reaction-btn ${userReaction?.type === reaction.type ? 'active' : ''}`} onClick={() => onReaction(reaction.type)} title={`${reaction.label} (${reactionStats?.[reaction.type] || 0})`}>
            {reaction.emoji}{reactionStats?.[reaction.type] > 0 && <span className="reaction-count">{reactionStats[reaction.type]}</span>}
          </button>
        ))}
      </div>

      <div className="reaction-actions">
        <button className={`btn btn-primary btn-small ${userReaction?.type === 'rating' ? 'active' : ''}`} onClick={() => setShowRatingModal(true)}>⭐ Beri Rating{userReaction?.rating && ` (${userReaction.rating}/5)`}</button>
        <button className={`btn btn-secondary btn-small ${userReaction?.comment ? 'active' : ''}`} onClick={() => setShowCommentModal(true)}>💬 Tulis Komentar{userReaction?.comment && ' ✓'}</button>
      </div>

      {reactionStats && (
        <div className="reaction-stats">
          <div className="stats-summary">
            <span>Total reaksi: {reactionStats.total || 0}</span>
            {reactionStats.averageRating && <span> • Rating rata-rata: {reactionStats.averageRating.toFixed(1)}/5</span>}
          </div>
        </div>
      )}

      <Modal show={showRatingModal} onClose={() => setShowRatingModal(false)} title="Beri Rating">
        <div className="modal-body">
          <div className="form-group">
            <label>Rating (1-5 bintang):</label>
            <div className="star-rating">{[1,2,3,4,5].map(star => <button key={star} className={`star-btn ${star <= rating ? 'active' : ''}`} onClick={() => setRating(star)}>⭐</button>)}</div>
            <small>Rating saat ini: {rating} bintang</small>
          </div>
          <button className="btn btn-primary" onClick={async () => { await onReaction('rating', rating, ''); setShowRatingModal(false); setRating(5) }} style={{ width: '100%' }}>Kirim Rating</button>
        </div>
      </Modal>

      <Modal show={showCommentModal} onClose={() => setShowCommentModal(false)} title="Tulis Komentar">
        <div className="modal-body">
          <div className="form-group">
            <label>Komentar Anda:</label>
            <textarea className="form-control" rows="4" placeholder="Tulis komentar Anda tentang buku ini..." value={comment} onChange={(e) => setComment(e.target.value)} />
          </div>
          <button className="btn btn-primary" onClick={async () => { if(!comment.trim()) { alert('Silakan tulis komentar terlebih dahulu'); return } await onReaction('comment', null, comment); setShowCommentModal(false); setComment('') }} style={{ width: '100%' }} disabled={!comment.trim()}>Kirim Komentar</button>
        </div>
      </Modal>
    </div>
  )
}

export default BookReactions