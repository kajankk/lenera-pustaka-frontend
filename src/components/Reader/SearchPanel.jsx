import React, { useState, useEffect, useRef } from 'react'

const SearchPanel = ({
  searchResults,
  onSearch,
  searching,
  onResultClick,
  onClose,
  isMobile = false
}) => {
  const [query, setQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [searchHistory, setSearchHistory] = useState([])
  const searchInputRef = useRef(null)

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

  // Auto-focus search input
  useEffect(() => {
    if (searchInputRef.current && !isMobile) {
      searchInputRef.current.focus()
    }
  }, [isMobile])

  // Load search history from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('epub-search-history')
      if (saved) {
        setSearchHistory(JSON.parse(saved))
      }
    } catch (error) {
      console.error('Error loading search history:', error)
    }
  }, [])

  // Save search history to localStorage
  const saveSearchHistory = (newHistory) => {
    try {
      localStorage.setItem('epub-search-history', JSON.stringify(newHistory))
      setSearchHistory(newHistory)
    } catch (error) {
      console.error('Error saving search history:', error)
    }
  }

  const handleSearch = (e) => {
    e.preventDefault()
    if (!query.trim()) return

    setCurrentPage(1)
    onSearch(query.trim(), 1, 10)

    // Add to search history
    const newHistory = [
      query.trim(),
      ...searchHistory.filter(item => item !== query.trim())
    ].slice(0, 5)
    saveSearchHistory(newHistory)
  }

  const handleHistorySearch = (historyQuery) => {
    setQuery(historyQuery)
    onSearch(historyQuery, 1, 10)
    setCurrentPage(1)
  }

  const handleResultClick = (result) => {
    onResultClick(result)
    if (isMobile) {
      onClose() // Auto-close on mobile after navigation
    }
  }

  const loadMore = () => {
    if (searchResults && searchResults.hasMore) {
      onSearch(query, currentPage + 1, 10)
      setCurrentPage(prev => prev + 1)
    }
  }

  const clearHistory = () => {
    if (confirm('Hapus semua riwayat pencarian?')) {
      saveSearchHistory([])
    }
  }

  return (
    <div className={`reader-panel search-panel ${isMobile ? 'mobile' : 'desktop'}`}>
      {/* Mobile header with drag indicator */}
      {isMobile && (
        <div className="panel-drag-indicator">
          <div className="drag-handle"></div>
        </div>
      )}

      <header className="panel-header">
        <h3>
          <span className="panel-icon">🔍</span>
          Pencarian dalam Buku
        </h3>
        <button
          className="btn btn-secondary btn-small panel-close-btn"
          onClick={onClose}
          aria-label="Tutup panel pencarian"
        >
          ✕
        </button>
      </header>

      {/* Search Form */}
      <div className="panel-search-form">
        <form onSubmit={handleSearch}>
          <div className="search-input-group">
            <label htmlFor="searchQuery" className="sr-only">
              Kata kunci pencarian
            </label>
            <input
              id="searchQuery"
              ref={searchInputRef}
              type="text"
              className="form-control search-input"
              placeholder="Cari kata atau kalimat..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              disabled={searching}
              aria-describedby="search-help"
            />
            <button
              type="submit"
              className="btn btn-primary search-btn"
              disabled={!query.trim() || searching}
              aria-label="Mulai pencarian"
            >
              {searching ? (
                <span className="loading-spinner small"></span>
              ) : (
                <span>🔍</span>
              )}
            </button>
          </div>
          <small id="search-help" className="form-help">
            Masukkan kata kunci untuk mencari dalam buku ini
          </small>
        </form>

        {/* Search History */}
        {searchHistory.length > 0 && (
          <div className="search-history">
            <div className="history-header">
              <small>Pencarian terakhir:</small>
              <button
                className="btn btn-secondary btn-tiny clear-history-btn"
                onClick={clearHistory}
                title="Hapus riwayat"
              >
                🗑️
              </button>
            </div>
            <div className="history-tags">
              {searchHistory.map((historyItem, index) => (
                <button
                  key={index}
                  className="btn btn-secondary btn-small history-tag"
                  onClick={() => handleHistorySearch(historyItem)}
                  title={`Cari: ${historyItem}`}
                >
                  {historyItem}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="panel-content">
        {!searchResults ? (
          <div className="empty-state">
            <div className="empty-icon">🔍</div>
            <h4>Siap untuk mencari</h4>
            <p>Masukkan kata kunci untuk mencari dalam buku ini.</p>
            <div className="search-tips">
              <h5>Tips Pencarian:</h5>
              <ul>
                <li>Gunakan kata kunci spesifik</li>
                <li>Coba variasi kata yang berbeda</li>
                <li>Gunakan tanda kutip untuk pencarian frasa</li>
                <li>Pencarian tidak peka huruf besar/kecil</li>
              </ul>
            </div>
          </div>
        ) : searchResults.results?.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">❌</div>
            <h4>Tidak ditemukan hasil</h4>
            <p>Tidak ditemukan hasil untuk "<strong>{query}</strong>"</p>
            <div className="empty-suggestions">
              <p>Cobalah:</p>
              <ul>
                <li>Kata kunci yang berbeda atau lebih umum</li>
                <li>Periksa ejaan kata kunci</li>
                <li>Gunakan sinonim atau istilah terkait</li>
              </ul>
            </div>
            <button
              className="btn btn-secondary"
              onClick={() => {
                setQuery('')
                if (searchInputRef.current) {
                  searchInputRef.current.focus()
                }
              }}
            >
              Cari Lagi
            </button>
          </div>
        ) : (
          <div className="search-results">
            <div className="search-summary">
              <strong>
                {searchResults.total} hasil ditemukan untuk "{query}"
              </strong>
              {searchResults.total > searchResults.results.length && (
                <span className="results-shown">
                  (menampilkan {searchResults.results.length} pertama)
                </span>
              )}
            </div>

            <div className="results-list">
              {searchResults.results.map((result, index) => (
                <article
                  key={index}
                  className="search-result-item"
                  onClick={() => handleResultClick(result)}
                  role="button"
                  tabIndex={0}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      handleResultClick(result)
                    }
                  }}
                  aria-label={`Navigasi ke hasil pencarian di halaman ${result.page}`}
                >
                  <div className="result-header">
                    <span className="result-page">📄 Halaman {result.page}</span>
                    {result.chapter && (
                      <span className="result-chapter">{result.chapter}</span>
                    )}
                  </div>

                  <div className="result-context">
                    {result.context.split(new RegExp(`(${query})`, 'gi')).map((part, i) =>
                      part.toLowerCase() === query.toLowerCase() ?
                        <mark key={i} className="search-highlight">{part}</mark> :
                        <span key={i}>{part}</span>
                    )}
                  </div>

                  <div className="result-meta">
                    <small>👆 Klik untuk navigasi ke lokasi ini</small>
                  </div>
                </article>
              ))}
            </div>

            {/* Load More Button */}
            {searchResults.hasMore && (
              <div className="load-more-container">
                <button
                  className="btn btn-secondary load-more-btn"
                  onClick={loadMore}
                  disabled={searching}
                >
                  {searching ? (
                    <>
                      <span className="loading-spinner small"></span>
                      Memuat...
                    </>
                  ) : (
                    <>
                      <span>📄</span>
                      Muat Lebih Banyak ({searchResults.total - searchResults.results.length} lagi)
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Search Stats */}
            <div className="search-stats">
              <small>
                Pencarian selesai dalam {searchResults.searchTime || 0}ms
                {searchResults.total > 0 && ` • ${Math.ceil(searchResults.total / 10)} halaman hasil`}
              </small>
            </div>
          </div>
        )}
      </div>

      {/* Quick Actions Footer */}
      {searchResults && searchResults.results?.length > 0 && (
        <footer className="panel-footer">
          <div className="quick-actions">
            <button
              className="btn btn-secondary btn-small"
              onClick={() => {
                setQuery('')
                setCurrentPage(1)
                if (searchInputRef.current) {
                  searchInputRef.current.focus()
                }
              }}
              title="Mulai pencarian baru"
            >
              🔄 Cari Lagi
            </button>
            <button
              className="btn btn-secondary btn-small"
              onClick={() => {
                const searchText = searchResults.results
                  .map(r => `Hal. ${r.page}: ${r.context}`)
                  .join('\n\n')
                navigator.clipboard?.writeText(searchText)
                  .then(() => alert('Hasil pencarian disalin ke clipboard'))
                  .catch(() => console.log('Clipboard not supported'))
              }}
              title="Salin semua hasil"
            >
              📋 Salin
            </button>
          </div>
        </footer>
      )}
    </div>
  )
}

export default SearchPanel