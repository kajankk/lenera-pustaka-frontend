// components/Reader/BookmarkPanel.jsx
import React from 'react'

const BookmarkPanel = ({ bookmarks, onBookmarkClick, onBookmarkDelete, onClose }) => {
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="reader-panel card">
      <div className="panel-header">
        <h3>Bookmark ({bookmarks.length})</h3>
        <button className="btn btn-secondary btn-small" onClick={onClose}>
          Tutup
        </button>
      </div>

      <div className="panel-content">
        {bookmarks.length === 0 ? (
          <div className="empty-state">
            <p>Belum ada bookmark.</p>
            <p>Pilih teks dan klik ikon bookmark untuk menambahkan.</p>
          </div>
        ) : (
          <div className="bookmark-list">
            {bookmarks.map((bookmark) => (
              <div key={bookmark.id} className="bookmark-item">
                <div
                  className="bookmark-content"
                  onClick={() => onBookmarkClick(bookmark)}
                  style={{ cursor: 'pointer' }}
                >
                  <h4>{bookmark.title}</h4>
                  {bookmark.note && <p className="bookmark-note">{bookmark.note}</p>}
                  <small className="bookmark-meta">
                    Halaman {bookmark.page} • {formatDate(bookmark.createdAt)}
                  </small>
                </div>
                <button
                  className="btn btn-secondary btn-small"
                  onClick={(e) => {
                    e.stopPropagation()
                    onBookmarkDelete(bookmark.id)
                  }}
                  title="Hapus bookmark"
                >
                  Hapus
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default BookmarkPanel