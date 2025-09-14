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
      }
      setLoading(false)
    }

    loadBook()
  }, [slug])

  const handleBackToBooks = () => {
    navigate('/books')
  }

  if (loading) return <div className="loading">Memuat ebook...</div>

  if (error) return (
    <div>
      <div className="error">{error}</div>
      <button className="btn btn-secondary" onClick={handleBackToBooks}>
        ← Kembali
      </button>
    </div>
  )

  if (!bookData) return <div className="error">Ebook tidak ditemukan</div>

  return (
    <div>
      <button className="btn btn-secondary mb-2" onClick={handleBackToBooks}>
        ← Kembali
      </button>
      <EpubReader bookData={bookData} />
    </div>
  )
}

export default ReaderPage