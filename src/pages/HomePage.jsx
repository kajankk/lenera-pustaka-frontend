import React from 'react'
import { Link } from 'react-router-dom'
import { ROUTES } from '../utils/constants'

const HomePage = () => {
  return (
    <div>
      <div
        className="card text-center mb-3"
        style={{ padding: '2rem 1rem', overflow: 'visible' }}
      >
        <h1
          className="book-title"
          style={{
            fontSize: '3rem',
            marginBottom: '1rem',
            lineHeight: '1.0', // biar teks gak kepotong
          }}
        >
          Lentera Pustaka
        </h1>
        <p
          style={{
            fontSize: '1.3rem',
            marginBottom: '2rem',
            opacity: '0.8',
          }}
        >
          Perpustakaan digital untuk buku-buku domain publik dalam format EPUB
        </p>
        <div className="flex justify-center gap-1" style={{ flexWrap: 'wrap' }}>
          <Link to={ROUTES.BOOKS} className="btn btn-primary">
            Jelajahi Koleksi
          </Link>
          <a href="#about" className="btn btn-secondary">
            Pelajari Lebih Lanjut
          </a>
        </div>
      </div>

      <div className="books-grid">
        <div className="card text-center">
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📚</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
            Koleksi Lengkap
          </div>
          <div>Ebook Domain Publik</div>
        </div>
        <div className="card text-center">
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>👥</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
            Komunitas Aktif
          </div>
          <div>Pembaca dari Seluruh Nusantara</div>
        </div>
        <div className="card text-center">
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🏷️</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
            Genre Beragam
          </div>
          <div>Sastra Klasik hingga Modern</div>
        </div>
        <div className="card text-center">
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🔓</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
            Akses Gratis
          </div>
          <div>Tanpa Biaya Berlangganan</div>
        </div>
      </div>

      <div className="card" id="about" style={{ padding: '1.5rem' }}>
        <h2
          style={{
            color: 'var(--primary-pink)',
            marginBottom: '1rem',
          }}
        >
          Tentang Lentera Pustaka
        </h2>
        <p style={{ lineHeight: '1.8', marginBottom: '1rem' }}>
          Lentera Pustaka adalah perpustakaan digital yang mengkhususkan diri pada koleksi
          buku-buku domain publik dalam format EPUB. Kami berkomitmen untuk menyediakan
          akses gratis dan mudah kepada karya-karya sastra klasik dan buku-buku berkualitas
          yang telah menjadi bagian dari warisan budaya manusia.
        </p>
        <p style={{ lineHeight: '1.8' }}>
          Dengan antarmuka yang elegan dan fitur pembaca yang nyaman, Lentera Pustaka hadir
          untuk memfasilitasi pengalaman membaca digital yang menyenangkan bagi semua
          kalangan.
        </p>
      </div>
    </div>
  )
}

export default HomePage
