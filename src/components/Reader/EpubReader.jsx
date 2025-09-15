import React, { useEffect, useRef, useState } from 'react'
import ePub from 'epubjs'
import { useTheme } from '../../hooks/useTheme'

const EpubReader = ({ bookData }) => {
  const { theme } = useTheme()
  const bookRef = useRef(null)
  const dropdownRef = useRef(null)
  const [book, setBook] = useState(null)
  const [rendition, setRendition] = useState(null)
  const [toc, setToc] = useState([])
  const [fontSize, setFontSize] = useState(16)
  const [readingMode, setReadingMode] = useState('default')
  const [isLoading, setIsLoading] = useState(true)
  const [progress, setProgress] = useState(0)
  const [tocOpen, setTocOpen] = useState(false)

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

  // Initialize EPUB
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

    epubBook.ready
      .then(() => rend.display(bookData.currentPosition || 0))
      .catch(() => setIsLoading(false))

    epubBook.loaded.navigation
      .then(nav => {
        if (nav.toc && Array.isArray(nav.toc)) {
          setToc(flattenToc(nav.toc))
        }
      })
      .catch(() => setToc([]))

    rend.on('relocated', loc => {
      const spineItem = epubBook.spine.get(loc.start.cfi)
      if (spineItem) {
        setProgress(Math.round((spineItem.index / Math.max(1, epubBook.spine.length - 1)) * 100))
      }
    })

    rend.on('rendered', () => setIsLoading(false))

    return () => {
      rend.destroy()
      epubBook.destroy()
    }
  }, [bookData?.fileUrl])

  // Update font size
  useEffect(() => {
    if (rendition) rendition.themes.fontSize(`${fontSize}px`)
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
    if (rendition) rendition[direction]()
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

  return (
    <div className="epub-reader">
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
        </div>
      </div>

      {/* Reader Content with Floating Navigation */}
      <div className="epub-reader-content">
        {/* Floating Navigation Buttons */}
        <button
          className="floating-nav-btn prev"
          onClick={() => handleNavigation('prev')}
          aria-label="Halaman Sebelumnya"
        >
          ←
        </button>

        <button
          className="floating-nav-btn next"
          onClick={() => handleNavigation('next')}
          aria-label="Halaman Selanjutnya"
        >
          →
        </button>

        <div ref={bookRef} className="epub-reader-viewport" tabIndex={0}>
          {isLoading && (
            <div className="loading">Memuat konten ebook...</div>
          )}
        </div>
      </div>

      {/* Progress */}
      <div className="card progress-section">
        <div className="progress-text">Progres Membaca: {progress}%</div>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${progress}%` }} />
        </div>
      </div>

      {/* Navigation - Kept for mobile fallback */}
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