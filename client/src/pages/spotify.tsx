import { Header } from "../components/layout/header";
import { Card } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Badge } from "../components/ui/badge";
import { Music2, Target, ListMusic, Mail, Search, TrendingUp, Sparkles, Copy, Check, Home, Zap } from "lucide-react";
import { useAuth } from "../hooks/use-auth";
import { useState, useEffect } from "react";
import { useToast } from "../hooks/use-toast";
import { motion } from "framer-motion";
import { SiSpotify } from "react-icons/si";
import { Link } from "wouter";
import { queryClient } from "../lib/queryClient";
import { useQuery, useMutation } from "@tanstack/react-query";
import { PlanTierGuard } from "../components/youtube-views/plan-tier-guard";

export default function SpotifyPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("listeners");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  
  // Detect user subscription plan
  const userSubscription = (user as any)?.subscriptionPlan?.toLowerCase() || null;

  // Tab 1: Monthly Listeners Prediction
  const [artistUrl, setArtistUrl] = useState("");
  const [currentListeners, setCurrentListeners] = useState("");
  const [targetListeners, setTargetListeners] = useState("");
  const [predictionResult, setPredictionResult] = useState<any>(null);

  // Tab 2: Playlist Match
  const [trackName, setTrackName] = useState("");
  const [artistName, setArtistName] = useState("");
  const [genre, setGenre] = useState("");
  const [mood, setMood] = useState("");
  const [playlistMatches, setPlaylistMatches] = useState<any>(null);

  // Tab 3: Curator Finder
  const [curatorGenre, setCuratorGenre] = useState("");
  const [curatorTrackName, setCuratorTrackName] = useState("");
  const [curatorArtist, setCuratorArtist] = useState("");
  const [trackDescription, setTrackDescription] = useState("");
  const [curatorData, setCuratorData] = useState<any>(null);
  const [curatorSubTab, setCuratorSubTab] = useState("search");
  
  // Pitch Generation
  const [showPitchModal, setShowPitchModal] = useState(false);
  const [selectedCurator, setSelectedCurator] = useState<any>(null);
  const [pitchData, setPitchData] = useState<any>(null);
  const [pitchArtistName, setPitchArtistName] = useState("");
  const [pitchArtistBio, setPitchArtistBio] = useState("");
  const [pitchSpotifyUrl, setPitchSpotifyUrl] = useState("");
  const [pitchInstagramUrl, setPitchInstagramUrl] = useState("");
  const [pitchYoutubeUrl, setPitchYoutubeUrl] = useState("");

  // Tab 4: SEO Optimizer
  const [seoType, setSeoType] = useState("track_title");
  const [seoContent, setSeoContent] = useState("");
  const [seoOptimization, setSeoOptimization] = useState<any>(null);

  // Get usage stats
  const { data: usageStats } = useQuery({
    queryKey: ['/api/spotify/usage-stats'],
    enabled: !!user
  });

  // Mutation: Monthly Listeners Prediction
  const predictionMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/spotify/monthly-listeners-prediction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data)
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to generate prediction');
      }
      return response.json();
    },
    onSuccess: (data) => {
      setPredictionResult(data);
      queryClient.invalidateQueries({ queryKey: ['/api/spotify/usage-stats'] });
      toast({
        title: "✅ Prediction Complete",
        description: "AI has analyzed your growth potential",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to generate prediction",
        variant: "destructive"
      });
    }
  });

  // Mutation: Playlist Match
  const playlistMatchMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/spotify/playlist-match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data)
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to find playlist matches');
      }
      return response.json();
    },
    onSuccess: (data) => {
      setPlaylistMatches(data);
      queryClient.invalidateQueries({ queryKey: ['/api/spotify/usage-stats'] });
      toast({
        title: "✅ Matches Found",
        description: `Found ${data.matches?.matchedPlaylists?.length || 0} perfect playlist matches`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to find playlist matches",
        variant: "destructive"
      });
    }
  });

  // Mutation: Curator Contact Finder
  const curatorFinderMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/spotify/curator-contact-finder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data)
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to find curator contacts');
      }
      return response.json();
    },
    onSuccess: (data) => {
      setCuratorData(data);
      queryClient.invalidateQueries({ queryKey: ['/api/spotify/usage-stats'] });
      toast({
        title: "✅ Curators Found",
        description: `Found ${data.curatorData?.curatorProfiles?.length || 0} curator profiles with pitch templates`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to find curator contacts",
        variant: "destructive"
      });
    }
  });

  // Mutation: SEO Optimizer
  const seoOptimizerMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/spotify/seo-optimizer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data)
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to optimize content');
      }
      return response.json();
    },
    onSuccess: (data) => {
      setSeoOptimization(data);
      queryClient.invalidateQueries({ queryKey: ['/api/spotify/usage-stats'] });
      toast({
        title: "✅ SEO Optimization Complete",
        description: `Generated ${data.optimization?.optimizedVersions?.length || 0} optimized versions`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to optimize content",
        variant: "destructive"
      });
    }
  });

  // Query: Get Saved Curators
  const { data: savedCurators, refetch: refetchCurators } = useQuery({
    queryKey: ['/api/spotify/curators/my-list'],
    enabled: !!user && curatorSubTab === 'saved'
  });

  // Query: Get Artist Profile
  const { data: artistProfile } = useQuery({
    queryKey: ['/api/user/profile'],
    enabled: !!user
  });

  // Mutation: Save Curator
  const saveCuratorMutation = useMutation({
    mutationFn: async (curator: any) => {
      const response = await fetch('/api/spotify/curators/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(curator)
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save curator');
      }
      return response.json();
    },
    onSuccess: () => {
      refetchCurators();
      toast({
        title: "✅ Curator Saved",
        description: "Curator added to your favorites",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save curator",
        variant: "destructive"
      });
    }
  });

  // Mutation: Generate Pitch
  const generatePitchMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/spotify/curators/generate-pitch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data)
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to generate pitch');
      }
      return response.json();
    },
    onSuccess: (data) => {
      setPitchData(data.pitch);
      toast({
        title: "✅ Pitch Generated",
        description: "AI has created a personalized pitch for you",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to generate pitch",
        variant: "destructive"
      });
    }
  });

  // Mutation: Send Pitch
  const sendPitchMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/spotify/curators/send-pitch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data)
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to send pitch');
      }
      return response.json();
    },
    onSuccess: () => {
      refetchCurators();
      setShowPitchModal(false);
      setPitchData(null);
      toast({
        title: "✅ Pitch Sent!",
        description: "Your pitch has been sent to the curator",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send pitch",
        variant: "destructive"
      });
    }
  });

  // Auto-fill pitch form
  useEffect(() => {
    if (showPitchModal && artistProfile) {
      setPitchArtistName(artistProfile.artistName || '');
      setPitchArtistBio(artistProfile.biography || '');
      setPitchSpotifyUrl(artistProfile.spotifyUrl || '');
      setPitchInstagramUrl(artistProfile.instagramHandle ? `https://instagram.com/${artistProfile.instagramHandle}` : '');
      setPitchYoutubeUrl(artistProfile.youtubeChannel || '');
    }
  }, [showPitchModal, artistProfile]);

  const handlePrediction = () => {
    if (!artistUrl || !currentListeners || !targetListeners) {
      toast({
        title: "Missing Information",
        description: "Please fill in all fields",
        variant: "destructive"
      });
      return;
    }

    predictionMutation.mutate({
      artistUrl,
      currentMonthlyListeners: parseInt(currentListeners),
      targetListeners: parseInt(targetListeners)
    });
  };

  const handlePlaylistMatch = () => {
    if (!trackName || !artistName || !genre) {
      toast({
        title: "Missing Information",
        description: "Please fill in track name, artist, and genre",
        variant: "destructive"
      });
      return;
    }

    playlistMatchMutation.mutate({
      trackName,
      artist: artistName,
      genre,
      mood,
      targetAudience: ""
    });
  };

  const handleCuratorFinder = () => {
    if (!curatorGenre || !curatorTrackName || !curatorArtist) {
      toast({
        title: "Missing Information",
        description: "Please fill in genre, track name, and artist",
        variant: "destructive"
      });
      return;
    }

    curatorFinderMutation.mutate({
      genre: curatorGenre,
      trackName: curatorTrackName,
      artist: curatorArtist,
      trackDescription
    });
  };

  const handleSEOOptimizer = () => {
    if (!seoContent) {
      toast({
        title: "Missing Content",
        description: "Please enter content to optimize",
        variant: "destructive"
      });
      return;
    }

    seoOptimizerMutation.mutate({
      type: seoType,
      content: seoContent
    });
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    toast({
      title: "Copied!",
      description: "Content copied to clipboard",
    });
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-500";
    if (score >= 60) return "text-orange-400";
    return "text-orange-500";
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-black via-gray-950 to-black">
      <Header />
      
      {/* Animated Background Effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-orange-500/20 to-red-500/20 rounded-full filter blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-to-r from-red-500/20 to-orange-500/20 rounded-full filter blur-3xl animate-pulse delay-1000"></div>
      </div>

      <main className="flex-1 pt-20 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
          {/* Hero Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="relative"
          >
            <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-6">
                {/* Icon with glow effect */}
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl blur-xl opacity-50 animate-pulse"></div>
                  <div className="relative bg-gradient-to-br from-orange-500/20 to-red-500/20 backdrop-blur-sm p-5 rounded-2xl border border-orange-500/30">
                    <SiSpotify className="w-12 h-12 text-green-500" />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-orange-400 via-red-500 to-orange-500">
                    Spotify Growth Tools AI
                  </h2>
                  <p className="text-gray-400 text-base md:text-lg flex items-center gap-2">
                    <Zap className="w-4 h-4 text-orange-500" />
                    Powered by Boostify AI - Grow your Spotify presence with intelligent insights
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                {usageStats?.isAdmin && (
                  <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-0 px-4 py-2 text-sm font-bold shadow-lg">
                    👑 ADMIN - Unlimited
                  </Badge>
                )}
                <Link href="/dashboard">
                  <Button 
                    variant="outline" 
                    className="gap-2 border-orange-500/30 hover:bg-orange-500/10 hover:border-orange-500/50 transition-all duration-300" 
                    data-testid="button-dashboard"
                  >
                    <Home className="w-4 h-4" />
                    Dashboard
                  </Button>
                </Link>
              </div>
            </div>
          </motion.div>

          {/* Usage Stats Card */}
          {usageStats && !usageStats.isAdmin && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: 0.2 }}
            >
              <Card className="relative overflow-hidden border-orange-500/20 bg-gradient-to-br from-orange-500/10 via-transparent to-red-500/10 backdrop-blur-sm">
                <div className="absolute inset-0 bg-gradient-to-r from-orange-500/5 to-red-500/5"></div>
                <div className="relative p-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <div className="space-y-2">
                      <p className="text-sm text-gray-400 flex items-center gap-2">
                        <Target className="w-4 h-4 text-orange-500" />
                        Listeners Prediction
                      </p>
                      <p className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-400 to-orange-600">
                        {usageStats.remaining?.monthlyListenersPrediction}/{usageStats.limits?.monthlyListenersPrediction}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm text-gray-400 flex items-center gap-2">
                        <ListMusic className="w-4 h-4 text-orange-500" />
                        Playlist Match
                      </p>
                      <p className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-400 to-orange-600">
                        {usageStats.remaining?.playlistMatch}/{usageStats.limits?.playlistMatch}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm text-gray-400 flex items-center gap-2">
                        <Mail className="w-4 h-4 text-orange-500" />
                        Curator Finder
                      </p>
                      <p className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-400 to-orange-600">
                        {usageStats.remaining?.curatorFinder}/{usageStats.limits?.curatorFinder}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm text-gray-400 flex items-center gap-2">
                        <Search className="w-4 h-4 text-orange-500" />
                        SEO Optimizer
                      </p>
                      <p className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-400 to-orange-600">
                        {usageStats.remaining?.seoOptimizer}/{usageStats.limits?.seoOptimizer}
                      </p>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          )}

          {/* Tabs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
          >
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
              <TabsList className="grid grid-cols-2 md:grid-cols-4 gap-2 bg-black/40 backdrop-blur-sm p-2 border border-orange-500/20 rounded-xl">
                <TabsTrigger 
                  value="listeners" 
                  data-testid="tab-listeners"
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-red-500 data-[state=active]:text-white rounded-lg transition-all duration-300"
                >
                  <Target className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">Listeners AI</span>
                  <span className="sm:hidden">AI</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="playlists" 
                  data-testid="tab-playlists"
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-red-500 data-[state=active]:text-white rounded-lg transition-all duration-300"
                >
                  <ListMusic className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">Playlist Match</span>
                  <span className="sm:hidden">Playlist</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="curators" 
                  data-testid="tab-curators"
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-red-500 data-[state=active]:text-white rounded-lg transition-all duration-300"
                >
                  <Mail className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">Curator Finder</span>
                  <span className="sm:hidden">Curator</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="seo" 
                  data-testid="tab-seo"
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-red-500 data-[state=active]:text-white rounded-lg transition-all duration-300"
                >
                  <Search className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">SEO Optimizer</span>
                  <span className="sm:hidden">SEO</span>
                </TabsTrigger>
              </TabsList>

              {/* TAB 1: Monthly Listeners Prediction - BASIC */}
              <TabsContent value="listeners" className="space-y-6">
                <PlanTierGuard 
                  requiredPlan="basic" 
                  userSubscription={userSubscription} 
                  featureName="Growth Prediction"
                >
                  <div className="grid gap-6 lg:grid-cols-2">
                  {/* Input Card */}
                  <Card className="group relative overflow-hidden border-orange-500/20 bg-black/40 backdrop-blur-sm hover:border-orange-500/40 transition-all duration-300">
                    <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-red-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <div className="relative p-8 space-y-6">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 rounded-lg bg-gradient-to-br from-orange-500/20 to-red-500/20 border border-orange-500/30">
                          <Target className="h-6 w-6 text-orange-500" />
                        </div>
                        <h3 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-400 to-red-500">
                          Growth Prediction Input
                        </h3>
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-300">Artist Spotify URL</label>
                        <Input
                          placeholder="https://open.spotify.com/artist/..."
                          value={artistUrl}
                          onChange={(e) => setArtistUrl(e.target.value)}
                          data-testid="input-artist-url"
                          className="bg-black/50 border-orange-500/30 focus:border-orange-500 transition-colors"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-300">Current Monthly Listeners</label>
                        <Input
                          type="number"
                          placeholder="10000"
                          value={currentListeners}
                          onChange={(e) => setCurrentListeners(e.target.value)}
                          data-testid="input-current-listeners"
                          className="bg-black/50 border-orange-500/30 focus:border-orange-500 transition-colors"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-300">Target Monthly Listeners</label>
                        <Input
                          type="number"
                          placeholder="50000"
                          value={targetListeners}
                          onChange={(e) => setTargetListeners(e.target.value)}
                          data-testid="input-target-listeners"
                          className="bg-black/50 border-orange-500/30 focus:border-orange-500 transition-colors"
                        />
                      </div>
                      
                      <Button
                        className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-bold py-6 shadow-lg shadow-orange-500/50 transition-all duration-300 transform hover:scale-105"
                        onClick={handlePrediction}
                        disabled={predictionMutation.isPending}
                        data-testid="button-predict-growth"
                      >
                        {predictionMutation.isPending ? (
                          <>
                            <Sparkles className="w-5 h-5 mr-2 animate-spin" />
                            Analyzing with Boostify AI...
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-5 h-5 mr-2" />
                            Predict Growth
                          </>
                        )}
                      </Button>
                    </div>
                  </Card>

                  {/* Prediction Results */}
                  {predictionResult && (
                    <Card className="border-orange-500/20 bg-black/40 backdrop-blur-sm">
                      <div className="p-8 space-y-6">
                        <div className="flex items-center gap-3 mb-6">
                          <div className="p-2 rounded-lg bg-gradient-to-br from-orange-500/20 to-red-500/20 border border-orange-500/30">
                            <TrendingUp className="w-6 h-6 text-orange-500" />
                          </div>
                          <h3 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-400 to-red-500">
                            Growth Prediction
                          </h3>
                        </div>
                        
                        <div className="space-y-6" data-testid="prediction-results">
                          <div className="p-6 bg-gradient-to-br from-orange-500/10 to-red-500/10 rounded-xl border border-orange-500/30">
                            <p className="text-sm text-gray-400 mb-2">Confidence Score</p>
                            <p className={`text-5xl font-extrabold ${getScoreColor(predictionResult.analysis?.prediction?.confidenceScore || 0)}`}>
                              {predictionResult.analysis?.prediction?.confidenceScore || 0}/100
                            </p>
                          </div>
                          
                          <div className="p-4 rounded-lg bg-black/50 border border-orange-500/20">
                            <p className="text-sm font-semibold text-gray-400 mb-2">Time to Target</p>
                            <p className="text-lg text-white">{predictionResult.analysis?.prediction?.timeToTarget}</p>
                          </div>
                          
                          <div className="p-4 rounded-lg bg-black/50 border border-orange-500/20">
                            <p className="text-sm font-semibold text-gray-400 mb-2">Required Monthly Growth</p>
                            <p className="text-4xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-orange-400 to-red-500">
                              {predictionResult.analysis?.prediction?.requiredMonthlyGrowth}%
                            </p>
                          </div>
                          
                          {predictionResult.analysis?.growthOpportunities && predictionResult.analysis.growthOpportunities.length > 0 && (
                            <div>
                              <p className="text-sm font-semibold text-gray-400 mb-4">Growth Opportunities</p>
                              <div className="space-y-3">
                                {predictionResult.analysis.growthOpportunities.slice(0, 3).map((opp: any, idx: number) => (
                                  <div key={idx} className="p-4 bg-black/50 rounded-lg border border-orange-500/20 hover:border-orange-500/40 transition-colors">
                                    <div className="flex items-center justify-between mb-2">
                                      <p className="font-semibold text-white">{opp.strategy}</p>
                                      <Badge className="bg-gradient-to-r from-orange-500 to-red-500 text-white border-0">{opp.impact}</Badge>
                                    </div>
                                    <p className="text-sm text-gray-400 mb-2">{opp.description}</p>
                                    <p className="text-sm font-semibold text-orange-400">+{opp.estimatedListenerGain?.toLocaleString()} listeners</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </Card>
                  )}
                  </div>
                </PlanTierGuard>
              </TabsContent>

              {/* TAB 2: Playlist Match - BASIC */}
              <TabsContent value="playlists" className="space-y-6">
                <PlanTierGuard 
                  requiredPlan="basic" 
                  userSubscription={userSubscription} 
                  featureName="Playlist Match Finder"
                >
                <div className="grid gap-6 lg:grid-cols-2">
                  <Card className="group border-orange-500/20 bg-black/40 backdrop-blur-sm hover:border-orange-500/40 transition-all duration-300">
                    <div className="p-8 space-y-6">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 rounded-lg bg-gradient-to-br from-orange-500/20 to-red-500/20 border border-orange-500/30">
                          <ListMusic className="h-6 w-6 text-orange-500" />
                        </div>
                        <h3 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-400 to-red-500">
                          Track Information
                        </h3>
                      </div>
                      
                      <Input
                        placeholder="Track Name"
                        value={trackName}
                        onChange={(e) => setTrackName(e.target.value)}
                        data-testid="input-track-name"
                        className="bg-black/50 border-orange-500/30 focus:border-orange-500"
                      />
                      <Input
                        placeholder="Artist Name"
                        value={artistName}
                        onChange={(e) => setArtistName(e.target.value)}
                        data-testid="input-artist-name"
                        className="bg-black/50 border-orange-500/30 focus:border-orange-500"
                      />
                      <Input
                        placeholder="Genre (e.g., Pop, Rock, Hip-Hop)"
                        value={genre}
                        onChange={(e) => setGenre(e.target.value)}
                        data-testid="input-genre"
                        className="bg-black/50 border-orange-500/30 focus:border-orange-500"
                      />
                      <Input
                        placeholder="Mood (Optional, e.g., Energetic, Chill)"
                        value={mood}
                        onChange={(e) => setMood(e.target.value)}
                        data-testid="input-mood"
                        className="bg-black/50 border-orange-500/30 focus:border-orange-500"
                      />
                      
                      <Button
                        className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-bold py-6 shadow-lg shadow-orange-500/50 transition-all duration-300 transform hover:scale-105"
                        onClick={handlePlaylistMatch}
                        disabled={playlistMatchMutation.isPending}
                        data-testid="button-find-playlists"
                      >
                        {playlistMatchMutation.isPending ? (
                          <>
                            <Sparkles className="w-5 h-5 mr-2 animate-spin" />
                            Finding Matches...
                          </>
                        ) : (
                          <>
                            <Search className="w-5 h-5 mr-2" />
                            Find Perfect Playlists
                          </>
                        )}
                      </Button>
                    </div>
                  </Card>

                  {playlistMatches && (
                    <Card className="border-orange-500/20 bg-black/40 backdrop-blur-sm max-h-[700px] overflow-y-auto">
                      <div className="p-8">
                        <h3 className="text-2xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-orange-400 to-red-500">
                          Found {playlistMatches.matches?.matchedPlaylists?.length || 0} Playlists
                        </h3>
                        <div className="space-y-4" data-testid="playlist-results">
                          {playlistMatches.matches?.matchedPlaylists?.map((playlist: any, idx: number) => (
                            <div 
                              key={idx} 
                              className="p-5 bg-black/50 rounded-xl border border-orange-500/20 hover:border-orange-500/40 transition-all duration-300 hover:transform hover:scale-105"
                            >
                              <div className="flex justify-between items-start mb-3">
                                <div className="flex-1">
                                  <p className="font-bold text-lg text-white mb-1">{playlist.playlistName}</p>
                                  <p className="text-sm text-gray-400">{playlist.curatorName}</p>
                                </div>
                                <Badge className={`ml-3 ${getScoreColor(playlist.matchScore)} bg-gradient-to-r from-orange-500/20 to-red-500/20 border-orange-500/30`}>
                                  {playlist.matchScore}/100
                                </Badge>
                              </div>
                              
                              <p className="text-xs text-gray-400 mb-3">
                                🎧 {playlist.followers?.toLocaleString() || 'N/A'} followers • 
                                🎵 {playlist.trackCount || 'N/A'} tracks
                              </p>
                              
                              {playlist.submissionInfo && (
                                <div className="mt-3 p-3 bg-orange-500/10 rounded-lg border border-orange-500/20">
                                  <p className="text-xs font-semibold text-orange-400 mb-1">How to Submit:</p>
                                  <p className="text-xs text-gray-300">{playlist.submissionInfo}</p>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </Card>
                  )}
                  </div>
                </PlanTierGuard>
              </TabsContent>

              {/* TAB 3: Curator Finder - PRO */}
              <TabsContent value="curators" className="space-y-6">
                <PlanTierGuard 
                  requiredPlan="pro" 
                  userSubscription={userSubscription} 
                  featureName="Curator Finder"
                >
                  <div className="flex gap-3 mb-4">
                  <Button
                    variant={curatorSubTab === 'search' ? 'default' : 'ghost'}
                    onClick={() => setCuratorSubTab('search')}
                    className={curatorSubTab === 'search' ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white' : 'border-orange-500/30 hover:bg-orange-500/10'}
                  >
                    <Search className="w-4 h-4 mr-2" />
                    Search Curators
                  </Button>
                  <Button
                    variant={curatorSubTab === 'saved' ? 'default' : 'ghost'}
                    onClick={() => setCuratorSubTab('saved')}
                    className={curatorSubTab === 'saved' ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white' : 'border-orange-500/30 hover:bg-orange-500/10'}
                  >
                    <Mail className="w-4 h-4 mr-2" />
                    My Saved Curators ({savedCurators?.total || 0})
                  </Button>
                </div>

                {/* Search Sub-tab */}
                {curatorSubTab === 'search' && (
                  <div className="grid gap-6 lg:grid-cols-2">
                    <Card className="group border-orange-500/20 bg-black/40 backdrop-blur-sm hover:border-orange-500/40 transition-all duration-300">
                      <div className="p-8 space-y-6">
                        <div className="flex items-center gap-3 mb-6">
                          <div className="p-2 rounded-lg bg-gradient-to-br from-orange-500/20 to-red-500/20 border border-orange-500/30">
                            <Mail className="h-6 w-6 text-orange-500" />
                          </div>
                          <h3 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-400 to-red-500">
                            Find Curators
                          </h3>
                        </div>
                        
                        <Input 
                          placeholder="Genre" 
                          value={curatorGenre} 
                          onChange={(e) => setCuratorGenre(e.target.value)}
                          className="bg-black/50 border-orange-500/30 focus:border-orange-500"
                        />
                        <Input 
                          placeholder="Track Name" 
                          value={curatorTrackName} 
                          onChange={(e) => setCuratorTrackName(e.target.value)}
                          className="bg-black/50 border-orange-500/30 focus:border-orange-500"
                        />
                        <Input 
                          placeholder="Artist Name" 
                          value={curatorArtist} 
                          onChange={(e) => setCuratorArtist(e.target.value)}
                          className="bg-black/50 border-orange-500/30 focus:border-orange-500"
                        />
                        <Input 
                          placeholder="Track Description (Optional)" 
                          value={trackDescription} 
                          onChange={(e) => setTrackDescription(e.target.value)}
                          className="bg-black/50 border-orange-500/30 focus:border-orange-500"
                        />
                        
                        <Button 
                          className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-bold py-6 shadow-lg shadow-orange-500/50 transition-all duration-300 transform hover:scale-105" 
                          onClick={handleCuratorFinder} 
                          disabled={curatorFinderMutation.isPending}
                        >
                          {curatorFinderMutation.isPending ? (
                            <>
                              <Sparkles className="w-5 h-5 mr-2 animate-spin" />
                              Finding Curators...
                            </>
                          ) : (
                            <>
                              <Mail className="w-5 h-5 mr-2" />
                              Find Curators
                            </>
                          )}
                        </Button>
                      </div>
                    </Card>

                    {curatorData && (
                      <Card className="border-orange-500/20 bg-black/40 backdrop-blur-sm max-h-[700px] overflow-y-auto">
                        <div className="p-8">
                          <h3 className="text-2xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-orange-400 to-red-500">
                            Found {curatorData.curatorData?.curatorProfiles?.length || 0} Curators
                          </h3>
                          <div className="space-y-4">
                            {curatorData.curatorData?.curatorProfiles?.map((curator: any, idx: number) => (
                              <div 
                                key={idx} 
                                className="p-5 bg-black/50 rounded-xl border border-orange-500/20 hover:border-orange-500/40 transition-all duration-300"
                              >
                                <div className="flex justify-between items-start mb-3">
                                  <div>
                                    <p className="font-bold text-white text-lg">{curator.curatorName || curator.curatorType}</p>
                                    <p className="text-sm text-gray-400">{curator.playlistFocus}</p>
                                    {curator.playlistName && (
                                      <p className="text-xs text-orange-400 mt-1">📋 {curator.playlistName}</p>
                                    )}
                                  </div>
                                  <Button 
                                    size="sm" 
                                    variant="outline" 
                                    onClick={() => saveCuratorMutation.mutate({ ...curator, genre: curatorGenre })} 
                                    disabled={saveCuratorMutation.isPending}
                                    className="border-orange-500/30 hover:bg-orange-500/20"
                                  >
                                    💾 Save
                                  </Button>
                                </div>
                                
                                {(curator.email || curator.instagram || curator.twitter) && (
                                  <div className="flex flex-wrap gap-2 mb-3">
                                    {curator.email && <Badge variant="secondary" className="text-xs bg-orange-500/20 text-orange-300 border-orange-500/30">📧 {curator.email}</Badge>}
                                    {curator.instagram && <Badge variant="secondary" className="text-xs bg-orange-500/20 text-orange-300 border-orange-500/30">📷 {curator.instagram}</Badge>}
                                    {curator.twitter && <Badge variant="secondary" className="text-xs bg-orange-500/20 text-orange-300 border-orange-500/30">🐦 {curator.twitter}</Badge>}
                                  </div>
                                )}
                                
                                <p className="text-xs text-gray-400">{curator.estimatedFollowers} followers</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      </Card>
                    )}
                  </div>
                )}

                {/* Saved Curators Sub-tab */}
                {curatorSubTab === 'saved' && (
                  <div className="space-y-4">
                    {savedCurators?.curators && savedCurators.curators.length > 0 ? (
                      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {savedCurators.curators.map((curator: any) => (
                          <Card 
                            key={curator.id} 
                            className="group border-orange-500/20 bg-black/40 backdrop-blur-sm hover:border-orange-500/40 transition-all duration-300 hover:transform hover:scale-105"
                          >
                            <div className="p-6 space-y-4">
                              <div className="flex justify-between items-start">
                                <div>
                                  <p className="font-bold text-white">{curator.curatorName}</p>
                                  <p className="text-xs text-gray-400">{curator.playlistFocus}</p>
                                </div>
                                {curator.contacted && (
                                  <Badge className="bg-gradient-to-r from-green-500 to-green-600 text-white border-0">
                                    ✓ Contacted
                                  </Badge>
                                )}
                              </div>
                              
                              {(curator.email || curator.instagram || curator.twitter) && (
                                <div className="flex flex-wrap gap-2">
                                  {curator.email && <Badge variant="outline" className="text-xs border-orange-500/30">📧</Badge>}
                                  {curator.instagram && <Badge variant="outline" className="text-xs border-orange-500/30">📷</Badge>}
                                  {curator.twitter && <Badge variant="outline" className="text-xs border-orange-500/30">🐦</Badge>}
                                </div>
                              )}
                              
                              <Button 
                                size="sm" 
                                className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white shadow-lg" 
                                onClick={() => { 
                                  setSelectedCurator(curator); 
                                  setShowPitchModal(true); 
                                }}
                              >
                                ✉️ Generate & Send Pitch
                              </Button>
                            </div>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <Card className="border-orange-500/20 bg-black/40 backdrop-blur-sm">
                        <div className="p-12 text-center">
                          <Mail className="w-16 h-16 mx-auto mb-4 text-orange-500/50" />
                          <p className="text-gray-400">No saved curators yet. Search and save curators to get started!</p>
                        </div>
                      </Card>
                    )}
                  </div>
                )}

                {/* Pitch Generation Modal */}
                {showPitchModal && selectedCurator && (
                  <div 
                    className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4" 
                    onClick={() => setShowPitchModal(false)}
                  >
                    <Card 
                      className="max-w-2xl w-full max-h-[90vh] overflow-y-auto border-orange-500/30 bg-gradient-to-br from-black via-gray-950 to-black" 
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="p-8">
                        <div className="flex items-center justify-between mb-6">
                          <h3 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-400 to-red-500">
                            Generate Pitch for {selectedCurator.curatorName}
                          </h3>
                          {artistProfile?.artistName && (
                            <Badge className="bg-gradient-to-r from-orange-500/20 to-red-500/20 text-orange-400 border-orange-500/30">
                              ✨ Auto-filled from profile
                            </Badge>
                          )}
                        </div>
                        
                        {!pitchData ? (
                          <div className="space-y-4">
                            <Input 
                              placeholder="Your Artist Name" 
                              value={pitchArtistName} 
                              onChange={(e) => setPitchArtistName(e.target.value)}
                              className="bg-black/50 border-orange-500/30 focus:border-orange-500"
                            />
                            <textarea 
                              className="w-full p-4 rounded-lg border bg-black/50 border-orange-500/30 focus:border-orange-500 min-h-[100px] text-white outline-none transition-colors" 
                              placeholder="Short Artist Bio" 
                              value={pitchArtistBio} 
                              onChange={(e) => setPitchArtistBio(e.target.value)} 
                            />
                            <Input 
                              placeholder="Spotify URL (optional)" 
                              value={pitchSpotifyUrl} 
                              onChange={(e) => setPitchSpotifyUrl(e.target.value)}
                              className="bg-black/50 border-orange-500/30 focus:border-orange-500"
                            />
                            <Input 
                              placeholder="Instagram URL (optional)" 
                              value={pitchInstagramUrl} 
                              onChange={(e) => setPitchInstagramUrl(e.target.value)}
                              className="bg-black/50 border-orange-500/30 focus:border-orange-500"
                            />
                            <Input 
                              placeholder="YouTube URL (optional)" 
                              value={pitchYoutubeUrl} 
                              onChange={(e) => setPitchYoutubeUrl(e.target.value)}
                              className="bg-black/50 border-orange-500/30 focus:border-orange-500"
                            />
                            
                            <div className="flex gap-3 pt-4">
                              <Button 
                                className="flex-1 border-orange-500/30" 
                                variant="outline" 
                                onClick={() => setShowPitchModal(false)}
                              >
                                Cancel
                              </Button>
                              <Button 
                                className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600" 
                                onClick={() => generatePitchMutation.mutate({ 
                                  curatorId: selectedCurator.id, 
                                  artistName: pitchArtistName, 
                                  artistBio: pitchArtistBio, 
                                  spotifyUrl: pitchSpotifyUrl, 
                                  instagramUrl: pitchInstagramUrl, 
                                  youtubeUrl: pitchYoutubeUrl 
                                })} 
                                disabled={!pitchArtistName || generatePitchMutation.isPending}
                              >
                                {generatePitchMutation.isPending ? 'Generating...' : 'Generate Pitch'}
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            <div className="p-6 bg-gradient-to-br from-orange-500/10 to-red-500/10 rounded-xl border border-orange-500/30">
                              <p className="font-semibold mb-4 text-orange-400">Subject: {pitchData.subjectLine}</p>
                              <div className="relative">
                                <pre className="text-sm whitespace-pre-wrap p-4 bg-black/50 rounded-lg border border-orange-500/20 text-gray-300">
                                  {pitchData.emailBody}
                                </pre>
                                <Button 
                                  size="sm" 
                                  variant="ghost" 
                                  className="absolute top-2 right-2 hover:bg-orange-500/20" 
                                  onClick={() => copyToClipboard(pitchData.emailBody, 'pitch-body')}
                                >
                                  {copiedId === 'pitch-body' ? (
                                    <Check className="w-4 h-4 text-green-500" />
                                  ) : (
                                    <Copy className="w-4 h-4" />
                                  )}
                                </Button>
                              </div>
                            </div>
                            
                            <div className="flex gap-3">
                              <Button 
                                variant="outline" 
                                className="border-orange-500/30"
                                onClick={() => { 
                                  setPitchData(null); 
                                  setShowPitchModal(false); 
                                }}
                              >
                                Close
                              </Button>
                              <Button 
                                className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600" 
                                onClick={() => sendPitchMutation.mutate({ 
                                  curatorId: selectedCurator.id, 
                                  pitch: pitchData, 
                                  curatorEmail: selectedCurator.email, 
                                  curatorInstagram: selectedCurator.instagram, 
                                  curatorTwitter: selectedCurator.twitter, 
                                  curatorName: selectedCurator.curatorName 
                                })} 
                                disabled={sendPitchMutation.isPending}
                              >
                                {sendPitchMutation.isPending ? 'Sending...' : '🚀 Send to Curator'}
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    </Card>
                  </div>
                )}
                  </div>
                </PlanTierGuard>
              </TabsContent>

              {/* TAB 4: SEO Optimizer - PRO */}
              <TabsContent value="seo" className="space-y-6">
                <PlanTierGuard 
                  requiredPlan="pro" 
                  userSubscription={userSubscription} 
                  featureName="SEO Optimizer"
                >
                  <div className="grid gap-6 lg:grid-cols-2">
                  <Card className="group border-orange-500/20 bg-black/40 backdrop-blur-sm hover:border-orange-500/40 transition-all duration-300">
                    <div className="p-8 space-y-6">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 rounded-lg bg-gradient-to-br from-orange-500/20 to-red-500/20 border border-orange-500/30">
                          <Search className="h-6 w-6 text-orange-500" />
                        </div>
                        <h3 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-400 to-red-500">
                          SEO Optimizer
                        </h3>
                      </div>
                      
                      <div>
                        <label className="text-sm font-semibold text-gray-300 mb-2 block">Content Type</label>
                        <select
                          className="w-full p-3 rounded-lg border bg-black/50 border-orange-500/30 focus:border-orange-500 text-white outline-none transition-colors"
                          value={seoType}
                          onChange={(e) => setSeoType(e.target.value)}
                          data-testid="select-seo-type"
                        >
                          <option value="track_title">Track Title</option>
                          <option value="artist_bio">Artist Bio</option>
                          <option value="track_description">Track Description</option>
                          <option value="playlist_title">Playlist Title</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="text-sm font-semibold text-gray-300 mb-2 block">Content to Optimize</label>
                        <textarea
                          className="w-full p-4 rounded-lg border bg-black/50 border-orange-500/30 focus:border-orange-500 min-h-[150px] text-white outline-none transition-colors"
                          placeholder="Enter your content here..."
                          value={seoContent}
                          onChange={(e) => setSeoContent(e.target.value)}
                          data-testid="textarea-seo-content"
                        />
                      </div>
                      
                      <Button
                        className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-bold py-6 shadow-lg shadow-orange-500/50 transition-all duration-300 transform hover:scale-105"
                        onClick={handleSEOOptimizer}
                        disabled={seoOptimizerMutation.isPending}
                        data-testid="button-optimize-seo"
                      >
                        {seoOptimizerMutation.isPending ? (
                          <>
                            <Sparkles className="w-5 h-5 mr-2 animate-spin" />
                            Optimizing...
                          </>
                        ) : (
                          <>
                            <Search className="w-5 h-5 mr-2" />
                            Optimize for Spotify
                          </>
                        )}
                      </Button>
                    </div>
                  </Card>

                  {/* SEO Results */}
                  {seoOptimization && (
                    <Card className="border-orange-500/20 bg-black/40 backdrop-blur-sm max-h-[700px] overflow-y-auto">
                      <div className="p-8">
                        <h3 className="text-2xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-orange-400 to-red-500" data-testid="seo-results-title">
                          Optimized Versions
                        </h3>
                        
                        <div className="mb-6 p-6 bg-gradient-to-br from-orange-500/10 to-red-500/10 rounded-xl border border-orange-500/30">
                          <p className="text-sm text-gray-400 mb-2">Current SEO Score</p>
                          <p className={`text-5xl font-extrabold ${getScoreColor(seoOptimization.optimization?.analysis?.currentScore || 0)}`}>
                            {seoOptimization.optimization?.analysis?.currentScore || 0}/100
                          </p>
                        </div>
                        
                        <div className="space-y-4">
                          {seoOptimization.optimization?.optimizedVersions?.map((version: any, idx: number) => (
                            <div 
                              key={idx} 
                              className="p-5 bg-black/50 rounded-xl border border-orange-500/20 hover:border-orange-500/40 transition-all duration-300"
                            >
                              <div className="flex items-center justify-between mb-3">
                                <Badge className="bg-gradient-to-r from-orange-500/20 to-red-500/20 text-orange-400 border-orange-500/30">
                                  {version.style}
                                </Badge>
                                <Badge className={`${getScoreColor(version.seoScore)} bg-gradient-to-r from-orange-500/20 to-red-500/20 border-orange-500/30`}>
                                  {version.seoScore}/100
                                </Badge>
                              </div>
                              
                              <div className="relative">
                                <p className="p-4 bg-orange-500/5 rounded-lg text-sm text-white border border-orange-500/10">
                                  {version.content}
                                </p>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="absolute top-2 right-2 hover:bg-orange-500/20"
                                  onClick={() => copyToClipboard(version.content, `seo-${idx}`)}
                                >
                                  {copiedId === `seo-${idx}` ? (
                                    <Check className="w-4 h-4 text-green-500" />
                                  ) : (
                                    <Copy className="w-4 h-4 text-orange-400" />
                                  )}
                                </Button>
                              </div>
                              
                              <p className="text-xs text-gray-400 mt-3">{version.reasoning}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </Card>
                  )}
                  </div>
                </PlanTierGuard>
              </TabsContent>
            </Tabs>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
