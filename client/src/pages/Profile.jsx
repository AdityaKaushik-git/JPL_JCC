import { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { api } from '../services/api'

function fmt(n) { return Number(n || 0).toLocaleString('en-IN') }

export default function Profile() {
  const { user, updateUser } = useAuth()
  const [profile, setProfile] = useState(null)
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({ full_name: '', mobile: '' })
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  useEffect(() => {
    api.getProfile().then(d => {
      setProfile(d.user)
      setForm({ full_name: d.user.full_name, mobile: d.user.mobile })
    }).catch(console.error)
  }, [])

  async function handleSave() {
    setSaving(true)
    setMsg('')
    try {
      const d = await api.updateProfile(form)
      setProfile(d.user)
      updateUser(d.user)
      setEditing(false)
      setMsg('Profile updated!')
    } catch (err) {
      setMsg(err.message)
    } finally {
      setSaving(false)
    }
  }

  const roleLabel = { admin: 'Admin', user: 'Team Owner', player: 'Player' }
  const roleClass = { admin: 'badge-danger', user: 'badge-info', player: 'badge-success' }
  const initials = (profile?.full_name || user?.full_name || '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()

  if (!profile) return <div className="spinner-wrapper" style={{ minHeight: '60vh' }}><div className="spinner" style={{ width: 48, height: 48 }} /></div>

  return (
    <div className="page">
      <div className="page-header">
        <h1>👤 Profile</h1>
      </div>

      <div style={{ maxWidth: 680 }}>
        <div className="card mb-2">
          <div className="flex items-center gap-2 mb-3">
            <div className="avatar-circle">{initials}</div>
            <div>
              <div className="fw-800" style={{ fontSize: '1.3rem' }}>{profile.full_name}</div>
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem', alignItems: 'center' }}>
                <span className={`badge ${roleClass[profile.role]}`}>{roleLabel[profile.role]}</span>
                <span style={{ color: 'var(--text-light)', fontSize: '0.85rem' }}>{profile.enrollment_number}</span>
              </div>
            </div>
          </div>

          {msg && <div className={`alert ${msg.includes('!') ? 'alert-success' : 'alert-danger'} mb-2`}>{msg}</div>}

          <div className="grid-2" style={{ gap: '1rem 2rem' }}>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-light)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Full Name</div>
              {editing
                ? <input className="form-input mt-1" value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} />
                : <div className="fw-700 mt-1">{profile.full_name}</div>
              }
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-light)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Mobile</div>
              {editing
                ? <input className="form-input mt-1" value={form.mobile} onChange={e => setForm(f => ({ ...f, mobile: e.target.value }))} />
                : <div className="fw-700 mt-1">{profile.mobile}</div>
              }
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-light)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Email</div>
              <div className="fw-700 mt-1">{profile.email}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-light)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Enrollment</div>
              <div className="fw-700 mt-1">{profile.enrollment_number}</div>
            </div>
            {profile.role === 'user' && (
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-light)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Purse</div>
                <div className="fw-700 text-primary mt-1">₹{fmt(profile.purse)}</div>
              </div>
            )}
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-light)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Joined</div>
              <div className="fw-700 mt-1">{new Date(profile.created_at).toLocaleDateString('en-IN')}</div>
            </div>
          </div>

          <div className="flex gap-2 mt-3">
            {editing ? (
              <>
                <button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</button>
                <button className="btn btn-secondary" onClick={() => { setEditing(false); setMsg('') }}>Cancel</button>
              </>
            ) : (
              <button className="btn btn-outline" onClick={() => setEditing(true)}>✏️ Edit Profile</button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}