import React, { useState, useEffect } from 'react'
import api from '../utils/api'
import { API_ENDPOINTS } from '../utils/constants'
import StatsCard from '../components/Dashboard/StatsCard'
import { useTheme } from '../hooks/useTheme'

const DashboardPage = () => {
  const [dashboardData, setDashboardData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const { theme } = useTheme()

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const response = await api.get(API_ENDPOINTS.DASHBOARD)
        setDashboardData(response.data.data)
      } catch (error) {
        setError('Gagal memuat data dashboard')
        console.error('Error fetching dashboard:', error)
      }
      setLoading(false)
    }

    fetchDashboard()
  }, [])

  if (loading) return <div className="loading">Memuat dashboard...</div>
  if (error) return <div className="error">{error}</div>

  return (
    <div>
      <div className="books-grid">
        <StatsCard
          title="Total Ebook"
          value={dashboardData?.totalBooks || 0}
          icon="📚"
        />
        <StatsCard
          title="Ebook Dibaca"
          value={dashboardData?.booksRead || 0}
          icon="📖"
        />
        <StatsCard
          title="Progress Bacaan"
          value={`${dashboardData?.readingProgress || 0}%`}
          icon="📊"
        />
      </div>

      <div className="card">
        <h3 className="mb-1" style={{
          color: theme === 'dark' ? 'var(--primary-pink)' : 'var(--primary-green)'
        }}>
          Aktivitas Terbaru
        </h3>
        {dashboardData?.recentActivity?.length > 0 ? (
          <div>
            {dashboardData.recentActivity.map((activity, index) => (
              <div key={index} className="mb-1">
                <strong>{activity.title}</strong>
                <p style={{ opacity: '0.8', fontSize: '0.9rem' }}>
                  {activity.description}
                </p>
                <small style={{ opacity: '0.6' }}>
                  {new Date(activity.date).toLocaleDateString('id-ID')}
                </small>
              </div>
            ))}
          </div>
        ) : (
          <p>Belum ada aktivitas terbaru.</p>
        )}
      </div>

      <div className="card">
        <h3 className="mb-1" style={{
          color: theme === 'dark' ? 'var(--primary-pink)' : 'var(--primary-green)'
        }}>
          Rekomendasi Ebook
        </h3>
        {dashboardData?.recommendations?.length > 0 ? (
          <div className="books-grid">
            {dashboardData.recommendations.map((book) => (
              <div key={book.id} className="card">
                <h4 className="book-title">{book.title}</h4>
                <p style={{ opacity: '0.8' }}>{book.author}</p>
                <p style={{ fontSize: '0.9rem' }}>
                  {book.description?.substring(0, 100)}...
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p>Rekomendasi akan muncul berdasarkan riwayat bacaan Anda.</p>
        )}
      </div>
    </div>
  )
}

export default DashboardPage