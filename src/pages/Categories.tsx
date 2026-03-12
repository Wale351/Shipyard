import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardFooter } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { ArrowUp, MessageSquare, ExternalLink, Layers, Flame, Clock, Star } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { App, Category } from '../types';
import { AppCard } from '../components/ui/AppCard';
import { User } from '@supabase/supabase-js';
import { isFastBuild } from '../lib/utils';

const REQUESTED_CATEGORIES = [
  'AI Tools',
  'Productivity',
  'Developer Tools',
  'Games',
  'Crypto',
  'Design',
  'Automation'
];

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
    build_time: '3 hours',
    votes_count: 342,
    comments_count: 28,
    trending_score: 15.2,
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
    build_time: 'a weekend',
    votes_count: 289,
    comments_count: 15,
    trending_score: 12.5,
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
    category: { id: 'c3', name: 'AI Tools', slug: 'ai-tools' },
    tech_stack: ['Python', 'PostgreSQL', 'LangChain'],
    build_time: '2 weeks',
    votes_count: 456,
    comments_count: 42,
    trending_score: 8.4,
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
    build_time: '45 mins',
    votes_count: 120,
    comments_count: 5,
    trending_score: 25.1,
    created_at: new Date().toISOString(),
  }
];

export function Categories() {
  const [apps, setApps] = useState<App[]>([]);
  const [categories, setCategories] = useState<string[]>(REQUESTED_CATEGORIES);
  const [loading, setLoading] = useState(true);
  
  const [activeCategory, setActiveCategory] = useState(REQUESTED_CATEGORIES[0]);
  const [sortBy, setSortBy] = useState<'trending' | 'newest' | 'upvoted'>('trending');

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userVotes, setUserVotes] = useState<Set<string>>(new Set());
  const [votingAppId, setVotingAppId] = useState<string | null>(null);

  useEffect(() => {
    fetchCategories();
    checkUserAndVotes();
  }, []);

  useEffect(() => {
    fetchApps();
  }, [activeCategory]);

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
    const { data } = await supabase.from('categories').select('name').order('name');
    if (data && data.length > 0) {
      const dbCategories = data.map(c => c.name);
      const merged = [...new Set([...REQUESTED_CATEGORIES, ...dbCategories])];
      setCategories(merged);
    }
  }

  async function fetchApps() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('apps')
        .select(`
          *,
          trending_score,
          category:categories!inner(name, slug),
          votes(count),
          comments(count)
        `)
        .eq('category.name', activeCategory);

      if (error) throw error;

      if (data && data.length > 0) {
        const formattedApps = data.map((app: any) => ({
          ...app,
          votes_count: app.votes?.[0]?.count || 0,
          comments_count: app.comments?.[0]?.count || 0,
        }));
        setApps(formattedApps);
      } else {
        const mockApps = MOCK_APPS.filter(app => app.category?.name === activeCategory);
        setApps(mockApps);
      }
    } catch (err) {
      console.error('Error fetching apps:', err);
      const mockApps = MOCK_APPS.filter(app => app.category?.name === activeCategory);
      setApps(mockApps);
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

  const sortedApps = [...apps].sort((a, b) => {
    if (sortBy === 'trending') {
      return (Number(b.trending_score) || 0) - (Number(a.trending_score) || 0);
    } else if (sortBy === 'upvoted') {
      return (b.votes_count || 0) - (a.votes_count || 0);
    } else {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    }
  });

  return (
    <div className="space-y-12 pb-24 pt-12">
      <div className="space-y-4">
        <h1 className="text-5xl font-bold tracking-tighter text-charcoal">Collections</h1>
        <p className="text-xl text-charcoal/40 font-medium">Curated experiments across the digital frontier.</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-16">
        {/* Sidebar Categories */}
        <div className="lg:w-72 shrink-0">
          <div className="sticky top-24 space-y-8">
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-charcoal/30 uppercase tracking-[0.2em] px-4">Taxonomy</h3>
              <div className="flex flex-row lg:flex-col gap-2 overflow-x-auto lg:overflow-visible pb-4 lg:pb-0 no-scrollbar">
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`px-6 py-4 rounded-2xl text-sm font-bold transition-all text-left whitespace-nowrap lg:whitespace-normal ${
                      activeCategory === cat 
                        ? 'bg-charcoal text-offwhite shadow-2xl shadow-charcoal/10' 
                        : 'text-charcoal/40 hover:bg-charcoal/5 hover:text-charcoal'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 space-y-12">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-8 border-b border-charcoal/5">
            <h2 className="text-3xl font-bold text-charcoal tracking-tight">{activeCategory}</h2>
            
            <div className="flex items-center gap-2 bg-charcoal/5 p-1 rounded-xl">
              <button
                onClick={() => setSortBy('trending')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${
                  sortBy === 'trending' ? 'bg-white text-charcoal shadow-sm' : 'text-charcoal/40 hover:text-charcoal'
                }`}
              >
                <Flame className="w-4 h-4" /> Trending
              </button>
              <button
                onClick={() => setSortBy('newest')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${
                  sortBy === 'newest' ? 'bg-white text-charcoal shadow-sm' : 'text-charcoal/40 hover:text-charcoal'
                }`}
              >
                <Clock className="w-4 h-4" /> Newest
              </button>
              <button
                onClick={() => setSortBy('upvoted')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${
                  sortBy === 'upvoted' ? 'bg-white text-charcoal shadow-sm' : 'text-charcoal/40 hover:text-charcoal'
                }`}
              >
                <Star className="w-4 h-4" /> Upvoted
              </button>
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-72 bg-charcoal/5 rounded-[32px] animate-pulse" />
              ))}
            </div>
          ) : sortedApps.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {sortedApps.map((app) => (
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
                <Layers className="w-8 h-8 text-charcoal/20" />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-bold text-charcoal">No artifacts found</h3>
                <p className="text-charcoal/40 font-medium">The {activeCategory} collection is currently empty.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
