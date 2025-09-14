import React from 'react'
import { useNavigate } from 'react-router-dom'
import { bookService } from '../../services/bookService'
import { useTheme } from '../../hooks/useTheme'

const BookDetail = ({ book }) => {
  const navigate = useNavigate()
  const { theme } = useTheme()

  const handleStartReading = () => {
    navigate(`/reader/${book.slug}`)
  }

  const handleDownload = async () => {
    try {
      await bookService.downloadBook(book.id, `${book.title}.epub`)
    } catch (error) {
      console.error('Error downloading book:', error)
      alert('Gagal mengunduh ebook')
    }
  }

  const handleBack = () => {
    navigate('/books')
  }

  const formatFileSize = (bytes) => {
    if (!bytes) return 'N/A'
    const mb = bytes / 1024 / 1024
    return `${mb.toFixed(1)} MB`
  }

  const formatReadingTime = (minutes) => {
    if (!minutes) return 'N/A'
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours > 0) {
      return `${hours} jam ${mins > 0 ? `${mins} menit` : ''}`
    }
    return `${minutes} menit`
  }

  const getDifficultyLabel = (level) => {
    if (!level) return 'N/A'
    if (level <= 3) return `Mudah (${level}/10)`
    if (level <= 6) return `Sedang (${level}/10)`
    if (level <= 8) return `Sulit (${level}/10)`
    return `Sangat Sulit (${level}/10)`
  }

  const formatNumber = (num) => {
    if (!num) return '0'
    return num.toLocaleString('id-ID')
  }

  return (
    <div className="book-detail-container">
      {/* Navigation */}
      <div className="book-detail-navigation">
        <button className="btn btn-secondary" onClick={handleBack}>
          ← Kembali ke Koleksi
        </button>
      </div>

      {/* Main Content */}
      <div className="book-detail-main">
        {/* Book Cover Section */}
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

          {/* Action Buttons */}
          <div className="book-actions">
            <button className="btn btn-primary btn-action" onClick={handleStartReading}>
              <span className="btn-icon">📖</span>
              <span>Mulai Membaca</span>
            </button>
            <button className="btn btn-secondary btn-action" onClick={handleDownload}>
              <span className="btn-icon">💾</span>
              <span>Unduh EPUB</span>
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

        {/* Book Information Section */}
        <div className="book-info-section">
          <div className="book-header">
            <h1 className="book-title" style={{
              color: theme === 'dark' ? 'var(--primary-pink)' : 'var(--primary-green)'
            }}>
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
                  <span
                    key={genre.id}
                    className="genre-tag"
                    style={{ backgroundColor: genre.colorHex + '20', color: genre.colorHex }}
                  >
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

          {/* Metadata Grid */}
          <div className="book-metadata">
            <h3>Informasi Buku</h3>
            <div className="metadata-grid">
              {/* Basic Info */}
              <div className="metadata-section">
                <h4>Informasi Dasar</h4>
                <div className="metadata-items">
                  {book.publisher && (
                    <div className="metadata-item">
                      <span className="meta-label">Penerbit:</span>
                      <span className="meta-value">{book.publisher}</span>
                    </div>
                  )}
                  {book.publicationYear && (
                    <div className="metadata-item">
                      <span className="meta-label">Tahun Terbit:</span>
                      <span className="meta-value">{book.publicationYear}</span>
                    </div>
                  )}
                  {book.isbn && (
                    <div className="metadata-item">
                      <span className="meta-label">ISBN:</span>
                      <span className="meta-value">{book.isbn}</span>
                    </div>
                  )}
                  {book.language && (
                    <div className="metadata-item">
                      <span className="meta-label">Bahasa:</span>
                      <span className="meta-value">{book.language}</span>
                    </div>
                  )}
                  {book.category && (
                    <div className="metadata-item">
                      <span className="meta-label">Kategori:</span>
                      <span className="meta-value">{book.category}</span>
                    </div>
                  )}
                  {book.copyrightStatus && (
                    <div className="metadata-item">
                      <span className="meta-label">Status Hak Cipta:</span>
                      <span className="meta-value">{book.copyrightStatus}</span>
                    </div>
                  )}
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
                  {book.estimatedReadTime && (
                    <div className="metadata-item">
                      <span className="meta-label">Estimasi Waktu Baca:</span>
                      <span className="meta-value">{formatReadingTime(book.estimatedReadTime)}</span>
                    </div>
                  )}
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

              {/* Reviews Summary */}
              {(book.totalReviews > 0 || book.averageRating > 0) && (
                <div className="metadata-section">
                  <h4>Ulasan</h4>
                  <div className="metadata-items">
                    <div className="metadata-item">
                      <span className="meta-label">Rating Rata-rata:</span>
                      <span className="meta-value">
                        {book.averageRating.toFixed(1)}/5 ⭐
                      </span>
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