import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../services/api'

export default function Register() {
  const [form, setForm] = useState({
    full_name: '', enrollment_number: '', email: '', mobile: '',
    role: 'user', password: '', confirm_password: '',
  })
  const [playerData, setPlayerData] = useState({ playing_role: 'Batsman', course: 'BTech', year: '1st' })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  function set(field) { return e => setForm(f => ({ ...f, [field]: e.target.value })) }
  function setP(field) { return e => setPlayerData(p => ({ ...p, [field]: e.target.value })) }

  async function handleSubmit(e) {
    e.preventDefault()
    if (form.password !== form.confirm_password) { setError('Passwords do not match'); return }
    setError('')
    setLoading(true)
    try {
      const payload = { ...form }
      delete payload.confirm_password
      if (form.role === 'player') payload.player_data = playerData
      await api.register(payload)
      setSuccess(true)
      setTimeout(() => navigate('/login'), 2000)
    } catch (err) {
      setError(err.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--off-white)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <div className="card" style={{ width: '100%', maxWidth: 520 }}>
        <div className="text-center mb-3">
          <span style={{ fontSize: '2.5rem' }}>🏏</span>
          <h2 className="fw-800" style={{ marginTop: '0.5rem' }}>Create Account</h2>
          <p style={{ color: 'var(--text-medium)', fontSize: '0.9rem' }}>Join JPL Auction — JCC College</p>
        </div>

        {error && <div className="alert alert-danger mb-2">{error}</div>}
        {success && <div className="alert alert-success mb-2">Registration successful! Redirecting to login...</div>}

        <form onSubmit={handleSubmit}>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input className="form-input" placeholder="Your full name" value={form.full_name} onChange={set('full_name')} required />
            </div>
            <div className="form-group">
              <label className="form-label">Enrollment Number</label>
              <input className="form-input" placeholder="e.g. ENR2024001" value={form.enrollment_number} onChange={set('enrollment_number')} required />
            </div>
          </div>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Email</label>
              <input className="form-input" type="email" placeholder="you@example.com" value={form.email} onChange={set('email')} required />
            </div>
            <div className="form-group">
              <label className="form-label">Mobile</label>
              <input className="form-input" type="tel" placeholder="10-digit number" value={form.mobile} onChange={set('mobile')} required />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Register As</label>
            <select className="form-input" value={form.role} onChange={set('role')}>
              <option value="user">Team Owner (Bidder)</option>
              <option value="player">Player</option>
            </select>
          </div>

          {form.role === 'player' && (
            <>
              <div className="form-group">
                <label className="form-label">Playing Role</label>
                <select className="form-input" value={playerData.playing_role} onChange={setP('playing_role')}>
                  <option>Batsman</option><option>Bowler</option><option>All-Rounder</option><option>Wicket Keeper</option>
                </select>
              </div>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Course</label>
                  <select className="form-input" value={playerData.course} onChange={setP('course')}>
                    <option>BTech</option><option>BCA</option><option>BBA</option><option>MCA</option><option>MBA</option><option>Other</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Year</label>
                  <select className="form-input" value={playerData.year} onChange={setP('year')}>
                    <option>1st</option><option>2nd</option><option>3rd</option><option>4th</option>
                  </select>
                </div>
              </div>
            </>
          )}

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Password</label>
              <input className="form-input" type="password" placeholder="Create password" value={form.password} onChange={set('password')} required />
            </div>
            <div className="form-group">
              <label className="form-label">Confirm Password</label>
              <input className="form-input" type="password" placeholder="Repeat password" value={form.confirm_password} onChange={set('confirm_password')} required />
            </div>
          </div>

          <button className="btn btn-primary btn-full" type="submit" disabled={loading || success}>
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <p className="text-center mt-2" style={{ fontSize: '0.875rem', color: 'var(--text-medium)' }}>
          Already have an account? <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 600 }}>Sign In</Link>
        </p>
      </div>
    </div>
  )
}