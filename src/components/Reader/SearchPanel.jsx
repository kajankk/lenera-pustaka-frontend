// components/Reader/SearchPanel.jsx
import React, { useState } from 'react'

const SearchPanel = ({ searchResults, onSearch, searching, onResultClick, onClose }) => {
  const [query, setQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)

  const handleSearch = (e) => {
    e.preventDefault()
    if (!query.trim()) return

    setCurrentPage(1)
    onSearch(query.trim(), 1, 10)
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
          Tutup
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
      </div>

      <div className="panel-content">
        {!searchResults ? (
          <div className="empty-state">
            <p>Masukkan kata kunci untuk mencari dalam buku ini.</p>
          </div>
        ) : searchResults.results?.length === 0 ? (
          <div className="empty-state">
            <p>Tidak ditemukan hasil untuk "{query}"</p>
          </div>
        ) : (
          <div className="search-results">
            <div className="search-summary">
              Ditemukan {searchResults.total} hasil untuk "{query}"
            </div>
            <div className="results-list">
              {searchResults.results.map((result, index) => (
                <div
                  key={index}
                  className="search-result-item"
                  onClick={() => onResultClick(result)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="result-context">
                    {result.context.split(new RegExp(`(${query})`, 'gi')).map((part, i) =>
                      part.toLowerCase() === query.toLowerCase() ?
                        <mark key={i}>{part}</mark> : part
                    )}
                  </div>
                  <small className="result-meta">
                    Halaman {result.page} • Chapter {result.chapter}
                  </small>
                </div>
              ))}
            </div>
            {searchResults.hasMore && (
              <button
                className="btn btn-secondary"
                onClick={loadMore}
                disabled={searching}
                style={{ width: '100%', marginTop: '1rem' }}
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