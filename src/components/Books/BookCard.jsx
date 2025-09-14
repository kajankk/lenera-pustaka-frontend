import React from 'react'

const BookCard = ({ book, onClick }) => {
  const handleError = (e) => {
    e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjMyMCIgdmlld0JveD0iMCAwIDIwMCAzMjAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMzIwIiBmaWxsPSIjRjNGNEY2IiBzdHJva2U9IiNEMUQ1REIiIHN0cm9rZS13aWR0aD0iMiIvPgo8cGF0aCBkPSJNNzAgMTQwSDEzMFYxNzBINzBWMTQwWiIgZmlsbD0iIzlDQTNBRiIvPgo8cGF0aCBkPSJNODAgMTgwSDEyMFYxOTBIODBWMTgwWiIgZmlsbD0iIzlDQTNBRiIvPgo8dGV4dCB4PSIxMDAiIHk9IjIyMCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0iIzZCNzM4MCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE0Ij5ObyBDb3ZlcjwvdGV4dD4KPHN2Zz4K'
  }

  return (
    <div className="book-card" onClick={onClick}>
      {book.coverImageUrl ? (
        <img
          src={book.coverImageUrl}
          alt={book.title}
          className="book-cover-image"
          loading="lazy"
          onError={handleError}
        />
      ) : (
        <div className="book-cover-placeholder">
          <div className="placeholder-icon">📚</div>
          <span className="placeholder-text">No Cover</span>
        </div>
      )}
    </div>
  )
}

export default BookCard