import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { bookService } from '../services/bookService'
import BookDetail from '../components/Books/BookDetail'

const BookDetailPage = () => {
  const { slug } = useParams()
  const navigate = useNavigate()
  const [book, setBook] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!slug) { setError('Slug ebook tidak ditemukan'); setLoading(false); return }

    const fetchBookDetail = async () => {
      try {
        setLoading(true); setError('')
        const response = await bookService.getBookDetail(slug)
        const bookData = response?.result === 'Success' ? response.data : (response?.data || response)

        if (bookData) {
          setBook({ ...bookData, viewCount: bookData.viewCount || 0, downloadCount: bookData.downloadCount || 0, averageRating: bookData.averageRating || 0, authors: bookData.authors || [], genres: bookData.genres || [], totalPages: bookData.totalPages || 0, totalWord: bookData.totalWord || 0 })
        } else {
          setError('Ebook tidak ditemukan')
        }
      } catch (err) {
        console.error('Error fetching book detail:', err)
        const status = err.response?.status
        setError(status === 404 ? 'Ebook tidak ditemukan' : status === 403 ? 'Anda tidak memiliki akses ke ebook ini' : status >= 500 ? 'Terjadi kesalahan pada server. Silakan coba lagi nanti.' : err.code === 'NETWORK_ERROR' || !err.response ? 'Tidak dapat terhubung ke server. Periksa koneksi internet Anda.' : err.message || 'Gagal memuat detail ebook')
      } finally {
        setLoading(false)
      }
    }
    fetchBookDetail()
  }, [slug])

  const Breadcrumb = () => (
    <nav className="breadcrumb" aria-label="breadcrumb">
      <button
        className="nav-link breadcrumb-item"
        onClick={() => navigate('/')}
        type="button"
        style={{ background: 'none', border: 'none' }}
      >
        Beranda
      </button>
      <span className="breadcrumb-separator">›</span>
      <button
        className="nav-link breadcrumb-item"
        onClick={() => navigate('/books')}
        type="button"
        style={{ background: 'none', border: 'none' }}
      >
        Perpustakaan
      </button>
      <span className="breadcrumb-separator">›</span>
      <span className="breadcrumb-current">
        {book?.title || 'Detail Buku'}
      </span>
    </nav>
  )

  const ErrorPage = () => (
    <div className="container">
      <Breadcrumb />
      <div className="error-page">
        <div className="error-icon">{error ? '❌' : '📖'}</div>
        <h3>{error ? 'Terjadi Kesalahan' : 'Ebook Tidak Ditemukan'}</h3>
        <p>{error || 'Ebook yang Anda cari tidak tersedia.'}</p>
        <div className="error-actions">
          <button className="btn btn-primary" onClick={() => navigate('/books')}>Kembali ke Daftar Buku</button>
          {error && <button className="btn btn-secondary" onClick={() => window.location.reload()}>Coba Lagi</button>}
        </div>
      </div>
    </div>
  )

  if (loading) {
    return (
      <div className="container">
        <nav className="breadcrumb" aria-label="breadcrumb">
          <button
            className="nav-link breadcrumb-item"
            onClick={() => navigate('/')}
            type="button"
            style={{ background: 'none', border: 'none' }}
          >
            Beranda
          </button>
          <span className="breadcrumb-separator">›</span>
          <button
            className="nav-link breadcrumb-item"
            onClick={() => navigate('/books')}
            type="button"
            style={{ background: 'none', border: 'none' }}
          >
            Perpustakaan
          </button>
          <span className="breadcrumb-separator">›</span>
          <span className="breadcrumb-current">Memuat...</span>
        </nav>
        <div className="loading">
          <div className="loading-spinner">
            <div className="spinner"></div>
          </div>
          <div className="loading-icon">📚</div>
          <p>Memuat detail ebook...</p>
        </div>
      </div>
    )
  }

  if (error || !book) return <ErrorPage />

  return (
    <div className="container">
      <Breadcrumb />
      <BookDetail book={book} />
    </div>
  )
}

export default BookDetailPage