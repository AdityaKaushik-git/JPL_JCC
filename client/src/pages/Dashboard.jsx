import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { api } from '../services/api'
import { Wallet, Users, History, Settings, Play, ShieldCheck, Activity, Trophy, Clock } from 'lucide-react'

function fmt(n) { return Number(n || 0).toLocaleString('en-IN') }

export default function Dashboard() {
  const { user } = useAuth()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.getDashboard()
      .then(d => setData(d))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="spinner-wrapper" style={{ minHeight: '60vh' }}>
      <div className="spinner" style={{ width: 48, height: 48 }} />
    </div>
  )

  // ADMIN DASHBOARD
  if (user?.role === 'admin') {
    return (
      <div className="page">
        <div className="page-header">
          <div>
            <h1>Admin Dashboard</h1>
            <p>System overview and auction controls</p>
          </div>
        </div>

        <div className="quick-actions">
          <Link to="/auction" className="action-card">
            <div className="action-icon" style={{ color: 'var(--primary)' }}><Play size={32} /></div>
            <div className="action-title">Live Auction</div>
            <div className="action-desc">Start or manage the active auction</div>
          </Link>
          <Link to="/admin" className="action-card">
            <div className="action-icon" style={{ color: 'var(--info)' }}><Users size={32} /></div>
            <div className="action-title">Manage Players</div>
            <div className="action-desc">Add, edit, or remove players</div>
          </Link>
          <Link to="/admin" className="action-card">
            <div className="action-icon" style={{ color: 'var(--success)' }}><History size={32} /></div>
            <div className="action-title">Auction History</div>
            <div className="action-desc">View completed bids and stats</div>
          </Link>
        </div>
      </div>
    )
  }

  // PLAYER DASHBOARD
  if (user?.role === 'player') {
    const p = data?.player
    const statusClass = p?.status === 'Sold' ? 'badge-success' : p?.status === 'In Auction' ? 'badge-orange' : 'badge-gray'
    return (
      <div className="page">
        <div className="page-header">
          <h1>Player Dashboard</h1>
        </div>
        {p ? (
          <div className="card" style={{ maxWidth: 500 }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="avatar-circle" style={{ width: 64, height: 64, fontSize: '1.8rem' }}>
                {p.name?.charAt(0)}
              </div>
              <div>
                <div className="fw-800" style={{ fontSize: '1.4rem' }}>{p.name}</div>
                <div className="mt-1"><span className={`badge ${statusClass}`}>{p.status}</span></div>
              </div>
            </div>
            
            <div className="grid-2 mt-2">
              <div className="card" style={{ background: 'var(--off-white)', padding: '1rem', boxShadow: 'none' }}>
                <div className="stat-label">ROLE</div>
                <div className="fw-700">{p.playing_role}</div>
              </div>
              <div className="card" style={{ background: 'var(--off-white)', padding: '1rem', boxShadow: 'none' }}>
                <div className="stat-label">COURSE</div>
                <div className="fw-700">{p.course} • {p.year} Year</div>
              </div>
              <div className="card" style={{ background: 'var(--primary-bg)', padding: '1rem', boxShadow: 'none', gridColumn: '1 / -1' }}>
                <div className="stat-label" style={{ color: 'var(--primary-dark)' }}>BASE PRICE</div>
                <div className="fw-800 text-primary" style={{ fontSize: '1.5rem' }}>₹{fmt(p.base_price)}</div>
              </div>
            </div>

            {p.status === 'Sold' && (
              <div className="alert alert-success mt-3" style={{ fontSize: '1.1rem' }}>
                <ShieldCheck size={20} style={{ marginRight: '0.5rem' }} /> Sold to <strong className="fw-800" style={{ margin: '0 0.4rem' }}>{p.bought_by_name}</strong> for <strong className="fw-800" style={{ marginLeft: '0.4rem' }}>₹{fmt(p.winning_bid)}</strong>
              </div>
            )}
            
            <Link to="/auction" className="btn btn-primary btn-full btn-lg mt-3" style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
              <Play size={20} /> Watch Live Auction
            </Link>
          </div>
        ) : (
          <div className="card text-center" style={{ padding: '3rem' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}><Clock size={48} color="var(--text-light)" /></div>
            <h3>Profile Pending</h3>
            <p className="text-medium mt-1">Your player profile is being set up by the admin.</p>
          </div>
        )}
      </div>
    )
  }

  // USER (BIDDER) DASHBOARD
  const TOTAL_BUDGET = 30000000;
  const spent = Number(data?.totalSpent || 0);
  const remaining = Number(data?.purse || 0);
  const percentSpent = Math.min((spent / TOTAL_BUDGET) * 100, 100);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Welcome, {user?.full_name?.split(' ')[0]}</h1>
          <p>Your franchise management dashboard</p>
        </div>
        <Link to="/auction" className="btn btn-primary btn-lg" style={{ display: 'flex', gap: '0.5rem' }}><Play size={20} /> Join Live Auction</Link>
      </div>

      <div className="grid-3 mb-3">
        <div className="stat-card">
          <div className="stat-icon orange"><Wallet size={28} /></div>
          <div className="stat-content">
            <div className="stat-label">Purse Remaining</div>
            <div className="stat-value">₹{fmt(remaining)}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon purple"><Users size={28} /></div>
          <div className="stat-content">
            <div className="stat-label">Players Bought</div>
            <div className="stat-value">{data?.playersBought || 0}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon blue"><Activity size={28} /></div>
          <div className="stat-content">
            <div className="stat-label">Total Spent</div>
            <div className="stat-value">₹{fmt(spent)}</div>
          </div>
        </div>
      </div>

      <div className="card mb-3">
        <div className="card-header">Budget Overview</div>
        <div className="progress-wrap">
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${percentSpent}%` }}></div>
          </div>
          <div className="progress-text">
            <span>₹{fmt(spent)} Spent</span>
            <span>Total Budget: ₹{fmt(TOTAL_BUDGET)}</span>
          </div>
        </div>
      </div>

      <div className="grid-2" style={{ gap: '2rem' }}>
        <div className="card">
          <div className="card-header">Quick Links</div>
          <div className="flex-col gap-2">
            <Link to="/my-team" className="btn btn-outline btn-full" style={{ justifyContent: 'flex-start', padding: '1rem', fontSize: '1rem' }}>
              <Trophy size={20} style={{ marginRight: '0.8rem', color: 'var(--primary)' }} /> View My Team Roster
            </Link>
            <Link to="/my-bids" className="btn btn-outline btn-full" style={{ justifyContent: 'flex-start', padding: '1rem', fontSize: '1rem' }}>
              <History size={20} style={{ marginRight: '0.8rem', color: 'var(--primary)' }} /> Bidding History
            </Link>
            <Link to="/profile" className="btn btn-outline btn-full" style={{ justifyContent: 'flex-start', padding: '1rem', fontSize: '1rem' }}>
              <Settings size={20} style={{ marginRight: '0.8rem', color: 'var(--primary)' }} /> Account Settings
            </Link>
          </div>
        </div>

        <div className="card">
          <div className="card-header">Recent Transactions</div>
          {data?.recentBids?.length > 0 ? (
            <div className="flex-col gap-2">
              {data.recentBids.map((b, i) => (
                <div key={i} className="flex justify-between items-center" style={{ padding: '1rem', background: 'var(--off-white)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                  <div>
                    <div className="fw-700">{b.player_name}</div>
                    <div className="text-primary fw-800 text-sm mt-1">₹{fmt(b.bid_amount)}</div>
                  </div>
                  <span className={`badge ${b.status === 'Won' ? 'badge-success' : 'badge-gray'}`}>{b.status}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-medium" style={{ padding: '2.5rem 0' }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}><History size={32} opacity={0.5} /></div>
              No recent bids found.<br/>Go to the auction to start bidding!
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
