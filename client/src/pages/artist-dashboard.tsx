import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { ScrollArea } from "../components/ui/scroll-area";
import { motion } from "framer-motion";
import {
  Music2,
  Shield,
  Upload,
  TrendingUp,
  Globe,
  Headphones,
  Radio,
  Smartphone,
  CheckCircle2,
  Clock,
  Sparkles,
  Zap,
  BarChart3,
  DollarSign,
  Rocket,
  Network,
  Gauge,
  Users,
  ArrowRight,
  Disc3,
  Waves,
} from "lucide-react";
import { Badge } from "../components/ui/badge";
import { RightsManagementCard } from "../components/rights/rights-management-card";
import { DistributionCard } from "../components/distribution/distribution-card";
import { TokenizationPanel } from "../components/tokenization/tokenization-panel";
import { useAuth } from "../hooks/use-auth";

// Placeholder images - will be generated
const aggregatorDashboardImg = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='400'%3E%3Crect fill='%23222' width='800' height='400'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='Arial' font-size='20' fill='%23fff'%3EMusicAggregator Dashboard%3C/text%3E%3C/svg%3E";
const networkVisualizationImg = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='400'%3E%3Crect fill='%23222' width='800' height='400'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='Arial' font-size='20' fill='%23fff'%3EDistribution Network%3C/text%3E%3C/svg%3E";
const controlPanelImg = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='400'%3E%3Crect fill='%23222' width='800' height='400'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='Arial' font-size='20' fill='%23fff'%3EControl Panel%3C/text%3E%3C/svg%3E";

export default function DistributionTools() {
  const { user } = useAuth();
  const [hoveredPlatform, setHoveredPlatform] = useState<string | null>(null);

  const aggregatorFeatures = [
    {
      icon: Disc3,
      title: "Multi-Platform Hub",
      description: "Manage all your music distribution from a single, unified dashboard"
    },
    {
      icon: TrendingUp,
      title: "Smart Analytics",
      description: "Real-time insights into streams, earnings, and audience growth across all platforms"
    },
    {
      icon: Users,
      title: "Collaboration Tools",
      description: "Connect with other artists and manage joint releases effortlessly"
    },
    {
      icon: Zap,
      title: "Instant Distribution",
      description: "Upload once and go live on 150+ platforms within 24-48 hours"
    }
  ];

  const platforms = [
    { name: "Spotify", icon: Headphones, color: "from-green-500 to-green-600" },
    { name: "Apple Music", icon: Music2, color: "from-pink-500 to-rose-500" },
    { name: "YouTube Music", icon: Radio, color: "from-red-500 to-red-600" },
    { name: "Amazon Music", icon: Headphones, color: "from-blue-500 to-cyan-500" },
    { name: "TikTok", icon: Smartphone, color: "from-purple-500 to-pink-500" },
    { name: "Instagram", icon: Smartphone, color: "from-orange-500 to-pink-500" },
    { name: "Deezer", icon: Radio, color: "from-orange-500 to-amber-500" },
    { name: "Tidal", icon: Music2, color: "from-slate-500 to-slate-600" },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-background via-background to-orange-950/5 text-gray-100">
      <main className="flex-1 pt-0">
        {/* HERO SECTION - AGGREGATOR FOCUSED */}
        <div className="relative w-full overflow-hidden">
          {/* Background gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-orange-600/20 via-background to-blue-900/20" />
          
          {/* Animated grid background */}
          <div className="absolute inset-0 opacity-20">
            <div className="absolute inset-0" style={{
              backgroundImage: 'linear-gradient(90deg, transparent 24%, rgba(255,140,0,.1) 25%, rgba(255,140,0,.1) 26%, transparent 27%, transparent 74%, rgba(255,140,0,.1) 75%, rgba(255,140,0,.1) 76%, transparent 77%, transparent), linear-gradient(0deg, transparent 24%, rgba(255,140,0,.1) 25%, rgba(255,140,0,.1) 26%, transparent 27%, transparent 74%, rgba(255,140,0,.1) 75%, rgba(255,140,0,.1) 76%, transparent 77%, transparent)',
              backgroundSize: '50px 50px'
            }} />
          </div>

          {/* Content */}
          <div className="relative z-10 container mx-auto px-4 md:px-8 py-12 md:py-20">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 items-center">
              {/* Left: Text Content */}
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
                className="space-y-6"
              >
                <div className="space-y-2">
                  <Badge className="w-fit bg-gradient-to-r from-orange-500 to-pink-500 text-white border-none shadow-lg">
                    🚀 The Future of Music Distribution
                  </Badge>
                  <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="text-4xl sm:text-5xl md:text-6xl font-black bg-clip-text text-transparent bg-gradient-to-r from-orange-400 via-pink-400 to-orange-600 drop-shadow-lg leading-tight"
                  >
                    Music Aggregator Platform
                  </motion.h1>
                </div>

                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-lg md:text-xl text-gray-300 max-w-xl leading-relaxed"
                >
                  Coming Soon: The all-in-one platform designed for modern musicians. Distribute your music, manage rights, analyze performance, and collaborate — all from one powerful dashboard.
                </motion.p>

                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="text-base text-gray-400"
                >
                  Reach 150+ streaming platforms, keep 100% of your royalties, and build your fanbase with intelligent tools built for artists like you.
                </motion.p>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="flex flex-col sm:flex-row gap-4 pt-4"
                >
                  <Button className="bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white font-bold py-6 px-8 rounded-lg text-lg shadow-lg hover:shadow-xl transition-all">
                    Join Waitlist <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                  <Button variant="outline" className="border-orange-500/50 text-white font-bold py-6 px-8 rounded-lg text-lg hover:bg-orange-500/10">
                    Learn More
                  </Button>
                </motion.div>

                {/* Stats Row */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="grid grid-cols-3 gap-4 pt-8"
                >
                  <div className="text-center">
                    <div className="text-2xl md:text-3xl font-black text-orange-500">150+</div>
                    <div className="text-xs md:text-sm text-gray-400">Platforms</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl md:text-3xl font-black text-orange-500">100%</div>
                    <div className="text-xs md:text-sm text-gray-400">Royalties</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl md:text-3xl font-black text-orange-500">24-48h</div>
                    <div className="text-xs md:text-sm text-gray-400">Go Live</div>
                  </div>
                </motion.div>
              </motion.div>

              {/* Right: Featured Image */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3, duration: 0.6 }}
                className="relative"
              >
                <div className="relative rounded-2xl overflow-hidden border-2 border-orange-500/30 shadow-2xl">
                  <img 
                    src={aggregatorDashboardImg} 
                    alt="Music Aggregator Dashboard" 
                    className="w-full h-auto"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
                </div>

                {/* Floating badge */}
                <motion.div
                  animate={{ y: [0, 10, 0] }}
                  transition={{ duration: 3, repeat: Infinity }}
                  className="absolute -bottom-4 -right-4 bg-gradient-to-r from-orange-500 to-pink-500 rounded-full p-4 shadow-lg"
                >
                  <div className="text-white font-bold text-sm flex items-center gap-2">
                    <Rocket className="h-4 w-4" />
                    Coming Soon
                  </div>
                </motion.div>
              </motion.div>
            </div>
          </div>
        </div>

        {/* AGGREGATOR FEATURES SECTION */}
        <ScrollArea className="flex-1">
          <div className="container mx-auto px-4 py-16 space-y-16">
            {/* Features Grid */}
            <motion.section
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="space-y-8"
            >
              <div className="text-center space-y-4">
                <h2 className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-400 to-pink-400">
                  Why Choose Our Aggregator?
                </h2>
                <p className="text-gray-400 max-w-2xl mx-auto text-lg">
                  Everything you need to succeed as an independent artist in one powerful platform
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {aggregatorFeatures.map((feature, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    viewport={{ once: true }}
                    className="group relative"
                  >
                    <Card className="h-full bg-gradient-to-br from-orange-500/5 to-pink-500/5 border-orange-500/20 hover:border-orange-500/40 transition-all hover:shadow-xl hover:shadow-orange-500/20">
                      <CardHeader>
                        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-orange-500 to-pink-500 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                          <feature.icon className="h-6 w-6 text-white" />
                        </div>
                        <CardTitle className="text-lg">{feature.title}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-gray-400">{feature.description}</p>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </motion.section>

            {/* NETWORK VISUALIZATION */}
            <motion.section
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="space-y-8"
            >
              <div className="text-center space-y-4">
                <Badge className="mx-auto bg-gradient-to-r from-blue-500 to-cyan-500 text-white border-none">
                  <Network className="h-3 w-3 mr-2" />
                  Distribution Network
                </Badge>
                <h2 className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-400 to-pink-400">
                  Global Reach at Your Fingertips
                </h2>
              </div>

              <div className="rounded-2xl overflow-hidden border-2 border-orange-500/20 shadow-xl">
                <img 
                  src={networkVisualizationImg} 
                  alt="Distribution Network" 
                  className="w-full h-auto"
                />
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {platforms.map((platform, index) => (
                  <motion.div
                    key={platform.name}
                    initial={{ opacity: 0, scale: 0.8 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.05 }}
                    viewport={{ once: true }}
                    onMouseEnter={() => setHoveredPlatform(platform.name)}
                    onMouseLeave={() => setHoveredPlatform(null)}
                    className="relative group cursor-pointer"
                  >
                    <div className="p-4 rounded-xl bg-gradient-to-br from-background/40 to-background/20 backdrop-blur-sm border border-orange-500/20 hover:border-orange-500/50 transition-all hover:scale-105 hover:shadow-lg hover:shadow-orange-500/20">
                      <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${platform.color} flex items-center justify-center mb-3 mx-auto`}>
                        <platform.icon className="h-6 w-6 text-white" />
                      </div>
                      <p className="text-xs font-semibold text-center text-gray-200 group-hover:text-white transition-colors">
                        {platform.name}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.section>

            {/* CONTROL PANEL SECTION */}
            <motion.section
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="space-y-8"
            >
              <div className="text-center space-y-4">
                <Badge className="mx-auto bg-gradient-to-r from-purple-500 to-pink-500 text-white border-none">
                  <Gauge className="h-3 w-3 mr-2" />
                  Advanced Controls
                </Badge>
                <h2 className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-400 to-pink-400">
                  Professional-Grade Control Panel
                </h2>
                <p className="text-gray-400 max-w-2xl mx-auto">
                  Monitor every aspect of your music distribution with real-time analytics and intuitive controls
                </p>
              </div>

              <div className="rounded-2xl overflow-hidden border-2 border-orange-500/20 shadow-xl">
                <img 
                  src={controlPanelImg} 
                  alt="Control Panel" 
                  className="w-full h-auto"
                />
              </div>
            </motion.section>

            {/* HOW IT WORKS */}
            <motion.section
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="space-y-8"
            >
              <div className="text-center space-y-4">
                <h2 className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-400 to-pink-400">
                  How It Works
                </h2>
                <p className="text-gray-400 max-w-2xl mx-auto">
                  Get your music on 150+ platforms in just 3 simple steps
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {[
                  {
                    step: "1",
                    icon: Upload,
                    title: "Upload Your Music",
                    description: "Upload your tracks with metadata, artwork, and release details. Our smart system handles everything."
                  },
                  {
                    step: "2",
                    icon: Network,
                    title: "Select Platforms",
                    description: "Choose which platforms you want to distribute to, or go everywhere with one click."
                  },
                  {
                    step: "3",
                    icon: TrendingUp,
                    title: "Go Live & Earn",
                    description: "Your music goes live within 24-48 hours and you start earning royalties immediately."
                  }
                ].map((item, index) => (
                  <motion.div
                    key={item.step}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    viewport={{ once: true }}
                    className="relative"
                  >
                    <Card className="h-full bg-gradient-to-br from-orange-500/10 to-pink-500/10 border-orange-500/30 hover:border-orange-500/60 transition-all">
                      <CardHeader>
                        <div className="flex items-start justify-between mb-4">
                          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-orange-500 to-pink-500 flex items-center justify-center text-white font-bold text-lg">
                            {item.step}
                          </div>
                          {index < 2 && (
                            <ArrowRight className="h-6 w-6 text-orange-500 hidden md:block" />
                          )}
                        </div>
                        <item.icon className="h-8 w-8 text-orange-500 mb-2" />
                        <CardTitle>{item.title}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-gray-400">{item.description}</p>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </motion.section>

            {/* CURRENT TOOLS SECTION */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <div className="flex items-center gap-3 mb-8">
                <Zap className="h-6 w-6 text-orange-500" />
                <h2 className="text-2xl font-bold">Currently Available Tools</h2>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <RightsManagementCard />
                <DistributionCard />
              </div>
            </motion.div>

            {/* TOKENIZATION SECTION */}
            {user && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                viewport={{ once: true }}
              >
                <div className="flex items-center gap-3 mb-8">
                  <Sparkles className="h-6 w-6 text-orange-500" />
                  <h2 className="text-2xl font-bold">Music Tokenization (Web3)</h2>
                  <Badge className="bg-gradient-to-r from-purple-500 to-blue-500 text-white border-none">
                    Blockchain
                  </Badge>
                </div>
                <TokenizationPanel artistId={user.id} />
              </motion.div>
            )}

            {/* CTA SECTION */}
            <motion.section
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="py-12"
            >
              <Card className="relative overflow-hidden border-2 border-orange-500/50 bg-gradient-to-br from-orange-500/20 to-pink-500/20 backdrop-blur-sm">
                <div className="absolute inset-0 opacity-10">
                  <div className="absolute inset-0" style={{
                    backgroundImage: 'radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)',
                    backgroundSize: '40px 40px'
                  }} />
                </div>

                <CardContent className="relative pt-12 pb-12 text-center space-y-6">
                  <div className="space-y-3">
                    <h3 className="text-3xl md:text-4xl font-bold">Ready for the Future?</h3>
                    <p className="text-lg text-gray-300 max-w-2xl mx-auto">
                      Join thousands of artists waiting for the launch of our music aggregator platform
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                    <Button className="bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white font-bold py-6 px-8 rounded-lg text-lg shadow-lg hover:shadow-xl transition-all">
                      Join Waitlist <Rocket className="ml-2 h-5 w-5" />
                    </Button>
                  </div>

                  <div className="flex items-center justify-center gap-2 text-orange-400 font-semibold pt-2">
                    <Clock className="h-5 w-5 animate-pulse" />
                    Launching Q1 2025
                  </div>
                </CardContent>
              </Card>
            </motion.section>

            {/* FOOTER SPACING */}
            <div className="h-8" />
          </div>
        </ScrollArea>
      </main>
    </div>
  );
}
