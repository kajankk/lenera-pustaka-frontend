

// Enhanced TranslationPanel.jsx
const TranslationPanel = ({ selectedText, onTranslate, translations, onClose }) => {
  const [targetLanguage, setTargetLanguage] = useState('id')
  const [translating, setTranslating] = useState(false)
  const [translationHistory, setTranslationHistory] = useState([])

  const languages = [
    { code: 'id', name: 'Bahasa Indonesia', flag: '🇮🇩' },
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'es', name: 'Español', flag: '🇪🇸' },
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
    { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
    { code: 'ja', name: '日本語', flag: '🇯🇵' },
    { code: 'ko', name: '한국어', flag: '🇰🇷' },
    { code: 'zh', name: '中文', flag: '🇨🇳' },
    { code: 'ar', name: 'العربية', flag: '🇸🇦' },
    { code: 'ru', name: 'Русский', flag: '🇷🇺' }
  ]

  const handleTranslate = async () => {
    if (!selectedText || translating) return

    setTranslating(true)
    try {
      await onTranslate(selectedText, targetLanguage)

      // Add to translation history
      setTranslationHistory(prev => [
        { text: selectedText, targetLanguage, timestamp: Date.now() },
        ...prev.slice(0, 4)
      ])
    } catch (error) {
      console.error('Translation error:', error)
    } finally {
      setTranslating(false)
    }
  }

  const getCurrentTranslation = () => {
    const key = `${selectedText}_${targetLanguage}`
    return translations.get(key)
  }

  const getLanguageInfo = (code) => {
    return languages.find(lang => lang.code === code)
  }

  return (
    <div className="reader-panel card">
      <div className="panel-header">
        <h3>Terjemahan</h3>
        <button className="btn btn-secondary btn-small" onClick={onClose}>
          ✕
        </button>
      </div>

      <div className="panel-content">
        {!selectedText ? (
          <div className="empty-state">
            <div className="empty-icon">🌐</div>
            <p>Pilih teks untuk diterjemahkan.</p>
            <p>Highlight teks yang ingin Anda terjemahkan, lalu klik tombol terjemahan.</p>

            {translationHistory.length > 0 && (
              <div className="translation-history">
                <h4>Riwayat Terjemahan:</h4>
                <div className="history-list">
                  {translationHistory.map((item, index) => (
                    <div key={index} className="history-item">
                      <div className="history-text">"{item.text.substring(0, 50)}..."</div>
                      <div className="history-lang">
                        → {getLanguageInfo(item.targetLanguage)?.flag} {getLanguageInfo(item.targetLanguage)?.name}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="translation-content">
            <div className="original-text">
              <h4>Teks Asli:</h4>
              <div className="text-content selected-text">"{selectedText}"</div>
              <div className="text-info">
                <small>{selectedText.length} karakter</small>
              </div>
            </div>

            <div className="translation-controls">
              <div className="form-group">
                <label>Terjemahkan ke:</label>
                <select
                  className="form-control"
                  value={targetLanguage}
                  onChange={(e) => setTargetLanguage(e.target.value)}
                >
                  {languages.map(lang => (
                    <option key={lang.code} value={lang.code}>
                      {lang.flag} {lang.name}
                    </option>
                  ))}
                </select>
              </div>

              <button
                className="btn btn-primary"
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
                    🌐 Terjemahkan
                  </>
                )}
              </button>
            </div>

            {getCurrentTranslation() && (
              <div className="translation-result">
                <h4>
                  Terjemahan ({getLanguageInfo(targetLanguage)?.flag} {getLanguageInfo(targetLanguage)?.name}):
                </h4>
                <div className="text-content translation-text">
                  "{getCurrentTranslation().translatedText}"
                </div>

                <div className="translation-meta">
                  {getCurrentTranslation().confidence && (
                    <div className="confidence-indicator">
                      <span>Tingkat Kepercayaan: </span>
                      <div className="confidence-bar">
                        <div
                          className="confidence-fill"
                          style={{ width: `${getCurrentTranslation().confidence * 100}%` }}
                        />
                      </div>
                      <span>{(getCurrentTranslation().confidence * 100).toFixed(1)}%</span>
                    </div>
                  )}

                  <div className="translation-actions">
                    <button
                      className="btn btn-secondary btn-small"
                      onClick={() => navigator.clipboard?.writeText(getCurrentTranslation().translatedText)}
                      title="Salin terjemahan"
                    >
                      📋 Salin
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default TranslationPanel