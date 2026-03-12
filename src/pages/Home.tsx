import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Search, Plus, Clock, TrendingUp, Palette, Waves } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { App, Category } from '../types';
import { User } from '@supabase/supabase-js';
import { AppCard } from '../components/ui/AppCard';
import { motion, useScroll, useTransform } from 'motion/react';

// Rich mock data fallback for preview environments
const MOCK_APPS: App[] = [
  {
    id: '1',
    name: 'Oceanic AI',
    tagline: 'Deep sea exploration powered by neural networks',
    description: 'Explore the depths of the ocean through high-resolution AI simulations. Discover new species and underwater landscapes.',
    logo_url: 'https://picsum.photos/seed/ocean/150/150',
    website_url: 'https://example.com',
    builder_id: 'user1',
    category: { id: 'c1', name: 'AI Tools', slug: 'ai-tools' },
    tech_stack: ['React', 'Three.js', 'OpenAI'],
    votes_count: 892,
    comments_count: 45,
    is_featured: true,
    created_at: new Date(Date.now() - 100000000).toISOString(),
  },
  {
    id: '2',
    name: 'Waveform',
    tagline: 'Collaborative audio synthesis',
    description: 'A real-time collaborative audio synthesizer that uses ocean waves as a primary modulation source.',
    logo_url: 'https://picsum.photos/seed/wave/150/150',
    website_url: 'https://example.com',
    builder_id: 'user2',
    category: { id: 'c2', name: 'Creative', slug: 'creative' },
    tech_stack: ['Web Audio API', 'Socket.io'],
    votes_count: 567,
    comments_count: 23,
    is_featured: true,
    created_at: new Date(Date.now() - 50000000).toISOString(),
  },
  {
    id: '3',
    name: 'CoralDB',
    tagline: 'Resilient distributed database',
    description: 'A distributed database designed to be as resilient as a coral reef. High availability and self-healing capabilities.',
    logo_url: 'https://picsum.photos/seed/coral/150/150',
    website_url: 'https://example.com',
    builder_id: 'user3',
    category: { id: 'c3', name: 'Infrastructure', slug: 'infrastructure' },
    tech_stack: ['Go', 'Raft', 'Kubernetes'],
    votes_count: 432,
    comments_count: 12,
    created_at: new Date(Date.now() - 200000000).toISOString(),
  }
];

export function Home() {
  const [apps, setApps] = useState<App[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [sortBy, setSortBy] = useState<'trending' | 'newest'>('trending');
  const [theme, setTheme] = useState<'default' | 'oceanic'>('default');

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userVotes, setUserVotes] = useState<Set<string>>(new Set());
  const [votingAppId, setVotingAppId] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollY } = useScroll();
  const heroOpacity = useTransform(scrollY, [0, 300], [1, 0]);
  const heroScale = useTransform(scrollY, [0, 300], [1, 0.9]);

  useEffect(() => {
    fetchApps();
    fetchCategories();
    checkUserAndVotes();

    const handleMouseMove = (e: MouseEvent) => {
      if (containerRef.current) {
        const x = (e.clientX / window.innerWidth) * 100;
        const y = (e.clientY / window.innerHeight) * 100;
        document.documentElement.style.setProperty('--mouse-x', `${x}%`);
        document.documentElement.style.setProperty('--mouse-y', `${y}%`);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useEffect(() => {
    if (theme === 'oceanic') {
      document.body.classList.add('theme-oceanic');
    } else {
      document.body.classList.remove('theme-oceanic');
    }
  }, [theme]);

  async function checkUserAndVotes() {
    const { data: { user } } = await supabase.auth.getUser();
    setCurrentUser(user);
    if (user) {
      const { data } = await supabase.from('votes').select('app_id').eq('user_id', user.id);
      if (data) {
        setUserVotes(new Set(data.map(v => v.app_id)));
      }
    }
  }

  async function fetchCategories() {
    try {
      const { data, error } = await supabase.from('categories').select('*').order('name');
      if (error) throw error;
      if (data) setCategories(data);
    } catch (err) {
      console.error('Error fetching categories:', err);
      setCategories([
        { id: 'c1', name: 'AI Tools', slug: 'ai-tools' },
        { id: 'c2', name: 'Creative', slug: 'creative' },
        { id: 'c3', name: 'Infrastructure', slug: 'infrastructure' },
      ]);
    }
  }

  async function fetchApps() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('apps')
        .select(`
          *,
          category:categories(name, slug),
          votes(count),
          comments(count)
        `);

      if (error) throw error;

      if (data && data.length > 0) {
        const formattedApps = data.map((app: any) => ({
          ...app,
          votes_count: app.votes?.[0]?.count || 0,
          comments_count: app.comments?.[0]?.count || 0,
        }));
        setApps(formattedApps);
      } else {
        setApps(MOCK_APPS);
      }
    } catch (err) {
      console.error('Error fetching apps:', err);
      setApps(MOCK_APPS);
    } finally {
      setLoading(false);
    }
  }

  const handleVote = async (appId: string) => {
    if (!currentUser) {
      alert('Please sign in to upvote apps.');
      return;
    }
    
    if (votingAppId === appId) return;
    setVotingAppId(appId);
    
    const hasVoted = userVotes.has(appId);
    
    try {
      if (hasVoted) {
        await supabase.from('votes').delete().eq('user_id', currentUser.id).eq('app_id', appId);
        setUserVotes(prev => {
          const next = new Set(prev);
          next.delete(appId);
          return next;
        });
        setApps(prev => prev.map(app => 
          app.id === appId ? { ...app, votes_count: Math.max(0, (app.votes_count || 1) - 1) } : app
        ));
      } else {
        await supabase.from('votes').insert({ user_id: currentUser.id, app_id: appId });
        setUserVotes(prev => {
          const next = new Set(prev);
          next.add(appId);
          return next;
        });
        setApps(prev => prev.map(app => 
          app.id === appId ? { ...app, votes_count: (app.votes_count || 0) + 1 } : app
        ));
      }
    } catch (err) {
      console.error('Error voting:', err);
    } finally {
      setVotingAppId(null);
    }
  };

  const filteredApps = apps
    .filter(app => {
      const matchesCategory = activeCategory === 'All' || app.category?.name === activeCategory;
      const matchesSearch = !searchQuery || 
        app.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        app.tagline.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    })
    .sort((a, b) => {
      if (sortBy === 'trending') {
        return (b.votes_count || 0) - (a.votes_count || 0);
      } else {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });

  const featuredApps = filteredApps.filter(app => app.is_featured);
  const regularApps = filteredApps.filter(app => !app.is_featured);

  return (
    <div ref={containerRef} className="relative min-h-screen overflow-x-hidden">
      {/* Interactive Background */}
      <div className="interactive-bg" />
      
      {/* Hero Section with Wavy Background */}
      <section className="relative h-[80vh] flex flex-col items-center justify-center text-center px-4 overflow-hidden">
        <div className="wave-container">
          <div className="wave" />
          <div className="wave wave-2" />
          <div className="wave wave-3" />
        </div>
        
        <motion.div 
          style={{ opacity: heroOpacity, scale: heroScale }}
          className="relative z-10 max-w-4xl space-y-8"
        >
          <div className="space-y-4">
            <h1 className="text-6xl md:text-8xl font-serif font-black tracking-tighter text-charcoal leading-none">
              SHIPYARD
            </h1>
            <p className="text-xl md:text-2xl text-charcoal/60 font-medium max-w-2xl mx-auto leading-relaxed">
              The premier dock for next-generation artifacts. Discover, deploy, and scale your most ambitious digital creations.
            </p>
          </div>
          
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Button asChild size="lg" className="rounded-full bg-ocean-mid hover:bg-ocean-deep text-offwhite px-8 h-14 text-lg font-bold shadow-xl shadow-ocean-mid/20 border-none">
              <Link to="/explore">Explore Artifacts</Link>
            </Button>
            <Button 
              variant="outline" 
              size="lg" 
              onClick={() => setTheme(theme === 'default' ? 'oceanic' : 'default')}
              className="rounded-full border-charcoal/10 h-14 px-8 text-lg font-bold flex items-center gap-2"
            >
              <Palette className="w-5 h-5" />
              {theme === 'default' ? 'Oceanic Mode' : 'Default Mode'}
            </Button>
          </div>
        </motion.div>
      </section>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 space-y-24 relative z-10">
        {/* Search & Filter Bar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-8 bg-white/50 backdrop-blur-xl p-6 rounded-[32px] border border-charcoal/5 shadow-2xl shadow-charcoal/5">
          <div className="relative w-full md:w-96 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-charcoal/30 group-focus-within:text-ocean-mid transition-colors" />
            <input 
              type="text" 
              placeholder="Search the shipyard..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-charcoal/5 border-transparent focus:bg-white focus:border-ocean-mid/20 rounded-2xl text-base outline-none transition-all text-charcoal"
            />
          </div>
          
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar w-full md:w-auto">
            {['All', ...categories.map(c => c.name)].map(category => (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className={`px-6 py-2.5 rounded-full text-sm font-bold transition-all whitespace-nowrap ${
                  activeCategory === category
                    ? 'bg-ocean-mid text-offwhite shadow-lg shadow-ocean-mid/20'
                    : 'bg-charcoal/5 text-charcoal/60 hover:bg-charcoal/10'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Apps Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-80 bg-charcoal/5 animate-pulse rounded-[40px]" />
            ))}
          </div>
        ) : filteredApps.length === 0 ? (
          <div className="py-32 text-center space-y-6">
            <div className="w-24 h-24 bg-ocean-mid/5 rounded-full flex items-center justify-center mx-auto">
              <Waves className="w-10 h-10 text-ocean-mid/20" />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-bold text-charcoal">Calm Waters</h3>
              <p className="text-charcoal/50 text-lg">No artifacts found in this sector. Try another search.</p>
            </div>
          </div>
        ) : (
          <div className="space-y-32">
            {/* Featured Section */}
            {featuredApps.length > 0 && (
              <section className="space-y-12">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-2 h-8 bg-ocean-mid rounded-full" />
                    <h2 className="text-3xl font-serif font-black tracking-tight text-charcoal">PRIME ARTIFACTS</h2>
                  </div>
                  <div className="hidden sm:flex items-center gap-2 bg-charcoal/5 p-1 rounded-xl">
                    <button onClick={() => setSortBy('trending')} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${sortBy === 'trending' ? 'bg-white text-charcoal shadow-sm' : 'text-charcoal/40'}`}>TRENDING</button>
                    <button onClick={() => setSortBy('newest')} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${sortBy === 'newest' ? 'bg-white text-charcoal shadow-sm' : 'text-charcoal/40'}`}>NEWEST</button>
                  </div>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                  {featuredApps.map(app => (
                    <AppCard 
                      key={app.id} 
                      app={app} 
                      isVoted={userVotes.has(app.id)}
                      onVote={() => handleVote(app.id)}
                      isVoting={votingAppId === app.id}
                      featured
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Regular Section */}
            <section className="space-y-12">
              <div className="flex items-center gap-4">
                <div className="w-2 h-8 bg-charcoal/10 rounded-full" />
                <h2 className="text-3xl font-serif font-black tracking-tight text-charcoal">ALL ARTIFACTS</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
                {regularApps.map(app => (
                  <AppCard 
                    key={app.id} 
                    app={app} 
                    isVoted={userVotes.has(app.id)}
                    onVote={() => handleVote(app.id)}
                    isVoting={votingAppId === app.id}
                  />
                ))}
              </div>
            </section>
          </div>
        )}
      </div>

      {/* Floating Action Button */}
      <div className="fixed bottom-8 right-8 z-50">
        <Link to="/submit">
          <Button size="lg" className="w-16 h-16 rounded-full bg-ocean-mid hover:bg-ocean-deep text-offwhite shadow-2xl shadow-ocean-mid/40 border-none p-0 flex items-center justify-center group">
            <Plus className="w-8 h-8 group-hover:rotate-90 transition-transform duration-500" />
          </Button>
        </Link>
      </div>
    </div>
  );
}
