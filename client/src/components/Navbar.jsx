import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

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
          🏏 JPL Auction
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
              💰 <span>₹{Number(user.purse || 0).toLocaleString('en-IN')}</span>
            </span>
          )}
          <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{user?.full_name}</span>
          <button className="btn btn-ghost btn-sm" onClick={handleLogout}>Logout</button>
        </div>

        <button className="hamburger" onClick={() => setOpen(o => !o)} aria-label="Menu">
          <span /><span /><span />
        </button>
      </div>
    </nav>
  )
}