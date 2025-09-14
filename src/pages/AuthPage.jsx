import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../hooks/useTheme'
import { ROUTES } from '../utils/constants'

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true)
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    password: '',
    confirmPassword: ''
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const { login, register } = useAuth()
  const { theme } = useTheme()
  const navigate = useNavigate()

  const resetForm = () => {
    setFormData({
      name: '',
      username: '',
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

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    if (isLogin) {
      const result = await login({
        username: formData.username,
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

      const result = await register({
        name: formData.name,
        username: formData.username,
        password: formData.password
      })

      if (result.success) {
        setSuccess('Akun berhasil dibuat! Silakan masuk.')
        setFormData({
          name: '',
          username: '',
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
              />
            </div>
          )}

          <div className="form-group">
            <label>Username</label>
            <input
              type="text"
              name="username"
              className="form-control"
              value={formData.username}
              onChange={handleInputChange}
              placeholder="Masukkan username Anda"
              required
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
              />
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary w-full"
            disabled={loading}
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
            disabled={loading}
          >
            {isLogin ? 'Daftar di sini' : 'Masuk di sini'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default AuthPage