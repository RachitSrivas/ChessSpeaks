import { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './utils/supabase';
import { getProfile } from './utils/db';

import Navbar from './components/Navbar';
import Auth from './components/Auth';
import ModePage from './pages/ModePage';
import GamePage from './pages/GamePage';
import DashboardPage from './pages/DashboardPage';
import AboutPage from './pages/AboutPage';

export default function App() {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Auth Listener
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoading(false);
    });
    return () => subscription.unsubscribe();
  }, []);

  // Load Profile Data
  useEffect(() => {
    if (session?.user?.id) {
      getProfile(session.user.id)
        .then(setProfile)
        .catch(console.error);
    } else {
      setProfile(null);
    }
  }, [session]);

  if (loading) {
    return <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center' }}>Loading...</div>;
  }

  // Not Logged In
  if (!session) {
    return (
      <div className="app-container">
        <header className="header" style={{ justifyContent: 'center' }}>
          <h1 style={{ fontSize: '2rem' }}><span style={{ color: 'var(--accent-color)' }}>Chess</span>Speaks</h1>
        </header>
        <Auth onLogin={setSession} />
      </div>
    );
  }

  // Logged In Router
  return (
    <div className="app-container">
      <Navbar session={session} />
      
      <Routes>
        <Route path="/" element={<Navigate to="/mode" replace />} />
        <Route path="/mode" element={<ModePage profile={profile} />} />
        <Route path="/game" element={<GamePage session={session} profile={profile} setProfile={setProfile} />} />
        <Route path="/dashboard" element={<DashboardPage session={session} />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="*" element={<Navigate to="/mode" replace />} />
      </Routes>
    </div>
  );
}
