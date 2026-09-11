import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Trophy, Wallet, LogOut, Menu } from 'lucide-react'

const NAV_LINKS = {
  admin:  [{ to: '/dashboard', label: 'Dashboard' }, { to: '/auction', label: 'Auction' }, { to: '/admin', label: 'Admin Panel' }],
  user:   [{ to: '/dashboard', label: 'Dashboard' }, { to: '/auction', label: 'Live Auction' }, { to: '/my-team', label: 'My Team' }, { to: '/my-bids', label: 'My Bids' }],
  player: [{ to: '/dashboard', label: 'Dashboard' }, { to: '/auction', label: 'Live Auction' }],
}

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)

  function handleLogout() {
    logout()
    navigate('/')
  }

  const links = NAV_LINKS[user?.role] || []

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <NavLink to="/dashboard" className="nav-brand">
          <Trophy size={24} strokeWidth={2.5} /> JPL Auction
        </NavLink>

        <ul className={`nav-links${open ? ' open' : ''}`}>
          {links.map(link => (
            <li key={link.to}>
              <NavLink
                to={link.to}
                className={({ isActive }) => isActive ? 'active' : ''}
                onClick={() => setOpen(false)}
              >
                {link.label}
              </NavLink>
            </li>
          ))}
        </ul>

        <div className="nav-right">
          {user?.role === 'user' && (
            <span className="nav-purse">
              <Wallet size={18} /> <span>₹{Number(user.purse || 0).toLocaleString('en-IN')}</span>
            </span>
          )}
          <span className="nav-user-name" style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-dark)' }}>{user?.full_name}</span>
          <button className="btn btn-ghost btn-sm" onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <LogOut size={16} /> Logout
          </button>
        </div>

        <button className="hamburger" onClick={() => setOpen(o => !o)} aria-label="Menu" style={{ color: 'var(--text-dark)' }}>
          <Menu size={24} />
        </button>
      </div>
    </nav>
  )
}

