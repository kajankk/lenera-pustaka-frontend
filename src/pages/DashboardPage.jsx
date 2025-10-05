import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../utils/api'
import { API_ENDPOINTS } from '../utils/constants'
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
        console.log('Dashboard data:', response.data)
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

  if (loading) {
    return (
      <div className="dashboard-container" style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="loading-spinner" style={{
            width: '50px',
            height: '50px',
            border: '4px solid rgba(0,0,0,0.1)',
            borderTop: theme === 'light' ? '4px solid var(--primary-green)' : '4px solid var(--primary-pink)',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 1rem'
          }}></div>
          <p>Memuat dashboard...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="dashboard-container" style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="dashboard-card" style={{ maxWidth: '500px', textAlign: 'center' }}>
          <span style={{ fontSize: '3rem', display: 'block', marginBottom: '1rem' }}>⚠️</span>
          <h3 style={{ marginBottom: '0.5rem' }}>Terjadi Kesalahan</h3>
          <p style={{ opacity: 0.8 }}>{error}</p>
        </div>
      </div>
    )
  }

  const stats = dashboardData?.contributionStats || {}

  return (
    <div className="dashboard-container">
      {/* Header */}
      <div className="dashboard-header">
        <h1 className="dashboard-title">Dashboard</h1>
        <p className="dashboard-subtitle">
          Selamat datang kembali! Berikut adalah ringkasan aktivitas Anda.
        </p>
      </div>

      {/* Quick Actions */}
      <div className="dashboard-actions">
        <Link to="/projects/new" className="action-button">
          <span>➕</span>
          <span>Buat Proyek Baru</span>
        </Link>
        <Link to="/projects" className="action-button">
          <span>📚</span>
          <span>Jelajahi Proyek</span>
        </Link>
        <Link to="/profile" className="action-button">
          <span>👤</span>
          <span>Edit Profil</span>
        </Link>
      </div>

      {/* Main Grid */}
      <div className="dashboard-grid">
        {/* Main Content */}
        <div className="dashboard-main">
          {/* Quick Stats */}
          <div className="quick-stats">
            <div className="stat-card">
              <span className="stat-icon">📚</span>
              <div className="stat-number">{stats.projectsCreated || 0}</div>
              <div className="stat-label">Proyek Dibuat</div>
            </div>
            <div className="stat-card">
              <span className="stat-icon">🤝</span>
              <div className="stat-number">{stats.projectsJoined || 0}</div>
              <div className="stat-label">Proyek Bergabung</div>
            </div>
            <div className="stat-card">
              <span className="stat-icon">✍️</span>
              <div className="stat-number">{stats.totalContributions || 0}</div>
              <div className="stat-label">Total Kontribusi</div>
            </div>
            <div className="stat-card">
              <span className="stat-icon">🌐</span>
              <div className="stat-number">{stats.pagesTranslated || 0}</div>
              <div className="stat-label">Halaman Diterjemahkan</div>
            </div>
          </div>

          {/* Detailed Stats */}
          <div className="dashboard-card">
            <h3>
              <span>📊</span>
              <span>Statistik Kontribusi Detail</span>
            </h3>
            <div className="quick-stats">
              <div className="stat-card">
                <span className="stat-icon">✏️</span>
                <div className="stat-number">{stats.pagesEdited || 0}</div>
                <div className="stat-label">Halaman Diedit</div>
              </div>
              <div className="stat-card">
                <span className="stat-icon">🔍</span>
                <div className="stat-number">{stats.pagesProofread || 0}</div>
                <div className="stat-label">Halaman Dikoreksi</div>
              </div>
              <div className="stat-card">
                <span className="stat-icon">🎨</span>
                <div className="stat-number">{stats.pagesIllustrated || 0}</div>
                <div className="stat-label">Halaman Diilustrasikan</div>
              </div>
              <div className="stat-card">
                <span className="stat-icon">📝</span>
                <div className="stat-number">{stats.pagesTranscribed || 0}</div>
                <div className="stat-label">Halaman Disalin</div>
              </div>
              <div className="stat-card">
                <span className="stat-icon">⭐</span>
                <div className="stat-number">{stats.pagesReviewed || 0}</div>
                <div className="stat-label">Halaman Direview</div>
              </div>
              <div className="stat-card">
                <span className="stat-icon">💬</span>
                <div className="stat-number">{stats.totalCommentsReceived || 0}</div>
                <div className="stat-label">Komentar Diterima</div>
              </div>
            </div>
          </div>

          {/* Created Projects */}
          <div className="dashboard-card">
            <h3>
              <span>📂</span>
              <span>Proyek yang Saya Buat ({dashboardData?.createdProjects?.length || 0})</span>
            </h3>
            {dashboardData?.createdProjects && dashboardData.createdProjects.length > 0 ? (
              <div className="progress-list">
                {dashboardData.createdProjects.slice(0, 5).map((project) => (
                  <Link
                    key={project.id}
                    to={`/projects/${project.id}`}
                    className="progress-item"
                    style={{ textDecoration: 'none', color: 'inherit' }}
                  >
                    <div className="progress-book-cover" style={{
                      background: project.coverImageUrl ? `url(${project.coverImageUrl})` : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      backgroundSize: 'cover',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontWeight: 'bold',
                      fontSize: '1.5rem'
                    }}>
                      {!project.coverImageUrl && project.title?.charAt(0).toUpperCase()}
                    </div>
                    <div className="progress-book-info">
                      <div className="progress-book-title">{project.title}</div>
                      <div className="progress-book-author">
                        {project.author} • {project.status}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div className="progress-bar-container" style={{ flex: 1 }}>
                          <div
                            className="progress-bar-fill"
                            style={{ width: `${(project.overallProgress || 0) * 100}%` }}
                          />
                        </div>
                        <span className="progress-percentage">
                          {Math.round((project.overallProgress || 0) * 100)}%
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <span className="empty-icon">📚</span>
                <div className="empty-title">Belum Ada Proyek</div>
                <div className="empty-description">
                  Anda belum membuat proyek apapun. Mulai buat proyek pertama Anda sekarang!
                </div>
                <Link to="/projects/new" className="action-button" style={{ display: 'inline-flex', marginTop: '1rem' }}>
                  <span>➕</span>
                  <span>Buat Proyek</span>
                </Link>
              </div>
            )}
          </div>

          {/* Joined Projects */}
          <div className="dashboard-card">
            <h3>
              <span>🤝</span>
              <span>Proyek yang Saya Ikuti ({dashboardData?.joinedProjects?.length || 0})</span>
            </h3>
            {dashboardData?.joinedProjects && dashboardData.joinedProjects.length > 0 ? (
              <div className="progress-list">
                {dashboardData.joinedProjects.map((project) => (
                  <Link
                    key={project.projectId}
                    to={`/projects/${project.projectId}`}
                    className="progress-item"
                    style={{ textDecoration: 'none', color: 'inherit' }}
                  >
                    <div className="progress-book-cover" style={{
                      background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontWeight: 'bold',
                      fontSize: '1.5rem'
                    }}>
                      {project.projectTitle?.charAt(0).toUpperCase()}
                    </div>
                    <div className="progress-book-info">
                      <div className="progress-book-title">{project.projectTitle}</div>
                      <div className="progress-book-author">
                        Role: {project.role} • {project.projectStatus}
                      </div>
                      <div className="progress-book-author" style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>
                        Halaman saya selesai: {project.myCompletedPages} / {JSON.parse(project.assignedPages || '[]').length}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div className="progress-bar-container" style={{ flex: 1 }}>
                          <div
                            className="progress-bar-fill"
                            style={{ width: `${(project.projectProgress || 0) * 100}%` }}
                          />
                        </div>
                        <span className="progress-percentage">
                          {Math.round((project.projectProgress || 0) * 100)}%
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <span className="empty-icon">🤝</span>
                <div className="empty-title">Belum Bergabung</div>
                <div className="empty-description">
                  Anda belum bergabung di proyek apapun. Jelajahi proyek dan mulai berkontribusi!
                </div>
                <Link to="/projects" className="action-button" style={{ display: 'inline-flex', marginTop: '1rem' }}>
                  <span>🔍</span>
                  <span>Jelajahi Proyek</span>
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="dashboard-sidebar">
          {/* Recent Activity */}
          <div className="dashboard-card sidebar-widget">
            <h3>
              <span>🔔</span>
              <span>Aktivitas Terbaru</span>
            </h3>
            {dashboardData?.recentActivity && dashboardData.recentActivity.length > 0 ? (
              <div className="activity-feed">
                {dashboardData.recentActivity.map((activity, index) => (
                  <div key={index} className="activity-item">
                    <div className="activity-avatar">
                      {activity.user?.charAt(0).toUpperCase() || '?'}
                    </div>
                    <div className="activity-content">
                      <div className="activity-text">{activity.description}</div>
                      <div className="activity-time">
                        {new Date(activity.createdAt).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state" style={{ padding: '2rem 1rem' }}>
                <span className="empty-icon" style={{ fontSize: '2rem' }}>📭</span>
                <div className="empty-description" style={{ fontSize: '0.85rem' }}>
                  Belum ada aktivitas terbaru
                </div>
              </div>
            )}
          </div>

          {/* Notifications */}
          <div className="dashboard-card sidebar-widget">
            <h3>
              <span>📬</span>
              <span>Notifikasi</span>
            </h3>
            {dashboardData?.recentNotifications && dashboardData.recentNotifications.length > 0 ? (
              <div className="activity-feed">
                {dashboardData.recentNotifications.map((notif, index) => (
                  <div key={index} className="activity-item">
                    <div className="activity-avatar">!</div>
                    <div className="activity-content">
                      <div className="activity-text">{notif.message}</div>
                      <div className="activity-time">
                        {new Date(notif.createdAt).toLocaleDateString('id-ID')}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state" style={{ padding: '2rem 1rem' }}>
                <span className="empty-icon" style={{ fontSize: '2rem' }}>🔕</span>
                <div className="empty-description" style={{ fontSize: '0.85rem' }}>
                  Tidak ada notifikasi
                </div>
              </div>
            )}
          </div>

          {/* Followed Projects */}
          {dashboardData?.followedProjects && dashboardData.followedProjects.length > 0 && (
            <div className="dashboard-card sidebar-widget">
              <h3>
                <span>⭐</span>
                <span>Proyek Diikuti</span>
              </h3>
              <div className="recommendations-list">
                {dashboardData.followedProjects.map((project) => (
                  <Link
                    key={project.projectId}
                    to={`/projects/${project.projectId}`}
                    className="recommendation-item"
                    style={{ textDecoration: 'none', color: 'inherit' }}
                  >
                    <div className="recommendation-cover" style={{
                      background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontWeight: 'bold',
                      fontSize: '1.5rem'
                    }}>
                      {project.projectTitle?.charAt(0).toUpperCase()}
                    </div>
                    <div className="recommendation-info">
                      <div className="recommendation-title">{project.projectTitle}</div>
                      <div className="recommendation-author">
                        {project.projectStatus}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}

export default DashboardPage