import React, { useEffect, useRef, useState } from 'react';
import ePub from 'epubjs';
import { useTheme } from '../../hooks/useTheme';

const EpubReader = ({ bookData }) => {
  const { theme } = useTheme();
  const bookRef = useRef(null);
  const dropdownRef = useRef(null);
  const [book, setBook] = useState(null);
  const [rendition, setRendition] = useState(null);
  const [toc, setToc] = useState([]);
  const [fontSize, setFontSize] = useState(16);
  const [readingMode, setReadingMode] = useState('default');
  const [isLoading, setIsLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [tocOpen, setTocOpen] = useState(false);

  const flattenToc = (toc) => {
    const result = [];
    const traverse = (items, level = 0) => {
      items.forEach(item => {
        if (item.label && (item.href || item.cfi)) {
          // Debug: log the original item to see what we're getting
          console.log('TOC Item:', {
            label: item.label,
            href: item.href,
            cfi: item.cfi,
            id: item.id
          });

          result.push({
            label: item.label,
            href: item.href || item.cfi,
            level,
            originalItem: item // Keep reference to original item for debugging
          });
        }
        if (item.subitems?.length) traverse(item.subitems, level + 1);
      });
    };
    traverse(toc);
    console.log('Flattened TOC:', result);
    return result;
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setTocOpen(false);
      }
    };

    if (tocOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [tocOpen]);

  useEffect(() => {
    if (!bookData?.fileUrl) return;
    setIsLoading(true);

    const epubBook = ePub(bookData.fileUrl);
    setBook(epubBook);

    const rend = epubBook.renderTo(bookRef.current, {
      width: '100%',
      height: '600px',
      allowScriptedContent: true
    });
    setRendition(rend);

    // Set base styles
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
      // ADD THIS: Default link styles to prevent browser defaults
      a: {
        'text-decoration': 'underline !important',
        'color': 'inherit !important'
      }
    });

    rend.themes.fontSize(`${fontSize}px`);

    epubBook.ready.then(() => {
      rend.display(bookData.currentPosition || 0);
    }).catch(() => setIsLoading(false));

    epubBook.loaded.navigation.then(nav => {
      console.log('Navigation loaded:', nav);
      if (nav.toc && Array.isArray(nav.toc)) {
        console.log('Original TOC:', nav.toc);
        setToc(flattenToc(nav.toc));
      }
    }).catch(error => {
      console.log('Navigation loading failed:', error);
      setToc([]);
    });

    rend.on('relocated', loc => {
      const spineItem = epubBook.spine.get(loc.start.cfi);
      if (spineItem) {
        setProgress(Math.round((spineItem.index / Math.max(1, epubBook.spine.length - 1)) * 100));
      }
    });

    rend.on('rendered', () => setIsLoading(false));

    return () => {
      rend.destroy();
      epubBook.destroy();
    };
  }, [bookData?.fileUrl]);

  useEffect(() => {
    if (rendition) {
      rendition.themes.fontSize(`${fontSize}px`);
    }
  }, [fontSize, rendition]);

  useEffect(() => {
    if (!rendition) return;

    // Apply theme-specific styles
    if (readingMode === 'cream') {
      rendition.themes.override('color', '#704214');
      rendition.themes.override('background', '#f4ecd8');
      // FIXED: Override link colors for cream mode
      rendition.themes.override('a', 'color: #8B4513 !important; text-decoration: underline !important;');
      rendition.themes.override('a:visited', 'color: #8B4513 !important;');
      rendition.themes.override('a:hover', 'color: #A0522D !important;');
    } else if (theme === 'dark') {
      rendition.themes.override('color', '#ffffff');
      rendition.themes.override('background', '#1a1a1a');
      // FIXED: Override link colors for dark mode - use yellow/gold instead of blue
      rendition.themes.override('a', 'color: #FFD700 !important; text-decoration: underline !important;');
      rendition.themes.override('a:visited', 'color: #FFEC8C !important;');
      rendition.themes.override('a:hover', 'color: #FFF700 !important;');
    } else {
      rendition.themes.override('color', 'inherit');
      rendition.themes.override('background', 'inherit');
      // FIXED: Override link colors for light mode
      rendition.themes.override('a', 'color: #225330 !important; text-decoration: underline !important;');
      rendition.themes.override('a:visited', 'color: #1a3d26 !important;');
      rendition.themes.override('a:hover', 'color: #2d6b40 !important;');
    }

    // Apply consistent paragraph and body styles
    rendition.themes.override('p', 'margin: 0 !important; padding: 0 !important; text-align: justify !important;');
    rendition.themes.override('body', 'padding: 2rem !important; box-sizing: border-box !important;');

  }, [theme, rendition, readingMode]);

  const handleNextPage = async () => {
    if (rendition) await rendition.next();
  };

  const handlePrevPage = async () => {
    if (rendition) await rendition.prev();
  };

  const goToChapter = async (href, item) => {
    if (!href || href === '#' || !rendition) return;

    console.log('Attempting to navigate to:', href, 'Original item:', item);

    try {
      // Try different navigation methods
      let navigationSuccessful = false;

      // Method 1: Direct href navigation
      try {
        await rendition.display(href);
        navigationSuccessful = true;
        console.log('Navigation successful with direct href');
      } catch (error) {
        console.log('Direct href failed:', error);
      }

      // Method 2: If direct href fails, try with book.spine
      if (!navigationSuccessful && book) {
        try {
          // Find the spine item by href
          const spineItem = book.spine.spineItems.find(item =>
            item.href === href ||
            item.href.endsWith(href) ||
            href.endsWith(item.href.split('/').pop())
          );

          if (spineItem) {
            console.log('Found spine item:', spineItem);
            await rendition.display(spineItem.href);
            navigationSuccessful = true;
            console.log('Navigation successful with spine item');
          }
        } catch (error) {
          console.log('Spine navigation failed:', error);
        }
      }

      // Method 3: Try with CFI if available
      if (!navigationSuccessful && item?.originalItem?.cfi) {
        try {
          await rendition.display(item.originalItem.cfi);
          navigationSuccessful = true;
          console.log('Navigation successful with CFI');
        } catch (error) {
          console.log('CFI navigation failed:', error);
        }
      }

      // Method 4: Try to find by ID
      if (!navigationSuccessful && item?.originalItem?.id && book) {
        try {
          const section = book.spine.spineItems.find(s => s.idref === item.originalItem.id);
          if (section) {
            await rendition.display(section.href);
            navigationSuccessful = true;
            console.log('Navigation successful with ID');
          }
        } catch (error) {
          console.log('ID navigation failed:', error);
        }
      }

      if (navigationSuccessful) {
        setTocOpen(false);
      } else {
        console.error('All navigation methods failed for:', href);
        alert(`Tidak dapat membuka halaman: ${item?.label || href}`);
      }

    } catch (error) {
      console.error('Navigation error:', error);
      alert(`Error navigasi: ${error.message}`);
    }
  };

  const handleFontSizeChange = (delta) => {
    setFontSize(Math.max(12, Math.min(32, fontSize + delta)));
  };

  return (
    <div className="epub-reader">
      {/* Main Content */}
      <div style={{ width: '100%' }}>
        {/* Reader Controls */}
        <div className="card mb-1">
          <div className="flex justify-between items-center">
            {/* Table of Contents Dropdown */}
            <div style={{ position: 'relative' }} ref={dropdownRef}>
              <button
                onClick={() => setTocOpen(!tocOpen)}
                className="btn btn-secondary"
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              >
                Daftar Isi
                <span style={{
                  transform: tocOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.2s ease'
                }}>
                  ▼
                </span>
              </button>

              {/* Dropdown Content */}
              {tocOpen && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  width: '350px',
                  maxHeight: '400px',
                  backgroundColor: theme === 'dark' ? '#1a1a1a' : '#ffffff',
                  border: `1px solid ${theme === 'dark' ? 'var(--primary-pink)' : 'var(--primary-green)'}`,
                  borderRadius: '8px',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                  zIndex: 1000,
                  marginTop: '4px',
                  overflow: 'hidden'
                }}>
                  {/* Dropdown Header */}
                  <div style={{
                    padding: '0.75rem 1rem',
                    borderBottom: `1px solid ${theme === 'dark' ? 'var(--primary-pink)' : 'var(--primary-green)'}`,
                    fontSize: '0.95rem',
                    fontWeight: 'bold'
                  }}>
                    Daftar Isi
                  </div>

                  {/* Dropdown Items */}
                  <div style={{
                    maxHeight: '320px',
                    overflowY: 'auto',
                    padding: '0.5rem 0'
                  }}>
                    {toc.length > 0 ? (
                      toc.map((item, idx) => (
                        <button
                          key={idx}
                          onClick={() => goToChapter(item.href, item)}
                          style={{
                            width: '100%',
                            padding: '0.5rem 1rem',
                            fontSize: '0.9rem',
                            textAlign: 'left',
                            border: 'none',
                            backgroundColor: 'transparent',
                            cursor: item.href === '#' ? 'default' : 'pointer',
                            opacity: item.href === '#' ? 0.5 : 1,
                            paddingLeft: `${1 + (item.level || 0) * 0.75}rem`,
                            color: 'inherit',
                            transition: 'background-color 0.2s ease',
                            ':hover': {
                              backgroundColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'
                            }
                          }}
                          disabled={item.href === '#'}
                          onMouseEnter={(e) => {
                            if (item.href !== '#') {
                              e.target.style.backgroundColor = theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)';
                            }
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.backgroundColor = 'transparent';
                          }}
                        >
                          {item.label}
                        </button>
                      ))
                    ) : (
                      <div style={{
                        padding: '1rem',
                        textAlign: 'center',
                        color: theme === 'dark' ? '#888' : '#666',
                        fontSize: '0.9rem'
                      }}>
                        Daftar isi tidak tersedia
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => handleFontSizeChange(-2)}
                className="btn btn-secondary"
                style={{ padding: '0.5rem', minWidth: '40px' }}
              >
                A-
              </button>
              <span className="text-sm" style={{ minWidth: '60px', textAlign: 'center' }}>
                {fontSize}px
              </span>
              <button
                onClick={() => handleFontSizeChange(2)}
                className="btn btn-secondary"
                style={{ padding: '0.5rem', minWidth: '40px' }}
              >
                A+
              </button>
              <button
                onClick={() => setReadingMode(readingMode === 'cream' ? 'default' : 'cream')}
                className="btn btn-secondary"
                style={{
                  padding: '0.5rem',
                  minWidth: '40px',
                  backgroundColor: readingMode === 'cream' ? (theme === 'dark' ? 'var(--primary-pink)' : 'var(--primary-green)') : 'transparent',
                  color: readingMode === 'cream' ? 'white' : (theme === 'dark' ? 'var(--primary-pink)' : 'var(--primary-green)')
                }}
                title="Mode Membaca Krem"
              >
                Mode
              </button>
            </div>
          </div>
        </div>

        {/* Reader Content */}
        <div className="epub-reader-content">
          <div
            ref={bookRef}
            className="epub-reader-viewport"
            tabIndex={0}
          >
            {isLoading && (
              <div className="loading">
                Memuat konten ebook...
              </div>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="card mb-1 text-center">
          <div className="text-sm mb-1" style={{ opacity: '0.7' }}>
            Progres Membaca: {progress}%
          </div>
          <div className="progress-bar">
            <div style={{ width: `${progress}%` }} />
          </div>
        </div>

        {/* Navigation Controls */}
        <div className="card">
          <div className="flex justify-between items-center">
            <button
              onClick={handlePrevPage}
              className="btn btn-primary"
              style={{ minWidth: '120px' }}
            >
              ← Sebelumnya
            </button>
            <button
              onClick={handleNextPage}
              className="btn btn-primary"
              style={{ minWidth: '120px' }}
            >
              Selanjutnya →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EpubReader;