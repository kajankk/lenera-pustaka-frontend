// components/Books/BookAnalytics.jsx
import React from 'react'
import { useTheme } from '../../hooks/useTheme'

const BookAnalytics = ({ book, bookStats, aiInsights, isAuthenticated }) => {
  const { theme } = useTheme()

  const publicStats = [
    { label: 'Total Pembaca', value: book.readerCount || 0, icon: '👥' },
    { label: 'Rata-rata Rating', value: book.averageRating ? `${book.averageRating.toFixed(1)}/5` : 'N/A', icon: '⭐' },
    { label: 'Total Unduhan', value: book.downloadCount || 0, icon: '📥' },
    { label: 'Diskusi Aktif', value: book.discussionCount || 0, icon: '💬' }
  ]

  const readingStats = isAuthenticated && bookStats ? [
    { label: 'Highlight Anda', value: bookStats.highlights, icon: '🖍️', color: 'var(--accent-yellow)' },
    { label: 'Catatan Anda', value: bookStats.notes, icon: '📝', color: 'var(--accent-green)' },
    { label: 'Bookmark Anda', value: bookStats.bookmarks, icon: '🔖', color: 'var(--accent-pink)' }
  ] : []

  return (
    <div className="book-analytics">
      <div className="analytics-section">
        <h3>Statistik Publik</h3>
        <div className="stats-grid">
          {publicStats.map((stat, index) => (
            <div key={index} className="stat-card card">
              <div className="stat-icon">{stat.icon}</div>
              <div className="stat-value">{typeof stat.value === 'number' ? stat.value.toLocaleString('id-ID') : stat.value}</div>
              <div className="stat-label">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {isAuthenticated && readingStats.length > 0 && (
        <div className="analytics-section">
          <h3>Aktivitas Membaca Anda</h3>
          <div className="stats-grid">
            {readingStats.map((stat, index) => (
              <div key={index} className="stat-card card user-stat">
                <div className="stat-icon" style={{ color: stat.color }}>{stat.icon}</div>
                <div className="stat-value" style={{ color: stat.color }}>{stat.value}</div>
                <div className="stat-label">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {isAuthenticated && aiInsights && (
        <div className="analytics-section">
          <h3>Insights AI</h3>

          {aiInsights.trends && (
            <div className="insights-card card">
              <h4>Tren Highlight Populer</h4>
              {aiInsights.trends.popularHighlights?.length > 0 ? (
                <div className="trending-highlights">
                  {aiInsights.trends.popularHighlights.slice(0, 3).map((highlight, index) => (
                    <div key={index} className="trending-item">
                      <div className="trend-rank">#{index + 1}</div>
                      <div className="trend-text">"{highlight.text}"</div>
                      <div className="trend-stats">{highlight.count} pembaca menyoroti ini</div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="no-data">Belum ada data tren highlight</p>
              )}
            </div>
          )}

          {aiInsights.suggestions && (
            <div className="insights-card card">
              <h4>Saran Bookmark AI</h4>
              {aiInsights.suggestions?.length > 0 ? (
                <div className="ai-suggestions">
                  {aiInsights.suggestions.slice(0, 3).map((suggestion, index) => (
                    <div key={index} className="suggestion-item">
                      <div className="suggestion-icon">🔖</div>
                      <div className="suggestion-content">
                        <div className="suggestion-title">{suggestion.title}</div>
                        <div className="suggestion-reason">{suggestion.reason}</div>
                        <div className="suggestion-page">Halaman {suggestion.page}</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="no-data">Mulai membaca untuk mendapatkan saran AI</p>
              )}
            </div>
          )}
        </div>
      )}

      {!isAuthenticated && (
        <div className="auth-required-notice card">
          <h4>Ingin Melihat Analitik Personal?</h4>
          <p>Login untuk melihat statistik membaca pribadi, AI insights, dan fitur analytics lainnya.</p>
        </div>
      )}
    </div>
  )
}

export default BookAnalytics