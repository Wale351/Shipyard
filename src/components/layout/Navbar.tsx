import { Link } from 'react-router-dom';
import { Search, Plus, User } from 'lucide-react';
import { Button } from '../ui/Button';

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-zinc-200 bg-white/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-zinc-900 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl leading-none">V</span>
            </div>
            <span className="font-bold text-xl tracking-tight">VibeHub</span>
          </Link>
          
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-zinc-600">
            <Link to="/explore" className="hover:text-zinc-900 transition-colors">Explore</Link>
            <Link to="/explore?filter=trending" className="hover:text-zinc-900 transition-colors">Trending</Link>
            <Link to="/explore?filter=newest" className="hover:text-zinc-900 transition-colors">Newest</Link>
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
              Submit App
            </Button>
          </Link>
          
          <Link to="/login">
            <Button variant="ghost" size="icon" className="rounded-full">
              <User className="w-5 h-5" />
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
