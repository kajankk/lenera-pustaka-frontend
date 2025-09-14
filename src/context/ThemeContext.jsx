import React, { createContext, useState, useEffect } from 'react'
import { THEMES, STORAGE_KEYS } from '../utils/constants'

export const ThemeContext = createContext()

export const ThemeProvider = ({ children }) => {
  // Default ke THEMES.DARK sebagai mode default
  const [theme, setTheme] = useState(THEMES.DARK)

  useEffect(() => {
    const savedTheme = localStorage.getItem(STORAGE_KEYS.THEME)
    if (savedTheme && Object.values(THEMES).includes(savedTheme)) {
      setTheme(savedTheme)
    } else {
      // Jika tidak ada theme tersimpan, set default ke dark dan simpan
      setTheme(THEMES.DARK)
      localStorage.setItem(STORAGE_KEYS.THEME, THEMES.DARK)
    }
  }, [])

  const toggleTheme = () => {
    const newTheme = theme === THEMES.LIGHT ? THEMES.DARK : THEMES.LIGHT
    setTheme(newTheme)
    localStorage.setItem(STORAGE_KEYS.THEME, newTheme)
  }

  const value = {
    theme,
    toggleTheme,
    isDark: theme === THEMES.DARK
  }

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  )
}