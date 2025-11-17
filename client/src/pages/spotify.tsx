import { Header } from "../components/layout/header";
import { Card } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Badge } from "../components/ui/badge";
import { Music2, Target, ListMusic, Mail, Search, TrendingUp, Sparkles, Copy, Check, Home } from "lucide-react";
import { useAuth } from "../hooks/use-auth";
import { useState } from "react";
import { useToast } from "../hooks/use-toast";
import { motion } from "framer-motion";
import { SiSpotify } from "react-icons/si";
import { Link } from "wouter";
import { queryClient } from "../lib/queryClient";
import { useQuery, useMutation } from "@tanstack/react-query";

export default function SpotifyPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("listeners");
  const [copiedId, setCopiedId] = useState<string | null>(null);

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
    if (score >= 60) return "text-yellow-500";
    return "text-orange-500";
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 pt-20">
        <div className="flex-1 space-y-8 p-8 pt-6 bg-gradient-to-b from-background to-background/80">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex items-center justify-between"
          >
            <div className="flex items-center gap-4">
              <SiSpotify className="w-12 h-12 text-green-500" />
              <div>
                <h2 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-green-500 to-green-500/70 bg-clip-text text-transparent">
                  Spotify Growth Tools AI
                </h2>
                <p className="text-muted-foreground mt-2">
                  Powered by Boostify AI - Grow your Spotify presence with intelligent insights
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              {usageStats?.isAdmin && (
                <Badge variant="default" className="bg-gradient-to-r from-yellow-500 to-orange-500">
                  👑 ADMIN - Unlimited
                </Badge>
              )}
              <Link href="/dashboard">
                <Button variant="outline" className="gap-2" data-testid="button-dashboard">
                  <Home className="w-4 h-4" />
                  Dashboard
                </Button>
              </Link>
            </div>
          </motion.div>

          {/* Usage Stats */}
          {usageStats && !usageStats.isAdmin && (
            <Card className="p-4 bg-gradient-to-r from-green-500/10 to-green-500/5">
              <div className="grid grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Listeners Prediction</p>
                  <p className="text-lg font-bold">{usageStats.remaining?.monthlyListenersPrediction}/{usageStats.limits?.monthlyListenersPrediction}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Playlist Match</p>
                  <p className="text-lg font-bold">{usageStats.remaining?.playlistMatch}/{usageStats.limits?.playlistMatch}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Curator Finder</p>
                  <p className="text-lg font-bold">{usageStats.remaining?.curatorFinder}/{usageStats.limits?.curatorFinder}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">SEO Optimizer</p>
                  <p className="text-lg font-bold">{usageStats.remaining?.seoOptimizer}/{usageStats.limits?.seoOptimizer}</p>
                </div>
              </div>
            </Card>
          )}

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid grid-cols-4 max-w-[800px]">
              <TabsTrigger value="listeners" data-testid="tab-listeners">
                <Target className="w-4 h-4 mr-2" />
                Listeners AI
              </TabsTrigger>
              <TabsTrigger value="playlists" data-testid="tab-playlists">
                <ListMusic className="w-4 h-4 mr-2" />
                Playlist Match
              </TabsTrigger>
              <TabsTrigger value="curators" data-testid="tab-curators">
                <Mail className="w-4 h-4 mr-2" />
                Curator Finder
              </TabsTrigger>
              <TabsTrigger value="seo" data-testid="tab-seo">
                <Search className="w-4 h-4 mr-2" />
                SEO Optimizer
              </TabsTrigger>
            </TabsList>

            {/* TAB 1: Monthly Listeners Prediction */}
            <TabsContent value="listeners" className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <Card className="p-6 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-transparent" />
                  <div className="relative space-y-4">
                    <div className="flex items-center gap-2 mb-4">
                      <Target className="h-5 w-5 text-green-500" />
                      <h3 className="text-lg font-semibold">Growth Prediction Input</h3>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Artist Spotify URL</label>
                      <Input
                        placeholder="https://open.spotify.com/artist/..."
                        value={artistUrl}
                        onChange={(e) => setArtistUrl(e.target.value)}
                        data-testid="input-artist-url"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Current Monthly Listeners</label>
                      <Input
                        type="number"
                        placeholder="10000"
                        value={currentListeners}
                        onChange={(e) => setCurrentListeners(e.target.value)}
                        data-testid="input-current-listeners"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Target Monthly Listeners</label>
                      <Input
                        type="number"
                        placeholder="50000"
                        value={targetListeners}
                        onChange={(e) => setTargetListeners(e.target.value)}
                        data-testid="input-target-listeners"
                      />
                    </div>
                    <Button
                      className="w-full bg-green-500 hover:bg-green-600"
                      onClick={handlePrediction}
                      disabled={predictionMutation.isPending}
                      data-testid="button-predict-growth"
                    >
                      {predictionMutation.isPending ? (
                        <>
                          <Sparkles className="w-4 h-4 mr-2 animate-spin" />
                          Analyzing with Boostify AI...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 mr-2" />
                          Predict Growth
                        </>
                      )}
                    </Button>
                  </div>
                </Card>

                {/* Prediction Results */}
                {predictionResult && (
                  <Card className="p-6">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-green-500" />
                      Growth Prediction
                    </h3>
                    <div className="space-y-4" data-testid="prediction-results">
                      <div className="p-4 bg-green-500/10 rounded-lg">
                        <p className="text-sm text-muted-foreground">Confidence Score</p>
                        <p className={`text-3xl font-bold ${getScoreColor(predictionResult.analysis?.prediction?.confidenceScore || 0)}`}>
                          {predictionResult.analysis?.prediction?.confidenceScore || 0}/100
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium mb-2">Time to Target</p>
                        <p className="text-muted-foreground">{predictionResult.analysis?.prediction?.timeToTarget}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium mb-2">Required Monthly Growth</p>
                        <p className="text-2xl font-bold text-green-500">
                          {predictionResult.analysis?.prediction?.requiredMonthlyGrowth}%
                        </p>
                      </div>
                      {predictionResult.analysis?.growthOpportunities && predictionResult.analysis.growthOpportunities.length > 0 && (
                        <div>
                          <p className="text-sm font-medium mb-2">Growth Opportunities</p>
                          <div className="space-y-2">
                            {predictionResult.analysis.growthOpportunities.slice(0, 3).map((opp: any, idx: number) => (
                              <div key={idx} className="p-3 bg-background rounded border">
                                <div className="flex items-center justify-between mb-1">
                                  <p className="font-medium">{opp.strategy}</p>
                                  <Badge>{opp.impact}</Badge>
                                </div>
                                <p className="text-sm text-muted-foreground">{opp.description}</p>
                                <p className="text-sm text-green-500 mt-1">+{opp.estimatedListenerGain?.toLocaleString()} listeners</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </Card>
                )}
              </div>
            </TabsContent>

            {/* TAB 2: Playlist Match */}
            <TabsContent value="playlists" className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <Card className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-4">
                      <ListMusic className="h-5 w-5 text-green-500" />
                      <h3 className="text-lg font-semibold">Track Information</h3>
                    </div>
                    <Input
                      placeholder="Track Name"
                      value={trackName}
                      onChange={(e) => setTrackName(e.target.value)}
                      data-testid="input-track-name"
                    />
                    <Input
                      placeholder="Artist Name"
                      value={artistName}
                      onChange={(e) => setArtistName(e.target.value)}
                      data-testid="input-artist-name"
                    />
                    <Input
                      placeholder="Genre (e.g., Hip Hop, Pop, EDM)"
                      value={genre}
                      onChange={(e) => setGenre(e.target.value)}
                      data-testid="input-genre"
                    />
                    <Input
                      placeholder="Mood (Optional, e.g., Energetic, Chill)"
                      value={mood}
                      onChange={(e) => setMood(e.target.value)}
                      data-testid="input-mood"
                    />
                    <Button
                      className="w-full bg-green-500 hover:bg-green-600"
                      onClick={handlePlaylistMatch}
                      disabled={playlistMatchMutation.isPending}
                      data-testid="button-find-playlists"
                    >
                      {playlistMatchMutation.isPending ? (
                        <>
                          <Sparkles className="w-4 h-4 mr-2 animate-spin" />
                          Finding Matches...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 mr-2" />
                          Find Perfect Playlists
                        </>
                      )}
                    </Button>
                  </div>
                </Card>

                {/* Playlist Matches Results */}
                {playlistMatches && (
                  <Card className="p-6 max-h-[600px] overflow-y-auto">
                    <h3 className="text-lg font-semibold mb-4" data-testid="playlist-matches-title">
                      Matched Playlists ({playlistMatches.matches?.matchedPlaylists?.length || 0})
                    </h3>
                    <div className="space-y-3">
                      {playlistMatches.matches?.matchedPlaylists?.map((playlist: any, idx: number) => (
                        <div key={idx} className="p-4 bg-background rounded border">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <p className="font-medium">{playlist.playlistType}</p>
                              <p className="text-sm text-muted-foreground">{playlist.estimatedFollowers}</p>
                            </div>
                            <Badge className={getScoreColor(playlist.matchScore)}>
                              {playlist.matchScore}/100
                            </Badge>
                          </div>
                          <p className="text-sm mb-2">{playlist.reasoning}</p>
                          <div className="flex items-center gap-2 text-sm">
                            <Badge variant={playlist.acceptanceLikelihood === 'high' ? 'default' : 'secondary'}>
                              {playlist.acceptanceLikelihood} chance
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                )}
              </div>
            </TabsContent>

            {/* TAB 3: Curator Finder */}
            <TabsContent value="curators" className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <Card className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-4">
                      <Mail className="h-5 w-5 text-green-500" />
                      <h3 className="text-lg font-semibold">Find Curators</h3>
                    </div>
                    <Input
                      placeholder="Genre"
                      value={curatorGenre}
                      onChange={(e) => setCuratorGenre(e.target.value)}
                      data-testid="input-curator-genre"
                    />
                    <Input
                      placeholder="Track Name"
                      value={curatorTrackName}
                      onChange={(e) => setCuratorTrackName(e.target.value)}
                      data-testid="input-curator-track"
                    />
                    <Input
                      placeholder="Artist Name"
                      value={curatorArtist}
                      onChange={(e) => setCuratorArtist(e.target.value)}
                      data-testid="input-curator-artist"
                    />
                    <Input
                      placeholder="Track Description (Optional)"
                      value={trackDescription}
                      onChange={(e) => setTrackDescription(e.target.value)}
                      data-testid="input-track-description"
                    />
                    <Button
                      className="w-full bg-green-500 hover:bg-green-600"
                      onClick={handleCuratorFinder}
                      disabled={curatorFinderMutation.isPending}
                      data-testid="button-find-curators"
                    >
                      {curatorFinderMutation.isPending ? (
                        <>
                          <Sparkles className="w-4 h-4 mr-2 animate-spin" />
                          Finding Curators...
                        </>
                      ) : (
                        <>
                          <Mail className="w-4 h-4 mr-2" />
                          Find Curators
                        </>
                      )}
                    </Button>
                  </div>
                </Card>

                {/* Curator Results */}
                {curatorData && (
                  <Card className="p-6 max-h-[600px] overflow-y-auto">
                    <h3 className="text-lg font-semibold mb-4" data-testid="curator-results-title">
                      Curator Profiles ({curatorData.curatorData?.curatorProfiles?.length || 0})
                    </h3>
                    <div className="space-y-4">
                      {curatorData.curatorData?.curatorProfiles?.map((curator: any, idx: number) => (
                        <div key={idx} className="p-4 bg-background rounded border">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <p className="font-medium">{curator.curatorType}</p>
                              <p className="text-sm text-muted-foreground">{curator.playlistFocus}</p>
                            </div>
                          </div>
                          <div className="space-y-2 mt-3">
                            <div>
                              <p className="text-xs font-medium text-muted-foreground mb-1">Pitch Template:</p>
                              <div className="relative">
                                <p className="text-sm p-3 bg-green-500/5 rounded border text-muted-foreground">
                                  {curator.pitchTemplate?.substring(0, 150)}...
                                </p>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="absolute top-1 right-1"
                                  onClick={() => copyToClipboard(curator.pitchTemplate, `curator-${idx}`)}
                                >
                                  {copiedId === `curator-${idx}` ? (
                                    <Check className="w-4 h-4 text-green-500" />
                                  ) : (
                                    <Copy className="w-4 h-4" />
                                  )}
                                </Button>
                              </div>
                            </div>
                            <p className="text-xs">
                              <span className="font-medium">Subject:</span> {curator.subjectLine}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                )}
              </div>
            </TabsContent>

            {/* TAB 4: SEO Optimizer */}
            <TabsContent value="seo" className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <Card className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-4">
                      <Search className="h-5 w-5 text-green-500" />
                      <h3 className="text-lg font-semibold">SEO Optimizer</h3>
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Content Type</label>
                      <select
                        className="w-full p-2 rounded border bg-background"
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
                      <label className="text-sm font-medium mb-2 block">Content to Optimize</label>
                      <textarea
                        className="w-full p-3 rounded border bg-background min-h-[120px]"
                        placeholder="Enter your content here..."
                        value={seoContent}
                        onChange={(e) => setSeoContent(e.target.value)}
                        data-testid="textarea-seo-content"
                      />
                    </div>
                    <Button
                      className="w-full bg-green-500 hover:bg-green-600"
                      onClick={handleSEOOptimizer}
                      disabled={seoOptimizerMutation.isPending}
                      data-testid="button-optimize-seo"
                    >
                      {seoOptimizerMutation.isPending ? (
                        <>
                          <Sparkles className="w-4 h-4 mr-2 animate-spin" />
                          Optimizing...
                        </>
                      ) : (
                        <>
                          <Search className="w-4 h-4 mr-2" />
                          Optimize for Spotify
                        </>
                      )}
                    </Button>
                  </div>
                </Card>

                {/* SEO Results */}
                {seoOptimization && (
                  <Card className="p-6 max-h-[600px] overflow-y-auto">
                    <h3 className="text-lg font-semibold mb-4" data-testid="seo-results-title">
                      Optimized Versions
                    </h3>
                    <div className="mb-4 p-4 bg-green-500/5 rounded">
                      <p className="text-sm text-muted-foreground">Current SEO Score</p>
                      <p className={`text-3xl font-bold ${getScoreColor(seoOptimization.optimization?.analysis?.currentScore || 0)}`}>
                        {seoOptimization.optimization?.analysis?.currentScore || 0}/100
                      </p>
                    </div>
                    <div className="space-y-4">
                      {seoOptimization.optimization?.optimizedVersions?.map((version: any, idx: number) => (
                        <div key={idx} className="p-4 bg-background rounded border">
                          <div className="flex items-center justify-between mb-2">
                            <Badge>{version.style}</Badge>
                            <Badge className={getScoreColor(version.seoScore)}>
                              {version.seoScore}/100
                            </Badge>
                          </div>
                          <div className="relative">
                            <p className="p-3 bg-green-500/5 rounded text-sm">{version.content}</p>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="absolute top-1 right-1"
                              onClick={() => copyToClipboard(version.content, `seo-${idx}`)}
                            >
                              {copiedId === `seo-${idx}` ? (
                                <Check className="w-4 h-4 text-green-500" />
                              ) : (
                                <Copy className="w-4 h-4" />
                              )}
                            </Button>
                          </div>
                          <p className="text-xs text-muted-foreground mt-2">{version.reasoning}</p>
                        </div>
                      ))}
                    </div>
                  </Card>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
