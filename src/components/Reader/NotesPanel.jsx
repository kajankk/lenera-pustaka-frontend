// components/Reader/NotesPanel.jsx
import React, { useState } from 'react'

const NotesPanel = ({
  notes,
  onNoteAdd,
  onNoteClick,
  onNoteDelete,
  onClose,
  selectedText
}) => {
  const [newNote, setNewNote] = useState('')
  const [isAdding, setIsAdding] = useState(false)

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
          Tutup
        </button>
      </div>

      {/* Add Note Form */}
      <div className="panel-add-form">
        {selectedText && (
          <div className="selected-text-preview">
            <strong>Teks Terpilih:</strong> "{selectedText}"
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
          <button
            type="submit"
            className="btn btn-primary btn-small"
            disabled={!newNote.trim() || isAdding}
            style={{ marginTop: '0.5rem' }}
          >
            {isAdding ? 'Menambahkan...' : 'Tambah Catatan'}
          </button>
        </form>
      </div>

      <div className="panel-content">
        {notes.length === 0 ? (
          <div className="empty-state">
            <p>Belum ada catatan.</p>
            <p>Tambahkan catatan pribadi Anda di atas.</p>
          </div>
        ) : (
          <div className="notes-list">
            {notes.map((note) => (
              <div key={note.id} className="note-item">
                <div
                  className="note-content"
                  onClick={() => onNoteClick(note)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="note-text">
                    {note.content.split('\n').map((line, idx) => (
                      <p key={idx}>{line}</p>
                    ))}
                  </div>
                  <small className="note-meta">
                    Halaman {note.page} • {formatDate(note.createdAt)}
                  </small>
                </div>
                <button
                  className="btn btn-secondary btn-small"
                  onClick={(e) => {
                    e.stopPropagation()
                    onNoteDelete(note.id)
                  }}
                  title="Hapus catatan"
                >
                  Hapus
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default NotesPanel