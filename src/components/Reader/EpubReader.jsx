import React, { useEffect, useRef, useState, useCallback } from 'react'
import ePub from 'epubjs'
import { useTheme } from '../../hooks/useTheme'

const EpubReader = ({ bookData }) => {
  const { theme } = useTheme()
  const bookRef = useRef(null)
  const readerContainerRef = useRef(null)
  const dropdownRef = useRef(null)

  const [state, setState] = useState({
    book: null,
    rendition: null,
    toc: [],
    fontSize: 16,
    readingMode: 'default',
    isLoading: true,
    progress: 0,
    tocOpen: false,
    currentPage: 1,
    totalPages: 0,
    selectedText: '',
    selectedRange: null,
    showFloatingToolbar: false,
    activePanel: null
  })

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

  const handleTextSelection = useCallback(() => {
    if (!state.rendition) return
    try {
      const selection = state.rendition.getSelection ? state.rendition.getSelection() : null
      if (selection && selection.toString().trim()) {
        setState(prev => ({
          ...prev,
          selectedText: selection.toString().trim(),
          selectedRange: selection.cfiRange,
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
  }, [state.rendition])

  // Initialize EPUB
  useEffect(() => {
    if (!bookData?.fileUrl) return

    setState(prev => ({ ...prev, isLoading: true }))
    const epubBook = ePub(bookData.fileUrl)

    const rend = epubBook.renderTo(bookRef.current, {
      width: '100%',
      height: '700px',
      allowScriptedContent: true
    })

    // Base styles
    rend.themes.default({
      body: { 'font-family': 'inherit !important', 'line-height': '1.6 !important', 'padding': '2rem !important' },
      p: { 'margin': '0 !important', 'text-align': 'justify !important' },
      a: { 'text-decoration': 'underline !important', 'color': 'inherit !important' }
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
          totalPages: epubBook.spine.length
        }))
      }
    })

    rend.on('rendered', () => {
      setState(prev => ({ ...prev, isLoading: false }))
      try {
        rend.on('selected', handleTextSelection)
      } catch (error) {
        // Text selection not supported
      }
    })

    setState(prev => ({ ...prev, book: epubBook, rendition: rend }))

    return () => {
      rend.destroy()
      epubBook.destroy()
    }
  }, [bookData?.fileUrl])

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
    state.rendition.themes.override('body', 'padding: 2rem !important;')
  }, [theme, state.rendition, state.readingMode])

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

  const handleNavigation = (direction) => {
    if (state.rendition) {
      state.rendition[direction]()
    }
  }

  const goToChapter = async (href, item) => {
    if (!href || href === '#' || !state.rendition || !state.book) return

    try {
      // Try multiple navigation methods
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
      // Don't show alert for failed navigation, just close TOC
      setState(prev => ({ ...prev, tocOpen: false }))
    }
  }

  const handleFontSizeChange = (delta) => {
    setState(prev => ({ ...prev, fontSize: Math.max(12, Math.min(32, prev.fontSize + delta)) }))
  }

  const toggleReadingMode = () => {
    setState(prev => ({ ...prev, readingMode: prev.readingMode === 'cream' ? 'default' : 'cream' }))
  }

  const handleHighlight = async (color = '#ffff00') => {
    alert('Fitur akan segera tersedia!')
  }

  const handleAction = (action, data) => {
    const actions = {
      bookmark: () => {
        alert('Fitur akan segera tersedia!')
        setState(prev => ({ ...prev, showFloatingToolbar: false }))
      },
      note: (content) => {
        alert('Fitur akan segera tersedia!')
        setState(prev => ({ ...prev, showFloatingToolbar: false, activePanel: null }))
      },
      translate: () => {
        alert('Fitur akan segera tersedia!')
        setState(prev => ({ ...prev, activePanel: 'translation' }))
      },
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
      {/* Controls */}
      <div className="card reader-controls">
        <div className="reader-control-group">
          {/* TOC Dropdown */}
          <div className="toc-dropdown" ref={dropdownRef}>
            <button className="btn btn-secondary" onClick={() => setState(prev => ({ ...prev, tocOpen: !prev.tocOpen }))}>
              Daftar Isi <span className={`dropdown-arrow ${state.tocOpen ? 'open' : ''}`}>▼</span>
            </button>
            {state.tocOpen && (
              <div className="dropdown-menu">
                <div className="dropdown-header">Daftar Isi</div>
                <div className="dropdown-content">
                  {state.toc.length > 0 ? (
                    state.toc.map((item, idx) => (
                      <button key={idx} className="dropdown-item" onClick={() => goToChapter(item.href, item)}
                        disabled={item.href === '#'} style={{ paddingLeft: `${1 + (item.level || 0) * 0.75}rem` }}>
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
              Mode
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
        <div className="floating-toolbar card">
          {highlightColors.map(({ color, icon, title }) => (
            <button key={color} className="btn btn-secondary btn-small" onClick={() => handleHighlight(color)} title={title}>
              {icon}
            </button>
          ))}
          <button className="btn btn-secondary btn-small" onClick={() => handleAction('bookmark')} title="Bookmark">🔖</button>
          <button className="btn btn-secondary btn-small" title="Tambah Catatan"
            onClick={() => { const content = prompt('Masukkan catatan:'); if (content) handleAction('note', content) }}>📝</button>
          <button className="btn btn-secondary btn-small" onClick={() => handleAction('translate')} title="Terjemahan">🌐</button>
          <button className="btn btn-secondary btn-small" onClick={() => setState(prev => ({ ...prev, showFloatingToolbar: false }))} title="Tutup">✖️</button>
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
              {state.activePanel === 'search' ? (
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

      {/* Main Reading Container with Side Navigation */}
      <div className="card epub-reader-content" style={{ position: 'relative' }}>
        {/* Previous Button - Left Side */}
        <button
          className="nav-side-button nav-prev"
          onClick={() => handleNavigation('prev')}
          style={{
            position: 'absolute',
            left: '8px',
            top: '50%',
            transform: 'translateY(-50%)',
            zIndex: 10,
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            border: '2px solid',
            background: 'rgba(255, 255, 255, 0.9)',
            color: 'var(--primary-green)',
            borderColor: 'var(--primary-green)',
            fontSize: '18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            fontWeight: 'bold'
          }}
          onMouseEnter={(e) => {
            e.target.style.background = 'var(--primary-green)'
            e.target.style.color = 'white'
            e.target.style.transform = 'translateY(-50%) scale(1.05)'
          }}
          onMouseLeave={(e) => {
            e.target.style.background = 'rgba(255, 255, 255, 0.9)'
            e.target.style.color = 'var(--primary-green)'
            e.target.style.transform = 'translateY(-50%) scale(1)'
          }}
        >
          ‹
        </button>

        {/* Reader Viewport */}
        <div className="reader-viewport-container" style={{ margin: '0 60px' }}>
          <div ref={bookRef} className="epub-reader-viewport" tabIndex={0}>
            {state.isLoading && <div className="loading">Memuat konten ebook...</div>}
          </div>
        </div>

        {/* Next Button - Right Side */}
        <button
          className="nav-side-button nav-next"
          onClick={() => handleNavigation('next')}
          style={{
            position: 'absolute',
            right: '8px',
            top: '50%',
            transform: 'translateY(-50%)',
            zIndex: 10,
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            border: '2px solid',
            background: 'rgba(255, 255, 255, 0.9)',
            color: 'var(--primary-green)',
            borderColor: 'var(--primary-green)',
            fontSize: '18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            fontWeight: 'bold'
          }}
          onMouseEnter={(e) => {
            e.target.style.background = 'var(--primary-green)'
            e.target.style.color = 'white'
            e.target.style.transform = 'translateY(-50%) scale(1.05)'
          }}
          onMouseLeave={(e) => {
            e.target.style.background = 'rgba(255, 255, 255, 0.9)'
            e.target.style.color = 'var(--primary-green)'
            e.target.style.transform = 'translateY(-50%) scale(1)'
          }}
        >
          ›
        </button>


      </div>


    </div>
  )
}

export default EpubReader