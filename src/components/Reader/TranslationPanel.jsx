// components/Reader/TranslationPanel.jsx
import React, { useState } from 'react'

const TranslationPanel = ({ selectedText, onTranslate, translations, onClose }) => {
  const [targetLanguage, setTargetLanguage] = useState('id')
  const [translating, setTranslating] = useState(false)

  const languages = [
    { code: 'id', name: 'Bahasa Indonesia' },
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Español' },
    { code: 'fr', name: 'Français' },
    { code: 'de', name: 'Deutsch' },
    { code: 'ja', name: '日本語' },
    { code: 'ko', name: '한국어' },
    { code: 'zh', name: '中文' },
    { code: 'ar', name: 'العربية' },
    { code: 'ru', name: 'Русский' }
  ]

  const handleTranslate = async () => {
    if (!selectedText || translating) return

    setTranslating(true)
    try {
      await onTranslate(selectedText, targetLanguage)
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

  return (
    <div className="reader-panel card">
      <div className="panel-header">
        <h3>Terjemahan</h3>
        <button className="btn btn-secondary btn-small" onClick={onClose}>
          Tutup
        </button>
      </div>

      <div className="panel-content">
        {!selectedText ? (
          <div className="empty-state">
            <p>Pilih teks untuk diterjemahkan.</p>
          </div>
        ) : (
          <div className="translation-content">
            <div className="original-text">
              <h4>Teks Asli:</h4>
              <div className="text-content">"{selectedText}"</div>
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
                      {lang.name}
                    </option>
                  ))}
                </select>
              </div>

              <button
                className="btn btn-primary"
                onClick={handleTranslate}
                disabled={translating}
              >
                {translating ? 'Menerjemahkan...' : 'Terjemahkan'}
              </button>
            </div>

            {getCurrentTranslation() && (
              <div className="translation-result">
                <h4>Terjemahan ({languages.find(l => l.code === targetLanguage)?.name}):</h4>
                <div className="text-content translation-text">
                  "{getCurrentTranslation().translatedText}"
                </div>
                {getCurrentTranslation().confidence && (
                  <small className="translation-confidence">
                    Tingkat Kepercayaan: {(getCurrentTranslation().confidence * 100).toFixed(1)}%
                  </small>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default TranslationPanel