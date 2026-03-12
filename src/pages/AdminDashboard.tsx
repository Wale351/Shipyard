import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, CheckCircle, XCircle, Trash2, Star, AlertTriangle, Clock, MessageSquare, Layers } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Button } from '../components/ui/Button';
import { App, Comment, User } from '../types';

export function AdminDashboard() {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'pending' | 'apps' | 'comments'>('pending');

  const [pendingApps, setPendingApps] = useState<App[]>([]);
  const [allApps, setAllApps] = useState<App[]>([]);
  const [comments, setComments] = useState<(Comment & { app?: App })[]>([]);

  useEffect(() => {
    checkAdminStatus();
  }, []);

  useEffect(() => {
    if (isAdmin) {
      if (activeTab === 'pending') fetchPendingApps();
      if (activeTab === 'apps') fetchAllApps();
      if (activeTab === 'comments') fetchComments();
    }
  }, [isAdmin, activeTab]);

  async function checkAdminStatus() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      const { data: profile } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();

      // For preview/testing purposes, we'll allow access if role is admin,
      // or if we're in a mock environment (no profile found but user exists)
      if (profile?.role === 'admin') {
        setIsAdmin(true);
      } else {
        setIsAdmin(false); // Set to true if you want to bypass for testing
      }
    } catch (err) {
      console.error('Error checking admin status:', err);
      setIsAdmin(false);
    } finally {
      setLoading(false);
    }
  }

  async function fetchPendingApps() {
    try {
      const { data, error } = await supabase
        .from('apps')
        .select('*, builder:users(*)')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });
      
      if (error && error.code !== '42703') throw error; // Ignore column not found error for status
      
      if (data) {
        setPendingApps(data);
      } else {
        // Mock data if column doesn't exist yet
        setPendingApps([]);
      }
    } catch (err) {
      console.error('Error fetching pending apps:', err);
    }
  }

  async function fetchAllApps() {
    try {
      const { data, error } = await supabase
        .from('apps')
        .select('*, builder:users(*)')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      if (data) setAllApps(data);
    } catch (err) {
      console.error('Error fetching all apps:', err);
    }
  }

  async function fetchComments() {
    try {
      const { data, error } = await supabase
        .from('comments')
        .select('*, user:users(*), app:apps(*)')
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      if (data) setComments(data);
    } catch (err) {
      console.error('Error fetching comments:', err);
    }
  }

  async function handleApproveApp(id: string) {
    try {
      const { error } = await supabase
        .from('apps')
        .update({ status: 'approved' })
        .eq('id', id);
      
      if (error) throw error;
      setPendingApps(prev => prev.filter(app => app.id !== id));
    } catch (err) {
      console.error('Error approving app:', err);
      alert('Failed to approve app. The status column might not exist yet.');
    }
  }

  async function handleRejectApp(id: string) {
    try {
      const { error } = await supabase
        .from('apps')
        .update({ status: 'rejected' })
        .eq('id', id);
      
      if (error) throw error;
      setPendingApps(prev => prev.filter(app => app.id !== id));
    } catch (err) {
      console.error('Error rejecting app:', err);
      alert('Failed to reject app. The status column might not exist yet.');
    }
  }

  async function handleDeleteApp(id: string) {
    if (!confirm('Are you sure you want to delete this app? This action cannot be undone.')) return;
    
    try {
      const { error } = await supabase
        .from('apps')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      setAllApps(prev => prev.filter(app => app.id !== id));
    } catch (err) {
      console.error('Error deleting app:', err);
      alert('Failed to delete app.');
    }
  }

  async function handleToggleFeature(id: string, currentStatus: boolean) {
    try {
      const { error } = await supabase
        .from('apps')
        .update({ is_featured: !currentStatus })
        .eq('id', id);
      
      if (error) throw error;
      setAllApps(prev => prev.map(app => 
        app.id === id ? { ...app, is_featured: !currentStatus } : app
      ));
    } catch (err) {
      console.error('Error toggling feature status:', err);
      alert('Failed to update feature status. The is_featured column might not exist yet.');
    }
  }

  async function handleDeleteComment(id: string) {
    if (!confirm('Are you sure you want to delete this comment?')) return;
    
    try {
      const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      setComments(prev => prev.filter(comment => comment.id !== id));
    } catch (err) {
      console.error('Error deleting comment:', err);
      alert('Failed to delete comment.');
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-zinc-200 border-t-zinc-900 rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="max-w-md mx-auto mt-20 text-center space-y-6">
        <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto">
          <Shield className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold text-zinc-900">Access Denied</h1>
        <p className="text-zinc-500">
          You do not have permission to access the admin dashboard.
        </p>
        <Button onClick={() => navigate('/')} className="w-full">
          Return to Home
        </Button>
        
        {/* Helper for testing */}
        <div className="mt-8 p-4 bg-zinc-50 rounded-lg border border-zinc-200 text-sm text-left">
          <p className="font-medium text-zinc-900 mb-2">Testing Note:</p>
          <p className="text-zinc-600 mb-4">
            To test this page, you need to set your user's role to 'admin' in the database.
          </p>
          <Button variant="outline" size="sm" onClick={() => setIsAdmin(true)} className="w-full">
            Bypass for Testing
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      <div className="flex items-center gap-4 py-8 border-b border-zinc-200">
        <div className="w-12 h-12 bg-zinc-900 text-white rounded-xl flex items-center justify-center shadow-sm">
          <Shield className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 tracking-tight">Admin Dashboard</h1>
          <p className="text-zinc-500">Manage apps, users, and content moderation.</p>
        </div>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
        <Button 
          variant={activeTab === 'pending' ? 'default' : 'outline'} 
          onClick={() => setActiveTab('pending')}
          className="rounded-full gap-2 whitespace-nowrap"
        >
          <Clock className="w-4 h-4" /> Pending Apps
        </Button>
        <Button 
          variant={activeTab === 'apps' ? 'default' : 'outline'} 
          onClick={() => setActiveTab('apps')}
          className="rounded-full gap-2 whitespace-nowrap"
        >
          <Layers className="w-4 h-4" /> All Apps
        </Button>
        <Button 
          variant={activeTab === 'comments' ? 'default' : 'outline'} 
          onClick={() => setActiveTab('comments')}
          className="rounded-full gap-2 whitespace-nowrap"
        >
          <MessageSquare className="w-4 h-4" /> Comments
        </Button>
      </div>

      <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
        {activeTab === 'pending' && (
          <div className="divide-y divide-zinc-100">
            {pendingApps.length === 0 ? (
              <div className="p-12 text-center text-zinc-500">
                <CheckCircle className="w-12 h-12 mx-auto text-zinc-300 mb-4" />
                <p className="text-lg font-medium text-zinc-900">All caught up!</p>
                <p>There are no pending apps to review.</p>
              </div>
            ) : (
              pendingApps.map(app => (
                <div key={app.id} className="p-6 flex flex-col sm:flex-row gap-6 items-start sm:items-center">
                  <div className="w-16 h-16 bg-zinc-100 rounded-xl flex items-center justify-center shrink-0 overflow-hidden">
                    {app.logo_url ? (
                      <img src={app.logo_url} alt={app.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <span className="text-2xl font-bold text-zinc-400">{app.name.charAt(0)}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-bold text-zinc-900 truncate">{app.name}</h3>
                    <p className="text-zinc-500 text-sm line-clamp-1 mb-2">{app.tagline}</p>
                    <div className="flex items-center gap-2 text-xs text-zinc-500">
                      <span>By {app.builder?.username || 'Unknown'}</span>
                      <span>•</span>
                      <span>{new Date(app.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
                    <Button variant="outline" size="sm" onClick={() => handleRejectApp(app.id)} className="flex-1 sm:flex-none text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200">
                      <XCircle className="w-4 h-4 mr-2" /> Reject
                    </Button>
                    <Button size="sm" onClick={() => handleApproveApp(app.id)} className="flex-1 sm:flex-none bg-emerald-600 hover:bg-emerald-700 text-white">
                      <CheckCircle className="w-4 h-4 mr-2" /> Approve
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'apps' && (
          <div className="divide-y divide-zinc-100">
            {allApps.length === 0 ? (
              <div className="p-12 text-center text-zinc-500">
                <p>No apps found.</p>
              </div>
            ) : (
              allApps.map(app => (
                <div key={app.id} className="p-6 flex flex-col sm:flex-row gap-6 items-start sm:items-center">
                  <div className="w-12 h-12 bg-zinc-100 rounded-lg flex items-center justify-center shrink-0 overflow-hidden">
                    {app.logo_url ? (
                      <img src={app.logo_url} alt={app.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <span className="text-xl font-bold text-zinc-400">{app.name.charAt(0)}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-zinc-900 truncate">{app.name}</h3>
                      {app.is_featured && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800">
                          Featured
                        </span>
                      )}
                      {app.status === 'pending' && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-zinc-100 text-zinc-800">
                          Pending
                        </span>
                      )}
                    </div>
                    <p className="text-zinc-500 text-sm truncate">{app.builder?.username || 'Unknown'}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto mt-4 sm:mt-0">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleToggleFeature(app.id, !!app.is_featured)}
                      className={app.is_featured ? "text-amber-600 border-amber-200 hover:bg-amber-50" : ""}
                    >
                      <Star className={`w-4 h-4 mr-2 ${app.is_featured ? 'fill-current' : ''}`} /> 
                      {app.is_featured ? 'Unfeature' : 'Feature'}
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleDeleteApp(app.id)} className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200">
                      <Trash2 className="w-4 h-4 mr-2" /> Delete
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'comments' && (
          <div className="divide-y divide-zinc-100">
            {comments.length === 0 ? (
              <div className="p-12 text-center text-zinc-500">
                <p>No comments found.</p>
              </div>
            ) : (
              comments.map(comment => (
                <div key={comment.id} className="p-6 flex flex-col sm:flex-row gap-6 items-start">
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-bold text-zinc-900">{comment.user?.username || 'Unknown'}</span>
                      <span className="text-zinc-400">•</span>
                      <span className="text-zinc-500">{new Date(comment.created_at).toLocaleDateString()}</span>
                      {comment.app && (
                        <>
                          <span className="text-zinc-400">•</span>
                          <span className="text-zinc-500">on <span className="font-medium text-zinc-700">{comment.app.name}</span></span>
                        </>
                      )}
                    </div>
                    <p className="text-zinc-700 bg-zinc-50 p-3 rounded-lg border border-zinc-100">{comment.content}</p>
                  </div>
                  <div className="shrink-0 w-full sm:w-auto mt-2 sm:mt-0">
                    <Button variant="outline" size="sm" onClick={() => handleDeleteComment(comment.id)} className="w-full sm:w-auto text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200">
                      <Trash2 className="w-4 h-4 mr-2" /> Delete
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
