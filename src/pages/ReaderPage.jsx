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
    const loadBook = async () => {
      if (!slug) return

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

  if (loading) return <div className="loading">Memuat ebook...</div>

  if (error) {
    return (
      <div className="reader-error">
        <div className="error">{error}</div>
        <button className="btn btn-secondary" onClick={() => navigate('/books')}>
          ← Kembali
        </button>
      </div>
    )
  }

  if (!bookData) {
    return (
      <div className="reader-error">
        <div className="error">Ebook tidak ditemukan</div>
        <button className="btn btn-secondary" onClick={() => navigate('/books')}>
          ← Kembali
        </button>
      </div>
    )
  }

  return (
    <div className="reader-page">
      <button className="btn btn-secondary back-button" onClick={() => navigate('/books')}>
        ← Kembali
      </button>
      <EpubReader bookData={bookData} />
    </div>
  )
}

export default ReaderPage