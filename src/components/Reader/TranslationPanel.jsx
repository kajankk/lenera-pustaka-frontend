import React, { useState, useEffect } from 'react'

const TranslationPanel = ({
  selectedText,
  onTranslate,
  translations,
  translating = false,
  onClose,
  isMobile = false
}) => {
  const [targetLanguage, setTargetLanguage] = useState('id')
  const [translationHistory, setTranslationHistory] = useState([])

  // Close panel on escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [onClose])

  // Load translation history from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('epub-translation-history')
      if (saved) {
        setTranslationHistory(JSON.parse(saved))
      }
    } catch (error) {
      console.error('Error loading translation history:', error)
    }
  }, [])

  const languages = [
    { code: 'id', name: 'Bahasa Indonesia', flag: '🇮🇩', native: 'Bahasa Indonesia' },
    { code: 'en', name: 'English', flag: '🇺🇸', native: 'English' },
    { code: 'es', name: 'Español', flag: '🇪🇸', native: 'Español' },
    { code: 'fr', name: 'Français', flag: '🇫🇷', native: 'Français' },
    { code: 'de', name: 'Deutsch', flag: '🇩🇪', native: 'Deutsch' },
    { code: 'ja', name: '日本語', flag: '🇯🇵', native: '日本語' },
    { code: 'ko', name: '한국어', flag: '🇰🇷', native: '한국어' },
    { code: 'zh', name: '中文', flag: '🇨🇳', native: '中文' },
    { code: 'ar', name: 'العربية', flag: '🇸🇦', native: 'العربية' },
    { code: 'ru', name: 'Русский', flag: '🇷🇺', native: 'Русский' },
    { code: 'pt', name: 'Português', flag: '🇵🇹', native: 'Português' },
    { code: 'it', name: 'Italiano', flag: '🇮🇹', native: 'Italiano' },
    { code: 'nl', name: 'Nederlands', flag: '🇳🇱', native: 'Nederlands' },
    { code: 'sv', name: 'Svenska', flag: '🇸🇪', native: 'Svenska' },
    { code: 'pl', name: 'Polski', flag: '🇵🇱', native: 'Polski' }
  ]

  const saveTranslationHistory = (newHistory) => {
    try {
      localStorage.setItem('epub-translation-history', JSON.stringify(newHistory))
      setTranslationHistory(newHistory)
    } catch (error) {
      console.error('Error saving translation history:', error)
    }
  }

  const handleTranslate = async () => {
    if (!selectedText || translating) return

    try {
      await onTranslate(selectedText, targetLanguage)

      // Add to translation history
      const newHistoryItem = {
        text: selectedText,
        targetLanguage,
        timestamp: Date.now(),
        id: Date.now()
      }

      const newHistory = [
        newHistoryItem,
        ...translationHistory.filter(item =>
          !(item.text === selectedText && item.targetLanguage === targetLanguage)
        )
      ].slice(0, 10) // Keep last 10 translations

      saveTranslationHistory(newHistory)
    } catch (error) {
      console.error('Translation error:', error)
    }
  }

  const getCurrentTranslation = () => {
    const key = `${selectedText}_${targetLanguage}`
    return translations.get(key)
  }

  const getLanguageInfo = (code) => {
    return languages.find(lang => lang.code === code)
  }

  const copyTranslation = (text) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text)
        .then(() => alert('Terjemahan disalin ke clipboard'))
        .catch(() => console.log('Clipboard not supported'))
    }
  }

  const clearHistory = () => {
    if (confirm('Hapus semua riwayat terjemahan?')) {
      saveTranslationHistory([])
    }
  }

  const retranslate = (historyItem) => {
    // This would need to be implemented to re-select text and translate
    console.log('Retranslate:', historyItem)
  }

  return (
    <div className={`reader-panel translation-panel ${isMobile ? 'mobile' : 'desktop'}`}>
      {/* Mobile header with drag indicator */}
      {isMobile && (
        <div className="panel-drag-indicator">
          <div className="drag-handle"></div>
        </div>
      )}

      <header className="panel-header">
        <h3>
          <span className="panel-icon">🌐</span>
          Terjemahan
        </h3>
        <button
          className="btn btn-secondary btn-small panel-close-btn"
          onClick={onClose}
          aria-label="Tutup panel terjemahan"
        >
          ✕
        </button>
      </header>

      {/* Content */}
      <div className="panel-content">
        {!selectedText ? (
          <div className="empty-state">
            <div className="empty-icon">🌐</div>
            <h4>Pilih teks untuk diterjemahkan</h4>
            <p>Highlight teks yang ingin Anda terjemahkan, lalu klik tombol terjemahan.</p>
            {isMobile && (
              <p><small>💡 Tekan dan tahan teks, lalu pilih "Terjemahan"</small></p>
            )}

            {/* Translation History */}
            {translationHistory.length > 0 && (
              <div className="translation-history">
                <div className="history-header">
                  <h5>Riwayat Terjemahan</h5>
                  <button
                    className="btn btn-secondary btn-tiny clear-history-btn"
                    onClick={clearHistory}
                    title="Hapus riwayat"
                  >
                    🗑️
                  </button>
                </div>
                <div className="history-list">
                  {translationHistory.slice(0, 5).map((item) => (
                    <div key={item.id} className="history-item">
                      <div className="history-text">
                        "{item.text.substring(0, 50)}{item.text.length > 50 ? '...' : ''}"
                      </div>
                      <div className="history-lang">
                        → {getLanguageInfo(item.targetLanguage)?.flag} {getLanguageInfo(item.targetLanguage)?.name}
                      </div>
                      <div className="history-time">
                        {new Date(item.timestamp).toLocaleDateString('id-ID', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="translation-content">
            {/* Original Text */}
            <section className="original-text">
              <h4>
                <span className="section-icon">📝</span>
                Teks Asli
              </h4>
              <blockquote className="text-content selected-text">
                "{selectedText}"
              </blockquote>
              <div className="text-info">
                <small>
                  {selectedText.length} karakter
                  {selectedText.split(' ').length > 1 && ` • ${selectedText.split(' ').length} kata`}
                </small>
              </div>
            </section>

            {/* Translation Controls */}
            <section className="translation-controls">
              <div className="form-group">
                <label htmlFor="targetLanguage">
                  <span className="section-icon">🎯</span>
                  Terjemahkan ke:
                </label>
                <select
                  id="targetLanguage"
                  className="form-control language-select"
                  value={targetLanguage}
                  onChange={(e) => setTargetLanguage(e.target.value)}
                  disabled={translating}
                >
                  {languages.map(lang => (
                    <option key={lang.code} value={lang.code}>
                      {lang.flag} {lang.native}
                    </option>
                  ))}
                </select>
              </div>

              <button
                className="btn btn-primary translate-btn"
                onClick={handleTranslate}
                disabled={translating}
              >
                {translating ? (
                  <>
                    <span className="loading-spinner small"></span>
                    Menerjemahkan...
                  </>
                ) : (
                  <>
                    <span>🌐</span>
                    Terjemahkan
                  </>
                )}
              </button>
            </section>

            {/* Translation Result */}
            {getCurrentTranslation() && (
              <section className="translation-result">
                <h4>
                  <span className="section-icon">✨</span>
                  Hasil Terjemahan ({getLanguageInfo(targetLanguage)?.flag} {getLanguageInfo(targetLanguage)?.name})
                </h4>
                <blockquote className="text-content translation-text">
                  "{getCurrentTranslation().translatedText}"
                </blockquote>

                <div className="translation-meta">
                  {/* Confidence Indicator */}
                  {getCurrentTranslation().confidence && (
                    <div className="confidence-indicator">
                      <span className="confidence-label">Tingkat Kepercayaan:</span>
                      <div className="confidence-bar">
                        <div
                          className="confidence-fill"
                          style={{ width: `${getCurrentTranslation().confidence * 100}%` }}
                        />
                      </div>
                      <span className="confidence-value">
                        {(getCurrentTranslation().confidence * 100).toFixed(1)}%
                      </span>
                    </div>
                  )}

                  {/* Translation Actions */}
                  <div className="translation-actions">
                    <button
                      className="btn btn-secondary btn-small action-btn"
                      onClick={() => copyTranslation(getCurrentTranslation().translatedText)}
                      title="Salin terjemahan"
                    >
                      📋 Salin
                    </button>

                    <button
                      className="btn btn-secondary btn-small action-btn"
                      onClick={() => {
                        // Share translation
                        if (navigator.share && isMobile) {
                          navigator.share({
                            title: 'Terjemahan',
                            text: `"${selectedText}" → "${getCurrentTranslation().translatedText}"`
                          })
                        } else {
                          copyTranslation(`"${selectedText}" → "${getCurrentTranslation().translatedText}"`)
                        }
                      }}
                      title="Bagikan terjemahan"
                    >
                      📤 Bagikan
                    </button>

                    <button
                      className="btn btn-secondary btn-small action-btn"
                      onClick={handleTranslate}
                      title="Terjemahkan ulang"
                      disabled={translating}
                    >
                      🔄 Ulang
                    </button>
                  </div>

                  {/* Translation Info */}
                  <div className="translation-info">
                    <small>
                      Diterjemahkan dengan AI •
                      {getCurrentTranslation().provider && ` ${getCurrentTranslation().provider} • `}
                      Hasil mungkin tidak 100% akurat
                    </small>
                  </div>
                </div>
              </section>
            )}

            {/* Quick Language Switcher for Mobile */}
            {isMobile && (
              <section className="quick-languages">
                <h5>Bahasa Populer:</h5>
                <div className="language-chips">
                  {['en', 'es', 'fr', 'de', 'ja', 'ko'].map(langCode => {
                    const lang = getLanguageInfo(langCode)
                    return (
                      <button
                        key={langCode}
                        className={`language-chip ${targetLanguage === langCode ? 'active' : ''}`}
                        onClick={() => setTargetLanguage(langCode)}
                        disabled={translating}
                      >
                        {lang?.flag} {lang?.native}
                      </button>
                    )
                  })}
                </div>
              </section>
            )}
          </div>
        )}
      </div>

      {/* Footer with Tips */}
      <footer className="panel-footer">
        <div className="translation-tips">
          <details>
            <summary>💡 Tips Terjemahan</summary>
            <ul>
              <li>Pilih kalimat lengkap untuk hasil terbaik</li>
              <li>Hindari terjemahan teks yang terlalu panjang</li>
              <li>Periksa konteks untuk memastikan akurasi</li>
              <li>Gunakan terjemahan sebagai bantuan, bukan pengganti</li>
            </ul>
          </details>
        </div>

        {selectedText && (
          <div className="panel-stats">
            <small>
              Teks terpilih: {selectedText.length} karakter •
              Target: {getLanguageInfo(targetLanguage)?.name}
            </small>
          </div>
        )}
      </footer>
    </div>
  )
}

export default TranslationPanel