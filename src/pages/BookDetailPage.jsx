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
        const response = await bookService.getBookDetail(slug)
        if (response.result === 'Success' && response.data) {
          setBook(response.data)
        } else {
          setError('Ebook tidak ditemukan')
        }
      } catch (err) {
        console.error('Error fetching book detail:', err)
        setError('Gagal memuat detail ebook')
      } finally {
        setLoading(false)
      }
    }

    fetchBookDetail()
  }, [slug])

  if (loading) {
    return (
      <div className="loading">
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
        <button className="btn btn-primary" onClick={() => navigate('/books')}>
          Kembali
        </button>
      </div>
    )
  }

  return <BookDetail book={book} />
}

export default BookDetailPage