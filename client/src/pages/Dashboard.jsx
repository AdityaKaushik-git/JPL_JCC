import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { api } from '../services/api'

function fmt(n) { return Number(n || 0).toLocaleString('en-IN') }

export default function Dashboard() {
  const { user } = useAuth()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.getDashboard()
      .then(d => setData(d))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="spinner-wrapper" style={{ minHeight: '60vh' }}><div className="spinner" style={{ width: 48, height: 48 }} /></div>

  // ADMIN dashboard
  if (user?.role === 'admin') {
    return (
      <div className="page">
        <div className="page-header">
          <h1>⚙️ Admin Dashboard</h1>
          <p>Manage the JPL Auction</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <Link to="/auction" className="btn btn-primary btn-lg">🎙️ Go to Auction</Link>
          <Link to="/admin" className="btn btn-outline btn-lg">📋 Admin Panel</Link>
        </div>
      </div>
    )
  }

  // PLAYER dashboard
  if (user?.role === 'player') {
    const p = data?.player
    const statusClass = p?.status === 'Sold' ? 'badge-success' : p?.status === 'In Auction' ? 'badge-orange' : 'badge-gray'
    return (
      <div className="page">
        <div className="page-header">
          <h1>🏏 Player Dashboard</h1>
        </div>
        {p ? (
          <div className="card" style={{ maxWidth: 480 }}>
            <div className="flex items-center gap-2 mb-2">
              <div className="avatar-circle" style={{ width: 56, height: 56, fontSize: '1.5rem' }}>
                {p.name?.charAt(0)}
              </div>
              <div>
                <div className="fw-800" style={{ fontSize: '1.2rem' }}>{p.name}</div>
                <span className={`badge ${statusClass}`}>{p.status}</span>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem 1.5rem', marginTop: '1rem' }}>
              <div><span className="text-medium" style={{ fontSize: '0.8rem' }}>ROLE</span><div className="fw-700">{p.playing_role}</div></div>
              <div><span className="text-medium" style={{ fontSize: '0.8rem' }}>COURSE</span><div className="fw-700">{p.course}</div></div>
              <div><span className="text-medium" style={{ fontSize: '0.8rem' }}>YEAR</span><div className="fw-700">{p.year}</div></div>
              <div><span className="text-medium" style={{ fontSize: '0.8rem' }}>BASE PRICE</span><div className="fw-700 text-primary">₹{fmt(p.base_price)}</div></div>
            </div>
            {p.status === 'Sold' && (
              <div className="alert alert-success mt-2">
                🎉 Sold to <strong>{p.bought_by_name}</strong> for ₹{fmt(p.winning_bid)}
              </div>
            )}
            <Link to="/auction" className="btn btn-primary btn-full mt-3">Watch Live Auction</Link>
          </div>
        ) : (
          <div className="card">Your player profile is being set up.</div>
        )}
      </div>
    )
  }

  // USER (bidder) dashboard
  return (
    <div className="page">
      <div className="page-header">
        <h1>👋 Welcome, {user?.full_name?.split(' ')[0]}!</h1>
        <p>Your auction dashboard</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Purse Remaining</div>
          <div className="stat-value">₹{fmt(data?.purse)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Players Bought</div>
          <div className="stat-value">{data?.playersBought || 0}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total Spent</div>
          <div className="stat-value">₹{fmt(data?.totalSpent)}</div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
        <Link to="/auction" className="btn btn-primary">🎙️ Live Auction</Link>
        <Link to="/my-team" className="btn btn-outline">👥 My Team</Link>
        <Link to="/my-bids" className="btn btn-secondary">📊 My Bids</Link>
      </div>

      {data?.recentBids?.length > 0 && (
        <div>
          <h3 className="fw-700 mb-2">Recent Bids</h3>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Player</th><th>Amount</th><th>Status</th></tr></thead>
              <tbody>
                {data.recentBids.map((b, i) => (
                  <tr key={i}>
                    <td>{b.player_name}</td>
                    <td className="text-primary fw-700">₹{fmt(b.bid_amount)}</td>
                    <td><span className={`badge ${b.status === 'Won' ? 'badge-success' : 'badge-gray'}`}>{b.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}