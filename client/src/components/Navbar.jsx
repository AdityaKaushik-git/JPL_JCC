import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
export default function Navbar() {
  const { user, logout } = useContext(AuthContext);
  return (
    <nav style={{ display: 'flex', justifyContent: 'space-between', padding: '15px 20px', background: 'var(--white)', borderBottom: '2px solid var(--primary)', position: 'sticky', top: 0, zIndex: 100 }}>
      <Link to="/" style={{ textDecoration: 'none', color: 'var(--primary)', fontWeight: 'bold', fontSize: '1.2rem' }}>JPL Auction</Link>
      <div>
        {user ? (
          <>
            <Link to="/dashboard" style={{ marginRight: '15px' }}>Dashboard</Link>
            <Link to="/auction" style={{ marginRight: '15px' }}>Auction</Link>
            <button onClick={logout} className="btn-primary">Logout</button>
          </>
        ) : (
          <>
            <Link to="/login" style={{ marginRight: '15px' }}>Login</Link>
            <Link to="/register" className="btn-primary" style={{ textDecoration: 'none' }}>Register</Link>
          </>
        )}
      </div>
    </nav>
  );
}