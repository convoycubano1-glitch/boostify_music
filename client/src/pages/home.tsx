import { WaitlistModal } from "@/components/marketing/waitlist-modal";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SiGoogle } from "react-icons/si";
import {
  Music2, Users2, TrendingUp, FileText, Star, Home, Youtube, Globe,
  MessageCircle, BarChart2, Calendar, UserCircle2, Video, Sparkles, Wand2, Play, Volume2
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import { useFirebaseAuth } from "@/hooks/use-firebase-auth";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Footer } from "@/components/layout/footer";
import { CircularProgressbar, buildStyles } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";
import { useState, useEffect } from "react";
import { SuperAgent } from "@/components/agents/super-agent";

/* =============================
   VARIANTES PARA ANIMACIONES
============================= */
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

/* =============================
   DATOS ESTÁTICOS
============================= */
const features = [
  {
    icon: <Youtube className="h-6 w-6" />,
    title: "Strategic YouTube Promotion",
    description: "Boost your video visibility with targeted promotion and AI-powered audience engagement strategies"
  },
  {
    icon: <Music2 className="h-6 w-6" />,
    title: "Advanced Spotify Growth",
    description: "Optimize your Spotify presence with data-driven insights and algorithmic playlist targeting"
  },
  {
    icon: <Users2 className="h-6 w-6" />,
    title: "Professional PR Management",
    description: "Launch targeted PR campaigns and build your industry network with AI-assisted outreach"
  },
  {
    icon: <TrendingUp className="h-6 w-6" />,
    title: "Comprehensive Analytics",
    description: "Track your growth across all platforms with detailed insights and predictive trends"
  },
  {
    icon: <Globe className="h-6 w-6" />,
    title: "Global Audience Reach",
    description: "Expand your fanbase worldwide with smart targeting and localized promotion strategies"
  },
  {
    icon: <MessageCircle className="h-6 w-6" />,
    title: "Artist Community Hub",
    description: "Connect with industry professionals and fellow artists in our exclusive networking platform"
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

const plans = [
  {
    name: "Basic",
    price: "59.99",
    features: [
      "Advanced Spotify Analytics Dashboard",
      "Smart Instagram Growth Tools",
      "5,000 Guaranteed YouTube Views",
      "Professional Contract Templates",
      "Monthly Merchandise Design",
      "2 AI Models for Content Creation",
      "Email Support & Tutorials",
      "Basic Performance Analytics",
      "Social Media Content Calendar"
    ]
  },
  {
    name: "Pro",
    price: "99.99",
    popular: true,
    features: [
      "Premium Analytics Suite",
      "Advanced Instagram Campaign Manager",
      "25,000 Targeted YouTube Views",
      "Custom Contract Generator",
      "5 Premium Merch Designs Monthly",
      "Full AI Creative Suite Access",
      "Targeted PR Campaigns",
      "Automated Marketing Tools",
      "24/7 Priority Support",
      "Cross-Platform Analytics",
      "Content Strategy Planning"
    ]
  },
  {
    name: "Enterprise",
    price: "149.99",
    features: [
      "Complete Music Marketing Hub",
      "Spotify Algorithm Optimization",
      "Full-Service Instagram Management",
      "100,000 Strategic YouTube Views",
      "Advanced Legal Document System",
      "Unlimited Merch Design Service",
      "Exclusive AI Model Access",
      "Comprehensive PR Campaigns",
      "Custom Analytics Platform",
      "Dedicated Account Manager",
      "Multi-Platform Strategy",
      "Brand Development Suite"
    ]
  }
];

/* =============================
   COMPONENTE PRINCIPAL: HOME PAGE
============================= */
export default function HomePage() {
  const { signInWithGoogle } = useFirebaseAuth();
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [viewCount, setViewCount] = useState(0);
  const [progress, setProgress] = useState(0);

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

    return () => {
      clearInterval(viewInterval);
      clearInterval(progressInterval);
    };
  }, []);

  const handleGoogleLogin = async () => {
    try {
      await signInWithGoogle();
      toast({
        title: "Success",
        description: "Successfully logged in. Redirecting to dashboard..."
      });
      setLocation("/dashboard");
    } catch (error: any) {
      toast({
        title: "Authentication Error",
        description: "Could not sign in with Google. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Calculate days until launch
  const launchDate = new Date('2025-03-01T00:00:00');
  const now = new Date();
  const diffTime = launchDate.getTime() - now.getTime();
  const daysUntilLaunch = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return (
    <div className="min-h-screen bg-black text-white">
      <WaitlistModal />
      {/* HERO SECTION */}
      <section className="relative min-h-[100svh] flex items-center overflow-hidden">
        <video
          autoPlay
          loop
          playsInline
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover"
          src="/assets/Standard_Mode_Generated_Video (9).mp4"
        />
        <div className="absolute inset-0 bg-black/60" />
        <div className="container relative mx-auto px-4 py-12 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center space-y-8 max-w-4xl mx-auto"
          >
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-500 via-red-500 to-orange-500 leading-tight">
              Boostify Music
            </h1>
            <p className="text-lg md:text-xl lg:text-2xl text-white/90 max-w-3xl mx-auto leading-relaxed">
              The ultimate platform for artists to manage their marketing and grow their audience.
            </p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex flex-col items-center gap-6 mt-8"
            >
              <Button
                size="lg"
                onClick={handleGoogleLogin}
                className="relative overflow-hidden group bg-gradient-to-r from-orange-500 via-red-500 to-orange-500 hover:from-orange-600 hover:via-red-600 hover:to-orange-600 text-white shadow-xl transition-all duration-300 transform hover:scale-105"
                aria-label="Login with Google"
              >
                <span className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                <SiGoogle className="w-5 h-5 mr-2" />
                Login with Google
              </Button>

              {/* Calendar Button Container */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="relative w-full max-w-md"
              >
                <div className="relative bg-black/50 backdrop-blur-sm rounded-lg p-6 border border-orange-500/20">
                  <div className="flex flex-col items-center gap-4">
                    <div className="bg-orange-500/10 rounded-lg px-4 py-2 mb-2">
                      <p className="text-xl font-bold text-orange-500">
                        {daysUntilLaunch} days until launch!
                      </p>
                      <p className="text-sm text-white/70">March 1st, 2025</p>
                    </div>
                    <div className="flex items-center gap-2 text-orange-500">
                      <Calendar className="h-5 w-5" />
                      <span className="font-medium">Schedule a Meeting</span>
                    </div>
                    <a
                      href="https://calendar.google.com/calendar/u/0/share?slt=1AXpMJuZYDhB-BkgrwqPtJV3OxMcYlX3VCKPmB7BiEg7zOJ_W7I2ziBrk3kw2ieMOaQFtyX2OS85UlA"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full"
                    >
                      <Button
                        className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white shadow-lg transition-all duration-300 transform hover:scale-105"
                      >
                        Join Pre-launch Meeting
                      </Button>
                    </a>
                    <p className="text-sm text-center text-white/70">
                      Get personalized insights about our platform
                    </p>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
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

      {/* Analytics Section - Moved before AI Music Video */}
      <section className="py-24 relative overflow-hidden">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto"
          >
            <div className="bg-black/20 backdrop-blur-lg rounded-xl p-6 relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-orange-500/20 to-red-500/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="relative">
                <div className="w-24 h-24 mx-auto mb-4">
                  <CircularProgressbar
                    value={progress}
                    text={`${progress}%`}
                    styles={buildStyles({
                      pathColor: `rgba(249, 115, 22, ${progress / 100})`,
                      textColor: '#fff',
                      trailColor: '#334155',
                      pathTransition: 'ease-in-out',
                    })}
                  />
                </div>
                <h3 className="text-xl font-bold text-center mb-2">Views Growth</h3>
                <p className="text-2xl font-bold text-center text-orange-500">
                  {viewCount.toLocaleString()}
                </p>
                <p className="text-sm text-center text-muted-foreground">Monthly Views</p>
              </div>
            </div>

            <div className="bg-black/20 backdrop-blur-lg rounded-xl p-6 relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-orange-500/20 to-red-500/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="relative">
                <div className="w-24 h-24 mx-auto mb-4 flex items-center justify-center">
                  <Users2 className="w-12 h-12 text-orange-500" />
                </div>
                <h3 className="text-xl font-bold text-center mb-2">Engagement</h3>
                <p className="text-2xl font-bold text-center text-orange-500">
                  {(viewCount * 0.15).toLocaleString()}
                </p>
                <p className="text-sm text-center text-muted-foreground">Active Users</p>
              </div>
            </div>

            <div className="bg-black/20 backdrop-blur-lg rounded-xl p-6 relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-orange-500/20 to-red-500/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="relative">
                <div className="w-24 h-24 mx-auto mb-4 flex items-center justify-center">
                  <TrendingUp className="w-12 h-12 text-orange-500" />
                </div>
                <h3 className="text-xl font-bold text-center mb-2">Growth Rate</h3>
                <p className="text-2xl font-bold text-center text-orange-500">
                  +{progress}%
                </p>
                <p className="text-sm text-center text-muted-foreground">Month over Month</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* AI Music Video Section */}
      <section className="py-12 md:py-16 relative overflow-hidden bg-black">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative max-w-4xl mx-auto"
        >
          {/* Video container */}
          <div className="relative rounded-xl overflow-hidden">
            <div className="aspect-video relative rounded-lg overflow-hidden">
              <iframe
                src="https://www.youtube.com/embed/O90iHkU3cPU?autoplay=1&mute=1&controls=0&loop=1&playlist=O90iHkU3cPU&showinfo=0&rel=0&modestbranding=1"
                className="absolute inset-0 w-full h-full"
                allow="autoplay; encrypted-media"
                frameBorder="0"
                title="Redwine - Eternal Love"
              />

              {/* Minimal gradient for text readability */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center px-8">
                  <h2 className="text-4xl md:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-500 to-red-500 leading-tight mb-6">
                    AI Music Video Creation
                  </h2>
                  <p className="text-xl md:text-2xl text-white/90 max-w-2xl mx-auto leading-relaxed">
                    Transform your music into stunning visual experiences with our AI-powered video generation
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Button without background */}
          <div className="mt-8 text-center">
            <Link href="/music-video-creator">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-8 py-4 rounded-full font-bold text-lg shadow-xl hover:shadow-2xl transition-all duration-300"
              >
                Create Your AI Music Video
                <Video className="inline-block ml-2 h-6 w-6" />
              </motion.button>
            </Link>
          </div>
        </motion.div>
      </section>

      {/* Features Section - Enhanced with modern design */}
      <section className="py-12 md:py-16 container mx-auto px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.5))] dark:bg-grid-black/10" />
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-orange-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-red-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-2000" />

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="space-y-12 relative"
        >
          <div className="text-center space-y-4">
            <h2 className="text-3xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-500 to-red-500">
              Everything You Need
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Comprehensive tools to boost your music career and reach new audiences
            </p>
          </div>

          {/* Video showcase */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative max-w-4xl mx-auto mb-16"
          >
            <div className="relative rounded-xl overflow-hidden bg-black/50 backdrop-blur-sm p-2">
              {/* Video */}
              <div className="relative group">
                <video
                  className="w-full rounded-lg relative"
                  controls
                  autoPlay
                  loop
                  muted
                  controlsList="nodownload"
                  className="custom-video-player"
                >
                  <source src="/assets/indications/Welcome to Boostify Music 1.mp4" type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
                {/* Custom Controls Overlay */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/50 to-transparent">
                    <div className="flex items-center justify-between">
                      <button
                        className="text-white hover:text-orange-500 transition-colors"
                        onClick={(e) => {
                          const video = e.currentTarget.parentElement?.parentElement?.parentElement?.previousElementSibling as HTMLVideoElement;
                          if (video) {
                            if (video.paused) {
                              video.play();
                            } else {
                              video.pause();
                            }
                          }
                        }}
                      >
                        <Play className="w-6 h-6" />
                      </button>
                      <button
                        className="text-white hover:text-orange-500 transition-colors"
                        onClick={(e) => {
                          const video = e.currentTarget.parentElement?.parentElement?.parentElement?.previousElementSibling as HTMLVideoElement;
                          if (video) {
                            video.muted = !video.muted;
                          }
                        }}
                      >
                        <Volume2 className="w-6 h-6" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Features grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, i) => (
              <motion.div
                key={i}
                variants={itemVariants}
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="relative group"
              >
                <div className="absolute inset-0 bg-orange-500/20 rounded-lg blur-xl group-hover:bg-orange-500/30 transition-all duration-300" />
                <Card className="p-6 bg-black/50 backdrop-blur-sm border-orange-500/10 relative h-full">
                  <div className="h-12 w-12 rounded-lg bg-orange-500/10 flex items-center justify-center mb-4 group-hover:bg-orange-500/20 transition-colors">
                    <div className="text-orange-500">{feature.icon}</div>
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Production Tools Section - Keep existing section */}
      <section className="py-24 relative overflow-hidden bg-gradient-to-b from-orange-500/5 to-background">
        <video
          autoPlay
          loop
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
          src="/assets/Standard_Mode_Generated_Video (9).mp4"
        />
        <div className="absolute inset-0 bg-black/60" />
        <div className="absolute inset-0 bg-gradient-to-b from-orange-500/10 via-background/40 to-background" />

        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex flex-col md:flex-row items-center gap-12"
          >
            <div className="flex-1 space-y-6">
              <div className="flex items-center gap-2 text-orange-500">
                <Music2 className="h-8 w-8" />
                <span className="text-lg font-medium">Production Tools</span>
              </div>
              <h2 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-500 to-red-500">
                AI-Powered Music Production
              </h2>
              <p className="text-lg text-white/90">
                Transform your creative process with our advanced AI tools. Generate custom musician profiles,
                create unique musical content, and collaborate with AI-generated artists tailored to your style.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-6 bg-black/10 backdrop-blur-sm rounded-lg border border-orange-500/20 hover:bg-black/20 transition-all duration-300">
                  <h3 className="text-xl font-bold text-orange-500">Virtual Musicians</h3>
                  <p className="text-sm text-white/80">AI-generated artist profiles and images</p>
                </div>
                <div className="p-6 bg-black/10 backdrop-blur-sm rounded-lg border border-orange-500/20 hover:bg-black/20 transition-all duration-300">
                  <h3 className="text-xl font-bold text-orange-500">Smart Collaboration</h3>
                  <p className="text-sm text-white/80">Find the perfect match for your music</p>
                </div>
                <div className="p-6 bg-black/10 backdrop-blur-sm rounded-lg border border-orange-500/20 hover:bg-black/20 transition-all duration-300">
                  <h3 className="text-xl font-bold text-orange-500">Custom Generation</h3>
                  <p className="text-sm text-white/80">Create unique content for your brand</p>
                </div>
                <div className="p-6 bg-black/10 backdrop-blur-sm rounded-lg border border-orange-500/20 hover:bg-black/20 transition-all duration-300">
                  <h3 className="text-xl font-bold text-orange-500">AI Analytics</h3>
                  <p className="text-sm text-white/80">Data-driven music production</p>
                </div>
              </div>
            </div>
            <div className="flex-1 relative">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg blur opacity-75" />
              <div className="relative bg-black/20 backdrop-blur-sm rounded-lg p-8 border border-orange-500/20">
                <h3 className="text-xl font-semibold mb-6 text-white">Featured AI Tools</h3>
                <div className="space-y-6">
                  <div className="flex items-center gap-4 group hover:bg-black/10 p-4 rounded-lg transition-all duration-300">
                    <div className="w-12 h-12 rounded-lg bg-orange-500/10 flex items-center justify-center group-hover:bg-orange-500/20">
                      <FileText className="h-6 w-6 text-orange-500" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-white">Musician Profile Generator</h4>
                      <p className="text-sm text-white/70">Create detailed artist bios and images</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 group hover:bg-black/10 p-4 rounded-lg transition-all duration-300">
                    <div className="w-12 h-12 rounded-lg bg-orange-500/10 flex items-center justify-center group-hover:bg-orange-500/20">
                      <Music2 className="h-6 w-6 text-orange-500" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-white">Genre Analysis</h4>
                      <p className="text-sm text-white/70">AI-powered music style insights</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 group hover:bg-black/10 p-4 rounded-lg transition-all duration-300">
                    <div className="w-12 h-12 rounded-lg bg-orange-500/10 flex items-center justify-center group-hover:bg-orange-500/20">
                      <Users2 className="h-6 w-6 text-orange-500" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-white">Collaboration Matcher</h4>
                      <p className="text-sm text-white/70">Find your perfect musical match</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Specialized Services Section */}
      <section className="py-24 relative overflow-hidden bg-gradient-to-b from-orange-500/5 to-background">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center space-y-8 max-w-4xl mx-auto mb-12"
          >
            <h2 className="text-3xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-500 to-red-500">
              AI-Powered Music Tools
            </h2>
            <p className="text-lg text-muted-foreground">
              Explore our specialized suite of AI tools designed to enhance your music career
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Artist Image Advisor */}
            <Link href="/artist-image-advisor">
              <motion.div
                whileHover={{ scale: 1.02 }}
                className="relative groupcursor-pointer"
              >
                <div className="absolute inset0 bg-gradient-to-r from-orange-500/20 to-red-500/20 rounded-lg blur-xl group-hover:bg-orange-500/30 transition-all duration-300" />
                <Card className="p-8 bg-black/50 backdrop-blur-sm border-orange-500/10 relative h-full overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 rounded-full blur-3xl group-hover:bg-orange-500/20 transition-all duration-300" />

                  <div className="flex items-start gap-6">
                    <div className="p-4 rounded-2xl bg-orange-500/10 group-hover:bg-orange-500/20 transition-all duration-300">
                      <UserCircle2 className="h-8 w-8 text-orange-500" />
                    </div>
                    <div className="flex-1 space-y-4">
                      <h3 className="text-2xl font-bold">Artist Image Advisor</h3>
                      <p className="text-muted-foreground text-lg">
                        Create stunning visual identities with AI-powered image generation and style recommendations
                      </p>
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <div className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                          <span>Advanced AI image generation for artist photos</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <div className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                          <span>Style analysis and recommendations</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <div className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                          <span>Brand identity development</span>
                        </div>
                      </div>
                      <Button variant="ghost" className="mt-4 group-hover:bg-orange-500/20 transition-all duration-300">
                        Explore Image Advisor <FileText className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            </Link>

            {/* Record Label Services */}
            <Link href="/record-label-services">
              <motion.div
                whileHover={{ scale: 1.02 }}
                className="relative group cursor-pointer"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-orange-500/20 to-red-500/20 rounded-lg blur-xl group-hover:bg-orange-500/30 transition-all duration-300" />
                <Card className="p-8 bg-black/50 backdrop-blur-sm border-orange-500/10 relative h-full overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 rounded-full blur-3xl group-hover:bg-orange-500/20 transition-all duration-300" />

                  <div className="flex items-start gap-6">
                    <div className="p-4 rounded-2xl bg-orange-500/10 group-hover:bg-orange-500/20 transition-all duration-300">
                      <Music2 className="h-8 w-8 text-orange-500" />
                    </div>
                    <div className="flex-1 space-y-4">
                      <h3 className="text-2xl font-bold">Record Label Services</h3>
                      <p className="text-muted-foreground text-lg">
                        Professional label management tools and distribution services for independent artists
                      </p>
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <div className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                          <span>Digital distribution to major platforms</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <div className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                          <span>Royalty tracking and management</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <div className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                          <span>Marketing and promotion tools</span>
                        </div>
                      </div>
                      <Button variant="ghost" className="mt-4 group-hover:bg-orange-500/20 transition-all duration-300">
                        Explore Label Services <FileText className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            </Link>

            {/* AI Agents */}
            <Link href="/ai-agents">
              <motion.div
                whileHover={{ scale: 1.02 }}
                className="relative group cursor-pointer"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-orange-500/20 to-red-500/20 rounded-lg blur-xl group-hover:bg-orange-500/30 transition-all duration-300" />
                <Card className="p-8 bg-black/50 backdrop-blur-sm border-orange-500/10 relative h-full overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 rounded-full blur-3xl group-hover:bg-orange-500/20 transition-all duration-300" />

                  <div className="flex items-start gap-6">
                    <div className="p-4 rounded-2xl bg-orange-500/10 group-hover:bg-orange-500/20 transition-all duration-300">
                      <Sparkles className="h-8 w-8 text-orange-500" />
                    </div>
                    <div className="flex-1 space-y-4">
                      <h3 className="text-2xl font-bold">AI Agents</h3>
                      <p className="text-muted-foreground text-lg">
                        Intelligent virtual assistants for marketing, promotion, and career guidance
                      </p>
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <div className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                          <span>Automated social media management</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <div className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                          <span>Personalized career strategies</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <div className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                          <span>24/7 virtual assistant support</span>
                        </div>
                      </div>
                      <Button variant="ghost" className="mt-4 group-hover:bg-orange-500/20 transition-all duration-300">
                        Explore AI Agents <FileText className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            </Link>

            {/* AI Music Video */}
            <Link href="/music-video-creator">
              <motion.div
                whileHover={{ scale: 1.02 }}
                className="relative group cursor-pointer"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-orange-500/20 to-red-500/20 rounded-lg blur-xl group-hover:bg-orange-500/30 transition-all duration-300" />
                <Card className="p-8 bg-black/50 backdrop-blur-sm border-orange-500/10 relative h-full overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 rounded-full blur-3xl group-hover:bg-orange-500/20 transition-all duration-300" />

                  <div className="flex items-start gap-6">
                    <div className="p-4 rounded-2xl bg-orange-500/10 group-hover:bg-orange-500/20 transition-all duration-300">
                      <Video className="h-8 w-8 text-orange-500" />
                    </div>
                    <div className="flex-1 space-y-4">
                      <h3 className="text-2xl font-bold">AI Music Video</h3>
                      <p className="text-muted-foreground text-lg">
                        Create professional music videos with AI-powered video generation and editing tools
                      </p>
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <div className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                          <span>AI video generation from music</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <div className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                          <span>Advanced video editing tools</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <div className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                          <span>Visual effects and animations</span>
                        </div>
                      </div>
                      <Button variant="ghost" className="mt-4 group-hover:bg-orange-500/20 transition-all duration-300">
                        Explore Music Video Creator <FileText className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            </Link>
          </div>
        </div>
      </section>

      {/* YouTube Views Section */}
      <section className="py-24 relative overflow-hidden bg-gradient-to-b from-orange-500/5 to-background">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex flex-col md:flex-row items-center gap-12"
          >
            <div className="flex-1 space-y-6">
              <div className="flex items-center gap-2 text-orange-500">
                <Youtube className="h-8 w-8" />
                <span className="text-lg font-medium">YouTube Growth</span>
              </div>
              <h2 className="text-4xl font-bold">Boost Your Video Presence</h2>
              <p className="text-lg text-muted-foreground">
                Our advanced YouTube promotion strategies help you reach wider audiences and increase engagement on your videos. Get real views, likes, and subscribers through our targeted promotion campaigns.
              </p>
              <div className="flex gap-4">
                <div className="p-4 bg-orange-500/10 rounded-lg">
                  <h3 className="text-2xl font-bold text-orange-500">500K+</h3>
                  <p className="text-sm text-muted-foreground">Monthly Views</p>
                </div>
                <div className="p-4 bg-orange-500/10 rounded-lg">
                  <h3 className="text-2xl font-bold text-orange-500">50K+</h3>
                  <p className="text-sm text-muted-foreground">New Subscribers</p>
                </div>
                <div className="p-4 bg-orange-500/10 rounded-lg">
                  <h3 className="text-2xl font-bold text-orange-500">90%</h3>
                  <p className="text-sm text-muted-foreground">Engagement Rate</p>
                </div>
              </div>
            </div>
            <div className="flex-1 relative">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg blur opacity-75" />
              <div className="relative bg-background rounded-lg p-8">
                <h3 className="text-xl font-semibold mb-4">Growth Analytics</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Views Growth</span>
                    <div className="w-48 h-2 bg-muted rounded-full overflow-hidden">
                      <div className="w-4/5 h-full bg-orange-500" />
                    </div>
                    <span className="text-sm font-medium">80%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Engagement Rate</span>
                    <div className="w-48 h-2 bg-muted rounded-full overflow-hidden">
                      <div className="w-11/12 h-full bg-orange-500" />
                    </div>
                    <span className="text-sm font-medium">90%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Subscriber Growth</span>
                    <div className="w-48 h-2 bg-muted rounded-full overflow-hidden">
                      <div className="w-3/4 h-full bg-orange-500" />
                    </div>
                    <span className="text-sm font-medium">75%</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Career Management Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center space-y-8 max-w-4xl mx-auto"
          >
            <h2 className="text-3xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-500 to-red-500">
              Take Control of Your Career
            </h2>
            <p className="text-lg text-muted-foreground">
              Our platform provides all the tools you need to manage and grow your music career professionally. From analytics to promotion, we've got you covered.
            </p>
            <div className="grid md:grid-cols-3 gap-6">
              <Card className="p-6 bg-black/50 backdrop-blur-sm border-orange-500/10">
                <BarChart2 className="h-8 w-8 text-orange-500 mb-4" />
                <h3 className="text-xl font-semibold mb-2">Data-Driven Growth</h3>
                <p className="text-muted-foreground">
                  Make informed decisions with comprehensive analytics and insights
                </p>
              </Card>
              <Card className="p-6 bg-black/50 backdrop-blur-sm border-orange-500/10">
                <Globe className="h-8 w-8 text-orange-500 mb-4" />
                <h3 className="text-xl font-semibold mb-2">Global Reach</h3>
                <p className="text-muted-foreground">
                  Connect with fans worldwide through our international network
                </p>
              </Card>
              <Card className="p-6 bg-black/50 backdrop-blur-sm border-orange-500/10">
                <MessageCircle className="h-8 w-8 text-orange-500 mb-4" />
                <h3 className="text-xl font-semibold mb-2">Artist Community</h3>
                <p className="text-muted-foreground">
                  Network with other artists and industry professionals
                </p>
              </Card>
            </div>
          </motion.div>
        </div>
      </section>

      {/* TESTIMONIALS SECTION */}
      <section className="py-24 bg-gradient-to-b from-orange-500/5 to-background">
        <div className="container mx-auto px-4">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="space-y-12"
          >
            <div className="text-center space-y-4">
              <h2 className="text-3xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-500 to-red-500">
                Success Stories
              </h2>
              <p className="text-muted-foreground text-lg">
                See what our clients are saying about us
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {testimonials.map((testimonial, i) => (
                <motion.div
                  key={i}
                  variants={itemVariants}
                  whileHover={{ y: -10 }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  className="relative group"
                >
                  <div className="absolute inset-0 bg-orange-500/10 rounded-lg blur-xl group-hover:bg-orange-500/20 transition-all duration-300" />
                  <Card className="p-6 bg-black/50 backdrop-blur-sm border-orange-500/10 relative">
                    <div className="flex gap-1 mb-4">
                      {[...Array(testimonial.rating)].map((_, j) => (
                        <Star key={j} className="h-4 w-4 fill-orange-500 text-orange-500" />
                      ))}
                    </div>
                    <p className="mb-4 text-muted-foreground">{testimonial.content}</p>
                    <div className="border-t border-orange-500/10 pt-4">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <div className="absolute -inset-0.5 bg-gradient-to-r from-orange-500 to-red-500 rounded-full blur opacity-75" />
                          <img
                            src={testimonial.avatar}
                            alt={testimonial.name}
                            className="relative w-10 h-10 rounded-full object-cover"
                          />
                        </div>
                        <div>
                          <p className="font-semibold">{testimonial.name}</p>
                          <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                        </div>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* SPOTIFY SECTION */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 via-background to-background" />
        <div className="container mx-auto px-4 relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex flex-col md:flex-row items-center gap-12"
          >
            <div className="flex-1 space-y-6">
              <div className="flex items-center gap-2 text-orange-500">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-8 w-8"
                >
                  <path d="M3 18V6h1.5l1.5 7 1.5-7H9v12h-1.5l-1.5-7-1.5 7H3zm6 0V6h1.5l1.5 7 1.5-7H15v12h-1.5l-1.5-7-1.5 7H9zM16 12h5l-1.5 3.5L20 18h-5l1.5-3.5L16 12z"></path>
                </svg>
                <span className="text-lg font-medium">Spotify Integration</span>
              </div>
              <h2 className="text-4xl font-bold">Connect With Your Audience</h2>
              <p className="text-lg text-muted-foreground">
                Seamlessly integrate with Spotify to manage your playlists, track performance metrics, and grow your listener base.
              </p>
              <Button
                className="bg-orange-500 hover:bg-orange-600 text-white gap-2"
                aria-label="Connect Spotify"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-5 w-5"
                >
                  <path d="M3 18V6h1.5l1.5 7 1.5-7H9v12h-1.5l-1.5-7-1.5 7H3zm6 0V6h1.5l1.5 7 1.5-7H15v12h-1.5l-1.5-7-1.5 7H9zM16 12h5l-1.5 3.5L20 18h-5l1.5-3.5L16 12z"></path>
                </svg>
                Connect Spotify
              </Button>
            </div>
            <div className="flex-1 relative">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg blur opacity-75" />
              <div className="relative bg-background rounded-lg p-8">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Monthly Listeners</span>
                    <span className="text-xl font-bold">245.8K</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Playlist Reaches</span>
                    <span className="text-xl font-bold">1.2M</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Engagement Rate</span>
                    <span className="text-xl font-bold">4.7%</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* PRICING SECTION */}
      <section className="py-24 container mx-auto px-4">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="space-y-12"
        >
          <div className="text-center space-y-4">
            <h2 className="text-3xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-500 to-red-500">
              Choose Your Plan
            </h2>
            <p className="text-muted-foreground text-lg">
              Flexible plans for every stage of your career
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {plans.map((plan, i) => (
              <motion.div
                key={i}
                variants={itemVariants}
                whileHover={{ y: -10 }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="relative group"
              >
                <div className="absolute inset-0 bg-orange-500/10 rounded-lg blur-xl group-hover:bg-orange-500/20 transition-all duration-300" />
                <Card
                  className={`p-6 relative ${
                    plan.popular
                      ? "border-orange-500 bg-orange-500/5"
                      : "bg-black/50 backdrop-blur-sm border-orange-500/10"
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <span className="bg-orange-500 text-white text-sm rounded-full px-3 py1">
                        Most Popular
                      </span>
                    </div>
                  )}
                  <div className="text-center mb-6">
                    <h3 className="text-xl font-semibold mb-2">{plan.name}</h3>
                    <div className="flex items-center justify-center gap-1">
                      <span className="text-3xl font-bold">${plan.price}</span>
                      <span className="text-muted-foreground">/mo</span>
                    </div>
                  </div>
                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature, j) => (
                      <li key={j} className="flex items-center gap-2">
                        <svg className="h-4 w-4 text-orange-500" viewBox="0 0 24 24">
                          <path
                            fill="none"
                            stroke="currentColor"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Button
                    className={`w-full ${
                      plan.popular ? "bg-orange-500 hover:bg-orange-600 text-white" : ""
                    }`}
                    variant={plan.popular ? "default" : "outline"}
                    aria-label="Get Started"
                  >
                    Get Started
                  </Button>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>
      <SuperAgent />
      <Footer />
    </div>
  );
}