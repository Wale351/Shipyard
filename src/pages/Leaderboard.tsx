import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Trophy, Star, MessageSquare, Layers, Medal, User as UserIcon } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Button } from '../components/ui/Button';

interface BuilderStats {
  id: string;
  username: string;
  avatar: string | null;
  totalApps: number;
  totalUpvotes: number;
  engagement: number;
}

const MOCK_BUILDERS: BuilderStats[] = [
  {
    id: 'user1',
    username: 'alex_dev',
    avatar: 'https://i.pravatar.cc/150?u=alex_dev',
    totalApps: 12,
    totalUpvotes: 1450,
    engagement: 1600,
  },
  {
    id: 'user2',
    username: 'sarah_codes',
    avatar: 'https://i.pravatar.cc/150?u=sarah_codes',
    totalApps: 8,
    totalUpvotes: 1200,
    engagement: 1350,
  },
  {
    id: 'user3',
    username: 'mike_builds',
    avatar: 'https://i.pravatar.cc/150?u=mike_builds',
    totalApps: 5,
    totalUpvotes: 890,
    engagement: 950,
  },
  {
    id: 'user4',
    username: 'emily_design',
    avatar: 'https://i.pravatar.cc/150?u=emily_design',
    totalApps: 15,
    totalUpvotes: 850,
    engagement: 1100,
  },
  {
    id: 'user5',
    username: 'david_hacks',
    avatar: 'https://i.pravatar.cc/150?u=david_hacks',
    totalApps: 3,
    totalUpvotes: 420,
    engagement: 480,
  }
];

export function Leaderboard() {
  const [builders, setBuilders] = useState<BuilderStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'upvotes' | 'apps' | 'engagement'>('upvotes');

  useEffect(() => {
    fetchBuilders();
  }, []);

  async function fetchBuilders() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('users')
        .select(`
          id,
          username,
          avatar,
          apps (
            id,
            votes (count),
            comments (count)
          )
        `);

      if (error) throw error;

      if (data && data.length > 0) {
        const stats: BuilderStats[] = data.map((user: any) => {
          const totalApps = user.apps?.length || 0;
          const totalUpvotes = user.apps?.reduce((sum: number, app: any) => sum + (app.votes?.[0]?.count || 0), 0) || 0;
          const totalComments = user.apps?.reduce((sum: number, app: any) => sum + (app.comments?.[0]?.count || 0), 0) || 0;
          const engagement = totalUpvotes + totalComments;

          return {
            id: user.id,
            username: user.username,
            avatar: user.avatar,
            totalApps,
            totalUpvotes,
            engagement
          };
        });
        
        // Filter out users with 0 apps if desired, or keep them
        const activeBuilders = stats.filter(b => b.totalApps > 0);
        
        if (activeBuilders.length > 0) {
          setBuilders(activeBuilders);
        } else {
          setBuilders(MOCK_BUILDERS);
        }
      } else {
        setBuilders(MOCK_BUILDERS);
      }
    } catch (err) {
      console.error('Error fetching builders:', err);
      setBuilders(MOCK_BUILDERS);
    } finally {
      setLoading(false);
    }
  }

  const sortedBuilders = [...builders].sort((a, b) => {
    if (sortBy === 'upvotes') return b.totalUpvotes - a.totalUpvotes;
    if (sortBy === 'apps') return b.totalApps - a.totalApps;
    if (sortBy === 'engagement') return b.engagement - a.engagement;
    return 0;
  });

  return (
    <div className="max-w-4xl mx-auto space-y-16 pb-24 pt-12">
      <div className="text-center space-y-6 py-12">
        <div className="inline-flex items-center justify-center w-24 h-24 rounded-[32px] bg-amber-100 text-amber-600 mb-4 shadow-2xl shadow-amber-200/50 rotate-3">
          <Trophy className="w-12 h-12" />
        </div>
        <h1 className="text-6xl font-bold tracking-tighter text-charcoal">The Vanguard</h1>
        <p className="text-xl text-charcoal/40 max-w-2xl mx-auto font-medium">
          The most prolific and highly-rated creators in the shipyard.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-6 bg-charcoal/5 p-2 rounded-2xl">
        <div className="flex items-center gap-1 w-full">
          <button 
            onClick={() => setSortBy('upvotes')}
            className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${
              sortBy === 'upvotes' ? 'bg-white text-charcoal shadow-sm' : 'text-charcoal/40 hover:text-charcoal'
            }`}
          >
            <Star className="w-4 h-4" /> Upvotes
          </button>
          <button 
            onClick={() => setSortBy('apps')}
            className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${
              sortBy === 'apps' ? 'bg-white text-charcoal shadow-sm' : 'text-charcoal/40 hover:text-charcoal'
            }`}
          >
            <Layers className="w-4 h-4" /> Creations
          </button>
          <button 
            onClick={() => setSortBy('engagement')}
            className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${
              sortBy === 'engagement' ? 'bg-white text-charcoal shadow-sm' : 'text-charcoal/40 hover:text-charcoal'
            }`}
          >
            <MessageSquare className="w-4 h-4" /> Engagement
          </button>
        </div>
      </div>

      <div className="bg-white rounded-[40px] border border-charcoal/5 shadow-2xl shadow-charcoal/5 overflow-hidden">
        {loading ? (
          <div className="divide-y divide-charcoal/5">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="p-8 flex items-center gap-6 animate-pulse">
                <div className="w-10 h-10 bg-charcoal/5 rounded-full" />
                <div className="w-16 h-16 bg-charcoal/5 rounded-2xl" />
                <div className="flex-1 space-y-3">
                  <div className="h-5 bg-charcoal/5 rounded w-40" />
                  <div className="h-4 bg-charcoal/5 rounded w-24" />
                </div>
                <div className="w-28 h-10 bg-charcoal/5 rounded-xl" />
              </div>
            ))}
          </div>
        ) : (
          <div className="divide-y divide-charcoal/5">
            {sortedBuilders.map((builder, index) => (
              <Link 
                key={builder.id} 
                to={`/profile/${builder.username}`}
                className="flex items-center gap-6 sm:gap-10 p-8 sm:p-10 hover:bg-charcoal/[0.02] transition-all group"
              >
                <div className="flex items-center justify-center w-12 shrink-0">
                  {index === 0 ? (
                    <Medal className="w-10 h-10 text-amber-400 drop-shadow-xl" />
                  ) : index === 1 ? (
                    <Medal className="w-9 h-9 text-charcoal/20 drop-shadow-xl" />
                  ) : index === 2 ? (
                    <Medal className="w-8 h-8 text-amber-700/40 drop-shadow-xl" />
                  ) : (
                    <span className="text-xl font-bold text-charcoal/10">#{index + 1}</span>
                  )}
                </div>

                <div className="relative shrink-0">
                  {builder.avatar ? (
                    <img 
                      src={builder.avatar} 
                      alt={builder.username} 
                      className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border-4 border-white shadow-xl group-hover:scale-105 transition-transform duration-500"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-charcoal/5 flex items-center justify-center border-4 border-white shadow-xl">
                      <UserIcon className="w-8 h-8 text-charcoal/20" />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="text-2xl font-bold text-charcoal truncate group-hover:text-cobalt transition-colors">
                    {builder.username}
                  </h3>
                  <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-2 text-sm font-bold text-charcoal/30 uppercase tracking-widest">
                    <span className="flex items-center gap-2">
                      <Layers className="w-4 h-4" />
                      {builder.totalApps} {builder.totalApps === 1 ? 'app' : 'apps'}
                    </span>
                    <span className="flex items-center gap-2">
                      <MessageSquare className="w-4 h-4" />
                      {builder.engagement} engagement
                    </span>
                  </div>
                </div>

                <div className="shrink-0 text-right">
                  <div className="flex items-center gap-2 bg-cobalt/5 px-4 py-2 rounded-xl text-cobalt">
                    <Star className="w-5 h-5 fill-cobalt/10" />
                    <span className="font-bold text-xl">{builder.totalUpvotes}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
