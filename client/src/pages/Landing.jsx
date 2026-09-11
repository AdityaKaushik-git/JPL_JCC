import { Link } from 'react-router-dom'

export default function Landing() {
  return (
    <div>
      <div className="hero">
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🏏</div>
        <h1>JPL Auction</h1>
        <p>JCC College Cricket Premier League — bid on your favourite players in real time</p>
        <div className="hero-btns">
          <Link to="/login" className="btn btn-white btn-lg">Sign In</Link>
          <Link to="/register" className="btn btn-lg" style={{ background: 'transparent', color: 'white', border: '2px solid white' }}>Register</Link>
        </div>
      </div>

      <div className="features-section">
        <h2>How It Works</h2>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feat-icon">🎯</div>
            <h3>Live Bidding</h3>
            <p>Place bids in real-time during live auctions. Every second counts!</p>
          </div>
          <div className="feature-card">
            <div className="feat-icon">🏏</div>
            <h3>Build Your Team</h3>
            <p>Buy the best players and assemble your dream cricket squad.</p>
          </div>
          <div className="feature-card">
            <div className="feat-icon">📊</div>
            <h3>Track Everything</h3>
            <p>Monitor your bids, purse balance, and team stats in one place.</p>
          </div>
        </div>
      </div>

      <div className="stats-strip">
        <div className="stats-strip-inner">
          <div className="strip-stat"><div className="num">50+</div><div className="lbl">Players</div></div>
          <div className="strip-stat"><div className="num">10</div><div className="lbl">Teams</div></div>
          <div className="strip-stat"><div className="num">Live</div><div className="lbl">Auctions</div></div>
        </div>
      </div>

      <footer>© 2024 JPL Auction | JCC College</footer>
    </div>
  )
}