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
  const [hasNextPage, setHasNextPage] = useState(false)
  const [knownPages, setKnownPages] = useState(new Set([1]))
  const navigate = useNavigate()

  const ITEMS_PER_PAGE = 12

  const fetchBooks = async (page = currentPage, search = searchParams) => {
    setLoading(true)
    setError('')

    try {
      const response = await bookService.getBooks({
        page,
        limit: ITEMS_PER_PAGE,
        ...search
      })

      const booksData = Array.isArray(response.data?.list) ? response.data.list : []
      setBooks(booksData)
      setHasNextPage(booksData.length === ITEMS_PER_PAGE)

      setKnownPages(prev => {
        const newSet = new Set(prev)
        newSet.add(page)
        if (booksData.length === ITEMS_PER_PAGE) {
          newSet.add(page + 1)
        }
        return newSet
      })

    } catch (error) {
      console.error('Error fetching books:', error)
      setError('Gagal memuat ebook. Silakan coba lagi.')
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
        limit: ITEMS_PER_PAGE,
        ...searchParams
      })
      return Array.isArray(response.data?.list) && response.data.list.length > 0
    } catch {
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
        <div className="error">
          <p>{error}</p>
          <button className="btn btn-primary" onClick={() => fetchBooks()}>
            Coba Lagi
          </button>
        </div>
      )}

      {loading ? (
        <div className="loading">Memuat ebook...</div>
      ) : books.length === 0 ? (
        <div className="card text-center">
          <p>
            {Object.keys(searchParams).length > 0
              ? 'Tidak ada ebook yang sesuai dengan pencarian.'
              : 'Belum ada ebook yang tersedia.'}
          </p>
        </div>
      ) : (
        <>
          <div className="text-center" style={{ marginBottom: '1rem', fontSize: '0.9rem', opacity: '0.8' }}>
            Halaman {currentPage} - Menampilkan {books.length} ebook
          </div>

          <div className="books-grid">
            {books.map((book) => (
              <BookCard
                key={book.id || book.slug}
                book={book}
                onClick={() => handleBookClick(book)}
              />
            ))}
          </div>

          {/* Pagination */}
          <div className="pagination">
            <button
              className="btn btn-secondary"
              onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
            >
              Sebelumnya
            </button>

            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
              {getPageNumbers().map((page, index) => (
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
              ))}
            </div>

            <button
              className="btn btn-secondary"
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