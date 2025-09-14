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
  const [currentLimit, setCurrentLimit] = useState(12) // Perfect for 4x3 grid
  const [hasNextPage, setHasNextPage] = useState(false)
  const [knownPages, setKnownPages] = useState(new Set([1]))
  const navigate = useNavigate()

  const fetchBooks = async (page = currentPage, search = searchParams) => {
    setLoading(true)
    setError('')

    try {
      const response = await bookService.getBooks({
        page,
        limit: 12, // Force limit to 12 for 4x3 layout
        ...search
      })

      const booksData = Array.isArray(response.data?.list) ? response.data.list : []
      const limit = response.data?.limit || 12

      setBooks(booksData)
      setCurrentLimit(limit)

      // Deteksi apakah ada halaman selanjutnya
      const hasNext = booksData.length === 12
      setHasNextPage(hasNext)

      // Update known pages
      setKnownPages(prev => {
        const newSet = new Set(prev)
        newSet.add(page)
        if (hasNext) {
          newSet.add(page + 1)
        }
        return newSet
      })

    } catch (error) {
      console.error('Error fetching books:', error)
      setError('Gagal memuat. Silakan coba lagi.')
      setBooks([])
      setHasNextPage(false)
    } finally {
      setLoading(false)
    }
  }

  const checkNextPageExists = async (page) => {
    try {
      const response = await bookService.getBooks({
        page,
        limit: 12,
        ...searchParams
      })
      const booksData = Array.isArray(response.data?.list) ? response.data.list : []
      return booksData.length > 0
    } catch (error) {
      return false
    }
  }

  useEffect(() => {
    fetchBooks()
  }, [currentPage])

  const handleSearch = (params) => {
    setSearchParams(params)
    setCurrentPage(1)
    setKnownPages(new Set([1]))
    fetchBooks(1, params)
  }

  const handleBookClick = (book) => {
    navigate(`/books/${book.slug}`)
  }

  const handlePageChange = async (newPage) => {
    if (newPage > currentPage && !knownPages.has(newPage)) {
      const pageExists = await checkNextPageExists(newPage)
      if (!pageExists) {
        setHasNextPage(false)
        return
      }
    }

    setCurrentPage(newPage)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleRetry = () => {
    fetchBooks()
  }

  const booksArray = Array.isArray(books) ? books : []

  const getPageNumbers = () => {
    const pages = []
    const maxVisiblePages = 5

    let estimatedMaxPage = Math.max(...Array.from(knownPages))
    if (hasNextPage) {
      estimatedMaxPage = Math.max(estimatedMaxPage, currentPage + 1)
    }

    if (estimatedMaxPage <= maxVisiblePages) {
      for (let i = 1; i <= estimatedMaxPage; i++) {
        pages.push(i)
      }
    } else {
      pages.push(1)

      if (currentPage > 3) {
        pages.push('...')
      }

      const start = Math.max(2, currentPage - 1)
      const end = Math.min(estimatedMaxPage - 1, currentPage + 1)

      for (let i = start; i <= end; i++) {
        if (!pages.includes(i)) {
          pages.push(i)
        }
      }

      if (currentPage < estimatedMaxPage - 2) {
        pages.push('...')
      }

      if (!pages.includes(estimatedMaxPage)) {
        pages.push(estimatedMaxPage)
      }
    }

    return pages
  }

  return (
    <div>
      <SearchForm onSearch={handleSearch} />

      {error && (
        <div className="card bg-red-50 border-red-200 text-red-700 mb-4">
          <div className="p-4">
            <p className="mb-2">{error}</p>
            <button
              onClick={handleRetry}
              className="btn btn-primary"
              style={{ backgroundColor: 'var(--primary-green)' }}
            >
              Coba Lagi
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="loading text-center py-8">
          <p>Memuat...</p>
        </div>
      ) : booksArray.length === 0 ? (
        <div className="card text-center py-8">
          <p>
            {searchParams && Object.keys(searchParams).length > 0
              ? 'Tidak ada ebook yang sesuai dengan pencarian.'
              : 'Belum ada ebook yang tersedia.'
            }
          </p>
        </div>
      ) : (
        <>
          {/* Info halaman - Cover Grid Layout */}
          <div style={{
            textAlign: 'center',
            marginBottom: '1rem',
            fontSize: '0.9rem',
            opacity: '0.8'
          }}>
            Halaman {currentPage} - Menampilkan {booksArray.length} ebook
            {booksArray.length === 12 && (
              <span style={{ fontSize: '0.8rem', opacity: '0.6', display: 'block' }}>
                Grid 4 × 3
              </span>
            )}
          </div>

          {/* Books Grid - Cover Only */}
          <div className="books-grid">
            {booksArray.map((book) => (
              <BookCard
                key={book.id || book.slug}
                book={book}
                onClick={() => handleBookClick(book)}
              />
            ))}
          </div>

          {/* Pagination */}
          <div className="pagination flex items-center justify-center gap-4 mt-6">
            <button
              className="btn btn-secondary px-4 py-2 rounded disabled:opacity-50"
              onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
            >
              Sebelumnya
            </button>

            <div style={{
              display: 'flex',
              gap: '0.5rem',
              alignItems: 'center',
              flexWrap: 'wrap'
            }}>
              {getPageNumbers().map((page, index) => (
                page === '...' ? (
                  <span key={`ellipsis-${index}`} style={{ padding: '0 0.5rem' }}>...</span>
                ) : (
                  <button
                    key={page}
                    className={`btn ${currentPage === page ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => handlePageChange(page)}
                    style={{
                      minWidth: '40px',
                      padding: '0.5rem',
                      fontSize: '0.9rem'
                    }}
                  >
                    {page}
                  </button>
                )
              ))}
            </div>

            <button
              className="btn btn-secondary px-4 py-2 rounded disabled:opacity-50"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={!hasNextPage}
            >
              Selanjutnya
            </button>
          </div>
        </>
      )}
    </div>
  )
}

export default BooksPage