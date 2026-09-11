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