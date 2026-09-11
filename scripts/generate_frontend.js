const fs = require('fs');
const path = require('path');

const srcDir = 'D:/JPL_JCC/client/src';
const pagesDir = path.join(srcDir, 'pages');
const componentsDir = path.join(srcDir, 'components');
const contextsDir = path.join(srcDir, 'contexts');

const files = {
  'index.css': `
:root {
  --primary: #E85D04;
  --primary-dark: #C44B03;
  --primary-bg: #FFF3ED;
  --white: #FFFFFF;
  --off-white: #FFF8F5;
  --text-dark: #1C1C1E;
  --text-medium: #4A4A4A;
  --text-light: #8E8E93;
  --border: #E8E8E8;
  --radius: 10px;
  --radius-sm: 6px;
  --radius-lg: 16px;
  --font: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  --transition: 0.2s ease;
}
* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: var(--font); background-color: var(--off-white); color: var(--text-dark); }
.card { background-color: var(--white); border: 1px solid var(--border); border-radius: var(--radius); box-shadow: 0 2px 4px rgba(0,0,0,0.05); padding: 20px; }
.btn-primary { background-color: var(--primary); color: var(--white); border: none; border-radius: var(--radius-sm); padding: 10px 20px; cursor: pointer; transition: background-color var(--transition); }
.btn-primary:hover { background-color: var(--primary-dark); }
.stat-card { background: var(--white); padding: 20px; border-radius: var(--radius); border: 1px solid var(--border); text-align: center; }
.stat-value { color: var(--primary); font-size: 2rem; font-weight: bold; }
`,
  'contexts/AuthContext.jsx': `
import React, { createContext, useState, useEffect } from 'react';
import api from '../services/api';
export const AuthContext = createContext();
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await api.get('/api/auth/me');
        setUser(res.data.user);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    if (localStorage.getItem('token')) fetchUser();
    else setLoading(false);
  }, []);
  const login = (data) => {
    localStorage.setItem('token', data.token);
    setUser(data.user);
  };
  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };
  return (
    <AuthContext.Provider value={{ user, login, logout, loading, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};
`,
  'components/Spinner.jsx': `
import React from 'react';
export default function Spinner() {
  return <div>Loading...</div>;
}
`,
  'components/ProtectedRoute.jsx': `
import React, { useContext } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
export default function ProtectedRoute({ roles }) {
  const { user, loading } = useContext(AuthContext);
  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/dashboard" />;
  return <Outlet />;
}
`,
  'components/Navbar.jsx': `
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
`,
  'components/Toast.jsx': `
import React from 'react';
export default function Toast() {
  return <div id="toast-container" style={{ position: 'fixed', bottom: 20, right: 20, zIndex: 9999 }}></div>;
}
`,
  'App.jsx': `
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Navbar from './components/Navbar';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Auction from './pages/Auction';
import MyTeam from './pages/MyTeam';
import MyBids from './pages/MyBids';
import Profile from './pages/Profile';
import Admin from './pages/Admin';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Navbar />
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/auction" element={<Auction />} />
            <Route path="/my-team" element={<MyTeam />} />
            <Route path="/my-bids" element={<MyBids />} />
            <Route path="/profile" element={<Profile />} />
          </Route>
          <Route element={<ProtectedRoute roles={['admin']} />}>
            <Route path="/admin" element={<Admin />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}
export default App;
`,
  'pages/Landing.jsx': `
import React from 'react';
export default function Landing() {
  return (
    <div>
      <div style={{ background: 'var(--primary)', color: 'var(--white)', padding: '60px 20px', textAlign: 'center' }}>
        <h1>Welcome to JPL Cricket Auction</h1>
        <p>The best place to manage your cricket auctions.</p>
      </div>
    </div>
  );
}
`,
  'pages/Login.jsx': `
import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { AuthContext } from '../contexts/AuthContext';
export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/api/auth/login', { email, password });
      login(res.data);
      navigate('/dashboard');
    } catch (err) {
      alert('Login failed');
    }
  };
  return (
    <div style={{ display: 'flex', height: '80vh' }}>
      <div style={{ flex: 1, background: 'var(--primary)', color: 'white', padding: '40px' }}>
        <h2>Welcome Back</h2>
      </div>
      <div style={{ flex: 1, padding: '40px' }}>
        <form onSubmit={handleSubmit} className="card">
          <h2>Login</h2>
          <input type="email" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} required style={{ display: 'block', width: '100%', margin: '10px 0', padding: '10px' }} />
          <input type="password" placeholder="Password" value={password} onChange={e=>setPassword(e.target.value)} required style={{ display: 'block', width: '100%', margin: '10px 0', padding: '10px' }} />
          <button type="submit" className="btn-primary">Login</button>
        </form>
      </div>
    </div>
  );
}
`,
  'pages/Register.jsx': `
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
export default function Register() {
  const [formData, setFormData] = useState({ full_name: '', email: '', password: '', role: 'user' });
  const navigate = useNavigate();
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/api/auth/register', formData);
      navigate('/login');
    } catch (err) {
      alert('Registration failed');
    }
  };
  return (
    <div style={{ display: 'flex', height: '80vh' }}>
      <div style={{ flex: 1, background: 'var(--primary)', color: 'white', padding: '40px' }}>
        <h2>Join JPL Auction</h2>
      </div>
      <div style={{ flex: 1, padding: '40px' }}>
        <form onSubmit={handleSubmit} className="card">
          <h2>Register</h2>
          <input type="text" placeholder="Full Name" onChange={e=>setFormData({...formData, full_name: e.target.value})} required style={{ display: 'block', width: '100%', margin: '10px 0', padding: '10px' }} />
          <input type="email" placeholder="Email" onChange={e=>setFormData({...formData, email: e.target.value})} required style={{ display: 'block', width: '100%', margin: '10px 0', padding: '10px' }} />
          <input type="password" placeholder="Password" onChange={e=>setFormData({...formData, password: e.target.value})} required style={{ display: 'block', width: '100%', margin: '10px 0', padding: '10px' }} />
          <select onChange={e=>setFormData({...formData, role: e.target.value})} style={{ display: 'block', width: '100%', margin: '10px 0', padding: '10px' }}>
            <option value="user">Team Owner (Bidder)</option>
            <option value="player">Player</option>
          </select>
          <button type="submit" className="btn-primary">Register</button>
        </form>
      </div>
    </div>
  );
}
`,
  'pages/Dashboard.jsx': `
import React, { useEffect, useState } from 'react';
import api from '../services/api';
export default function Dashboard() {
  const [stats, setStats] = useState(null);
  useEffect(() => {
    api.get('/api/users/dashboard').then(res => setStats(res.data)).catch(console.error);
  }, []);
  if (!stats) return <div>Loading...</div>;
  return (
    <div style={{ padding: '20px' }}>
      <h2>Dashboard</h2>
      <div style={{ display: 'flex', gap: '20px', marginTop: '20px' }}>
        <div className="stat-card">
          <div>Purse</div>
          <div className="stat-value">{stats.purse || 0}</div>
        </div>
        <div className="stat-card">
          <div>Players Bought</div>
          <div className="stat-value">{stats.playersBought || 0}</div>
        </div>
      </div>
    </div>
  );
}
`,
  'pages/Auction.jsx': `
import React, { useEffect, useState } from 'react';
import io from 'socket.io-client';
export default function Auction() {
  const [socket, setSocket] = useState(null);
  const [auctionState, setAuctionState] = useState(null);
  useEffect(() => {
    const s = io('/');
    s.emit('user:join');
    s.on('auction:stateUpdate', (data) => setAuctionState(data));
    setSocket(s);
    return () => s.disconnect();
  }, []);
  const handleBid = () => {
    if (socket && auctionState) {
      socket.emit('user:placeBid', { auctionId: auctionState.auctionId, amount: auctionState.nextBid });
    }
  };
  return (
    <div style={{ padding: '20px', display: 'flex', gap: '20px' }}>
      <div className="card" style={{ flex: 2 }}>
        <h2>Live Auction</h2>
        {auctionState && auctionState.player ? (
          <div>
            <h3>{auctionState.player.name}</h3>
            <p>Current Bid: {auctionState.currentBid}</p>
            <p>Highest Bidder: {auctionState.highestBidderName}</p>
            <button className="btn-primary" onClick={handleBid}>Bid {auctionState.nextBid}</button>
          </div>
        ) : <p>Waiting for next player...</p>}
      </div>
      <div className="card" style={{ flex: 1 }}>
        <h3>History</h3>
      </div>
    </div>
  );
}
`,
  'pages/MyTeam.jsx': `
import React, { useEffect, useState } from 'react';
import api from '../services/api';
export default function MyTeam() {
  const [team, setTeam] = useState([]);
  useEffect(() => {
    api.get('/api/users/my-team').then(res => setTeam(res.data)).catch(console.error);
  }, []);
  return (
    <div style={{ padding: '20px' }}>
      <h2>My Team</h2>
      <ul>
        {team.map(p => <li key={p.id}>{p.name} - {p.purchase_price}</li>)}
      </ul>
    </div>
  );
}
`,
  'pages/MyBids.jsx': `
import React, { useEffect, useState } from 'react';
import api from '../services/api';
export default function MyBids() {
  const [bids, setBids] = useState([]);
  useEffect(() => {
    api.get('/api/users/my-bids').then(res => setBids(res.data)).catch(console.error);
  }, []);
  return (
    <div style={{ padding: '20px' }}>
      <h2>My Bids</h2>
      <ul>
        {bids.map(b => <li key={b.id}>{b.player_name} - Bid: {b.bid_amount}</li>)}
      </ul>
    </div>
  );
}
`,
  'pages/Profile.jsx': `
import React, { useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';
export default function Profile() {
  const { user } = useContext(AuthContext);
  return (
    <div style={{ padding: '20px' }}>
      <h2>Profile</h2>
      <div className="card">
        <p>Name: {user?.full_name}</p>
        <p>Email: {user?.email}</p>
        <p>Role: {user?.role}</p>
      </div>
    </div>
  );
}
`,
  'pages/Admin.jsx': `
import React, { useEffect, useState } from 'react';
import api from '../services/api';
export default function Admin() {
  const [stats, setStats] = useState(null);
  useEffect(() => {
    api.get('/api/admin/stats').then(res => setStats(res.data)).catch(console.error);
  }, []);
  return (
    <div style={{ padding: '20px' }}>
      <h2>Admin Dashboard</h2>
      {stats && (
        <div style={{ display: 'flex', gap: '20px' }}>
          <div className="stat-card">
            <div>Total Players</div>
            <div className="stat-value">{stats.totalPlayers}</div>
          </div>
          <div className="stat-card">
            <div>Sold Players</div>
            <div className="stat-value">{stats.soldPlayers}</div>
          </div>
        </div>
      )}
    </div>
  );
}
`
};

Object.entries(files).forEach(([file, content]) => {
  const fullPath = path.join(srcDir, file);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, content.trim(), 'utf8');
  console.log('Created:', fullPath);
});
