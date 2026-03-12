import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { Home } from './pages/Home';
import { Explore } from './pages/Explore';
import { Categories } from './pages/Categories';
import { Leaderboard } from './pages/Leaderboard';
import { AdminDashboard } from './pages/AdminDashboard';
import { AppDetail } from './pages/AppDetail';
import { SubmitApp } from './pages/SubmitApp';
import { Profile } from './pages/Profile';
import { Auth } from './pages/Auth';

export default function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/explore" element={<Explore />} />
          <Route path="/categories" element={<Categories />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/app/:id" element={<AppDetail />} />
          <Route path="/submit" element={<SubmitApp />} />
          <Route path="/profile/:username" element={<Profile />} />
          <Route path="/login" element={<Auth />} />
        </Routes>
      </Layout>
    </Router>
  );
}
