import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '../components/ui/Card';
import { Github, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

export function Auth() {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: email.split('@')[0],
              username: email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, ''),
            }
          }
        });
        if (error) throw error;
        alert('Check your email for the confirmation link!');
      }
      navigate('/');
    } catch (err: any) {
      console.error('Auth error:', err);
      setError(err.message || 'An error occurred during authentication');
    } finally {
      setLoading(false);
    }
  };

  const handleOAuth = async (provider: 'github' | 'google') => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: window.location.origin,
        }
      });
      if (error) throw error;
    } catch (err: any) {
      console.error('OAuth error:', err);
      setError(err.message || `Failed to sign in with ${provider}`);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-6">
      <div className="w-full max-w-lg bg-white p-12 rounded-[48px] border border-charcoal/5 shadow-2xl shadow-charcoal/5">
        <div className="space-y-2 text-center mb-12">
          <h1 className="text-4xl font-bold tracking-tight text-charcoal">
            {isLogin ? 'Welcome Back' : 'Join the Vanguard'}
          </h1>
          <p className="text-charcoal/40 font-medium">
            {isLogin 
              ? 'Access your shipyard and continue building.' 
              : 'Connect with the world\'s most innovative builders.'}
          </p>
        </div>

        <div className="space-y-8">
          <div className="grid grid-cols-2 gap-4">
            <button 
              className="flex items-center justify-center h-14 rounded-2xl border border-charcoal/10 hover:bg-charcoal/5 text-charcoal font-bold uppercase tracking-widest text-xs transition-all"
              onClick={() => handleOAuth('github')}
            >
              <Github className="mr-3 h-5 w-5" />
              Github
            </button>
            <button 
              className="flex items-center justify-center h-14 rounded-2xl border border-charcoal/10 hover:bg-charcoal/5 text-charcoal font-bold uppercase tracking-widest text-xs transition-all"
              onClick={() => handleOAuth('google')}
            >
              <svg className="mr-3 h-5 w-5" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              Google
            </button>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-charcoal/5" />
            </div>
            <div className="relative flex justify-center text-[10px] font-bold uppercase tracking-[0.2em]">
              <span className="bg-white px-4 text-charcoal/30">Or use credentials</span>
            </div>
          </div>
          
          {error && (
            <div className="p-4 rounded-2xl bg-terracotta/10 border border-terracotta/20 text-terracotta text-xs font-bold uppercase tracking-widest">
              {error}
            </div>
          )}

          <form onSubmit={handleAuth} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="email" className="text-[10px] font-bold uppercase tracking-widest text-charcoal/40 px-1">Email Address</label>
              <input 
                id="email" 
                type="email" 
                placeholder="architect@shipyard.com" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full h-14 px-6 rounded-2xl bg-charcoal/5 border-transparent focus:bg-white focus:border-charcoal/10 focus:ring-4 focus:ring-cobalt/5 outline-none transition-all text-charcoal font-bold"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="password" className="text-[10px] font-bold uppercase tracking-widest text-charcoal/40 px-1">Secure Password</label>
              <input 
                id="password" 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full h-14 px-6 rounded-2xl bg-charcoal/5 border-transparent focus:bg-white focus:border-charcoal/10 focus:ring-4 focus:ring-cobalt/5 outline-none transition-all text-charcoal font-bold"
              />
            </div>
            <button 
              type="submit" 
              className="w-full h-14 bg-charcoal hover:bg-charcoal/90 text-offwhite rounded-2xl font-bold uppercase tracking-[0.2em] text-xs shadow-xl shadow-charcoal/10 transition-all disabled:opacity-50"
              disabled={loading}
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : (isLogin ? 'Sign In' : 'Create Account')}
            </button>
          </form>

          <div className="text-center text-xs font-bold uppercase tracking-widest text-charcoal/30">
            {isLogin ? "New to the yard? " : "Already a member? "}
            <button 
              onClick={() => setIsLogin(!isLogin)} 
              className="text-cobalt hover:underline underline-offset-4"
            >
              {isLogin ? 'Sign up' : 'Sign in'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
