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
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>📚</div>
          <p>Memuat detail ebook...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="error" style={{ textAlign: 'center', padding: '3rem' }}>
        <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>❌</div>
        <h3>Terjadi Kesalahan</h3>
        <p>{error}</p>
        <button
          className="btn btn-primary mt-2"
          onClick={() => navigate('/books')}
        >
          Kembali
        </button>
      </div>
    )
  }

  if (!book) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem' }}>
        <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>📖</div>
        <h3>Ebook Tidak Ditemukan</h3>
        <p>Ebook yang Anda cari tidak tersedia.</p>
        <button
          className="btn btn-primary mt-2"
          onClick={() => navigate('/books')}
        >
          Kembali
        </button>
      </div>
    )
  }

  return (
    <div>
      <BookDetail book={book} />
    </div>
  )
}

export default BookDetailPage