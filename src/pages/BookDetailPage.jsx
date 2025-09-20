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
    const fetchBookDetail = async () => {
      if (!slug) {
        setError('Slug ebook tidak ditemukan')
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError('')

        const response = await bookService.getBookDetail(slug)

        // Handle different response structures
        let bookData = null
        if (response && response.result === 'Success' && response.data) {
          bookData = response.data
        } else if (response && response.data) {
          bookData = response.data
        } else if (response) {
          bookData = response
        }

        if (bookData) {
          // Ensure required fields have defaults
          const processedBook = {
            ...bookData,
            viewCount: bookData.viewCount || 0,
            downloadCount: bookData.downloadCount || 0,
            averageRating: bookData.averageRating || 0,
            authors: bookData.authors || [],
            genres: bookData.genres || [],
            totalPages: bookData.totalPages || 0,
            totalWord: bookData.totalWord || 0
          }
          setBook(processedBook)
        } else {
          setError('Ebook tidak ditemukan')
        }
      } catch (err) {
        console.error('Error fetching book detail:', err)

        if (err.response?.status === 404) {
          setError('Ebook tidak ditemukan')
        } else if (err.response?.status === 403) {
          setError('Anda tidak memiliki akses ke ebook ini')
        } else if (err.response?.status >= 500) {
          setError('Terjadi kesalahan pada server. Silakan coba lagi nanti.')
        } else if (err.code === 'NETWORK_ERROR' || !err.response) {
          setError('Tidak dapat terhubung ke server. Periksa koneksi internet Anda.')
        } else {
          setError(err.message || 'Gagal memuat detail ebook')
        }
      } finally {
        setLoading(false)
      }
    }

    fetchBookDetail()
  }, [slug])

  const handleRetry = () => {
    setError('')
    window.location.reload()
  }

  if (loading) {
    return (
      <div className="loading">
        <div className="loading-spinner">
          <div className="spinner"></div>
        </div>
        <div className="loading-icon">📚</div>
        <p>Memuat detail ebook...</p>
      </div>
    )
  }

  if (error || !book) {
    return (
      <div className="error-page">
        <div className="error-icon">{error ? '❌' : '📖'}</div>
        <h3>{error ? 'Terjadi Kesalahan' : 'Ebook Tidak Ditemukan'}</h3>
        <p>{error || 'Ebook yang Anda cari tidak tersedia.'}</p>
        <div className="error-actions">
          <button className="btn btn-primary" onClick={() => navigate('/books')}>
            Kembali ke Daftar Buku
          </button>
          {error && (
            <button className="btn btn-secondary" onClick={handleRetry}>
              Coba Lagi
            </button>
          )}
        </div>
      </div>
    )
  }

  return <BookDetail book={book} />
}

export default BookDetailPage