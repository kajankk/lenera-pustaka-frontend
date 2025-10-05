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
    currentChapterTitle: '',
    userClosedToolbar: false
  })

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

  const getCurrentChapterTitle = (cfi, book, toc) => {
    if (!toc || toc.length === 0 || !cfi || !book) return ''

    try {
      const spineItem = book.spine.get(cfi)
      if (!spineItem) return ''

      const spineHref = spineItem.href.split('#')[0]

      for (let i = toc.length - 1; i >= 0; i--) {
        const tocItem = toc[i]
        if (tocItem.href) {
          const tocHref = tocItem.href.split('#')[0]
          const tocPath = tocHref.split('/').pop()
          const spinePath = spineHref.split('/').pop()

          if (tocPath === spinePath ||
              spineHref.endsWith(tocHref) ||
              tocHref.endsWith(spineHref) ||
              spineHref.includes(tocPath)) {
            return tocItem.label
          }
        }
      }
    } catch (error) {
      console.warn('Error getting chapter title:', error)
    }
    return ''
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

  const getBookmarkStyles = useCallback(() => {
    if (theme === 'dark') {
      return {
        color: '#ff69b4',
        opacity: '0.8',
        blendMode: 'screen'
      }
    }
    return {
      color: '#ff69b4',
      opacity: '0.6',
      blendMode: 'multiply'
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

        const toolbarHeight = 100
        const viewportWidth = window.innerWidth
        const viewportHeight = window.innerHeight

        let top = iframeRect.top + rect.top - toolbarHeight - 10
        let left = iframeRect.left + rect.left + (rect.width / 2)

        if (top < 10) {
          top = iframeRect.top + rect.bottom + 10
        }

        const toolbarWidth = isMobile ? 280 : 320
        if (left - toolbarWidth / 2 < 10) {
          left = toolbarWidth / 2 + 10
        } else if (left + toolbarWidth / 2 > viewportWidth - 10) {
          left = viewportWidth - toolbarWidth / 2 - 10
        }

        if (top + toolbarHeight > viewportHeight - 10) {
          top = viewportHeight - toolbarHeight - 10
        }

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
  }, [state.rendition, state.userClosedToolbar, isMobile])

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

  const isBookmarkOnCurrentPage = useCallback((bookmarkCfi) => {
    if (!bookmarkCfi || !state.currentCfi || !state.book) return false

    try {
      // Extract spine index from both CFIs
      const bookmarkSpine = state.book.spine.get(bookmarkCfi)
      const currentSpine = state.book.spine.get(state.currentCfi)

      if (!bookmarkSpine || !currentSpine) return false

      // Check if they're on the same spine item (chapter/page)
      return bookmarkSpine.index === currentSpine.index
    } catch (error) {
      return false
    }
  }, [state.currentCfi, state.book])

  const addBookmarkHighlight = useCallback((cfi, bookmarkColor = null) => {
    if (!state.rendition || !cfi) return

    // Check if bookmark is on current page
    if (!isBookmarkOnCurrentPage(cfi)) {
      return
    }

    try {
      const iframe = bookRef.current?.querySelector('iframe')
      if (!iframe?.contentWindow) return

      const iframeDoc = iframe.contentWindow.document
      if (!iframeDoc.body) return

      // Get range from CFI with proper error handling
      let range
      try {
        range = state.rendition.getRange(cfi)
      } catch (e) {
        // CFI not valid for current page
        return
      }

      // Validate range
      if (!range || !range.toString().trim()) {
        return
      }

      if (!range.startContainer || !range.endContainer) {
        return
      }

      if (!iframeDoc.contains(range.startContainer) || !iframeDoc.contains(range.endContainer)) {
        return
      }

      const highlightId = 'bookmark-hl-' + cfi.replace(/[^a-zA-Z0-9]/g, '')
      const existingHighlight = iframeDoc.getElementById(highlightId)
      if (existingHighlight) {
        existingHighlight.remove()
      }

      // Use bookmark's saved color or get from current theme
      const styles = bookmarkColor
        ? { color: bookmarkColor, opacity: theme === 'dark' ? '0.8' : '0.6', blendMode: theme === 'dark' ? 'screen' : 'multiply' }
        : getBookmarkStyles()

      const mark = iframeDoc.createElement('mark')
      mark.id = highlightId
      mark.className = 'bookmark-highlight'
      mark.style.cssText = `
        background-color: ${styles.color} !important;
        opacity: ${styles.opacity} !important;
        mix-blend-mode: ${styles.blendMode} !important;
        padding: 2px 0 !important;
        color: inherit !important;
        border-radius: 2px !important;
      `
      mark.setAttribute('data-bookmark-cfi', cfi)

      // Try to wrap the range with mark element
      try {
        const clonedRange = range.cloneRange()
        clonedRange.surroundContents(mark)
      } catch (e) {
        try {
          const contents = range.extractContents()
          mark.appendChild(contents)
          range.insertNode(mark)
        } catch (err) {
          // If both methods fail, silently skip
          return
        }
      }

      bookmarkHighlightsRef.current.set(cfi, styles.color)

      // Inject styles
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
          transition: opacity 0.2s ease !important;
        }
        mark.bookmark-highlight:hover {
          opacity: ${parseFloat(styles.opacity) + 0.2} !important;
          cursor: pointer;
        }
      `
    } catch (error) {
      // Silently handle errors
    }
  }, [state.rendition, getBookmarkStyles, theme, isBookmarkOnCurrentPage])

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
    if (!state.rendition || !bookmarks || !state.currentCfi) return

    const applyHighlights = setTimeout(() => {
      // Clear all existing highlights
      bookmarkHighlightsRef.current.forEach((color, cfi) => {
        try {
          if (state.rendition.annotations?.remove) {
            state.rendition.annotations.remove(cfi, 'highlight')
          }
        } catch (e) {}
      })
      bookmarkHighlightsRef.current.clear()

      if (bookmarks.length > 0) {
        const iframe = bookRef.current?.querySelector('iframe')
        if (!iframe?.contentWindow?.document?.body) return

        // Filter bookmarks for current page only
        const currentPageBookmarks = bookmarks.filter(bookmark =>
          bookmark.position && isBookmarkOnCurrentPage(bookmark.position)
        )

        // Apply highlights only for bookmarks on current page
        currentPageBookmarks.forEach((bookmark, index) => {
          setTimeout(() => addBookmarkHighlight(bookmark.position, bookmark.color), 50 * index)
        })
      }
    }, 800)

    return () => clearTimeout(applyHighlights)
  }, [bookmarks, state.rendition, state.currentCfi, theme, addBookmarkHighlight, isBookmarkOnCurrentPage])

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
        const flatToc = flattenToc(nav.toc)
        setState(prev => ({ ...prev, toc: flatToc }))
      }
    }).catch(() => setState(prev => ({ ...prev, toc: [] })))

    rend.on('relocated', (location) => {
      const spineItem = epubBook.spine.get(location.start.cfi)
      if (spineItem) {
        setState(prev => {
          const chapterTitle = getCurrentChapterTitle(location.start.cfi, epubBook, prev.toc)
          return {
            ...prev,
            progress: Math.round((spineItem.index / Math.max(1, epubBook.spine.length - 1)) * 100),
            currentPage: spineItem.index + 1,
            totalPages: epubBook.spine.length,
            currentCfi: location.start.cfi,
            currentChapterTitle: chapterTitle
          }
        })
      }
    })

    rend.on('rendered', () => {
      setState(prev => ({ ...prev, isLoading: false }))
    })

    rend.on('renderFailed', (e) => {
      console.error('Render failed:', e)
    })

    setState(prev => ({ ...prev, book: epubBook, rendition: rend }))

    return () => {
      clearInterval(selectionCheckInterval.current)
      bookmarkHighlightsRef.current.clear()
      rend.destroy()
      epubBook.destroy()
    }
  }, [bookData?.fileUrl, isMobile])

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
      // Use selectedRange CFI if available (for text selection)
      const bookmarkPosition = state.selectedRange || state.currentCfi

      let chapterTitle = state.currentChapterTitle
      if (!chapterTitle && state.book && state.toc.length > 0) {
        chapterTitle = getCurrentChapterTitle(state.currentCfi, state.book, state.toc)
      }

      const defaultTitle = chapterTitle || `Halaman ${state.currentPage}`
      const styles = getBookmarkStyles()

      const bookmarkData = {
        page: state.currentPage,
        position: bookmarkPosition,
        title: defaultTitle,
        color: styles.color
      }

      if (state.selectedText && state.selectedText.trim().length > 0) {
        bookmarkData.description = state.selectedText.trim()
      }

      console.log('Adding bookmark:', bookmarkData)

      const result = await addBookmark(bookmarkData)

      if (result) {
        const positionToHighlight = result.position || bookmarkPosition
        const colorToUse = result.color || styles.color

        alert('Bookmark berhasil ditambahkan!')

        // Clear selection first
        clearSelection()
        setState(prev => ({
          ...prev,
          showFloatingToolbar: false,
          selectedText: '',
          selectedRange: null,
          userClosedToolbar: false
        }))

        // Apply highlight after a moment
        setTimeout(() => {
          if (isBookmarkOnCurrentPage(positionToHighlight)) {
            addBookmarkHighlight(positionToHighlight, colorToUse)
          }
        }, 500)
      }
    } catch (error) {
      console.error('Error adding bookmark:', error)
      alert('Gagal menambahkan bookmark.')
    }
  }

  const handleDeleteBookmark = async (bookmarkId) => {
    if (!confirm('Hapus bookmark ini?')) return

    const bookmark = bookmarks.find(b => b.id === bookmarkId)
    const success = await deleteBookmark(bookmarkId)

    if (success) {
      if (bookmark?.position) removeBookmarkHighlight(bookmark.position)
      alert('Bookmark berhasil dihapus!')
    } else {
      alert('Gagal menghapus bookmark.')
    }
  }

  const handleGoToBookmark = async (bookmark) => {
    if (!state.rendition || !bookmark.position) return

    try {
      // Extract base CFI for navigation (remove range part)
      // Range CFI: epubcfi(/6/10!/4/2/32,/1:21,/1:38)
      // Base CFI: epubcfi(/6/10!/4/2/32)
      let navCfi = bookmark.position
      if (navCfi.includes(',')) {
        // Extract the base part before the first comma
        navCfi = navCfi.split(',')[0] + ')'
      }

      console.log('Navigating to CFI:', navCfi)

      // Navigate to bookmark position using base CFI
      await state.rendition.display(navCfi)

      // Wait for page to render, then apply highlight using full CFI
      setTimeout(() => {
        if (bookmark.position && isBookmarkOnCurrentPage(bookmark.position)) {
          addBookmarkHighlight(bookmark.position, bookmark.color)
        }
      }, 800)

      setState(prev => ({ ...prev, activePanel: null }))
    } catch (error) {
      console.error('Error navigating to bookmark:', error)

      // Try alternative method: navigate to page number
      if (bookmark.page && state.book) {
        try {
          const spineItem = state.book.spine.get(bookmark.page - 1)
          if (spineItem) {
            await state.rendition.display(spineItem.href)
            setState(prev => ({ ...prev, activePanel: null }))

            // Apply highlight after navigation
            setTimeout(() => {
              if (bookmark.position && isBookmarkOnCurrentPage(bookmark.position)) {
                addBookmarkHighlight(bookmark.position, bookmark.color)
              }
            }, 800)
            return
          }
        } catch (altError) {
          console.error('Alternative navigation failed:', altError)
        }
      }

      alert('Tidak dapat membuka bookmark. Posisi mungkin tidak valid.')
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
          zIndex: 1000,
          maxWidth: isMobile ? '280px' : '320px',
          width: 'max-content'
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
            <div className="page-info-center" title={state.currentChapterTitle || `Halaman ${state.currentPage} dari ${state.totalPages}`}>
              {state.currentChapterTitle || (isMobile ? `${state.currentPage}/${state.totalPages}` : `Halaman ${state.currentPage} dari ${state.totalPages}`)}
            </div>
            <button className="nav-corner-button" onClick={() => handleNavigation('next')} title="Halaman Selanjutnya">›</button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default EpubReader