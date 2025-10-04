import React, { useEffect, useRef, useState, useCallback } from 'react'
import ePub from 'epubjs'
import { useTheme } from '../../hooks/useTheme'
import { useReaderFeatures } from '../../hooks/useReaderFeatures'

const EpubReader = ({ bookData }) => {
  const { theme } = useTheme()
  const {
    bookmarks,
    addBookmark,
    deleteBookmark,
    loading: featuresLoading,
    error: featuresError,
    isAuthenticated
  } = useReaderFeatures(bookData?.slug)

  const bookRef = useRef(null)
  const readerContainerRef = useRef(null)
  const dropdownRef = useRef(null)
  const dropdownButtonRef = useRef(null)
  const selectionCheckInterval = useRef(null)
  const [isMobile, setIsMobile] = useState(false)

  const [state, setState] = useState({
    book: null,
    rendition: null,
    toc: [],
    fontSize: 14,
    readingMode: 'default',
    isLoading: true,
    progress: 0,
    tocOpen: false,
    currentPage: 1,
    totalPages: 0,
    selectedText: '',
    selectedRange: null,
    showFloatingToolbar: false,
    toolbarPosition: { top: 0, left: 0 },
    activePanel: null,
    currentCfi: null
  })

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const flattenToc = (toc) => {
    const result = []
    const traverse = (items, level = 0) => {
      items.forEach(item => {
        if (item.label && (item.href || item.cfi)) {
          result.push({ label: item.label, href: item.href || item.cfi, level, originalItem: item })
        }
        if (item.subitems?.length) traverse(item.subitems, level + 1)
      })
    }
    traverse(toc)
    return result
  }

  // Enhanced text selection handler that works on both mobile and desktop
  const checkTextSelection = useCallback(() => {
    try {
      // Get selection from iframe content
      const iframe = bookRef.current?.querySelector('iframe')
      if (!iframe || !iframe.contentWindow) return

      const iframeDoc = iframe.contentWindow.document
      const selection = iframeDoc.getSelection()

      if (!selection || selection.rangeCount === 0) {
        setState(prev => ({
          ...prev,
          selectedText: '',
          selectedRange: null,
          showFloatingToolbar: false
        }))
        return
      }

      const selectedText = selection.toString().trim()

      if (selectedText && selectedText.length > 0) {
        // Get position for toolbar
        const range = selection.getRangeAt(0)
        const rect = range.getBoundingClientRect()
        const iframeRect = iframe.getBoundingClientRect()

        // Calculate position relative to viewport
        const top = iframeRect.top + rect.top - 60
        const left = iframeRect.left + rect.left + (rect.width / 2)

        // Try to get CFI range if available
        let cfiRange = null
        if (state.rendition && state.rendition.getRange) {
          try {
            const cfi = state.rendition.getRange(range)
            cfiRange = cfi
          } catch (e) {
            console.warn('Could not get CFI range:', e)
          }
        }

        setState(prev => ({
          ...prev,
          selectedText,
          selectedRange: cfiRange,
          showFloatingToolbar: true,
          toolbarPosition: { top, left }
        }))
      } else {
        setState(prev => ({
          ...prev,
          selectedText: '',
          selectedRange: null,
          showFloatingToolbar: false
        }))
      }
    } catch (error) {
      console.warn('Error checking text selection:', error)
    }
  }, [state.rendition])

  // Monitor text selection continuously
  useEffect(() => {
    if (!state.rendition) return

    // Check selection every 300ms
    selectionCheckInterval.current = setInterval(() => {
      checkTextSelection()
    }, 300)

    // Also check on mouseup/touchend events
    const iframe = bookRef.current?.querySelector('iframe')
    if (iframe && iframe.contentWindow) {
      const iframeDoc = iframe.contentWindow.document

      const handleSelectionChange = () => {
        setTimeout(checkTextSelection, 100)
      }

      iframeDoc.addEventListener('mouseup', handleSelectionChange)
      iframeDoc.addEventListener('touchend', handleSelectionChange)
      iframeDoc.addEventListener('selectionchange', handleSelectionChange)

      return () => {
        if (selectionCheckInterval.current) {
          clearInterval(selectionCheckInterval.current)
        }
        iframeDoc.removeEventListener('mouseup', handleSelectionChange)
        iframeDoc.removeEventListener('touchend', handleSelectionChange)
        iframeDoc.removeEventListener('selectionchange', handleSelectionChange)
      }
    }

    return () => {
      if (selectionCheckInterval.current) {
        clearInterval(selectionCheckInterval.current)
      }
    }
  }, [state.rendition, checkTextSelection])

  // Initialize EPUB
  useEffect(() => {
    if (!bookData?.fileUrl) return

    setState(prev => ({ ...prev, isLoading: true }))
    const epubBook = ePub(bookData.fileUrl)

    const rend = epubBook.renderTo(bookRef.current, {
      width: '100%',
      height: '100%',
      allowScriptedContent: true,
      flow: 'paginated',
      snap: true
    })

    // Base styles with mobile optimization
    rend.themes.default({
      body: {
        'font-family': 'inherit !important',
        'line-height': '1.6 !important',
        'padding': isMobile ? '0.75rem !important' : '1rem !important',
        'margin': '0 !important',
        'box-sizing': 'border-box !important',
        'overflow': 'hidden !important',
        'max-width': '100% !important',
        'user-select': 'text !important',
        '-webkit-user-select': 'text !important',
        '-moz-user-select': 'text !important',
        '-ms-user-select': 'text !important'
      },
      p: {
        'margin': '0 !important',
        'text-align': 'justify !important',
        'user-select': 'text !important'
      },
      a: { 'text-decoration': 'underline !important', 'color': 'inherit !important' },
      '*': {
        'box-sizing': 'border-box !important',
        'user-select': 'text !important'
      }
    })

    rend.themes.fontSize(`${state.fontSize}px`)

    // Display book
    epubBook.ready.then(() => rend.display(bookData.currentPosition || 0))
      .catch(() => setState(prev => ({ ...prev, isLoading: false })))

    // Load TOC
    epubBook.loaded.navigation.then(nav => {
      if (nav.toc && Array.isArray(nav.toc)) {
        setState(prev => ({ ...prev, toc: flattenToc(nav.toc) }))
      }
    }).catch(() => setState(prev => ({ ...prev, toc: [] })))

    // Handle events
    rend.on('relocated', (location) => {
      const spineItem = epubBook.spine.get(location.start.cfi)
      if (spineItem) {
        const newProgress = Math.round((spineItem.index / Math.max(1, epubBook.spine.length - 1)) * 100)
        setState(prev => ({
          ...prev,
          progress: newProgress,
          currentPage: spineItem.index + 1,
          totalPages: epubBook.spine.length,
          currentCfi: location.start.cfi
        }))
      }
    })

    rend.on('rendered', () => {
      setState(prev => ({ ...prev, isLoading: false }))
    })

    setState(prev => ({ ...prev, book: epubBook, rendition: rend }))

    return () => {
      if (selectionCheckInterval.current) {
        clearInterval(selectionCheckInterval.current)
      }
      rend.destroy()
      epubBook.destroy()
    }
  }, [bookData?.fileUrl, isMobile])

  // Update font size
  useEffect(() => {
    if (state.rendition) {
      state.rendition.themes.fontSize(`${state.fontSize}px`)
    }
  }, [state.fontSize, state.rendition])

  // Apply themes
  useEffect(() => {
    if (!state.rendition) return

    const colors = state.readingMode === 'cream'
      ? { color: '#704214', bg: '#f4ecd8', link: '#8B4513' }
      : theme === 'dark'
      ? { color: '#ffffff', bg: '#1a1a1a', link: '#FFD700' }
      : { color: 'inherit', bg: 'inherit', link: '#225330' }

    state.rendition.themes.override('color', colors.color)
    state.rendition.themes.override('background', colors.bg)
    state.rendition.themes.override('a', `color: ${colors.link} !important; text-decoration: underline !important;`)
  }, [theme, state.rendition, state.readingMode])

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target) &&
          !dropdownButtonRef.current?.contains(event.target)) {
        setState(prev => ({ ...prev, tocOpen: false }))
      }
    }
    if (state.tocOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('touchstart', handleClickOutside)
      return () => {
        document.removeEventListener('mousedown', handleClickOutside)
        document.removeEventListener('touchstart', handleClickOutside)
      }
    }
  }, [state.tocOpen])

  // Close panels when clicking outside on mobile
  useEffect(() => {
    if (!isMobile || !state.activePanel) return

    const handleClickOutside = (event) => {
      const panel = document.querySelector('.panel')
      if (panel && !panel.contains(event.target)) {
        const clickedControl = event.target.closest('.feature-controls')
        if (!clickedControl) {
          setState(prev => ({ ...prev, activePanel: null }))
        }
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('touchstart', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('touchstart', handleClickOutside)
    }
  }, [isMobile, state.activePanel])

  const handleNavigation = (direction) => {
    if (state.rendition) {
      state.rendition[direction]()
    }
  }

  const goToChapter = async (href, item) => {
    if (!href || href === '#' || !state.rendition || !state.book) return

    try {
      const methods = [
        () => state.rendition.display(href),
        () => {
          const cleanHref = href.split('#')[0]
          const spineItem = state.book.spine.spineItems.find(s =>
            s.href === cleanHref || s.href.endsWith(cleanHref) || cleanHref.endsWith(s.href.split('/').pop())
          )
          return spineItem ? state.rendition.display(spineItem.href) : Promise.reject()
        },
        () => item?.originalItem?.cfi ? state.rendition.display(item.originalItem.cfi) : Promise.reject(),
        () => {
          const index = state.book.spine.spineItems.findIndex(s => s.href.includes(href.split('#')[0]))
          return index >= 0 ? state.rendition.display(index) : Promise.reject()
        }
      ]

      for (const method of methods) {
        try {
          await method()
          setState(prev => ({ ...prev, tocOpen: false }))
          return
        } catch (err) {
          continue
        }
      }
      throw new Error('All navigation methods failed')
    } catch (error) {
      console.warn('Navigation failed for:', href, error.message)
      setState(prev => ({ ...prev, tocOpen: false }))
    }
  }

  const handleFontSizeChange = (delta) => {
    setState(prev => ({ ...prev, fontSize: Math.max(12, Math.min(32, prev.fontSize + delta)) }))
  }

  const toggleReadingMode = () => {
    setState(prev => ({ ...prev, readingMode: prev.readingMode === 'cream' ? 'default' : 'cream' }))
  }

  const handleAddBookmark = async () => {
    if (!isAuthenticated) {
      alert('Anda harus login untuk menambahkan bookmark!')
      return
    }

    if (!state.rendition || !state.currentCfi) {
      alert('Gagal mendapatkan posisi saat ini. Silakan coba lagi.')
      return
    }

    try {
      const title = prompt('Judul bookmark (opsional):') || `Bookmark - Halaman ${state.currentPage}`
      if (title === null) return

      const description = prompt('Deskripsi (opsional):') || ''

      const bookmarkData = {
        page: state.currentPage,
        position: state.currentCfi,
        title: title.trim() || `Halaman ${state.currentPage}`,
        description: description.trim(),
        color: '#FFD700'
      }

      const result = await addBookmark(bookmarkData)
      if (result) {
        alert('✓ Bookmark berhasil ditambahkan!')
        setState(prev => ({ ...prev, showFloatingToolbar: false }))
      }
    } catch (error) {
      console.error('Error adding bookmark:', error)
      alert('Gagal menambahkan bookmark. Silakan coba lagi.')
    }
  }

  const handleDeleteBookmark = async (bookmarkId) => {
    if (!confirm('Hapus bookmark ini?')) return

    const success = await deleteBookmark(bookmarkId)
    if (success) {
      alert('✓ Bookmark berhasil dihapus!')
    } else {
      alert('Gagal menghapus bookmark. Silakan coba lagi.')
    }
  }

  const handleGoToBookmark = (bookmark) => {
    if (state.rendition && bookmark.position) {
      try {
        state.rendition.display(bookmark.position)
        setState(prev => ({ ...prev, activePanel: null }))
      } catch (error) {
        console.error('Error navigating to bookmark:', error)
        alert('Gagal membuka bookmark. Posisi mungkin tidak valid.')
      }
    }
  }

  const handleHighlight = async (color = '#ffff00') => {
    alert('Fitur highlight akan segera tersedia!')
  }

  const handleAddNote = async () => {
    if (!isAuthenticated) {
      alert('Anda harus login untuk menambahkan catatan!')
      return
    }

    const content = prompt('Masukkan catatan:')
    if (content && content.trim()) {
      alert('Fitur catatan akan segera tersedia!')
      setState(prev => ({ ...prev, showFloatingToolbar: false, activePanel: null }))
    }
  }

  const handleTranslate = () => {
    if (!state.selectedText) {
      alert('Pilih teks terlebih dahulu untuk menerjemahkan!')
      return
    }
    alert('Fitur terjemahan akan segera tersedia!')
    setState(prev => ({ ...prev, activePanel: 'translation' }))
  }

  const handleAction = (action, data) => {
    const actions = {
      bookmark: handleAddBookmark,
      note: handleAddNote,
      translate: handleTranslate,
      panel: (panel) => {
        setState(prev => ({ ...prev, activePanel: prev.activePanel === panel ? null : panel }))
      }
    }
    actions[action]?.(data)
  }

  const controls = [
    { id: 'bookmarks', icon: '🔖', title: 'Bookmark' },
    { id: 'highlights', icon: '🖍️', title: 'Highlight' },
    { id: 'notes', icon: '📝', title: 'Catatan' },
    { id: 'search', icon: '🔍', title: 'Pencarian' }
  ]

  const highlightColors = [
    { color: '#ffff00', icon: '🟡', title: 'Highlight Kuning' },
    { color: '#90EE90', icon: '🟢', title: 'Highlight Hijau' }
  ]

  return (
    <div className="epub-reader" ref={readerContainerRef}>
      {/* Error Message */}
      {featuresError && (
        <div className="card error-message" style={{ margin: '1rem', padding: '1rem', backgroundColor: '#fee', border: '1px solid #fcc' }}>
          <strong>Error:</strong> {featuresError}
        </div>
      )}

      {/* Controls - Single Card Container */}
      <div className="card reader-controls">
        <div className="reader-control-group">
          {/* TOC Dropdown */}
          <div className="toc-dropdown">
            <button
              ref={dropdownButtonRef}
              className="btn btn-secondary"
              onClick={() => setState(prev => ({ ...prev, tocOpen: !prev.tocOpen }))}
            >
              <span>Daftar Isi</span>
              <span className={`dropdown-arrow ${state.tocOpen ? 'open' : ''}`}>▼</span>
            </button>
            {state.tocOpen && (
              <div className="dropdown-menu" ref={dropdownRef}>
                <div className="dropdown-header">Daftar Isi</div>
                <div className="dropdown-content">
                  {state.toc.length > 0 ? (
                    state.toc.map((item, idx) => (
                      <button key={idx} className="dropdown-item" onClick={() => goToChapter(item.href, item)}
                        disabled={item.href === '#'} style={{ paddingLeft: `${1.5 + (item.level || 0) * 0.75}rem` }}>
                        {item.label}
                      </button>
                    ))
                  ) : (
                    <div className="dropdown-empty">Daftar isi tidak tersedia</div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Font Controls */}
          <div className="font-controls">
            <button className="btn btn-secondary btn-small" onClick={() => handleFontSizeChange(-2)}>A-</button>
            <span className="font-size-display">{state.fontSize}px</span>
            <button className="btn btn-secondary btn-small" onClick={() => handleFontSizeChange(2)}>A+</button>
            <button className={`btn btn-secondary ${state.readingMode === 'cream' ? 'active' : ''}`} onClick={toggleReadingMode}>
              {isMobile ? '📖' : 'Mode'}
            </button>
          </div>

          {/* Feature Controls */}
          <div className="feature-controls">
            {controls.map(control => (
              <button key={control.id} className={`btn btn-secondary btn-small ${state.activePanel === control.id ? 'active' : ''}`}
                onClick={() => handleAction('panel', control.id)} title={control.title}>
                {control.icon}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Floating Toolbar */}
      {state.showFloatingToolbar && state.selectedText && (
        <div
          className="floating-toolbar card"
          style={{
            position: 'fixed',
            top: `${state.toolbarPosition.top}px`,
            left: `${state.toolbarPosition.left}px`,
            transform: 'translateX(-50%)',
            zIndex: 1000
          }}
        >
          <div className="toolbar-content">
            <div className="toolbar-text" title={state.selectedText}>
              {state.selectedText.length > 30
                ? state.selectedText.substring(0, 30) + '...'
                : state.selectedText}
            </div>
            <div className="toolbar-actions">
              {highlightColors.map(({ color, icon, title }) => (
                <button key={color} className="btn btn-secondary btn-small" onClick={() => handleHighlight(color)} title={title}>
                  {icon}
                </button>
              ))}
              <button className="btn btn-secondary btn-small" onClick={() => handleAction('bookmark')} title="Bookmark">🔖</button>
              <button className="btn btn-secondary btn-small" onClick={handleAddNote} title="Tambah Catatan">📝</button>
              <button className="btn btn-secondary btn-small" onClick={() => handleAction('translate')} title="Terjemahan">🌐</button>
              <button className="btn btn-secondary btn-small" onClick={() => setState(prev => ({ ...prev, showFloatingToolbar: false }))} title="Tutup">✖️</button>
            </div>
          </div>
        </div>
      )}

      {/* Panels */}
      <div className="reader-panels">
        {state.activePanel && (
          <div className="panel card">
            <div className="panel-header">
              <h3>{controls.find(c => c.id === state.activePanel)?.title || 'Panel'}</h3>
              <button className="btn btn-secondary btn-small" onClick={() => setState(prev => ({ ...prev, activePanel: null }))}>✖️</button>
            </div>
            <div className="panel-content">
              {state.activePanel === 'bookmarks' ? (
                <div className="bookmarks-list">
                  {!isAuthenticated ? (
                    <p className="info-message">Silakan login untuk menggunakan fitur bookmark.</p>
                  ) : bookmarks.length === 0 ? (
                    <p className="info-message">Belum ada bookmark. Klik tombol 🔖 di panel atas atau pilih teks lalu klik 🔖 untuk menambahkan bookmark.</p>
                  ) : (
                    <div className="bookmark-items">
                      {bookmarks.map((bookmark) => (
                        <div key={bookmark.id} className="bookmark-item card">
                          <div className="bookmark-header">
                            <h4>{bookmark.title}</h4>
                            <span className="bookmark-page">Hal. {bookmark.page}</span>
                          </div>
                          {bookmark.description && (
                            <p className="bookmark-description">{bookmark.description}</p>
                          )}
                          <div className="bookmark-actions">
                            <button
                              className="btn btn-secondary btn-small"
                              onClick={() => handleGoToBookmark(bookmark)}
                            >
                              Buka
                            </button>
                            <button
                              className="btn btn-secondary btn-small"
                              onClick={() => handleDeleteBookmark(bookmark.id)}
                              disabled={featuresLoading}
                            >
                              Hapus
                            </button>
                          </div>
                          <small className="bookmark-date">
                            {new Date(bookmark.createdAt).toLocaleDateString('id-ID', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </small>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : state.activePanel === 'search' ? (
                <input type="text" placeholder="Cari dalam buku..." className="search-input"
                  onChange={(e) => e.target.value && alert('Fitur akan segera tersedia!')} />
              ) : state.activePanel === 'translation' ? (
                <>
                  <p><strong>Teks:</strong> {state.selectedText}</p>
                  <p><strong>Terjemahan:</strong> [Akan segera tersedia]</p>
                </>
              ) : (
                <p>Fitur akan segera tersedia!</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Main Reading Container */}
      <div className="card epub-reader-content">
        <div className="reader-wrapper">
          {/* Reader Viewport */}
          <div
            ref={bookRef}
            className="epub-reader-viewport"
            tabIndex={0}
          >
            {state.isLoading && <div className="loading">Memuat konten ebook...</div>}
          </div>

          {/* Navigation Bar with Buttons and Page Info */}
          <div className="reader-navigation-bar">
            <button
              className="nav-corner-button"
              onClick={() => handleNavigation('prev')}
              title="Halaman Sebelumnya"
            >
              ‹
            </button>

            <div className="page-info-center">
              {isMobile ? `${state.currentPage}/${state.totalPages}` : `Halaman ${state.currentPage} dari ${state.totalPages}`}
            </div>

            <button
              className="nav-corner-button"
              onClick={() => handleNavigation('next')}
              title="Halaman Selanjutnya"
            >
              ›
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        .info-message {
          text-align: center;
          padding: 2rem 1rem;
          color: #666;
          line-height: 1.6;
        }

        .bookmarks-list {
          max-height: 500px;
          overflow-y: auto;
        }

        .bookmark-items {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .bookmark-item {
          padding: 1rem;
          background: rgba(255, 215, 0, 0.1);
          border-left: 3px solid #FFD700;
        }

        .bookmark-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.5rem;
        }

        .bookmark-header h4 {
          margin: 0;
          font-size: 1rem;
          font-weight: 600;
        }

        .bookmark-page {
          font-size: 0.875rem;
          color: #666;
          background: rgba(255, 215, 0, 0.2);
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
        }

        .bookmark-description {
          margin: 0.5rem 0;
          font-size: 0.875rem;
          color: #555;
        }

        .bookmark-actions {
          display: flex;
          gap: 0.5rem;
          margin: 0.75rem 0;
        }

        .bookmark-date {
          display: block;
          font-size: 0.75rem;
          color: #999;
          margin-top: 0.5rem;
        }

        .error-message {
          color: #d32f2f;
        }

        .floating-toolbar {
          padding: 0.75rem;
          background: white;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          border-radius: 8px;
          max-width: 90vw;
        }

        .toolbar-content {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .toolbar-text {
          font-size: 0.875rem;
          color: #666;
          padding: 0.5rem;
          background: #f5f5f5;
          border-radius: 4px;
          max-width: 300px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .toolbar-actions {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
          justify-content: center;
        }

        @media (max-width: 768px) {
          .floating-toolbar {
            max-width: 95vw;
          }

          .toolbar-text {
            max-width: 250px;
          }
        }
      `}</style>
    </div>
  )
}

export default EpubReader