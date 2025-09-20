import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import ePub from 'epubjs'
import { useTheme } from '../../hooks/useTheme'
import { bookService } from '../../services/bookService'
import BookmarkPanel from './BookmarkPanel'
import HighlightPanel from './HighlightPanel'
import NotesPanel from './NotesPanel'
import SearchPanel from './SearchPanel'
import TranslationPanel from './TranslationPanel'

const EpubReader = ({ bookData }) => {
  const { theme } = useTheme()
  const bookRef = useRef(null)
  const readerContainerRef = useRef(null)
  const dropdownRef = useRef(null)
  const saveProgressTimeout = useRef(null)
  const renditionRef = useRef(null)
  const bookInstanceRef = useRef(null)
  const touchStartX = useRef(0)
  const touchStartY = useRef(0)

  const [state, setState] = useState({
    book: null,
    rendition: null,
    toc: [],
    fontSize: 16,
    fontFamily: 'Georgia',
    lineHeight: 1.6,
    readingMode: 'default',
    isLoading: true,
    progress: 0,
    tocOpen: false,
    currentPage: 1,
    totalPages: 0,
    selectedText: '',
    selectedRange: null,
    showFloatingToolbar: false,
    activePanel: null,
    bookmarks: [],
    highlights: [],
    notes: [],
    searchResults: null,
    searching: false,
    translations: new Map(),
    translating: false,
    currentLocation: null,
    isFullscreen: false,
    isMobile: false
  })

  const [notification, setNotification] = useState(null)

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      const isMobile = window.innerWidth <= 768
      setState(prev => ({ ...prev, isMobile }))
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Fullscreen detection
  useEffect(() => {
    const handleFullscreenChange = () => {
      setState(prev => ({ ...prev, isFullscreen: !!document.fullscreenElement }))
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])

  const showNotification = useCallback((message, type = 'info') => {
    setNotification({ message, type, id: Date.now() })
    setTimeout(() => setNotification(null), 4000)
  }, [])

  // Flatten table of contents
  const flattenToc = useCallback((toc) => {
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
  }, [])

  // Auto-save progress
  const saveProgress = useCallback(async (location, pageNum, percentage) => {
    if (!bookData?.slug || !location) return

    if (saveProgressTimeout.current) {
      clearTimeout(saveProgressTimeout.current)
    }

    saveProgressTimeout.current = setTimeout(async () => {
      try {
        const progressData = {
          page: pageNum,
          position: location.start.cfi,
          percentage: Math.round(percentage),
          lastReadAt: new Date().toISOString(),
          totalPages: bookInstanceRef.current?.spine?.length || 0,
          chapterTitle: location.start.displayed?.page?.toString() || 'Chapter'
        }

        await bookService.saveReadingProgress(bookData.slug, progressData)
      } catch (error) {
        console.error('Error saving progress:', error)
      }
    }, 2000)
  }, [bookData?.slug])

  // Load user data
  const loadUserData = useCallback(async () => {
    if (!bookData?.slug) return

    try {
      const [bookmarksRes, highlightsRes, notesRes] = await Promise.allSettled([
        bookService.getBookmarks(bookData.slug),
        bookService.getHighlights(bookData.slug),
        bookService.getNotes(bookData.slug)
      ])

      setState(prev => ({
        ...prev,
        bookmarks: bookmarksRes.status === 'fulfilled' ? bookmarksRes.value.data || [] : [],
        highlights: highlightsRes.status === 'fulfilled' ? highlightsRes.value.data || [] : [],
        notes: notesRes.status === 'fulfilled' ? notesRes.value.data || [] : []
      }))

      // Apply highlights to the rendition
      if (renditionRef.current && highlightsRes.status === 'fulfilled') {
        const highlights = highlightsRes.value.data || []
        highlights.forEach(highlight => {
          try {
            if (renditionRef.current.annotations && highlight.startPosition && highlight.endPosition) {
              renditionRef.current.annotations.add('highlight', highlight.startPosition, highlight.endPosition, {
                id: highlight.id,
                color: highlight.color || '#ffff00'
              })
            }
          } catch (error) {
            console.warn('Could not apply highlight:', error)
          }
        })
      }
    } catch (error) {
      console.error('Error loading user data:', error)
    }
  }, [bookData?.slug])

  // Text selection handler
  const handleTextSelection = useCallback(() => {
    if (!renditionRef.current) return

    try {
      const selection = renditionRef.current.getSelection ? renditionRef.current.getSelection() : null
      if (selection && selection.toString().trim()) {
        setState(prev => ({
          ...prev,
          selectedText: selection.toString().trim(),
          selectedRange: selection.cfiRange || selection,
          showFloatingToolbar: true
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
      // Text selection not supported
    }
  }, [])

  // Touch/Swipe handlers for mobile
  const handleTouchStart = useCallback((e) => {
    if (!state.isMobile) return
    touchStartX.current = e.touches[0].clientX
    touchStartY.current = e.touches[0].clientY
  }, [state.isMobile])

  const handleTouchEnd = useCallback((e) => {
    if (!state.isMobile || !renditionRef.current) return

    const touchEndX = e.changedTouches[0].clientX
    const touchEndY = e.changedTouches[0].clientY
    const deltaX = touchStartX.current - touchEndX
    const deltaY = touchStartY.current - touchEndY

    // Only process horizontal swipes (avoid vertical scrolling)
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
      if (deltaX > 0) {
        // Swipe left - next page
        renditionRef.current.next()
      } else {
        // Swipe right - previous page
        renditionRef.current.prev()
      }
    }
  }, [state.isMobile])

  // Initialize EPUB
  useEffect(() => {
    if (!bookData?.fileUrl || !bookRef.current) return

    setState(prev => ({ ...prev, isLoading: true }))

    // Cleanup previous instance
    if (renditionRef.current) {
      renditionRef.current.destroy()
    }
    if (bookInstanceRef.current) {
      bookInstanceRef.current.destroy()
    }

    const epubBook = ePub(bookData.fileUrl)
    bookInstanceRef.current = epubBook

    const rend = epubBook.renderTo(bookRef.current, {
      width: '100%',
      height: state.isMobile ? '500px' : '600px',
      allowScriptedContent: true,
      flow: 'paginated'
    })
    renditionRef.current = rend

    // Apply base styles
    rend.themes.default({
      body: {
        'font-family': `Georgia, serif !important`,
        'line-height': `1.6 !important`,
        'padding': state.isMobile ? '1rem !important' : '2rem !important'
      },
      p: { 'margin': '0 0 1rem 0 !important', 'text-align': 'justify !important' },
      a: { 'text-decoration': 'underline !important', 'color': 'inherit !important' }
    })

    rend.themes.fontSize('16px')

    // Load TOC
    epubBook.loaded.navigation.then(nav => {
      if (nav.toc && Array.isArray(nav.toc)) {
        const flattenedToc = flattenToc(nav.toc)
        setState(prev => ({ ...prev, toc: flattenedToc }))
      }
    }).catch(() => setState(prev => ({ ...prev, toc: [] })))

    // Display book
    epubBook.ready.then(() => {
      const startPosition = bookData.currentPosition || 0
      return rend.display(startPosition)
    }).catch(() => setState(prev => ({ ...prev, isLoading: false })))

    // Handle events
    rend.on('relocated', (location) => {
      const spineItem = epubBook.spine.get(location.start.cfi)
      if (spineItem) {
        const newProgress = Math.round((spineItem.index / Math.max(1, epubBook.spine.length - 1)) * 100)
        const pageNum = spineItem.index + 1

        setState(prev => ({
          ...prev,
          progress: newProgress,
          currentPage: pageNum,
          totalPages: epubBook.spine.length,
          currentLocation: location
        }))

        // Auto-save progress
        saveProgress(location, pageNum, newProgress)
      }
    })

    rend.on('rendered', () => {
      setState(prev => ({
        ...prev,
        isLoading: false,
        book: epubBook,
        rendition: rend
      }))

      // Set up text selection
      try {
        rend.on('selected', handleTextSelection)
      } catch (error) {
        // Text selection not supported
      }

      // Add touch handlers for mobile
      if (bookRef.current) {
        bookRef.current.addEventListener('touchstart', handleTouchStart, { passive: true })
        bookRef.current.addEventListener('touchend', handleTouchEnd, { passive: true })
      }

      // Load user data after rendering
      setTimeout(() => {
        loadUserData()
      }, 1000)
    })

    // Keyboard navigation
    const handleKeyPress = (e) => {
      if (!renditionRef.current || state.activePanel) return

      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault()
          renditionRef.current.prev()
          break
        case 'ArrowRight':
          e.preventDefault()
          renditionRef.current.next()
          break
        case 'b':
        case 'B':
          if (e.ctrlKey || e.metaKey) return
          e.preventDefault()
          handlePanelToggle('bookmarks')
          break
        case 'h':
        case 'H':
          if (e.ctrlKey || e.metaKey) return
          e.preventDefault()
          handlePanelToggle('highlights')
          break
        case 'n':
        case 'N':
          if (e.ctrlKey || e.metaKey) return
          e.preventDefault()
          handlePanelToggle('notes')
          break
        case 'f':
        case 'F':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault()
            handlePanelToggle('search')
          }
          break
        case 'F11':
          e.preventDefault()
          toggleFullscreen()
          break
      }
    }

    document.addEventListener('keydown', handleKeyPress)

    return () => {
      if (saveProgressTimeout.current) {
        clearTimeout(saveProgressTimeout.current)
      }
      if (bookRef.current) {
        bookRef.current.removeEventListener('touchstart', handleTouchStart)
        bookRef.current.removeEventListener('touchend', handleTouchEnd)
      }
      document.removeEventListener('keydown', handleKeyPress)
      rend.destroy()
      epubBook.destroy()
      renditionRef.current = null
      bookInstanceRef.current = null
    }
  }, [bookData?.fileUrl, state.isMobile])

  // Update font settings
  useEffect(() => {
    if (renditionRef.current) {
      renditionRef.current.themes.fontSize(`${state.fontSize}px`)
      renditionRef.current.themes.default({
        body: {
          'font-family': `${state.fontFamily}, serif !important`,
          'line-height': `${state.lineHeight} !important`
        }
      })
    }
  }, [state.fontSize, state.fontFamily, state.lineHeight])

  // Apply themes
  useEffect(() => {
    if (!renditionRef.current) return

    const getThemeColors = () => {
      switch (state.readingMode) {
        case 'cream':
          return { color: '#704214', bg: '#f4ecd8', link: '#8B4513' }
        case 'night':
          return { color: '#c9d1d9', bg: '#0d1117', link: '#58a6ff' }
        default:
          return theme === 'dark'
            ? { color: '#ffffff', bg: '#1a1a1a', link: '#FFD700' }
            : { color: 'inherit', bg: 'inherit', link: '#225330' }
      }
    }

    const colors = getThemeColors()
    renditionRef.current.themes.override('color', colors.color)
    renditionRef.current.themes.override('background', colors.bg)
    renditionRef.current.themes.override('a', `color: ${colors.link} !important; text-decoration: underline !important;`)
  }, [theme, state.readingMode])

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setState(prev => ({ ...prev, tocOpen: false }))
      }
    }

    if (state.tocOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [state.tocOpen])

  // Close panel on escape key or outside click
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && state.activePanel) {
        setState(prev => ({ ...prev, activePanel: null }))
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [state.activePanel])

  // Event handlers
  const handleNavigation = useCallback((direction) => {
    if (renditionRef.current) {
      renditionRef.current[direction]()
    }
  }, [])

  const goToChapter = useCallback(async (href, item) => {
    if (!href || href === '#' || !renditionRef.current || !bookInstanceRef.current) return

    try {
      await renditionRef.current.display(href)
      setState(prev => ({ ...prev, tocOpen: false }))
    } catch (error) {
      console.warn('Navigation failed:', error)
      setState(prev => ({ ...prev, tocOpen: false }))
    }
  }, [])

  const handleFontChange = useCallback((property, value) => {
    setState(prev => ({ ...prev, [property]: value }))
  }, [])

  const handleReadingModeChange = useCallback(() => {
    const modes = ['default', 'cream', 'night']
    setState(prev => {
      const currentIndex = modes.indexOf(prev.readingMode)
      const nextMode = modes[(currentIndex + 1) % modes.length]
      return { ...prev, readingMode: nextMode }
    })
  }, [])

  // Bookmark functions
  const handleAddBookmark = useCallback(async () => {
    if (!state.currentLocation || !bookData?.slug) {
      showNotification('Tidak dapat menambahkan bookmark saat ini', 'error')
      return
    }

    try {
      const title = state.selectedText || `Halaman ${state.currentPage}`
      const bookmarkData = {
        title,
        page: state.currentPage,
        position: state.currentLocation.start.cfi,
        notes: '',
        chapterTitle: state.currentLocation.start.displayed?.page?.toString() || 'Chapter'
      }

      const response = await bookService.addBookmark(bookData.slug, bookmarkData)
      setState(prev => ({
        ...prev,
        bookmarks: [...prev.bookmarks, response.data],
        showFloatingToolbar: false,
        selectedText: ''
      }))

      showNotification('Bookmark berhasil ditambahkan!', 'success')
    } catch (error) {
      showNotification('Gagal menambahkan bookmark', 'error')
    }
  }, [state.currentLocation, state.currentPage, state.selectedText, bookData?.slug, showNotification])

  const handleBookmarkClick = useCallback(async (bookmark) => {
    if (renditionRef.current && bookmark.position) {
      try {
        await renditionRef.current.display(bookmark.position)
        setState(prev => ({ ...prev, activePanel: null }))
      } catch (error) {
        showNotification('Gagal navigasi ke bookmark', 'error')
      }
    }
  }, [showNotification])

  const handleBookmarkDelete = useCallback(async (bookmarkId) => {
    if (!bookData?.slug) return

    try {
      await bookService.deleteBookmark(bookData.slug, bookmarkId)
      setState(prev => ({
        ...prev,
        bookmarks: prev.bookmarks.filter(b => b.id !== bookmarkId)
      }))
      showNotification('Bookmark berhasil dihapus', 'success')
    } catch (error) {
      showNotification('Gagal menghapus bookmark', 'error')
    }
  }, [bookData?.slug, showNotification])

  // Highlight functions
  const handleHighlight = useCallback(async (color = '#ffff00') => {
    if (!state.selectedText || !state.selectedRange || !bookData?.slug) {
      showNotification('Pilih teks terlebih dahulu', 'warning')
      return
    }

    try {
      const highlightData = {
        text: state.selectedText,
        color,
        page: state.currentPage,
        startPosition: state.selectedRange.start || state.selectedRange,
        endPosition: state.selectedRange.end || state.selectedRange,
        notes: '',
        chapterTitle: state.currentLocation?.start.displayed?.page?.toString() || 'Chapter'
      }

      const response = await bookService.addHighlight(bookData.slug, highlightData)

      // Add to rendition
      if (renditionRef.current && renditionRef.current.annotations) {
        renditionRef.current.annotations.add('highlight', highlightData.startPosition, highlightData.endPosition, {
          id: response.data.id,
          color
        })
      }

      setState(prev => ({
        ...prev,
        highlights: [...prev.highlights, response.data],
        showFloatingToolbar: false,
        selectedText: '',
        selectedRange: null
      }))

      showNotification('Highlight berhasil ditambahkan!', 'success')
    } catch (error) {
      showNotification('Gagal menambahkan highlight', 'error')
    }
  }, [state.selectedText, state.selectedRange, state.currentPage, state.currentLocation, bookData?.slug, showNotification])

  const handleHighlightClick = useCallback(async (highlight) => {
    if (renditionRef.current && highlight.startPosition) {
      try {
        await renditionRef.current.display(highlight.startPosition)
        setState(prev => ({ ...prev, activePanel: null }))
      } catch (error) {
        showNotification('Gagal navigasi ke highlight', 'error')
      }
    }
  }, [showNotification])

  const handleHighlightDelete = useCallback(async (highlightId) => {
    if (!bookData?.slug) return

    try {
      await bookService.deleteHighlight(bookData.slug, highlightId)

      // Remove from rendition
      if (renditionRef.current && renditionRef.current.annotations) {
        renditionRef.current.annotations.remove(highlightId)
      }

      setState(prev => ({
        ...prev,
        highlights: prev.highlights.filter(h => h.id !== highlightId)
      }))
      showNotification('Highlight berhasil dihapus', 'success')
    } catch (error) {
      showNotification('Gagal menghapus highlight', 'error')
    }
  }, [bookData?.slug, showNotification])

  // Note functions
  const handleNoteAdd = useCallback(async (content) => {
    if (!bookData?.slug || !content.trim()) return

    try {
      const noteData = {
        title: content.split('\n')[0].substring(0, 50) + '...',
        content: content.trim(),
        page: state.currentPage,
        position: state.currentLocation?.start.cfi || '',
        chapterTitle: state.currentLocation?.start.displayed?.page?.toString() || 'Chapter'
      }

      const response = await bookService.addNote(bookData.slug, noteData)
      setState(prev => ({
        ...prev,
        notes: [...prev.notes, response.data]
      }))

      showNotification('Catatan berhasil ditambahkan!', 'success')
    } catch (error) {
      showNotification('Gagal menambahkan catatan', 'error')
    }
  }, [bookData?.slug, state.currentPage, state.currentLocation, showNotification])

  const handleNoteClick = useCallback(async (note) => {
    if (renditionRef.current && note.position) {
      try {
        await renditionRef.current.display(note.position)
        setState(prev => ({ ...prev, activePanel: null }))
      } catch (error) {
        showNotification('Gagal navigasi ke catatan', 'error')
      }
    }
  }, [showNotification])

  const handleNoteDelete = useCallback(async (noteId) => {
    if (!bookData?.slug) return

    try {
      await bookService.deleteNote(bookData.slug, noteId)
      setState(prev => ({
        ...prev,
        notes: prev.notes.filter(n => n.id !== noteId)
      }))
      showNotification('Catatan berhasil dihapus', 'success')
    } catch (error) {
      showNotification('Gagal menghapus catatan', 'error')
    }
  }, [bookData?.slug, showNotification])

  // Search functions
  const handleSearch = useCallback(async (query, page = 1, limit = 10) => {
    if (!bookData?.slug || !query.trim()) return

    setState(prev => ({ ...prev, searching: true }))

    try {
      const response = await bookService.searchInBook(bookData.slug, query.trim(), page, limit)
      setState(prev => ({
        ...prev,
        searchResults: response.data,
        searching: false
      }))
    } catch (error) {
      setState(prev => ({ ...prev, searching: false }))
      showNotification('Gagal mencari dalam buku', 'error')
    }
  }, [bookData?.slug, showNotification])

  const handleSearchResultClick = useCallback(async (result) => {
    if (renditionRef.current && result.cfi) {
      try {
        await renditionRef.current.display(result.cfi)
        setState(prev => ({ ...prev, activePanel: null }))
      } catch (error) {
        showNotification('Gagal navigasi ke hasil pencarian', 'error')
      }
    }
  }, [showNotification])

  // Translation functions
  const handleTranslate = useCallback(async (text, targetLanguage) => {
    if (!bookData?.slug || !text.trim()) return

    setState(prev => ({ ...prev, translating: true }))

    try {
      const response = await bookService.translateText(bookData.slug, {
        text: text.trim(),
        targetLanguage,
        sourceLanguage: 'auto',
        page: state.currentPage,
        position: state.currentLocation?.start.cfi || ''
      })

      const key = `${text}_${targetLanguage}`
      setState(prev => ({
        ...prev,
        translations: new Map(prev.translations.set(key, response.data)),
        translating: false
      }))
    } catch (error) {
      setState(prev => ({ ...prev, translating: false }))
      showNotification('Gagal menerjemahkan teks', 'error')
    }
  }, [bookData?.slug, state.currentPage, state.currentLocation, showNotification])

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      readerContainerRef.current?.requestFullscreen?.()
    } else {
      document.exitFullscreen?.()
    }
  }, [])

  const handlePanelToggle = useCallback((panel) => {
    setState(prev => ({
      ...prev,
      activePanel: prev.activePanel === panel ? null : panel,
      showFloatingToolbar: false,
      tocOpen: false
    }))
  }, [])

  const handlePanelClose = useCallback(() => {
    setState(prev => ({
      ...prev,
      activePanel: null
    }))
  }, [])

  // Panel backdrop click handler
  const handleBackdropClick = useCallback((e) => {
    if (e.target === e.currentTarget) {
      handlePanelClose()
    }
  }, [handlePanelClose])

  // Memoized values
  const controls = useMemo(() => [
    { id: 'bookmarks', icon: '🔖', title: 'Bookmark', count: state.bookmarks.length },
    { id: 'highlights', icon: '🖍️', title: 'Highlight', count: state.highlights.length },
    { id: 'notes', icon: '📝', title: 'Catatan', count: state.notes.length },
    { id: 'search', icon: '🔍', title: 'Pencarian', count: null }
  ], [state.bookmarks.length, state.highlights.length, state.notes.length])

  const highlightColors = useMemo(() => [
    { color: '#ffff00', icon: '🟡', title: 'Kuning' },
    { color: '#90EE90', icon: '🟢', title: 'Hijau' },
    { color: '#FFB6C1', icon: '🩷', title: 'Pink' },
    { color: '#87CEEB', icon: '🔵', title: 'Biru' },
    { color: '#DDA0DD', icon: '🟣', title: 'Ungu' }
  ], [])

  const fontFamilies = useMemo(() => [
    'Georgia', 'Times New Roman', 'Arial', 'Helvetica', 'Verdana', 'Roboto'
  ], [])

  return (
    <div className="epub-reader" ref={readerContainerRef}>
      {/* Notification */}
      {notification && (
        <div className={`notification notification-${notification.type}`}>
          <div className="notification-content">
            <span className="notification-message">{notification.message}</span>
          </div>
        </div>
      )}

      {/* Panel Backdrop for Mobile */}
      {state.activePanel && state.isMobile && (
        <div className="panel-backdrop" onClick={handleBackdropClick} />
      )}

      {/* Controls */}
      <div className="card reader-controls">
        <div className="reader-control-group">
          {/* TOC Dropdown */}
          <div className="toc-dropdown" ref={dropdownRef}>
            <button
              className="btn btn-secondary"
              onClick={() => setState(prev => ({ ...prev, tocOpen: !prev.tocOpen }))}
            >
              <span className="control-icon">📖</span>
              {!state.isMobile && <span>Daftar Isi</span>}
              <span className={`dropdown-arrow ${state.tocOpen ? 'open' : ''}`}>▼</span>
            </button>
            {state.tocOpen && (
              <div className="dropdown-menu">
                <div className="dropdown-header">Daftar Isi</div>
                <div className="dropdown-content">
                  {state.toc.length > 0 ? (
                    state.toc.map((item, idx) => (
                      <button
                        key={idx}
                        className="dropdown-item"
                        onClick={() => goToChapter(item.href, item)}
                        disabled={item.href === '#'}
                        style={{ paddingLeft: `${1 + (item.level || 0) * 0.75}rem` }}
                      >
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
            <button
              className="btn btn-secondary btn-small"
              onClick={() => handleFontChange('fontSize', Math.max(12, state.fontSize - 2))}
              title="Perkecil font"
            >
              A-
            </button>
            <span className="font-size-display">{state.fontSize}px</span>
            <button
              className="btn btn-secondary btn-small"
              onClick={() => handleFontChange('fontSize', Math.min(32, state.fontSize + 2))}
              title="Perbesar font"
            >
              A+
            </button>

            {!state.isMobile && (
              <select
                className="form-control font-select"
                value={state.fontFamily}
                onChange={(e) => handleFontChange('fontFamily', e.target.value)}
                title="Pilih jenis font"
              >
                {fontFamilies.map(font => (
                  <option key={font} value={font}>{font}</option>
                ))}
              </select>
            )}

            <button
              className="btn btn-secondary btn-small"
              onClick={handleReadingModeChange}
              title={`Mode: ${state.readingMode}`}
            >
              {state.readingMode === 'cream' ? '📄' : state.readingMode === 'night' ? '🌙' : '☀️'}
            </button>
          </div>

          {/* Feature Controls */}
          <div className="feature-controls">
            {controls.map(control => (
              <button
                key={control.id}
                className={`btn btn-secondary btn-small ${state.activePanel === control.id ? 'active' : ''}`}
                onClick={() => handlePanelToggle(control.id)}
                title={control.title}
              >
                <span className="control-icon">{control.icon}</span>
                {!state.isMobile && <span className="control-label">{control.title}</span>}
                {control.count !== null && control.count > 0 && (
                  <span className="control-count">{control.count}</span>
                )}
              </button>
            ))}

            <button
              className="btn btn-secondary btn-small"
              onClick={toggleFullscreen}
              title="Fullscreen"
            >
              <span className="control-icon">⛶</span>
              {!state.isMobile && <span>Fullscreen</span>}
            </button>
          </div>
        </div>
      </div>

      {/* Floating Toolbar */}
      {state.showFloatingToolbar && state.selectedText && !state.activePanel && (
        <div className={`floating-toolbar card ${state.isMobile ? 'mobile' : ''}`}>
          <div className="toolbar-section">
            <span className="toolbar-title">Highlight:</span>
            {highlightColors.map(({ color, icon, title }) => (
              <button
                key={color}
                className="btn btn-secondary btn-small"
                onClick={() => handleHighlight(color)}
                title={title}
              >
                {icon}
              </button>
            ))}
          </div>

          <div className="toolbar-divider"></div>

          <div className="toolbar-section">
            <button
              className="btn btn-secondary btn-small"
              onClick={handleAddBookmark}
              title="Bookmark"
            >
              🔖
            </button>
            <button
              className="btn btn-secondary btn-small"
              onClick={() => handlePanelToggle('notes')}
              title="Tambah Catatan"
            >
              📝
            </button>
            <button
              className="btn btn-secondary btn-small"
              onClick={() => handlePanelToggle('translation')}
              title="Terjemahan"
            >
              🌐
            </button>
          </div>

          <button
            className="btn btn-secondary btn-small toolbar-close"
            onClick={() => setState(prev => ({ ...prev, showFloatingToolbar: false }))}
            title="Tutup"
          >
            ✖️
          </button>
        </div>
      )}

      {/* Side Panels - Fixed positioning and z-index */}
      {state.activePanel && (
        <div className={`panel-container ${state.isMobile ? 'mobile' : 'desktop'}`}>
          {state.activePanel === 'bookmarks' && (
            <BookmarkPanel
              bookmarks={state.bookmarks}
              onBookmarkClick={handleBookmarkClick}
              onBookmarkDelete={handleBookmarkDelete}
              onClose={handlePanelClose}
              isMobile={state.isMobile}
            />
          )}

          {state.activePanel === 'highlights' && (
            <HighlightPanel
              highlights={state.highlights}
              onHighlightClick={handleHighlightClick}
              onHighlightDelete={handleHighlightDelete}
              onClose={handlePanelClose}
              isMobile={state.isMobile}
            />
          )}

          {state.activePanel === 'notes' && (
            <NotesPanel
              notes={state.notes}
              onNoteAdd={handleNoteAdd}
              onNoteClick={handleNoteClick}
              onNoteDelete={handleNoteDelete}
              onClose={handlePanelClose}
              selectedText={state.selectedText}
              isMobile={state.isMobile}
            />
          )}

          {state.activePanel === 'search' && (
            <SearchPanel
              searchResults={state.searchResults}
              onSearch={handleSearch}
              searching={state.searching}
              onResultClick={handleSearchResultClick}
              onClose={handlePanelClose}
              isMobile={state.isMobile}
            />
          )}

          {state.activePanel === 'translation' && (
            <TranslationPanel
              selectedText={state.selectedText}
              onTranslate={handleTranslate}
              translations={state.translations}
              translating={state.translating}
              onClose={handlePanelClose}
              isMobile={state.isMobile}
            />
          )}
        </div>
      )}

      {/* Reader Content */}
      <div className="epub-reader-content">
        <div className="reader-viewport-container">
          <div
            ref={bookRef}
            className="epub-reader-viewport"
            tabIndex={0}
            role="main"
            aria-label="E-book content"
          >
            {state.isLoading && (
              <div className="loading">
                <div className="loading-spinner"></div>
                <p>Memuat konten ebook...</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Progress Section */}
      <div className="card progress-section">
        <div className="progress-info">
          <div className="progress-text">
            Progres Membaca: {state.progress}%
            {state.totalPages > 0 && (
              <span className="page-info"> | Halaman {state.currentPage} dari {state.totalPages}</span>
            )}
          </div>
          <div className="reading-stats">
            <small>Waktu membaca: {Math.round(state.progress * 0.3)} menit</small>
          </div>
        </div>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${state.progress}%` }} />
        </div>
      </div>

      {/* Navigation */}
      <nav className="card navigation-section" role="navigation" aria-label="Page navigation">
        <button
          className="btn btn-primary nav-btn"
          onClick={() => handleNavigation('prev')}
          disabled={state.currentPage <= 1}
          aria-label="Previous page"
        >
          <span className="nav-icon">←</span>
          {!state.isMobile && <span>Sebelumnya</span>}
        </button>
        <div className="page-indicator">
          <span>{state.currentPage} / {state.totalPages}</span>
        </div>
        <button
          className="btn btn-primary nav-btn"
          onClick={() => handleNavigation('next')}
          disabled={state.currentPage >= state.totalPages}
          aria-label="Next page"
        >
          {!state.isMobile && <span>Selanjutnya</span>}
          <span className="nav-icon">→</span>
        </button>
      </nav>

      {/* Keyboard Shortcuts Info - Hidden on mobile */}
      {!state.isMobile && (
        <div className="keyboard-shortcuts">
          <details>
            <summary>Pintasan Keyboard</summary>
            <div className="shortcuts-grid">
              <div><kbd>←</kbd> Halaman sebelumnya</div>
              <div><kbd>→</kbd> Halaman selanjutnya</div>
              <div><kbd>Ctrl + F</kbd> Pencarian</div>
              <div><kbd>B</kbd> Bookmark</div>
              <div><kbd>H</kbd> Highlight</div>
              <div><kbd>N</kbd> Catatan</div>
              <div><kbd>F11</kbd> Fullscreen</div>
            </div>
          </details>
        </div>
      )}

      {/* Mobile swipe instructions */}
      {state.isMobile && (
        <div className="mobile-instructions">
          <small>💡 Geser kiri/kanan pada teks untuk ganti halaman</small>
        </div>
      )}
    </div>
  )
}

export default EpubReader