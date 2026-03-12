import { Link } from 'react-router-dom';
import { ArrowUp, MessageSquare, ExternalLink, Layers } from 'lucide-react';
import { Card, CardFooter } from './Card';
import { Badge } from './Badge';
import { Button } from './Button';
import { App } from '../../types';

interface AppCardProps {
  app: App;
  isVoted: boolean;
  onVote: (e: React.MouseEvent) => void;
  isVoting: boolean;
  featured?: boolean;
}

export function AppCard({ app, isVoted, onVote, isVoting, featured }: AppCardProps) {
  return (
    <Card 
      className={`group flex flex-col h-full transition-all duration-500 hover:-translate-y-2 overflow-hidden border-charcoal/5 rounded-[40px] ${
        featured 
          ? 'bg-white shadow-2xl shadow-ocean-mid/5 border-ocean-mid/10' 
          : 'bg-white/50 backdrop-blur-sm hover:bg-white hover:shadow-xl hover:shadow-charcoal/5'
      }`}
    >
      <Link to={`/app/${app.id}`} className="flex-1 p-8 space-y-6">
        <div className="flex items-start gap-6">
          <div className="relative shrink-0">
            <img 
              src={app.logo_url || `https://picsum.photos/seed/${app.id}/150/150`} 
              alt={`${app.name} logo`} 
              className="w-20 h-20 rounded-3xl object-cover border border-charcoal/5 shadow-sm group-hover:scale-105 transition-transform duration-500"
              referrerPolicy="no-referrer"
            />
            {featured && (
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-ocean-mid text-offwhite rounded-full flex items-center justify-center shadow-lg">
                <ArrowUp className="w-3 h-3" />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0 space-y-1">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-2xl font-serif font-black text-charcoal truncate group-hover:text-ocean-mid transition-colors">{app.name}</h3>
              {featured && (
                <Badge className="bg-ocean-mid/10 text-ocean-mid border-none font-bold uppercase tracking-widest text-[10px] px-2 py-0.5">
                  Prime
                </Badge>
              )}
            </div>
            <p className="text-charcoal/60 font-medium truncate">{app.tagline}</p>
            {app.category && (
              <div className="flex items-center gap-1.5 mt-2 text-[10px] font-bold text-charcoal/30 uppercase tracking-widest">
                <Layers className="w-3 h-3" />
                {app.category.name}
              </div>
            )}
          </div>
        </div>
        
        <p className="text-charcoal/50 line-clamp-2 leading-relaxed font-medium">
          {app.description}
        </p>

        <div className="flex flex-wrap gap-2">
          {app.tech_stack?.slice(0, 3).map(tech => (
            <Badge key={tech} variant="secondary" className="bg-charcoal/5 text-charcoal/60 border-none font-semibold px-3 py-1 rounded-lg">
              {tech}
            </Badge>
          ))}
        </div>
      </Link>

      <CardFooter className="px-8 py-6 mt-auto border-t border-charcoal/5 flex items-center justify-between bg-charcoal/[0.01]">
        <div className="flex items-center gap-6">
          <button 
            onClick={onVote}
            disabled={isVoting}
            className={`flex items-center gap-2 transition-all group/btn ${
              isVoted ? 'text-ocean-mid' : 'text-charcoal/40 hover:text-charcoal'
            }`}
          >
            <div className={`p-2 rounded-xl transition-all ${
              isVoted 
                ? 'bg-ocean-mid text-offwhite shadow-lg shadow-ocean-mid/20' 
                : 'bg-charcoal/5 border border-transparent group-hover/btn:border-charcoal/10 group-hover/btn:bg-charcoal/10'
            }`}>
              <ArrowUp className={`w-5 h-5 ${isVoting ? 'animate-bounce' : ''}`} />
            </div>
            <span className="font-bold text-lg">{app.votes_count || 0}</span>
          </button>
          <Link to={`/app/${app.id}#comments`} className="flex items-center gap-2 text-charcoal/30 hover:text-charcoal transition-colors group/comm">
            <div className="p-2 rounded-xl bg-charcoal/5 group-hover/comm:bg-charcoal/10 transition-colors">
              <MessageSquare className="w-5 h-5" />
            </div>
            <span className="font-bold text-lg">{app.comments_count || 0}</span>
          </Link>
        </div>
        
        <Button asChild size="sm" className="rounded-full px-6 font-bold shadow-sm bg-charcoal hover:bg-charcoal/90 text-offwhite border-none h-10">
          <a href={app.website_url} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>
            Explore <ExternalLink className="w-4 h-4 ml-2" />
          </a>
        </Button>
      </CardFooter>
    </Card>
  );
}
