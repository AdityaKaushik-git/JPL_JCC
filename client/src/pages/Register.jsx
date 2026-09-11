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