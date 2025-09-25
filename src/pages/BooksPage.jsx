import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { bookService } from '../services/bookService'
import BookCard from '../components/Books/BookCard'
import SearchForm from '../components/Books/SearchForm'

const BooksPage = () => {
  const [books, setBooks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [searchParams, setSearchParams] = useState({})
  const [totalPages, setTotalPages] = useState(1)
  const navigate = useNavigate()

  const ITEMS_PER_PAGE = 12

  const fetchBooks = async (page = currentPage, search = searchParams) => {
    setLoading(true)
    setError('')
    try {
      const response = await bookService.getBooks({ page, limit: ITEMS_PER_PAGE, ...search })
      const booksData = Array.isArray(response.data?.list) ? response.data.list : []

      // Hitung total pages berdasarkan data yang ada
      if (booksData.length < ITEMS_PER_PAGE && page === 1) {
        setTotalPages(1) // Jika data kurang dari limit di halaman 1
      } else if (booksData.length < ITEMS_PER_PAGE) {
        setTotalPages(page) // Halaman terakhir
      } else {
        setTotalPages(page + 1) // Masih ada halaman selanjutnya
      }

      setBooks(booksData)
    } catch (error) {
      console.error('Error fetching books:', error)
      setError('Gagal memuat ebook. Silakan coba lagi.')
      setBooks([])
      setTotalPages(1)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchBooks() }, [currentPage])

  const handleSearch = (params) => {
    setSearchParams(params)
    setCurrentPage(1)
    fetchBooks(1, params)
  }

  const handleBookClick = (book) => {
    navigate(`/books/${book.slug}`)
  }

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const getPageNumbers = () => {
    const pages = []
    const maxDisplay = 5

    if (totalPages <= maxDisplay) {
      for (let i = 1; i <= totalPages; i++) pages.push(i)
    } else {
      pages.push(1)
      if (currentPage > 3) pages.push('...')

      const start = Math.max(2, currentPage - 1)
      const end = Math.min(totalPages - 1, currentPage + 1)

      for (let i = start; i <= end; i++) {
        if (!pages.includes(i)) pages.push(i)
      }

      if (currentPage < totalPages - 2) pages.push('...')
      if (totalPages > 1 && !pages.includes(totalPages)) pages.push(totalPages)
    }
    return pages
  }

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
      <span className="breadcrumb-current">Perpustakaan</span>
    </nav>
  )

  return (
    <div className="container">
      <Breadcrumb />

      <SearchForm onSearch={handleSearch} />

      {error && (
        <div className="error">
          <p>{error}</p>
          <button className="btn btn-primary" onClick={() => fetchBooks()}>
            Coba Lagi
          </button>
        </div>
      )}

      {loading ? (
        <div className="loading">
          <div className="loading-spinner"></div>
          <p>Memuat ebook...</p>
        </div>
      ) : books.length === 0 ? (
        <div className="card text-center">
          <p>{Object.keys(searchParams).length > 0
            ? 'Tidak ada ebook yang sesuai dengan pencarian.'
            : 'Belum ada ebook yang tersedia.'}</p>
        </div>
      ) : (
        <>
          <div className="text-center" style={{ marginBottom: '1rem', fontSize: '0.9rem', opacity: '0.8' }}>
            Halaman {currentPage} dari {totalPages} - Menampilkan {books.length} ebook
          </div>

          <div className="books-grid">
            {books.map((book) => (
              <BookCard key={book.id || book.slug} book={book} onClick={() => handleBookClick(book)} />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="pagination">
              <button
                className="btn btn-secondary"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                Sebelumnya
              </button>

              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                {getPageNumbers().map((page, index) =>
                  page === '...' ? (
                    <span key={`ellipsis-${index}`} style={{ padding: '0 0.5rem' }}>...</span>
                  ) : (
                    <button
                      key={page}
                      className={`btn ${currentPage === page ? 'btn-primary' : 'btn-secondary'}`}
                      onClick={() => handlePageChange(page)}
                      style={{ minWidth: '40px', fontSize: '0.9rem' }}
                    >
                      {page}
                    </button>
                  )
                )}
              </div>

              <button
                className="btn btn-secondary"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage >= totalPages}
              >
                Selanjutnya
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default BooksPage