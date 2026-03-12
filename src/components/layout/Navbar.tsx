import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Plus, User, Shuffle, Shield } from 'lucide-react';
import { Button } from '../ui/Button';
import { supabase } from '../../lib/supabase';

export function Navbar() {
  const navigate = useNavigate();
  const [isRandomizing, setIsRandomizing] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    checkAdminStatus();
  }, []);

  async function checkAdminStatus() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();

      if (profile?.role === 'admin') {
        setIsAdmin(true);
      }
    } catch (err) {
      console.error('Error checking admin status:', err);
    }
  }

  const handleRandomApp = async () => {
    if (isRandomizing) return;
    setIsRandomizing(true);
    try {
      const { data, error } = await supabase.from('apps').select('id');
      if (error) throw error;
      
      if (data && data.length > 0) {
        const randomId = data[Math.floor(Math.random() * data.length)].id;
        navigate(`/app/${randomId}`);
      } else {
        // Fallback for preview with no data
        const mockIds = ['1', '2', '3', '4'];
        const randomId = mockIds[Math.floor(Math.random() * mockIds.length)];
        navigate(`/app/${randomId}`);
      }
    } catch (err) {
      console.error('Error fetching random app:', err);
      const mockIds = ['1', '2', '3', '4'];
      const randomId = mockIds[Math.floor(Math.random() * mockIds.length)];
      navigate(`/app/${randomId}`);
    } finally {
      setIsRandomizing(false);
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-zinc-200 bg-white/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-zinc-900 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl leading-none">S</span>
            </div>
            <span className="font-bold text-xl tracking-tight">Shipyard</span>
          </Link>
          
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-zinc-600">
            <Link to="/explore" className="hover:text-zinc-900 transition-colors">Explore</Link>
            <Link to="/explore?sort=trending" className="hover:text-zinc-900 transition-colors">Trending</Link>
            <Link to="/explore?sort=newest" className="hover:text-zinc-900 transition-colors">New Launches</Link>
            <Link to="/leaderboard" className="hover:text-zinc-900 transition-colors">Builders</Link>
            <Link to="/categories" className="hover:text-zinc-900 transition-colors">Categories</Link>
            {isAdmin && (
              <Link to="/admin" className="hover:text-zinc-900 transition-colors flex items-center gap-1.5 text-amber-600">
                <Shield className="w-3.5 h-3.5" />
                Admin
              </Link>
            )}
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden md:flex relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 group-focus-within:text-zinc-900 transition-colors" />
            <input 
              type="text" 
              placeholder="Search apps..." 
              className="pl-9 pr-4 py-2 bg-zinc-100 border-transparent focus:bg-white focus:border-zinc-300 focus:ring-2 focus:ring-zinc-900/10 rounded-full text-sm outline-none w-64 transition-all"
            />
          </div>
          
          <Link to="/submit">
            <Button size="sm" className="hidden sm:flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Launch App
            </Button>
          </Link>
          
          <Link to="/login">
            <Button variant="ghost" size="sm" className="hidden sm:flex items-center gap-2 font-medium">
              Login
            </Button>
            <Button variant="ghost" size="icon" className="sm:hidden rounded-full">
              <User className="w-5 h-5" />
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
