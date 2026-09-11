import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { api } from '../services/api'

export default function Login() {
  const [loginId, setLoginId] = useState('')    // email OR enrollment number
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const data = await api.login({ loginId, password })
      login(data.token, data.user)
      navigate(data.user.role === 'admin' ? '/admin' : '/dashboard')
    } catch (err) {
      setError(err.message || 'Invalid credentials')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-layout">
      <div className="auth-panel">
        <div className="auth-panel-logo">🏏</div>
        <h1>JPL Auction</h1>
        <p>JCC College Cricket Premier League</p>
      </div>
      <div className="auth-form-wrap">
        <div className="auth-form-card">
          <h2>Welcome Back</h2>
          <p className="subtitle">Sign in to your account</p>

          {error && <div className="alert alert-danger mb-2">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Email or Enrollment Number</label>
              <input
                className="form-input"
                type="text"
                placeholder="Enter email or enrollment number"
                value={loginId}
                onChange={e => setLoginId(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <div className="input-wrapper">
                <input
                  className="form-input"
                  type={showPw ? 'text' : 'password'}
                  placeholder="Enter password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                />
                <button type="button" className="input-toggle" onClick={() => setShowPw(s => !s)}>
                  {showPw ? '🙈' : '👁'}
                </button>
              </div>
            </div>
            <button className="btn btn-primary btn-full btn-lg" type="submit" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <p className="text-center mt-3" style={{ fontSize: '0.875rem', color: 'var(--text-medium)' }}>
            Don't have an account? <Link to="/register" style={{ color: 'var(--primary)', fontWeight: 600 }}>Register</Link>
          </p>
        </div>
      </div>
    </div>
  )
}