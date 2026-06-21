import { FaMicrophone, FaKeyboard, FaChess, FaRobot, FaGlobe } from 'react-icons/fa';

export default function AboutPage() {
  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '2rem 1rem' }}>
      <div className="glass-panel" style={{ maxWidth: 800, margin: '0 auto', padding: '2.5rem', display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
        
        <div style={{ textAlign: 'center' }}>
          <h1 style={{ fontSize: '2.5rem', margin: '0 0 1rem 0' }}>
            About <span style={{ color: 'var(--accent-color)' }}>Chess</span>Speaks
          </h1>
          <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            ChessSpeaks is a completely voice-controlled chess platform designed for accessibility, 
            hands-free play, and an immersive AI experience. It features real-time voice recognition 
            powered by Groq Whisper, allowing you to play entirely with your voice.
          </p>
        </div>

        <div>
          <h2 style={{ fontSize: '1.4rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FaMicrophone color="var(--error-color)" /> Voice Controls
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1.25rem', borderRadius: '8px' }}>
              <h3 style={{ fontSize: '1.1rem', margin: '0 0 0.5rem 0', color: 'var(--accent-color)' }}>How to Speak Moves</h3>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: '0 0 1rem 0' }}>
                Press and hold the Spacebar (or click the Mic button), say your move, and release.
              </p>
              <ul style={{ fontSize: '0.85rem', color: 'var(--text-primary)', paddingLeft: '1.2rem', margin: 0, display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <li><strong>Standard:</strong> "e2 to e4", "knight to f3"</li>
                <li><strong>NATO Phonetic:</strong> "echo two to echo four"</li>
                <li><strong>Natural:</strong> "move my knight from g1 to f3"</li>
                <li><strong>Captures:</strong> "bishop takes c4"</li>
              </ul>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1.25rem', borderRadius: '8px' }}>
              <h3 style={{ fontSize: '1.1rem', margin: '0 0 0.5rem 0', color: '#a6e3a1', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <FaKeyboard /> Keyboard Shortcuts
              </h3>
              <ul style={{ fontSize: '0.9rem', color: 'var(--text-primary)', paddingLeft: '1.2rem', margin: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <li>
                  <kbd style={{ background: '#1e1e2e', padding: '0.2rem 0.5rem', borderRadius: 4, border: '1px solid var(--border-color)', fontSize: '0.8rem' }}>F</kbd>
                  {' '} Toggle Voice Mode ON / OFF
                </li>
                <li>
                  <kbd style={{ background: '#1e1e2e', padding: '0.2rem 0.5rem', borderRadius: 4, border: '1px solid var(--border-color)', fontSize: '0.8rem' }}>Space (Hold)</kbd>
                  {' '} Push-to-Talk (Hold to record, release to transcribe)
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div>
          <h2 style={{ fontSize: '1.4rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FaChess color="#f9e2af" /> Game Modes
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '8px', textAlign: 'center' }}>
              <FaRobot size={24} color="#f38ba8" style={{ marginBottom: '0.5rem' }} />
              <h3 style={{ fontSize: '1rem', margin: '0 0 0.5rem 0' }}>vs Computer</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>Play against Stockfish AI. Choose a rating from 600 (Beginner) up to 3600 (Grandmaster).</p>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '8px', textAlign: 'center' }}>
              <FaGlobe size={24} color="var(--accent-color)" style={{ marginBottom: '0.5rem' }} />
              <h3 style={{ fontSize: '1rem', margin: '0 0 0.5rem 0' }}>Online Multiplayer</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>Create a room code, share it with a friend, and play remotely.</p>
            </div>
          </div>
        </div>

        <div>
          <h2 style={{ fontSize: '1.4rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '1.5rem' }}>
            Basic Chess Rules
          </h2>
          <ul style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', lineHeight: 1.6, paddingLeft: '1.2rem', margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <li><strong>Objective:</strong> Checkmate the opponent's king, meaning the king is under attack and cannot escape.</li>
            <li><strong>White moves first:</strong> The player with the white pieces always makes the first move.</li>
            <li><strong>Pawn Promotion:</strong> If a pawn reaches the opposite end of the board, it promotes to a Queen (or Knight/Rook/Bishop). <em>Currently, ChessSpeaks auto-promotes to a Queen.</em></li>
            <li><strong>Castling:</strong> A special move involving the King and Rook. Say "Castle Kingside" or "Castle Queenside" to execute it via voice.</li>
            <li><strong>En Passant:</strong> If a pawn moves two squares forward and lands beside an opponent's pawn, the opponent can capture it as if it only moved one square.</li>
          </ul>
        </div>

      </div>
    </div>
  );
}
