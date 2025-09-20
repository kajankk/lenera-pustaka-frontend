

// Enhanced SearchPanel.jsx
const SearchPanel = ({ searchResults, onSearch, searching, onResultClick, onClose }) => {
  const [query, setQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [searchHistory, setSearchHistory] = useState([])

  const handleSearch = (e) => {
    e.preventDefault()
    if (!query.trim()) return

    setCurrentPage(1)
    onSearch(query.trim(), 1, 10)

    // Add to search history
    setSearchHistory(prev => {
      const newHistory = [query.trim(), ...prev.filter(item => item !== query.trim())].slice(0, 5)
      return newHistory
    })
  }

  const handleHistorySearch = (historyQuery) => {
    setQuery(historyQuery)
    onSearch(historyQuery, 1, 10)
    setCurrentPage(1)
  }

  const loadMore = () => {
    if (searchResults && searchResults.hasMore) {
      onSearch(query, currentPage + 1, 10)
      setCurrentPage(prev => prev + 1)
    }
  }

  return (
    <div className="reader-panel card">
      <div className="panel-header">
        <h3>Pencarian dalam Buku</h3>
        <button className="btn btn-secondary btn-small" onClick={onClose}>
          ✕
        </button>
      </div>

      <div className="panel-search-form">
        <form onSubmit={handleSearch}>
          <div className="search-input-group">
            <input
              type="text"
              className="form-control"
              placeholder="Cari kata atau kalimat..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              disabled={searching}
            />
            <button
              type="submit"
              className="btn btn-primary btn-small"
              disabled={!query.trim() || searching}
            >
              {searching ? 'Mencari...' : 'Cari'}
            </button>
          </div>
        </form>

        {/* Search History */}
        {searchHistory.length > 0 && (
          <div className="search-history">
            <small>Pencarian terakhir:</small>
            <div className="history-tags">
              {searchHistory.map((historyItem, index) => (
                <button
                  key={index}
                  className="btn btn-secondary btn-small history-tag"
                  onClick={() => handleHistorySearch(historyItem)}
                >
                  {historyItem}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="panel-content">
        {!searchResults ? (
          <div className="empty-state">
            <div className="empty-icon">🔍</div>
            <p>Masukkan kata kunci untuk mencari dalam buku ini.</p>
            <div className="search-tips">
              <h4>Tips Pencarian:</h4>
              <ul>
                <li>Gunakan kata kunci spesifik</li>
                <li>Coba variasi kata yang berbeda</li>
                <li>Gunakan tanda kutip untuk pencarian frasa</li>
              </ul>
            </div>
          </div>
        ) : searchResults.results?.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">❌</div>
            <p>Tidak ditemukan hasil untuk "{query}"</p>
            <p>Coba kata kunci yang berbeda atau lebih umum.</p>
          </div>
        ) : (
          <div className="search-results">
            <div className="search-summary">
              Ditemukan {searchResults.total} hasil untuk "{query}"
              {searchResults.total > searchResults.results.length && (
                <span> (menampilkan {searchResults.results.length} pertama)</span>
              )}
            </div>

            <div className="results-list">
              {searchResults.results.map((result, index) => (
                <div
                  key={index}
                  className="search-result-item"
                  onClick={() => onResultClick(result)}
                >
                  <div className="result-header">
                    <span className="result-page">Hal. {result.page}</span>
                    {result.chapter && (
                      <span className="result-chapter">{result.chapter}</span>
                    )}
                  </div>

                  <div className="result-context">
                    {result.context.split(new RegExp(`(${query})`, 'gi')).map((part, i) =>
                      part.toLowerCase() === query.toLowerCase() ?
                        <mark key={i}>{part}</mark> : part
                    )}
                  </div>

                  <div className="result-meta">
                    <small>Klik untuk navigasi ke lokasi ini</small>
                  </div>
                </div>
              ))}
            </div>

            {searchResults.hasMore && (
              <button
                className="btn btn-secondary load-more"
                onClick={loadMore}
                disabled={searching}
              >
                {searching ? 'Memuat...' : 'Muat Lebih Banyak'}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default SearchPanel