import { useEffect, useState } from 'react'
import { api } from '../services/api'
import { Users, History, ClipboardList, UserPlus, Trash2 } from 'lucide-react'
import ToastContainer from '../components/Toast'
import { useToast } from '../hooks/useToast'

function fmt(n) { return Number(n || 0).toLocaleString('en-IN') }

export default function Admin() {
  const [tab, setTab] = useState('players')
  const [players, setPlayers] = useState([])
  const [users, setUsers] = useState([])
  const [history, setHistory] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  
  const [createType, setCreateType] = useState('player')
  const [addForm, setAddForm] = useState({ 
    full_name: '', enrollment_number: '', email: '', mobile: '', password: '',
    playing_role: 'Batsman', course: 'BTech', year: '1st', base_price: '1000' 
  })
  const [adding, setAdding] = useState(false)
  const { toasts, addToast, removeToast } = useToast()

  function loadData() {
    setLoading(true)
    Promise.all([
      api.getAdminPlayers().then(d => setPlayers(d.players || [])),
      api.getAdminUsers().then(d => setUsers(d.users || [])),
      api.getAuctionHistory().then(d => setHistory(d.history || [])),
    ]).catch(console.error).finally(() => setLoading(false))
  }

  useEffect(() => {
    loadData()
  }, [])

  const statusClass = { Available: 'badge-success', 'In Auction': 'badge-orange', Sold: 'badge-info', Unsold: 'badge-gray' }
  const roleClass = { user: 'badge-info', player: 'badge-success', admin: 'badge-danger' }
  const filteredPlayers = players.filter(p => p.name.toLowerCase().includes(search.toLowerCase()))

  function set(field) { return e => setAddForm(f => ({ ...f, [field]: e.target.value })) }

  async function handleCreateAccount(e) {
    e.preventDefault()
    setAdding(true)
    try {
      const payload = {
        full_name: addForm.full_name,
        enrollment_number: addForm.enrollment_number,
        email: addForm.email,
        mobile: addForm.mobile,
        password: addForm.password,
        role: createType,
      }
      
      if (createType === 'player') {
        payload.player_data = {
          playing_role: addForm.playing_role,
          course: addForm.course,
          year: addForm.year,
          base_price: addForm.base_price
        }
      }

      await api.register(payload)
      addToast(`${createType === 'player' ? 'Player' : 'Bidder'} account created successfully!`, 'success')
      setAddForm({ full_name: '', enrollment_number: '', email: '', mobile: '', password: '', playing_role: 'Batsman', course: 'BTech', year: '1st', base_price: '1000' })
      loadData()
      setTab(createType === 'player' ? 'players' : 'users')
    } catch (err) {
      addToast(err.message || 'Failed to create account', 'danger')
    } finally {
      setAdding(false)
    }
  }

  async function handleDeletePlayer(id, name) {
    if (!window.confirm(`Are you sure you want to completely delete ${name} from the database? This cannot be undone.`)) return
    try {
      await api.deletePlayer(id)
      addToast(`${name} was deleted successfully.`, 'success')
      loadData()
    } catch (err) {
      addToast(err.message || 'Failed to delete player', 'danger')
    }
  }

  if (loading && players.length === 0) return <div className="spinner-wrapper" style={{ minHeight: '60vh' }}><div className="spinner" style={{ width: 48, height: 48 }} /></div>

  return (
    <div className="page" style={{ maxWidth: 1200 }}>
      <ToastContainer toasts={toasts} removeToast={removeToast} />
      
      <div className="page-header">
        <div>
          <h1 className="fw-800">Admin Control Panel</h1>
          <p>Database management and system logs</p>
        </div>
      </div>

      <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
        <div className="admin-tabs" style={{ display: 'flex', gap: '1rem', padding: '1.5rem 2rem', background: 'var(--off-white)', borderBottom: '1px solid var(--border)' }}>
          {[
            { id: 'players', icon: <ClipboardList size={20} />, label: 'Player Database' },
            { id: 'users', icon: <Users size={20} />, label: 'Registered Users' },
            { id: 'history', icon: <History size={20} />, label: 'Auction History' },
            { id: 'add', icon: <UserPlus size={20} />, label: 'Create Account' }
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
                gap: '0.6rem',
                fontSize: '1rem',
                transition: 'all 0.2s',
                whiteSpace: 'nowrap'
              }}
            >
              {t.icon} {t.label}
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
                  <thead><tr><th>Name</th><th>Role</th><th>Course / Year</th><th>Base Price</th><th>Status</th><th style={{ textAlign: 'right' }}>Actions</th></tr></thead>
                  <tbody>
                    {filteredPlayers.map(p => (
                      <tr key={p.id}>
                        <td className="fw-700" style={{ color: 'var(--text-dark)' }}>{p.name}</td>
                        <td><span className="badge badge-gray">{p.playing_role}</span></td>
                        <td><div className="text-medium fw-600">{p.course} • {p.year}</div></td>
                        <td className="fw-800 text-primary">₹{fmt(p.base_price)}</td>
                        <td><span className={`badge ${statusClass[p.status] || 'badge-gray'}`}>{p.status}</span></td>
                        <td style={{ textAlign: 'right' }}>
                          <button 
                            onClick={() => handleDeletePlayer(p.id, p.name)}
                            className="btn btn-outline btn-sm" 
                            style={{ color: 'var(--danger)', borderColor: 'var(--danger)', padding: '0.4rem 0.6rem', background: 'transparent' }}
                            title="Delete Player"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {tab === 'add' && (
            <div style={{ maxWidth: '700px', margin: '0 auto' }}>
              <div className="text-center mb-3">
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
                  <div style={{ background: 'var(--primary-bg)', padding: '1rem', borderRadius: '50%' }}>
                    <UserPlus size={40} color="var(--primary)" />
                  </div>
                </div>
                <h3 className="fw-800" style={{ fontSize: '1.6rem' }}>Create New Account</h3>
                <p className="text-medium">Register a Bidder (Franchise Owner) or a Player</p>
              </div>

              <div className="flex gap-2 mb-3" style={{ background: 'var(--off-white)', padding: '0.5rem', borderRadius: 'var(--radius)' }}>
                <button className={`btn ${createType === 'player' ? 'btn-primary' : 'btn-ghost'}`} style={{ flex: 1 }} onClick={() => setCreateType('player')}>Create Player</button>
                <button className={`btn ${createType === 'user' ? 'btn-primary' : 'btn-ghost'}`} style={{ flex: 1 }} onClick={() => setCreateType('user')}>Create Bidder</button>
              </div>

              <form onSubmit={handleCreateAccount} className="card" style={{ boxShadow: 'var(--shadow-sm)' }}>
                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Full Name</label>
                    <input className="form-input" value={addForm.full_name} onChange={set('full_name')} required placeholder="e.g. MS Dhoni" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Enrollment Number</label>
                    <input className="form-input" value={addForm.enrollment_number} onChange={set('enrollment_number')} required placeholder="e.g. ENR2024001" />
                  </div>
                </div>

                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Email Address</label>
                    <input className="form-input" type="email" value={addForm.email} onChange={set('email')} required placeholder="user@example.com" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Mobile Number</label>
                    <input className="form-input" type="tel" value={addForm.mobile} onChange={set('mobile')} required placeholder="10-digit mobile" />
                  </div>
                </div>
                
                <div className="form-group">
                  <label className="form-label">Password</label>
                  <input className="form-input" type="password" value={addForm.password} onChange={set('password')} required placeholder="Set a secure password" />
                </div>

                {createType === 'player' && (
                  <div style={{ background: 'var(--primary-bg)', padding: '1.5rem', borderRadius: 'var(--radius-sm)', marginBottom: '1.25rem', border: '1px solid #FFD8C4' }}>
                    <h4 style={{ marginBottom: '1rem', color: 'var(--primary-dark)', fontSize: '0.9rem', textTransform: 'uppercase' }}>Player Details</h4>
                    <div className="grid-2">
                      <div className="form-group">
                        <label className="form-label" style={{ color: 'var(--primary-dark)' }}>Playing Role</label>
                        <select className="form-input" value={addForm.playing_role} onChange={set('playing_role')}>
                          <option>Batsman</option><option>Bowler</option><option>All-Rounder</option><option>Wicket Keeper</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label className="form-label" style={{ color: 'var(--primary-dark)' }}>Base Price (₹)</label>
                        <input className="form-input" type="number" min="1000" step="500" value={addForm.base_price} onChange={set('base_price')} required />
                      </div>
                    </div>
                    <div className="grid-2" style={{ marginBottom: 0 }}>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label" style={{ color: 'var(--primary-dark)' }}>Course</label>
                        <select className="form-input" value={addForm.course} onChange={set('course')}>
                          <option>BTech</option><option>BCA</option><option>BBA</option><option>MCA</option><option>MBA</option><option>Other</option>
                        </select>
                      </div>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label" style={{ color: 'var(--primary-dark)' }}>Year</label>
                        <select className="form-input" value={addForm.year} onChange={set('year')}>
                          <option>1st</option><option>2nd</option><option>3rd</option><option>4th</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                <button type="submit" className="btn btn-primary btn-full btn-lg mt-2" disabled={adding}>
                  {adding ? 'Processing...' : `Register ${createType === 'player' ? 'Player' : 'Bidder'} Account`}
                </button>
              </form>
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
