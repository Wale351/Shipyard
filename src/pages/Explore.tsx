import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Layers, Zap } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { App, Category } from '../types';
import { User } from '@supabase/supabase-js';
import { AppCard } from '../components/ui/AppCard';

// Rich mock data fallback for preview environments
const MOCK_APPS: App[] = [
  {
    id: '1',
    name: 'CodeVibe',
    tagline: 'AI code editor that matches your mood',
    description: 'An AI-powered code editor that writes code based on your mood and Spotify playlist. It analyzes your listening habits to suggest code completions.',
    logo_url: 'https://picsum.photos/seed/codevibe/150/150',
    website_url: 'https://example.com',
    builder_id: 'user1',
    category: { id: 'c1', name: 'Developer Tools', slug: 'developer-tools' },
    tech_stack: ['React', 'Rust', 'OpenAI'],
    votes_count: 342,
    comments_count: 28,
    created_at: new Date(Date.now() - 100000000).toISOString(),
  },
  {
    id: '2',
    name: 'DesignGen',
    tagline: 'Text-to-UI system generator',
    description: 'Generate complete UI systems from a single text prompt using advanced diffusion models. Export directly to React components.',
    logo_url: 'https://picsum.photos/seed/designgen/150/150',
    website_url: 'https://example.com',
    builder_id: 'user2',
    category: { id: 'c2', name: 'Design', slug: 'design' },
    tech_stack: ['Next.js', 'Tailwind', 'Figma API'],
    votes_count: 289,
    comments_count: 15,
    created_at: new Date(Date.now() - 50000000).toISOString(),
  },
  {
    id: '3',
    name: 'DataWhisperer',
    tagline: 'Chat with your databases',
    description: 'Chat with your databases in plain English. Supports Postgres, MySQL, and MongoDB. Get instant charts and insights.',
    logo_url: 'https://picsum.photos/seed/datawhisper/150/150',
    website_url: 'https://example.com',
    builder_id: 'user3',
    category: { id: 'c3', name: 'Analytics', slug: 'analytics' },
    tech_stack: ['Python', 'PostgreSQL', 'LangChain'],
    votes_count: 456,
    comments_count: 42,
    created_at: new Date(Date.now() - 200000000).toISOString(),
  },
  {
    id: '4',
    name: 'VibeCheck',
    tagline: 'Automated vibe-based code review',
    description: 'Linter that checks if your code passes the vibe check. Enforces naming conventions based on current internet slang.',
    logo_url: 'https://picsum.photos/seed/vibecheck/150/150',
    website_url: 'https://example.com',
    builder_id: 'user4',
    category: { id: 'c1', name: 'Developer Tools', slug: 'developer-tools' },
    tech_stack: ['TypeScript', 'AST', 'Gemini'],
    votes_count: 120,
    comments_count: 5,
    created_at: new Date().toISOString(),
  }
];

export function Explore() {
  const [apps, setApps] = useState<App[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userVotes, setUserVotes] = useState<Set<string>>(new Set());
  const [votingAppId, setVotingAppId] = useState<string | null>(null);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    fetchCategories();
    checkUserAndVotes();
  }, []);

  useEffect(() => {
    fetchApps();
  }, [debouncedQuery, activeCategory]);

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
    const { data } = await supabase.from('categories').select('*').order('name');
    if (data && data.length > 0) {
      setCategories(data);
    } else {
      setCategories([
        { id: 'c1', name: 'Developer Tools', slug: 'developer-tools' },
        { id: 'c2', name: 'Design', slug: 'design' },
        { id: 'c3', name: 'Analytics', slug: 'analytics' },
        { id: 'c4', name: 'AI Tools', slug: 'ai-tools' },
      ]);
    }
  }

  async function fetchApps() {
    setLoading(true);
    try {
      let query = supabase.from('apps').select(`
        *,
        category:categories(name, slug),
        votes(count),
        comments(count)
      `);

      if (debouncedQuery.trim()) {
        query = query.or(`name.ilike.%${debouncedQuery}%,tagline.ilike.%${debouncedQuery}%,description.ilike.%${debouncedQuery}%`);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;

      if (data && data.length > 0) {
        let formattedApps = data.map((app: any) => ({
          ...app,
          votes_count: app.votes?.[0]?.count || 0,
          comments_count: app.comments?.[0]?.count || 0,
        }));

        if (activeCategory !== 'All') {
          formattedApps = formattedApps.filter((app: any) => app.category?.name === activeCategory);
        }

        setApps(formattedApps);
      } else {
        let mockApps = MOCK_APPS;
        if (debouncedQuery.trim()) {
          const q = debouncedQuery.toLowerCase();
          mockApps = mockApps.filter(app => 
            app.name.toLowerCase().includes(q) || 
            app.tagline?.toLowerCase().includes(q) ||
            app.description?.toLowerCase().includes(q)
          );
        }
        if (activeCategory !== 'All') {
          mockApps = mockApps.filter(app => app.category?.name === activeCategory);
        }
        setApps(mockApps);
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

  return (
    <div className="space-y-12 pb-24 pt-12">
      <div className="space-y-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-cobalt text-offwhite rounded-2xl flex items-center justify-center shadow-xl shadow-cobalt/20">
            <Zap className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-4xl font-bold tracking-tight text-charcoal">Explore the Shipyard</h1>
            <p className="text-charcoal/50 font-medium">Discover the most innovative AI experiments.</p>
          </div>
        </div>

        <div className="relative max-w-3xl group">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-charcoal/30 group-focus-within:text-charcoal transition-colors" />
          <input 
            type="text"
            placeholder="Search by name, tech stack, or mission..." 
            className="w-full pl-14 pr-6 h-16 text-lg rounded-[24px] bg-charcoal/5 border-transparent focus:bg-white focus:border-charcoal/10 focus:ring-8 focus:ring-cobalt/5 outline-none transition-all text-charcoal placeholder:text-charcoal/30 font-medium"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-4 no-scrollbar">
        <button
          onClick={() => setActiveCategory('All')}
          className={`px-6 py-3 rounded-2xl text-sm font-bold uppercase tracking-widest transition-all ${
            activeCategory === 'All' 
              ? 'bg-charcoal text-offwhite shadow-xl shadow-charcoal/10' 
              : 'bg-charcoal/5 text-charcoal/40 hover:bg-charcoal/10'
          }`}
        >
          All
        </button>
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.name)}
            className={`px-6 py-3 rounded-2xl text-sm font-bold uppercase tracking-widest transition-all whitespace-nowrap ${
              activeCategory === cat.name 
                ? 'bg-charcoal text-offwhite shadow-xl shadow-charcoal/10' 
                : 'bg-charcoal/5 text-charcoal/40 hover:bg-charcoal/10'
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="h-72 bg-charcoal/5 rounded-[32px] animate-pulse" />
          ))}
        </div>
      ) : apps.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {apps.map((app) => (
            <AppCard 
              key={app.id} 
              app={app} 
              isVoted={userVotes.has(app.id)}
              onVote={() => handleVote(app.id)}
              isVoting={votingAppId === app.id}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-32 bg-charcoal/[0.02] rounded-[48px] border border-charcoal/5 border-dashed space-y-6">
          <div className="bg-charcoal/5 w-20 h-20 rounded-full flex items-center justify-center mx-auto shadow-inner">
            <Search className="w-8 h-8 text-charcoal/20" />
          </div>
          <div className="space-y-2">
            <h3 className="text-2xl font-bold text-charcoal">No matches found</h3>
            <p className="text-charcoal/40 font-medium">Try a different keyword or category.</p>
          </div>
        </div>
      )}
    </div>
  );
}
