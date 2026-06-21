import { useState } from 'react';
import { supabase } from '../utils/supabase';

export default function Auth({ onLogin }) {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState(null);

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isSignUp) {
        // Check if username is taken
        if (isSignUp) {
          const { data: existingUser } = await supabase
            .from('profiles')
            .select('username')
            .ilike('username', username)
            .maybeSingle();

          if (existingUser) {
            throw new Error("Username is already taken.");
          }
        }

        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { username },
          },
        });
        if (signUpError) throw signUpError;
        if (data?.user) {
          setError("Account created! You can now sign in.");
          setIsSignUp(false);
        }
      } else {
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInError) throw signInError;
        if (data?.session) {
          onLogin(data.session);
        }
      }
    } catch (err) {
      setError(err.message || 'An error occurred during authentication.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="glass-panel auth-panel">
        <h2 style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          {isSignUp ? 'Create Account' : 'Welcome Back'}
        </h2>
        
        {error && (
          <div className="auth-alert" style={{ backgroundColor: isSignUp && !error.includes('error') ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {isSignUp && (
            <div className="input-group">
              <label>Username</label>
              <input 
                type="text" 
                value={username} 
                onChange={(e) => setUsername(e.target.value)} 
                required 
                placeholder="Unique username"
                minLength={3}
              />
            </div>
          )}
          <div className="input-group">
            <label>Email</label>
            <input 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required 
              placeholder="player@vocalchess.com"
            />
          </div>
          <div className="input-group">
            <label>Password</label>
            <input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required 
              placeholder="••••••••"
              minLength={6}
            />
          </div>
          <button type="submit" className="btn" disabled={loading} style={{ marginTop: '0.5rem' }}>
            {loading ? 'Processing...' : (isSignUp ? 'Sign Up' : 'Sign In')}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
          {isSignUp ? "Already have an account?" : "Don't have an account?"}
          <button 
            type="button" 
            onClick={() => { setIsSignUp(!isSignUp); setError(null); }}
            style={{ 
              background: 'none', border: 'none', color: 'var(--primary-color)', 
              cursor: 'pointer', fontWeight: 'bold', marginLeft: '0.5rem', textDecoration: 'underline'
            }}
          >
            {isSignUp ? 'Sign In' : 'Sign Up'}
          </button>
        </p>
      </div>
    </div>
  );
}
