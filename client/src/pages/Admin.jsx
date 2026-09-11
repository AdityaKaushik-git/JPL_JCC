import { useEffect, useState } from 'react'
import { api } from '../services/api'

function fmt(n) { return Number(n || 0).toLocaleString('en-IN') }

export default function Admin() {
  const [tab, setTab] = useState('players')
  const [players, setPlayers] = useState([])
  const [users, setUsers] = useState([])
  const [history, setHistory] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.getAdminPlayers().then(d => setPlayers(d.players || [])),
      api.getAdminUsers().then(d => setUsers(d.users || [])),
      api.getAuctionHistory().then(d => setHistory(d.history || [])),
    ]).catch(console.error).finally(() => setLoading(false))
  }, [])

  const statusClass = { Available: 'badge-success', 'In Auction': 'badge-orange', Sold: 'badge-info', Unsold: 'badge-gray' }
  const roleClass = { user: 'badge-info', player: 'badge-success', admin: 'badge-danger' }
  const filteredPlayers = players.filter(p => p.name.toLowerCase().includes(search.toLowerCase()))

  if (loading) return <div className="spinner-wrapper" style={{ minHeight: '60vh' }}><div className="spinner" style={{ width: 48, height: 48 }} /></div>

  return (
    <div className="page" style={{ maxWidth: 1200 }}>
      <div className="page-header">
        <div>
          <h1 className="fw-800">Admin Control Panel</h1>
          <p>Database management and system logs</p>
        </div>
      </div>

      <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
        <div style={{ display: 'flex', gap: '1rem', padding: '1.5rem 2rem', background: 'var(--off-white)', borderBottom: '1px solid var(--border)' }}>
          {[
            { id: 'players', icon: '🏏', label: 'Player Database' },
            { id: 'users', icon: '👥', label: 'Registered Users' },
            { id: 'history', icon: '📋', label: 'Auction History' }
          ].map(t => (
            <button 
              key={t.id} 
              onClick={() => setTab(t.id)}
              style={{
                background: tab === t.id ? 'var(--white)' : 'transparent',
                border: `1px solid ${tab === t.id ? 'var(--border)' : 'transparent'}`,
                padding: '0.8rem 1.5rem',
                borderRadius: 'var(--radius)',
                fontWeight: 700,
                color: tab === t.id ? 'var(--primary)' : 'var(--text-medium)',
                boxShadow: tab === t.id ? 'var(--shadow-sm)' : 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '1rem',
                transition: 'all 0.2s'
              }}
            >
              <span>{t.icon}</span> {t.label}
            </button>
          ))}
        </div>

        <div style={{ padding: '2rem' }}>
          {tab === 'players' && (
            <div>
              <div className="flex justify-between items-center mb-3">
                <h3 className="fw-800" style={{ fontSize: '1.4rem' }}>Players ({filteredPlayers.length})</h3>
                <input className="form-input" placeholder="Search players by name..." value={search} onChange={e => setSearch(e.target.value)} style={{ maxWidth: '350px' }} />
              </div>
              <div className="table-wrap">
                <table>
                  <thead><tr><th>Name</th><th>Role</th><th>Course / Year</th><th>Base Price</th><th>Status</th></tr></thead>
                  <tbody>
                    {filteredPlayers.map(p => (
                      <tr key={p.id}>
                        <td className="fw-700" style={{ color: 'var(--text-dark)' }}>{p.name}</td>
                        <td><span className="badge badge-gray">{p.playing_role}</span></td>
                        <td><div className="text-medium fw-600">{p.course} • {p.year}</div></td>
                        <td className="fw-800 text-primary">₹{fmt(p.base_price)}</td>
                        <td><span className={`badge ${statusClass[p.status] || 'badge-gray'}`}>{p.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {tab === 'users' && (
            <div>
              <h3 className="fw-800 mb-3" style={{ fontSize: '1.4rem' }}>Users ({users.length})</h3>
              <div className="table-wrap">
                <table>
                  <thead><tr><th>Name</th><th>Enrollment / Email</th><th>Role</th><th>Purse Balance</th></tr></thead>
                  <tbody>
                    {users.map(u => (
                      <tr key={u.id}>
                        <td>
                          <div className="fw-800 text-dark">{u.full_name}</div>
                        </td>
                        <td>
                          <div className="fw-600">{u.enrollment_number}</div>
                          <div className="text-medium" style={{ fontSize: '0.85rem' }}>{u.email}</div>
                        </td>
                        <td><span className={`badge ${roleClass[u.role] || 'badge-gray'}`}>{u.role}</span></td>
                        <td>
                          {u.role === 'user' ? (
                            <span className="fw-800" style={{ color: 'var(--success)', fontSize: '1.1rem' }}>₹{fmt(u.purse)}</span>
                          ) : <span className="text-medium">—</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {tab === 'history' && (
            <div>
              <h3 className="fw-800 mb-3" style={{ fontSize: '1.4rem' }}>Auction History</h3>
              <div className="table-wrap">
                <table>
                  <thead><tr><th>Player</th><th>Winner</th><th>Final Bid</th><th>Status</th><th>Date</th></tr></thead>
                  <tbody>
                    {history.length === 0 ? (
                      <tr><td colSpan={5} style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-light)', fontWeight: 600 }}>No auction history recorded yet.</td></tr>
                    ) : history.map(h => (
                      <tr key={h.id}>
                        <td className="fw-800 text-dark">{h.player_name}</td>
                        <td className="fw-600">{h.winner_name || <span className="text-medium">—</span>}</td>
                        <td>
                          {h.winning_bid ? <span className="fw-800 text-primary" style={{ fontSize: '1.1rem' }}>₹{fmt(h.winning_bid)}</span> : <span className="text-medium">—</span>}
                        </td>
                        <td><span className={`badge ${h.status === 'Sold' ? 'badge-success' : 'badge-danger'}`}>{h.status}</span></td>
                        <td className="text-medium fw-600" style={{ fontSize: '0.9rem' }}>{new Date(h.completed_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
