import React, { useEffect, useRef, useState, useCallback } from 'react'
import * as pdfjsLib from 'pdfjs-dist'
import { useTheme } from '../../hooks/useTheme'

// Set worker path for PDF.js
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`

const PDFReader = ({ bookData }) => {
  const { theme } = useTheme()
  const canvasRef = useRef(null)
  const containerRef = useRef(null)
  const readerContainerRef = useRef(null)
  const dropdownRef = useRef(null)

  const [state, setState] = useState({
    pdfDoc: null,
    currentPage: 1,
    totalPages: 0,
    scale: 1.5,
    fontSize: 16,
    readingMode: 'default',
    isLoading: true,
    progress: 0,
    tocOpen: false,
    toc: [],
    selectedText: '',
    selectedRange: null,
    showFloatingToolbar: false,
    activePanel: null,
    searchText: '',
    searchResults: [],
    currentSearchIndex: 0
  })

  const readerContainerRefCallback = useCallback(() => {
    readerContainerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [])

  // Extract TOC from PDF
  const extractTOC = async (pdfDoc) => {
    try {
      const outline = await pdfDoc.getOutline()
      if (!outline) return []

      const flattenOutline = (items, level = 0) => {
        const result = []
        items.forEach(item => {
          if (item.title) {
            result.push({
              label: item.title,
              href: item.dest ? `page-${item.dest[0]}` : `page-1`,
              level,
              dest: item.dest,
              originalItem: item
            })
          }
          if (item.items?.length) {
            result.push(...flattenOutline(item.items, level + 1))
          }
        })
        return result
      }

      return flattenOutline(outline)
    } catch (error) {
      console.warn('Could not extract TOC:', error)
      return []
    }
  }

  // Render PDF page
  const renderPage = useCallback(async (pageNum) => {
    if (!state.pdfDoc || !canvasRef.current) return

    try {
      const page = await state.pdfDoc.getPage(pageNum)
      const canvas = canvasRef.current
      const context = canvas.getContext('2d')

      const viewport = page.getViewport({ scale: state.scale })
      canvas.height = viewport.height
      canvas.width = viewport.width

      // Apply theme-based styling
      if (state.readingMode === 'cream') {
        canvas.style.backgroundColor = '#f4ecd8'
        canvas.style.filter = 'sepia(0.1) contrast(1.1)'
      } else if (theme === 'dark') {
        canvas.style.backgroundColor = '#1a1a1a'
        canvas.style.filter = 'invert(1) hue-rotate(180deg)'
      } else {
        canvas.style.backgroundColor = '#ffffff'
        canvas.style.filter = 'none'
      }

      const renderContext = {
        canvasContext: context,
        viewport: viewport
      }

      await page.render(renderContext).promise

      // Update progress
      const progress = Math.round((pageNum / state.totalPages) * 100)
      setState(prev => ({ ...prev, progress, isLoading: false }))
    } catch (error) {
      console.error('Error rendering page:', error)
      setState(prev => ({ ...prev, isLoading: false }))
    }
  }, [state.pdfDoc, state.scale, state.readingMode, theme])

  // Handle text selection (simplified for PDF)
  const handleTextSelection = useCallback(() => {
    const selection = window.getSelection()
    if (selection && selection.toString().trim()) {
      setState(prev => ({
        ...prev,
        selectedText: selection.toString().trim(),
        showFloatingToolbar: true
      }))
    } else {
      setState(prev => ({
        ...prev,
        selectedText: '',
        showFloatingToolbar: false
      }))
    }
  }, [])

  // Initialize PDF
  useEffect(() => {
    if (!bookData?.fileUrl) return

    setState(prev => ({ ...prev, isLoading: true }))

    const loadPDF = async () => {
      try {
        const loadingTask = pdfjsLib.getDocument(bookData.fileUrl)
        const pdfDoc = await loadingTask.promise

        setState(prev => ({
          ...prev,
          pdfDoc,
          totalPages: pdfDoc.numPages,
          currentPage: bookData.currentPosition || 1
        }))

        // Extract TOC
        const toc = await extractTOC(pdfDoc)
        setState(prev => ({ ...prev, toc }))

        // Render initial page
        await renderPage(bookData.currentPosition || 1)
      } catch (error) {
        console.error('Error loading PDF:', error)
        setState(prev => ({ ...prev, isLoading: false }))
      }
    }

    loadPDF()
  }, [bookData?.fileUrl])

  // Re-render page when scale, current page, or theme changes
  useEffect(() => {
    if (state.pdfDoc && state.currentPage) {
      renderPage(state.currentPage)
    }
  }, [state.currentPage, state.scale, renderPage])

  // Add text selection listener
  useEffect(() => {
    document.addEventListener('mouseup', handleTextSelection)
    return () => document.removeEventListener('mouseup', handleTextSelection)
  }, [handleTextSelection])

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
    const newPage = direction === 'next'
      ? Math.min(state.currentPage + 1, state.totalPages)
      : Math.max(state.currentPage - 1, 1)

    if (newPage !== state.currentPage) {
      setState(prev => ({ ...prev, currentPage: newPage }))
      setTimeout(readerContainerRefCallback, 300)
    }
  }

  const goToPage = (pageNum) => {
    const page = Math.max(1, Math.min(pageNum, state.totalPages))
    if (page !== state.currentPage) {
      setState(prev => ({ ...prev, currentPage: page, tocOpen: false }))
      setTimeout(readerContainerRefCallback, 300)
    }
  }

  const goToChapter = async (href, item) => {
    try {
      if (item?.dest && Array.isArray(item.dest)) {
        // Try to get page number from destination
        const pageRef = item.dest[0]
        if (typeof pageRef === 'object' && pageRef.num) {
          const pageIndex = await state.pdfDoc.getPageIndex(pageRef)
          goToPage(pageIndex + 1)
        }
      } else if (href && href.includes('page-')) {
        const pageNum = parseInt(href.replace('page-', ''))
        if (!isNaN(pageNum)) {
          goToPage(pageNum)
        }
      }
    } catch (error) {
      console.warn('Navigation failed for:', href, error.message)
      setState(prev => ({ ...prev, tocOpen: false }))
    }
  }

  const handleScaleChange = (delta) => {
    setState(prev => ({
      ...prev,
      scale: Math.max(0.5, Math.min(3.0, prev.scale + delta))
    }))
  }

  const handleFontSizeChange = (delta) => {
    setState(prev => ({
      ...prev,
      fontSize: Math.max(12, Math.min(32, prev.fontSize + delta))
    }))
  }

  const toggleReadingMode = () => {
    setState(prev => ({
      ...prev,
      readingMode: prev.readingMode === 'cream' ? 'default' : 'cream'
    }))
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
      },
      search: async (searchTerm) => {
        if (!searchTerm || !state.pdfDoc) return
        alert('Fitur pencarian akan segera tersedia!')
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
                        style={{ paddingLeft: `${1 + (item.level || 0) * 0.75}rem` }}>
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

          {/* Font/Scale Controls */}
          <div className="font-controls">
            <button className="btn btn-secondary btn-small" onClick={() => handleScaleChange(-0.1)}>🔍-</button>
            <span className="font-size-display">{Math.round(state.scale * 100)}%</span>
            <button className="btn btn-secondary btn-small" onClick={() => handleScaleChange(0.1)}>🔍+</button>
            <button className={`btn btn-secondary ${state.readingMode === 'cream' ? 'active' : ''}`} onClick={toggleReadingMode}>
              Mode
            </button>
          </div>

          {/* Page Navigation */}
          <div className="page-controls">
            <input
              type="number"
              min="1"
              max={state.totalPages}
              value={state.currentPage}
              onChange={(e) => goToPage(parseInt(e.target.value))}
              className="page-input"
              style={{ width: '60px', textAlign: 'center' }}
            />
            <span>/ {state.totalPages}</span>
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
                  onChange={(e) => e.target.value && handleAction('search', e.target.value)} />
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

      {/* PDF Content */}
      <div className="epub-reader-content">
        <div className="reader-viewport-container" ref={containerRef}>
          <canvas
            ref={canvasRef}
            className="pdf-canvas"
            style={{
              maxWidth: '100%',
              height: 'auto',
              display: 'block',
              margin: '0 auto',
              border: '1px solid #ddd',
              borderRadius: '4px'
            }}
          />
          {state.isLoading && <div className="loading">Memuat konten PDF...</div>}
        </div>
      </div>

      {/* Progress */}
      <div className="card progress-section">
        <div className="progress-info">
          <div className="progress-text">
            Progres Membaca: {state.progress}%
            <span className="page-info"> | Halaman {state.currentPage} dari {state.totalPages}</span>
          </div>
        </div>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${state.progress}%` }} />
        </div>
      </div>

      {/* Navigation */}
      <div className="card navigation-section">
        <button
          className="btn btn-primary"
          onClick={() => handleNavigation('prev')}
          disabled={state.currentPage <= 1}
        >
          ← Sebelumnya
        </button>
        <button
          className="btn btn-primary"
          onClick={() => handleNavigation('next')}
          disabled={state.currentPage >= state.totalPages}
        >
          Selanjutnya →
        </button>
      </div>
    </div>
  )
}

export default PDFReader