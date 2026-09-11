import { useEffect, useState, useRef } from 'react'
import { io } from 'socket.io-client'
import { useAuth } from '../contexts/AuthContext'
import { api } from '../services/api'
import ToastContainer from '../components/Toast'
import { useToast } from '../hooks/useToast'

function fmt(n) { return Number(n || 0).toLocaleString('en-IN') }
function pad(n) { return String(n).padStart(2, '0') }
function toMMSS(s) { return `${pad(Math.floor(s / 60))}:${pad(s % 60)}` }

export default function Auction() {
  const { user, updateUser } = useAuth()
  const { toasts, addToast, removeToast } = useToast()

  const [state, setState] = useState({ status: 'Pending', player: null, currentBid: 0, highestBidderName: null, timeLeft: 0, bidHistory: [], nextBid: 0, auctionId: null })
  const [purse, setPurse] = useState(Number(user?.purse || 0))
  const [soldInfo, setSoldInfo] = useState(null)
  const [availablePlayers, setAvailablePlayers] = useState([])
  const [selectedPlayerId, setSelectedPlayerId] = useState('')
  const [unsoldPlayers, setUnsoldPlayers] = useState([])

  const myActiveBid = useRef(0)
  const socketRef = useRef(null)

  useEffect(() => {
    const socket = io({ auth: { token: localStorage.getItem('jpl_token') } })
    socketRef.current = socket

    socket.on('connect', () => socket.emit('user:join'))
    socket.on('connect_error', err => addToast('Connection error: ' + err.message, 'danger'))

    socket.on('auction:stateUpdate', data => {
      setState(data)
      // Refund if outbid
      if (myActiveBid.current > 0 && data.highestBidderName !== user?.full_name) {
        setPurse(p => p + myActiveBid.current)
        myActiveBid.current = 0
      }
    })

    socket.on('auction:timer', seconds => {
      setState(prev => ({ ...prev, timeLeft: seconds }))
    })

    socket.on('auction:notification', msg => addToast(msg.text, msg.type || 'info'))

    socket.on('auction:sold', data => {
      setSoldInfo(data)
      if (data.userId === user?.id) {
        setPurse(p => p - data.price)
        updateUser({ purse: purse - data.price })
      }
      setTimeout(() => setSoldInfo(null), 5000)
    })

    socket.on('auction:unsold', data => addToast(`${data.playerName} went UNSOLD`, 'warning'))

    socket.on('purse:update', newPurse => {
      setPurse(Number(newPurse))
      updateUser({ purse: newPurse })
    })

    socket.on('auction:playerReset', () => {
      if (user?.role === 'admin') loadPlayers()
    })

    return () => socket.disconnect()
  }, [])

  function loadPlayers() {
    api.getPlayers()
      .then(data => {
        const all = data.players || []
        setAvailablePlayers(all.filter(p => p.status === 'Available'))
        setUnsoldPlayers(all.filter(p => p.status === 'Unsold'))
      })
      .catch(console.error)
  }

  useEffect(() => {
    if (user?.role === 'admin') loadPlayers()
  }, [])

  function placeBid() {
    if (!socketRef.current || !state.auctionId) return
    const amount = state.nextBid
    myActiveBid.current = amount
    setPurse(p => p - amount)
    socketRef.current.emit('user:placeBid', { auctionId: state.auctionId, amount })
  }

  function startAuction() {
    if (!selectedPlayerId) return addToast('Select a player first', 'warning')
    socketRef.current?.emit('admin:startPlayer', { playerId: Number(selectedPlayerId) })
  }

  const canBid = state.status === 'Live' && state.timeLeft > 0 && purse >= state.nextBid && state.highestBidderName !== user?.full_name && user?.role !== 'player' && user?.role !== 'admin'

  const statusClass = { Live: 'status-live', Paused: 'status-paused', Completed: 'status-completed' }[state.status] || 'status-pending'
  const statusLabel = { Live: '🔴 LIVE', Paused: '⏸ PAUSED', Completed: '✅ COMPLETED', Pending: '⏳ WAITING FOR AUCTION' }[state.status]

  return (
    <div className="page">
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      {soldInfo && (
        <div className="sold-overlay">
          <div className="sold-card">
            <div className="sold-icon">🎉</div>
            <h2>SOLD!</h2>
            <div style={{ fontSize: '1.2rem', fontWeight: 700, margin: '0.5rem 0' }}>{soldInfo.playerName}</div>
            <div className="sold-price">₹{fmt(soldInfo.price)}</div>
            <div style={{ color: 'var(--text-medium)', marginTop: '0.5rem' }}>to <strong>{soldInfo.teamName}</strong></div>
          </div>
        </div>
      )}

      {user?.role === 'user' && (
        <div className="flex justify-between items-center mb-2">
          <div />
          <div className="nav-purse" style={{ fontSize: '1rem' }}>💰 My Purse: <span>₹{fmt(purse)}</span></div>
        </div>
      )}

      <div className="auction-layout">
        {/* Main column */}
        <div>
          <div className={`auction-status-banner ${statusClass}`}>{statusLabel}</div>

          {/* Admin: start auction controls */}
          {user?.role === 'admin' && (state.status === 'Pending' || state.status === 'Completed') && (
            <div className="card mb-2">
              <h3 className="fw-700 mb-2">Start New Auction</h3>
              <div className="flex gap-2">
                <select className="form-input" value={selectedPlayerId} onChange={e => setSelectedPlayerId(e.target.value)} style={{ flex: 1 }}>
                  <option value="">Select a player...</option>
                  {availablePlayers.map(p => (
                    <option key={p.id} value={p.id}>{p.name} — {p.playing_role} (₹{fmt(p.base_price)})</option>
                  ))}
                </select>
                <button className="btn btn-primary" onClick={startAuction}>Start Auction</button>
              </div>
            </div>
          )}

          {state.player ? (
            <>
              <div className="player-card-auction">
                <div className="player-name">{state.player.name}</div>
                <div className="player-meta">
                  <span className="badge badge-orange">{state.player.playing_role}</span>
                  <span className="badge badge-gray">{state.player.course}</span>
                  <span className="badge badge-gray">{state.player.year} Year</span>
                </div>
                <div style={{ fontSize: '0.875rem', color: 'var(--text-medium)' }}>
                  Base Price: <strong className="text-primary">₹{fmt(state.player.base_price)}</strong>
                </div>
              </div>

              <div className="bid-display">
                <div className="current-bid">₹{fmt(state.currentBid)}</div>
                <div className="bidder">{state.highestBidderName ? `Highest: ${state.highestBidderName}` : 'No bids yet'}</div>
              </div>

              <div className={`timer${state.timeLeft < 30 && state.status === 'Live' ? ' urgent' : ''}`}>
                ⏱ {toMMSS(state.timeLeft)}
              </div>

              <div className="next-bid-row">
                <span style={{ color: 'var(--text-medium)', fontWeight: 600 }}>Next Bid</span>
                <span className="fw-800 text-primary" style={{ fontSize: '1.1rem' }}>₹{fmt(state.nextBid)}</span>
              </div>

              {user?.role === 'user' && (
                <button className="btn btn-primary btn-full btn-lg" onClick={placeBid} disabled={!canBid}>
                  {state.highestBidderName === user?.full_name ? '✅ You are highest bidder' : `Place Bid — ₹${fmt(state.nextBid)}`}
                </button>
              )}

              {user?.role === 'admin' && state.status === 'Live' && (
                <div className="flex gap-2 mt-2" style={{ flexWrap: 'wrap' }}>
                  <button className="btn btn-secondary" onClick={() => socketRef.current?.emit('admin:pauseAuction')}>⏸ Pause</button>
                  <button className="btn btn-success" onClick={() => socketRef.current?.emit('admin:sellPlayer')}>✅ Sell Player</button>
                  <button className="btn btn-danger" onClick={() => socketRef.current?.emit('admin:markUnsold')}>❌ Mark Unsold</button>
                </div>
              )}

              {user?.role === 'admin' && state.status === 'Paused' && (
                <div className="flex gap-2 mt-2">
                  <button className="btn btn-primary" onClick={() => socketRef.current?.emit('admin:resumeAuction')}>▶️ Resume</button>
                  <button className="btn btn-success" onClick={() => socketRef.current?.emit('admin:sellPlayer')}>✅ Sell Player</button>
                  <button className="btn btn-danger" onClick={() => socketRef.current?.emit('admin:markUnsold')}>❌ Mark Unsold</button>
                </div>
              )}
            </>
          ) : (
            <div className="empty-state">
              <div className="empty-icon">🏏</div>
              <h3>No Active Auction</h3>
              <p>Waiting for the admin to start an auction...</p>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div>
          {user?.role === 'user' && (
            <div className="card mb-2">
              <div className="stat-label">MY PURSE</div>
              <div className="stat-value">₹{fmt(purse)}</div>
            </div>
          )}

          <div className="card mb-2">
            <h3 className="fw-700 mb-2">Bid History</h3>
            {state.bidHistory?.length > 0 ? (
              <div className="history-list">
                {state.bidHistory.map((b, i) => (
                  <div key={i} className="history-item">
                    <span style={{ fontWeight: 600 }}>{b.userName}</span>
                    <span className="text-primary fw-700">₹{fmt(b.amount)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: 'var(--text-light)', fontSize: '0.875rem' }}>No bids yet</p>
            )}
          </div>

          {user?.role === 'admin' && unsoldPlayers.length > 0 && (
            <div className="card">
              <h3 className="fw-700 mb-2">Unsold Players</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {unsoldPlayers.map(p => (
                  <div key={p.id} className="flex justify-between items-center">
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{p.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>{p.playing_role}</div>
                    </div>
                    <button
                      className="btn btn-outline btn-sm"
                      onClick={() => socketRef.current?.emit('admin:reAuction', { playerId: p.id })}
                    >
                      Re-Auction
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}