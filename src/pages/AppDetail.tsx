import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Card, CardContent, CardHeader, CardFooter } from '../components/ui/Card';
import { ArrowUp, ExternalLink, Github, MessageSquare, Clock, Layers, User as UserIcon, Send, Share2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { App, Comment, User } from '../types';

export function AppDetail() {
  const { id } = useParams();
  
  const [app, setApp] = useState<App | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [comments, setComments] = useState<(Comment & { user: User })[]>([]);
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  
  const [similarApps, setSimilarApps] = useState<App[]>([]);
  
  const [hasVoted, setHasVoted] = useState(false);
  const [isVoting, setIsVoting] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    fetchAppData();
    checkUser();
  }, [id]);

  async function checkUser() {
    const { data: { user } } = await supabase.auth.getUser();
    setCurrentUser(user);
    if (user && id) {
      checkVoteStatus(user.id, id);
    }
  }

  async function checkVoteStatus(userId: string, appId: string) {
    const { data } = await supabase
      .from('votes')
      .select('id')
      .eq('user_id', userId)
      .eq('app_id', appId)
      .single();
    
    if (data) setHasVoted(true);
  }

  async function fetchAppData() {
    if (!id) return;
    setLoading(true);
    setError(null);

    try {
      // Fetch app details
      const { data: appData, error: appError } = await supabase
        .from('apps')
        .select(`
          *,
          builder:users(*),
          category:categories(*),
          votes(count)
        `)
        .eq('id', id)
        .single();

      if (appError) throw appError;

      if (appData) {
        const formattedApp = {
          ...appData,
          votes_count: appData.votes?.[0]?.count || 0,
        };
        setApp(formattedApp);

        // Fetch comments
        fetchComments(id);

        // Fetch similar apps
        if (appData.category_id) {
          fetchSimilarApps(appData.category_id, id);
        }
      }
    } catch (err: any) {
      console.error('Error fetching app:', err);
      setError('App not found or an error occurred.');
    } finally {
      setLoading(false);
    }
  }

  async function fetchComments(appId: string) {
    const { data, error } = await supabase
      .from('comments')
      .select(`
        *,
        user:users(*)
      `)
      .eq('app_id', appId)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setComments(data as any);
    }
  }

  async function fetchSimilarApps(categoryId: string, currentAppId: string) {
    const { data, error } = await supabase
      .from('apps')
      .select(`
        *,
        category:categories(name, slug),
        votes(count)
      `)
      .eq('category_id', categoryId)
      .neq('id', currentAppId)
      .limit(3);

    if (!error && data) {
      const formatted = data.map((a: any) => ({
        ...a,
        votes_count: a.votes?.[0]?.count || 0,
      }));
      setSimilarApps(formatted);
    }
  }

  const handleVote = async () => {
    if (!currentUser) {
      alert('Please sign in to upvote apps.');
      return;
    }
    if (!app || isVoting) return;

    setIsVoting(true);
    try {
      if (hasVoted) {
        // Remove vote
        await supabase
          .from('votes')
          .delete()
          .eq('user_id', currentUser.id)
          .eq('app_id', app.id);
        
        setHasVoted(false);
        setApp(prev => prev ? { ...prev, votes_count: (prev.votes_count || 1) - 1 } : null);
      } else {
        // Add vote
        await supabase
          .from('votes')
          .insert({ user_id: currentUser.id, app_id: app.id });
        
        setHasVoted(true);
        setApp(prev => prev ? { ...prev, votes_count: (prev.votes_count || 0) + 1 } : null);
      }
    } catch (err) {
      console.error('Error voting:', err);
    } finally {
      setIsVoting(false);
    }
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      alert('Please sign in to comment.');
      return;
    }
    if (!newComment.trim() || !app) return;

    setSubmittingComment(true);
    try {
      const { data, error } = await supabase
        .from('comments')
        .insert({
          app_id: app.id,
          user_id: currentUser.id,
          parent_id: replyingTo,
          content: newComment.trim()
        })
        .select(`
          *,
          user:users(*)
        `)
        .single();

      if (error) throw error;
      
      if (data) {
        setComments(prev => [data as any, ...prev]);
        setNewComment('');
        setReplyingTo(null);
      }
    } catch (err) {
      console.error('Error posting comment:', err);
      alert('Failed to post comment.');
    } finally {
      setSubmittingComment(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto space-y-8 animate-pulse">
        <div className="h-32 bg-zinc-100 rounded-2xl"></div>
        <div className="h-96 bg-zinc-100 rounded-2xl"></div>
      </div>
    );
  }

  if (error || !app) {
    return (
      <div className="max-w-3xl mx-auto text-center py-24">
        <h2 className="text-2xl font-bold text-zinc-900">App not found</h2>
        <p className="text-zinc-500 mt-2">{error || "The app you're looking for doesn't exist."}</p>
        <Button asChild className="mt-6 rounded-full">
          <Link to="/">Return Home</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-12 pb-24">
      {/* Top Section */}
      <section className="flex flex-col md:flex-row gap-8 items-start justify-between bg-white p-6 md:p-8 rounded-3xl border border-zinc-100 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-6 items-start flex-1">
          <img 
            src={app.logo_url || `https://picsum.photos/seed/${app.id}/200/200`} 
            alt={`${app.name} logo`} 
            className="w-24 h-24 sm:w-32 sm:h-32 rounded-2xl object-cover shadow-md border border-zinc-100"
            referrerPolicy="no-referrer"
          />
          <div className="space-y-3 flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-zinc-900">{app.name}</h1>
              <Badge variant="secondary" className="bg-blue-50 text-blue-600 border border-blue-100">
                Launched on Shipyard
              </Badge>
            </div>
            <p className="text-lg sm:text-xl text-zinc-500 font-medium">{app.tagline}</p>
            
            <div className="flex flex-wrap items-center gap-4 pt-2">
              {app.category && (
                <Badge variant="secondary" className="bg-zinc-100 text-zinc-600 px-3 py-1 text-sm rounded-full">
                  <Layers className="w-3.5 h-3.5 mr-1.5 inline-block" />
                  {app.category.name}
                </Badge>
              )}
              <div className="flex items-center gap-2 text-sm text-zinc-500">
                <UserIcon className="w-4 h-4" />
                Built by{' '}
                {app.builder?.username ? (
                  <Link to={`/profile/${app.builder.username}`} className="font-semibold text-zinc-900 hover:underline">
                    @{app.builder.username}
                  </Link>
                ) : (
                  <span className="font-semibold text-zinc-900">@unknown</span>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-row md:flex-col gap-3 w-full md:w-auto shrink-0">
          <Button 
            size="lg" 
            onClick={handleVote}
            disabled={isVoting}
            className={`w-full md:w-40 h-14 flex items-center justify-center gap-2 rounded-xl border-2 transition-all ${
              hasVoted 
                ? 'bg-zinc-900 text-white border-zinc-900 hover:bg-zinc-800' 
                : 'bg-white text-zinc-900 border-zinc-200 hover:border-zinc-900 hover:bg-zinc-50'
            }`}
          >
            <ArrowUp className={`w-5 h-5 ${hasVoted ? 'text-white' : 'text-zinc-500'}`} />
            <span className="font-bold text-lg">{app.votes_count || 0}</span>
          </Button>
          
          <Button asChild size="lg" className="w-full md:w-40 h-14 rounded-xl shadow-sm">
            <a href={app.website_url} target="_blank" rel="noopener noreferrer">
              Visit App <ExternalLink className="w-4 h-4 ml-2" />
            </a>
          </Button>

          <Button 
            variant="outline"
            size="lg" 
            className="w-full md:w-40 h-14 rounded-xl shadow-sm"
            onClick={() => {
              const text = `I just launched on Shipyard 🚀\n\nCheck out ${app.name}: ${app.tagline}\n${window.location.href}`;
              navigator.clipboard.writeText(text);
              alert('Share text copied to clipboard!');
            }}
          >
            Share <Share2 className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </section>

      {/* Screenshots Gallery */}
      {app.screenshots && app.screenshots.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-zinc-900">Gallery</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {app.screenshots.map((url, idx) => (
              <div key={idx} className="aspect-video rounded-2xl overflow-hidden border border-zinc-200 shadow-sm bg-zinc-100">
                <img 
                  src={url} 
                  alt={`${app.name} screenshot ${idx + 1}`} 
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                  referrerPolicy="no-referrer"
                />
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-12">
          {/* About the App */}
          <section className="space-y-4">
            <h2 className="text-xl font-bold text-zinc-900">About the app</h2>
            <div className="prose prose-zinc max-w-none">
              <p className="text-zinc-700 leading-relaxed whitespace-pre-wrap">
                {app.description}
              </p>
            </div>
          </section>

          {/* Comments Section */}
          <section id="comments" className="space-y-6 pt-8 border-t border-zinc-100">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-zinc-900" />
              <h2 className="text-xl font-bold text-zinc-900">Discussion ({comments.length})</h2>
            </div>

            <form onSubmit={handleCommentSubmit} className="flex flex-col gap-3">
              {replyingTo && (
                <div className="flex items-center justify-between bg-zinc-100 px-3 py-2 rounded-lg text-sm text-zinc-600">
                  <span>Replying to <span className="font-semibold">@{comments.find(c => c.id === replyingTo)?.user?.username}</span></span>
                  <button type="button" onClick={() => setReplyingTo(null)} className="text-zinc-400 hover:text-zinc-900">
                    Cancel
                  </button>
                </div>
              )}
              <div className="flex gap-3">
                <div className="w-10 h-10 rounded-full bg-zinc-100 border border-zinc-200 overflow-hidden shrink-0">
                  {currentUser?.user_metadata?.avatar_url ? (
                    <img src={currentUser.user_metadata.avatar_url} alt="You" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-zinc-800 text-white font-bold text-sm">
                      {currentUser?.email?.[0]?.toUpperCase() || '?'}
                    </div>
                  )}
                </div>
                <div className="flex-1 relative">
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="What do you think about this app?"
                    className="w-full min-h-[80px] rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 resize-none"
                    required
                  />
                  <Button 
                    type="submit" 
                    size="sm" 
                    disabled={submittingComment || !newComment.trim()}
                    className="absolute bottom-3 right-3 rounded-lg"
                  >
                    <Send className="w-4 h-4 mr-2" /> Post
                  </Button>
                </div>
              </div>
            </form>

            <div className="space-y-6 mt-8">
              {comments.length === 0 ? (
                <div className="text-center py-12 bg-zinc-50 rounded-2xl border border-zinc-100 border-dashed">
                  <p className="text-zinc-500">No comments yet. Be the first to share your thoughts!</p>
                </div>
              ) : (
                comments.filter(c => !c.parent_id).map(comment => (
                  <div key={comment.id} className="space-y-4">
                    <div className="flex gap-4">
                      <div className="w-10 h-10 rounded-full bg-zinc-100 border border-zinc-200 overflow-hidden shrink-0">
                        {comment.user?.avatar ? (
                          <img src={comment.user.avatar} alt={comment.user.username} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-zinc-200 text-zinc-600 font-bold text-sm">
                            {comment.user?.username?.[0]?.toUpperCase() || 'U'}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-zinc-900">@{comment.user?.username || 'unknown'}</span>
                          <span className="text-xs text-zinc-400">
                            {new Date(comment.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                        </div>
                        <p className="text-zinc-700 text-sm leading-relaxed whitespace-pre-wrap">
                          {comment.content}
                        </p>
                        <button 
                          onClick={() => setReplyingTo(comment.id)}
                          className="text-xs font-medium text-zinc-500 hover:text-zinc-900 mt-1"
                        >
                          Reply
                        </button>
                      </div>
                    </div>
                    
                    {/* Nested Replies */}
                    {comments.filter(c => c.parent_id === comment.id).sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()).map(reply => (
                      <div key={reply.id} className="flex gap-4 ml-14">
                        <div className="w-8 h-8 rounded-full bg-zinc-100 border border-zinc-200 overflow-hidden shrink-0">
                          {reply.user?.avatar ? (
                            <img src={reply.user.avatar} alt={reply.user.username} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-zinc-200 text-zinc-600 font-bold text-xs">
                              {reply.user?.username?.[0]?.toUpperCase() || 'U'}
                            </div>
                          )}
                        </div>
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-zinc-900">@{reply.user?.username || 'unknown'}</span>
                            <span className="text-xs text-zinc-400">
                              {new Date(reply.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                            </span>
                          </div>
                          <p className="text-zinc-700 text-sm leading-relaxed whitespace-pre-wrap">
                            {reply.content}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ))
              )}
            </div>
          </section>
        </div>

        {/* Sidebar */}
        <div className="space-y-8">
          {/* Build Story */}
          <Card className="bg-zinc-50/50 border-zinc-100 shadow-none">
            <CardHeader>
              <h3 className="font-bold text-lg text-zinc-900">Build Story</h3>
            </CardHeader>
            <CardContent className="space-y-6">
              {app.build_time && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-zinc-500">
                    <Clock className="w-4 h-4" /> Build Time
                  </div>
                  <p className="text-zinc-900 font-medium">{app.build_time}</p>
                </div>
              )}

              {app.tech_stack && app.tech_stack.length > 0 && (
                <div className="space-y-3">
                  <div className="text-sm font-medium text-zinc-500">Tech Stack</div>
                  <div className="flex flex-wrap gap-2">
                    {app.tech_stack.map(tech => (
                      <Badge key={tech} variant="outline" className="bg-white border-zinc-200 text-zinc-700">
                        {tech}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {app.github_url && (
                <div className="pt-4 border-t border-zinc-200">
                  <Button asChild variant="outline" className="w-full rounded-xl bg-white">
                    <a href={app.github_url} target="_blank" rel="noopener noreferrer">
                      <Github className="w-4 h-4 mr-2" /> Source Code
                    </a>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Similar Apps */}
          {similarApps.length > 0 && (
            <div className="space-y-4">
              <h3 className="font-bold text-lg text-zinc-900">Similar Apps</h3>
              <div className="space-y-3">
                {similarApps.map(similar => (
                  <Link 
                    key={similar.id} 
                    to={`/app/${similar.id}`}
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-zinc-50 border border-transparent hover:border-zinc-100 transition-colors group"
                  >
                    <img 
                      src={similar.logo_url || `https://picsum.photos/seed/${similar.id}/100/100`} 
                      alt={similar.name} 
                      className="w-12 h-12 rounded-lg object-cover border border-zinc-100 group-hover:scale-105 transition-transform"
                      referrerPolicy="no-referrer"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-zinc-900 text-sm truncate">{similar.name}</h4>
                      <p className="text-xs text-zinc-500 truncate">{similar.tagline}</p>
                    </div>
                    <div className="flex items-center gap-1 text-xs font-medium text-zinc-500 bg-zinc-100 px-2 py-1 rounded-md">
                      <ArrowUp className="w-3 h-3" /> {similar.votes_count || 0}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
