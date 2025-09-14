import React, { useState } from 'react'
import { useTheme } from '../../hooks/useTheme'

const SearchForm = ({ onSearch }) => {
  const [searchTitle, setSearchTitle] = useState('')
  const { theme } = useTheme()

  const handleSubmit = (e) => {
    e.preventDefault()
    onSearch({ searchTitle })
  }

  const handleReset = () => {
    setSearchTitle('')
    onSearch({})
  }

  return (
    <div className="search-section card" style={{ maxWidth: '600px', margin: '0 auto' }}>
      <div className="form-group" style={{ marginBottom: '0.75rem' }}>
        <label style={{ fontSize: '0.9rem', marginBottom: '0.25rem' }}>Cari Ebook</label>
        <input
          type="text"
          className="form-control"
          placeholder="Masukkan judul ebook..."
          value={searchTitle}
          onChange={(e) => setSearchTitle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleSubmit(e)
            }
          }}
          style={{
            color: theme === 'dark' ? '#ffffff' : 'inherit',
            backgroundColor: theme === 'dark' ? 'var(--card-bg)' : 'inherit',
            border: theme === 'dark' ? '1px solid var(--border-color)' : 'inherit',
            padding: '0.5rem',
            height: '2.5rem'
          }}
        />
      </div>
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <button
          className="btn btn-primary"
          onClick={handleSubmit}
          style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}
        >
          Cari
        </button>
        {searchTitle && (
          <button
            className="btn btn-secondary"
            onClick={handleReset}
            style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}
          >
            Reset
          </button>
        )}
      </div>
    </div>
  )
}

export default SearchForm