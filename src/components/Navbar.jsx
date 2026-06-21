import { Link, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../utils/supabase';

export default function Navbar({ session }) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  if (!session) return null; // Don't show navbar if not logged in

  return (
    <nav style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 2rem',
      height: 'var(--header-height, 60px)',
      background: 'var(--bg-panel)',
      borderBottom: '1px solid var(--border-color)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
        <h1 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
          <span style={{ color: 'var(--accent-color)' }}>Chess</span>Speaks
        </h1>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <Link to="/mode" className={`btn ${location.pathname === '/mode' ? 'btn-primary' : 'btn-secondary'}`} style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>Play</Link>
          <Link to="/dashboard" className={`btn ${location.pathname === '/dashboard' ? 'btn-primary' : 'btn-secondary'}`} style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>Dashboard</Link>
          <Link to="/about" className={`btn ${location.pathname === '/about' ? 'btn-primary' : 'btn-secondary'}`} style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>About</Link>
        </div>
      </div>
      <div>
        <button className="btn btn-secondary" onClick={handleLogout} style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>
          Sign Out
        </button>
      </div>
    </nav>
  );
}
