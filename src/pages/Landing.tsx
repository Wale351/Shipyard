import { motion, Variants } from 'motion/react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Magnetic } from '../components/ui/Magnetic';
import { Counter } from '../components/ui/Counter';
import { InteractiveBackground } from '../components/ui/InteractiveBackground';
import { 
  Rocket, 
  Search, 
  MessageSquare, 
  ArrowUp, 
  ExternalLink, 
  Zap, 
  Users, 
  TrendingUp, 
  Layers,
  ChevronRight,
  Star,
  Activity,
  ArrowRight,
  Play
} from 'lucide-react';

const FEATURED_APPS = [
  {
    id: '1',
    name: 'CodeVibe',
    tagline: 'AI code editor that matches your mood',
    tech: ['React', 'Rust', 'OpenAI'],
    votes: 342,
    comments: 28,
    buildTime: '48h',
    logo: 'https://picsum.photos/seed/codevibe/600/800',
    height: 'h-[450px]',
    offset: 'lg:mt-0'
  },
  {
    id: '2',
    name: 'DesignGen',
    tagline: 'Text-to-UI system generator',
    tech: ['Next.js', 'Tailwind', 'Figma'],
    votes: 289,
    comments: 15,
    buildTime: '24h',
    logo: 'https://picsum.photos/seed/designgen/600/900',
    height: 'h-[550px]',
    offset: 'lg:mt-24'
  },
  {
    id: '3',
    name: 'DataWhisperer',
    tagline: 'Chat with your databases',
    tech: ['Python', 'Postgres', 'LangChain'],
    votes: 456,
    comments: 42,
    buildTime: '72h',
    logo: 'https://picsum.photos/seed/datawhisper/600/700',
    height: 'h-[400px]',
    offset: 'lg:-mt-12'
  },
  {
    id: '4',
    name: 'VibeCheck',
    tagline: 'Automated vibe-based code review',
    tech: ['TypeScript', 'AST', 'Gemini'],
    votes: 120,
    comments: 5,
    buildTime: '12h',
    logo: 'https://picsum.photos/seed/vibecheck/600/850',
    height: 'h-[480px]',
    offset: 'lg:mt-12'
  }
];

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: { 
    opacity: 1, 
    y: 0, 
    transition: { 
      duration: 1, 
      ease: [0.16, 1, 0.3, 1] 
    } 
  },
};

const kineticTextVariants: Variants = {
  hidden: { y: '110%' },
  visible: { 
    y: 0, 
    transition: { 
      duration: 1.2, 
      ease: [0.16, 1, 0.3, 1] 
    } 
  },
};

export function Landing() {
  return (
    <div className="min-h-screen bg-offwhite text-charcoal font-sans selection:bg-cobalt/10 overflow-x-hidden">
      <InteractiveBackground />
      
      {/* Hero Section - Centered & Refined */}
      <section className="relative pt-40 pb-32 overflow-hidden">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div 
            initial="hidden"
            animate="visible"
            variants={containerVariants}
            className="space-y-12"
          >
            <div className="space-y-6">
              <motion.div variants={itemVariants} className="flex justify-center">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/50 backdrop-blur-sm border border-charcoal/5 text-charcoal/60 text-xs font-bold tracking-widest uppercase">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cobalt opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-cobalt"></span>
                  </span>
                  Community-Driven Innovation
                </div>
              </motion.div>
              
              <div className="space-y-4">
                <h1 className="text-7xl md:text-[120px] font-bold tracking-tighter leading-[0.8] kinetic-text">
                  <motion.span variants={kineticTextVariants} className="block">Launch What</motion.span>
                  <motion.span variants={kineticTextVariants} className="block text-cobalt">You Build.</motion.span>
                </h1>
              </div>
              
              <motion.p variants={itemVariants} className="text-xl md:text-2xl text-charcoal/50 max-w-2xl mx-auto leading-relaxed font-medium">
                Shipyard is the premier hub for builders to showcase AI agents, experimental prototypes, and next-gen applications.
              </motion.p>
            </div>

            <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-4">
              <Magnetic strength={0.2}>
                <Button asChild size="lg" className="h-16 px-12 rounded-full bg-cobalt hover:bg-cobalt/90 text-offwhite border border-white/10 shadow-[0_20px_50px_rgba(63,81,255,0.3)] text-xl font-bold transition-all active:scale-95 relative overflow-hidden group">
                  <Link to="/login">
                    <span className="relative z-10">Start Building</span>
                    <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>
                </Button>
              </Magnetic>
              <Magnetic strength={0.1}>
                <Button asChild variant="ghost" size="lg" className="h-16 px-12 rounded-full text-charcoal/60 hover:text-charcoal hover:bg-charcoal/5 text-xl font-bold group border border-transparent hover:border-charcoal/10 transition-all">
                  <Link to="/explore" className="flex items-center gap-2">
                    <Play className="w-5 h-5 fill-current" /> Watch Demo
                  </Link>
                </Button>
              </Magnetic>
            </motion.div>

            {/* Hero Visual - Centered Mockup */}
            <motion.div
              variants={itemVariants}
              className="pt-20"
            >
              <div className="relative mx-auto max-w-4xl">
                <div className="absolute -inset-4 bg-gradient-to-b from-cobalt/20 to-transparent blur-3xl opacity-30 -z-10" />
                <div className="bg-white/80 backdrop-blur-xl rounded-[2.5rem] p-4 border border-white shadow-2xl overflow-hidden">
                  <div className="bg-charcoal rounded-[2rem] aspect-video overflow-hidden relative group">
                    <img 
                      src="https://picsum.photos/seed/shipyard-dashboard/1200/800" 
                      alt="Dashboard Preview" 
                      className="w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-1000"
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-20 h-20 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center group-hover:scale-110 transition-transform cursor-pointer">
                        <Play className="w-8 h-8 text-white fill-white ml-1" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Stats Section - Refined */}
      <section className="py-20 border-y border-charcoal/5 bg-white/30 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-12 text-center">
            {[
              { label: 'Apps Launched', value: 1240, suffix: '+' },
              { label: 'Active Builders', value: 850, suffix: '' },
              { label: 'Daily Visits', value: 15, suffix: 'k' },
              { label: 'New This Week', value: 42, suffix: '' },
            ].map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="space-y-2"
              >
                <div className="text-5xl font-bold tracking-tighter">
                  <Counter value={stat.value} suffix={stat.suffix} />
                </div>
                <div className="text-[10px] text-charcoal/40 uppercase tracking-[0.2em] font-bold">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Apps Section - Bento Grid 2.0 */}
      <section className="py-48 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-32 space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <Badge variant="outline" className="border-cobalt/20 text-cobalt px-4 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest">
                Curated Showcase
              </Badge>
            </motion.div>
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-6xl md:text-8xl font-bold tracking-tighter leading-none"
            >
              Featured Launches.
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="text-charcoal/40 max-w-xl mx-auto text-xl font-medium"
            >
              Handpicked projects that push the boundaries of AI and rapid prototyping.
            </motion.p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
            {FEATURED_APPS.map((app, i) => (
              <motion.div
                key={app.id}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ delay: i * 0.1, duration: 1, ease: [0.16, 1, 0.3, 1] }}
                className={`${app.offset}`}
              >
                <Link to={`/app/${app.id}`} className="block group">
                  <div className={`relative ${app.height} rounded-[3rem] overflow-hidden border border-charcoal/5 bg-white shadow-sm transition-all duration-700 group-hover:shadow-[0_40px_80px_rgba(63,81,255,0.12)] group-hover:-translate-y-4 group-hover:border-cobalt/10`}>
                    <img 
                      src={app.logo} 
                      alt={app.name} 
                      className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110 grayscale-[0.2] group-hover:grayscale-0" 
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-charcoal/80 via-charcoal/10 to-transparent opacity-40 group-hover:opacity-60 transition-opacity duration-700" />
                    
                    <div className="absolute bottom-0 left-0 right-0 p-10 space-y-6">
                      <div className="flex items-center justify-between">
                        <h3 className="text-3xl font-bold text-offwhite tracking-tight">{app.name}</h3>
                        <Badge className="bg-white/10 backdrop-blur-md text-white border-white/20 rounded-full px-3 py-1 text-[10px] font-bold">
                          {app.buildTime}
                        </Badge>
                      </div>
                      <p className="text-offwhite/70 text-lg line-clamp-2 font-medium group-hover:text-offwhite transition-colors duration-500">
                        {app.tagline}
                      </p>
                      <div className="flex flex-wrap gap-3 pt-2 opacity-0 group-hover:opacity-100 transition-all duration-700 translate-y-6 group-hover:translate-y-0">
                        {app.tech.map(t => (
                          <span key={t} className="text-[10px] font-bold text-cobalt bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full uppercase tracking-wider">
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works - Staggered Editorial Blocks */}
      <section className="py-64 bg-charcoal text-offwhite relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none">
          <motion.div 
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.1, 0.2, 0.1],
            }}
            transition={{ duration: 10, repeat: Infinity }}
            className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-cobalt blur-[180px] rounded-full" 
          />
          <motion.div 
            animate={{
              scale: [1.2, 1, 1.2],
              opacity: [0.1, 0.2, 0.1],
            }}
            transition={{ duration: 12, repeat: Infinity }}
            className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-terracotta blur-[180px] rounded-full" 
          />
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-32 items-center">
            <div className="lg:col-span-5 space-y-12">
              <Badge variant="outline" className="border-white/10 text-white/40 px-4 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest">
                The Methodology
              </Badge>
              <h2 className="text-7xl md:text-9xl font-bold tracking-tighter leading-none">The<br />Process.</h2>
              <p className="text-offwhite/40 text-2xl font-medium max-w-sm leading-relaxed">
                Shipyard is engineered for velocity. We've eliminated the friction so you can focus on the breakthrough.
              </p>
            </div>
            
            <div className="lg:col-span-7 space-y-40">
              {[
                { 
                  step: '01',
                  title: 'Launch', 
                  desc: 'Connect your project, define your stack, and deploy to the hub in a heartbeat.', 
                  icon: <Rocket className="w-12 h-12" />
                },
                { 
                  step: '02',
                  title: 'Discover', 
                  desc: 'Gain visibility on the global stage and connect with a network of visionary builders.', 
                  icon: <Search className="w-12 h-12" />
                },
                { 
                  step: '03',
                  title: 'Improve', 
                  desc: 'Harness high-fidelity feedback and iterate with precision based on real-world usage.', 
                  icon: <Zap className="w-12 h-12" />
                }
              ].map((item, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: i * 0.2 }}
                  className={`flex gap-16 items-start ${i % 2 === 1 ? 'lg:pl-32' : ''}`}
                >
                  <span className="text-7xl font-bold text-cobalt/20 tracking-tighter tabular-nums">{item.step}</span>
                  <div className="space-y-8">
                    <h3 className="text-5xl font-bold tracking-tight">{item.title}</h3>
                    <p className="text-offwhite/50 text-2xl leading-relaxed max-w-lg font-medium">
                      {item.desc}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Builder Spotlight - Asymmetrical Cards */}
      <section className="py-64">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-32 items-center">
            <div className="order-2 lg:order-1 relative">
              <motion.div 
                initial={{ rotate: -5, scale: 0.95 }}
                whileInView={{ rotate: 0, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                className="relative z-10 bg-white p-16 rounded-[4rem] shadow-[0_40px_100px_rgba(0,0,0,0.05)] border border-charcoal/5 space-y-16"
              >
                <div className="flex items-center gap-10">
                  <img src="https://i.pravatar.cc/150?u=alex_dev" alt="Alex" className="w-40 h-40 rounded-[2.5rem] object-cover grayscale hover:grayscale-0 transition-all duration-700" />
                  <div className="space-y-2">
                    <h3 className="text-5xl font-bold tracking-tighter">@alex_dev</h3>
                    <p className="text-charcoal/30 font-bold uppercase tracking-[0.3em] text-[10px]">Full-stack Alchemist</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-16">
                  <div className="space-y-3">
                    <div className="text-6xl font-bold tracking-tighter">
                      <Counter value={12} />
                    </div>
                    <div className="text-[10px] text-charcoal/30 uppercase tracking-[0.2em] font-bold">Apps Built</div>
                  </div>
                  <div className="space-y-3">
                    <div className="text-6xl font-bold tracking-tighter">
                      <Counter value={1400} suffix="+" />
                    </div>
                    <div className="text-[10px] text-charcoal/30 uppercase tracking-[0.2em] font-bold">Upvotes</div>
                  </div>
                </div>

                <p className="text-3xl font-medium text-charcoal/80 leading-relaxed italic">
                  "Shipyard has been the definitive place to launch my weekend experiments. The feedback loop is incredibly fast."
                </p>

                <Magnetic strength={0.1}>
                  <Button asChild variant="outline" className="h-16 px-12 rounded-full border-charcoal/10 hover:bg-charcoal hover:text-offwhite transition-all text-lg font-bold">
                    <Link to="/profile/alex_dev">View Profile</Link>
                  </Button>
                </Magnetic>
              </motion.div>
              <div className="absolute -top-16 -right-16 w-full h-full bg-cobalt/5 rounded-[4rem] -z-10 rotate-3" />
            </div>

            <div className="order-1 lg:order-2 space-y-12">
              <Badge className="bg-terracotta/10 text-terracotta border-terracotta/20 rounded-full px-5 py-1.5 uppercase tracking-widest text-[10px] font-bold">
                Builder Spotlight
              </Badge>
              <h2 className="text-7xl md:text-9xl font-bold tracking-tighter leading-none">Meet the<br />Makers.</h2>
              <p className="text-charcoal/40 text-2xl font-medium max-w-sm leading-relaxed">
                The community is the soul of Shipyard. Discover the visionaries behind the most innovative launches.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section - Kinetic Typography */}
      <section className="py-80 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 text-center space-y-20 relative z-10">
          <motion.h2 
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
            className="text-8xl md:text-[14rem] font-bold tracking-tighter leading-none kinetic-text"
          >
            Ready to <br />
            <span className="text-cobalt">Ship?</span>
          </motion.h2>
          
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.6, duration: 1, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col sm:flex-row items-center justify-center gap-10"
          >
            <Magnetic strength={0.2}>
              <Button asChild size="lg" className="h-24 px-20 rounded-full bg-cobalt hover:bg-cobalt/90 text-offwhite border border-white/10 text-3xl font-bold shadow-[0_40px_100px_rgba(63,81,255,0.4)] transition-all active:scale-95 relative overflow-hidden group">
                <Link to="/login">
                  <span className="relative z-10">Launch Your App</span>
                  <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                </Link>
              </Button>
            </Magnetic>
          </motion.div>
        </div>
        
        {/* Background Elements */}
        <div className="absolute top-1/2 left-0 w-full h-px bg-charcoal/5 -z-10" />
        <div className="absolute top-0 left-1/2 w-px h-full bg-charcoal/5 -z-10" />
      </section>
    </div>
  );
}
