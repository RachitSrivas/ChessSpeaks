import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaLaptop, FaGlobe, FaRobot } from 'react-icons/fa';

export default function ModePage({ profile }) {
  const navigate = useNavigate();
  const [showComputerSetup, setShowComputerSetup] = useState(false);
  const [computerRating, setComputerRating] = useState(1500);

  const startGame = (mode, rating = null) => {
    navigate('/game', { state: { mode, rating } });
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '1rem', gap: '1.5rem', minHeight: 'calc(100vh - var(--header-height, 60px))' }}>
      {/* Profile quick-card */}
      {profile && (
        <div className="glass-panel" style={{ padding: '1rem 1.5rem', display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--accent-color)' }}>{profile.rating}</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Rating</div>
          </div>
          <div style={{ width: '1px', height: 40, background: 'var(--border-color)' }} />
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#a6e3a1' }}>{profile.wins || 0}</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Wins</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#f38ba8' }}>{profile.losses || 0}</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Losses</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#f9e2af' }}>{profile.draws || 0}</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Draws</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)' }}>{profile.total_games || 0}</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Total</div>
          </div>
        </div>
      )}

      <div className="glass-panel" style={{ padding: '2.5rem', textAlign: 'center', maxWidth: '480px', width: '100%' }}>
        {!showComputerSetup ? (
          <>
            <h2 style={{ marginBottom: '1.5rem', fontSize: '1.2rem' }}>Choose Game Mode</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <button className="btn" style={{ padding: '1.2rem', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem' }} onClick={() => startGame('offline')}>
                <FaLaptop size={20} /> Play Offline (Local)
              </button>
              <button className="btn" style={{ padding: '1.2rem', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', background: 'rgba(137,180,250,0.8)' }} onClick={() => startGame('online')}>
                <FaGlobe size={20} /> Play Online (Multiplayer)
              </button>
              <button className="btn" style={{ padding: '1.2rem', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', background: 'rgba(166,227,161,0.8)', color: '#1e1e2e' }} onClick={() => setShowComputerSetup(true)}>
                <FaRobot size={20} /> Play with Computer
              </button>
            </div>
          </>
        ) : (
          <>
            <h2 style={{ marginBottom: '0.5rem', fontSize: '1.2rem' }}>Computer Rating</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>Select the strength of the Stockfish engine</p>
            
            <div style={{ marginBottom: '2rem' }}>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--accent-color)', marginBottom: '1rem' }}>
                {computerRating}
              </div>
              <input 
                type="range" 
                min="600" 
                max="3600" 
                step="100" 
                value={computerRating} 
                onChange={(e) => setComputerRating(Number(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--accent-color)' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                <span>Beginner (600)</span>
                <span>Grandmaster (3600)</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowComputerSetup(false)}>
                Back
              </button>
              <button className="btn" style={{ flex: 2, background: 'rgba(166,227,161,0.8)', color: '#1e1e2e' }} onClick={() => startGame('computer', computerRating)}>
                Start Game
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
