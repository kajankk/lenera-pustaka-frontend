import React, { useState, useEffect } from 'react'

const BookmarkPanel = ({ bookmarks, onBookmarkClick, onBookmarkDelete, onClose, isMobile = false }) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState('date') // date, title, page

  // Close panel on escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [onClose])

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

  const handleBookmarkClick = (bookmark) => {
    onBookmarkClick(bookmark)
    if (isMobile) {
      onClose() // Auto-close on mobile after navigation
    }
  }

  return (
    <div className={`reader-panel bookmark-panel ${isMobile ? 'mobile' : 'desktop'}`}>
      {/* Mobile header with drag indicator */}
      {isMobile && (
        <div className="panel-drag-indicator">
          <div className="drag-handle"></div>
        </div>
      )}

      <header className="panel-header">
        <h3>
          <span className="panel-icon">🔖</span>
          Bookmark ({bookmarks.length})
        </h3>
        <button
          className="btn btn-secondary btn-small panel-close-btn"
          onClick={onClose}
          aria-label="Tutup panel bookmark"
        >
          ✕
        </button>
      </header>

      {/* Search and Filters */}
      {bookmarks.length > 0 && (
        <div className="panel-filters">
          <div className="search-input-container">
            <input
              type="text"
              placeholder="Cari bookmark..."
              className="form-control search-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              aria-label="Cari bookmark"
            />
            {searchTerm && (
              <button
                className="search-clear-btn"
                onClick={() => setSearchTerm('')}
                aria-label="Hapus pencarian"
              >
                ✕
              </button>
            )}
          </div>

          <select
            className="form-control sort-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            aria-label="Urutkan bookmark"
          >
            <option value="date">📅 Terbaru</option>
            <option value="title">📝 Judul</option>
            <option value="page">📄 Halaman</option>
          </select>
        </div>
      )}

      {/* Content */}
      <div className="panel-content">
        {filteredAndSortedBookmarks.length === 0 ? (
          <div className="empty-state">
            {bookmarks.length === 0 ? (
              <>
                <div className="empty-icon">🔖</div>
                <h4>Belum ada bookmark</h4>
                <p>Pilih teks dan klik ikon bookmark untuk menambahkan.</p>
                {isMobile && (
                  <p><small>💡 Tekan dan tahan teks, lalu pilih "Bookmark"</small></p>
                )}
              </>
            ) : (
              <>
                <div className="empty-icon">🔍</div>
                <h4>Tidak ada hasil</h4>
                <p>Tidak ada bookmark yang cocok dengan pencarian "{searchTerm}"</p>
                <button
                  className="btn btn-secondary btn-small"
                  onClick={() => setSearchTerm('')}
                >
                  Hapus Filter
                </button>
              </>
            )}
          </div>
        ) : (
          <div className="bookmark-list">
            {filteredAndSortedBookmarks.map((bookmark) => (
              <article key={bookmark.id} className="bookmark-item">
                <div
                  className="bookmark-content"
                  onClick={() => handleBookmarkClick(bookmark)}
                  role="button"
                  tabIndex={0}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      handleBookmarkClick(bookmark)
                    }
                  }}
                  aria-label={`Navigasi ke bookmark: ${bookmark.title}`}
                >
                  <div className="bookmark-header">
                    <h4 className="bookmark-title">{bookmark.title}</h4>
                    <span className="bookmark-page">Hal. {bookmark.page}</span>
                  </div>

                  {bookmark.notes && (
                    <p className="bookmark-note">{bookmark.notes}</p>
                  )}

                  <div className="bookmark-meta">
                    <time className="bookmark-date">
                      {formatDate(bookmark.createdAt)}
                    </time>
                    {bookmark.chapterTitle && (
                      <span className="chapter-title">{bookmark.chapterTitle}</span>
                    )}
                  </div>
                </div>

                <div className="bookmark-actions">
                  <button
                    className="btn btn-secondary btn-small action-btn delete-btn"
                    onClick={(e) => {
                      e.stopPropagation()
                      if (confirm('Hapus bookmark ini?')) {
                        onBookmarkDelete(bookmark.id)
                      }
                    }}
                    title="Hapus bookmark"
                    aria-label={`Hapus bookmark: ${bookmark.title}`}
                  >
                    🗑️
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      {bookmarks.length > 0 && (
        <footer className="panel-footer">
          <small>
            Menampilkan {filteredAndSortedBookmarks.length} dari {bookmarks.length} bookmark
            {searchTerm && ` • Filter: "${searchTerm}"`}
          </small>
        </footer>
      )}
    </div>
  )
}

export default BookmarkPanel