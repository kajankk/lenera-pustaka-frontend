import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { bookService } from '../services/bookService'
import EpubReader from '../components/Reader/EpubReader'

const ReaderPage = () => {
  const { slug } = useParams()
  const navigate = useNavigate()
  const [bookData, setBookData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!slug) return
    const loadBook = async () => {
      setLoading(true)
      try {
        const response = await bookService.startReading(slug)
        setBookData(response.data)
      } catch (error) {
        setError('Gagal memuat ebook. Pastikan format file adalah EPUB.')
        console.error('Error loading book:', error)
      } finally {
        setLoading(false)
      }
    }
    loadBook()
  }, [slug])

  const handleBackToDetail = () => {
    navigate(`/books/${slug}`)
  }

  const BackButton = () => (
    <button className="btn btn-secondary" onClick={handleBackToDetail}>
      ← Kembali ke Detail Buku
    </button>
  )

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
      <button
        className="nav-link breadcrumb-item"
        onClick={handleBackToDetail}
        type="button"
        style={{ background: 'none', border: 'none' }}
      >
        {bookData?.title || 'Detail Buku'}
      </button>
      <span className="breadcrumb-separator">›</span>
      <span className="breadcrumb-current">Baca Buku</span>
    </nav>
  )

  if (loading) {
    return (
      <div className="container">
        <div className="loading">
          <div className="loading-spinner"></div>
          <p>Memuat ebook...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container">
        <Breadcrumb />
        <div className="reader-error">
          <div className="error">{error}</div>
          <BackButton />
        </div>
      </div>
    )
  }

  if (!bookData) {
    return (
      <div className="container">
        <Breadcrumb />
        <div className="reader-error">
          <div className="error">Ebook tidak ditemukan</div>
          <BackButton />
        </div>
      </div>
    )
  }

  return (
    <div className="container">
      <Breadcrumb />
      <div className="reader-page">
        <button
          className="btn btn-secondary back-button"
          onClick={handleBackToDetail}
          style={{ marginBottom: '1rem' }}
        >
          ← Kembali ke Detail Buku
        </button>
        <EpubReader bookData={bookData} />
      </div>
    </div>
  )
}

export default ReaderPage