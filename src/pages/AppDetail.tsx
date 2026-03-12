import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Card, CardContent, CardHeader, CardFooter } from '../components/ui/Card';
import { ArrowUp, ExternalLink, Github, MessageSquare, Clock, Layers, User as UserIcon, Send, Share2, Zap } from 'lucide-react';
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
    <div className="max-w-5xl mx-auto space-y-16 pb-24 pt-12">
      {/* Top Section */}
      <section className="flex flex-col md:flex-row gap-12 items-start justify-between bg-white p-10 md:p-12 rounded-[40px] border border-charcoal/5 shadow-2xl shadow-charcoal/5">
        <div className="flex flex-col sm:flex-row gap-10 items-start flex-1">
          <div className="relative shrink-0">
            <img 
              src={app.logo_url || `https://picsum.photos/seed/${app.id}/200/200`} 
              alt={`${app.name} logo`} 
              className="w-32 h-32 sm:w-40 sm:h-40 rounded-3xl object-cover shadow-xl border border-charcoal/5"
              referrerPolicy="no-referrer"
            />
            <div className="absolute -bottom-4 -right-4 w-12 h-12 bg-cobalt text-offwhite rounded-2xl flex items-center justify-center shadow-2xl">
              <Zap className="w-6 h-6" />
            </div>
          </div>
          <div className="space-y-6 flex-1">
            <div className="space-y-2">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-4xl sm:text-6xl font-bold tracking-tighter text-charcoal">{app.name}</h1>
              </div>
              <p className="text-xl sm:text-2xl text-charcoal/50 font-medium leading-tight">{app.tagline}</p>
            </div>
            
            <div className="flex flex-wrap items-center gap-6 pt-2">
              {app.category && (
                <div className="flex items-center gap-2 px-4 py-2 bg-charcoal/5 rounded-full text-xs font-bold text-charcoal/60 uppercase tracking-widest">
                  <Layers className="w-4 h-4" />
                  {app.category.name}
                </div>
              )}
              <div className="flex items-center gap-3 text-sm font-bold text-charcoal/40 uppercase tracking-widest">
                <UserIcon className="w-4 h-4" />
                Built by{' '}
                {app.builder?.username ? (
                  <Link to={`/profile/${app.builder.username}`} className="text-charcoal hover:text-cobalt transition-colors">
                    @{app.builder.username}
                  </Link>
                ) : (
                  <span className="text-charcoal">@unknown</span>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-row md:flex-col gap-4 w-full md:w-auto shrink-0">
          <Button 
            size="lg" 
            onClick={handleVote}
            disabled={isVoting}
            className={`w-full md:w-44 h-16 flex items-center justify-center gap-3 rounded-2xl border-none transition-all text-xl font-bold ${
              hasVoted 
                ? 'bg-cobalt text-offwhite shadow-xl shadow-cobalt/20' 
                : 'bg-charcoal/5 text-charcoal hover:bg-charcoal/10'
            }`}
          >
            <ArrowUp className={`w-6 h-6 ${isVoting ? 'animate-bounce' : ''}`} />
            <span>{app.votes_count || 0}</span>
          </Button>
          
          <Button asChild size="lg" className="w-full md:w-44 h-16 rounded-2xl bg-charcoal hover:bg-charcoal/90 text-offwhite shadow-xl shadow-charcoal/10 text-lg font-bold">
            <a href={app.website_url} target="_blank" rel="noopener noreferrer">
              Visit App <ExternalLink className="w-5 h-5 ml-2" />
            </a>
          </Button>

          <Button 
            variant="ghost"
            size="lg" 
            className="w-full md:w-44 h-16 rounded-2xl text-charcoal/40 hover:text-charcoal hover:bg-charcoal/5 font-bold"
            onClick={() => {
              const text = `I just discovered ${app.name} on Shipyard 🚀\n\n${app.tagline}\n${window.location.href}`;
              navigator.clipboard.writeText(text);
              alert('Share link copied!');
            }}
          >
            Share <Share2 className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </section>

      {/* Screenshots Gallery */}
      {app.screenshots && app.screenshots.length > 0 && (
        <section className="space-y-8">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-6 bg-charcoal/20 rounded-full" />
            <h2 className="text-2xl font-bold tracking-tight text-charcoal">Visual Showcase</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {app.screenshots.map((url, idx) => (
              <div key={idx} className="aspect-video rounded-[32px] overflow-hidden border border-charcoal/5 shadow-2xl shadow-charcoal/5 bg-charcoal/5">
                <img 
                  src={url} 
                  alt={`${app.name} screenshot ${idx + 1}`} 
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
                  referrerPolicy="no-referrer"
                />
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-16">
        <div className="lg:col-span-2 space-y-16">
          {/* About the App */}
          <section className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-6 bg-cobalt rounded-full" />
              <h2 className="text-2xl font-bold tracking-tight text-charcoal">The Mission</h2>
            </div>
            <div className="prose prose-charcoal max-w-none">
              <p className="text-xl text-charcoal/60 leading-relaxed whitespace-pre-wrap font-medium">
                {app.description}
              </p>
            </div>
          </section>

          {/* Comments Section */}
          <section id="comments" className="space-y-10 pt-16 border-t border-charcoal/5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <MessageSquare className="w-6 h-6 text-charcoal" />
                <h2 className="text-2xl font-bold tracking-tight text-charcoal">Discussion <span className="text-charcoal/30 ml-2">{comments.length}</span></h2>
              </div>
            </div>

            <form onSubmit={handleCommentSubmit} className="space-y-4">
              {replyingTo && (
                <div className="flex items-center justify-between bg-cobalt/5 px-4 py-3 rounded-xl text-sm text-cobalt font-bold">
                  <span>Replying to @{comments.find(c => c.id === replyingTo)?.user?.username}</span>
                  <button type="button" onClick={() => setReplyingTo(null)} className="text-cobalt/50 hover:text-cobalt">
                    Cancel
                  </button>
                </div>
              )}
              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-2xl bg-charcoal/5 border border-charcoal/5 overflow-hidden shrink-0">
                  {currentUser?.user_metadata?.avatar_url ? (
                    <img src={currentUser.user_metadata.avatar_url} alt="You" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-charcoal text-offwhite font-bold text-lg">
                      {currentUser?.email?.[0]?.toUpperCase() || '?'}
                    </div>
                  )}
                </div>
                <div className="flex-1 relative">
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Share your feedback or ask a question..."
                    className="w-full min-h-[120px] rounded-2xl border border-charcoal/10 bg-white px-6 py-4 text-charcoal placeholder:text-charcoal/30 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-cobalt/5 focus:border-cobalt/20 transition-all resize-none font-medium"
                    required
                  />
                  <Button 
                    type="submit" 
                    size="sm" 
                    disabled={submittingComment || !newComment.trim()}
                    className="absolute bottom-4 right-4 rounded-xl bg-charcoal hover:bg-charcoal/90 text-offwhite px-6"
                  >
                    <Send className="w-4 h-4 mr-2" /> Post
                  </Button>
                </div>
              </div>
            </form>

            <div className="space-y-10 mt-12">
              {comments.length === 0 ? (
                <div className="text-center py-20 bg-charcoal/[0.02] rounded-[32px] border border-charcoal/5 border-dashed">
                  <p className="text-charcoal/30 font-bold uppercase tracking-widest text-sm">No comments yet</p>
                </div>
              ) : (
                comments.filter(c => !c.parent_id).map(comment => (
                  <div key={comment.id} className="space-y-6">
                    <div className="flex gap-6">
                      <div className="w-12 h-12 rounded-2xl bg-charcoal/5 border border-charcoal/5 overflow-hidden shrink-0">
                        {comment.user?.avatar ? (
                          <img src={comment.user.avatar} alt={comment.user.username} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-charcoal/10 text-charcoal/40 font-bold text-lg">
                            {comment.user?.username?.[0]?.toUpperCase() || 'U'}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-charcoal">@{comment.user?.username || 'unknown'}</span>
                          <span className="text-xs font-bold text-charcoal/20 uppercase tracking-widest">
                            {new Date(comment.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                          </span>
                        </div>
                        <p className="text-charcoal/60 leading-relaxed font-medium">
                          {comment.content}
                        </p>
                        <button 
                          onClick={() => setReplyingTo(comment.id)}
                          className="text-xs font-bold text-cobalt hover:underline mt-2 uppercase tracking-widest"
                        >
                          Reply
                        </button>
                      </div>
                    </div>
                    
                    {/* Nested Replies */}
                    {comments.filter(c => c.parent_id === comment.id).sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()).map(reply => (
                      <div key={reply.id} className="flex gap-6 ml-16">
                        <div className="w-10 h-10 rounded-xl bg-charcoal/5 border border-charcoal/5 overflow-hidden shrink-0">
                          {reply.user?.avatar ? (
                            <img src={reply.user.avatar} alt={reply.user.username} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-charcoal/10 text-charcoal/40 font-bold text-sm">
                              {reply.user?.username?.[0]?.toUpperCase() || 'U'}
                            </div>
                          )}
                        </div>
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-3">
                            <span className="font-bold text-charcoal">@{reply.user?.username || 'unknown'}</span>
                            <span className="text-xs font-bold text-charcoal/20 uppercase tracking-widest">
                              {new Date(reply.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                            </span>
                          </div>
                          <p className="text-charcoal/60 leading-relaxed font-medium">
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
        <div className="space-y-12">
          {/* Build Story */}
          <div className="bg-white p-10 rounded-[40px] border border-charcoal/5 shadow-2xl shadow-charcoal/5 space-y-10">
            <div className="flex items-center gap-4">
              <div className="w-1.5 h-6 bg-cobalt rounded-full" />
              <h3 className="font-bold text-xl text-charcoal uppercase tracking-widest">Build Story</h3>
            </div>
            
            <div className="space-y-8">
              {app.build_time && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-[10px] font-bold text-charcoal/30 uppercase tracking-widest">
                    <Clock className="w-4 h-4" /> Construction Time
                  </div>
                  <p className="text-charcoal font-bold text-2xl tracking-tight">{app.build_time}</p>
                </div>
              )}

              {app.tech_stack && app.tech_stack.length > 0 && (
                <div className="space-y-4">
                  <div className="text-[10px] font-bold text-charcoal/30 uppercase tracking-widest">Technical Stack</div>
                  <div className="flex flex-wrap gap-2">
                    {app.tech_stack.map(tech => (
                      <span key={tech} className="bg-charcoal text-offwhite text-[10px] font-bold uppercase tracking-widest px-4 py-2 rounded-xl">
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {app.github_url && (
                <div className="pt-8 border-t border-charcoal/5">
                  <a 
                    href={app.github_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center justify-center w-full h-14 rounded-2xl bg-charcoal text-offwhite text-xs font-bold uppercase tracking-[0.2em] shadow-xl shadow-charcoal/10 hover:bg-charcoal/90 transition-all"
                  >
                    <Github className="w-5 h-5 mr-3" /> Source Code
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Similar Apps */}
          {similarApps.length > 0 && (
            <div className="space-y-8">
              <div className="flex items-center gap-4">
                <div className="w-1.5 h-6 bg-cobalt rounded-full" />
                <h3 className="font-bold text-xl text-charcoal uppercase tracking-widest">Similar Artifacts</h3>
              </div>
              <div className="space-y-4">
                {similarApps.map(similar => (
                  <Link 
                    key={similar.id} 
                    to={`/app/${similar.id}`}
                    className="flex items-center gap-5 p-5 rounded-[32px] bg-white border border-charcoal/5 hover:border-cobalt/20 hover:shadow-2xl hover:shadow-cobalt/5 transition-all group"
                  >
                    <div className="w-16 h-16 rounded-2xl overflow-hidden border border-charcoal/5 bg-charcoal/[0.02] shrink-0">
                      <img 
                        src={similar.logo_url || `https://picsum.photos/seed/${similar.id}/100/100`} 
                        alt={similar.name} 
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-charcoal text-base truncate group-hover:text-cobalt transition-colors">{similar.name}</h4>
                      <p className="text-xs text-charcoal/40 font-medium truncate mt-0.5">{similar.tagline}</p>
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-cobalt bg-cobalt/5 px-3 py-2 rounded-xl">
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
