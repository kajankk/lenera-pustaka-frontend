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
      } finally {
        setLoading(false)
      }
    }
    fetchDashboard()
  }, [])

  if (loading) return <div className="loading">Memuat dashboard...</div>
  if (error) return <div className="error">{error}</div>

  const stats = [
    { title: 'Total Ebook', value: dashboardData?.totalBooks || 0, icon: '📚' },
    { title: 'Ebook Dibaca', value: dashboardData?.booksRead || 0, icon: '📖' },
    { title: 'Progress Bacaan', value: `${dashboardData?.readingProgress || 0}%`, icon: '📊' },
    { title: 'Favorit', value: dashboardData?.favoriteBooks || 0, icon: '❤️' }
  ]

  const ActivitySection = ({ activities }) => (
    <div className="card">
      <h3 className="section-title">Aktivitas Terbaru</h3>
      {activities?.length > 0 ? (
        <div className="activity-list">{activities.map((activity, index) => (<div key={index} className="activity-item"><strong className="activity-title">{activity.title}</strong><p className="activity-description">{activity.description}</p><small className="activity-date">{new Date(activity.date).toLocaleDateString('id-ID')}</small></div>))}</div>
      ) : (<p className="empty-state">Belum ada aktivitas terbaru.</p>)}
    </div>
  )

  const RecommendationSection = ({ recommendations }) => (
    <div className="card">
      <h3 className="section-title">Rekomendasi Ebook</h3>
      {recommendations?.length > 0 ? (
        <div className="books-grid">{recommendations.map((book) => (<div key={book.id} className="card recommendation-card"><h4 className="book-title">{book.title}</h4><p className="book-author">{book.author}</p><p className="book-excerpt">{book.description?.substring(0, 100)}...</p></div>))}</div>
      ) : (<p className="empty-state">Rekomendasi akan muncul berdasarkan riwayat bacaan Anda.</p>)}
    </div>
  )

  return (
    <div className="dashboard-page">
      <div className="books-grid">{stats.map((stat, index) => (<StatsCard key={index} {...stat} />))}</div>
      <ActivitySection activities={dashboardData?.recentActivity} />
      <RecommendationSection recommendations={dashboardData?.recommendations} />
    </div>
  )
}

export default DashboardPage