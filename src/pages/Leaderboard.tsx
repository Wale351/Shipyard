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
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <div className="text-center space-y-4 py-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-100 text-amber-600 mb-2">
          <Trophy className="w-8 h-8" />
        </div>
        <h1 className="text-4xl font-bold tracking-tight text-zinc-900">Top Builders</h1>
        <p className="text-lg text-zinc-500 max-w-2xl mx-auto">
          Discover the most prolific and highly-rated creators on Shipyard.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-zinc-200 shadow-sm">
        <div className="text-sm font-medium text-zinc-500 uppercase tracking-wider">Rank by</div>
        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0 scrollbar-hide">
          <Button 
            variant={sortBy === 'upvotes' ? 'default' : 'outline'} 
            size="sm" 
            onClick={() => setSortBy('upvotes')}
            className="rounded-full gap-2 whitespace-nowrap"
          >
            <Star className="w-4 h-4" /> Total Upvotes
          </Button>
          <Button 
            variant={sortBy === 'apps' ? 'default' : 'outline'} 
            size="sm" 
            onClick={() => setSortBy('apps')}
            className="rounded-full gap-2 whitespace-nowrap"
          >
            <Layers className="w-4 h-4" /> Apps Created
          </Button>
          <Button 
            variant={sortBy === 'engagement' ? 'default' : 'outline'} 
            size="sm" 
            onClick={() => setSortBy('engagement')}
            className="rounded-full gap-2 whitespace-nowrap"
          >
            <MessageSquare className="w-4 h-4" /> Engagement
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="divide-y divide-zinc-100">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="p-6 flex items-center gap-4 animate-pulse">
                <div className="w-8 h-8 bg-zinc-100 rounded-full" />
                <div className="w-12 h-12 bg-zinc-100 rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-zinc-100 rounded w-32" />
                  <div className="h-3 bg-zinc-100 rounded w-24" />
                </div>
                <div className="w-24 h-8 bg-zinc-100 rounded-full" />
              </div>
            ))}
          </div>
        ) : (
          <div className="divide-y divide-zinc-100">
            {sortedBuilders.map((builder, index) => (
              <Link 
                key={builder.id} 
                to={`/profile/${builder.username}`}
                className="flex items-center gap-4 sm:gap-6 p-4 sm:p-6 hover:bg-zinc-50 transition-colors group"
              >
                <div className="flex items-center justify-center w-8 sm:w-12 shrink-0">
                  {index === 0 ? (
                    <Medal className="w-8 h-8 text-amber-400 drop-shadow-sm" />
                  ) : index === 1 ? (
                    <Medal className="w-7 h-7 text-zinc-400 drop-shadow-sm" />
                  ) : index === 2 ? (
                    <Medal className="w-6 h-6 text-amber-700 drop-shadow-sm" />
                  ) : (
                    <span className="text-lg font-bold text-zinc-400">#{index + 1}</span>
                  )}
                </div>

                <div className="relative shrink-0">
                  {builder.avatar ? (
                    <img 
                      src={builder.avatar} 
                      alt={builder.username} 
                      className="w-12 h-12 sm:w-14 sm:h-14 rounded-full object-cover border-2 border-white shadow-sm"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-zinc-100 flex items-center justify-center border-2 border-white shadow-sm">
                      <UserIcon className="w-6 h-6 text-zinc-400" />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-bold text-zinc-900 truncate group-hover:text-indigo-600 transition-colors">
                    {builder.username}
                  </h3>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-sm text-zinc-500">
                    <span className="flex items-center gap-1">
                      <Layers className="w-3.5 h-3.5" />
                      {builder.totalApps} {builder.totalApps === 1 ? 'app' : 'apps'}
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageSquare className="w-3.5 h-3.5" />
                      {builder.engagement} engagement
                    </span>
                  </div>
                </div>

                <div className="shrink-0 text-right">
                  <div className="flex items-center gap-1.5 bg-zinc-100 px-3 py-1.5 rounded-full">
                    <Star className="w-4 h-4 text-zinc-700" />
                    <span className="font-bold text-zinc-900">{builder.totalUpvotes}</span>
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
