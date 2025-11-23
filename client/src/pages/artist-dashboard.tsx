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
} from "lucide-react";
import { Badge } from "../components/ui/badge";
import { RightsManagementCard } from "../components/rights/rights-management-card";
import { DistributionCard } from "../components/distribution/distribution-card";
import { TokenizationPanel } from "../components/tokenization/tokenization-panel";
import { useAuth } from "../hooks/use-auth";

export default function DistributionTools() {
  const { user } = useAuth();
  
  return (
    <div className="min-h-screen flex flex-col bg-background text-gray-100">
      <main className="flex-1 pt-0">
        {/* Hero Section */}
        <div className="relative w-full h-[65vh] md:h-[75vh] overflow-hidden">
          <video
            autoPlay
            loop
            muted
            playsInline
            className="absolute inset-0 w-full h-full object-cover"
          >
            <source
              src="/src/images/videos/Standard_Mode_Generated_Video.mp4"
              type="video/mp4"
            />
          </video>
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/50 to-background" />
          
          <div className="absolute inset-0 z-10 flex flex-col justify-end">
            <div className="container mx-auto px-4 md:px-8 pb-6 md:pb-16">
              <div className="text-center md:text-left mb-4 md:mb-8 mt-auto max-w-2xl mx-auto md:mx-0">
                <motion.h1
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-3xl sm:text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-400 to-orange-600 drop-shadow-lg"
                >
                  Distribution Tools
                </motion.h1>
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="mt-2 text-base sm:text-lg md:text-xl text-white shadow-sm"
                >
                  Manage your music rights and distribution in one place
                </motion.p>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4 w-full mt-2 md:mt-4">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <Card className="p-3 sm:p-4 border-l-4 border-orange-500 bg-background/80 backdrop-blur-sm shadow-lg">
                    <div className="flex flex-col items-center text-center">
                      <Shield className="h-6 w-6 sm:h-8 sm:w-8 text-orange-500 mb-2" />
                      <p className="text-xs sm:text-sm font-medium text-muted-foreground">
                        Rights
                      </p>
                      <h3 className="text-lg sm:text-xl font-bold mt-1">Protected</h3>
                    </div>
                  </Card>
                </motion.div>
                
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <Card className="p-3 sm:p-4 border-l-4 border-orange-500 bg-background/80 backdrop-blur-sm shadow-lg">
                    <div className="flex flex-col items-center text-center">
                      <Globe className="h-6 w-6 sm:h-8 sm:w-8 text-orange-500 mb-2" />
                      <p className="text-xs sm:text-sm font-medium text-muted-foreground">
                        Platforms
                      </p>
                      <h3 className="text-lg sm:text-xl font-bold mt-1">150+</h3>
                    </div>
                  </Card>
                </motion.div>
                
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  <Card className="p-3 sm:p-4 border-l-4 border-orange-500 bg-background/80 backdrop-blur-sm shadow-lg">
                    <div className="flex flex-col items-center text-center">
                      <TrendingUp className="h-6 w-6 sm:h-8 sm:w-8 text-orange-500 mb-2" />
                      <p className="text-xs sm:text-sm font-medium text-muted-foreground">
                        Reach
                      </p>
                      <h3 className="text-lg sm:text-xl font-bold mt-1">Global</h3>
                    </div>
                  </Card>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                >
                  <Card className="p-3 sm:p-4 border-l-4 border-orange-500 bg-background/80 backdrop-blur-sm shadow-lg">
                    <div className="flex flex-col items-center text-center">
                      <DollarSign className="h-6 w-6 sm:h-8 sm:w-8 text-orange-500 mb-2" />
                      <p className="text-xs sm:text-sm font-medium text-muted-foreground">
                        Royalties
                      </p>
                      <h3 className="text-lg sm:text-xl font-bold mt-1">100%</h3>
                    </div>
                  </Card>
                </motion.div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <ScrollArea className="flex-1">
          <div className="container mx-auto px-4 py-10 space-y-10">
            {/* Active Tools Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="flex items-center gap-3 mb-6">
                <Zap className="h-6 w-6 text-orange-500" />
                <h2 className="text-2xl font-bold">Active Distribution Tools</h2>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <RightsManagementCard />
                <DistributionCard />
              </div>
            </motion.div>

            {/* Music Tokenization (Web3/Blockchain) */}
            {user && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <div className="flex items-center gap-3 mb-6">
                  <Sparkles className="h-6 w-6 text-orange-500" />
                  <h2 className="text-2xl font-bold">Music Tokenization (Web3)</h2>
                  <Badge className="bg-gradient-to-r from-purple-500 to-blue-500 text-white border-none">
                    Blockchain
                  </Badge>
                </div>
                <TokenizationPanel artistId={user.id} />
              </motion.div>
            )}

            {/* Coming Soon: Multi-Platform Distribution */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="relative"
            >
              <div className="flex items-center gap-3 mb-6">
                <Sparkles className="h-6 w-6 text-orange-500" />
                <h2 className="text-2xl font-bold">Platform Distribution</h2>
                <Badge className="bg-gradient-to-r from-orange-500 to-pink-500 text-white border-none">
                  Coming Soon
                </Badge>
              </div>

              <Card className="relative overflow-hidden border-2 border-orange-500/30 bg-gradient-to-br from-orange-500/5 to-pink-500/5">
                {/* Overlay Pattern */}
                <div className="absolute inset-0 opacity-5">
                  <div className="absolute inset-0" style={{
                    backgroundImage: 'radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)',
                    backgroundSize: '40px 40px'
                  }} />
                </div>

                <CardHeader>
                  <CardTitle className="text-2xl flex items-center gap-3">
                    <div className="p-3 rounded-lg bg-gradient-to-br from-orange-500/20 to-pink-500/20">
                      <Music2 className="h-6 w-6 text-orange-500" />
                    </div>
                    Distribute Your Music Everywhere
                  </CardTitle>
                  <CardDescription className="text-base">
                    Get your music on all major streaming platforms and digital stores worldwide
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-8">
                  {/* Platform Icons Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {[
                      { name: "Spotify", icon: Headphones, color: "from-green-500 to-green-600" },
                      { name: "Apple Music", icon: Music2, color: "from-pink-500 to-rose-500" },
                      { name: "YouTube Music", icon: Radio, color: "from-red-500 to-red-600" },
                      { name: "Amazon Music", icon: Headphones, color: "from-blue-500 to-cyan-500" },
                      { name: "TikTok", icon: Smartphone, color: "from-purple-500 to-pink-500" },
                      { name: "Instagram", icon: Smartphone, color: "from-orange-500 to-pink-500" },
                      { name: "Deezer", icon: Radio, color: "from-orange-500 to-amber-500" },
                      { name: "Tidal", icon: Music2, color: "from-slate-500 to-slate-600" },
                    ].map((platform, index) => (
                      <motion.div
                        key={platform.name}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.5 + index * 0.05 }}
                        className="relative group"
                      >
                        <div className="p-4 rounded-xl bg-background/60 backdrop-blur-sm border border-orange-500/20 hover:border-orange-500/40 transition-all hover:scale-105">
                          <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${platform.color} flex items-center justify-center mb-2 mx-auto`}>
                            <platform.icon className="h-6 w-6 text-white" />
                          </div>
                          <p className="text-xs font-medium text-center text-muted-foreground">
                            {platform.name}
                          </p>
                        </div>
                        <div className="absolute inset-0 rounded-xl bg-orange-500/10 opacity-0 group-hover:opacity-100 transition-opacity blur-xl -z-10" />
                      </motion.div>
                    ))}
                  </div>

                  {/* Features */}
                  <div className="grid sm:grid-cols-2 gap-4">
                    {[
                      {
                        icon: Upload,
                        title: "One-Click Upload",
                        description: "Upload once, distribute everywhere automatically"
                      },
                      {
                        icon: BarChart3,
                        title: "Real-Time Analytics",
                        description: "Track streams, downloads, and earnings across all platforms"
                      },
                      {
                        icon: DollarSign,
                        title: "100% Royalties",
                        description: "Keep all your earnings with transparent reporting"
                      },
                      {
                        icon: Globe,
                        title: "Global Reach",
                        description: "Reach listeners in 150+ countries worldwide"
                      },
                    ].map((feature, index) => (
                      <motion.div
                        key={feature.title}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.7 + index * 0.1 }}
                        className="flex gap-4 p-4 rounded-lg bg-background/40 border border-orange-500/20"
                      >
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500/20 to-pink-500/20 flex items-center justify-center">
                            <feature.icon className="h-5 w-5 text-orange-500" />
                          </div>
                        </div>
                        <div>
                          <h4 className="font-semibold mb-1">{feature.title}</h4>
                          <p className="text-sm text-muted-foreground">{feature.description}</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  {/* How It Works */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-bold flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-orange-500" />
                      How It Works
                    </h3>
                    <div className="grid sm:grid-cols-3 gap-4">
                      {[
                        { step: "1", title: "Upload Your Music", desc: "Upload your tracks with metadata and artwork" },
                        { step: "2", title: "Select Platforms", desc: "Choose where you want your music distributed" },
                        { step: "3", title: "Go Live", desc: "Your music goes live within 24-48 hours" },
                      ].map((item, index) => (
                        <motion.div
                          key={item.step}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 1 + index * 0.1 }}
                          className="relative p-6 rounded-lg bg-gradient-to-br from-orange-500/10 to-pink-500/10 border border-orange-500/20"
                        >
                          <div className="absolute -top-3 -left-3 w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-pink-500 flex items-center justify-center text-white font-bold text-sm">
                            {item.step}
                          </div>
                          <h4 className="font-semibold mb-2 mt-2">{item.title}</h4>
                          <p className="text-sm text-muted-foreground">{item.desc}</p>
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  {/* CTA */}
                  <div className="text-center pt-4">
                    <div className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-gradient-to-r from-orange-500/20 to-pink-500/20 border-2 border-orange-500/30">
                      <Clock className="h-5 w-5 text-orange-500 animate-pulse" />
                      <span className="font-semibold">
                        Platform distribution launching soon - Stay tuned!
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-3">
                      Be the first to know when we launch. Contact us to join the waitlist.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </ScrollArea>
      </main>
    </div>
  );
}
