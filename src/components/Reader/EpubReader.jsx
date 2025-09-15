import React, { useEffect, useRef, useState } from 'react'
import ePub from 'epubjs'
import { useTheme } from '../../hooks/useTheme'

const EpubReader = ({ bookData }) => {
  const { theme } = useTheme()
  const bookRef = useRef(null)
  const dropdownRef = useRef(null)
  const fullscreenContainerRef = useRef(null)
  const [book, setBook] = useState(null)
  const [rendition, setRendition] = useState(null)
  const [toc, setToc] = useState([])
  const [fontSize, setFontSize] = useState(16)
  const [readingMode, setReadingMode] = useState('default')
  const [isLoading, setIsLoading] = useState(true)
  const [progress, setProgress] = useState(0)
  const [tocOpen, setTocOpen] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)

  // Touch/swipe handling for fullscreen mode
  const [touchStart, setTouchStart] = useState({ x: 0, y: 0 })
  const [touchEnd, setTouchEnd] = useState({ x: 0, y: 0 })

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

  // Handle fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isCurrentlyFullscreen = Boolean(
        document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.mozFullScreenElement ||
        document.msFullscreenElement
      )

      if (!isCurrentlyFullscreen && isFullscreen) {
        setIsFullscreen(false)
      }
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange)
    document.addEventListener('mozfullscreenchange', handleFullscreenChange)
    document.addEventListener('MSFullscreenChange', handleFullscreenChange)

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange)
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange)
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange)
    }
  }, [isFullscreen])

  // Handle keyboard navigation in fullscreen
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isFullscreen) return

      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault()
          handleNavigation('prev')
          break
        case 'ArrowRight':
          e.preventDefault()
          handleNavigation('next')
          break
        case 'Escape':
          exitFullscreen()
          break
      }
    }

    if (isFullscreen) {
      document.addEventListener('keydown', handleKeyDown)
      return () => document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isFullscreen, rendition])

  // Touch event handlers for swipe navigation
  const handleTouchStart = (e) => {
    if (!isFullscreen) return
    const touch = e.touches[0]
    setTouchStart({ x: touch.clientX, y: touch.clientY })
    setTouchEnd({ x: touch.clientX, y: touch.clientY })
  }

  const handleTouchMove = (e) => {
    if (!isFullscreen) return
    const touch = e.touches[0]
    setTouchEnd({ x: touch.clientX, y: touch.clientY })
  }

  const handleTouchEnd = () => {
    if (!isFullscreen) return

    const deltaX = touchStart.x - touchEnd.x
    const deltaY = touchStart.y - touchEnd.y
    const minSwipeDistance = 50

    // Only trigger swipe if horizontal movement is greater than vertical
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > minSwipeDistance) {
      if (deltaX > 0) {
        // Swipe left - next page
        handleNavigation('next')
      } else {
        // Swipe right - previous page
        handleNavigation('prev')
      }
    }
  }

  // Initialize EPUB
  useEffect(() => {
    if (!bookData?.fileUrl) return

    setIsLoading(true)
    const epubBook = ePub(bookData.fileUrl)
    setBook(epubBook)

    const rend = epubBook.renderTo(bookRef.current, {
      width: '100%',
      height: isFullscreen ? '100vh' : '600px',
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

  // Update rendition when fullscreen changes
  useEffect(() => {
    if (rendition) {
      setTimeout(() => {
        rendition.resize()
      }, 100)
    }
  }, [isFullscreen, rendition])

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

  const enterFullscreen = async () => {
    const element = fullscreenContainerRef.current
    if (!element) return

    try {
      if (element.requestFullscreen) {
        await element.requestFullscreen()
      } else if (element.webkitRequestFullscreen) {
        await element.webkitRequestFullscreen()
      } else if (element.mozRequestFullScreen) {
        await element.mozRequestFullScreen()
      } else if (element.msRequestFullscreen) {
        await element.msRequestFullscreen()
      }
      setIsFullscreen(true)
    } catch (error) {
      console.error('Failed to enter fullscreen:', error)
    }
  }

  const exitFullscreen = async () => {
    try {
      if (document.exitFullscreen) {
        await document.exitFullscreen()
      } else if (document.webkitExitFullscreen) {
        await document.webkitExitFullscreen()
      } else if (document.mozCancelFullScreen) {
        await document.mozCancelFullScreen()
      } else if (document.msExitFullscreen) {
        await document.msExitFullscreen()
      }
    } catch (error) {
      console.error('Failed to exit fullscreen:', error)
    }
    setIsFullscreen(false)
  }

  return (
    <div
      ref={fullscreenContainerRef}
      className={`epub-reader ${isFullscreen ? 'fullscreen-mode' : ''}`}
      style={isFullscreen ? {
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 9999,
        backgroundColor: theme === 'dark' ? '#1a1a1a' : '#ffffff',
        overflow: 'hidden'
      } : {}}
    >
      {/* Controls - Hidden in fullscreen */}
      {!isFullscreen && (
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
              <button
                className="btn btn-secondary"
                onClick={enterFullscreen}
                title="Layar Penuh"
              >
                ⛶
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fullscreen Exit Button */}
      {isFullscreen && (
        <button
          onClick={exitFullscreen}
          style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            zIndex: 10000,
            padding: '10px 15px',
            backgroundColor: theme === 'dark' ? '#de96be' : '#225330',
            color: theme === 'dark' ? '#1a1a1a' : '#ffffff',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '600',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={(e) => {
            e.target.style.transform = 'scale(1.05)'
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = 'scale(1)'
          }}
          title="Keluar dari Layar Penuh (ESC)"
        >
          ✕ Keluar
        </button>
      )}

      {/* Reader Content */}
      <div className="epub-reader-content" style={isFullscreen ? {
        height: '100vh',
        display: 'flex',
        flexDirection: 'column'
      } : {}}>
        <div className="reader-viewport-container" style={isFullscreen ? {
          flex: 1,
          height: '100%'
        } : {}}>
          {/* Left Navigation Button - Hidden in fullscreen */}
          {!isFullscreen && (
            <button
              className="side-nav-button"
              onClick={() => handleNavigation('prev')}
              title="Halaman Sebelumnya"
            >
              ←
            </button>
          )}

          {/* Main Viewport */}
          <div
            ref={bookRef}
            className="epub-reader-viewport"
            tabIndex={0}
            style={isFullscreen ? {
              height: '100vh',
              width: '100vw',
              border: 'none',
              borderRadius: 0
            } : {}}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {isLoading && (
              <div className="loading" style={isFullscreen ? {
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                fontSize: '1.2rem'
              } : {}}>
                Memuat konten ebook...
              </div>
            )}
          </div>

          {/* Right Navigation Button - Hidden in fullscreen */}
          {!isFullscreen && (
            <button
              className="side-nav-button"
              onClick={() => handleNavigation('next')}
              title="Halaman Selanjutnya"
            >
              →
            </button>
          )}
        </div>
      </div>

      {/* Progress - Hidden in fullscreen */}
      {!isFullscreen && (
        <div className="card progress-section">
          <div className="progress-text">Progres Membaca: {progress}%</div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}

      {/* Bottom Navigation (Hidden on Desktop, Shown on Mobile) - Hidden in fullscreen */}
      {!isFullscreen && (
        <div className="card navigation-section">
          <button className="btn btn-primary" onClick={() => handleNavigation('prev')}>
            ← Sebelumnya
          </button>
          <button className="btn btn-primary" onClick={() => handleNavigation('next')}>
            Selanjutnya →
          </button>
        </div>
      )}

      {/* Fullscreen Instructions Overlay */}
      {isFullscreen && (
        <div
          style={{
            position: 'fixed',
            bottom: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: 'rgba(0,0,0,0.7)',
            color: 'white',
            padding: '10px 20px',
            borderRadius: '20px',
            fontSize: '14px',
            zIndex: 10000,
            opacity: 0.8,
            animation: 'fadeInOut 3s ease-in-out',
            pointerEvents: 'none'
          }}
        >
          Geser kiri/kanan atau gunakan panah keyboard untuk navigasi • ESC untuk keluar
        </div>
      )}

      <style jsx>{`
        @keyframes fadeInOut {
          0% { opacity: 0; transform: translateX(-50%) translateY(20px); }
          20% { opacity: 0.8; transform: translateX(-50%) translateY(0); }
          80% { opacity: 0.8; transform: translateX(-50%) translateY(0); }
          100% { opacity: 0; transform: translateX(-50%) translateY(-20px); }
        }

        .fullscreen-mode {
          user-select: none;
          -webkit-user-select: none;
          -moz-user-select: none;
          -ms-user-select: none;
        }

        .fullscreen-mode .epub-reader-viewport {
          cursor: grab;
        }

        .fullscreen-mode .epub-reader-viewport:active {
          cursor: grabbing;
        }
      `}</style>
    </div>
  )
}

export default EpubReader