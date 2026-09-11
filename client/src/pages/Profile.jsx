import { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { api } from '../services/api'
import { useToast } from '../hooks/useToast'
import ToastContainer from '../components/Toast'
import { User, Shield, Wallet } from 'lucide-react'

export default function Profile() {
  const { user, updateUser } = useAuth()
  const { toasts, addToast, removeToast } = useToast()
  
  const [form, setForm] = useState({ full_name: '', mobile: '' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editMode, setEditMode] = useState(false)

  useEffect(() => {
    api.getProfile()
      .then(d => setForm({ full_name: d.user.full_name, mobile: d.user.mobile }))
      .catch(err => addToast('Failed to load profile', 'danger'))
      .finally(() => setLoading(false))
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    try {
      const data = await api.updateProfile(form)
      updateUser({ full_name: data.user.full_name })
      setEditMode(false)
      addToast('Profile updated successfully', 'success')
    } catch (err) {
      addToast(err.message, 'danger')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="spinner-wrapper"><div className="spinner" /></div>

  return (
    <div className="page" style={{ maxWidth: 800 }}>
      <ToastContainer toasts={toasts} removeToast={removeToast} />
      
      <div className="page-header">
        <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><User size={32} color="var(--primary)" /> Account Settings</h1>
      </div>

      <div className="card mb-3" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', padding: '2rem' }}>
        <div className="avatar-circle" style={{ width: 80, height: 80, fontSize: '2rem' }}>
          <User size={40} />
        </div>
        <div style={{ flex: 1 }}>
          <h2 className="fw-800 text-dark" style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>{user?.full_name}</h2>
          <div className="flex items-center gap-2">
            <span className="badge badge-info"><Shield size={12} style={{ marginRight: '0.3rem' }} /> {user?.role.toUpperCase()}</span>
          </div>
        </div>
        {user?.role === 'user' && (
          <div style={{ textAlign: 'right', background: 'var(--primary-bg)', padding: '1rem 1.5rem', borderRadius: 'var(--radius)' }}>
            <div className="text-medium fw-700" style={{ fontSize: '0.8rem', color: 'var(--primary-dark)' }}>PURSE BALANCE</div>
            <div className="text-primary fw-800" style={{ fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Wallet size={20} /> ₹{Number(user?.purse || 0).toLocaleString('en-IN')}
            </div>
          </div>
        )}
      </div>

      <div className="card">
        <div className="flex justify-between items-center mb-3 border-bottom pb-2">
          <h3 className="fw-800 text-dark">Personal Information</h3>
          {!editMode && <button className="btn btn-outline btn-sm" onClick={() => setEditMode(true)}>Edit Profile</button>}
        </div>

        {editMode ? (
          <form onSubmit={handleSubmit}>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input className="form-input" value={form.full_name} onChange={e => setForm(f => ({...f, full_name: e.target.value}))} required />
              </div>
              <div className="form-group">
                <label className="form-label">Mobile Number</label>
                <input className="form-input" value={form.mobile} onChange={e => setForm(f => ({...f, mobile: e.target.value}))} required />
              </div>
            </div>
            <div className="flex gap-2 mt-2">
              <button className="btn btn-primary" type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</button>
              <button className="btn btn-ghost" type="button" onClick={() => setEditMode(false)}>Cancel</button>
            </div>
          </form>
        ) : (
          <div className="grid-2 gap-3">
            <div>
              <div className="text-medium fw-700" style={{ fontSize: '0.85rem' }}>FULL NAME</div>
              <div className="fw-600 text-dark" style={{ fontSize: '1.1rem', marginTop: '0.25rem' }}>{form.full_name}</div>
            </div>
            <div>
              <div className="text-medium fw-700" style={{ fontSize: '0.85rem' }}>MOBILE NUMBER</div>
              <div className="fw-600 text-dark" style={{ fontSize: '1.1rem', marginTop: '0.25rem' }}>{form.mobile}</div>
            </div>
            <div>
              <div className="text-medium fw-700" style={{ fontSize: '0.85rem' }}>ENROLLMENT NUMBER</div>
              <div className="fw-600 text-dark" style={{ fontSize: '1.1rem', marginTop: '0.25rem' }}>{user?.enrollment_number}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
