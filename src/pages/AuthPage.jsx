// AuthPage.jsx - Fixed with proper Google integration
import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../hooks/useTheme'
import { ROUTES } from '../utils/constants'

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const { login, register, loginWithGoogle } = useAuth()
  const { theme } = useTheme()
  const navigate = useNavigate()

  // Load Google API
  useEffect(() => {
    const loadGoogleAPI = () => {
      if (document.getElementById('google-auth-script')) return

      const script = document.createElement('script')
      script.id = 'google-auth-script'
      script.src = 'https://accounts.google.com/gsi/client'
      script.async = true
      script.defer = true
      document.head.appendChild(script)
    }

    loadGoogleAPI()
  }, [])

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      password: '',
      confirmPassword: ''
    })
    setError('')
    setSuccess('')
  }

  const toggleAuthMode = () => {
    setIsLogin(!isLogin)
    resetForm()
  }

  // FIXED: Proper Google login implementation
  const handleGoogleLogin = async () => {
    setGoogleLoading(true)
    setError('')
    setSuccess('')

    try {
      const result = await loginWithGoogle()

      if (result.success) {
        navigate(ROUTES.DASHBOARD)
      } else {
        setError(result.error || 'Login dengan Google gagal')
      }
    } catch (error) {
      console.error('Google login error:', error)
      setError('Terjadi kesalahan saat login dengan Google')
    }

    setGoogleLoading(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    if (isLogin) {
      // For login, accept both email and username
      const result = await login({
        username: formData.email, // FIXED: Changed from 'email' to 'username' to match backend
        password: formData.password
      })

      if (result.success) {
        navigate(ROUTES.DASHBOARD)
      } else {
        setError(result.error)
      }
    } else {
      if (formData.password !== formData.confirmPassword) {
        setError('Kata sandi tidak cocok')
        setLoading(false)
        return
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(formData.email)) {
        setError('Format email tidak valid')
        setLoading(false)
        return
      }

      // FIXED: Match backend RegisterRequest fields
      const result = await register({
        username: formData.email.split('@')[0], // Generate username from email
        fullName: formData.name, // Changed from 'name' to 'fullName'
        email: formData.email,
        password: formData.password,
        bio: null // Add bio field for backend compatibility
      })

      if (result.success) {
        setSuccess('Akun berhasil dibuat! Silakan masuk.')
        setFormData({
          name: '',
          email: '',
          password: '',
          confirmPassword: ''
        })
        setTimeout(() => {
          setIsLogin(true)
          setSuccess('')
        }, 2000)
      } else {
        setError(result.error)
      }
    }
    setLoading(false)
  }

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  return (
    <div className="auth-container">
      <div className="card">
        <div className="text-center mb-2">
          <h2 style={{
            fontSize: '2rem',
            fontWeight: 'bold',
            color: theme === 'dark' ? 'var(--primary-pink)' : 'var(--primary-green)'
          }}>
            {isLogin ? 'Masuk ke Akun' : 'Daftar Akun Baru'}
          </h2>
          <p style={{ fontSize: '0.9rem', opacity: 0.8 }}>
            {isLogin
              ? 'Masuk untuk mengakses ebook'
              : 'Buat akun untuk mulai membaca'
            }
          </p>
        </div>

        {error && <div className="error mb-1">{error}</div>}
        {success && <div className="success mb-1">{success}</div>}

        {/* Google Login Button */}
        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={googleLoading || loading}
          className="btn"
          style={{
            width: '100%',
            padding: '0.75rem',
            marginBottom: '1.5rem',
            backgroundColor: '#4285f4',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '0.95rem',
            fontWeight: '500',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            cursor: googleLoading ? 'not-allowed' : 'pointer',
            opacity: googleLoading ? 0.7 : 1,
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            if (!googleLoading && !loading) {
              e.target.style.backgroundColor = '#357ae8';
            }
          }}
          onMouseLeave={(e) => {
            if (!googleLoading && !loading) {
              e.target.style.backgroundColor = '#4285f4';
            }
          }}
        >
          {/* Google Icon */}
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          {googleLoading ? 'Memproses...' : `${isLogin ? 'Masuk' : 'Daftar'} dengan Google`}
        </button>

        {/* Divider */}
        <div style={{
          position: 'relative',
          textAlign: 'center',
          marginBottom: '1.5rem'
        }}>
          <div style={{
            height: '1px',
            backgroundColor: theme === 'dark' ? '#333' : '#ddd',
            width: '100%'
          }}></div>
          <span style={{
            position: 'absolute',
            top: '-0.5rem',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: theme === 'dark' ? 'var(--card-bg)' : '#fff',
            padding: '0 1rem',
            fontSize: '0.85rem',
            opacity: 0.7
          }}>
            atau
          </span>
        </div>

        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <div className="form-group">
              <label>Nama Lengkap</label>
              <input
                type="text"
                name="name"
                className="form-control"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Masukkan nama lengkap Anda"
                required={!isLogin}
                style={{
                  color: theme === 'dark' ? '#ffffff' : 'inherit',
                  backgroundColor: theme === 'dark' ? 'var(--card-bg)' : 'inherit',
                  border: theme === 'dark' ? '1px solid var(--border-color)' : 'inherit'
                }}
              />
            </div>
          )}

          <div className="form-group">
            <label>{isLogin ? 'Email atau Username' : 'Email'}</label>
            <input
              type={isLogin ? 'text' : 'email'}
              name="email"
              className="form-control"
              value={formData.email}
              onChange={handleInputChange}
              placeholder={isLogin ? 'Masukkan email atau username' : 'Masukkan alamat email'}
              required
              style={{
                color: theme === 'dark' ? '#ffffff' : 'inherit',
                backgroundColor: theme === 'dark' ? 'var(--card-bg)' : 'inherit',
                border: theme === 'dark' ? '1px solid var(--border-color)' : 'inherit'
              }}
            />
          </div>

          <div className="form-group">
            <label>Kata Sandi</label>
            <input
              type="password"
              name="password"
              className="form-control"
              value={formData.password}
              onChange={handleInputChange}
              placeholder="Masukkan kata sandi"
              required
              style={{
                color: theme === 'dark' ? '#ffffff' : 'inherit',
                backgroundColor: theme === 'dark' ? 'var(--card-bg)' : 'inherit',
                border: theme === 'dark' ? '1px solid var(--border-color)' : 'inherit'
              }}
            />
          </div>

          {!isLogin && (
            <div className="form-group">
              <label>Konfirmasi Kata Sandi</label>
              <input
                type="password"
                name="confirmPassword"
                className="form-control"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                placeholder="Masukkan ulang kata sandi"
                required={!isLogin}
                style={{
                  color: theme === 'dark' ? '#ffffff' : 'inherit',
                  backgroundColor: theme === 'dark' ? 'var(--card-bg)' : 'inherit',
                  border: theme === 'dark' ? '1px solid var(--border-color)' : 'inherit'
                }}
              />
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary w-full"
            disabled={loading || googleLoading}
          >
            {loading ? 'Memproses...' : isLogin ? 'Masuk' : 'Daftar'}
          </button>
        </form>

        <div className="text-center mt-2">
          <p style={{ fontSize: '0.9rem' }}>
            {isLogin ? 'Belum punya akun?' : 'Sudah punya akun?'}
          </p>
          <button
            type="button"
            onClick={toggleAuthMode}
            className="btn btn-secondary"
            style={{ fontSize: '0.9rem', padding: '0.5rem 1rem' }}
            disabled={loading || googleLoading}
          >
            {isLogin ? 'Daftar di sini' : 'Masuk di sini'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default AuthPage