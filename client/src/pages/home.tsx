import React, { useState, useEffect, useRef } from "react";
import { WaitlistModal } from "../components/marketing/waitlist-modal";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { SiGoogle } from "react-icons/si";
import {
  Music2, Users2, TrendingUp, FileText, Star, Home, Youtube, Globe,
  MessageCircle, BarChart2, Calendar, UserCircle2, Video, Sparkles, Wand2, 
  Play, Volume2, ChevronRight, ArrowRight, Headphones, MoveRight, MousePointer,
  Zap, LucideIcon, Check, ExternalLink, CloudLightning, Pause, PlaySquare
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { motion, useAnimation } from "framer-motion";
import { useAuth } from "../hooks/use-auth";
import { useToast } from "../hooks/use-toast";
import { Footer } from "../components/layout/footer";
import { CircularProgressbar, buildStyles } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";
// Comentando los siguientes imports temporalmente ya que no son esenciales para la página inicial
// import { SuperAgent } from "../components/agents/super-agent";
// import { PricingPlans } from "../components/subscription/pricing-plans";

/* =============================
   VARIANTES PARA ANIMACIONES
============================= */
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
};

const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.6 } }
};

/* =============================
   TIPOS Y INTERFACES
============================= */
interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  delay?: number;
}

interface ToolCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  link: string;
  bgColor: string;
}

interface FeatureHighlight {
  title: string;
  description: string;
  icon: LucideIcon;
  features: string[];
  image?: string;
}

/* =============================
   COMPONENTES
============================= */
const FeatureCard = ({ icon, title, description, delay = 0 }: FeatureCardProps) => (
  <motion.div
    variants={itemVariants}
    transition={{ delay }}
    whileHover={{ y: -8 }}
    className="bg-zinc-900/50 backdrop-blur-sm border border-orange-500/10 rounded-xl p-6 hover:border-orange-500/30 transition-all duration-300 hover:shadow-lg hover:shadow-orange-500/5"
  >
    <div className="bg-orange-500/10 rounded-full p-3 inline-block mb-4">
      {icon}
    </div>
    <h3 className="text-xl font-bold mb-3">{title}</h3>
    <p className="text-white/70">{description}</p>
  </motion.div>
);

const ToolCard = ({ icon, title, description, link, bgColor }: ToolCardProps) => (
  <Link href={link}>
    <motion.div
      whileHover={{ y: -5, scale: 1.02 }}
      className={`${bgColor} rounded-xl overflow-hidden cursor-pointer transition-all duration-300 h-full group flex flex-col`}
    >
      <div className="p-6">
        <div className="bg-white/10 rounded-full p-3 inline-block mb-4">
          {icon}
        </div>
        <h3 className="text-xl font-bold mb-2">{title}</h3>
        <p className="text-white/80 mb-4">{description}</p>
        <div className="flex items-center text-white/60 group-hover:text-white transition-colors">
          <span className="mr-2 text-sm font-medium">Explore</span>
          <ArrowRight className="h-4 w-4 transform group-hover:translate-x-1 transition-transform" />
        </div>
      </div>
    </motion.div>
  </Link>
);

/* =============================
   DATOS ESTÁTICOS
============================= */
const features = [
  {
    icon: <Youtube className="h-6 w-6 text-orange-500" />,
    title: "Strategic YouTube Promotion",
    description: "Boost your video visibility with targeted promotion and AI-powered audience engagement strategies"
  },
  {
    icon: <Music2 className="h-6 w-6 text-orange-500" />,
    title: "Advanced Spotify Growth",
    description: "Optimize your Spotify presence with data-driven insights and algorithmic playlist targeting"
  },
  {
    icon: <Users2 className="h-6 w-6 text-orange-500" />,
    title: "Professional PR Management",
    description: "Launch targeted PR campaigns and build your industry network with AI-assisted outreach"
  },
  {
    icon: <TrendingUp className="h-6 w-6 text-orange-500" />,
    title: "Comprehensive Analytics",
    description: "Track your growth across all platforms with detailed insights and predictive trends"
  },
  {
    icon: <Globe className="h-6 w-6 text-orange-500" />,
    title: "Global Audience Reach",
    description: "Expand your fanbase worldwide with smart targeting and localized promotion strategies"
  },
  {
    icon: <MessageCircle className="h-6 w-6 text-orange-500" />,
    title: "Artist Community Hub",
    description: "Connect with industry professionals and fellow artists in our exclusive networking platform"
  }
];

const educationFeatures = [
  {
    icon: <FileText className="h-6 w-6 text-orange-500" />,
    title: "Music Business Courses",
    description: "Comprehensive courses on music business, rights management, and industry navigation"
  },
  {
    icon: <Play className="h-6 w-6 text-orange-500" />,
    title: "Production Masterclasses",
    description: "Learn advanced music production techniques from industry professionals"
  },
  {
    icon: <Calendar className="h-6 w-6 text-orange-500" />,
    title: "Scheduled Mentoring",
    description: "One-on-one mentoring sessions with experienced music industry experts"
  },
  {
    icon: <UserCircle2 className="h-6 w-6 text-orange-500" />,
    title: "Creator Community",
    description: "Join a community of like-minded artists learning and growing together"
  }
];

const featureHighlights: FeatureHighlight[] = [
  {
    title: "AI-Powered Content Creation",
    description: "Create professional music videos, promotional materials, and social content in minutes with our advanced AI tools",
    icon: Sparkles,
    features: [
      "Music Video Generation",
      "Lipsync Technology",
      "Virtual Try-On",
      "AI Image Creation",
      "Social Media Assets"
    ],
    image: "/assets/ai-feature.webp"
  },
  {
    title: "Cross-Platform Analytics",
    description: "Track your growth and engagement across all major platforms with our centralized analytics dashboard",
    icon: BarChart2,
    features: [
      "Spotify Growth Metrics",
      "YouTube Performance",
      "Social Media Engagement",
      "Audience Demographics",
      "Trending Analysis"
    ],
    image: "/assets/analytics-feature.webp"
  },
  {
    title: "Smart Music Marketing",
    description: "Leverage data-driven strategies to reach your target audience and grow your fanbase effectively",
    icon: TrendingUp,
    features: [
      "Automated Campaigns",
      "Fan Growth Strategies",
      "Content Calendars",
      "Budget Optimization",
      "Performance Tracking"
    ],
    image: "/assets/marketing-feature.webp"
  }
];

const tools = [
  {
    icon: <Video className="h-6 w-6 text-white" />,
    title: "Music Video Creator",
    description: "Generate professional music videos with AI in minutes",
    link: "/music-video-creator",
    bgColor: "bg-gradient-to-br from-purple-600 to-indigo-600"
  },
  {
    icon: <Headphones className="h-6 w-6 text-white" />,
    title: "Music Generator",
    description: "Create original tracks or enhance your existing music with AI",
    link: "/music-generator",
    bgColor: "bg-gradient-to-br from-blue-600 to-cyan-600"
  },
  {
    icon: <Globe className="h-6 w-6 text-white" />,
    title: "Promotion Tools",
    description: "Boost your reach with smart promotion strategies",
    link: "/promotion",
    bgColor: "bg-gradient-to-br from-orange-600 to-red-600"
  },
  {
    icon: <CloudLightning className="h-6 w-6 text-white" />,
    title: "AI Creative Suite",
    description: "Unleash creativity with our comprehensive AI toolset",
    link: "/ai-agents",
    bgColor: "bg-gradient-to-br from-green-600 to-emerald-600"
  }
];

const testimonials = [
  {
    name: "Sarah Johnson",
    role: "Independent Artist",
    content: "This platform has revolutionized how I manage my music career. The analytics are incredibly detailed and the AI tools have saved me countless hours!",
    rating: 5,
    avatar: "https://i.pravatar.cc/150?u=sarah.johnson"
  },
  {
    name: "Michael Rodriguez",
    role: "Music Producer",
    content: "The Spotify integration and YouTube promotion tools are game-changing. I've seen a 200% increase in my monthly listeners since using this platform.",
    rating: 5,
    avatar: "https://i.pravatar.cc/150?u=michael.rodriguez"
  },
  {
    name: "Emma Thompson",
    role: "Band Manager",
    content: "Managing multiple artists has never been easier. The automated marketing tools and PR campaigns have helped us reach new audiences globally.",
    rating: 5,
    avatar: "https://i.pravatar.cc/150?u=emma.thompson"
  }
];

const stats = [
  { label: "Active Artists", value: 10000, icon: Users2 },
  { label: "Music Videos Created", value: 50000, icon: Video },
  { label: "Tracks Promoted", value: 250000, icon: Music2 },
  { label: "Monthly Views", value: 15000000, icon: TrendingUp }
];

/* =============================
   COMPONENTE ESTADÍSTICA SIMPLE
============================= */
function StatCard({ value, label, icon }: { value: number, label: string, icon: LucideIcon }) {
  const Icon = icon;
  
  // Formato simple para los números grandes
  const formattedValue = value >= 1000000 
    ? `${(value / 1000000).toFixed(1)}M+` 
    : value >= 1000 
      ? `${(value / 1000).toFixed(0)}K+` 
      : `${value}+`;

  return (
    <div className="bg-zinc-900/30 backdrop-blur-sm rounded-xl p-6 text-center border border-orange-500/10 hover:border-orange-500/20 transition-all duration-300">
      <div className="bg-orange-500/10 rounded-full p-3 inline-flex items-center justify-center mb-4">
        <Icon className="h-6 w-6 text-orange-500" />
      </div>
      <h3 className="text-3xl md:text-4xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-orange-400 to-red-400">
        {formattedValue}
      </h3>
      <p className="text-white/70 text-sm">{label}</p>
    </div>
  );
}

/* =============================
   COMPONENTE PRINCIPAL: HOME PAGE
============================= */
export default function HomePage() {
  const { login } = useAuth();
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [viewCount, setViewCount] = useState(0);
  const [progress, setProgress] = useState(0);
  const statsRef = useRef<HTMLDivElement>(null);
  const statsControls = useAnimation();

  useEffect(() => {
    const viewInterval = setInterval(() => {
      setViewCount(prev => {
        if (prev >= 100000) {
          return 0; // Reset to start the loop again
        }
        return prev + 1000;
      });
    }, 50);

    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 85) {
          return 0; // Reset to start the loop again
        }
        return prev + 1;
      });
    }, 30);

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            statsControls.start({
              opacity: 1,
              y: 0,
              transition: { duration: 0.8, staggerChildren: 0.1 }
            });
          }
        });
      },
      { threshold: 0.1 }
    );

    if (statsRef.current) {
      observer.observe(statsRef.current);
    }

    return () => {
      clearInterval(viewInterval);
      clearInterval(progressInterval);
      observer.disconnect();
    };
  }, [statsControls]);

  const handleGoogleLogin = async () => {
    try {
      await login('/dashboard');
      
      toast({
        title: "Success",
        description: "Successfully logged in. Redirecting to dashboard..."
      });
      
      // No es necesario setLocation ya que el método login maneja la redirección
    } catch (error: any) {
      console.error("Login error:", error);
      toast({
        title: "Authentication Error",
        description: "Could not sign in with Google. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Calculate days until launch
  const launchDate = new Date('2025-04-01T00:00:00');
  const now = new Date();
  const diffTime = launchDate.getTime() - now.getTime();
  const daysUntilLaunch = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return (
    <div className="min-h-screen bg-black text-white">
      <WaitlistModal />

      {/* Hero Section - Modern and Eye-catching */}
      <section className="relative min-h-[90vh] flex items-center overflow-hidden">
        {/* Background video with overlay */}
        <video
          autoPlay
          loop
          muted
          playsInline
          disablePictureInPicture
          disableRemotePlayback
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover"
          src="/assets/Standard_Mode_Generated_Video (9).mp4"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/60 to-black" />
        
        {/* Animated gradient orbs in background */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-orange-500/20 rounded-full filter blur-3xl animate-pulse" 
             style={{ animationDuration: '7s' }} />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-red-500/20 rounded-full filter blur-3xl animate-pulse" 
             style={{ animationDuration: '10s' }} />
        
        <div className="container relative z-10 mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-center space-y-6"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 1, delay: 0.2 }}
              >
                <Badge 
                  className="mb-4 bg-orange-500/20 text-orange-400 border-orange-500/30 px-4 py-1 text-sm"
                  variant="outline"
                >
                  Launch in {daysUntilLaunch} days — April 1st, 2025
                </Badge>
              </motion.div>

              <h1 className="text-5xl md:text-7xl lg:text-8xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-orange-400 via-red-500 to-orange-500 leading-tight">
                <motion.span
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                  className="block"
                >
                  Boostify Music
                </motion.span>
              </h1>

              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.5 }}
                className="text-xl md:text-2xl text-white/80 max-w-3xl mx-auto leading-relaxed"
              >
                The ultimate AI-powered platform for artists to create, promote, and grow their music career
              </motion.p>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7, duration: 0.6 }}
                className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-8 py-4"
              >
                <Button
                  size="lg"
                  onClick={handleGoogleLogin}
                  className="relative overflow-hidden group bg-gradient-to-r from-orange-500 via-red-500 to-orange-500 hover:from-orange-600 hover:via-red-600 hover:to-orange-600 text-white h-14 px-8 shadow-xl transition-all duration-300 transform hover:scale-105"
                  aria-label="Login with Google"
                >
                  <SiGoogle className="w-5 h-5 mr-2" />
                  <span className="font-medium">Get Started</span>
                </Button>
                
                <Link href="/pricing">
                  <Button 
                    size="lg" 
                    variant="outline" 
                    className="h-14 px-8 border-white/30 text-white hover:bg-white/10 hover:text-white"
                  >
                    View Pricing
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                </Link>
              </motion.div>
            </motion.div>
            
            {/* Feature highlights bar */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1, duration: 0.8 }}
              className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6"
            >
              <Card className="bg-black/40 backdrop-blur-lg border-orange-500/10 p-4 text-center">
                <Sparkles className="w-6 h-6 text-orange-500 mx-auto mb-2" />
                <p className="text-sm font-medium">AI Video Creation</p>
              </Card>
              <Card className="bg-black/40 backdrop-blur-lg border-orange-500/10 p-4 text-center">
                <Music2 className="w-6 h-6 text-orange-500 mx-auto mb-2" />
                <p className="text-sm font-medium">Music Promotion</p>
              </Card>
              <Card className="bg-black/40 backdrop-blur-lg border-orange-500/10 p-4 text-center">
                <BarChart2 className="w-6 h-6 text-orange-500 mx-auto mb-2" />
                <p className="text-sm font-medium">Analytics Dashboard</p>
              </Card>
              <Card className="bg-black/40 backdrop-blur-lg border-orange-500/10 p-4 text-center">
                <Globe className="w-6 h-6 text-orange-500 mx-auto mb-2" />
                <p className="text-sm font-medium">Global Distribution</p>
              </Card>
            </motion.div>
          </div>
        </div>
        
        {/* Navigation Button for logged-in users */}
        {user && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="fixed top-4 right-4 z-50"
          >
            <Link href="/dashboard" aria-label="Dashboard">
              <Button
                variant="outline"
                size="icon"
                className="bg-black/20 backdrop-blur-lg border-orange-500/20 hover:bg-orange-500/10"
              >
                <Home className="h-5 w-5" />
              </Button>
            </Link>
          </motion.div>
        )}
      </section>

      {/* Stats Section - With Animated Counters */}
      <section 
        ref={statsRef}
        className="py-16 bg-gradient-to-b from-black to-zinc-950 relative overflow-hidden"
      >
        {/* Background elements */}
        <div className="absolute top-1/4 right-1/4 w-72 h-72 bg-orange-500/10 rounded-full filter blur-3xl opacity-30" />
        <div className="absolute bottom-1/4 left-1/4 w-80 h-80 bg-red-500/10 rounded-full filter blur-3xl opacity-30" />
        
        <motion.div 
          initial={{ opacity: 0 }}
          animate={statsControls}
          className="container mx-auto px-4"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 bg-clip-text text-transparent bg-gradient-to-r from-orange-400 to-red-500">
            Platform Metrics
          </h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {stats.map((stat, index) => (
              <StatCard
                key={index}
                value={stat.value}
                label={stat.label}
                icon={stat.icon}
              />
            ))}
          </div>
        </motion.div>
      </section>

      {/* Key Features Highlight Section */}
      {featureHighlights.map((feature, index) => (
        <section 
          key={index}
          className={`py-20 ${index % 2 === 0 ? 'bg-zinc-950' : 'bg-black'} relative overflow-hidden`}
        >
          <div className={`absolute ${index % 2 === 0 ? '-right-40' : '-left-40'} top-20 w-80 h-80 bg-orange-500/10 rounded-full filter blur-3xl`} />
          
          <div className="container mx-auto px-4">
            <div className={`grid grid-cols-1 lg:grid-cols-2 gap-12 items-center ${index % 2 !== 0 ? 'lg:flex-row-reverse' : ''}`}>
              <motion.div
                initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-orange-500/10 p-2 rounded-lg">
                    <feature.icon className="h-6 w-6 text-orange-500" />
                  </div>
                  <Badge className="bg-orange-500/20 text-orange-400 border-none">
                    Key Feature
                  </Badge>
                </div>
                <h2 className="text-3xl md:text-4xl font-bold mb-6">
                  {feature.title}
                </h2>
                <p className="text-lg text-white/70 mb-8">
                  {feature.description}
                </p>
                
                <ul className="space-y-3 mb-8">
                  {feature.features.map((item, i) => (
                    <li key={i} className="flex items-center">
                      <div className="rounded-full bg-green-500/10 p-1 mr-3">
                        <Check className="h-4 w-4 text-green-500" />
                      </div>
                      <span className="text-white/90">{item}</span>
                    </li>
                  ))}
                </ul>
                
                <div className="flex gap-4">
                  <Button className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600">
                    Explore Now
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                  <Button variant="outline" className="border-white/20">
                    Learn More
                  </Button>
                </div>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, scale: 0.9, x: index % 2 === 0 ? 50 : -50 }}
                whileInView={{ opacity: 1, scale: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
                className={`rounded-2xl overflow-hidden shadow-2xl shadow-orange-500/5 border border-orange-500/10`}
              >
                <div className="relative aspect-video bg-zinc-800">
                  {/* Placeholder for feature image */}
                  <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-tr from-zinc-900 to-zinc-800">
                    <feature.icon className="h-20 w-20 text-orange-500/20" />
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>
      ))}

      {/* AI Music Video Section with Interactive Elements */}
      <section className="py-24 relative overflow-hidden bg-gradient-to-b from-zinc-950 to-black">
        <div className="absolute -top-40 -left-40 w-80 h-80 bg-orange-500/10 rounded-full filter blur-3xl" />
        
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16 max-w-3xl mx-auto"
          >
            <Badge 
              className="mb-4 bg-orange-500/20 text-orange-400 border-orange-500/30 px-4 py-1 text-sm"
              variant="outline"
            >
              AI-Powered Technology
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Create Professional Content in Minutes
            </h2>
            <p className="text-xl text-white/70">
              Our suite of AI tools empowers artists to create stunning videos, artwork, and promotional materials without any technical skills
            </p>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {tools.map((tool, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
              >
                <ToolCard {...tool} />
              </motion.div>
            ))}
          </div>
          
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="mt-16 text-center"
          >
            <Link href="/ai-agents">
              <Button variant="outline" className="border-white/20 hover:bg-white/10">
                View All AI Tools
                <ExternalLink className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Pricing Section with Modern Design */}
      <section className="py-24 bg-gradient-to-b from-black to-zinc-950 relative overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-orange-500/10 rounded-full filter blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-red-500/10 rounded-full filter blur-3xl" />
        
        <div className="container relative mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <Badge 
              className="mb-4 bg-orange-500/20 text-orange-400 border-orange-500/30 px-4 py-1 text-sm"
              variant="outline"
            >
              Flexible Plans
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-6">Choose Your Plan</h2>
            <p className="text-xl text-white/70 max-w-2xl mx-auto">
              Subscription options designed to match your needs at every stage of your music career
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            {/* <PricingPlans simplified withAnimation /> */}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
            className="text-center mt-10"
          >
            <Link href="/pricing">
              <Button variant="link" className="text-orange-500 hover:text-orange-400">
                View detailed pricing comparison
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Testimonials Section with Modern Cards */}
      <section className="py-24 bg-zinc-950 relative overflow-hidden">
        <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-orange-500/5 rounded-full filter blur-3xl" />
        
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <Badge 
              className="mb-4 bg-orange-500/20 text-orange-400 border-orange-500/30 px-4 py-1 text-sm"
              variant="outline"
            >
              Success Stories
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-6">What Artists Say</h2>
            <p className="text-xl text-white/70 max-w-2xl mx-auto">
              Join thousands of musicians who have transformed their careers with our platform
            </p>
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto"
          >
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
                whileHover={{ y: -10 }}
                className="bg-black/40 backdrop-blur-sm border border-orange-500/10 rounded-xl p-8 hover:border-orange-500/30 transition-all duration-300 shadow-xl"
              >
                <div className="flex items-center mb-6">
                  <img
                    src={testimonial.avatar}
                    alt={testimonial.name}
                    className="w-14 h-14 rounded-full mr-4 border-2 border-orange-500/30"
                  />
                  <div>
                    <h3 className="font-bold text-lg">{testimonial.name}</h3>
                    <p className="text-white/60">{testimonial.role}</p>
                  </div>
                </div>
                <p className="text-white/80 mb-6 text-lg italic">"{testimonial.content}"</p>
                <div className="flex">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 text-orange-400 fill-orange-400" />
                  ))}
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Modern CTA Section */}
      <section className="py-24 bg-gradient-to-r from-orange-500/20 to-red-500/20 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/assets/noise.png')] opacity-[0.03] mix-blend-soft-light"></div>
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-orange-500/20 rounded-full filter blur-3xl animate-pulse" style={{ animationDuration: '10s' }} />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-red-500/20 rounded-full filter blur-3xl animate-pulse" style={{ animationDuration: '14s' }} />
        
        <div className="container mx-auto px-4 relative">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-3xl mx-auto text-center"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-8 leading-tight">
              Ready to Transform Your
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-orange-400 to-red-500 block">
                Music Career?
              </span>
            </h2>
            <p className="text-xl text-white/80 mb-10 max-w-2xl mx-auto">
              Join thousands of artists who are using Boostify to reach new audiences, optimize their promotion, and grow their music careers.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                onClick={handleGoogleLogin}
                className="relative overflow-hidden bg-white text-black hover:bg-white/90 shadow-xl px-8 py-6 text-lg font-medium transition-all duration-300"
              >
                Get Started Now
                <MoveRight className="ml-2 h-5 w-5" />
              </Button>
              <Link href="/pricing">
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="border-white px-8 py-6 text-lg font-medium hover:bg-white/10"
                >
                  View Pricing
                </Button>
              </Link>
            </div>
            <p className="mt-6 text-white/60 text-sm">
              No credit card required for free tier • Cancel anytime
            </p>
          </motion.div>
        </div>
      </section>

      {/* YouTube Growth Section with Animated Chart */}
      <section className="py-24 relative overflow-hidden bg-gradient-to-b from-zinc-900 to-black">
        <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-blue-500/10 rounded-full filter blur-3xl opacity-30" />
        <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-purple-500/10 rounded-full filter blur-3xl opacity-30" />
        
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="max-w-xl"
            >
              <Badge 
                className="mb-4 bg-blue-500/20 text-blue-400 border-blue-500/30 px-4 py-1 text-sm"
                variant="outline"
              >
                YouTube Promotion
              </Badge>
              <h2 className="text-4xl md:text-5xl font-bold mb-6">Boost Your Video Presence</h2>
              <p className="text-white/70 text-lg mb-8">
                Our advanced YouTube promotion strategies help you reach wider audiences and increase 
                engagement on your videos. Get real views, likes, and subscribers through our targeted 
                promotion campaigns.
              </p>

              <div className="grid grid-cols-3 gap-6 mb-8">
                <div className="text-center">
                  <h3 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400 mb-1">500K+</h3>
                  <p className="text-white/70 text-sm">Monthly Views</p>
                </div>
                <div className="text-center">
                  <h3 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400 mb-1">50K+</h3>
                  <p className="text-white/70 text-sm">New Subscribers</p>
                </div>
                <div className="text-center">
                  <h3 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400 mb-1">90%</h3>
                  <p className="text-white/70 text-sm">Engagement Rate</p>
                </div>
              </div>

              <h3 className="text-xl font-bold mb-4">Growth Analytics</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm text-white/70">Views Growth</span>
                    <span className="text-sm font-bold">80%</span>
                  </div>
                  <div className="bg-white/10 rounded-full h-2.5 overflow-hidden">
                    <motion.div 
                      className="bg-gradient-to-r from-blue-500 to-purple-500 h-2.5 rounded-full" 
                      initial={{ width: 0 }}
                      whileInView={{ width: "80%" }}
                      viewport={{ once: true }}
                      transition={{ duration: 1.5, delay: 0.2 }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm text-white/70">Engagement Rate</span>
                    <span className="text-sm font-bold">90%</span>
                  </div>
                  <div className="bg-white/10 rounded-full h-2.5 overflow-hidden">
                    <motion.div 
                      className="bg-gradient-to-r from-blue-500 to-purple-500 h-2.5 rounded-full" 
                      initial={{ width: 0 }}
                      whileInView={{ width: "90%" }}
                      viewport={{ once: true }}
                      transition={{ duration: 1.5, delay: 0.4 }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm text-white/70">Subscriber Growth</span>
                    <span className="text-sm font-bold">75%</span>
                  </div>
                  <div className="bg-white/10 rounded-full h-2.5 overflow-hidden">
                    <motion.div 
                      className="bg-gradient-to-r from-blue-500 to-purple-500 h-2.5 rounded-full" 
                      initial={{ width: 0 }}
                      whileInView={{ width: "75%" }}
                      viewport={{ once: true }}
                      transition={{ duration: 1.5, delay: 0.6 }}
                    />
                  </div>
                </div>
              </div>
              
              <div className="mt-8">
                <Button className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600">
                  Promote Your Channel
                  <ExternalLink className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, scale: 0.9, x: 50 }}
              whileInView={{ opacity: 1, scale: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="bg-black/40 backdrop-blur-sm rounded-2xl overflow-hidden shadow-2xl border border-white/10 p-6"
            >
              <div className="mb-8">
                <h3 className="text-xl font-bold mb-4">Channel Growth</h3>
                <div className="relative h-64">
                  <div className="absolute bottom-0 left-0 w-full h-1 bg-white/10"></div>
                  <div className="absolute left-0 h-full w-1 bg-white/10"></div>
                  
                  {/* Chart Animation */}
                  <svg className="w-full h-full" viewBox="0 0 400 200" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="chartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.8" />
                        <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.2" />
                      </linearGradient>
                    </defs>
                    
                    {/* Line graph */}
                    <motion.path
                      initial={{ pathLength: 0 }}
                      whileInView={{ pathLength: 1 }}
                      viewport={{ once: true }}
                      transition={{ duration: 2, ease: "easeInOut" }}
                      d="M 0,180 C 40,160 80,140 120,100 S 160,40 200,30 S 280,20 320,50 S 360,90 400,20"
                      fill="none"
                      stroke="#3b82f6"
                      strokeWidth="3"
                      strokeLinecap="round"
                    />
                    
                    {/* Area under the line */}
                    <motion.path
                      initial={{ opacity: 0 }}
                      whileInView={{ opacity: 1 }}
                      viewport={{ once: true }}
                      transition={{ duration: 2, delay: 1 }}
                      d="M 0,180 C 40,160 80,140 120,100 S 160,40 200,30 S 280,20 320,50 S 360,90 400,20 L 400,200 L 0,200 Z"
                      fill="url(#chartGradient)"
                    />
                    
                    {/* Dots for data points */}
                    {[
                      { x: 0, y: 180 },
                      { x: 80, y: 140 },
                      { x: 160, y: 40 },
                      { x: 240, y: 20 },
                      { x: 320, y: 50 },
                      { x: 400, y: 20 }
                    ].map((point, i) => (
                      <motion.circle
                        key={i}
                        cx={point.x}
                        cy={point.y}
                        r="5"
                        fill="#3b82f6"
                        initial={{ opacity: 0, scale: 0 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: 0.5 + (i * 0.2) }}
                      />
                    ))}
                  </svg>
                  
                  {/* Month labels */}
                  <div className="absolute bottom-4 left-0 right-0 flex justify-between px-2 text-xs text-white/50">
                    <span>Jan</span>
                    <span>Feb</span>
                    <span>Mar</span>
                    <span>Apr</span>
                    <span>May</span>
                    <span>Jun</span>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-xl font-bold mb-4">Views by Content Type</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="rounded-lg bg-blue-500/10 p-3 text-center">
                    <PlaySquare className="h-5 w-5 text-blue-400 mx-auto mb-2" />
                    <span className="text-sm text-white/70">Music Videos</span>
                    <p className="text-lg font-bold">45%</p>
                  </div>
                  <div className="rounded-lg bg-purple-500/10 p-3 text-center">
                    <Music2 className="h-5 w-5 text-purple-400 mx-auto mb-2" />
                    <span className="text-sm text-white/70">Live Performances</span>
                    <p className="text-lg font-bold">30%</p>
                  </div>
                  <div className="rounded-lg bg-pink-500/10 p-3 text-center">
                    <Users2 className="h-5 w-5 text-pink-400 mx-auto mb-2" />
                    <span className="text-sm text-white/70">Behind the Scenes</span>
                    <p className="text-lg font-bold">25%</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
      
      {/* Nueva sección de educación musical con video de fondo */}
      <section className="py-24 relative overflow-hidden bg-gradient-to-b from-zinc-950 to-black">
        <div className="absolute inset-0 z-0 opacity-50">
          <video 
            autoPlay 
            loop 
            muted 
            playsInline
            disablePictureInPicture
            disableRemotePlayback
            className="w-full h-full object-cover"
            poster="/assets/education-poster.jpg"
          >
            <source src="/assets/hero-video.mp4" type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-black/70" />
        </div>
        
        <div className="container relative z-10 mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Intelligent <span className="text-gradient">Music Education</span>
            </h2>
            <p className="text-white/70 max-w-2xl mx-auto text-lg">
              Transform your musical learning with interactive courses, real-time feedback, and an 
              AI-powered personalized approach that adapts to your learning style.
            </p>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              viewport={{ once: true }}
              className="bg-white/5 backdrop-blur-sm p-8 rounded-xl border border-white/10 hover:border-white/20 transition"
            >
              <div className="rounded-full bg-orange-500/20 w-12 h-12 flex items-center justify-center mb-6">
                <Music2 className="w-6 h-6 text-orange-500" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Interactive Courses</h3>
              <p className="text-white/70">
                Learn at your own pace with interactive lessons that combine theory, practice, and real-time evaluation.
              </p>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              viewport={{ once: true }}
              className="bg-white/5 backdrop-blur-sm p-8 rounded-xl border border-white/10 hover:border-white/20 transition"
            >
              <div className="rounded-full bg-blue-500/20 w-12 h-12 flex items-center justify-center mb-6">
                <Zap className="w-6 h-6 text-blue-500" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Adaptive AI</h3>
              <p className="text-white/70">
                Our system adapts lessons to your level, identifying areas for improvement and suggesting personalized exercises.
              </p>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              viewport={{ once: true }}
              className="bg-white/5 backdrop-blur-sm p-8 rounded-xl border border-white/10 hover:border-white/20 transition"
            >
              <div className="rounded-full bg-green-500/20 w-12 h-12 flex items-center justify-center mb-6">
                <Users2 className="w-6 h-6 text-green-500" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Global Community</h3>
              <p className="text-white/70">
                Connect with students and teachers from around the world, share projects, and participate in musical challenges.
              </p>
            </motion.div>
          </div>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            viewport={{ once: true }}
            className="mt-12 text-center"
          >
            <Link href="/education">
              <Button 
                size="lg" 
                className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-8 py-6 text-lg font-medium hover:opacity-90"
              >
                Explore Courses <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>
      
      {/* New AI music video creation section */}
      <section className="py-24 relative overflow-hidden bg-zinc-950">
        <div className="absolute inset-0 z-0 opacity-80">
          <video 
            autoPlay 
            loop 
            muted 
            playsInline
            disablePictureInPicture
            disableRemotePlayback
            className="w-full h-full object-cover"
          >
            <source src="/assets/Standard_Mode_Generated_Video (5).mp4" type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/80 to-transparent" />
        </div>
        
        <div className="container relative z-10 mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-12">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="md:w-1/2"
            >
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                Create Music Videos with <span className="text-gradient">Artificial Intelligence</span>
              </h2>
              <p className="text-white/70 text-lg mb-8">
                Transform your songs into professional music videos in minutes, not weeks.
                Our AI technology generates videos that perfectly complement your musical style and artistic vision.
              </p>
              
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="rounded-full bg-purple-500/20 p-2 mt-1">
                    <Check className="w-5 h-5 text-purple-500" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">Instant Generation</h3>
                    <p className="text-white/70">Create professional music videos in minutes, without the need for expensive equipment.</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="rounded-full bg-purple-500/20 p-2 mt-1">
                    <Check className="w-5 h-5 text-purple-500" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">Complete Creative Control</h3>
                    <p className="text-white/70">Customize every aspect of the video, from visual style to narrative and special effects.</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="rounded-full bg-purple-500/20 p-2 mt-1">
                    <Check className="w-5 h-5 text-purple-500" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">Music Integration</h3>
                    <p className="text-white/70">Our AI analyzes your song to create visuals that perfectly synchronize with the rhythm and energy.</p>
                  </div>
                </div>
              </div>
              
              <div className="mt-10 flex flex-wrap gap-4">
                <Link href="/music-video">
                  <Button 
                    size="lg" 
                    className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-6 text-lg font-medium hover:opacity-90"
                  >
                    Create Music Video <Video className="ml-2 w-5 h-5" />
                  </Button>
                </Link>
                
                <Link href="/videos">
                  <Button 
                    size="lg" 
                    variant="outline" 
                    className="border-white px-6 py-6 text-lg font-medium hover:bg-white/10"
                  >
                    View Examples
                  </Button>
                </Link>
              </div>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              viewport={{ once: true }}
              className="md:w-1/2 aspect-video relative"
            >
              <div className="rounded-xl overflow-hidden border-2 border-purple-500/50 shadow-2xl shadow-purple-500/20">
                <video 
                  autoPlay 
                  loop 
                  muted 
                  playsInline
                  disablePictureInPicture
                  disableRemotePlayback
                  className="w-full h-full object-cover"
                  poster="/assets/video-thumbnail.jpg"
                >
                  <source src="/assets/Standard_Mode_Generated_Video (6).mp4" type="video/mp4" />
                </video>
              </div>
              
              {/* Stylized playback controls as decoration */}
              <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between gap-2 bg-black/50 backdrop-blur-sm rounded-lg p-3">
                <div className="w-2/3 h-1 bg-white/20 rounded-full overflow-hidden">
                  <div className="w-1/2 h-full bg-purple-500 rounded-full"></div>
                </div>
                <div className="flex gap-2">
                  <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center">
                    <div className="w-4 h-4 text-white flex items-center justify-center">⏸️</div>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                    <Volume2 className="w-4 h-4 text-white" />
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Featured AI Music Video Example */}
      <section className="py-24 relative overflow-hidden bg-zinc-900">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Featured <span className="text-gradient">AI Music Video</span>
            </h2>
            <p className="text-white/70 max-w-2xl mx-auto text-lg">
              Check out this example of a professionally generated music video created with our AI technology.
            </p>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            viewport={{ once: true }}
            className="max-w-4xl mx-auto rounded-xl overflow-hidden shadow-2xl shadow-purple-500/20 border-2 border-purple-500/30"
          >
            <div className="aspect-video relative">
              <iframe 
                className="w-full h-full absolute inset-0"
                src="https://www.youtube.com/embed/O90iHkU3cPU?si=fkUJqyJ_F0tYJUxY" 
                title="AI Generated Music Video"
                frameBorder="0" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                allowFullScreen
              ></iframe>
            </div>
            
            <div className="bg-zinc-800 p-6">
              <h3 className="text-xl font-bold text-white mb-2">Professional Quality Music Visualization</h3>
              <p className="text-white/70">
                This video demonstrates the advanced capabilities of our AI technology in creating dynamic, 
                synchronized visuals that perfectly match the mood and rhythm of the music.
              </p>
              
              <div className="mt-6 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Play className="w-5 h-5 text-purple-400" />
                  <span className="text-white/70">AI-Generated • 4K Quality</span>
                </div>
                
                <Link href="/music-video">
                  <Button 
                    variant="ghost" 
                    className="text-purple-400 hover:text-purple-300 hover:bg-purple-500/10"
                  >
                    Create Your Own <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}