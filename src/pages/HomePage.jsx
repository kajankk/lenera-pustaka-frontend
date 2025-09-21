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
        <p className="hero-subtitle">Perpustakaan digital untuk buku-buku domain publik dalam format EPUB</p>
        <div className="hero-actions">
          <Link to={ROUTES.BOOKS} className="btn btn-primary">Jelajahi Koleksi</Link>
          <a href="#about" className="btn btn-secondary">Pelajari Lebih Lanjut</a>
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
        <h2 className="about-title">Manifesto</h2>
        <p className="about-text">Bukan Kuil Budaya, lantaran memang tak sebanding dengan perpustakaan Alexandria yang kesohor itu. Tapi di sini, siapa pun juga dapat menemukan buku-buku keren—gratis!</p>
        <p>Dorongan kekecewaan yang amat sangat di kalangan mahasiswa yang bangkrut, para pelajar melarat, dan orang-orang kalah. Lentera Pustaka didirikan sebagai tempat umum dengan batu bata dan semen selundupan.
        Kami berbagi file, mengedarkan pamflet-pamflet buatan sendiri yang kami kumpulkan dari berbagai sumber yang tersebar di <em>segara</em> internet. Kami menyuntingnya, sambil menyanyikan himne dan lagu-lagu rohani.</p>
        <p>Paling banter, kami cuma pelaku vandalisme yang menggorok leher sendiri—meneror dengan hukuman yang patut dicontoh.</p>
      </div>
    </div>
  )
}

export default HomePage