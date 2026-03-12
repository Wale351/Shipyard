import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardFooter } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { ArrowUp, MessageSquare, ExternalLink, Search, Layers, Clock } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { App, Category } from '../types';
import { User } from '@supabase/supabase-js';
import { isFastBuild } from '../lib/utils';

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
    build_time: '2 weeks',
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
    build_time: '45 mins',
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

  const REQUESTED_CATEGORIES = [
    'AI Tools',
    'Productivity',
    'Developer Tools',
    'Games',
    'Crypto',
    'Design',
    'Automation'
  ];

  async function fetchCategories() {
    const { data } = await supabase.from('categories').select('*').order('name');
    if (data && data.length > 0) {
      setCategories(data);
    } else {
      // Fallback categories
      setCategories(REQUESTED_CATEGORIES.map(name => ({
        id: name.toLowerCase().replace(/\s+/g, '-'),
        name,
        slug: name.toLowerCase().replace(/\s+/g, '-')
      })));
    }
  }

  async function fetchApps() {
    setLoading(true);
    try {
      let query;
      
      if (debouncedQuery.trim()) {
        // Use full text search RPC
        query = supabase.rpc('search_apps', { search_query: debouncedQuery.trim() })
          .select(`
            *,
            category:categories(name, slug),
            votes(count),
            comments(count)
          `);
      } else {
        // Standard query
        query = supabase.from('apps')
          .select(`
            *,
            category:categories(name, slug),
            votes(count),
            comments(count)
          `)
          .order('created_at', { ascending: false });
      }

      const { data, error } = await query;

      if (error) throw error;

      if (data && data.length > 0) {
        let formattedApps = data.map((app: any) => ({
          ...app,
          votes_count: app.votes?.[0]?.count || 0,
          comments_count: app.comments?.[0]?.count || 0,
        }));

        // Client-side category filter since we're using RPC which makes joined filtering tricky
        if (activeCategory !== 'All') {
          formattedApps = formattedApps.filter((app: any) => app.category?.name === activeCategory);
        }

        setApps(formattedApps);
      } else {
        // Fallback to mock data if DB is empty or no results from RPC (for demo purposes)
        let mockApps = MOCK_APPS;
        if (debouncedQuery.trim()) {
          const q = debouncedQuery.toLowerCase();
          mockApps = mockApps.filter(app => 
            app.name.toLowerCase().includes(q) || 
            app.tagline?.toLowerCase().includes(q) ||
            app.description?.toLowerCase().includes(q) ||
            app.tech_stack?.some(t => t.toLowerCase().includes(q)) ||
            app.category?.name.toLowerCase().includes(q)
          );
        }
        if (activeCategory !== 'All') {
          mockApps = mockApps.filter(app => app.category?.name === activeCategory);
        }
        setApps(mockApps);
      }
    } catch (err) {
      console.error('Error fetching apps:', err);
      // Fallback to mock data on error
      let mockApps = MOCK_APPS;
      if (debouncedQuery.trim()) {
        const q = debouncedQuery.toLowerCase();
        mockApps = mockApps.filter(app => 
          app.name.toLowerCase().includes(q) || 
          app.tagline?.toLowerCase().includes(q) ||
          app.description?.toLowerCase().includes(q) ||
          app.tech_stack?.some(t => t.toLowerCase().includes(q)) ||
          app.category?.name.toLowerCase().includes(q)
        );
      }
      if (activeCategory !== 'All') {
        mockApps = mockApps.filter(app => app.category?.name === activeCategory);
      }
      setApps(mockApps);
    } finally {
      setLoading(false);
    }
  }

  const handleVote = async (e: React.MouseEvent, appId: string) => {
    e.preventDefault();
    e.stopPropagation();
    
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
    <div className="space-y-8 pb-12">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900">Explore Apps</h1>
          <p className="text-zinc-500 mt-2">Search by name, description, category, or tech stack.</p>
        </div>

        <div className="relative max-w-2xl">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
          <Input 
            placeholder="Search apps (e.g. 'react', 'ai editor', 'database')..." 
            className="pl-12 h-14 text-lg rounded-2xl bg-white border-zinc-200 shadow-sm focus-visible:ring-zinc-900"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        <button
          onClick={() => setActiveCategory('All')}
          className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
            activeCategory === 'All' 
              ? 'bg-zinc-900 text-white border-zinc-900' 
              : 'bg-white text-zinc-600 border-zinc-200 hover:bg-zinc-50 border'
          }`}
        >
          All
        </button>
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.name)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors border ${
              activeCategory === cat.name 
                ? 'bg-zinc-900 text-white border-zinc-900' 
                : 'bg-white text-zinc-600 border-zinc-200 hover:bg-zinc-50'
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="h-64 bg-zinc-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : apps.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {apps.map((app) => (
            <Card 
              key={app.id} 
              className="group flex flex-col h-full transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-zinc-200/50 hover:border-zinc-300 overflow-hidden bg-white"
            >
              <Link to={`/app/${app.id}`} className="flex-1 p-6 pb-0 space-y-4">
                <div className="flex items-start gap-4">
                  <img 
                    src={app.logo_url || `https://picsum.photos/seed/${app.id}/150/150`} 
                    alt={`${app.name} logo`} 
                    className="w-16 h-16 rounded-xl object-cover border border-zinc-100 shadow-sm group-hover:scale-105 transition-transform duration-300"
                    referrerPolicy="no-referrer"
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xl font-bold text-zinc-900 truncate">{app.name}</h3>
                    <p className="text-sm text-zinc-500 truncate">{app.tagline}</p>
                    <div className="flex items-center gap-3 mt-2">
                      {app.category && (
                        <div className="flex items-center gap-1 text-xs font-medium text-zinc-400 uppercase tracking-wider">
                          <Layers className="w-3 h-3" />
                          {app.category.name}
                        </div>
                      )}
                      {app.build_time && (
                        <div className={`flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full shrink-0 ${
                          isFastBuild(app.build_time) ? 'bg-emerald-100 text-emerald-700' : 'bg-zinc-100 text-zinc-600'
                        }`}>
                          <Clock className="w-3 h-3" />
                          Built in {app.build_time}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                <p className="text-sm text-zinc-600 line-clamp-2 leading-relaxed">
                  {app.description}
                </p>

                <div className="flex flex-wrap gap-2 pt-2">
                  {app.tech_stack?.slice(0, 3).map(tech => (
                    <Badge key={tech} variant="secondary" className="bg-zinc-100 text-zinc-600 hover:bg-zinc-200">
                      {tech}
                    </Badge>
                  ))}
                  {(app.tech_stack?.length || 0) > 3 && (
                    <Badge variant="secondary" className="bg-zinc-100 text-zinc-600">
                      +{(app.tech_stack?.length || 0) - 3}
                    </Badge>
                  )}
                </div>
              </Link>

              <CardFooter className="p-6 pt-6 mt-auto border-t border-zinc-100 flex items-center justify-between bg-zinc-50/50">
                <div className="flex items-center gap-4">
                  <button 
                    onClick={(e) => handleVote(e, app.id)}
                    disabled={votingAppId === app.id}
                    className={`flex items-center gap-1.5 transition-colors group/btn ${
                      userVotes.has(app.id) ? 'text-zinc-900' : 'text-zinc-600 hover:text-zinc-900'
                    }`}
                  >
                    <div className={`p-1.5 rounded-md transition-colors ${
                      userVotes.has(app.id) 
                        ? 'bg-zinc-900 text-white border-zinc-900' 
                        : 'bg-white border border-zinc-200 group-hover/btn:border-zinc-400'
                    }`}>
                      <ArrowUp className="w-4 h-4" />
                    </div>
                    <span className="font-semibold text-sm">{app.votes_count || 0}</span>
                  </button>
                  <Link to={`/app/${app.id}#comments`} className="flex items-center gap-1.5 text-zinc-500 hover:text-zinc-900 transition-colors">
                    <MessageSquare className="w-4 h-4" />
                    <span className="font-medium text-sm">{app.comments_count || 0}</span>
                  </Link>
                </div>
                
                <Button asChild size="sm" className="rounded-full px-4 font-medium shadow-sm">
                  <a href={app.website_url} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>
                    Try App <ExternalLink className="w-3 h-3 ml-1.5" />
                  </a>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-24 bg-zinc-50 rounded-2xl border border-zinc-200 border-dashed">
          <div className="bg-white w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm border border-zinc-100">
            <Search className="w-5 h-5 text-zinc-400" />
          </div>
          <h3 className="text-lg font-bold text-zinc-900 mb-1">No apps found</h3>
          <p className="text-zinc-500">Try adjusting your search or category filter.</p>
          {(searchQuery || activeCategory !== 'All') && (
            <Button 
              variant="outline" 
              className="mt-6 rounded-full"
              onClick={() => {
                setSearchQuery('');
                setActiveCategory('All');
              }}
            >
              Clear filters
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
