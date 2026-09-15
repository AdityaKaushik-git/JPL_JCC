import { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../services/api'
import { Trophy, Eye, EyeOff, CheckCircle, XCircle, Loader } from 'lucide-react'

// ── Password strength rules ───────────────────────────────
const PWD_RULES = [
  { id: 'len',   label: 'At least 8 characters',              test: p => p.length >= 8 },
  { id: 'upper', label: 'At least one uppercase letter (A-Z)', test: p => /[A-Z]/.test(p) },
  { id: 'lower', label: 'At least one lowercase letter (a-z)', test: p => /[a-z]/.test(p) },
  { id: 'num',   label: 'At least one number (0-9)',           test: p => /[0-9]/.test(p) },
  { id: 'sym',   label: 'At least one special character',      test: p => /[^A-Za-z0-9]/.test(p) },
]

function pwdStrength(pwd) {
  const passed = PWD_RULES.filter(r => r.test(pwd)).length
  if (passed <= 2) return { label: 'Weak',   color: 'var(--danger)',  pct: 33 }
  if (passed <= 3) return { label: 'Fair',   color: 'var(--warning)', pct: 60 }
  if (passed <= 4) return { label: 'Good',   color: 'var(--info)',    pct: 80 }
  return             { label: 'Strong', color: 'var(--success)', pct: 100 }
}

export default function Register() {
  const [form, setForm] = useState({
    full_name: '', enrollment_number: '', email: '', mobile: '', team_name: '',
    role: 'user', password: '', confirm_password: '',
  })
  const [playerData, setPlayerData] = useState({ playing_role: 'Batsman', course: 'BTech', year: '1st' })
  const [errors, setErrors] = useState({})
  const [enrollStatus, setEnrollStatus] = useState('idle') // idle | checking | taken | free
  const [showPwd, setShowPwd] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [pwdFocused, setPwdFocused] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  function set(field) {
    return e => {
      const val = e.target.value
      setForm(f => ({ ...f, [field]: val }))
      // clear field error on change
      setErrors(err => ({ ...err, [field]: '' }))
    }
  }
  function setP(field) { return e => setPlayerData(p => ({ ...p, [field]: e.target.value })) }

  // ── Debounced enrollment uniqueness check ─────────────────
  const checkEnrollment = useCallback(async (val) => {
    if (!val || val.length < 3) { setEnrollStatus('idle'); return }
    setEnrollStatus('checking')
    try {
      const res = await api.checkEnrollment(val)
      setEnrollStatus(res.taken ? 'taken' : 'free')
      if (res.taken) setErrors(e => ({ ...e, enrollment_number: 'This enrollment number is already registered.' }))
      else setErrors(e => ({ ...e, enrollment_number: '' }))
    } catch {
      setEnrollStatus('idle')
    }
  }, [])

  useEffect(() => {
    const t = setTimeout(() => checkEnrollment(form.enrollment_number), 600)
    return () => clearTimeout(t)
  }, [form.enrollment_number, checkEnrollment])

  // ── Client-side validation ────────────────────────────────
  function validate() {
    const e = {}
    if (!form.full_name.trim()) e.full_name = 'Full name is required.'
    if (!form.enrollment_number.trim()) e.enrollment_number = 'Enrollment number is required.'
    if (enrollStatus === 'taken') e.enrollment_number = 'This enrollment number is already registered.'

    const emailRx = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!form.email.trim()) e.email = 'Email is required.'
    else if (!emailRx.test(form.email)) e.email = 'Enter a valid email address.'

    const mobileRx = /^[6-9]\d{9}$/
    if (!form.mobile.trim()) e.mobile = 'Mobile number is required.'
    else if (!mobileRx.test(form.mobile.replace(/\s/g, '')))
      e.mobile = 'Enter a valid 10-digit Indian mobile number.'

    if (form.role === 'user' && !form.team_name.trim()) e.team_name = 'Team name is required.'

    const failedRules = PWD_RULES.filter(r => !r.test(form.password))
    if (!form.password) e.password = 'Password is required.'
    else if (failedRules.length > 0) e.password = `Password doesn't meet all requirements.`

    if (!form.confirm_password) e.confirm_password = 'Please confirm your password.'
    else if (form.password !== form.confirm_password) e.confirm_password = 'Passwords do not match.'

    return e
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSubmitError('')
    const errs = validate()
    if (Object.keys(errs).length > 0) { setErrors(errs); return }
    if (enrollStatus === 'checking') { setSubmitError('Please wait for enrollment check to finish.'); return }

    setLoading(true)
    try {
      const payload = { ...form }
      delete payload.confirm_password
      if (form.role === 'user') payload.team_name = form.team_name
      if (form.role === 'player' || form.role === 'user') {
        payload.player_data = { ...playerData }
        if (payload.player_data.course === 'Other' && payload.player_data.custom_course) {
          payload.player_data.course = payload.player_data.custom_course
        }
      }
      await api.register(payload)
      setSuccess(true)
      setTimeout(() => navigate('/login'), 2000)
    } catch (err) {
      setSubmitError(err.message || 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const pwd = form.password
  const strength = pwd ? pwdStrength(pwd) : null

  function FieldErr({ field }) {
    return errors[field]
      ? <p style={{ color: 'var(--danger)', fontSize: '0.8rem', marginTop: '0.3rem', fontWeight: 600 }}>{errors[field]}</p>
      : null
  }

  function inputStyle(field) {
    return { borderColor: errors[field] ? 'var(--danger)' : undefined }
  }

  const enrollIcon = () => {
    if (!form.enrollment_number || form.enrollment_number.length < 3) return null
    if (enrollStatus === 'checking') return <Loader size={16} style={{ color: 'var(--text-medium)', animation: 'spin 0.75s linear infinite' }} />
    if (enrollStatus === 'taken')   return <XCircle size={16} style={{ color: 'var(--danger)' }} />
    if (enrollStatus === 'free')    return <CheckCircle size={16} style={{ color: 'var(--success)' }} />
    return null
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--off-white)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem' }}>
      <div className="card" style={{ width: '100%', maxWidth: 600 }}>
        <div className="text-center mb-3">
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
            <div style={{ background: 'var(--primary-bg)', padding: '1rem', borderRadius: '50%' }}>
              <Trophy size={36} color="var(--primary)" />
            </div>
          </div>
          <h2 className="fw-800" style={{ fontSize: '1.7rem', color: 'var(--text-dark)' }}>Create Portal Account</h2>
          <p style={{ color: 'var(--text-medium)', fontSize: '0.95rem', marginTop: '0.25rem' }}>JPL Auction — Official Platform</p>
        </div>

        {submitError && <div className="alert alert-danger mb-2">{submitError}</div>}
        {success    && <div className="alert alert-success mb-2">Account created successfully! Redirecting...</div>}

        <form onSubmit={handleSubmit} noValidate>
          {/* Name + Enrollment */}
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input className="form-input" style={inputStyle('full_name')} placeholder="Your full name" value={form.full_name} onChange={set('full_name')} />
              <FieldErr field="full_name" />
            </div>
            <div className="form-group">
              <label className="form-label">Enrollment Number</label>
              <div style={{ position: 'relative' }}>
                <input className="form-input" style={{ ...inputStyle('enrollment_number'), paddingRight: '2.5rem', borderColor: enrollStatus === 'free' ? 'var(--success)' : enrollStatus === 'taken' ? 'var(--danger)' : undefined }} placeholder="e.g. ENR2024001" value={form.enrollment_number} onChange={set('enrollment_number')} />
                <span style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', display: 'flex' }}>{enrollIcon()}</span>
              </div>
              <FieldErr field="enrollment_number" />
              {enrollStatus === 'free' && !errors.enrollment_number && (
                <p style={{ color: 'var(--success)', fontSize: '0.8rem', marginTop: '0.3rem', fontWeight: 600 }}>✓ Enrollment number is available</p>
              )}
            </div>
          </div>

          {/* Email + Mobile */}
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input className="form-input" style={inputStyle('email')} type="email" placeholder="you@example.com" value={form.email} onChange={set('email')} />
              <FieldErr field="email" />
            </div>
            <div className="form-group">
              <label className="form-label">Mobile Number</label>
              <input className="form-input" style={inputStyle('mobile')} type="tel" placeholder="10-digit number" value={form.mobile} onChange={set('mobile')} maxLength={10} />
              <FieldErr field="mobile" />
            </div>
          </div>

          {/* Role */}
          <div className="form-group">
            <label className="form-label">Account Type</label>
            <select className="form-input" value={form.role} onChange={set('role')} style={{ fontWeight: 600 }}>
              <option value="user">Franchise Owner (Bidder)</option>
              <option value="player">Player</option>
            </select>
          </div>

          {/* Team name for bidder */}
          {form.role === 'user' && (
            <div className="form-group">
              <label className="form-label">Team Name</label>
              <input className="form-input" style={inputStyle('team_name')} placeholder="Your Franchise Name" value={form.team_name} onChange={set('team_name')} />
              <FieldErr field="team_name" />
            </div>
          )}

          {/* Player / Captain details */}
          {(form.role === 'player' || form.role === 'user') && (
            <div style={{ background: 'var(--primary-bg)', padding: '1.25rem', borderRadius: 'var(--radius-sm)', marginBottom: '1.1rem', border: '1px solid #FFD8C4' }}>
              <h4 style={{ marginBottom: '0.875rem', color: 'var(--primary-dark)', fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{form.role === 'user' ? 'Captain Details' : 'Player Details'}</h4>
              <div className="form-group">
                <label className="form-label" style={{ color: 'var(--primary-dark)' }}>Playing Role</label>
                <select className="form-input" value={playerData.playing_role} onChange={setP('playing_role')}>
                  <option>Batsman</option><option>Bowler</option><option>All-Rounder</option><option>Wicket Keeper</option>
                </select>
              </div>
              <div className="grid-2" style={{ marginBottom: 0 }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ color: 'var(--primary-dark)' }}>Course</label>
                  <select className="form-input" value={playerData.course} onChange={setP('course')} style={{ marginBottom: playerData.course === 'Other' ? '0.5rem' : 0 }}>
                    <option>BTech</option><option>BCA</option><option>BBA</option><option>MCA</option><option>MBA</option><option>Other</option>
                  </select>
                  {playerData.course === 'Other' && (
                    <input className="form-input" placeholder="Enter course name" value={playerData.custom_course || ''} onChange={setP('custom_course')} />
                  )}
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

          {/* Password */}
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  className="form-input" style={{ ...inputStyle('password'), paddingRight: '2.5rem' }}
                  type={showPwd ? 'text' : 'password'}
                  placeholder="Create password"
                  value={form.password}
                  onChange={set('password')}
                  onFocus={() => setPwdFocused(true)}
                  onBlur={() => setPwdFocused(false)}
                />
                <button type="button" style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-medium)', display: 'flex' }} onClick={() => setShowPwd(v => !v)}>
                  {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <FieldErr field="password" />
              {/* Strength bar */}
              {pwd && (
                <div style={{ marginTop: '0.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-medium)', fontWeight: 600 }}>Strength</span>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: strength.color }}>{strength.label}</span>
                  </div>
                  <div style={{ height: 5, background: 'var(--border)', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${strength.pct}%`, background: strength.color, borderRadius: 4, transition: 'width 0.3s' }} />
                  </div>
                </div>
              )}
              {/* Rules checklist */}
              {(pwdFocused || pwd) && (
                <div style={{ marginTop: '0.6rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  {PWD_RULES.map(r => (
                    <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem', color: r.test(pwd) ? 'var(--success)' : 'var(--text-medium)', fontWeight: 600 }}>
                      {r.test(pwd) ? <CheckCircle size={12} /> : <XCircle size={12} />} {r.label}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="form-group">
              <label className="form-label">Confirm Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  className="form-input" style={{ ...inputStyle('confirm_password'), paddingRight: '2.5rem', borderColor: form.confirm_password && form.password === form.confirm_password ? 'var(--success)' : errors.confirm_password ? 'var(--danger)' : undefined }}
                  type={showConfirm ? 'text' : 'password'}
                  placeholder="Repeat password"
                  value={form.confirm_password}
                  onChange={set('confirm_password')}
                />
                <button type="button" style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-medium)', display: 'flex' }} onClick={() => setShowConfirm(v => !v)}>
                  {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <FieldErr field="confirm_password" />
              {form.confirm_password && form.password === form.confirm_password && (
                <p style={{ color: 'var(--success)', fontSize: '0.8rem', marginTop: '0.3rem', fontWeight: 600 }}>✓ Passwords match</p>
              )}
            </div>
          </div>

          <button className="btn btn-primary btn-full btn-lg mt-2" type="submit" disabled={loading || success || enrollStatus === 'taken'}>
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
