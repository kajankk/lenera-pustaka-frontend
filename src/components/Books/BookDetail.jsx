import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { bookService } from '../../services/bookService'
import { useTheme } from '../../hooks/useTheme'

const BookDetail = ({ book }) => {
  const navigate = useNavigate()
  const { theme } = useTheme()
  const [isDownloading, setIsDownloading] = useState(false)

  const handleStartReading = () => navigate(`/${book.slug}/read`)

  const handleDownload = async () => {
    if (isDownloading) return

    setIsDownloading(true)
    try {
      // Generate filename dengan format yang lebih baik
      const sanitizedTitle = book.title.replace(/[^a-zA-Z0-9\s-]/g, '').replace(/\s+/g, '_')
      const filename = `${sanitizedTitle}.epub`

      await bookService.downloadBook(book.slug, filename)

      // Show success message
      alert('Buku berhasil diunduh!')

    } catch (error) {
      console.error('Error downloading book:', error)
      alert(error.message || 'Gagal mengunduh ebook. Silakan coba lagi.')
    } finally {
      setIsDownloading(false)
    }
  }

  const formatFileSize = (bytes) => bytes ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : 'N/A'

  const formatReadingTime = (minutes) => {
    if (!minutes) return 'N/A'
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return hours > 0 ? `${hours} jam ${mins > 0 ? `${mins} menit` : ''}` : `${minutes} menit`
  }

  const getDifficultyLabel = (level) => {
    if (!level) return 'N/A'
    const labels = ['Mudah', 'Sedang', 'Sulit', 'Sangat Sulit']
    const index = level <= 3 ? 0 : level <= 6 ? 1 : level <= 8 ? 2 : 3
    return `${labels[index]} (${level}/10)`
  }

  const formatNumber = (num) => num?.toLocaleString('id-ID') || '0'

  return (
    <div className="book-detail-container">
      <button className="btn btn-secondary" onClick={() => navigate('/books')}>
        ← Kembali
      </button>

      <div className="book-detail-main">
        {/* Cover Section */}
        <div className="book-cover-section">
          <div className="book-cover-wrapper">
            {book.coverImageUrl ? (
              <img
                src={book.coverImageUrl}
                alt={`Cover ${book.title}`}
                className="book-cover-image"
                loading="lazy"
              />
            ) : (
              <div className="book-cover-placeholder">
                <div className="placeholder-icon">📚</div>
                <div className="placeholder-text">Cover EPUB</div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="book-actions">
            <button className="btn btn-primary btn-action" onClick={handleStartReading}>
              <span>📖</span>
              <span>Mulai Membaca</span>
            </button>
            <button
              className="btn btn-secondary btn-action"
              onClick={handleDownload}
              disabled={isDownloading}
            >
              <span>{isDownloading ? '⏳' : '💾'}</span>
              <span>{isDownloading ? 'Mengunduh...' : 'Unduh EPUB'}</span>
            </button>
          </div>

          {/* Quick Stats */}
          <div className="book-quick-stats">
            <div className="stat-item">
              <div className="stat-label">Dilihat</div>
              <div className="stat-value">{formatNumber(book.viewCount)}</div>
            </div>
            <div className="stat-item">
              <div className="stat-label">Diunduh</div>
              <div className="stat-value">{formatNumber(book.downloadCount)}</div>
            </div>
            <div className="stat-item">
              <div className="stat-label">Rating</div>
              <div className="stat-value">
                {book.averageRating ? `${book.averageRating.toFixed(1)}/5` : 'N/A'}
              </div>
            </div>
          </div>
        </div>

        {/* Info Section */}
        <div className="book-info-section">
          <div className="book-header">
            <h1 className="book-title" style={{ color: theme === 'dark' ? 'var(--primary-pink)' : 'var(--primary-green)' }}>
              {book.title}
            </h1>

            {/* Authors */}
            {book.authors?.length > 0 && (
              <div className="book-authors">
                <span>oleh </span>
                {book.authors.map((author, index) => (
                  <span key={author.id} className="author-name">
                    {author.name}
                    {index < book.authors.length - 1 && ', '}
                  </span>
                ))}
              </div>
            )}

            {/* Genres */}
            {book.genres?.length > 0 && (
              <div className="book-genres">
                {book.genres.map(genre => (
                  <span key={genre.id} className="genre-tag" style={{ backgroundColor: genre.colorHex + '20', color: genre.colorHex }}>
                    {genre.name}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Description */}
          {book.description && (
            <div className="book-description">
              <h3>Deskripsi</h3>
              <p>{book.description}</p>
            </div>
          )}

          {/* Metadata */}
          <div className="book-metadata">
            <h3>Informasi Buku</h3>
            <div className="metadata-grid">
              {/* Basic Info */}
              <div className="metadata-section">
                <h4>Informasi Dasar</h4>
                <div className="metadata-items">
                  {[
                    { label: 'Penerbit', value: book.publisher },
                    { label: 'Tahun Terbit', value: book.publicationYear },
                    { label: 'ISBN', value: book.isbn },
                    { label: 'Bahasa', value: book.language },
                    { label: 'Kategori', value: book.category },
                    { label: 'Status Hak Cipta', value: book.copyrightStatus }
                  ].filter(item => item.value).map(item => (
                    <div key={item.label} className="metadata-item">
                      <span className="meta-label">{item.label}:</span>
                      <span className="meta-value">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Reading Info */}
              <div className="metadata-section">
                <h4>Informasi Membaca</h4>
                <div className="metadata-items">
                  {book.totalPages > 0 && (
                    <div className="metadata-item">
                      <span className="meta-label">Jumlah Halaman:</span>
                      <span className="meta-value">{formatNumber(book.totalPages)}</span>
                    </div>
                  )}
                  {book.totalWord > 0 && (
                    <div className="metadata-item">
                      <span className="meta-label">Jumlah Kata:</span>
                      <span className="meta-value">{formatNumber(book.totalWord)}</span>
                    </div>
                  )}
                  <div className="metadata-item">
                    <span className="meta-label">Estimasi Waktu Baca:</span>
                    <span className="meta-value">{formatReadingTime(book.estimatedReadTime)}</span>
                  </div>
                  <div className="metadata-item">
                    <span className="meta-label">Level Kesulitan:</span>
                    <span className="meta-value">{getDifficultyLabel(book.difficultyLevel)}</span>
                  </div>
                  <div className="metadata-item">
                    <span className="meta-label">Format File:</span>
                    <span className="meta-value">{book.fileFormat?.toUpperCase() || 'EPUB'}</span>
                  </div>
                  <div className="metadata-item">
                    <span className="meta-label">Ukuran File:</span>
                    <span className="meta-value">{formatFileSize(book.fileSize)}</span>
                  </div>
                </div>
              </div>

              {/* Tags */}
              {book.tags?.length > 0 && (
                <div className="metadata-section tags-section">
                  <h4>Tag</h4>
                  <div className="tags-container">
                    {book.tags.map(tag => (
                      <span key={tag.id} className="tag-item">
                        #{tag.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Reviews */}
              {(book.totalReviews > 0 || book.averageRating > 0) && (
                <div className="metadata-section">
                  <h4>Ulasan</h4>
                  <div className="metadata-items">
                    <div className="metadata-item">
                      <span className="meta-label">Rating Rata-rata:</span>
                      <span className="meta-value">{book.averageRating.toFixed(1)}/5 ⭐</span>
                    </div>
                    <div className="metadata-item">
                      <span className="meta-label">Jumlah Ulasan:</span>
                      <span className="meta-value">{formatNumber(book.totalReviews)}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default BookDetail