import { useEffect, useState, useRef } from 'react'
import { io } from 'socket.io-client'
import { useAuth } from '../contexts/AuthContext'
import { api } from '../services/api'
import ToastContainer from '../components/Toast'
import { useToast } from '../hooks/useToast'
import { Gavel, Pause, Play, CheckCircle, XCircle, Clock, Trophy, AlertCircle, Eye } from 'lucide-react'

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
      if (myActiveBid.current > 0 && data.highestBidderName !== user?.full_name) {
        setPurse(p => p + myActiveBid.current)
        myActiveBid.current = 0
      }
    })

    socket.on('auction:timer', seconds => setState(prev => ({ ...prev, timeLeft: seconds })))
    socket.on('auction:notification', msg => addToast(msg.text, msg.type || 'info'))

    socket.on('auction:sold', data => {
      setSoldInfo(data)
      if (data.userId === user?.id) {
        setPurse(p => p - data.price)
        updateUser({ purse: purse - data.price })
      }
      setTimeout(() => setSoldInfo(null), 6000)
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
    api.getPlayers().then(data => {
      const all = data.players || []
      setAvailablePlayers(all.filter(p => p.status === 'Available'))
      setUnsoldPlayers(all.filter(p => p.status === 'Unsold'))
    }).catch(console.error)
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
  const isHighest = state.highestBidderName === user?.full_name

  const statusMap = {
    Live: { label: 'LIVE AUCTION', bg: '#fee2e2', color: '#dc2626', icon: <div style={{width: 10, height: 10, borderRadius: '50%', background: '#dc2626', animation: 'pulse 2s infinite'}} /> },
    Paused: { label: 'AUCTION PAUSED', bg: '#fef3c7', color: '#d97706', icon: <Pause size={18} /> },
    Completed: { label: 'AUCTION COMPLETED', bg: '#dcfce7', color: '#16a34a', icon: <CheckCircle size={18} /> },
    Pending: { label: 'WAITING FOR NEXT PLAYER', bg: '#e0e7ff', color: '#4338ca', icon: <Clock size={18} /> }
  }
  const currentStatus = statusMap[state.status] || statusMap.Pending

  return (
    <div className="page" style={{ maxWidth: 1400 }}>
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      {soldInfo && (
        <div className="sold-overlay" style={{ background: 'rgba(15, 23, 42, 0.85)', backdropFilter: 'blur(8px)' }}>
          <div className="sold-card" style={{ background: 'linear-gradient(135deg, #E85D04, #C44B03)', color: 'white', border: 'none', padding: '4rem' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}><Gavel size={64} color="white" /></div>
            <h2 style={{ fontSize: '3rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '2px', margin: '1rem 0' }}>SOLD!</h2>
            <div style={{ fontSize: '1.8rem', fontWeight: 700 }}>{soldInfo.playerName}</div>
            <div className="sold-price" style={{ color: '#FFD8C4', fontSize: '4.5rem', margin: '1.5rem 0', textShadow: '0 4px 10px rgba(0,0,0,0.3)' }}>₹{fmt(soldInfo.price)}</div>
            <div style={{ fontSize: '1.3rem', opacity: 0.9 }}>to <strong style={{ color: 'white', fontWeight: 800 }}>{soldInfo.teamName}</strong></div>
          </div>
        </div>
      )}

      {user?.role === 'user' && (
        <div className="flex justify-between items-center mb-3">
          <h1 className="fw-800 text-dark" style={{ fontSize: '1.8rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Gavel size={28} color="var(--primary)" /> Live Auction Arena
          </h1>
          <div className="card" style={{ padding: '0.6rem 1.5rem', background: 'var(--primary-bg)', border: '1px solid #FFD8C4', boxShadow: 'none' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--primary-dark)', fontWeight: 700, textTransform: 'uppercase' }}>Available Purse</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--primary)' }}>₹{fmt(purse)}</div>
          </div>
        </div>
      )}

      <div className="auction-layout" style={{ gridTemplateColumns: '1fr 380px', gap: '1.5rem' }}>
        {/* MAIN ARENA */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', background: currentStatus.bg, color: currentStatus.color, padding: '1rem', borderRadius: 'var(--radius)', fontWeight: 800, fontSize: '1.2rem', letterSpacing: '1px', boxShadow: 'var(--shadow-sm)' }}>
            {currentStatus.icon} {currentStatus.label}
          </div>

          {user?.role === 'admin' && (state.status === 'Pending' || state.status === 'Completed') && (
            <div className="card" style={{ borderLeft: '4px solid var(--info)' }}>
              <h3 className="fw-800 mb-2" style={{ fontSize: '1.2rem' }}>Control Panel: Start Next Player</h3>
              <div className="flex gap-2">
                <select className="form-input" value={selectedPlayerId} onChange={e => setSelectedPlayerId(e.target.value)} style={{ flex: 1, fontSize: '1rem' }}>
                  <option value="">Select a player from the pool...</option>
                  {availablePlayers.map(p => (
                    <option key={p.id} value={p.id}>{p.name} — {p.playing_role} (Base: ₹{fmt(p.base_price)})</option>
                  ))}
                </select>
                <button className="btn btn-primary" onClick={startAuction} style={{ padding: '0 2rem' }}><Play size={18} style={{ marginRight: '0.5rem' }} /> Start Bidding</button>
              </div>
            </div>
          )}

          {state.player ? (
            <div className="card" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', flex: 1 }}>
              <div style={{ background: 'linear-gradient(135deg, #1E293B, #0F172A)', color: 'white', padding: '3rem 2rem', textAlign: 'center', position: 'relative' }}>
                <div style={{ fontSize: '3rem', fontWeight: 900, marginBottom: '0.5rem', letterSpacing: '-1px' }}>{state.player.name}</div>
                <div className="flex justify-center gap-2 mb-3">
                  <span className="badge" style={{ background: 'rgba(255,255,255,0.1)', color: '#A7F3D0', border: '1px solid rgba(255,255,255,0.2)' }}>{state.player.playing_role}</span>
                  <span className="badge" style={{ background: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid rgba(255,255,255,0.2)' }}>{state.player.course} • {state.player.year} Year</span>
                </div>
                <div style={{ color: '#94A3B8', fontSize: '1.1rem', fontWeight: 600 }}>
                  Base Price: <span style={{ color: 'white' }}>₹{fmt(state.player.base_price)}</span>
                </div>
              </div>

              <div style={{ padding: '3rem 2rem', background: 'var(--white)', textAlign: 'center', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                
                <div className="grid-2" style={{ gap: '2rem', marginBottom: '2rem' }}>
                  <div style={{ background: 'var(--off-white)', padding: '2rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
                    <div style={{ color: 'var(--text-medium)', fontWeight: 700, fontSize: '0.9rem', letterSpacing: '1px', marginBottom: '0.5rem' }}>CURRENT HIGHEST BID</div>
                    <div style={{ fontSize: '3.5rem', fontWeight: 900, color: 'var(--text-dark)', lineHeight: 1 }}>₹{fmt(state.currentBid)}</div>
                    <div style={{ marginTop: '0.5rem', fontSize: '1.1rem', fontWeight: 600, color: 'var(--primary)' }}>
                      {state.highestBidderName ? `by ${state.highestBidderName}` : 'Awaiting first bid...'}
                    </div>
                  </div>
                  <div style={{ background: 'var(--off-white)', padding: '2rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                    <div style={{ color: 'var(--text-medium)', fontWeight: 700, fontSize: '0.9rem', letterSpacing: '1px', marginBottom: '0.5rem' }}>TIME REMAINING</div>
                    <div className={`timer ${state.timeLeft < 15 && state.status === 'Live' ? 'urgent' : ''}`} style={{ fontSize: '4rem', margin: 0 }}>
                      {toMMSS(state.timeLeft)}
                    </div>
                  </div>
                </div>

                {user?.role === 'user' && (
                  <div style={{ background: 'var(--primary-bg)', padding: '2rem', borderRadius: 'var(--radius)', border: '1px solid #FFD8C4' }}>
                    <div className="flex justify-between items-center mb-3">
                      <span style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--primary-dark)' }}>Next Required Bid:</span>
                      <span style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--primary)' }}>₹{fmt(state.nextBid)}</span>
                    </div>
                    <button 
                      className="btn btn-primary btn-full" 
                      style={{ fontSize: '1.4rem', padding: '1.2rem', borderRadius: '12px', opacity: !canBid && !isHighest ? 0.5 : 1 }} 
                      onClick={placeBid} 
                      disabled={!canBid}
                    >
                      {isHighest ? (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                          <Trophy size={24} /> YOU ARE THE HIGHEST BIDDER
                        </div>
                      ) : (
                        `PLACE BID — ₹${fmt(state.nextBid)}`
                      )}
                    </button>
                    {!canBid && !isHighest && state.status === 'Live' && (
                      <div style={{ marginTop: '0.8rem', color: 'var(--danger)', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
                        <AlertCircle size={16} /> Insufficient purse or auction not active
                      </div>
                    )}
                  </div>
                )}

                {user?.role === 'admin' && state.status === 'Live' && (
                  <div className="grid-3 mt-3">
                    <button className="btn btn-secondary btn-lg" onClick={() => socketRef.current?.emit('admin:pauseAuction')}><Pause size={20} /> Pause</button>
                    <button className="btn btn-success btn-lg" onClick={() => socketRef.current?.emit('admin:sellPlayer')}><CheckCircle size={20} /> Sell Player</button>
                    <button className="btn btn-danger btn-lg" onClick={() => socketRef.current?.emit('admin:markUnsold')}><XCircle size={20} /> Unsold</button>
                  </div>
                )}

                {user?.role === 'admin' && state.status === 'Paused' && (
                  <div className="grid-3 mt-3">
                    <button className="btn btn-primary btn-lg" onClick={() => socketRef.current?.emit('admin:resumeAuction')}><Play size={20} /> Resume</button>
                    <button className="btn btn-success btn-lg" onClick={() => socketRef.current?.emit('admin:sellPlayer')}><CheckCircle size={20} /> Sell Player</button>
                    <button className="btn btn-danger btn-lg" onClick={() => socketRef.current?.emit('admin:markUnsold')}><XCircle size={20} /> Unsold</button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '5rem 2rem', background: 'var(--white)', border: '2px dashed var(--border)' }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem', opacity: 0.2 }}><Clock size={80} /></div>
              <h2 className="fw-800 text-dark">The Arena is Empty</h2>
              <p className="text-medium mt-1 text-center" style={{ fontSize: '1.1rem' }}>Waiting for the auctioneer to bring the next player to the stand.</p>
            </div>
          )}
        </div>

        {/* SIDEBAR LOG */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <h3 className="fw-800 mb-3" style={{ fontSize: '1.2rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Activity size={20} color="var(--primary)" /> Live Bid Log
            </h3>
            <div style={{ flex: 1, overflowY: 'auto', maxHeight: '500px', paddingRight: '0.5rem' }} className="history-list">
              {state.bidHistory?.length > 0 ? (
                state.bidHistory.map((b, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: i === 0 ? 'var(--primary-bg)' : 'var(--off-white)', borderRadius: 'var(--radius-sm)', marginBottom: '0.5rem', border: `1px solid ${i === 0 ? '#FFD8C4' : 'var(--border)'}` }}>
                    <div className="flex items-center gap-2">
                      <span style={{ fontWeight: 700, color: i === 0 ? 'var(--primary-dark)' : 'var(--text-dark)' }}>{b.userName}</span>
                    </div>
                    <span style={{ fontWeight: 800, color: i === 0 ? 'var(--primary)' : 'var(--text-medium)' }}>₹{fmt(b.amount)}</span>
                  </div>
                ))
              ) : (
                <div style={{ textAlign: 'center', padding: '4rem 1rem', color: 'var(--text-light)', fontWeight: 600 }}>
                  <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}><Eye size={40} opacity={0.5} /></div>
                  No bids placed yet
                </div>
              )}
            </div>
          </div>

          {user?.role === 'admin' && unsoldPlayers.length > 0 && (
            <div className="card">
              <h3 className="fw-800 mb-2" style={{ borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>Unsold Players</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '300px', overflowY: 'auto', paddingRight: '0.5rem' }}>
                {unsoldPlayers.map(p => (
                  <div key={p.id} className="flex justify-between items-center" style={{ padding: '0.75rem', background: 'var(--off-white)', borderRadius: 'var(--radius-sm)' }}>
                    <div>
                      <div style={{ fontWeight: 700, color: 'var(--text-dark)' }}>{p.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-medium)' }}>{p.playing_role}</div>
                    </div>
                    <button className="btn btn-outline btn-sm" onClick={() => socketRef.current?.emit('admin:reAuction', { playerId: p.id })}>
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
