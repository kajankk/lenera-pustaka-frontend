import React from 'react'
import { useTheme } from '../../hooks/useTheme'

const BookAnalytics = ({ book, bookStats, reactionStats, isAuthenticated }) => {
  const { theme } = useTheme()

  const publicStats = [
    { label: 'Total Dilihat', value: book.viewCount || 0, icon: '👁️', color: '#3B82F6' },
    { label: 'Total Unduhan', value: book.downloadCount || 0, icon: '📥', color: '#10B981' },
    { label: 'Total Reaksi', value: reactionStats?.total || 0, icon: '❤️', color: '#EF4444' },
    { label: 'Rating Rata-rata', value: (reactionStats?.averageRating || book.averageRating) ? `${(reactionStats?.averageRating || book.averageRating).toFixed(1)}/5` : 'Belum ada', icon: '⭐', color: '#F59E0B' }
  ]

  const reactions = reactionStats ? [
    { type: 'like', label: 'Suka', icon: '👍', count: reactionStats.like || 0, color: '#10B981' },
    { type: 'dislike', label: 'Tidak Suka', icon: '👎', count: reactionStats.dislike || 0, color: '#EF4444' },
    { type: 'love', label: 'Cinta', icon: '❤️', count: reactionStats.love || 0, color: '#EC4899' },
    { type: 'sad', label: 'Sedih', icon: '😢', count: reactionStats.sad || 0, color: '#6366F1' },
    { type: 'angry', label: 'Marah', icon: '😠', count: reactionStats.angry || 0, color: '#DC2626' },
    { type: 'rating', label: 'Rating', icon: '⭐', count: reactionStats.ratings || 0, color: '#F59E0B' },
    { type: 'comment', label: 'Komentar', icon: '💬', count: reactionStats.comments || 0, color: '#8B5CF6' }
  ] : []

  const readingStats = isAuthenticated && bookStats ? [
    { label: 'Highlight Anda', value: bookStats.highlights || 0, icon: '🖍️', color: '#F59E0B' },
    { label: 'Catatan Anda', value: bookStats.notes || 0, icon: '📝', color: '#10B981' },
    { label: 'Bookmark Anda', value: bookStats.bookmarks || 0, icon: '🔖', color: '#EC4899' }
  ] : []

  const StatCard = ({ stat, isUserStat = false }) => (
    <div style={{ background: isUserStat ? `${stat.color}15` : theme === 'dark' ? '#1f2937' : '#ffffff', border: isUserStat ? `2px solid ${stat.color}30` : theme === 'dark' ? '1px solid #374151' : '1px solid #e5e7eb', borderRadius: '12px', padding: '20px', textAlign: 'center', boxShadow: theme === 'dark' ? '0 4px 6px -1px rgba(0, 0, 0, 0.3)' : '0 4px 6px -1px rgba(0, 0, 0, 0.1)', transition: 'transform 0.2s', cursor: 'default' }} onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'} onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
      <div style={{ fontSize: '32px', marginBottom: '8px', filter: theme === 'dark' ? 'brightness(1.2)' : 'none' }}>{stat.icon}</div>
      <div style={{ fontSize: '24px', fontWeight: 'bold', color: stat.color, marginBottom: '4px' }}>{typeof stat.value === 'number' ? stat.value.toLocaleString('id-ID') : stat.value}</div>
      <div style={{ fontSize: '14px', color: theme === 'dark' ? '#9ca3af' : '#6b7280', fontWeight: '500' }}>{stat.label}</div>
    </div>
  )

  const ReactionCard = ({ reaction }) => (
    <div style={{ background: theme === 'dark' ? '#1f2937' : '#ffffff', border: `2px solid ${reaction.color}20`, borderRadius: '10px', padding: '16px', display: 'flex', alignItems: 'center', gap: '12px', transition: 'all 0.2s' }} onMouseEnter={(e) => { e.currentTarget.style.borderColor = reaction.color; e.currentTarget.style.background = `${reaction.color}10` }} onMouseLeave={(e) => { e.currentTarget.style.borderColor = `${reaction.color}20`; e.currentTarget.style.background = theme === 'dark' ? '#1f2937' : '#ffffff' }}>
      <span style={{ fontSize: '24px', filter: theme === 'dark' ? 'brightness(1.2)' : 'none' }}>{reaction.icon}</span>
      <div><div style={{ fontSize: '12px', color: theme === 'dark' ? '#9ca3af' : '#6b7280', marginBottom: '2px' }}>{reaction.label}</div><div style={{ fontSize: '18px', fontWeight: 'bold', color: reaction.color }}>{reaction.count}</div></div>
    </div>
  )

  const SectionTitle = ({ title }) => <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '16px', color: theme === 'dark' ? '#f9fafb' : '#111827' }}>{title}</h3>

  return (
    <div className="book-analytics" style={{ padding: '20px 0', color: theme === 'dark' ? '#f3f4f6' : '#1f2937' }}>
      <div className="analytics-section" style={{ marginBottom: '32px' }}>
        <SectionTitle title="📊 Statistik Publik" />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>{publicStats.map((stat, index) => <StatCard key={index} stat={stat} />)}</div>
      </div>

      <div className="analytics-section" style={{ marginBottom: '32px' }}>
        <SectionTitle title="💝 Detail Reaksi" />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px' }}>{reactions.map((reaction, index) => <ReactionCard key={index} reaction={reaction} />)}</div>
      </div>

      {isAuthenticated && readingStats.length > 0 && (
        <div className="analytics-section" style={{ marginBottom: '32px' }}>
          <SectionTitle title="📚 Aktivitas Membaca Anda" />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>{readingStats.map((stat, index) => <StatCard key={index} stat={stat} isUserStat={true} />)}</div>
        </div>
      )}

      {!isAuthenticated && (
        <div style={{ background: theme === 'dark' ? '#1f2937' : '#f9fafb', border: theme === 'dark' ? '1px solid #374151' : '1px solid #d1d5db', borderRadius: '12px', padding: '24px', textAlign: 'center' }}>
          <h4 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '8px', color: theme === 'dark' ? '#f9fafb' : '#111827' }}>🔐 Ingin Melihat Analitik Personal?</h4>
          <p style={{ color: theme === 'dark' ? '#9ca3af' : '#6b7280', margin: 0 }}>Login untuk melihat statistik membaca pribadi dan fitur analytics lainnya.</p>
        </div>
      )}
    </div>
  )
}

export default BookAnalytics