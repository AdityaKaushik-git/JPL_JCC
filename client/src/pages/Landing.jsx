import { Link } from 'react-router-dom'
import { Trophy, TrendingUp, Users, Gavel, ArrowRight, ShieldCheck, Activity } from 'lucide-react'

export default function Landing() {
  return (
    <div>
      <div className="hero" style={{ background: 'linear-gradient(135deg, var(--primary), var(--primary-dark))', padding: 'clamp(4rem, 12vw, 8rem) 1.25rem', textAlign: 'center', color: 'white' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
          <div style={{ background: 'rgba(255,255,255,0.15)', padding: 'clamp(1rem, 3vw, 1.5rem)', borderRadius: '50%', backdropFilter: 'blur(10px)' }}>
            <Trophy size={48} color="white" />
          </div>
        </div>
        <h1 style={{ fontSize: 'clamp(2rem, 8vw, 4.5rem)', fontWeight: 800, marginBottom: '1.25rem', letterSpacing: '-1px', lineHeight: 1.1 }}>JPL Auction Portal</h1>
        <p style={{ fontSize: 'clamp(0.95rem, 2.5vw, 1.2rem)', opacity: 0.9, maxWidth: '600px', margin: '0 auto 2.5rem', lineHeight: 1.6, fontWeight: 500, padding: '0 0.5rem' }}>
          The official digital auction platform for the JCC College Cricket Premier League. Build your dream roster with real-time bidding.
        </p>
        <div className="hero-btns" style={{ display: 'flex', gap: '0.875rem', justifyContent: 'center', flexWrap: 'wrap', padding: '0 1rem' }}>
          <Link to="/login" className="btn btn-white btn-lg" style={{ background: 'white', color: 'var(--primary)', padding: '0.875rem 2rem', fontSize: '1rem', borderRadius: '50px', fontWeight: 700, boxShadow: '0 10px 25px rgba(0,0,0,0.1)', minWidth: '160px', justifyContent: 'center' }}>
            Sign In
          </Link>
          <Link to="/register" className="btn btn-outline btn-lg" style={{ background: 'transparent', color: 'white', border: '2px solid rgba(255,255,255,0.3)', padding: '0.875rem 2rem', fontSize: '1rem', borderRadius: '50px', fontWeight: 700, minWidth: '160px', justifyContent: 'center' }}>
            Register Team <ArrowRight size={18} style={{ marginLeft: '0.4rem' }} />
          </Link>
        </div>
      </div>

      <div className="features-section" style={{ padding: '6rem 2rem', maxWidth: '1280px', margin: '0 auto' }}>
        <div className="text-center mb-3">
          <h2 style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--text-dark)', marginBottom: '1rem', letterSpacing: '-0.5px' }}>Platform Features</h2>
          <p style={{ fontSize: '1.1rem', color: 'var(--text-medium)', maxWidth: '600px', margin: '0 auto' }}>Experience a seamless, professional-grade auction environment designed for high-stakes team building.</p>
        </div>
        <div className="grid-3 mt-3">
          <div className="card text-center" style={{ padding: '3rem 2rem', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.03)' }}>
            <Gavel size={48} color="var(--primary)" style={{ margin: '0 auto 1.5rem' }} />
            <h3 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '1rem' }}>Live Bidding Engine</h3>
            <p style={{ color: 'var(--text-medium)', lineHeight: 1.6 }}>Real-time WebSocket integration ensures millisecond-accurate bid placements and instantaneous ledger updates.</p>
          </div>
          <div className="card text-center" style={{ padding: '3rem 2rem', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.03)' }}>
            <Users size={48} color="var(--primary)" style={{ margin: '0 auto 1.5rem' }} />
            <h3 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '1rem' }}>Roster Management</h3>
            <p style={{ color: 'var(--text-medium)', lineHeight: 1.6 }}>Comprehensive dashboards to track player acquisitions, remaining budget, and team composition dynamically.</p>
          </div>
          <div className="card text-center" style={{ padding: '3rem 2rem', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.03)' }}>
            <ShieldCheck size={48} color="var(--primary)" style={{ margin: '0 auto 1.5rem' }} />
            <h3 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '1rem' }}>Secure Transactions</h3>
            <p style={{ color: 'var(--text-medium)', lineHeight: 1.6 }}>Role-based access control and encrypted token architecture guarantees fairness and administrative oversight.</p>
          </div>
        </div>
      </div>

      <div className="stats-strip" style={{ background: 'var(--text-dark)', color: 'white', padding: '5rem 2rem' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap', gap: '3rem' }}>
          <div className="text-center">
            <Activity size={40} color="var(--primary)" style={{ margin: '0 auto 1rem', opacity: 0.8 }} />
            <div style={{ fontSize: '4rem', fontWeight: 800, color: 'var(--primary)', lineHeight: 1 }}>50+</div>
            <div style={{ fontSize: '1.1rem', textTransform: 'uppercase', letterSpacing: '2px', opacity: 0.7, marginTop: '0.5rem', fontWeight: 600 }}>Active Players</div>
          </div>
          <div className="text-center">
            <TrendingUp size={40} color="var(--primary)" style={{ margin: '0 auto 1rem', opacity: 0.8 }} />
            <div style={{ fontSize: '4rem', fontWeight: 800, color: 'var(--primary)', lineHeight: 1 }}>10</div>
            <div style={{ fontSize: '1.1rem', textTransform: 'uppercase', letterSpacing: '2px', opacity: 0.7, marginTop: '0.5rem', fontWeight: 600 }}>Franchises</div>
          </div>
        </div>
      </div>

      <footer style={{ background: '#0F172A', color: 'rgba(255,255,255,0.4)', padding: '3rem 2rem', textAlign: 'center', fontSize: '0.9rem' }}>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
          <Trophy size={20} /> <span style={{ fontWeight: 700, letterSpacing: '1px' }}>JPL AUCTION PLATFORM</span>
        </div>
        © {new Date().getFullYear()} JCC College. All rights reserved.
      </footer>
    </div>
  )
}
