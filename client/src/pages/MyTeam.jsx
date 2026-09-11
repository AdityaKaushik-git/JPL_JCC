import { useEffect, useState } from 'react'
import { api } from '../services/api'
import { Users, UserCircle } from 'lucide-react'

function fmt(n) { return Number(n || 0).toLocaleString('en-IN') }

export default function MyTeam() {
  const [team, setTeam] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.getMyTeam()
      .then(d => setTeam(d.team || []))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="spinner-wrapper" style={{ minHeight: '60vh' }}><div className="spinner" style={{ width: 48, height: 48 }} /></div>

  const totalSpent = team.reduce((sum, p) => sum + Number(p.purchase_price), 0)

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Users size={32} color="var(--primary)" /> My Team Roster</h1>
          <p>Your officially acquired players</p>
        </div>
      </div>

      {team.length === 0 ? (
        <div className="empty-state">
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}><Users size={64} opacity={0.3} /></div>
          <h3>Your squad is empty</h3>
          <p>You haven't bought any players yet. Join the auction to build your team!</p>
        </div>
      ) : (
        <>
          <div className="card mb-3 flex justify-between items-center" style={{ background: 'var(--primary-bg)', borderColor: '#FFD8C4' }}>
            <div>
              <div className="text-medium fw-700" style={{ fontSize: '0.85rem' }}>TOTAL SQUAD SIZE</div>
              <div className="text-dark fw-800" style={{ fontSize: '1.5rem' }}>{team.length} Players</div>
            </div>
            <div className="text-right">
              <div className="text-medium fw-700" style={{ fontSize: '0.85rem', color: 'var(--primary-dark)' }}>TOTAL SPENT</div>
              <div className="text-primary fw-800" style={{ fontSize: '1.8rem' }}>₹{fmt(totalSpent)}</div>
            </div>
          </div>
          <div className="player-grid">
            {team.map(p => (
              <div key={p.id} className="player-item">
                <div className="flex items-center gap-3 mb-3">
                  <div className="avatar-circle"><UserCircle size={28} /></div>
                  <div>
                    <div className="p-name">{p.player_name}</div>
                    <span className="badge badge-gray">{p.playing_role}</span>
                  </div>
                </div>
                <div className="p-meta">
                  <span>{p.course}</span> • <span>{p.year} Year</span>
                </div>
                <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem', marginTop: '1rem' }}>
                  <div className="text-medium" style={{ fontSize: '0.8rem', fontWeight: 700 }}>ACQUIRED FOR</div>
                  <div className="p-price">₹{fmt(p.purchase_price)}</div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
