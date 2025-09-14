import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../hooks/useTheme'
import { ROUTES } from '../../utils/constants'
import logo from '../../assets/logo.png'

const Header = () => {
  const { user, logout, isAuthenticated } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()

  const handleLogout = async () => {
    navigate(ROUTES.HOME) // redirect ke beranda
    await logout()        // bersihkan session
  }

  return (
    <header className="header">
      <div className="container">
        <nav className="nav">
          <Link to={ROUTES.HOME} className="logo">
            <img
              src={logo}
              alt="Lentera Pustaka Logo"
            />
          </Link>

          <div className="nav-links">
            <Link to={ROUTES.BOOKS} className="nav-link">Ebook</Link>

            {isAuthenticated ? (
              <>
                <Link to={ROUTES.DASHBOARD} className="nav-link">Dashboard</Link>
                {user && (
                  <div className="username-display">
                    {user.name || user.username}
                  </div>
                )}
                <span
                  className="nav-link cursor-pointer"
                  onClick={handleLogout}
                >
                  Keluar
                </span>
              </>
            ) : (
              <Link to={ROUTES.LOGIN} className="nav-link">Masuk</Link>
            )}

            <button className="theme-toggle" onClick={toggleTheme}>
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>
          </div>
        </nav>
      </div>
    </header>
  )
}

export default Header