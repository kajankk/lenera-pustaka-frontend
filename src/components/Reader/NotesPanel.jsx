

// Enhanced NotesPanel.jsx
const NotesPanel = ({ notes, onNoteAdd, onNoteClick, onNoteDelete, onClose, selectedText }) => {
  const [newNote, setNewNote] = useState('')
  const [isAdding, setIsAdding] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState('date')
  const [editingNote, setEditingNote] = useState(null)

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
    } catch (error) {
      console.error('Error adding note:', error)
    } finally {
      setIsAdding(false)
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
    <div className="reader-panel card">
      <div className="panel-header">
        <h3>Catatan ({notes.length})</h3>
        <button className="btn btn-secondary btn-small" onClick={onClose}>
          ✕
        </button>
      </div>

      {/* Add Note Form */}
      <div className="panel-add-form">
        {selectedText && (
          <div className="selected-text-preview">
            <strong>Teks Terpilih:</strong>
            <div className="selected-text">"{selectedText}"</div>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <textarea
            className="form-control"
            placeholder="Tulis catatan Anda..."
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            rows="3"
            disabled={isAdding}
          />
          <div className="form-actions">
            <button
              type="submit"
              className="btn btn-primary btn-small"
              disabled={!newNote.trim() || isAdding}
            >
              {isAdding ? 'Menambahkan...' : 'Tambah Catatan'}
            </button>
            {selectedText && (
              <button
                type="button"
                className="btn btn-secondary btn-small"
                onClick={() => setNewNote('')}
              >
                Batal
              </button>
            )}
          </div>
        </form>
      </div>

      {notes.length > 0 && (
        <div className="panel-filters">
          <input
            type="text"
            placeholder="Cari catatan..."
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
            <option value="content">Urutkan: Konten</option>
          </select>
        </div>
      )}

      <div className="panel-content">
        {filteredAndSortedNotes.length === 0 ? (
          <div className="empty-state">
            {notes.length === 0 ? (
              <>
                <div className="empty-icon">📝</div>
                <p>Belum ada catatan.</p>
                <p>Tambahkan catatan pribadi Anda di atas.</p>
              </>
            ) : (
              <>
                <div className="empty-icon">🔍</div>
                <p>Tidak ada catatan yang cocok dengan pencarian "{searchTerm}"</p>
              </>
            )}
          </div>
        ) : (
          <div className="notes-list">
            {filteredAndSortedNotes.map((note) => (
              <div key={note.id} className="note-item">
                <div
                  className="note-content"
                  onClick={() => onNoteClick(note)}
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
                    <small>{formatDate(note.createdAt)}</small>
                    {note.chapterTitle && (
                      <small className="chapter-title">{note.chapterTitle}</small>
                    )}
                    {note.isPrivate && (
                      <small className="private-indicator">🔒 Pribadi</small>
                    )}
                  </div>
                </div>

                <div className="note-actions">
                  <button
                    className="btn btn-secondary btn-small"
                    onClick={(e) => {
                      e.stopPropagation()
                      setEditingNote(note)
                    }}
                    title="Edit catatan"
                  >
                    ✏️
                  </button>
                  <button
                    className="btn btn-secondary btn-small"
                    onClick={(e) => {
                      e.stopPropagation()
                      onNoteDelete(note.id)
                    }}
                    title="Hapus catatan"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {notes.length > 0 && (
        <div className="panel-footer">
          <small>
            Menampilkan {filteredAndSortedNotes.length} dari {notes.length} catatan
          </small>
        </div>
      )}
    </div>
  )
}

export default NotesPanel