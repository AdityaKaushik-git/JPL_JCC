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