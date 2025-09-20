import React, { useState, useEffect } from 'react'

const HighlightPanel = ({ highlights, onHighlightClick, onHighlightDelete, onClose, isMobile = false }) => {
  const [filterColor, setFilterColor] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState('date')

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

  const colorMap = {
    '#ffff00': { name: 'Kuning', emoji: '🟡' },
    '#90EE90': { name: 'Hijau', emoji: '🟢' },
    '#FFB6C1': { name: 'Pink', emoji: '🩷' },
    '#87CEEB': { name: 'Biru', emoji: '🔵' },
    '#DDA0DD': { name: 'Ungu', emoji: '🟣' },
    '#FFA500': { name: 'Orange', emoji: '🟠' },
    '#FFB6BA': { name: 'Merah', emoji: '🔴' }
  }

  const filteredHighlights = highlights
    .filter(h => filterColor === 'all' || h.color === filterColor)
    .filter(h =>
      h.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
      h.notes?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      switch (sortBy) {
        case 'text':
          return a.text.localeCompare(b.text)
        case 'page':
          return a.page - b.page
        case 'color':
          return a.color.localeCompare(b.color)
        case 'date':
        default:
          return new Date(b.createdAt) - new Date(a.createdAt)
      }
    })

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getColorStats = () => {
    const stats = {}
    highlights.forEach(h => {
      stats[h.color] = (stats[h.color] || 0) + 1
    })
    return stats
  }

  const colorStats = getColorStats()

  const handleHighlightClick = (highlight) => {
    onHighlightClick(highlight)
    if (isMobile) {
      onClose() // Auto-close on mobile after navigation
    }
  }

  return (
    <div className={`reader-panel highlight-panel ${isMobile ? 'mobile' : 'desktop'}`}>
      {/* Mobile header with drag indicator */}
      {isMobile && (
        <div className="panel-drag-indicator">
          <div className="drag-handle"></div>
        </div>
      )}

      <header className="panel-header">
        <h3>
          <span className="panel-icon">🖍️</span>
          Highlight ({highlights.length})
        </h3>
        <button
          className="btn btn-secondary btn-small panel-close-btn"
          onClick={onClose}
          aria-label="Tutup panel highlight"
        >
          ✕
        </button>
      </header>

      {/* Search and Filters */}
      {highlights.length > 0 && (
        <div className="panel-filters">
          <div className="search-input-container">
            <input
              type="text"
              placeholder="Cari highlight..."
              className="form-control search-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              aria-label="Cari highlight"
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

          <div className="filter-controls">
            <select
              value={filterColor}
              onChange={(e) => setFilterColor(e.target.value)}
              className="form-control color-filter"
              aria-label="Filter berdasarkan warna"
            >
              <option value="all">Semua Warna ({highlights.length})</option>
              {Object.entries(colorMap).map(([color, info]) => (
                colorStats[color] ? (
                  <option key={color} value={color}>
                    {info.emoji} {info.name} ({colorStats[color]})
                  </option>
                ) : null
              ))}
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="form-control sort-select"
              aria-label="Urutkan highlight"
            >
              <option value="date">📅 Terbaru</option>
              <option value="text">📝 Teks</option>
              <option value="page">📄 Halaman</option>
              <option value="color">🎨 Warna</option>
            </select>
          </div>

          {/* Color filter chips for mobile */}
          {isMobile && (
            <div className="color-filter-chips">
              <button
                className={`color-chip ${filterColor === 'all' ? 'active' : ''}`}
                onClick={() => setFilterColor('all')}
              >
                Semua ({highlights.length})
              </button>
              {Object.entries(colorMap).map(([color, info]) => (
                colorStats[color] ? (
                  <button
                    key={color}
                    className={`color-chip ${filterColor === color ? 'active' : ''}`}
                    onClick={() => setFilterColor(color)}
                    style={{ borderColor: color }}
                  >
                    {info.emoji} {colorStats[color]}
                  </button>
                ) : null
              ))}
            </div>
          )}
        </div>
      )}

      {/* Content */}
      <div className="panel-content">
        {filteredHighlights.length === 0 ? (
          <div className="empty-state">
            {highlights.length === 0 ? (
              <>
                <div className="empty-icon">🖍️</div>
                <h4>Belum ada highlight</h4>
                <p>Pilih teks dan klik warna untuk membuat highlight.</p>
                {isMobile && (
                  <p><small>💡 Tekan dan tahan teks, lalu pilih warna highlight</small></p>
                )}
              </>
            ) : (
              <>
                <div className="empty-icon">🔍</div>
                <h4>Tidak ada hasil</h4>
                <p>Tidak ada highlight yang cocok dengan filter</p>
                <div className="empty-actions">
                  <button
                    className="btn btn-secondary btn-small"
                    onClick={() => {
                      setSearchTerm('')
                      setFilterColor('all')
                    }}
                  >
                    Reset Filter
                  </button>
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="highlight-list">
            {filteredHighlights.map((highlight) => (
              <article key={highlight.id} className="highlight-item">
                <div
                  className="highlight-content"
                  onClick={() => handleHighlightClick(highlight)}
                  role="button"
                  tabIndex={0}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      handleHighlightClick(highlight)
                    }
                  }}
                  aria-label={`Navigasi ke highlight: ${highlight.text.substring(0, 50)}...`}
                >
                  <div className="highlight-header">
                    <div
                      className="highlight-color-indicator"
                      style={{ backgroundColor: highlight.color }}
                      title={colorMap[highlight.color]?.name}
                      aria-label={`Warna: ${colorMap[highlight.color]?.name}`}
                    />
                    <span className="highlight-info">
                      <span className="highlight-page">Hal. {highlight.page}</span>
                      <span className="color-name">{colorMap[highlight.color]?.emoji}</span>
                    </span>
                  </div>

                  <blockquote className="highlight-text">
                    "{highlight.text}"
                  </blockquote>

                  {highlight.notes && (
                    <p className="highlight-note">{highlight.notes}</p>
                  )}

                  <div className="highlight-meta">
                    <time className="highlight-date">
                      {formatDate(highlight.createdAt)}
                    </time>
                    {highlight.chapterTitle && (
                      <span className="chapter-title">{highlight.chapterTitle}</span>
                    )}
                  </div>
                </div>

                <div className="highlight-actions">
                  <button
                    className="btn btn-secondary btn-small action-btn delete-btn"
                    onClick={(e) => {
                      e.stopPropagation()
                      if (confirm('Hapus highlight ini?')) {
                        onHighlightDelete(highlight.id)
                      }
                    }}
                    title="Hapus highlight"
                    aria-label={`Hapus highlight: ${highlight.text.substring(0, 30)}...`}
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
      {highlights.length > 0 && (
        <footer className="panel-footer">
          <small>
            Menampilkan {filteredHighlights.length} dari {highlights.length} highlight
            {(searchTerm || filterColor !== 'all') && (
              <span>
                • Filter: {searchTerm && `"${searchTerm}"`}
                {searchTerm && filterColor !== 'all' && ', '}
                {filterColor !== 'all' && colorMap[filterColor]?.name}
              </span>
            )}
          </small>
        </footer>
      )}
    </div>
  )
}

export default HighlightPanel