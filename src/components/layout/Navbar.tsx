import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Plus, User, Shuffle, Shield, LogOut } from 'lucide-react';
import { Button } from '../ui/Button';
import { Magnetic } from '../ui/Magnetic';
import { supabase } from '../../lib/supabase';
import { User as SupabaseUser } from '@supabase/supabase-js';

export function Navbar() {
  const navigate = useNavigate();
  const [isRandomizing, setIsRandomizing] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [user, setUser] = useState<SupabaseUser | null>(null);

  useEffect(() => {
    checkUser();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        checkAdminStatus(session.user.id);
      } else {
        setIsAdmin(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function checkUser() {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
    if (user) {
      checkAdminStatus(user.id);
    }
  }

  async function checkAdminStatus(userId: string) {
    try {
      const { data: profile } = await supabase
        .from('users')
        .select('role')
        .eq('id', userId)
        .single();

      if (profile?.role === 'admin') {
        setIsAdmin(true);
      }
    } catch (err) {
      console.error('Error checking admin status:', err);
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

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
    <header className="sticky top-0 z-50 w-full border-b border-charcoal/5 bg-offwhite/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between relative">
        {/* Left Section */}
        <div className="flex items-center gap-6">
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-charcoal/60">
            <Link to="/explore" className="hover:text-charcoal transition-colors">Explore</Link>
            <Link to="/categories" className="hover:text-charcoal transition-colors">Categories</Link>
          </nav>
        </div>

        {/* Center Logo */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 bg-charcoal rounded-lg flex items-center justify-center group-hover:bg-ocean-mid transition-colors duration-300">
              <span className="text-offwhite font-bold text-xl leading-none">S</span>
            </div>
            <span className="font-bold text-xl tracking-tight text-charcoal hidden sm:block">Shipyard</span>
          </Link>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-4">
          <div className="hidden lg:flex relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal/30 group-focus-within:text-charcoal transition-colors" />
            <input 
              type="text" 
              placeholder="Search..." 
              className="pl-9 pr-4 py-1.5 bg-charcoal/5 border-transparent focus:bg-white focus:border-charcoal/10 focus:ring-4 focus:ring-ocean-mid/5 rounded-full text-sm outline-none w-40 transition-all text-charcoal"
            />
          </div>
          
          {user ? (
            <div className="flex items-center gap-2">
              <Link to={`/profile/${user.user_metadata?.username || user.email?.split('@')[0]}`}>
                <Button variant="ghost" size="icon" className="rounded-full text-charcoal/70 hover:bg-charcoal/5">
                  <User className="w-5 h-5" />
                </Button>
              </Link>
              <Button variant="ghost" size="icon" onClick={handleLogout} className="text-charcoal/40 hover:text-terracotta hover:bg-terracotta/5 rounded-full">
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <Link to="/login">
              <Button variant="ghost" size="sm" className="font-medium text-charcoal/70 hover:text-charcoal hover:bg-charcoal/5 rounded-full">
                Login
              </Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
