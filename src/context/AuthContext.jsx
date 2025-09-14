import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { authService } from '../services/authService'
import { STORAGE_KEYS } from '../utils/constants'

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN)
    const currentUser = authService.getCurrentUser()

    if (token && currentUser) {
      setUser(currentUser)
      setIsAuthenticated(true)
    }
    setLoading(false)
  }, [])

  const login = useCallback(async (credentials) => {
    try {
      const { user } = await authService.login(credentials)
      setUser(user)
      setIsAuthenticated(true)
      return { success: true, user }
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Gagal masuk'
      }
    }
  }, [])

  const register = useCallback(async (userData) => {
    try {
      const response = await authService.register(userData)
      return { success: true, data: response }
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Gagal mendaftar'
      }
    }
  }, [])

  const logout = useCallback(async () => {
    try {
      await authService.logout()
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      setUser(null)
      setIsAuthenticated(false)
    }
  }, [])

  const loginWithGoogle = useCallback(async () => {
    return new Promise((resolve) => {
      if (typeof window.google === 'undefined') {
        resolve({
          success: false,
          error: 'Google SDK tidak dimuat. Silakan muat ulang halaman.'
        })
        return
      }

      try {
        window.google.accounts.id.initialize({
          client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
          callback: async (response) => {
            try {
              const { user } = await authService.googleAuth(response.credential)
              setUser(user)
              setIsAuthenticated(true)
              resolve({ success: true, user })
            } catch (error) {
              console.error('Google auth error:', error)
              resolve({
                success: false,
                error: error.response?.data?.message || 'Gagal masuk dengan Google'
              })
            }
          },
          auto_select: false,
          cancel_on_tap_outside: true
        })

        window.google.accounts.id.prompt((notification) => {
          if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
            const buttonContainer = document.createElement('div')
            buttonContainer.style.position = 'absolute'
            buttonContainer.style.top = '-9999px'
            document.body.appendChild(buttonContainer)

            window.google.accounts.id.renderButton(buttonContainer, {
              type: 'standard',
              size: 'large',
              text: 'signin_with',
              shape: 'rectangular',
              logo_alignment: 'left'
            })

            setTimeout(() => {
              const googleButton = buttonContainer.querySelector('div[role="button"]')
              if (googleButton) {
                googleButton.click()
              } else {
                resolve({
                  success: false,
                  error: 'Tidak dapat memulai Google Sign-In'
                })
              }
              document.body.removeChild(buttonContainer)
            }, 100)
          }
        })
      } catch (error) {
        console.error('Google initialization error:', error)
        resolve({
          success: false,
          error: 'Gagal menginisialisasi Google Sign-In'
        })
      }
    })
  }, [])

  const value = {
    user,
    loading,
    isAuthenticated,
    login,
    register,
    logout,
    loginWithGoogle
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}