// Enhanced BookmarkPanel.jsx
import React, { useState } from 'react'

const BookmarkPanel = ({ bookmarks, onBookmarkClick, onBookmarkDelete, onClose }) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState('date') // date, title, page

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const filteredAndSortedBookmarks = bookmarks
    .filter(bookmark =>
      bookmark.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bookmark.notes?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      switch (sortBy) {
        case 'title':
          return a.title.localeCompare(b.title)
        case 'page':
          return a.page - b.page
        case 'date':
        default:
          return new Date(b.createdAt) - new Date(a.createdAt)
      }
    })

  return (
    <div className="reader-panel card">
      <div className="panel-header">
        <h3>Bookmark ({bookmarks.length})</h3>
        <button className="btn btn-secondary btn-small" onClick={onClose}>
          ✕
        </button>
      </div>

      {bookmarks.length > 0 && (
        <div className="panel-filters">
          <input
            type="text"
            placeholder="Cari bookmark..."
            className="form-control"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <select
            className="form-control"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="date">Urutkan: Terbaru</option>
            <option value="title">Urutkan: Judul</option>
            <option value="page">Urutkan: Halaman</option>
          </select>
        </div>
      )}

      <div className="panel-content">
        {filteredAndSortedBookmarks.length === 0 ? (
          <div className="empty-state">
            {bookmarks.length === 0 ? (
              <>
                <div className="empty-icon">🔖</div>
                <p>Belum ada bookmark.</p>
                <p>Pilih teks dan klik ikon bookmark untuk menambahkan.</p>
              </>
            ) : (
              <>
                <div className="empty-icon">🔍</div>
                <p>Tidak ada bookmark yang cocok dengan pencarian "{searchTerm}"</p>
              </>
            )}
          </div>
        ) : (
          <div className="bookmark-list">
            {filteredAndSortedBookmarks.map((bookmark) => (
              <div key={bookmark.id} className="bookmark-item">
                <div
                  className="bookmark-content"
                  onClick={() => onBookmarkClick(bookmark)}
                >
                  <div className="bookmark-header">
                    <h4 className="bookmark-title">{bookmark.title}</h4>
                    <span className="bookmark-page">Hal. {bookmark.page}</span>
                  </div>

                  {bookmark.notes && (
                    <p className="bookmark-note">{bookmark.notes}</p>
                  )}

                  <div className="bookmark-meta">
                    <small>{formatDate(bookmark.createdAt)}</small>
                    {bookmark.chapterTitle && (
                      <small className="chapter-title">{bookmark.chapterTitle}</small>
                    )}
                  </div>
                </div>

                <div className="bookmark-actions">
                  <button
                    className="btn btn-secondary btn-small"
                    onClick={(e) => {
                      e.stopPropagation()
                      onBookmarkDelete(bookmark.id)
                    }}
                    title="Hapus bookmark"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {bookmarks.length > 0 && (
        <div className="panel-footer">
          <small>
            Menampilkan {filteredAndSortedBookmarks.length} dari {bookmarks.length} bookmark
          </small>
        </div>
      )}
    </div>
  )
}

export default BookmarkPanel