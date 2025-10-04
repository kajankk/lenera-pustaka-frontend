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
  const bookmarkHighlightsRef = useRef(new Map())
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
    currentCfi: null,
    userClosedToolbar: false
  })

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768)
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

  const clearSelection = () => {
    try {
      const iframe = bookRef.current?.querySelector('iframe')
      if (iframe?.contentWindow) {
        const selection = iframe.contentWindow.document.getSelection()
        selection?.removeAllRanges()
      }
    } catch (error) {
      console.warn('Error clearing selection:', error)
    }
  }

  // Get bookmark styles based on theme
  const getBookmarkStyles = useCallback(() => {
    if (theme === 'dark') {
      return {
        color: '#ff69b4',  // Hot pink untuk dark mode
        opacity: '0.8',
        blendMode: 'screen'  // Screen mode untuk dark backgrounds
      }
    }
    return {
      color: '#de96be',  // Pink normal untuk light mode
      opacity: '0.6',
      blendMode: 'multiply'  // Multiply mode untuk light backgrounds
    }
  }, [theme])

  const checkTextSelection = useCallback(() => {
    if (state.userClosedToolbar) return

    try {
      const iframe = bookRef.current?.querySelector('iframe')
      if (!iframe?.contentWindow) return

      const iframeDoc = iframe.contentWindow.document
      const selection = iframeDoc.getSelection()

      if (!selection || selection.rangeCount === 0) {
        setState(prev => ({ ...prev, selectedText: '', selectedRange: null, showFloatingToolbar: false }))
        return
      }

      const selectedText = selection.toString().trim()

      if (selectedText && selectedText.length > 0) {
        const range = selection.getRangeAt(0)
        const rect = range.getBoundingClientRect()
        const iframeRect = iframe.getBoundingClientRect()
        const top = iframeRect.top + rect.top - 60
        const left = iframeRect.left + rect.left + (rect.width / 2)

        let cfiRange = null
        if (state.rendition) {
          try {
            const contents = state.rendition.getContents()
            if (contents?.[0]) {
              const content = contents[0]
              const doc = content.window?.document
              const sel = doc?.getSelection()
              if (sel?.rangeCount > 0) {
                cfiRange = content.cfiFromRange(sel.getRangeAt(0))
              }
            }
          } catch (e) {
            console.warn('Could not get CFI range:', e)
          }
        }

        setState(prev => ({
          ...prev,
          selectedText,
          selectedRange: cfiRange,
          showFloatingToolbar: true,
          toolbarPosition: { top, left },
          userClosedToolbar: false
        }))
      } else {
        setState(prev => ({ ...prev, selectedText: '', selectedRange: null, showFloatingToolbar: false }))
      }
    } catch (error) {
      console.warn('Error checking text selection:', error)
    }
  }, [state.rendition, state.userClosedToolbar])

  useEffect(() => {
    if (!state.rendition) return

    selectionCheckInterval.current = setInterval(checkTextSelection, 300)

    const iframe = bookRef.current?.querySelector('iframe')
    if (iframe?.contentWindow) {
      const iframeDoc = iframe.contentWindow.document
      const handleSelectionChange = () => setTimeout(checkTextSelection, 100)

      iframeDoc.addEventListener('mouseup', handleSelectionChange)
      iframeDoc.addEventListener('touchend', handleSelectionChange)
      iframeDoc.addEventListener('selectionchange', handleSelectionChange)

      return () => {
        clearInterval(selectionCheckInterval.current)
        iframeDoc.removeEventListener('mouseup', handleSelectionChange)
        iframeDoc.removeEventListener('touchend', handleSelectionChange)
        iframeDoc.removeEventListener('selectionchange', handleSelectionChange)
      }
    }

    return () => clearInterval(selectionCheckInterval.current)
  }, [state.rendition, checkTextSelection])

  const addBookmarkHighlight = useCallback((cfi) => {
    if (!state.rendition || !cfi) return

    try {
      const iframe = bookRef.current?.querySelector('iframe')
      if (!iframe?.contentWindow) return

      const iframeDoc = iframe.contentWindow.document
      const range = state.rendition.getRange(cfi)
      if (!range || !range.toString().trim()) return

      const highlightId = 'bookmark-hl-' + cfi.replace(/[^a-zA-Z0-9]/g, '')
      const existingHighlight = iframeDoc.getElementById(highlightId)
      if (existingHighlight) existingHighlight.remove()

      const styles = getBookmarkStyles()
      const mark = iframeDoc.createElement('mark')
      mark.id = highlightId
      mark.className = 'bookmark-highlight'
      mark.style.cssText = `
        background-color: ${styles.color} !important;
        opacity: ${styles.opacity} !important;
        mix-blend-mode: ${styles.blendMode} !important;
        padding: 2px 0 !important;
        color: inherit !important;
      `
      mark.setAttribute('data-bookmark-cfi', cfi)

      try {
        range.surroundContents(mark)
      } catch (e) {
        const contents = range.extractContents()
        mark.appendChild(contents)
        range.insertNode(mark)
      }

      bookmarkHighlightsRef.current.set(cfi, styles.color)

      // Update or create global styles
      let styleEl = iframeDoc.getElementById('bookmark-highlight-styles')
      if (!styleEl) {
        styleEl = iframeDoc.createElement('style')
        styleEl.id = 'bookmark-highlight-styles'
        iframeDoc.head.appendChild(styleEl)
      }
      styleEl.textContent = `
        mark.bookmark-highlight {
          background-color: ${styles.color} !important;
          opacity: ${styles.opacity} !important;
          mix-blend-mode: ${styles.blendMode} !important;
        }
      `
    } catch (error) {
      console.error('Error adding bookmark highlight:', error)
    }
  }, [state.rendition, getBookmarkStyles])

  const removeBookmarkHighlight = useCallback((cfi) => {
    if (!state.rendition || !cfi) return

    try {
      const iframe = bookRef.current?.querySelector('iframe')
      if (iframe?.contentWindow) {
        const iframeDoc = iframe.contentWindow.document
        const highlightId = 'bookmark-hl-' + cfi.replace(/[^a-zA-Z0-9]/g, '')
        const mark = iframeDoc.getElementById(highlightId)

        if (mark) {
          const parent = mark.parentNode
          while (mark.firstChild) parent.insertBefore(mark.firstChild, mark)
          parent.removeChild(mark)
          parent.normalize()
        }
      }
      bookmarkHighlightsRef.current.delete(cfi)
    } catch (error) {
      console.warn('Error removing bookmark highlight:', error)
    }
  }, [state.rendition])

  useEffect(() => {
    if (!state.rendition || !bookmarks) return

    const applyHighlights = setTimeout(() => {
      bookmarkHighlightsRef.current.forEach((color, cfi) => {
        try {
          if (state.rendition.annotations?.remove) {
            state.rendition.annotations.remove(cfi, 'highlight')
          }
        } catch (e) {}
      })
      bookmarkHighlightsRef.current.clear()

      if (bookmarks.length > 0) {
        bookmarks.forEach(bookmark => {
          if (bookmark.position) {
            addBookmarkHighlight(bookmark.position)
          }
        })
      }
    }, 500)

    return () => clearTimeout(applyHighlights)
  }, [bookmarks, state.rendition, state.currentPage, theme, addBookmarkHighlight])

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

    rend.themes.default({
      body: {
        'font-family': 'inherit !important',
        'line-height': '1.6 !important',
        'padding': isMobile ? '0.75rem !important' : '1rem !important',
        'user-select': 'text !important'
      },
      p: { 'text-align': 'justify !important' },
      a: { 'text-decoration': 'underline !important', 'color': 'inherit !important' }
    })

    rend.themes.fontSize(`${state.fontSize}px`)

    epubBook.ready.then(() => rend.display(bookData.currentPosition || 0))
      .catch(() => setState(prev => ({ ...prev, isLoading: false })))

    epubBook.loaded.navigation.then(nav => {
      if (nav.toc && Array.isArray(nav.toc)) {
        setState(prev => ({ ...prev, toc: flattenToc(nav.toc) }))
      }
    }).catch(() => setState(prev => ({ ...prev, toc: [] })))

    rend.on('relocated', (location) => {
      const spineItem = epubBook.spine.get(location.start.cfi)
      if (spineItem) {
        setState(prev => ({
          ...prev,
          progress: Math.round((spineItem.index / Math.max(1, epubBook.spine.length - 1)) * 100),
          currentPage: spineItem.index + 1,
          totalPages: epubBook.spine.length,
          currentCfi: location.start.cfi
        }))
      }
    })

    rend.on('rendered', () => {
      setState(prev => ({ ...prev, isLoading: false }))

      setTimeout(() => {
        const iframe = bookRef.current?.querySelector('iframe')
        if (!iframe?.contentWindow || !bookmarks?.length) return

        const styles = getBookmarkStyles()
        bookmarks.forEach(bookmark => {
          if (bookmark.position) {
            try {
              const range = rend.getRange(bookmark.position)
              if (range && range.toString().trim()) {
                const iframeDoc = iframe.contentWindow.document
                const highlightId = 'bookmark-hl-' + bookmark.position.replace(/[^a-zA-Z0-9]/g, '')
                const existing = iframeDoc.getElementById(highlightId)
                if (existing) existing.remove()

                const mark = iframeDoc.createElement('mark')
                mark.id = highlightId
                mark.className = 'bookmark-highlight'
                mark.style.cssText = `
                  background-color: ${styles.color} !important;
                  opacity: ${styles.opacity} !important;
                  mix-blend-mode: ${styles.blendMode} !important;
                  padding: 2px 0 !important;
                `

                try {
                  range.surroundContents(mark)
                } catch (e) {
                  const contents = range.extractContents()
                  mark.appendChild(contents)
                  range.insertNode(mark)
                }
              }
            } catch (e) {}
          }
        })
      }, 200)
    })

    setState(prev => ({ ...prev, book: epubBook, rendition: rend }))

    return () => {
      clearInterval(selectionCheckInterval.current)
      bookmarkHighlightsRef.current.clear()
      rend.destroy()
      epubBook.destroy()
    }
  }, [bookData?.fileUrl, isMobile, getBookmarkStyles])

  useEffect(() => {
    if (state.rendition) state.rendition.themes.fontSize(`${state.fontSize}px`)
  }, [state.fontSize, state.rendition])

  useEffect(() => {
    if (!state.rendition) return

    const colors = state.readingMode === 'cream'
      ? { color: '#704214', bg: '#f4ecd8', link: '#8B4513' }
      : theme === 'dark'
      ? { color: '#ffffff', bg: '#1a1a1a', link: '#FFD700' }
      : { color: 'inherit', bg: 'inherit', link: '#225330' }

    state.rendition.themes.override('color', colors.color)
    state.rendition.themes.override('background', colors.bg)
    state.rendition.themes.override('a', `color: ${colors.link} !important;`)
  }, [theme, state.rendition, state.readingMode])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target) &&
          !dropdownButtonRef.current?.contains(event.target)) {
        setState(prev => ({ ...prev, tocOpen: false }))
      }
    }
    if (state.tocOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [state.tocOpen])

  useEffect(() => {
    if (!isMobile || !state.activePanel) return

    const handleClickOutside = (event) => {
      const panel = document.querySelector('.panel')
      if (panel && !panel.contains(event.target)) {
        const clickedControl = event.target.closest('.feature-controls')
        if (!clickedControl) setState(prev => ({ ...prev, activePanel: null }))
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isMobile, state.activePanel])

  const handleNavigation = (direction) => {
    if (state.rendition) state.rendition[direction]()
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
        () => item?.originalItem?.cfi ? state.rendition.display(item.originalItem.cfi) : Promise.reject()
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
    } catch (error) {
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
      alert('Gagal mendapatkan posisi saat ini.')
      return
    }

    try {
      const title = prompt('Judul bookmark:') || `Halaman ${state.currentPage}`
      if (title === null) return

      const description = prompt('Deskripsi:') || ''
      const bookmarkPosition = state.selectedRange || state.currentCfi

      const result = await addBookmark({
        page: state.currentPage,
        position: bookmarkPosition,
        title: title.trim() || `Halaman ${state.currentPage}`,
        description: description.trim()
      })

      if (result) {
        addBookmarkHighlight(bookmarkPosition)
        alert('✓ Bookmark berhasil ditambahkan!')
        clearSelection()
        setState(prev => ({
          ...prev,
          showFloatingToolbar: false,
          selectedText: '',
          selectedRange: null,
          userClosedToolbar: false
        }))
      }
    } catch (error) {
      alert('Gagal menambahkan bookmark.')
    }
  }

  const handleDeleteBookmark = async (bookmarkId) => {
    if (!confirm('Hapus bookmark ini?')) return

    const bookmark = bookmarks.find(b => b.id === bookmarkId)
    const success = await deleteBookmark(bookmarkId)

    if (success) {
      if (bookmark?.position) removeBookmarkHighlight(bookmark.position)
      alert('✓ Bookmark berhasil dihapus!')
    } else {
      alert('Gagal menghapus bookmark.')
    }
  }

  const handleGoToBookmark = (bookmark) => {
    if (state.rendition && bookmark.position) {
      try {
        state.rendition.display(bookmark.position)
        setState(prev => ({ ...prev, activePanel: null }))
      } catch (error) {
        alert('Gagal membuka bookmark.')
      }
    }
  }

  const handleCloseToolbar = () => {
    clearSelection()
    setState(prev => ({
      ...prev,
      showFloatingToolbar: false,
      selectedText: '',
      selectedRange: null,
      userClosedToolbar: true
    }))
    setTimeout(() => setState(prev => ({ ...prev, userClosedToolbar: false })), 500)
  }

  const controls = [
    { id: 'bookmarks', icon: '🔖', title: 'Bookmark' },
    { id: 'highlights', icon: '🖍️', title: 'Highlight' },
    { id: 'notes', icon: '📝', title: 'Catatan' },
    { id: 'search', icon: '🔍', title: 'Pencarian' }
  ]

  return (
    <div className="epub-reader" ref={readerContainerRef}>
      {featuresError && (
        <div className="card error-message">
          <strong>Error:</strong> {featuresError}
        </div>
      )}

      <div className="card reader-controls">
        <div className="reader-control-group">
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

          <div className="font-controls">
            <button className="btn btn-secondary btn-small" onClick={() => handleFontSizeChange(-2)}>A-</button>
            <span className="font-size-display">{state.fontSize}px</span>
            <button className="btn btn-secondary btn-small" onClick={() => handleFontSizeChange(2)}>A+</button>
            <button className={`btn btn-secondary ${state.readingMode === 'cream' ? 'active' : ''}`} onClick={toggleReadingMode}>
              {isMobile ? '📖' : 'Mode'}
            </button>
          </div>

          <div className="feature-controls">
            {controls.map(control => (
              <button key={control.id} className={`btn btn-secondary btn-small ${state.activePanel === control.id ? 'active' : ''}`}
                onClick={() => setState(prev => ({ ...prev, activePanel: prev.activePanel === control.id ? null : control.id }))}
                title={control.title}>
                {control.icon}
              </button>
            ))}
          </div>
        </div>
      </div>

      {state.showFloatingToolbar && state.selectedText && (
        <div className="floating-toolbar card" style={{
          position: 'fixed',
          top: `${state.toolbarPosition.top}px`,
          left: `${state.toolbarPosition.left}px`,
          transform: 'translateX(-50%)',
          zIndex: 1000
        }}>
          <div className="toolbar-content">
            <div className="toolbar-text" title={state.selectedText}>
              {state.selectedText.length > 30 ? state.selectedText.substring(0, 30) + '...' : state.selectedText}
            </div>
            <div className="toolbar-actions">
              <button className="btn btn-secondary btn-small" onClick={handleAddBookmark} title="Bookmark">🔖</button>
              <button className="btn btn-secondary btn-small" onClick={() => alert('Fitur segera tersedia!')} title="Catatan">📝</button>
              <button className="btn btn-secondary btn-small" onClick={handleCloseToolbar} title="Tutup">✖️</button>
            </div>
          </div>
        </div>
      )}

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
                    <p className="info-message">Belum ada bookmark.</p>
                  ) : (
                    <div className="bookmark-items">
                      {bookmarks.map((bookmark) => (
                        <div key={bookmark.id} className="bookmark-item card">
                          <div className="bookmark-header">
                            <h4>{bookmark.title}</h4>
                            <span className="bookmark-page">Hal. {bookmark.page}</span>
                          </div>
                          {bookmark.description && <p className="bookmark-description">{bookmark.description}</p>}
                          <div className="bookmark-actions">
                            <button className="btn btn-secondary btn-small" onClick={() => handleGoToBookmark(bookmark)}>Buka</button>
                            <button className="btn btn-secondary btn-small" onClick={() => handleDeleteBookmark(bookmark.id)} disabled={featuresLoading}>Hapus</button>
                          </div>
                          <small className="bookmark-date">
                            {new Date(bookmark.createdAt).toLocaleDateString('id-ID', {
                              day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                            })}
                          </small>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <p>Fitur akan segera tersedia!</p>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="card epub-reader-content">
        <div className="reader-wrapper">
          <div ref={bookRef} className="epub-reader-viewport" tabIndex={0}>
            {state.isLoading && <div className="loading">Memuat konten ebook...</div>}
          </div>

          <div className="reader-navigation-bar">
            <button className="nav-corner-button" onClick={() => handleNavigation('prev')} title="Halaman Sebelumnya">‹</button>
            <div className="page-info-center">
              {isMobile ? `${state.currentPage}/${state.totalPages}` : `Halaman ${state.currentPage} dari ${state.totalPages}`}
            </div>
            <button className="nav-corner-button" onClick={() => handleNavigation('next')} title="Halaman Selanjutnya">›</button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default EpubReader