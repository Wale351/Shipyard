import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Github, Twitter, Globe, MapPin, Calendar, ArrowUp, Users, Layers } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { App, User } from '../types';
import { AppCard } from '../components/ui/AppCard';

export function Profile() {
  const { username } = useParams();
  
  const [profile, setProfile] = useState<User | null>(null);
  const [apps, setApps] = useState<App[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Stats
  const [totalUpvotes, setTotalUpvotes] = useState(0);
  const [followersCount, setFollowersCount] = useState(0);
  
  // Follow state
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isTogglingFollow, setIsTogglingFollow] = useState(false);

  useEffect(() => {
    fetchProfileData();
    checkCurrentUser();
  }, [username]);

  async function checkCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser();
    setCurrentUser(user);
    if (user && profile) {
      checkIfFollowing(user.id, profile.id);
    }
  }

  // Re-check following status when profile loads
  useEffect(() => {
    if (currentUser && profile) {
      checkIfFollowing(currentUser.id, profile.id);
    }
  }, [profile, currentUser]);

  async function checkIfFollowing(followerId: string, builderId: string) {
    const { data } = await supabase
      .from('followers')
      .select('id')
      .eq('follower_id', followerId)
      .eq('builder_id', builderId)
      .single();
    
    setIsFollowing(!!data);
  }

  async function fetchProfileData() {
    if (!username) return;
    setLoading(true);
    setError(null);

    try {
      // 1. Fetch user profile
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('username', username)
        .single();

      if (userError) throw userError;
      if (!userData) throw new Error('User not found');
      
      setProfile(userData);

      // 2. Fetch apps built by user
      const { data: appsData, error: appsError } = await supabase
        .from('apps')
        .select(`
          *,
          category:categories(name, slug),
          votes(count)
        `)
        .eq('builder_id', userData.id)
        .order('created_at', { ascending: false });

      if (!appsError && appsData) {
        const formattedApps = appsData.map((app: any) => ({
          ...app,
          votes_count: app.votes?.[0]?.count || 0,
        }));
        setApps(formattedApps);
        
        // Calculate total upvotes
        const total = formattedApps.reduce((sum: number, app: any) => sum + (app.votes_count || 0), 0);
        setTotalUpvotes(total);
      }

      // 3. Fetch followers count
      const { count: fCount, error: fError } = await supabase
        .from('followers')
        .select('*', { count: 'exact', head: true })
        .eq('builder_id', userData.id);
        
      if (!fError && fCount !== null) {
        setFollowersCount(fCount);
      }

    } catch (err: any) {
      console.error('Error fetching profile:', err);
      setError('Profile not found.');
    } finally {
      setLoading(false);
    }
  }

  const handleToggleFollow = async () => {
    if (!currentUser) {
      alert('Please sign in to follow builders.');
      return;
    }
    if (!profile || isTogglingFollow || currentUser.id === profile.id) return;

    setIsTogglingFollow(true);
    try {
      if (isFollowing) {
        // Unfollow
        await supabase
          .from('followers')
          .delete()
          .eq('follower_id', currentUser.id)
          .eq('builder_id', profile.id);
        
        setIsFollowing(false);
        setFollowersCount(prev => Math.max(0, prev - 1));
      } else {
        // Follow
        await supabase
          .from('followers')
          .insert({ follower_id: currentUser.id, builder_id: profile.id });
        
        setIsFollowing(true);
        setFollowersCount(prev => prev + 1);
      }
    } catch (err) {
      console.error('Error toggling follow:', err);
    } finally {
      setIsTogglingFollow(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-12 animate-pulse">
        <div className="flex gap-8">
          <div className="w-32 h-32 bg-zinc-100 rounded-full"></div>
          <div className="flex-1 space-y-4 py-4">
            <div className="h-8 bg-zinc-100 rounded w-1/3"></div>
            <div className="h-4 bg-zinc-100 rounded w-2/3"></div>
            <div className="h-4 bg-zinc-100 rounded w-1/2"></div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="h-48 bg-zinc-100 rounded-2xl"></div>
          <div className="h-48 bg-zinc-100 rounded-2xl"></div>
          <div className="h-48 bg-zinc-100 rounded-2xl"></div>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="max-w-3xl mx-auto text-center py-24">
        <h2 className="text-2xl font-bold text-zinc-900">Profile not found</h2>
        <p className="text-zinc-500 mt-2">The user @{username} doesn't exist.</p>
        <Button asChild className="mt-6 rounded-full">
          <Link to="/">Return Home</Link>
        </Button>
      </div>
    );
  }

  const isOwnProfile = currentUser?.id === profile.id;

  return (
    <div className="max-w-5xl mx-auto space-y-16 pb-24 pt-12">
      {/* Profile Header */}
      <div className="flex flex-col md:flex-row gap-12 items-start bg-white p-10 md:p-12 rounded-[40px] border border-charcoal/5 shadow-2xl shadow-charcoal/5">
        <div className="relative shrink-0">
          <img 
            src={profile.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.username}`} 
            alt={profile.username} 
            className="w-40 h-40 rounded-[32px] object-cover border-4 border-white shadow-2xl bg-charcoal/5"
            referrerPolicy="no-referrer"
          />
          {isOwnProfile && (
            <div className="absolute -top-3 -right-3 bg-cobalt text-offwhite px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest shadow-xl">
              Owner
            </div>
          )}
        </div>
        <div className="space-y-8 flex-1 w-full">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="space-y-1">
              <h1 className="text-5xl font-bold tracking-tighter text-charcoal">{profile.username}</h1>
              <p className="text-xl text-charcoal/40 font-bold uppercase tracking-[0.2em]">@{profile.username}</p>
            </div>
            
            {!isOwnProfile && (
              <Button 
                onClick={handleToggleFollow}
                disabled={isTogglingFollow}
                variant={isFollowing ? "outline" : "default"}
                className={`rounded-2xl h-14 px-10 text-sm font-bold uppercase tracking-widest transition-all ${
                  isFollowing 
                    ? 'border-charcoal/10 text-charcoal hover:bg-red-50 hover:text-red-600 hover:border-red-100' 
                    : 'bg-charcoal text-offwhite hover:bg-charcoal/90 shadow-xl shadow-charcoal/10'
                }`}
              >
                {isFollowing ? 'Following' : 'Follow'}
              </Button>
            )}
          </div>
          
          {profile.bio && (
            <p className="text-xl text-charcoal/60 max-w-2xl leading-relaxed font-medium">{profile.bio}</p>
          )}
          
          <div className="flex flex-wrap gap-8 text-xs font-bold text-charcoal/30 uppercase tracking-widest">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Joined {new Date(profile.created_at).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
            </div>
            {profile.location && (
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                {profile.location}
              </div>
            )}
          </div>
          
          <div className="flex gap-6 pt-2">
            {profile.website_url && (
              <a href={profile.website_url} target="_blank" rel="noopener noreferrer" className="text-charcoal/20 hover:text-cobalt transition-all transform hover:scale-110">
                <Globe className="w-6 h-6" />
              </a>
            )}
            {profile.github_handle && (
              <a href={`https://github.com/${profile.github_handle}`} target="_blank" rel="noopener noreferrer" className="text-charcoal/20 hover:text-charcoal transition-all transform hover:scale-110">
                <Github className="w-6 h-6" />
              </a>
            )}
            {profile.twitter_handle && (
              <a href={`https://twitter.com/${profile.twitter_handle}`} target="_blank" rel="noopener noreferrer" className="text-charcoal/20 hover:text-sky-500 transition-all transform hover:scale-110">
                <Twitter className="w-6 h-6" />
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
        <div className="bg-white p-10 rounded-[32px] border border-charcoal/5 shadow-2xl shadow-charcoal/5 flex flex-col items-center justify-center text-center group hover:border-cobalt/20 transition-all">
          <Layers className="w-8 h-8 text-charcoal/10 mb-4 group-hover:text-cobalt transition-colors" />
          <div className="text-5xl font-bold text-charcoal tracking-tighter">{apps.length}</div>
          <div className="text-xs font-bold text-charcoal/30 mt-2 uppercase tracking-widest">Creations</div>
        </div>
        <div className="bg-white p-10 rounded-[32px] border border-charcoal/5 shadow-2xl shadow-charcoal/5 flex flex-col items-center justify-center text-center group hover:border-cobalt/20 transition-all">
          <ArrowUp className="w-8 h-8 text-charcoal/10 mb-4 group-hover:text-cobalt transition-colors" />
          <div className="text-5xl font-bold text-charcoal tracking-tighter">{totalUpvotes}</div>
          <div className="text-xs font-bold text-charcoal/30 mt-2 uppercase tracking-widest">Upvotes</div>
        </div>
        <div className="bg-white p-10 rounded-[32px] border border-charcoal/5 shadow-2xl shadow-charcoal/5 flex flex-col items-center justify-center text-center group hover:border-cobalt/20 transition-all">
          <Users className="w-8 h-8 text-charcoal/10 mb-4 group-hover:text-cobalt transition-colors" />
          <div className="text-5xl font-bold text-charcoal tracking-tighter">{followersCount}</div>
          <div className="text-xs font-bold text-charcoal/30 mt-2 uppercase tracking-widest">Followers</div>
        </div>
      </div>

      {/* Apps Grid */}
      <div className="space-y-10">
        <div className="flex items-center gap-4">
          <div className="w-2 h-8 bg-cobalt rounded-full" />
          <h2 className="text-3xl font-bold tracking-tight text-charcoal">
            Portfolio
          </h2>
        </div>
        
        {apps.length === 0 ? (
          <div className="text-center py-24 bg-charcoal/[0.02] rounded-[48px] border border-charcoal/5 border-dashed">
            <p className="text-charcoal/30 font-bold uppercase tracking-widest text-sm">No artifacts deployed yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {apps.map((app) => (
              <AppCard 
                key={app.id} 
                app={app} 
                isVoted={false} // Simplified for profile view
                onVote={() => {}} 
                isVoting={false}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
