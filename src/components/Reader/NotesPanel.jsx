import React, { useState, useEffect, useRef } from 'react'

const NotesPanel = ({
  notes,
  onNoteAdd,
  onNoteClick,
  onNoteDelete,
  onClose,
  selectedText,
  isMobile = false
}) => {
  const [newNote, setNewNote] = useState('')
  const [isAdding, setIsAdding] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState('date')
  const [editingNote, setEditingNote] = useState(null)
  const textareaRef = useRef(null)

  // Close panel on escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        if (editingNote) {
          setEditingNote(null)
        } else {
          onClose()
        }
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [onClose, editingNote])

  // Auto-focus textarea when adding note
  useEffect(() => {
    if (selectedText && textareaRef.current) {
      textareaRef.current.focus()
    }
  }, [selectedText])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!newNote.trim()) return

    setIsAdding(true)
    try {
      let noteContent = newNote.trim()
      if (selectedText) {
        noteContent = `"${selectedText}"\n\n${noteContent}`
      }

      await onNoteAdd(noteContent)
      setNewNote('')

      // Auto-close on mobile after successful add
      if (isMobile && !selectedText) {
        setTimeout(() => onClose(), 1000)
      }
    } catch (error) {
      console.error('Error adding note:', error)
    } finally {
      setIsAdding(false)
    }
  }

  const handleNoteClick = (note) => {
    onNoteClick(note)
    if (isMobile) {
      onClose() // Auto-close on mobile after navigation
    }
  }

  const filteredAndSortedNotes = notes
    .filter(note =>
      note.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      note.content.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      switch (sortBy) {
        case 'title':
          return (a.title || '').localeCompare(b.title || '')
        case 'page':
          return a.page - b.page
        case 'content':
          return a.content.localeCompare(b.content)
        case 'date':
        default:
          return new Date(b.createdAt) - new Date(a.createdAt)
      }
    })

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
    <div className={`reader-panel notes-panel ${isMobile ? 'mobile' : 'desktop'}`}>
      {/* Mobile header with drag indicator */}
      {isMobile && (
        <div className="panel-drag-indicator">
          <div className="drag-handle"></div>
        </div>
      )}

      <header className="panel-header">
        <h3>
          <span className="panel-icon">📝</span>
          Catatan ({notes.length})
        </h3>
        <button
          className="btn btn-secondary btn-small panel-close-btn"
          onClick={onClose}
          aria-label="Tutup panel catatan"
        >
          ✕
        </button>
      </header>

      {/* Add Note Form */}
      <div className="panel-add-form">
        {selectedText && (
          <div className="selected-text-preview">
            <strong>Teks Terpilih:</strong>
            <blockquote className="selected-text">"{selectedText}"</blockquote>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="newNote" className="sr-only">
              Tulis catatan baru
            </label>
            <textarea
              id="newNote"
              ref={textareaRef}
              className="form-control note-textarea"
              placeholder="Tulis catatan Anda..."
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              rows={isMobile ? "3" : "4"}
              disabled={isAdding}
              aria-describedby="note-help"
            />
            <small id="note-help" className="form-help">
              {selectedText ? 'Catatan akan menyertakan teks yang dipilih' : 'Tambahkan catatan pribadi Anda'}
            </small>
          </div>

          <div className="form-actions">
            <button
              type="submit"
              className="btn btn-primary btn-small"
              disabled={!newNote.trim() || isAdding}
            >
              {isAdding ? (
                <>
                  <span className="loading-spinner small"></span>
                  Menambahkan...
                </>
              ) : (
                <>
                  <span>📝</span>
                  Tambah Catatan
                </>
              )}
            </button>
            {(selectedText || newNote) && (
              <button
                type="button"
                className="btn btn-secondary btn-small"
                onClick={() => {
                  setNewNote('')
                  if (textareaRef.current) {
                    textareaRef.current.blur()
                  }
                }}
              >
                Batal
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Search and Filters */}
      {notes.length > 0 && (
        <div className="panel-filters">
          <div className="search-input-container">
            <input
              type="text"
              placeholder="Cari catatan..."
              className="form-control search-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              aria-label="Cari catatan"
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
            aria-label="Urutkan catatan"
          >
            <option value="date">📅 Terbaru</option>
            <option value="title">📝 Judul</option>
            <option value="page">📄 Halaman</option>
            <option value="content">📖 Konten</option>
          </select>
        </div>
      )}

      {/* Content */}
      <div className="panel-content">
        {filteredAndSortedNotes.length === 0 ? (
          <div className="empty-state">
            {notes.length === 0 ? (
              <>
                <div className="empty-icon">📝</div>
                <h4>Belum ada catatan</h4>
                <p>Tambahkan catatan pribadi Anda di atas.</p>
                {isMobile && (
                  <p><small>💡 Tekan dan tahan teks untuk menambah catatan kontekstual</small></p>
                )}
              </>
            ) : (
              <>
                <div className="empty-icon">🔍</div>
                <h4>Tidak ada hasil</h4>
                <p>Tidak ada catatan yang cocok dengan pencarian "{searchTerm}"</p>
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
          <div className="notes-list">
            {filteredAndSortedNotes.map((note) => (
              <article key={note.id} className="note-item">
                <div
                  className="note-content"
                  onClick={() => handleNoteClick(note)}
                  role="button"
                  tabIndex={0}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      handleNoteClick(note)
                    }
                  }}
                  aria-label={`Navigasi ke catatan: ${note.title || note.content.substring(0, 50)}`}
                >
                  <div className="note-header">
                    {note.title && <h4 className="note-title">{note.title}</h4>}
                    <span className="note-page">Hal. {note.page}</span>
                  </div>

                  <div className="note-text">
                    {note.content.split('\n').map((line, idx) => (
                      <p key={idx}>{line}</p>
                    ))}
                  </div>

                  <div className="note-meta">
                    <time className="note-date">
                      {formatDate(note.createdAt)}
                    </time>
                    {note.chapterTitle && (
                      <span className="chapter-title">{note.chapterTitle}</span>
                    )}
                    {note.isPrivate && (
                      <span className="private-indicator" title="Catatan pribadi">🔒</span>
                    )}
                  </div>
                </div>

                <div className="note-actions">
                  <button
                    className="btn btn-secondary btn-small action-btn edit-btn"
                    onClick={(e) => {
                      e.stopPropagation()
                      setEditingNote(note)
                      setNewNote(note.content)
                    }}
                    title="Edit catatan"
                    aria-label={`Edit catatan: ${note.title || note.content.substring(0, 30)}`}
                  >
                    ✏️
                  </button>
                  <button
                    className="btn btn-secondary btn-small action-btn delete-btn"
                    onClick={(e) => {
                      e.stopPropagation()
                      if (confirm('Hapus catatan ini?')) {
                        onNoteDelete(note.id)
                      }
                    }}
                    title="Hapus catatan"
                    aria-label={`Hapus catatan: ${note.title || note.content.substring(0, 30)}`}
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
      {notes.length > 0 && (
        <footer className="panel-footer">
          <small>
            Menampilkan {filteredAndSortedNotes.length} dari {notes.length} catatan
            {searchTerm && ` • Filter: "${searchTerm}"`}
          </small>
        </footer>
      )}

      {/* Edit Note Modal for Mobile */}
      {editingNote && isMobile && (
        <div className="edit-note-modal">
          <div className="modal-content">
            <div className="modal-header">
              <h4>Edit Catatan</h4>
              <button
                className="btn btn-secondary btn-small"
                onClick={() => setEditingNote(null)}
              >
                ✕
              </button>
            </div>
            <div className="modal-body">
              <textarea
                className="form-control"
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                rows="6"
                placeholder="Edit catatan..."
              />
            </div>
            <div className="modal-footer">
              <button
                className="btn btn-secondary"
                onClick={() => setEditingNote(null)}
              >
                Batal
              </button>
              <button
                className="btn btn-primary"
                onClick={() => {
                  // Handle update logic here
                  setEditingNote(null)
                  setNewNote('')
                }}
              >
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default NotesPanel