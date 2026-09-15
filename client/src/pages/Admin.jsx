import { useEffect, useState, useCallback } from 'react'
import { api } from '../services/api'
import { io } from 'socket.io-client'
import { Users, History, ClipboardList, UserPlus, Trash2, CheckCircle, XCircle, Loader } from 'lucide-react'
import ToastContainer from '../components/Toast'
import { useToast } from '../hooks/useToast'

function fmt(n) { return Number(n || 0).toLocaleString('en-IN') }

const PWD_RULES = [
  { id: 'len',   label: 'At least 8 characters',               test: p => p.length >= 8 },
  { id: 'upper', label: 'One uppercase letter',                 test: p => /[A-Z]/.test(p) },
  { id: 'lower', label: 'One lowercase letter',                 test: p => /[a-z]/.test(p) },
  { id: 'num',   label: 'One number',                           test: p => /[0-9]/.test(p) },
  { id: 'sym',   label: 'One special character',                test: p => /[^A-Za-z0-9]/.test(p) },
]

export default function Admin() {
  const [tab, setTab] = useState('players')
  const [players, setPlayers] = useState([])
  const [users, setUsers] = useState([])
  const [history, setHistory] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  
  const [createType, setCreateType] = useState('player')
  const [addForm, setAddForm] = useState({ 
    full_name: '', enrollment_number: '', email: '', mobile: '', password: '', team_name: '',
    playing_role: 'Batsman', course: 'BTech', year: '1st', base_price: '1000' 
  })
  const [addErrors, setAddErrors] = useState({})
  const [enrollStatus, setEnrollStatus] = useState('idle')
  const [adding, setAdding] = useState(false)
  const { toasts, addToast, removeToast } = useToast()

  const [stats, setStats] = useState(null)
  const [liveStats, setLiveStats] = useState({ bidders: 0, players: 0, admins: 0, total: 0 })

  function loadData() {
    setLoading(true)
    Promise.all([
      api.getAdminPlayers().then(d => setPlayers(d.players || [])),
      api.getAdminUsers().then(d => setUsers(d.users || [])),
      api.getAuctionHistory().then(d => setHistory(d.history || [])),
      api.getAdminStats().then(d => setStats(d)),
    ]).catch(console.error).finally(() => setLoading(false))
  }

  useEffect(() => { 
    loadData() 
    const socket = io({ auth: { token: localStorage.getItem('jpl_token') } })
    socket.emit('user:join')
    socket.on('live:stats', (data) => setLiveStats(data))
    return () => socket.disconnect()
  }, [])

  // Enrollment uniqueness check
  const checkEnrollment = useCallback(async (val) => {
    if (!val || val.length < 3) { setEnrollStatus('idle'); return }
    setEnrollStatus('checking')
    try {
      const res = await api.checkEnrollment(val)
      setEnrollStatus(res.taken ? 'taken' : 'free')
      if (res.taken) setAddErrors(e => ({ ...e, enrollment_number: 'This enrollment number is already registered.' }))
      else setAddErrors(e => ({ ...e, enrollment_number: '' }))
    } catch { setEnrollStatus('idle') }
  }, [])

  useEffect(() => {
    const t = setTimeout(() => checkEnrollment(addForm.enrollment_number), 600)
    return () => clearTimeout(t)
  }, [addForm.enrollment_number, checkEnrollment])

  const statusClass = { Available: 'badge-success', 'In Auction': 'badge-orange', Sold: 'badge-info', Unsold: 'badge-gray' }
  const roleClass = { user: 'badge-info', player: 'badge-success', admin: 'badge-danger' }
  const filteredPlayers = players.filter(p => p.name.toLowerCase().includes(search.toLowerCase()))

  function set(field) {
    return e => {
      setAddForm(f => ({ ...f, [field]: e.target.value }))
      setAddErrors(err => ({ ...err, [field]: '' }))
    }
  }

  function validateAdmin() {
    const e = {}
    if (!addForm.full_name.trim()) e.full_name = 'Required.'
    if (!addForm.enrollment_number.trim()) e.enrollment_number = 'Required.'
    if (enrollStatus === 'taken') e.enrollment_number = 'This enrollment number is already registered.'
    const emailRx = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!addForm.email.trim()) e.email = 'Required.'
    else if (!emailRx.test(addForm.email)) e.email = 'Invalid email.'
    const mobileRx = /^[6-9]\d{9}$/
    if (!addForm.mobile.trim()) e.mobile = 'Required.'
    else if (!mobileRx.test(addForm.mobile.replace(/\s/g, ''))) e.mobile = 'Enter valid 10-digit mobile.'
    if (createType === 'user' && !addForm.team_name.trim()) e.team_name = 'Team name is required.'
    const failedPwd = PWD_RULES.filter(r => !r.test(addForm.password))
    if (!addForm.password) e.password = 'Required.'
    else if (failedPwd.length > 0) e.password = `Doesn't meet all requirements (${failedPwd.map(r => r.id).join(', ')}).`
    return e
  }

  async function handleCreateAccount(e) {
    e.preventDefault()
    const errs = validateAdmin()
    if (Object.keys(errs).length > 0) { setAddErrors(errs); return }
    if (enrollStatus === 'checking') { addToast('Please wait for enrollment check to finish.', 'warning'); return }

    setAdding(true)
    try {
      const payload = {
        full_name: addForm.full_name,
        enrollment_number: addForm.enrollment_number,
        email: addForm.email,
        mobile: addForm.mobile,
        password: addForm.password,
        role: createType,
        team_name: addForm.team_name,
      }
      
      if (createType === 'player' || createType === 'user') {
        payload.player_data = {
          playing_role: addForm.playing_role,
          course: addForm.course,
          year: addForm.year,
          base_price: addForm.base_price
        }
      }

      await api.register(payload)
      addToast(`${createType === 'player' ? 'Player' : 'Bidder'} account created successfully!`, 'success')
      setAddForm({ full_name: '', enrollment_number: '', email: '', mobile: '', password: '', team_name: '', playing_role: 'Batsman', course: 'BTech', year: '1st', base_price: '1000' })
      setAddErrors({})
      setEnrollStatus('idle')
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

  async function handleUpdatePlayerStatus(id, status) {
    try {
      await api.updatePlayerStatus(id, status)
      addToast(`Player status updated to ${status}.`, 'success')
      loadData()
    } catch (err) {
      addToast(err.message || 'Failed to update status', 'danger')
    }
  }

  async function handleDeleteHistory(id) {
    if (!window.confirm('Are you sure you want to delete this auction history record? This will reset the player to Available and refund the winning bidder (if sold).')) return
    try {
      await api.deleteAuctionHistory(id)
      addToast('History record deleted successfully', 'success')
      loadData()
    } catch (err) {
      addToast(err.message || 'Failed to delete history record', 'danger')
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

      {stats && (
        <div className="grid-4 mb-3">
          <div className="card text-center" style={{ padding: '1.5rem 1rem' }}>
            <h4 style={{ color: 'var(--text-medium)', fontSize: '0.9rem', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Total Registered</h4>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--primary)' }}>{stats.totalPlayers + stats.activeBidders}</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-medium)', marginTop: '0.25rem' }}>{stats.activeBidders} Bidders / {stats.totalPlayers} Players</div>
          </div>
          <div className="card text-center" style={{ padding: '1.5rem 1rem' }}>
            <h4 style={{ color: 'var(--text-medium)', fontSize: '0.9rem', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Sold Players</h4>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--success)' }}>{stats.soldPlayers}</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-medium)', marginTop: '0.25rem' }}>of {stats.totalPlayers} Total Players</div>
          </div>
          <div className="card text-center" style={{ padding: '1.5rem 1rem', border: '2px solid rgba(59, 130, 246, 0.3)' }}>
            <h4 style={{ color: 'var(--text-medium)', fontSize: '0.9rem', textTransform: 'uppercase', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
              <span style={{ width: 8, height: 8, background: '#3b82f6', borderRadius: '50%', boxShadow: '0 0 8px #3b82f6' }}></span>
              Live Users
            </h4>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: '#3b82f6' }}>{liveStats.total}</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-medium)', marginTop: '0.25rem' }}>{liveStats.bidders} Bidders / {liveStats.players} Players</div>
          </div>
          <div className="card text-center" style={{ padding: '1.5rem 1rem' }}>
            <h4 style={{ color: 'var(--text-medium)', fontSize: '0.9rem', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Unsold Players</h4>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-medium)' }}>{stats.unsoldPlayers}</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-medium)', marginTop: '0.25rem' }}>Awaiting re-auction</div>
          </div>
        </div>
      )}

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

        <div style={{ padding: 'var(--card-padding, 1.5rem)' }}>
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
                        <td>
                          <select 
                            className={`badge ${statusClass[p.status] || 'badge-gray'}`}
                            style={{ padding: '0.2rem 0.5rem', outline: 'none', cursor: 'pointer', appearance: 'none', border: 'none' }}
                            value={p.status}
                            onChange={(e) => handleUpdatePlayerStatus(p.id, e.target.value)}
                          >
                            <option value="Available">Available</option>
                            <option value="In Auction">In Auction</option>
                            <option value="Sold">Sold</option>
                            <option value="Unsold">Unsold</option>
                          </select>
                        </td>
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
            <div style={{ maxWidth: '700px', margin: '0 auto', width: '100%' }}>
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

              <form onSubmit={handleCreateAccount} className="card" style={{ boxShadow: 'var(--shadow-sm)' }} noValidate>
                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Full Name</label>
                    <input className="form-input" style={{ borderColor: addErrors.full_name ? 'var(--danger)' : undefined }} value={addForm.full_name} onChange={set('full_name')} placeholder="e.g. MS Dhoni" />
                    {addErrors.full_name && <p style={{ color: 'var(--danger)', fontSize: '0.8rem', marginTop: '0.3rem', fontWeight: 600 }}>{addErrors.full_name}</p>}
                  </div>
                  <div className="form-group">
                    <label className="form-label">Enrollment Number</label>
                    <div style={{ position: 'relative' }}>
                      <input className="form-input" style={{ paddingRight: '2.5rem', borderColor: enrollStatus === 'free' ? 'var(--success)' : enrollStatus === 'taken' ? 'var(--danger)' : addErrors.enrollment_number ? 'var(--danger)' : undefined }} value={addForm.enrollment_number} onChange={set('enrollment_number')} placeholder="e.g. ENR2024001" />
                      <span style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', display: 'flex' }}>
                        {addForm.enrollment_number?.length >= 3 && (
                          enrollStatus === 'checking' ? <Loader size={16} style={{ color: 'var(--text-medium)', animation: 'spin 0.75s linear infinite' }} /> :
                          enrollStatus === 'taken'    ? <XCircle size={16} style={{ color: 'var(--danger)' }} /> :
                          enrollStatus === 'free'     ? <CheckCircle size={16} style={{ color: 'var(--success)' }} /> : null
                        )}
                      </span>
                    </div>
                    {addErrors.enrollment_number && <p style={{ color: 'var(--danger)', fontSize: '0.8rem', marginTop: '0.3rem', fontWeight: 600 }}>{addErrors.enrollment_number}</p>}
                    {enrollStatus === 'free' && !addErrors.enrollment_number && <p style={{ color: 'var(--success)', fontSize: '0.8rem', marginTop: '0.3rem', fontWeight: 600 }}>✓ Available</p>}
                  </div>
                </div>

                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Email Address</label>
                    <input className="form-input" style={{ borderColor: addErrors.email ? 'var(--danger)' : undefined }} type="email" value={addForm.email} onChange={set('email')} placeholder="user@example.com" />
                    {addErrors.email && <p style={{ color: 'var(--danger)', fontSize: '0.8rem', marginTop: '0.3rem', fontWeight: 600 }}>{addErrors.email}</p>}
                  </div>
                  <div className="form-group">
                    <label className="form-label">Mobile Number</label>
                    <input className="form-input" style={{ borderColor: addErrors.mobile ? 'var(--danger)' : undefined }} type="tel" value={addForm.mobile} onChange={set('mobile')} placeholder="10-digit mobile" maxLength={10} />
                    {addErrors.mobile && <p style={{ color: 'var(--danger)', fontSize: '0.8rem', marginTop: '0.3rem', fontWeight: 600 }}>{addErrors.mobile}</p>}
                  </div>
                </div>
                
                <div className="form-group">
                  <label className="form-label">Password</label>
                  <input className="form-input" style={{ borderColor: addErrors.password ? 'var(--danger)' : undefined }} type="password" value={addForm.password} onChange={set('password')} placeholder="Min 8 chars, upper, lower, number, symbol" />
                  {addErrors.password && <p style={{ color: 'var(--danger)', fontSize: '0.8rem', marginTop: '0.3rem', fontWeight: 600 }}>{addErrors.password}</p>}
                  {addForm.password && (
                    <div style={{ marginTop: '0.5rem', display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                      {PWD_RULES.map(r => (
                        <span key={r.id} style={{ fontSize: '0.72rem', fontWeight: 600, padding: '0.15rem 0.5rem', borderRadius: 20, background: r.test(addForm.password) ? '#ECFDF5' : '#FEF2F2', color: r.test(addForm.password) ? '#059669' : '#DC2626', border: `1px solid ${r.test(addForm.password) ? '#A7F3D0' : '#FECACA'}` }}>
                          {r.test(addForm.password) ? '✓' : '✗'} {r.label}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {createType === 'user' && (
                  <div className="form-group">
                    <label className="form-label">Team Name</label>
                    <input className="form-input" style={{ borderColor: addErrors.team_name ? 'var(--danger)' : undefined }} value={addForm.team_name} onChange={set('team_name')} placeholder="e.g. Chennai Super Kings" />
                    {addErrors.team_name && <p style={{ color: 'var(--danger)', fontSize: '0.8rem', marginTop: '0.3rem', fontWeight: 600 }}>{addErrors.team_name}</p>}
                  </div>
                )}

                {(createType === 'player' || createType === 'user') && (
                  <div style={{ background: 'var(--primary-bg)', padding: 'var(--card-padding, 1.5rem)', borderRadius: 'var(--radius-sm)', marginBottom: '1.25rem', border: '1px solid #FFD8C4' }}>
                    <h4 style={{ marginBottom: '1rem', color: 'var(--primary-dark)', fontSize: '0.9rem', textTransform: 'uppercase' }}>{createType === 'user' ? 'Captain Details' : 'Player Details'}</h4>
                    <div className="grid-2">
                      <div className="form-group">
                        <label className="form-label" style={{ color: 'var(--primary-dark)' }}>Playing Role</label>
                        <select className="form-input" value={addForm.playing_role} onChange={set('playing_role')}>
                          <option>Batsman</option><option>Bowler</option><option>All-Rounder</option><option>Wicket Keeper</option>
                        </select>
                      </div>
                      {createType === 'player' && (
                        <div className="form-group">
                          <label className="form-label" style={{ color: 'var(--primary-dark)' }}>Base Price (₹)</label>
                          <input className="form-input" type="number" min="1000" step="500" value={addForm.base_price} onChange={set('base_price')} required />
                        </div>
                      )}
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
                  <thead><tr><th>Player</th><th>Winner</th><th>Final Bid</th><th>Status</th><th>Date</th><th>Action</th></tr></thead>
                  <tbody>
                    {history.length === 0 ? (
                      <tr><td colSpan={6} style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-light)', fontWeight: 600 }}>No auction history recorded yet.</td></tr>
                    ) : history.map(h => (
                      <tr key={h.id}>
                        <td className="fw-800 text-dark">{h.player_name}</td>
                        <td className="fw-600">{h.winner_name || <span className="text-medium">—</span>}</td>
                        <td>
                          {h.winning_bid ? <span className="fw-800 text-primary" style={{ fontSize: '1.1rem' }}>₹{fmt(h.winning_bid)}</span> : <span className="text-medium">—</span>}
                        </td>
                        <td><span className={`badge ${h.status === 'Sold' ? 'badge-success' : 'badge-danger'}`}>{h.status}</span></td>
                        <td className="text-medium fw-600" style={{ fontSize: '0.9rem' }}>{new Date(h.completed_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</td>
                        <td>
                          <button onClick={() => handleDeleteHistory(h.id)} className="btn btn-ghost" style={{ padding: '0.4rem', color: 'var(--danger)' }} title="Delete History Record">
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
        </div>
      </div>
    </div>
  )
}

