import React, { useState } from 'react'

const SearchForm = ({ onSearch }) => {
  const [searchTitle, setSearchTitle] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    onSearch({ searchTitle })
  }

  const handleReset = () => {
    setSearchTitle('')
    onSearch({})
  }

  return (
    <div className="search-section card">
      <div className="form-group">
        <label>Cari Ebook</label>
        <input
          type="text"
          className="form-control"
          placeholder="Masukkan judul ebook..."
          value={searchTitle}
          onChange={(e) => setSearchTitle(e.target.value)}
        />
      </div>
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <button
          className="btn btn-primary"
          onClick={handleSubmit}
        >
          Cari
        </button>
        {searchTitle && (
          <button
            className="btn btn-secondary"
            onClick={handleReset}
          >
            Reset
          </button>
        )}
      </div>
    </div>
  )
}

export default SearchForm