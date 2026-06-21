import { useState, useEffect } from 'react';
import { getProfile, getGameHistory } from '../utils/db';

// ── Tiny sparkline component ──────────────────────────────────────────────────
function RatingSparkline({ history }) {
  if (!history || history.length < 2) return null;

  const ratings = [...history].reverse().map((g) => g.rating_after);
  const min = Math.min(...ratings) - 20;
  const max = Math.max(...ratings) + 20;
  const w = 160, h = 40;

  const points = ratings.map((r, i) => {
    const x = (i / (ratings.length - 1)) * w;
    const y = h - ((r - min) / (max - min)) * h;
    return `${x},${y}`;
  });

  const lastRating = ratings[ratings.length - 1];
  const firstRating = ratings[0];
  const trend = lastRating >= firstRating ? '#a6e3a1' : '#f38ba8';

  return (
    <svg width={w} height={h} style={{ overflow: 'visible' }}>
      <polyline
        points={points.join(' ')}
        fill="none"
        stroke={trend}
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {/* Latest point dot */}
      {points.length > 0 && (
        <circle
          cx={parseFloat(points[points.length - 1].split(',')[0])}
          cy={parseFloat(points[points.length - 1].split(',')[1])}
          r="3"
          fill={trend}
        />
      )}
    </svg>
  );
}

// ── Stat Card ─────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, color }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.04)',
      border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: 10,
      padding: '1rem 1.25rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '0.25rem',
      flex: '1 1 120px',
      minWidth: 0,
    }}>
      <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</span>
      <span style={{ fontSize: '1.75rem', fontWeight: 800, color: color || 'var(--text-primary)', lineHeight: 1 }}>{value}</span>
      {sub && <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>{sub}</span>}
    </div>
  );
}

// ── Win Rate Ring ─────────────────────────────────────────────────────────────
function WinRateRing({ wins, losses, draws }) {
  const total = wins + losses + draws || 1;
  const winPct = Math.round((wins / total) * 100);
  const r = 36, cx = 44, cy = 44, stroke = 8;
  const circ = 2 * Math.PI * r;
  const winArc  = (wins   / total) * circ;
  const lossArc = (losses / total) * circ;
  const drawArc = (draws  / total) * circ;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
      <svg width={88} height={88}>
        {/* Background ring */}
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={stroke} />
        {/* Win arc (green) */}
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#a6e3a1" strokeWidth={stroke}
          strokeDasharray={`${winArc} ${circ}`} strokeDashoffset={0}
          strokeLinecap="round" transform={`rotate(-90 ${cx} ${cy})`} />
        {/* Draw arc (yellow) */}
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f9e2af" strokeWidth={stroke}
          strokeDasharray={`${drawArc} ${circ}`} strokeDashoffset={-(winArc)}
          strokeLinecap="round" transform={`rotate(-90 ${cx} ${cy})`} />
        {/* Loss arc (red) */}
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f38ba8" strokeWidth={stroke}
          strokeDasharray={`${lossArc} ${circ}`} strokeDashoffset={-(winArc + drawArc)}
          strokeLinecap="round" transform={`rotate(-90 ${cx} ${cy})`} />
        <text x={cx} y={cy + 1} textAnchor="middle" dominantBaseline="middle"
          fill="white" fontSize="13" fontWeight="800">{winPct}%</text>
        <text x={cx} y={cy + 16} textAnchor="middle" dominantBaseline="middle"
          fill="var(--text-secondary)" fontSize="8">Win Rate</text>
      </svg>
      {/* Legend */}
      <div style={{ display: 'flex', gap: '0.6rem', fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
        <span><span style={{ color: '#a6e3a1' }}>●</span> W</span>
        <span><span style={{ color: '#f9e2af' }}>●</span> D</span>
        <span><span style={{ color: '#f38ba8' }}>●</span> L</span>
      </div>
    </div>
  );
}

// ── Main Dashboard Component ──────────────────────────────────────────────────
export default function Dashboard({ session, onClose }) {
  const [profile, setProfile] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const [p, h] = await Promise.all([
          getProfile(session.user.id),
          getGameHistory(session.user.id, 20),
        ]);
        setProfile(p);
        setHistory(h);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [session.user.id]);

  const winRate = profile && (profile.total_games || 0) > 0
    ? Math.round(((profile.wins || 0) / (profile.total_games || 1)) * 100)
    : 0;

  return (
    <div style={onClose ? {
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.75)',
      backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '1rem',
    } : {
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '2rem 1rem',
      minHeight: 'calc(100vh - var(--header-height, 60px))'
    }}>
      <div className={onClose ? "glass-panel" : ""} style={{
        width: '100%', maxWidth: 680,
        maxHeight: onClose ? '90vh' : 'auto',
        overflowY: onClose ? 'auto' : 'visible',
        padding: onClose ? '1.75rem' : '0',
        display: 'flex', flexDirection: 'column', gap: '1.5rem',
        position: 'relative',
      }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.3rem' }}>
              👤 {profile?.username || session.user.email?.split('@')[0]}
            </h2>
            <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
              {session.user.email}
            </p>
          </div>
          {onClose && (
            <button className="btn btn-secondary" onClick={onClose} style={{ fontSize: '0.8rem' }}>
              ✕ Close
            </button>
          )}
        </div>

        {loading && (
          <p style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>Loading your stats...</p>
        )}
        {error && (
          <p style={{ textAlign: 'center', color: 'var(--error-color)', fontSize: '0.85rem' }}>
            ⚠️ {error}
            <br />
            <span style={{ fontSize: '0.75rem' }}>Make sure you have run the Supabase migration SQL.</span>
          </p>
        )}

        {profile && !loading && (
          <>
            {/* Rating banner */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(137,180,250,0.12), rgba(180,190,254,0.08))',
              border: '1px solid rgba(137,180,250,0.2)',
              borderRadius: 12,
              padding: '1.25rem 1.5rem',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem',
            }}>
              <div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  Current Rating
                </div>
                <div style={{ fontSize: '3rem', fontWeight: 800, color: 'var(--accent-color)', lineHeight: 1 }}>
                  {profile.rating}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                  Peak: <strong style={{ color: 'white' }}>{profile.peak_rating}</strong>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.4rem' }}>
                <RatingSparkline history={history} />
                <span style={{ fontSize: '0.68rem', color: 'var(--text-secondary)' }}>Last {Math.min(history.length, 20)} games</span>
              </div>
            </div>

            {/* Stats row */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'stretch' }}>
              <StatCard label="Total Games" value={profile.total_games || 0} />
              <StatCard label="Wins" value={profile.wins || 0} color="#a6e3a1" sub={`${winRate}% win rate`} />
              <StatCard label="Losses" value={profile.losses || 0} color="#f38ba8" />
              <StatCard label="Draws" value={profile.draws || 0} color="#f9e2af" />
            </div>

            {/* Win rate ring + info */}
            <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <WinRateRing wins={profile.wins || 0} losses={profile.losses || 0} draws={profile.draws || 0} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  Rating Tier: <strong style={{ color: 'white' }}>
                    {profile.rating >= 2000 ? '🏆 Master'
                      : profile.rating >= 1500 ? '💎 Advanced'
                      : profile.rating >= 1000 ? '⚔️ Intermediate'
                      : profile.rating >= 700  ? '🌱 Beginner'
                      : '🐣 Novice'}
                  </strong>
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  Started at: <strong style={{ color: 'white' }}>600</strong>
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  Net change: <strong style={{ color: profile.rating >= 600 ? '#a6e3a1' : '#f38ba8' }}>
                    {profile.rating >= 600 ? '+' : ''}{profile.rating - 600}
                  </strong>
                </div>
              </div>
            </div>

            {/* Recent games */}
            <div>
              <h3 style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.75rem' }}>
                Recent Games
              </h3>
              {history.length === 0 ? (
                <p style={{ color: 'var(--text-secondary)', fontStyle: 'italic', fontSize: '0.85rem' }}>
                  No games recorded yet. Play a game to see your history!
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  {history.map((g) => {
                    const date = new Date(g.played_at).toLocaleDateString();
                    const modeLabel = g.game_mode === 'online' ? '🌐' : g.game_mode === 'computer' ? '🤖' : '💻';
                    const resultColor = g.result === 'win' ? '#a6e3a1' : g.result === 'draw' ? '#f9e2af' : '#f38ba8';
                    const changeStr = g.rating_change >= 0 ? `+${g.rating_change}` : `${g.rating_change}`;
                    return (
                      <div key={g.id} style={{
                        display: 'flex', alignItems: 'center', gap: '0.75rem',
                        padding: '0.55rem 0.75rem',
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(255,255,255,0.05)',
                        borderRadius: 7,
                        fontSize: '0.8rem',
                      }}>
                        <span style={{ fontSize: '1rem' }}>{modeLabel}</span>
                        <span style={{ fontWeight: 700, color: resultColor, width: 36, textAlign: 'center', textTransform: 'capitalize' }}>{g.result}</span>
                        <span style={{ color: 'var(--text-secondary)', flex: 1 }}>
                          {g.player_color === 'w' ? '♔ White' : '♚ Black'} · {g.total_moves} moves
                        </span>
                        <span style={{ color: g.rating_change >= 0 ? '#a6e3a1' : '#f38ba8', fontWeight: 700, fontSize: '0.78rem' }}>
                          {changeStr}
                        </span>
                        <span style={{ color: 'var(--text-secondary)', fontSize: '0.72rem', whiteSpace: 'nowrap' }}>{date}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
