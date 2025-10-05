import React, { useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import Header from './components/Layout/Header'
import HomePage from './pages/HomePage'
import AuthPage from './pages/AuthPage'
import BooksPage from './pages/BooksPage'
import BookDetailPage from './pages/BookDetailPage'
import DashboardPage from './pages/DashboardPage'
import ReaderPage from './pages/ReaderPage'
import { useTheme } from './hooks/useTheme'
import './styles/index.css'

function App() {
  const { theme } = useTheme()

  useEffect(() => {
    document.body.className = theme
  }, [theme])

  return (
    <div className="app">
      <Header />
      <main className="container">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<AuthPage />} />
          <Route path="/books" element={<BooksPage />} />
          <Route path="/books/:slug" element={<BookDetailPage />} />
          <Route path="/books/:slug/read" element={<ReaderPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
        </Routes>
      </main>
    </div>
  )
}

export default App