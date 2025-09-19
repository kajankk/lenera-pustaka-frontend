// components/Books/BookExportModal.jsx
import React, { useState } from 'react'
import { bookService } from '../../services/bookService'

const BookExportModal = ({ bookSlug, bookTitle, onClose }) => {
  const [exportFormat, setExportFormat] = useState('PDF')
  const [isExporting, setIsExporting] = useState(false)
  const [exportSuccess, setExportSuccess] = useState(false)

  const formats = [
    { value: 'PDF', label: 'PDF Document', description: 'Format PDF dengan layout yang rapi' },
    { value: 'DOCX', label: 'Word Document', description: 'File Word yang dapat diedit' },
    { value: 'TXT', label: 'Plain Text', description: 'File teks sederhana' },
    { value: 'JSON', label: 'JSON Data', description: 'Data mentah dalam format JSON' }
  ]

  const handleExport = async () => {
    setIsExporting(true)
    try {
      const response = await bookService.exportHighlightsAndNotes(bookSlug, exportFormat)

      if (response.data?.downloadUrl) {
        // Create download link
        const link = document.createElement('a')
        link.href = response.data.downloadUrl
        link.download = `${bookTitle}_export.${exportFormat.toLowerCase()}`
        link.click()

        setExportSuccess(true)
        setTimeout(() => {
          setExportSuccess(false)
          onClose()
        }, 2000)
      }
    } catch (error) {
      console.error('Export error:', error)
      alert('Gagal mengekspor data. Silakan coba lagi.')
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content card" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Ekspor Data Membaca</h3>
          <button className="btn btn-secondary btn-small" onClick={onClose}>
            Tutup
          </button>
        </div>

        <div className="modal-body">
          {exportSuccess ? (
            <div className="success-message">
              <div className="success-icon">✅</div>
              <h4>Ekspor Berhasil!</h4>
              <p>File Anda sudah diunduh.</p>
            </div>
          ) : (
            <>
              <p>Ekspor highlight, catatan, dan bookmark Anda untuk buku "{bookTitle}"</p>

              <div className="export-options">
                <div className="form-group">
                  <label>Pilih Format:</label>
                  {formats.map(format => (
                    <div key={format.value} className="format-option">
                      <label className="radio-label">
                        <input
                          type="radio"
                          name="format"
                          value={format.value}
                          checked={exportFormat === format.value}
                          onChange={(e) => setExportFormat(e.target.value)}
                        />
                        <div className="format-info">
                          <span className="format-name">{format.label}</span>
                          <small className="format-desc">{format.description}</small>
                        </div>
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <button
                className="btn btn-primary"
                onClick={handleExport}
                disabled={isExporting}
                style={{ width: '100%', marginTop: '1rem' }}
              >
                {isExporting ? 'Mengekspor...' : `Ekspor sebagai ${exportFormat}`}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default BookExportModal