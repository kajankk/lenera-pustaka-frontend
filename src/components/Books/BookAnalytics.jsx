import React from 'react'
import { useTheme } from '../../hooks/useTheme'

const BookAnalytics = ({ book, bookStats, reactionStats, isAuthenticated }) => {
  const { theme } = useTheme()

  // Calculate public stats from available data
  const getPublicStats = () => {
    const totalReactions = reactionStats?.total || 0
    const averageRating = reactionStats?.averageRating || book.averageRating
    const downloadCount = book.downloadCount || 0
    const viewCount = book.viewCount || 0

    return [
      {
        label: 'Total Dilihat',
        value: viewCount,
        icon: '👁️',
        color: '#3B82F6'
      },
      {
        label: 'Total Unduhan',
        value: downloadCount,
        icon: '📥',
        color: '#10B981'
      },
      {
        label: 'Total Reaksi',
        value: totalReactions,
        icon: '❤️',
        color: '#EF4444'
      },
      {
        label: 'Rating Rata-rata',
        value: averageRating ? `${averageRating.toFixed(1)}/5` : 'Belum ada',
        icon: '⭐',
        color: '#F59E0B'
      }
    ]
  }

  // Get detailed reaction breakdown with colors
  const getReactionBreakdown = () => {
    if (!reactionStats) return []

    const reactions = [
      { type: 'like', label: 'Suka', icon: '👍', count: reactionStats.like || 0, color: '#10B981' },
      { type: 'dislike', label: 'Tidak Suka', icon: '👎', count: reactionStats.dislike || 0, color: '#EF4444' },
      { type: 'love', label: 'Cinta', icon: '❤️', count: reactionStats.love || 0, color: '#EC4899' },
      { type: 'sad', label: 'Sedih', icon: '😢', count: reactionStats.sad || 0, color: '#6366F1' },
      { type: 'angry', label: 'Marah', icon: '😠', count: reactionStats.angry || 0, color: '#DC2626' },
      { type: 'rating', label: 'Rating', icon: '⭐', count: reactionStats.ratings || 0, color: '#F59E0B' },
      { type: 'comment', label: 'Komentar', icon: '💬', count: reactionStats.comments || 0, color: '#8B5CF6' }
    ]

    return reactions
  }

  const readingStats = isAuthenticated && bookStats ? [
    { label: 'Highlight Anda', value: bookStats.highlights || 0, icon: '🖍️', color: '#F59E0B' },
    { label: 'Catatan Anda', value: bookStats.notes || 0, icon: '📝', color: '#10B981' },
    { label: 'Bookmark Anda', value: bookStats.bookmarks || 0, icon: '🔖', color: '#EC4899' }
  ] : []

  const publicStats = getPublicStats()
  const reactionBreakdown = getReactionBreakdown()

  return (
    <div className="book-analytics" style={{
      padding: '20px 0',
      color: theme === 'dark' ? '#f3f4f6' : '#1f2937'
    }}>
      {/* Public Statistics */}
      <div className="analytics-section" style={{ marginBottom: '32px' }}>
        <h3 style={{
          fontSize: '20px',
          fontWeight: 'bold',
          marginBottom: '16px',
          color: theme === 'dark' ? '#f9fafb' : '#111827'
        }}>
          📊 Statistik Publik
        </h3>
        <div className="stats-grid" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px'
        }}>
          {publicStats.map((stat, index) => (
            <div
              key={index}
              className="stat-card"
              style={{
                background: theme === 'dark' ? '#1f2937' : '#ffffff',
                border: theme === 'dark' ? '1px solid #374151' : '1px solid #e5e7eb',
                borderRadius: '12px',
                padding: '20px',
                textAlign: 'center',
                boxShadow: theme === 'dark'
                  ? '0 4px 6px -1px rgba(0, 0, 0, 0.3)'
                  : '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                transition: 'transform 0.2s, box-shadow 0.2s',
                cursor: 'default'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)'
                e.currentTarget.style.boxShadow = theme === 'dark'
                  ? '0 8px 15px -3px rgba(0, 0, 0, 0.4)'
                  : '0 8px 15px -3px rgba(0, 0, 0, 0.15)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = theme === 'dark'
                  ? '0 4px 6px -1px rgba(0, 0, 0, 0.3)'
                  : '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
              }}
            >
              <div style={{
                fontSize: '32px',
                marginBottom: '8px',
                filter: theme === 'dark' ? 'brightness(1.2)' : 'none'
              }}>
                {stat.icon}
              </div>
              <div style={{
                fontSize: '24px',
                fontWeight: 'bold',
                color: stat.color,
                marginBottom: '4px'
              }}>
                {typeof stat.value === 'number' ? stat.value.toLocaleString('id-ID') : stat.value}
              </div>
              <div style={{
                fontSize: '14px',
                color: theme === 'dark' ? '#9ca3af' : '#6b7280',
                fontWeight: '500'
              }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Detailed Reaction Breakdown */}
      <div className="analytics-section" style={{ marginBottom: '32px' }}>
        <h3 style={{
          fontSize: '20px',
          fontWeight: 'bold',
          marginBottom: '16px',
          color: theme === 'dark' ? '#f9fafb' : '#111827'
        }}>
          💝 Detail Reaksi
        </h3>
        <div className="reaction-breakdown" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: '12px'
        }}>
          {reactionBreakdown.map((reaction, index) => (
            <div
              key={index}
              className="reaction-stat"
              style={{
                background: theme === 'dark' ? '#1f2937' : '#ffffff',
                border: `2px solid ${reaction.color}20`,
                borderRadius: '10px',
                padding: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                transition: 'all 0.2s',
                cursor: 'default'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = reaction.color
                e.currentTarget.style.background = `${reaction.color}10`
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = `${reaction.color}20`
                e.currentTarget.style.background = theme === 'dark' ? '#1f2937' : '#ffffff'
              }}
            >
              <span style={{
                fontSize: '24px',
                filter: theme === 'dark' ? 'brightness(1.2)' : 'none'
              }}>
                {reaction.icon}
              </span>
              <div style={{ flex: 1 }}>
                <div style={{
                  fontSize: '12px',
                  color: theme === 'dark' ? '#9ca3af' : '#6b7280',
                  marginBottom: '2px'
                }}>
                  {reaction.label}
                </div>
                <div style={{
                  fontSize: '18px',
                  fontWeight: 'bold',
                  color: reaction.color
                }}>
                  {reaction.count}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* User Personal Stats */}
      {isAuthenticated && readingStats.length > 0 && (
        <div className="analytics-section" style={{ marginBottom: '32px' }}>
          <h3 style={{
            fontSize: '20px',
            fontWeight: 'bold',
            marginBottom: '16px',
            color: theme === 'dark' ? '#f9fafb' : '#111827'
          }}>
            📚 Aktivitas Membaca Anda
          </h3>
          <div className="stats-grid" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '16px'
          }}>
            {readingStats.map((stat, index) => (
              <div
                key={index}
                className="stat-card user-stat"
                style={{
                  background: `${stat.color}15`,
                  border: `2px solid ${stat.color}30`,
                  borderRadius: '12px',
                  padding: '20px',
                  textAlign: 'center',
                  transition: 'all 0.2s',
                  cursor: 'default'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.02)'
                  e.currentTarget.style.borderColor = stat.color
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)'
                  e.currentTarget.style.borderColor = `${stat.color}30`
                }}
              >
                <div style={{
                  fontSize: '32px',
                  marginBottom: '8px',
                  filter: theme === 'dark' ? 'brightness(1.2)' : 'none'
                }}>
                  {stat.icon}
                </div>
                <div style={{
                  fontSize: '24px',
                  fontWeight: 'bold',
                  color: stat.color,
                  marginBottom: '4px'
                }}>
                  {stat.value}
                </div>
                <div style={{
                  fontSize: '14px',
                  color: theme === 'dark' ? '#9ca3af' : '#6b7280',
                  fontWeight: '500'
                }}>
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!isAuthenticated && (
        <div
          className="auth-required-notice"
          style={{
            background: theme === 'dark' ? '#1f2937' : '#f9fafb',
            border: theme === 'dark' ? '1px solid #374151' : '1px solid #d1d5db',
            borderRadius: '12px',
            padding: '24px',
            textAlign: 'center'
          }}
        >
          <h4 style={{
            fontSize: '18px',
            fontWeight: 'bold',
            marginBottom: '8px',
            color: theme === 'dark' ? '#f9fafb' : '#111827'
          }}>
            🔐 Ingin Melihat Analitik Personal?
          </h4>
          <p style={{
            color: theme === 'dark' ? '#9ca3af' : '#6b7280',
            margin: 0
          }}>
            Login untuk melihat statistik membaca pribadi dan fitur analytics lainnya.
          </p>
        </div>
      )}
    </div>
  )
}

export default BookAnalytics