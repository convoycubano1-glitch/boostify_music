import { Header } from "../components/layout/header";
import { Card } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { useState, useEffect } from "react";
import { useAuth } from "../hooks/use-auth";
import { useToast } from "../hooks/use-toast";
import { motion } from "framer-motion";
import { SiInstagram } from "react-icons/si";
import { Link } from "wouter";
import { queryClient } from "../lib/queryClient";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Home,
  Sparkles,
  Hash,
  Lightbulb,
  Clock,
  User,
  Copy,
  Check,
  Users,
  TrendingUp,
  MessageCircle,
  Globe,
  Calendar,
  UserPlus,
  BarChart2,
  Brain,
  Target,
  ChevronRight,
  BadgeCheck,
  Share2,
  Rocket,
  SendHorizontal
} from "lucide-react";

export default function InstagramBoostPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("captions");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Get artist profile for auto-fill
  const { data: artistProfile } = useQuery({
    queryKey: ['/api/user/profile'],
    enabled: !!user
  });

  // Caption Generator States
  const [postTopic, setPostTopic] = useState("");
  const [tone, setTone] = useState("professional");
  const [targetAudience, setTargetAudience] = useState("");
  const [includeEmojis, setIncludeEmojis] = useState(true);
  const [includeHashtags, setIncludeHashtags] = useState(true);
  const [captionResults, setCaptionResults] = useState<any>(null);

  // Hashtag Generator States
  const [hashtagNiche, setHashtagNiche] = useState("");
  const [contentType, setContentType] = useState("");
  const [targetSize, setTargetSize] = useState("mixed");
  const [hashtagResults, setHashtagResults] = useState<any>(null);

  // Content Ideas States
  const [ideasNiche, setIdeasNiche] = useState("");
  const [goals, setGoals] = useState("");
  const [postingFrequency, setPostingFrequency] = useState("");
  const [contentIdeas, setContentIdeas] = useState<any>(null);

  // Best Time States
  const [timeNiche, setTimeNiche] = useState("");
  const [timeAudience, setTimeAudience] = useState("");
  const [timezone, setTimezone] = useState("UTC");
  const [timeAnalysis, setTimeAnalysis] = useState<any>(null);

  // Bio Optimizer States
  const [currentBio, setCurrentBio] = useState("");
  const [bioNiche, setBioNiche] = useState("");
  const [bioGoals, setBioGoals] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [bioResults, setBioResults] = useState<any>(null);

  // Auto-fill bio from profile
  useEffect(() => {
    if (artistProfile && activeTab === 'bio') {
      setCurrentBio(artistProfile.biography || '');
      setBioNiche(artistProfile.genre || '');
      setWebsiteUrl(artistProfile.website || '');
    }
  }, [artistProfile, activeTab]);

  // Mutation: Caption Generator
  const captionMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/instagram/caption-generator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data)
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to generate captions');
      }
      return response.json();
    },
    onSuccess: (data) => {
      setCaptionResults(data);
      toast({
        title: "✅ Captions Generated",
        description: `Created ${data.captions?.length || 0} caption options`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Mutation: Hashtag Generator
  const hashtagMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/instagram/hashtag-generator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data)
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to generate hashtags');
      }
      return response.json();
    },
    onSuccess: (data) => {
      setHashtagResults(data);
      toast({
        title: "✅ Hashtags Generated",
        description: "Created optimized hashtag sets",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Mutation: Content Ideas
  const contentIdeasMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/instagram/content-ideas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data)
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to generate content ideas');
      }
      return response.json();
    },
    onSuccess: (data) => {
      setContentIdeas(data);
      toast({
        title: "✅ Content Ideas Generated",
        description: `Created ${data.ideas?.length || 0} content ideas`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Mutation: Best Time Analyzer
  const bestTimeMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/instagram/best-time-analyzer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data)
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to analyze best times');
      }
      return response.json();
    },
    onSuccess: (data) => {
      setTimeAnalysis(data);
      toast({
        title: "✅ Analysis Complete",
        description: "Best posting times generated",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Mutation: Bio Optimizer
  const bioMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/instagram/bio-optimizer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data)
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to optimize bio');
      }
      return response.json();
    },
    onSuccess: (data) => {
      setBioResults(data);
      toast({
        title: "✅ Bio Optimized",
        description: `Generated ${data.optimization?.optimizedBios?.length || 0} bio versions`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    toast({ title: "Copied to clipboard!" });
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 pt-20">
        <div className="flex-1 space-y-8 p-8 pt-6 bg-gradient-to-b from-background to-background/80">
          {/* Hero Section with Video Background */}
          <div className="relative w-full min-h-[60vh] sm:min-h-[70vh] overflow-hidden rounded-2xl">
            <video
              autoPlay
              loop
              muted
              playsInline
              className="absolute inset-0 w-full h-full object-cover opacity-50"
              src="/assets/instagram_promo.mp4"
            />
            <div className="absolute inset-0 bg-gradient-to-br from-orange-900/90 via-orange-600/80 to-background" />
            <div className="relative h-full flex items-center">
              <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="max-w-2xl space-y-6">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                  >
                    <span className="inline-flex items-center rounded-full bg-orange-500/10 px-3 py-1.5 text-sm font-medium text-orange-500 ring-1 ring-inset ring-orange-500/20 mb-6">
                      <Sparkles className="mr-1.5 h-3.5 w-3.5" /> AI-Powered Growth
                    </span>
                    <h1 className="text-3xl sm:text-4xl md:text-6xl font-bold text-white mb-4 sm:mb-6 leading-tight">
                      Instagram Growth
                      <span className="block bg-clip-text text-transparent bg-gradient-to-r from-orange-400 to-orange-600">
                        Reimagined
                      </span>
                    </h1>
                    <p className="text-base sm:text-lg md:text-xl text-white/90 mb-8 font-medium max-w-xl">
                      Transform your Instagram presence with our AI-powered platform. Grow organically and engage authentically.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4">
                      <Button
                        size="lg"
                        className="w-full sm:w-auto bg-orange-500 hover:bg-orange-600 text-white px-6 py-3"
                      >
                        <Sparkles className="mr-2 h-5 w-5" />
                        Start Growing
                      </Button>
                      <Link href="/dashboard">
                        <Button
                          size="lg"
                          variant="outline"
                          className="w-full sm:w-auto bg-black/50 hover:bg-black/60 border-white/20 text-white px-6 py-3"
                        >
                          <Home className="mr-2 h-4 w-4" />
                          Dashboard
                        </Button>
                      </Link>
                    </div>
                  </motion.div>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {[
              { icon: Users, label: "Active Users", value: "10K+" },
              { icon: TrendingUp, label: "Growth Rate", value: "85%" },
              { icon: MessageCircle, label: "Engagement", value: "95%" },
              { icon: Globe, label: "Countries", value: "150+" }
            ].map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-gradient-to-br from-orange-500/10 to-orange-600/5 backdrop-blur-md rounded-xl p-4 sm:p-6 border border-orange-500/20"
              >
                <div className="flex items-center gap-3 mb-2">
                  <stat.icon className="h-5 w-5 text-orange-500" />
                  <h3 className="text-sm font-medium text-muted-foreground">{stat.label}</h3>
                </div>
                <p className="text-2xl sm:text-3xl font-bold">{stat.value}</p>
              </motion.div>
            ))}
          </div>

          {/* Main Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid grid-cols-5 w-full max-w-4xl mx-auto">
              <TabsTrigger value="captions" className="gap-2">
                <Sparkles className="w-4 h-4" />
                Captions
              </TabsTrigger>
              <TabsTrigger value="hashtags" className="gap-2">
                <Hash className="w-4 h-4" />
                Hashtags
              </TabsTrigger>
              <TabsTrigger value="ideas" className="gap-2">
                <Lightbulb className="w-4 h-4" />
                Ideas
              </TabsTrigger>
              <TabsTrigger value="timing" className="gap-2">
                <Clock className="w-4 h-4" />
                Timing
              </TabsTrigger>
              <TabsTrigger value="bio" className="gap-2">
                <User className="w-4 h-4" />
                Bio
              </TabsTrigger>
            </TabsList>

            {/* TAB 1: Caption Generator */}
            <TabsContent value="captions" className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <Card className="p-6">
                  <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-pink-500" />
                    Generate Captions
                  </h3>
                  <div className="space-y-4">
                    <Input placeholder="Post Topic (e.g., New Product Launch)" value={postTopic} onChange={(e) => setPostTopic(e.target.value)} />
                    <select className="w-full p-2 rounded border bg-background" value={tone} onChange={(e) => setTone(e.target.value)}>
                      <option value="professional">Professional</option>
                      <option value="casual">Casual</option>
                      <option value="funny">Funny</option>
                      <option value="inspirational">Inspirational</option>
                      <option value="educational">Educational</option>
                    </select>
                    <Input placeholder="Target Audience (optional)" value={targetAudience} onChange={(e) => setTargetAudience(e.target.value)} />
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2">
                        <input type="checkbox" checked={includeEmojis} onChange={(e) => setIncludeEmojis(e.target.checked)} />
                        Include Emojis
                      </label>
                      <label className="flex items-center gap-2">
                        <input type="checkbox" checked={includeHashtags} onChange={(e) => setIncludeHashtags(e.target.checked)} />
                        Include Hashtags
                      </label>
                    </div>
                    <Button className="w-full bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600" onClick={() => captionMutation.mutate({ postTopic, tone, targetAudience, includeEmojis, includeHashtags })} disabled={!postTopic || captionMutation.isPending}>
                      {captionMutation.isPending ? "Generating..." : "Generate Captions"}
                    </Button>
                  </div>
                </Card>

                {captionResults && (
                  <Card className="p-6 max-h-[600px] overflow-y-auto">
                    <h3 className="text-lg font-semibold mb-4">Generated Captions ({captionResults.captions?.length || 0})</h3>
                    <div className="space-y-4">
                      {captionResults.captions?.map((caption: any, idx: number) => (
                        <div key={idx} className="p-4 bg-pink-500/5 rounded border relative">
                          <p className="text-sm mb-2">{caption.text}</p>
                          {caption.hashtags && caption.hashtags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {caption.hashtags.map((tag: string, i: number) => (
                                <Badge key={i} variant="secondary" className="text-xs">#{tag}</Badge>
                              ))}
                            </div>
                          )}
                          <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                            <span>{caption.characterCount} chars</span>
                            <Badge>{caption.engagementScore}/100</Badge>
                          </div>
                          <Button size="sm" variant="ghost" className="absolute top-2 right-2" onClick={() => copyToClipboard(caption.text + (caption.hashtags ? '\n\n' + caption.hashtags.map((t: string) => '#' + t).join(' ') : ''), `caption-${idx}`)}>
                            {copiedId === `caption-${idx}` ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                          </Button>
                        </div>
                      ))}
                    </div>
                  </Card>
                )}
              </div>
            </TabsContent>

            {/* TAB 2: Hashtag Generator */}
            <TabsContent value="hashtags" className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <Card className="p-6">
                  <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <Hash className="w-5 h-5 text-purple-500" />
                    Generate Hashtags
                  </h3>
                  <div className="space-y-4">
                    <Input placeholder="Niche (e.g., Fitness, Fashion)" value={hashtagNiche} onChange={(e) => setHashtagNiche(e.target.value)} />
                    <Input placeholder="Content Type (e.g., Reel, Photo)" value={contentType} onChange={(e) => setContentType(e.target.value)} />
                    <select className="w-full p-2 rounded border bg-background" value={targetSize} onChange={(e) => setTargetSize(e.target.value)}>
                      <option value="mixed">Mixed Sizes</option>
                      <option value="high">High Competition</option>
                      <option value="medium">Medium Competition</option>
                      <option value="low">Low Competition</option>
                    </select>
                    <Button className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600" onClick={() => hashtagMutation.mutate({ niche: hashtagNiche, contentType, targetSize })} disabled={!hashtagNiche || hashtagMutation.isPending}>
                      {hashtagMutation.isPending ? "Generating..." : "Generate Hashtags"}
                    </Button>
                  </div>
                </Card>

                {hashtagResults && (
                  <Card className="p-6 max-h-[600px] overflow-y-auto">
                    <h3 className="text-lg font-semibold mb-4">Hashtag Sets</h3>
                    <div className="space-y-4">
                      {hashtagResults.hashtags?.highCompetition && (
                        <div className="p-4 bg-red-500/5 rounded border">
                          <p className="font-medium mb-2">🔥 High Competition (1M+)</p>
                          <div className="flex flex-wrap gap-1">
                            {hashtagResults.hashtags.highCompetition.map((tag: string, i: number) => (
                              <Badge key={i} variant="destructive" className="text-xs">#{tag}</Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      {hashtagResults.hashtags?.mediumCompetition && (
                        <div className="p-4 bg-yellow-500/5 rounded border">
                          <p className="font-medium mb-2">⚡ Medium Competition (100K-1M)</p>
                          <div className="flex flex-wrap gap-1">
                            {hashtagResults.hashtags.mediumCompetition.map((tag: string, i: number) => (
                              <Badge key={i} variant="secondary" className="text-xs">#{tag}</Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      {hashtagResults.hashtags?.lowCompetition && (
                        <div className="p-4 bg-green-500/5 rounded border">
                          <p className="font-medium mb-2">✨ Low Competition (&lt;100K)</p>
                          <div className="flex flex-wrap gap-1">
                            {hashtagResults.hashtags.lowCompetition.map((tag: string, i: number) => (
                              <Badge key={i} className="text-xs bg-green-500">#{tag}</Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      {hashtagResults.hashtags?.trending && (
                        <div className="p-4 bg-purple-500/5 rounded border">
                          <p className="font-medium mb-2">📈 Trending Now</p>
                          <div className="flex flex-wrap gap-1">
                            {hashtagResults.hashtags.trending.map((tag: string, i: number) => (
                              <Badge key={i} className="text-xs bg-purple-500">#{tag}</Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      {hashtagResults.hashtags?.bestPractices && (
                        <div className="p-3 bg-blue-500/5 rounded text-sm">
                          <p className="font-medium mb-1">💡 Best Practices:</p>
                          <p className="text-muted-foreground">{hashtagResults.hashtags.bestPractices}</p>
                        </div>
                      )}
                    </div>
                  </Card>
                )}
              </div>
            </TabsContent>

            {/* TAB 3: Content Ideas */}
            <TabsContent value="ideas" className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <Card className="p-6">
                  <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <Lightbulb className="w-5 h-5 text-yellow-500" />
                    Content Ideas
                  </h3>
                  <div className="space-y-4">
                    <Input placeholder="Niche (e.g., Music, Travel)" value={ideasNiche} onChange={(e) => setIdeasNiche(e.target.value)} />
                    <Input placeholder="Goals (e.g., Increase engagement)" value={goals} onChange={(e) => setGoals(e.target.value)} />
                    <Input placeholder="Posting Frequency (e.g., 5 times/week)" value={postingFrequency} onChange={(e) => setPostingFrequency(e.target.value)} />
                    <Button className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600" onClick={() => contentIdeasMutation.mutate({ niche: ideasNiche, goals, postingFrequency })} disabled={!ideasNiche || contentIdeasMutation.isPending}>
                      {contentIdeasMutation.isPending ? "Generating..." : "Generate Ideas"}
                    </Button>
                  </div>
                </Card>

                {contentIdeas && (
                  <Card className="p-6 max-h-[600px] overflow-y-auto">
                    <h3 className="text-lg font-semibold mb-4">Content Ideas ({contentIdeas.ideas?.length || 0})</h3>
                    <div className="space-y-3">
                      {contentIdeas.ideas?.map((idea: any, idx: number) => (
                        <div key={idx} className="p-4 bg-yellow-500/5 rounded border">
                          <div className="flex items-center justify-between mb-2">
                            <Badge className="bg-orange-500">{idea.contentType}</Badge>
                            <Badge variant={idea.engagementLevel === 'high' ? 'default' : 'secondary'}>{idea.engagementLevel} engagement</Badge>
                          </div>
                          <h4 className="font-medium mb-1">{idea.topic}</h4>
                          <p className="text-sm text-muted-foreground mb-2">{idea.description}</p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span>🕐 {idea.bestTimeToPost}</span>
                          </div>
                          {idea.formatTips && <p className="text-xs mt-2 p-2 bg-background rounded">💡 {idea.formatTips}</p>}
                        </div>
                      ))}
                    </div>
                  </Card>
                )}
              </div>
            </TabsContent>

            {/* TAB 4: Best Time Analyzer */}
            <TabsContent value="timing" className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <Card className="p-6">
                  <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-blue-500" />
                    Best Time to Post
                  </h3>
                  <div className="space-y-4">
                    <Input placeholder="Niche (e.g., Fitness)" value={timeNiche} onChange={(e) => setTimeNiche(e.target.value)} />
                    <Input placeholder="Target Audience (e.g., Young adults)" value={timeAudience} onChange={(e) => setTimeAudience(e.target.value)} />
                    <select className="w-full p-2 rounded border bg-background" value={timezone} onChange={(e) => setTimezone(e.target.value)}>
                      <option value="UTC">UTC</option>
                      <option value="America/New_York">Eastern Time</option>
                      <option value="America/Los_Angeles">Pacific Time</option>
                      <option value="Europe/London">London</option>
                      <option value="Europe/Madrid">Madrid</option>
                    </select>
                    <Button className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600" onClick={() => bestTimeMutation.mutate({ niche: timeNiche, targetAudience: timeAudience, timezone })} disabled={!timeNiche || bestTimeMutation.isPending}>
                      {bestTimeMutation.isPending ? "Analyzing..." : "Analyze Best Times"}
                    </Button>
                  </div>
                </Card>

                {timeAnalysis && (
                  <Card className="p-6 max-h-[600px] overflow-y-auto">
                    <h3 className="text-lg font-semibold mb-4">Optimal Posting Schedule</h3>
                    <div className="space-y-4">
                      {timeAnalysis.analysis?.bestTimes && Object.entries(timeAnalysis.analysis.bestTimes).map(([day, times]: [string, any]) => (
                        <div key={day} className="p-3 bg-blue-500/5 rounded border">
                          <p className="font-medium capitalize mb-2">{day}</p>
                          <div className="flex flex-wrap gap-2">
                            {Array.isArray(times) && times.map((time: string, i: number) => (
                              <Badge key={i} className="bg-blue-500">{time}</Badge>
                            ))}
                          </div>
                        </div>
                      ))}
                      {timeAnalysis.analysis?.peakHours && (
                        <div className="p-4 bg-green-500/5 rounded border">
                          <p className="font-medium mb-2">🔥 Peak Engagement Hours</p>
                          <div className="flex flex-wrap gap-2">
                            {timeAnalysis.analysis.peakHours.map((hour: string, i: number) => (
                              <Badge key={i} className="bg-green-500">{hour}</Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      {timeAnalysis.analysis?.reasoning && (
                        <div className="p-3 bg-background rounded text-sm">
                          <p className="font-medium mb-1">💡 Why these times?</p>
                          <p className="text-muted-foreground">{timeAnalysis.analysis.reasoning}</p>
                        </div>
                      )}
                    </div>
                  </Card>
                )}
              </div>
            </TabsContent>

            {/* TAB 5: Bio Optimizer */}
            <TabsContent value="bio" className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <Card className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-semibold flex items-center gap-2">
                      <User className="w-5 h-5 text-green-500" />
                      Bio Optimizer
                    </h3>
                    {artistProfile?.biography && <Badge variant="secondary" className="text-xs">✨ Auto-filled</Badge>}
                  </div>
                  <div className="space-y-4">
                    <textarea className="w-full p-3 rounded border bg-background min-h-[80px]" placeholder="Current Bio (or leave empty)" value={currentBio} onChange={(e) => setCurrentBio(e.target.value)} />
                    <Input placeholder="Niche/Genre" value={bioNiche} onChange={(e) => setBioNiche(e.target.value)} />
                    <Input placeholder="Goals (e.g., Get more followers)" value={bioGoals} onChange={(e) => setBioGoals(e.target.value)} />
                    <Input placeholder="Website URL (optional)" value={websiteUrl} onChange={(e) => setWebsiteUrl(e.target.value)} />
                    <Button className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600" onClick={() => bioMutation.mutate({ currentBio, niche: bioNiche, goals: bioGoals, websiteUrl })} disabled={bioMutation.isPending}>
                      {bioMutation.isPending ? "Optimizing..." : "Optimize Bio"}
                    </Button>
                  </div>
                </Card>

                {bioResults && (
                  <Card className="p-6 max-h-[600px] overflow-y-auto">
                    <h3 className="text-lg font-semibold mb-4">Optimized Bios</h3>
                    <div className="space-y-4">
                      {bioResults.optimization?.optimizedBios?.map((bio: any, idx: number) => (
                        <div key={idx} className="p-4 bg-green-500/5 rounded border relative">
                          <div className="flex items-center justify-between mb-2">
                            <Badge className="bg-green-500">{bio.version}</Badge>
                            <span className="text-xs text-muted-foreground">{bio.characterCount} chars</span>
                          </div>
                          <p className="text-sm mb-2 whitespace-pre-wrap">{bio.bio}</p>
                          {bio.keywords && bio.keywords.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {bio.keywords.map((kw: string, i: number) => (
                                <Badge key={i} variant="outline" className="text-xs">{kw}</Badge>
                              ))}
                            </div>
                          )}
                          <Button size="sm" variant="ghost" className="absolute top-2 right-2" onClick={() => copyToClipboard(bio.bio, `bio-${idx}`)}>
                            {copiedId === `bio-${idx}` ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                          </Button>
                        </div>
                      ))}
                      {bioResults.optimization?.linkStrategy && (
                        <div className="p-3 bg-blue-500/5 rounded text-sm">
                          <p className="font-medium mb-1">🔗 Link Strategy:</p>
                          <p className="text-muted-foreground">{bioResults.optimization.linkStrategy}</p>
                        </div>
                      )}
                      {bioResults.optimization?.profileTips && (
                        <div className="p-3 bg-purple-500/5 rounded text-sm">
                          <p className="font-medium mb-1">💡 Profile Tips:</p>
                          <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                            {bioResults.optimization.profileTips.map((tip: string, i: number) => (
                              <li key={i}>{tip}</li>
                            ))}
                          </ul>
                        </div>
                      )}
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
