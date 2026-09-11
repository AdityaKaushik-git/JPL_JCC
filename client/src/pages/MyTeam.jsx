import { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { api } from '../services/api'

function fmt(n) { return Number(n || 0).toLocaleString('en-IN') }

export default function MyTeam() {
  const { user } = useAuth()
  const [team, setTeam] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.getMyTeam()
      .then(d => setTeam(d.team || []))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const totalSpent = team.reduce((s, p) => s + Number(p.purchase_price), 0)
  const purse = Number(user?.purse || 0)

  const roleColor = { Batsman: 'badge-info', Bowler: 'badge-danger', 'All-Rounder': 'badge-success', 'Wicket Keeper': 'badge-warning' }

  if (loading) return <div className="spinner-wrapper" style={{ minHeight: '60vh' }}><div className="spinner" style={{ width: 48, height: 48 }} /></div>

  return (
    <div className="page">
      <div className="page-header">
        <h1>🏆 My Team</h1>
        <p>Your purchased players</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card"><div className="stat-label">Players</div><div className="stat-value">{team.length}</div></div>
        <div className="stat-card"><div className="stat-label">Total Spent</div><div className="stat-value">₹{fmt(totalSpent)}</div></div>
        <div className="stat-card"><div className="stat-label">Purse Left</div><div className="stat-value">₹{fmt(purse)}</div></div>
      </div>

      {team.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">👥</div>
          <h3>No players yet</h3>
          <p>Go to the live auction and start bidding!</p>
        </div>
      ) : (
        <div className="player-grid">
          {team.map(p => (
            <div key={p.id} className="player-item">
              <div className="p-name">{p.player_name}</div>
              <div className="player-meta" style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.5rem' }}>
                <span className={`badge ${roleColor[p.playing_role] || 'badge-gray'}`}>{p.playing_role}</span>
              </div>
              <div className="p-meta">
                {p.course} • {p.year} Year
              </div>
              <div className="p-price">₹{fmt(p.purchase_price)}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}