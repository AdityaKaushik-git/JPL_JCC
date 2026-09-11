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