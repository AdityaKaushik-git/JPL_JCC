import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../services/api'
import { Trophy } from 'lucide-react'

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
    <div style={{ minHeight: '100vh', background: 'var(--off-white)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '3rem 1.5rem' }}>
      <div className="card" style={{ width: '100%', maxWidth: 600, padding: 'var(--card-padding, 3rem)' }}>
        <div className="text-center mb-3">
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
            <div style={{ background: 'var(--primary-bg)', padding: '1rem', borderRadius: '50%' }}>
              <Trophy size={40} color="var(--primary)" />
            </div>
          </div>
          <h2 className="fw-800" style={{ fontSize: '1.8rem', color: 'var(--text-dark)' }}>Create Portal Account</h2>
          <p style={{ color: 'var(--text-medium)', fontSize: '1rem', marginTop: '0.25rem' }}>JPL Auction — Official Platform</p>
        </div>

        {error && <div className="alert alert-danger mb-2">{error}</div>}
        {success && <div className="alert alert-success mb-2">Account created successfully! Redirecting...</div>}

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
              <label className="form-label">Email Address</label>
              <input className="form-input" type="email" placeholder="you@example.com" value={form.email} onChange={set('email')} required />
            </div>
            <div className="form-group">
              <label className="form-label">Mobile Number</label>
              <input className="form-input" type="tel" placeholder="10-digit number" value={form.mobile} onChange={set('mobile')} required />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Account Type</label>
            <select className="form-input" value={form.role} onChange={set('role')} style={{ fontWeight: 600 }}>
              <option value="user">Franchise Owner (Bidder)</option>
              <option value="player">Player</option>
            </select>
          </div>

          {form.role === 'player' && (
            <div style={{ background: 'var(--primary-bg)', padding: '1.5rem', borderRadius: 'var(--radius-sm)', marginBottom: '1.25rem', border: '1px solid #FFD8C4' }}>
              <h4 style={{ marginBottom: '1rem', color: 'var(--primary-dark)', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Player Details</h4>
              <div className="form-group">
                <label className="form-label" style={{ color: 'var(--primary-dark)' }}>Playing Role</label>
                <select className="form-input" value={playerData.playing_role} onChange={setP('playing_role')}>
                  <option>Batsman</option><option>Bowler</option><option>All-Rounder</option><option>Wicket Keeper</option>
                </select>
              </div>
              <div className="grid-2" style={{ marginBottom: 0 }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ color: 'var(--primary-dark)' }}>Course</label>
                  <select className="form-input" value={playerData.course} onChange={setP('course')}>
                    <option>BTech</option><option>BCA</option><option>BBA</option><option>MCA</option><option>MBA</option><option>Other</option>
                  </select>
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ color: 'var(--primary-dark)' }}>Year</label>
                  <select className="form-input" value={playerData.year} onChange={setP('year')}>
                    <option>1st</option><option>2nd</option><option>3rd</option><option>4th</option>
                  </select>
                </div>
              </div>
            </div>
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

          <button className="btn btn-primary btn-full btn-lg mt-2" type="submit" disabled={loading || success}>
            {loading ? 'Processing...' : 'Complete Registration'}
          </button>
        </form>

        <p className="text-center mt-3" style={{ fontSize: '0.95rem', color: 'var(--text-medium)' }}>
          Already have an account? <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 700 }}>Sign In</Link>
        </p>
      </div>
    </div>
  )
}

