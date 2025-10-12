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
        <h1 className="hero-title">Massa Silam</h1>
        <p className="hero-subtitle">Perpustakaan online untuk buku-buku domain publik yang terbengkalai dan terdegradasi</p>
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

      <div className="about-section" id="about">
        <h2 className="hero-title">Tentang Kami</h2>
        <div className="description-text" style={{ textAlign: 'justify' }}>
          <p style={{ marginBottom: 0 }}>Bukan Kuil Budaya, lantaran memang tak sebanding dengan perpustakaan Alexandria yang kesohor itu. Tapi di sini, siapa pun juga dapat menemukan buku-buku keren—gratis!</p>
          <p style={{ marginBottom: 0 }}>Dorongan kekecewaan yang amat sangat di kalangan mahasiswa yang bangkrut, para pelajar melarat, dan orang-orang kalah—maka daripada itu—<em>Massa Silam</em> didirikan sebagai perpustakaan umum dengan semen selundupan. Kami berbagi file, mengedarkan pamflet-pamflet buatan sendiri yang kami pungut dari <em>segara</em> internet. Kami menyuntingnya, sambil menyanyikan lagu-lagu rohani dan himne <em>Indonesia Raya</em>.</p>
          <p style={{ marginBottom: 0 }}>Pelaku vandalisme yang menggorok leher sendiri—meneror dengan hukuman yang patut dicontoh.</p>
          <p style={{ marginBottom: 0 }}>Selamat menikmati!</p>
        </div>
      </div>
    </div>
  )
}

export default HomePage