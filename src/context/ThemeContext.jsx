import React, { createContext, useState, useEffect, useCallback } from 'react'
import { THEMES, STORAGE_KEYS } from '../utils/constants'

export const ThemeContext = createContext()

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(THEMES.DARK)

  useEffect(() => {
    const savedTheme = localStorage.getItem(STORAGE_KEYS.THEME)
    const initialTheme = Object.values(THEMES).includes(savedTheme) ? savedTheme : THEMES.DARK
    setTheme(initialTheme)
    localStorage.setItem(STORAGE_KEYS.THEME, initialTheme)
  }, [])

  const toggleTheme = useCallback(() => {
    const newTheme = theme === THEMES.LIGHT ? THEMES.DARK : THEMES.LIGHT
    setTheme(newTheme)
    localStorage.setItem(STORAGE_KEYS.THEME, newTheme)
  }, [theme])

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