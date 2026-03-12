import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Github, Twitter, Globe, MapPin, Calendar, ArrowUp, Users, Layers } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { App, User } from '../types';

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
    <div className="max-w-5xl mx-auto space-y-12 pb-24">
      {/* Profile Header */}
      <div className="flex flex-col md:flex-row gap-8 items-start bg-white p-8 rounded-3xl border border-zinc-100 shadow-sm">
        <img 
          src={profile.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.username}`} 
          alt={profile.username} 
          className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-md bg-zinc-50 shrink-0"
          referrerPolicy="no-referrer"
        />
        <div className="space-y-5 flex-1 w-full">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-zinc-900">{profile.username}</h1>
              <p className="text-lg text-zinc-500 font-medium">@{profile.username}</p>
            </div>
            
            {!isOwnProfile && (
              <Button 
                onClick={handleToggleFollow}
                disabled={isTogglingFollow}
                variant={isFollowing ? "outline" : "default"}
                className={`rounded-full px-8 ${isFollowing ? 'hover:bg-red-50 hover:text-red-600 hover:border-red-200' : ''}`}
              >
                {isFollowing ? 'Following' : 'Follow'}
              </Button>
            )}
            {isOwnProfile && (
              <Badge variant="secondary" className="px-3 py-1 rounded-full bg-zinc-100 text-zinc-600">
                This is you
              </Badge>
            )}
          </div>
          
          {profile.bio && (
            <p className="text-zinc-700 max-w-2xl leading-relaxed">{profile.bio}</p>
          )}
          
          <div className="flex flex-wrap gap-4 text-sm text-zinc-500 font-medium">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4" />
              Joined {new Date(profile.created_at).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
            </div>
          </div>
          
          <div className="flex gap-4 pt-2">
            {profile.website_url && (
              <a href={profile.website_url} target="_blank" rel="noopener noreferrer" className="text-zinc-400 hover:text-zinc-900 transition-colors">
                <Globe className="w-5 h-5" />
              </a>
            )}
            {profile.github_handle && (
              <a href={`https://github.com/${profile.github_handle}`} target="_blank" rel="noopener noreferrer" className="text-zinc-400 hover:text-zinc-900 transition-colors">
                <Github className="w-5 h-5" />
              </a>
            )}
            {profile.twitter_handle && (
              <a href={`https://twitter.com/${profile.twitter_handle}`} target="_blank" rel="noopener noreferrer" className="text-zinc-400 hover:text-zinc-900 transition-colors">
                <Twitter className="w-5 h-5" />
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-4 md:gap-8">
        <div className="bg-white p-6 rounded-2xl border border-zinc-100 shadow-sm flex flex-col items-center justify-center text-center">
          <Layers className="w-6 h-6 text-zinc-400 mb-2" />
          <div className="text-3xl font-bold text-zinc-900">{apps.length}</div>
          <div className="text-sm font-medium text-zinc-500 mt-1">Apps Built</div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-zinc-100 shadow-sm flex flex-col items-center justify-center text-center">
          <ArrowUp className="w-6 h-6 text-zinc-400 mb-2" />
          <div className="text-3xl font-bold text-zinc-900">{totalUpvotes}</div>
          <div className="text-sm font-medium text-zinc-500 mt-1">Total Upvotes</div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-zinc-100 shadow-sm flex flex-col items-center justify-center text-center">
          <Users className="w-6 h-6 text-zinc-400 mb-2" />
          <div className="text-3xl font-bold text-zinc-900">{followersCount}</div>
          <div className="text-sm font-medium text-zinc-500 mt-1">Followers</div>
        </div>
      </div>

      {/* Apps Grid */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold tracking-tight text-zinc-900 flex items-center gap-2">
          Apps by {profile.username}
        </h2>
        
        {apps.length === 0 ? (
          <div className="text-center py-16 bg-zinc-50 rounded-3xl border border-zinc-100 border-dashed">
            <p className="text-zinc-500 text-lg">No apps built yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {apps.map((app) => (
              <Link key={app.id} to={`/app/${app.id}`} className="group flex flex-col h-full bg-white rounded-2xl border border-zinc-100 shadow-sm hover:shadow-md hover:border-zinc-300 transition-all overflow-hidden">
                <div className="aspect-video w-full overflow-hidden bg-zinc-100 relative">
                  <img 
                    src={app.logo_url || `https://picsum.photos/seed/${app.id}/400/300`} 
                    alt={app.name} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-md flex items-center gap-1 text-xs font-bold text-zinc-900 shadow-sm">
                    <ArrowUp className="w-3 h-3" /> {app.votes_count || 0}
                  </div>
                </div>
                <div className="p-5 flex flex-col flex-1">
                  <h3 className="text-lg font-bold text-zinc-900 mb-1">{app.name}</h3>
                  <p className="text-sm text-zinc-500 line-clamp-2 mb-4 flex-1">
                    {app.tagline || app.description}
                  </p>
                  <div className="flex flex-wrap gap-2 mt-auto pt-4 border-t border-zinc-50">
                    {app.category && (
                      <Badge variant="secondary" className="bg-zinc-100 text-zinc-600 hover:bg-zinc-200">
                        {app.category.name}
                      </Badge>
                    )}
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
