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