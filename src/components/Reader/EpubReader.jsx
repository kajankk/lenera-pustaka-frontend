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
  const [showFullscreenControls, setShowFullscreenControls] = useState(false)

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
        case 'F11':
          e.preventDefault()
          break
      }
    }

    if (isFullscreen) {
      document.addEventListener('keydown', handleKeyDown)
      return () => document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isFullscreen, rendition])

  // Auto-hide fullscreen controls
  useEffect(() => {
    if (!isFullscreen) return

    let hideTimeout
    const showControls = () => {
      setShowFullscreenControls(true)
      clearTimeout(hideTimeout)
      hideTimeout = setTimeout(() => setShowFullscreenControls(false), 3000)
    }

    const handleMouseMove = () => showControls()
    const handleMouseEnter = () => showControls()

    // Show controls initially
    showControls()

    document.addEventListener('mousemove', handleMouseMove)

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      clearTimeout(hideTimeout)
    }
  }, [isFullscreen])

  // Touch event handlers for swipe navigation
  const handleTouchStart = (e) => {
    const touch = e.touches[0]
    setTouchStart({ x: touch.clientX, y: touch.clientY })
    setTouchEnd({ x: touch.clientX, y: touch.clientY })
  }

  const handleTouchMove = (e) => {
    const touch = e.touches[0]
    setTouchEnd({ x: touch.clientX, y: touch.clientY })
  }

  const handleTouchEnd = () => {
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

  // Click navigation for fullscreen
  const handleViewportClick = (e) => {
    if (!isFullscreen) return

    const rect = e.currentTarget.getBoundingClientRect()
    const clickX = e.clientX - rect.left
    const screenWidth = rect.width

    // Divide screen into three zones: left 30%, middle 40%, right 30%
    if (clickX < screenWidth * 0.3) {
      handleNavigation('prev')
    } else if (clickX > screenWidth * 0.7) {
      handleNavigation('next')
    }
    // Middle zone does nothing (for text selection, etc.)
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

      {/* Fullscreen Controls Overlay */}
      {isFullscreen && (
        <div
          style={{
            position: 'fixed',
            top: '0',
            left: '0',
            right: '0',
            zIndex: 10000,
            backgroundColor: 'rgba(0,0,0,0.95)',
            backdropFilter: 'blur(10px)',
            padding: '15px 20px',
            transform: showFullscreenControls ? 'translateY(0)' : 'translateY(-100%)',
            transition: 'transform 0.3s ease',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '15px'
          }}
          onMouseEnter={() => setShowFullscreenControls(true)}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px', flexWrap: 'wrap' }}>
            {/* TOC Dropdown */}
            <div className="toc-dropdown" ref={dropdownRef} style={{ position: 'relative' }}>
              <button
                onClick={() => setTocOpen(!tocOpen)}
                style={{
                  padding: '10px 15px',
                  backgroundColor: theme === 'dark' ? '#de96be' : '#225330',
                  color: theme === 'dark' ? '#1a1a1a' : '#ffffff',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 0.3s ease'
                }}
              >
                Daftar Isi
                <span style={{
                  transition: 'transform 0.3s ease',
                  transform: tocOpen ? 'rotate(180deg)' : 'rotate(0deg)'
                }}>▼</span>
              </button>

              {tocOpen && (
                <div
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 8px)',
                    left: '0',
                    width: '350px',
                    maxHeight: '400px',
                    backgroundColor: theme === 'dark' ? '#2d2d2d' : '#ffffff',
                    border: `2px solid ${theme === 'dark' ? '#de96be' : '#225330'}`,
                    borderRadius: '8px',
                    boxShadow: '0 8px 25px rgba(0,0,0,0.4)',
                    zIndex: 20000,
                    overflow: 'hidden'
                  }}
                >
                  <div
                    style={{
                      padding: '12px 16px',
                      borderBottom: `1px solid ${theme === 'dark' ? '#de96be' : '#225330'}`,
                      fontSize: '14px',
                      fontWeight: 'bold',
                      color: theme === 'dark' ? '#de96be' : '#225330'
                    }}
                  >
                    Daftar Isi
                  </div>
                  <div
                    style={{
                      maxHeight: '320px',
                      overflowY: 'auto',
                      padding: '8px 0'
                    }}
                  >
                    {toc.length > 0 ? (
                      toc.map((item, idx) => (
                        <button
                          key={idx}
                          onClick={() => goToChapter(item.href, item)}
                          disabled={item.href === '#'}
                          style={{
                            width: '100%',
                            padding: '8px 16px',
                            paddingLeft: `${16 + (item.level || 0) * 12}px`,
                            fontSize: '13px',
                            textAlign: 'left',
                            border: 'none',
                            backgroundColor: 'transparent',
                            color: theme === 'dark' ? '#ffffff' : '#000000',
                            cursor: item.href === '#' ? 'default' : 'pointer',
                            opacity: item.href === '#' ? 0.5 : 1,
                            transition: 'background-color 0.2s ease'
                          }}
                          onMouseEnter={(e) => {
                            if (item.href !== '#') {
                              e.target.style.backgroundColor = theme === 'dark' ? 'rgba(222, 150, 190, 0.1)' : 'rgba(34, 83, 48, 0.1)'
                            }
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.backgroundColor = 'transparent'
                          }}
                        >
                          {item.label}
                        </button>
                      ))
                    ) : (
                      <div
                        style={{
                          padding: '16px',
                          textAlign: 'center',
                          opacity: 0.6,
                          fontSize: '13px',
                          color: theme === 'dark' ? '#ffffff' : '#000000'
                        }}
                      >
                        Daftar isi tidak tersedia
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Font Controls */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                onClick={() => handleFontSizeChange(-2)}
                style={{
                  padding: '8px 12px',
                  backgroundColor: theme === 'dark' ? '#de96be' : '#225330',
                  color: theme === 'dark' ? '#1a1a1a' : '#ffffff',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600'
                }}
              >
                A-
              </button>
              <span style={{
                color: theme === 'dark' ? '#ffffff' : '#000000',
                fontSize: '14px',
                fontWeight: '500',
                minWidth: '45px',
                textAlign: 'center'
              }}>
                {fontSize}px
              </span>
              <button
                onClick={() => handleFontSizeChange(2)}
                style={{
                  padding: '8px 12px',
                  backgroundColor: theme === 'dark' ? '#de96be' : '#225330',
                  color: theme === 'dark' ? '#1a1a1a' : '#ffffff',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600'
                }}
              >
                A+
              </button>
              <button
                onClick={toggleReadingMode}
                style={{
                  padding: '8px 12px',
                  backgroundColor: readingMode === 'cream' ? (theme === 'dark' ? '#de96be' : '#225330') : 'transparent',
                  color: readingMode === 'cream' ? (theme === 'dark' ? '#1a1a1a' : '#ffffff') : (theme === 'dark' ? '#de96be' : '#225330'),
                  border: `2px solid ${theme === 'dark' ? '#de96be' : '#225330'}`,
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
              >
                Mode
              </button>
            </div>

            {/* Progress */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: '150px' }}>
              <span style={{
                color: theme === 'dark' ? '#ffffff' : '#000000',
                fontSize: '14px',
                opacity: 0.8
              }}>
                {progress}%
              </span>
              <div style={{
                flex: 1,
                height: '6px',
                backgroundColor: theme === 'dark' ? 'rgba(222, 150, 190, 0.3)' : 'rgba(34, 83, 48, 0.3)',
                borderRadius: '3px',
                overflow: 'hidden'
              }}>
                <div style={{
                  width: `${progress}%`,
                  height: '100%',
                  backgroundColor: theme === 'dark' ? '#de96be' : '#225330',
                  transition: 'width 0.3s ease'
                }} />
              </div>
            </div>
          </div>

          {/* Exit Button */}
          <button
            onClick={exitFullscreen}
            style={{
              padding: '10px 15px',
              backgroundColor: 'rgba(220, 38, 38, 0.9)',
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = '#dc2626'
              e.target.style.transform = 'scale(1.05)'
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = 'rgba(220, 38, 38, 0.9)'
              e.target.style.transform = 'scale(1)'
            }}
            title="Keluar dari Layar Penuh (ESC)"
          >
            ✕ Keluar
          </button>
        </div>
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
              borderRadius: 0,
              cursor: 'pointer'
            } : {}}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onClick={handleViewportClick}
          >
            {isLoading && (
              <div className="loading" style={isFullscreen ? {
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                fontSize: '1.2rem',
                zIndex: 1000
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

      {/* Fullscreen Instructions */}
      {isFullscreen && (
        <div
          style={{
            position: 'fixed',
            bottom: showFullscreenControls ? '20px' : '-100px',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: 'rgba(0,0,0,0.8)',
            color: 'white',
            padding: '12px 20px',
            borderRadius: '20px',
            fontSize: '13px',
            zIndex: 10000,
            transition: 'bottom 0.3s ease',
            pointerEvents: 'none',
            textAlign: 'center',
            maxWidth: '90vw'
          }}
        >
          Klik kiri/kanan layar, geser, atau gunakan panah keyboard • Arahkan mouse ke atas untuk kontrol • ESC untuk keluar
        </div>
      )}

      <style jsx>{`
        .fullscreen-mode {
          user-select: none;
          -webkit-user-select: none;
          -moz-user-select: none;
          -ms-user-select: none;
        }

        .fullscreen-mode .epub-reader-viewport {
          cursor: pointer !important;
        }
      `}</style>
    </div>
  )
}

export default EpubReader