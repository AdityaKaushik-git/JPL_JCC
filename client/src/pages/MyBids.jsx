import { useEffect, useState } from 'react'
import { api } from '../services/api'

function fmt(n) { return Number(n || 0).toLocaleString('en-IN') }

export default function MyBids() {
  const [bids, setBids] = useState([])
  const [filter, setFilter] = useState('All')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.getMyBids()
      .then(d => setBids(d.bids || []))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const filtered = filter === 'All' ? bids : bids.filter(b => b.status === filter)

  if (loading) return <div className="spinner-wrapper" style={{ minHeight: '60vh' }}><div className="spinner" style={{ width: 48, height: 48 }} /></div>

  return (
    <div className="page">
      <div className="page-header">
        <h1>📊 My Bids</h1>
        <p>Your complete bidding history</p>
      </div>

      <div className="admin-tabs mb-3">
        {['All', 'Won', 'Outbid'].map(f => (
          <button key={f} className={`tab-btn${filter === f ? ' active' : ''}`} onClick={() => setFilter(f)}>{f}</button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📊</div>
          <h3>No bids found</h3>
          <p>{filter === 'All' ? 'You haven\'t placed any bids yet.' : `No ${filter.toLowerCase()} bids.`}</p>
        </div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead><tr><th>Player</th><th>Amount</th><th>Date</th><th>Status</th></tr></thead>
            <tbody>
              {filtered.map(b => (
                <tr key={b.id}>
                  <td className="fw-700">{b.player_name}</td>
                  <td className="text-primary fw-700">₹{fmt(b.bid_amount)}</td>
                  <td style={{ color: 'var(--text-medium)', fontSize: '0.85rem' }}>{new Date(b.created_at).toLocaleString('en-IN')}</td>
                  <td><span className={`badge ${b.status === 'Won' ? 'badge-success' : 'badge-gray'}`}>{b.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}