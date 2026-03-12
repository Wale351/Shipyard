import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { Home } from './pages/Home';
import { Landing } from './pages/Landing';
import { Explore } from './pages/Explore';
import { Categories } from './pages/Categories';
import { Leaderboard } from './pages/Leaderboard';
import { AdminDashboard } from './pages/AdminDashboard';
import { AppDetail } from './pages/AppDetail';
import { SubmitApp } from './pages/SubmitApp';
import { Profile } from './pages/Profile';
import { Auth } from './pages/Auth';
import { supabase } from './lib/supabase';
import { User } from '@supabase/supabase-js';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check active sessions and sets the user
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for changes on auth state (sign in, sign out, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-zinc-900"></div>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        <Route path="/" element={user ? <Layout><Home /></Layout> : <Landing />} />
        <Route path="/shipyard" element={<Layout><Landing /></Layout>} />
        <Route path="/explore" element={<Layout><Explore /></Layout>} />
        <Route path="/categories" element={<Layout><Categories /></Layout>} />
        <Route path="/leaderboard" element={<Layout><Leaderboard /></Layout>} />
        <Route path="/admin" element={<Layout><AdminDashboard /></Layout>} />
        <Route path="/app/:id" element={<Layout><AppDetail /></Layout>} />
        <Route path="/submit" element={user ? <Layout><SubmitApp /></Layout> : <Navigate to="/login" />} />
        <Route path="/profile/:username" element={<Layout><Profile /></Layout>} />
        <Route path="/login" element={user ? <Navigate to="/" /> : <Layout><Auth /></Layout>} />
      </Routes>
    </Router>
  );
}
