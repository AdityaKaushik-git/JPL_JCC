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