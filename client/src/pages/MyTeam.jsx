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