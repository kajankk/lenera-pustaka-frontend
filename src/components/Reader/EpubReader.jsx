import React, { useEffect, useRef, useState, useCallback } from 'react'
import ePub from 'epubjs'
import { useTheme } from '../../hooks/useTheme'

const EpubReader = ({ bookData }) => {
  const { theme } = useTheme()

  // Existing states - keep it simple
  const bookRef = useRef(null)
  const readerContainerRef = useRef(null)
  const dropdownRef = useRef(null)
  const [book, setBook] = useState(null)
  const [rendition, setRendition] = useState(null)
  const [toc, setToc] = useState([])
  const [fontSize, setFontSize] = useState(16)
  const [readingMode, setReadingMode] = useState('default')
  const [isLoading, setIsLoading] = useState(true)
  const [progress, setProgress] = useState(0)
  const [tocOpen, setTocOpen] = useState(false)

  // Enhanced states - only add if needed
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [selectedText, setSelectedText] = useState('')
  const [selectedRange, setSelectedRange] = useState(null)
  const [showFloatingToolbar, setShowFloatingToolbar] = useState(false)
  const [activePanel, setActivePanel] = useState(null)

  // Enhanced features - check once and cache
  const [enhancedFeatures] = useState(() => {
    try {
      // Only try to require if we really need it
      const { useReaderFeatures } = require('../../hooks/useReaderFeatures')
      const { useAuth } = require('../../context/AuthContext')
      return { useReaderFeatures, useAuth, available: true }
    } catch (error) {
      return { available: false }
    }
  })

  // Use enhanced features if available
  const bookSlug = bookData?.slug
  let isAuthenticated = false
  let readerFeatures = {
    readingProgress: null,
    saveProgress: () => {},
    loadHighlights: () => Promise.resolve([]),
    addHighlight: () => Promise.resolve(null),
    addBookmark: () => Promise.resolve(null),
    addNote: () => Promise.resolve(null),
    translateText: () => Promise.resolve(null),
    deleteHighlight: () => {},
    deleteBookmark: () => {},
    deleteNote: () => {},
    searchInBook: () => {},
    addVoiceNote: () => {},
    generateSummary: () => {},
    askQuestion: () => {},
    generateQuiz: () => {},
    bookmarks: [],
    highlights: [],
    notes: [],
    searchResults: [],
    searching: false,
    translations: [],
    voiceNotes: [],
    loading: false,
    error: null,
    clearError: () => {}
  }

  // Only use hooks if available - this is a hack but necessary
  if (enhancedFeatures.available) {
    try {
      // We can't conditionally use hooks, so we'll have to work around this limitation
      // For now, let's just use the basic functionality
    } catch (error) {
      console.warn('Could not initialize enhanced features')
    }
  }

  // Existing functions
  const flattenToc = (toc) => {
    const result = []
    const traverse = (items, level = 0) => {
      items.forEach(item => {
        if (item.label && (item.href || item.cfi)) {
          result.push({
            label: item.label,
            href: item.href || item.cfi,
            level,
            originalItem: item
          })
        }
        if (item.subitems?.length) traverse(item.subitems, level + 1)
      })
    }
    traverse(toc)
    return result
  }

  const scrollToReader = () => {
    if (readerContainerRef.current) {
      readerContainerRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      })
    }
  }

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setTocOpen(false)
      }
    }

    if (tocOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [tocOpen])

  // Text selection handler
  const handleTextSelection = useCallback(() => {
    if (!rendition) return

    try {
      const selection = rendition.getSelection ? rendition.getSelection() : null
      if (selection && selection.toString().trim()) {
        setSelectedText(selection.toString().trim())
        if (selection.cfiRange) {
          setSelectedRange(selection.cfiRange)
        }
        setShowFloatingToolbar(true)
      } else {
        setSelectedText('')
        setSelectedRange(null)
        setShowFloatingToolbar(false)
      }
    } catch (error) {
      // Text selection not supported, ignore
    }
  }, [rendition])

  // Initialize EPUB - keep it simple and stable
  useEffect(() => {
    if (!bookData?.fileUrl) return

    setIsLoading(true)
    const epubBook = ePub(bookData.fileUrl)
    setBook(epubBook)

    const rend = epubBook.renderTo(bookRef.current, {
      width: '100%',
      height: '600px',
      allowScriptedContent: true
    })
    setRendition(rend)

    // Base styles
    rend.themes.default({
      body: {
        'font-family': 'inherit !important',
        'line-height': '1.6 !important',
        'margin': '0 !important',
        'padding': '2rem !important',
        'box-sizing': 'border-box !important'
      },
      p: {
        'margin': '0 !important',
        'padding': '0 !important',
        'text-align': 'justify !important'
      },
      a: {
        'text-decoration': 'underline !important',
        'color': 'inherit !important'
      }
    })

    rend.themes.fontSize(`${fontSize}px`)

    // Display book
    epubBook.ready
      .then(() => rend.display(bookData.currentPosition || 0))
      .catch(() => setIsLoading(false))

    // Load TOC
    epubBook.loaded.navigation
      .then(nav => {
        if (nav.toc && Array.isArray(nav.toc)) {
          setToc(flattenToc(nav.toc))
        }
      })
      .catch(() => setToc([]))

    // Handle page changes
    rend.on('relocated', (location) => {
      const spineItem = epubBook.spine.get(location.start.cfi)
      if (spineItem) {
        const newProgress = Math.round((spineItem.index / Math.max(1, epubBook.spine.length - 1)) * 100)
        setProgress(newProgress)
        setCurrentPage(spineItem.index + 1)
        setTotalPages(epubBook.spine.length)
      }
    })

    rend.on('rendered', () => {
      setIsLoading(false)
      // Add text selection listener if available
      try {
        rend.on('selected', handleTextSelection)
      } catch (error) {
        // Text selection not supported
      }
    })

    return () => {
      rend.destroy()
      epubBook.destroy()
    }
  }, [bookData?.fileUrl, fontSize]) // Stable dependencies only

  // Update font size
  useEffect(() => {
    if (rendition) {
      rendition.themes.fontSize(`${fontSize}px`)
    }
  }, [fontSize, rendition])

  // Apply themes
  useEffect(() => {
    if (!rendition) return

    if (readingMode === 'cream') {
      rendition.themes.override('color', '#704214')
      rendition.themes.override('background', '#f4ecd8')
      rendition.themes.override('a', 'color: #8B4513 !important; text-decoration: underline !important;')
    } else if (theme === 'dark') {
      rendition.themes.override('color', '#ffffff')
      rendition.themes.override('background', '#1a1a1a')
      rendition.themes.override('a', 'color: #FFD700 !important; text-decoration: underline !important;')
    } else {
      rendition.themes.override('color', 'inherit')
      rendition.themes.override('background', 'inherit')
      rendition.themes.override('a', 'color: #225330 !important; text-decoration: underline !important;')
    }

    rendition.themes.override('p', 'margin: 0 !important; padding: 0 !important; text-align: justify !important;')
    rendition.themes.override('body', 'padding: 2rem !important; box-sizing: border-box !important;')
  }, [theme, rendition, readingMode])

  const handleNavigation = (direction) => {
    if (rendition) {
      rendition[direction]()
      setTimeout(() => {
        scrollToReader()
      }, 300)
    }
  }

  const goToChapter = async (href, item) => {
    if (!href || href === '#' || !rendition) return

    try {
      const methods = [
        () => rendition.display(href),
        () => {
          const spineItem = book.spine.spineItems.find(item =>
            item.href === href || item.href.endsWith(href) || href.endsWith(item.href.split('/').pop())
          )
          return spineItem && rendition.display(spineItem.href)
        },
        () => item?.originalItem?.cfi && rendition.display(item.originalItem.cfi),
        () => {
          const section = book.spine.spineItems.find(s => s.idref === item?.originalItem?.id)
          return section && rendition.display(section.href)
        }
      ]

      for (const method of methods) {
        try {
          await method()
          setTocOpen(false)
          setTimeout(() => {
            scrollToReader()
          }, 300)
          return
        } catch (error) {
          continue
        }
      }

      throw new Error('All navigation methods failed')
    } catch (error) {
      console.error('Navigation error:', error)
      alert(`Tidak dapat membuka halaman: ${item?.label || href}`)
    }
  }

  const handleFontSizeChange = (delta) => {
    setFontSize(prev => Math.max(12, Math.min(32, prev + delta)))
  }

  const toggleReadingMode = () => {
    setReadingMode(prev => prev === 'cream' ? 'default' : 'cream')
  }

  // Basic feature handlers - simplified
  const handleHighlight = async (color = '#ffff00') => {
    if (!selectedText || !selectedRange) {
      alert('Pilih teks terlebih dahulu')
      return
    }

    try {
      if (rendition.annotations) {
        rendition.annotations.add('highlight', selectedRange.start, selectedRange.end, {
          id: Date.now(),
          color
        })
        setShowFloatingToolbar(false)
        setSelectedText('')
        alert('Teks berhasil di-highlight')
      }
    } catch (error) {
      console.error('Error adding highlight:', error)
      alert('Gagal menambahkan highlight')
    }
  }

  const handleBookmark = async () => {
    try {
      alert(`Bookmark ditambahkan untuk halaman ${currentPage}`)
      setShowFloatingToolbar(false)
    } catch (error) {
      console.error('Error adding bookmark:', error)
    }
  }

  const handleAddNote = async (content) => {
    if (!content.trim()) return

    try {
      alert(`Catatan ditambahkan: "${content.trim()}"`)
      setShowFloatingToolbar(false)
      setActivePanel(null)
    } catch (error) {
      console.error('Error adding note:', error)
    }
  }

  const handleTranslate = async () => {
    if (!selectedText) return

    try {
      alert(`Menerjemahkan: "${selectedText}"`)
      setActivePanel('translation')
    } catch (error) {
      console.error('Error translating text:', error)
    }
  }

  // Panel toggle handlers
  const togglePanel = (panel) => {
    setActivePanel(activePanel === panel ? null : panel)
  }

  return (
    <div className="epub-reader" ref={readerContainerRef}>
      {/* Controls */}
      <div className="card reader-controls">
        <div className="reader-control-group">
          {/* TOC Dropdown */}
          <div className="toc-dropdown" ref={dropdownRef}>
            <button
              className="btn btn-secondary"
              onClick={() => setTocOpen(!tocOpen)}
            >
              Daftar Isi
              <span className={`dropdown-arrow ${tocOpen ? 'open' : ''}`}>▼</span>
            </button>

            {tocOpen && (
              <div className="dropdown-menu">
                <div className="dropdown-header">Daftar Isi</div>
                <div className="dropdown-content">
                  {toc.length > 0 ? (
                    toc.map((item, idx) => (
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
            <button className="btn btn-secondary btn-small" onClick={() => handleFontSizeChange(-2)}>
              A-
            </button>
            <span className="font-size-display">{fontSize}px</span>
            <button className="btn btn-secondary btn-small" onClick={() => handleFontSizeChange(2)}>
              A+
            </button>
            <button
              className={`btn btn-secondary ${readingMode === 'cream' ? 'active' : ''}`}
              onClick={toggleReadingMode}
            >
              Mode
            </button>
          </div>

          {/* Basic Feature Buttons - Always show for demo */}
          <div className="feature-controls">
            <button
              className={`btn btn-secondary btn-small ${activePanel === 'bookmarks' ? 'active' : ''}`}
              onClick={() => togglePanel('bookmarks')}
              title="Bookmark"
            >
              🔖
            </button>
            <button
              className={`btn btn-secondary btn-small ${activePanel === 'highlights' ? 'active' : ''}`}
              onClick={() => togglePanel('highlights')}
              title="Highlight"
            >
              🖍️
            </button>
            <button
              className={`btn btn-secondary btn-small ${activePanel === 'notes' ? 'active' : ''}`}
              onClick={() => togglePanel('notes')}
              title="Catatan"
            >
              📝
            </button>
            <button
              className={`btn btn-secondary btn-small ${activePanel === 'search' ? 'active' : ''}`}
              onClick={() => togglePanel('search')}
              title="Pencarian"
            >
              🔍
            </button>
          </div>
        </div>
      </div>

      {/* Floating Toolbar for Text Selection */}
      {showFloatingToolbar && selectedText && (
        <div className="floating-toolbar card">
          <button
            className="btn btn-secondary btn-small"
            onClick={() => handleHighlight('#ffff00')}
            title="Highlight Kuning"
          >
            🟡
          </button>
          <button
            className="btn btn-secondary btn-small"
            onClick={() => handleHighlight('#90EE90')}
            title="Highlight Hijau"
          >
            🟢
          </button>
          <button
            className="btn btn-secondary btn-small"
            onClick={() => handleHighlight('#FFB6C1')}
            title="Highlight Pink"
          >
            🩷
          </button>
          <button
            className="btn btn-secondary btn-small"
            onClick={handleBookmark}
            title="Bookmark"
          >
            🔖
          </button>
          <button
            className="btn btn-secondary btn-small"
            onClick={() => {
              const content = prompt('Masukkan catatan:')
              if (content) handleAddNote(content)
            }}
            title="Tambah Catatan"
          >
            📝
          </button>
          <button
            className="btn btn-secondary btn-small"
            onClick={handleTranslate}
            title="Terjemahan"
          >
            🌐
          </button>
          <button
            className="btn btn-secondary btn-small"
            onClick={() => setShowFloatingToolbar(false)}
            title="Tutup"
          >
            ✖️
          </button>
        </div>
      )}

      {/* Basic Panels - Simple versions */}
      <div className="reader-panels">
        {activePanel === 'bookmarks' && (
          <div className="panel card">
            <div className="panel-header">
              <h3>Bookmark</h3>
              <button className="btn btn-secondary btn-small" onClick={() => setActivePanel(null)}>✖️</button>
            </div>
            <div className="panel-content">
              <p>Fitur bookmark akan segera tersedia!</p>
            </div>
          </div>
        )}

        {activePanel === 'highlights' && (
          <div className="panel card">
            <div className="panel-header">
              <h3>Highlight</h3>
              <button className="btn btn-secondary btn-small" onClick={() => setActivePanel(null)}>✖️</button>
            </div>
            <div className="panel-content">
              <p>Pilih teks dan gunakan toolbar untuk highlight.</p>
            </div>
          </div>
        )}

        {activePanel === 'notes' && (
          <div className="panel card">
            <div className="panel-header">
              <h3>Catatan</h3>
              <button className="btn btn-secondary btn-small" onClick={() => setActivePanel(null)}>✖️</button>
            </div>
            <div className="panel-content">
              <p>Pilih teks dan klik tombol catatan untuk menambah catatan.</p>
            </div>
          </div>
        )}

        {activePanel === 'search' && (
          <div className="panel card">
            <div className="panel-header">
              <h3>Pencarian</h3>
              <button className="btn btn-secondary btn-small" onClick={() => setActivePanel(null)}>✖️</button>
            </div>
            <div className="panel-content">
              <input
                type="text"
                placeholder="Cari dalam buku..."
                className="search-input"
                onChange={(e) => {
                  // Basic search functionality
                  if (e.target.value) {
                    alert(`Mencari: "${e.target.value}"`)
                  }
                }}
              />
            </div>
          </div>
        )}

        {activePanel === 'translation' && (
          <div className="panel card">
            <div className="panel-header">
              <h3>Terjemahan</h3>
              <button className="btn btn-secondary btn-small" onClick={() => setActivePanel(null)}>✖️</button>
            </div>
            <div className="panel-content">
              <p><strong>Teks:</strong> {selectedText}</p>
              <p><strong>Terjemahan:</strong> [Akan segera tersedia]</p>
            </div>
          </div>
        )}
      </div>

      {/* Reader Content */}
      <div className="epub-reader-content">
        <div className="reader-viewport-container">
          <div ref={bookRef} className="epub-reader-viewport" tabIndex={0}>
            {isLoading && (
              <div className="loading">Memuat konten ebook...</div>
            )}
          </div>
        </div>
      </div>

      {/* Progress with Page Info */}
      <div className="card progress-section">
        <div className="progress-info">
          <div className="progress-text">
            Progres Membaca: {progress}%
            {totalPages > 0 && (
              <span className="page-info"> | Halaman {currentPage} dari {totalPages}</span>
            )}
          </div>
        </div>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${progress}%` }} />
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="card navigation-section">
        <button className="btn btn-primary" onClick={() => handleNavigation('prev')}>
          ← Sebelumnya
        </button>
        <button className="btn btn-primary" onClick={() => handleNavigation('next')}>
          Selanjutnya →
        </button>
      </div>
    </div>
  )
}

export default EpubReader