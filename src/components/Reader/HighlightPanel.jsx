// Enhanced HighlightPanel.jsx
const HighlightPanel = ({ highlights, onHighlightClick, onHighlightDelete, onClose }) => {
  const [filterColor, setFilterColor] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState('date')

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

  return (
    <div className="reader-panel card">
      <div className="panel-header">
        <h3>Highlight ({highlights.length})</h3>
        <button className="btn btn-secondary btn-small" onClick={onClose}>
          ✕
        </button>
      </div>

      {highlights.length > 0 && (
        <div className="panel-filters">
          <input
            type="text"
            placeholder="Cari highlight..."
            className="form-control"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

          <div className="filter-row">
            <select
              value={filterColor}
              onChange={(e) => setFilterColor(e.target.value)}
              className="form-control"
            >
              <option value="all">Semua Warna ({highlights.length})</option>
              {Object.entries(colorMap).map(([color, info]) => (
                <option key={color} value={color}>
                  {info.emoji} {info.name} ({colorStats[color] || 0})
                </option>
              ))}
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="form-control"
            >
              <option value="date">Urutkan: Terbaru</option>
              <option value="text">Urutkan: Teks</option>
              <option value="page">Urutkan: Halaman</option>
              <option value="color">Urutkan: Warna</option>
            </select>
          </div>
        </div>
      )}

      <div className="panel-content">
        {filteredHighlights.length === 0 ? (
          <div className="empty-state">
            {highlights.length === 0 ? (
              <>
                <div className="empty-icon">🖍️</div>
                <p>Belum ada highlight.</p>
                <p>Pilih teks dan klik warna untuk membuat highlight.</p>
              </>
            ) : (
              <>
                <div className="empty-icon">🔍</div>
                <p>Tidak ada highlight yang cocok dengan filter</p>
              </>
            )}
          </div>
        ) : (
          <div className="highlight-list">
            {filteredHighlights.map((highlight) => (
              <div key={highlight.id} className="highlight-item">
                <div
                  className="highlight-content"
                  onClick={() => onHighlightClick(highlight)}
                >
                  <div className="highlight-header">
                    <div
                      className="highlight-color-indicator"
                      style={{ backgroundColor: highlight.color }}
                      title={colorMap[highlight.color]?.name}
                    />
                    <span className="highlight-page">Hal. {highlight.page}</span>
                  </div>

                  <div className="highlight-text">
                    "{highlight.text}"
                  </div>

                  {highlight.notes && (
                    <p className="highlight-note">{highlight.notes}</p>
                  )}

                  <div className="highlight-meta">
                    <small>{formatDate(highlight.createdAt)}</small>
                    {highlight.chapterTitle && (
                      <small className="chapter-title">{highlight.chapterTitle}</small>
                    )}
                  </div>
                </div>

                <div className="highlight-actions">
                  <button
                    className="btn btn-secondary btn-small"
                    onClick={(e) => {
                      e.stopPropagation()
                      onHighlightDelete(highlight.id)
                    }}
                    title="Hapus highlight"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {highlights.length > 0 && (
        <div className="panel-footer">
          <small>
            Menampilkan {filteredHighlights.length} dari {highlights.length} highlight
          </small>
        </div>
      )}
    </div>
  )
}

 export default HighlightPanel