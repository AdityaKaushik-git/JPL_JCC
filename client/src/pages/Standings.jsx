import { useEffect, useState } from 'react'
import { api } from '../services/api'
import { Trophy, TrendingUp } from 'lucide-react'
import ToastContainer from '../components/Toast'
import { useToast } from '../hooks/useToast'

function fmt(n) { return Number(n || 0).toLocaleString('en-IN') }

export default function Standings() {
  const [standings, setStandings] = useState([])
  const [loading, setLoading] = useState(true)
  const { toasts, addToast, removeToast } = useToast()

  useEffect(() => {
    api.getStandings()
      .then(d => setStandings(d.standings || []))
      .catch(e => addToast(e.message || 'Failed to load standings', 'danger'))
      .finally(() => setLoading(false))
  }, [addToast])

  if (loading) return <div className="spinner-wrapper" style={{ minHeight: '60vh' }}><div className="spinner" style={{ width: 48, height: 48 }} /></div>

  return (
    <div className="page" style={{ maxWidth: 1000 }}>
      <ToastContainer toasts={toasts} removeToast={removeToast} />
      
      <div className="page-header text-center">
        <h1 className="fw-800" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.8rem' }}>
          <Trophy size={32} color="var(--primary)" /> Franchise Standings
        </h1>
        <p>Current team budgets and total players acquired</p>
      </div>

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Rank</th>
                <th>Franchise Owner</th>
                <th style={{ textAlign: 'center' }}>Players Bought</th>
                <th style={{ textAlign: 'right' }}>Total Spent</th>
                <th style={{ textAlign: 'right' }}>Purse Remaining</th>
              </tr>
            </thead>
            <tbody>
              {standings.map((s, idx) => (
                <tr key={s.id}>
                  <td className="fw-800 text-medium">#{idx + 1}</td>
                  <td className="fw-800 text-dark" style={{ fontSize: '1.1rem' }}>{s.owner_name}</td>
                  <td style={{ textAlign: 'center' }}><span className="badge badge-info">{s.players_count}</span></td>
                  <td style={{ textAlign: 'right' }} className="fw-700 text-medium">₹{fmt(s.total_spent)}</td>
                  <td style={{ textAlign: 'right' }}>
                    <span className="fw-800 text-success" style={{ fontSize: '1.1rem' }}>₹{fmt(s.purse)}</span>
                  </td>
                </tr>
              ))}
              {standings.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '3rem' }}>
                    No franchises found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
