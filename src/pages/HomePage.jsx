import React from 'react'
import { Link } from 'react-router-dom'
import { ROUTES } from '../utils/constants'

const HomePage = () => {
  const features = [
    { icon: '📚', title: 'Koleksi Lengkap', subtitle: 'Ebook Domain Publik' },
    { icon: '👥', title: 'Komunitas Aktif', subtitle: 'Pembaca dari Seluruh Nusantara' },
    { icon: '🏷️', title: 'Genre Beragam', subtitle: 'Sastra Klasik hingga Modern' },
    { icon: '🔓', title: 'Akses Gratis', subtitle: 'Tanpa Biaya Berlangganan' }
  ]

  return (
    <div className="home-page">
      <div className="hero-section">
        <h1 className="hero-title">Lentera Pustaka</h1>
        <p className="hero-subtitle">
          Perpustakaan digital untuk buku-buku domain publik dalam format EPUB
        </p>
        <div className="hero-actions">
          <Link to={ROUTES.BOOKS} className="btn btn-primary">
            Jelajahi Koleksi
          </Link>
          <a href="#about" className="btn btn-secondary">
            Pelajari Lebih Lanjut
          </a>
        </div>
      </div>

      <div className="books-grid features-grid">
        {features.map((feature, index) => (
          <div key={index} className="card feature-card">
            <div className="feature-icon">{feature.icon}</div>
            <div className="feature-title">{feature.title}</div>
            <div className="feature-subtitle">{feature.subtitle}</div>
          </div>
        ))}
      </div>

      <div className="card about-section" id="about">
        <h2 className="about-title">Tentang Lentera Pustaka</h2>
        <p className="about-text">
          Lentera Pustaka adalah perpustakaan digital yang mengkhususkan diri pada koleksi
          buku-buku domain publik dalam format EPUB. Kami berkomitmen untuk menyediakan
          akses gratis dan mudah kepada karya-karya sastra klasik dan buku-buku berkualitas
          yang telah menjadi bagian dari warisan budaya manusia.
        </p>
        <p className="about-text">
          Dengan antarmuka yang elegan dan fitur pembaca yang nyaman, Lentera Pustaka hadir
          untuk memfasilitasi pengalaman membaca digital yang menyenangkan bagi semua
          kalangan.
        </p>
      </div>
    </div>
  )
}

export default HomePage