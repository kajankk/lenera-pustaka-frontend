// components/Reader/DiscussionPanel.jsx
import React, { useState } from 'react'
import { useDiscussions } from '../../hooks/useDiscussions'

const DiscussionPanel = ({ bookSlug, onClose }) => {
  const { discussions, loading, error, hasMore, addDiscussion, loadMore } = useDiscussions(bookSlug)
  const [newDiscussion, setNewDiscussion] = useState({
    title: '',
    content: '',
    type: 'general'
  })
  const [isAdding, setIsAdding] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!newDiscussion.title.trim() || !newDiscussion.content.trim()) return

    setIsAdding(true)
    try {
      await addDiscussion(newDiscussion)
      setNewDiscussion({ title: '', content: '', type: 'general' })
      setShowAddForm(false)
    } catch (error) {
      console.error('Error adding discussion:', error)
    } finally {
      setIsAdding(false)
    }
  }

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

  return (
    <div className="reader-panel card discussion-panel">
      <div className="panel-header">
        <h3>Diskusi Buku ({discussions.length})</h3>
        <div className="header-actions">
          <button
            className="btn btn-primary btn-small"
            onClick={() => setShowAddForm(!showAddForm)}
          >
            {showAddForm ? 'Batal' : 'Buat Diskusi'}
          </button>
          <button className="btn btn-secondary btn-small" onClick={onClose}>
            Tutup
          </button>
        </div>
      </div>

      {/* Add Discussion Form */}
      {showAddForm && (
        <div className="panel-add-form">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <select
                className="form-control"
                value={newDiscussion.type}
                onChange={(e) => setNewDiscussion(prev => ({ ...prev, type: e.target.value }))}
              >
                <option value="general">Diskusi Umum</option>
                <option value="question">Pertanyaan</option>
                <option value="review">Ulasan</option>
                <option value="theory">Teori</option>
                <option value="analysis">Analisis</option>
              </select>
            </div>

            <div className="form-group">
              <input
                type="text"
                className="form-control"
                placeholder="Judul diskusi..."
                value={newDiscussion.title}
                onChange={(e) => setNewDiscussion(prev => ({ ...prev, title: e.target.value }))}
                disabled={isAdding}
              />
            </div>

            <div className="form-group">
              <textarea
                className="form-control"
                placeholder="Tulis topik diskusi Anda..."
                value={newDiscussion.content}
                onChange={(e) => setNewDiscussion(prev => ({ ...prev, content: e.target.value }))}
                rows="4"
                disabled={isAdding}
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={!newDiscussion.title.trim() || !newDiscussion.content.trim() || isAdding}
            >
              {isAdding ? 'Membuat Diskusi...' : 'Buat Diskusi'}
            </button>
          </form>
        </div>
      )}

      <div className="panel-content">
        {error && (
          <div className="error">
            {error}
          </div>
        )}

        {discussions.length === 0 && !loading ? (
          <div className="empty-state">
            <p>Belum ada diskusi untuk buku ini.</p>
            <p>Mulai diskusi pertama dan bagikan pemikiran Anda!</p>
          </div>
        ) : (
          <div className="discussions-list">
            {discussions.map((discussion) => (
              <div key={discussion.id} className="discussion-item">
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
                  {discussion.content.length > 200
                    ? `${discussion.content.substring(0, 200)}...`
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
                  {discussion.likeCount > 0 && (
                    <span className="discussion-likes">
                      {discussion.likeCount} suka
                    </span>
                  )}
                </div>
              </div>
            ))}

            {/* Load More Button */}
            {hasMore && (
              <button
                className="btn btn-secondary load-more-btn"
                onClick={loadMore}
                disabled={loading}
                style={{ width: '100%', marginTop: '1rem' }}
              >
                {loading ? 'Memuat...' : 'Muat Diskusi Lainnya'}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default DiscussionPanel