import { Header } from "../components/layout/header";
import { Card } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Progress } from "../components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { AreaChart, Area, ResponsiveContainer, CartesianGrid, XAxis, YAxis, Tooltip } from 'recharts';
import { useState, useEffect } from "react";
import { useAuth } from "../hooks/use-auth";
import { PlanTierGuard } from "../components/youtube-views/plan-tier-guard";
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
  SendHorizontal,
  Plus,
  Filter,
  Search,
  Edit,
  Trash2,
  Eye,
  Heart,
  ThumbsUp,
  Star,
  DollarSign,
  AlertCircle,
  CheckCircle,
  XCircle,
  Image,
  Video,
  FileText,
  ArrowUpRight,
  ArrowDownRight,
  TrendingDown,
  Zap,
  Award
} from "lucide-react";

export default function InstagramBoostPage() {
  const { user, userSubscription } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("ai-tools");
  const [aiToolTab, setAiToolTab] = useState("captions");
  const [copiedId, setCopiedId] = useState<string | null>(null);

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

  // Community Tab States
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  // Influencers Tab States
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedNiche, setSelectedNiche] = useState("all");

  // Strategies Tab States
  const [hashtagSearch, setHashtagSearch] = useState("");

  // Reports Tab States
  const [dateRange, setDateRange] = useState("7d");
  const [selectedMetric, setSelectedMetric] = useState("engagement");

  // Get artist profile for auto-fill
  const { data: artistProfile } = useQuery({
    queryKey: ['/api/user/profile'],
    enabled: !!user
  });

  // Fetch Community Data
  const { data: calendarData } = useQuery({
    queryKey: ['/api/instagram/community/calendar'],
    enabled: !!user && activeTab === 'community'
  });

  const { data: engagementStats } = useQuery({
    queryKey: ['/api/instagram/community/engagement'],
    enabled: !!user && activeTab === 'community'
  });

  // Fetch Influencers Data
  const { data: campaignsData } = useQuery({
    queryKey: ['/api/instagram/influencers/campaigns'],
    enabled: !!user && activeTab === 'influencers'
  });

  // Fetch Strategies Data
  const { data: contentMixData } = useQuery({
    queryKey: ['/api/instagram/strategies/content-mix'],
    enabled: !!user && activeTab === 'strategies'
  });

  const { data: hashtagsData } = useQuery({
    queryKey: ['/api/instagram/strategies/hashtags'],
    enabled: !!user && activeTab === 'strategies'
  });

  const { data: optimalTimesData } = useQuery({
    queryKey: ['/api/instagram/strategies/optimal-times'],
    enabled: !!user && activeTab === 'strategies'
  });

  // Fetch Reports Data
  const { data: analyticsData } = useQuery({
    queryKey: ['/api/instagram/reports/analytics', dateRange],
    enabled: !!user && activeTab === 'reports'
  });

  // Auto-fill bio from profile
  useEffect(() => {
    if (artistProfile && activeTab === 'bio') {
      setCurrentBio((artistProfile as any)?.biography || '');
      setBioNiche((artistProfile as any)?.genre || '');
      setWebsiteUrl((artistProfile as any)?.website || '');
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

  // Mutation: Influencer Search
  const [influencerResults, setInfluencerResults] = useState<any>(null);
  const influencerSearchMutation = useMutation({
    mutationFn: async (data: { query: string; niche: string }) => {
      const response = await fetch('/api/instagram/influencers/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data)
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to search influencers');
      }
      return response.json();
    },
    onSuccess: (data) => {
      setInfluencerResults(data);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Prepare data with fallbacks
  const contentItems = (calendarData as any)?.contentItems || [];
  const stats = (engagementStats as any) || {};
  const campaigns = (campaignsData as any)?.campaigns || [];
  const campaignStats = (campaignsData as any)?.stats || {};
  const contentMix = (contentMixData as any)?.contentMix || { entertainment: 40, education: 35, promotion: 25 };
  const savedHashtags = (hashtagsData as any)?.savedHashtags || [];
  const engagementData = (analyticsData as any)?.engagementData || [
    { name: 'Mon', value: 420 },
    { name: 'Tue', value: 380 },
    { name: 'Wed', value: 450 },
    { name: 'Thu', value: 390 },
    { name: 'Fri', value: 520 },
    { name: 'Sat', value: 600 },
    { name: 'Sun', value: 480 }
  ];

  // Auto-search influencers when niche changes or search query changes (with debounce)
  useEffect(() => {
    if (activeTab === 'influencers' && influencerSearchMutation) {
      const timer = setTimeout(() => {
        influencerSearchMutation.mutate({ query: searchQuery, niche: selectedNiche });
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [selectedNiche, searchQuery, activeTab]);

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
        <div className="flex-1 space-y-6 p-4 sm:p-6 lg:p-8 pt-6">
          {/* Hero Section - Compact */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <SiInstagram className="h-8 w-8 text-primary" />
                  <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-foreground">
                    Instagram Growth Suite
                  </h1>
                </div>
                <p className="text-muted-foreground text-sm sm:text-base">
                  All-in-one platform for Instagram growth and engagement
                </p>
              </div>
              <Link href="/dashboard">
                <Button
                  variant="outline"
                  className="w-full sm:w-auto"
                  data-testid="button-dashboard"
                >
                  <BarChart2 className="mr-2 h-4 w-4" />
                  Dashboard
                </Button>
              </Link>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
                transition={{ duration: 0.4, delay: index * 0.05 }}
                className="bg-card border border-border p-6 hover:border-primary/30 transition-colors"
                data-testid={`stat-${stat.label.toLowerCase().replace(' ', '-')}`}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-primary/10 flex items-center justify-center">
                    <stat.icon className="h-5 w-5 text-primary" />
                  </div>
                  <span className="text-sm font-medium text-muted-foreground">{stat.label}</span>
                </div>
                <p className="text-3xl font-black text-foreground">{stat.value}</p>
              </motion.div>
            ))}
          </div>

          {/* Main Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <div className="w-full overflow-x-auto">
              <TabsList className="inline-flex w-full sm:w-auto min-w-full sm:min-w-0 p-1 bg-card border border-border">
                <TabsTrigger 
                  value="ai-tools" 
                  className="flex-1 sm:flex-none data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold whitespace-nowrap" 
                  data-testid="tab-ai-tools"
                >
                  <Brain className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2" />
                  <span className="hidden sm:inline">AI Tools</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="community" 
                  className="flex-1 sm:flex-none data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold whitespace-nowrap" 
                  data-testid="tab-community"
                >
                  <Calendar className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2" />
                  <span className="hidden sm:inline">Community</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="influencers" 
                  className="flex-1 sm:flex-none data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold whitespace-nowrap" 
                  data-testid="tab-influencers"
                >
                  <UserPlus className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2" />
                  <span className="hidden sm:inline">Influencers</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="strategies" 
                  className="flex-1 sm:flex-none data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold whitespace-nowrap" 
                  data-testid="tab-strategies"
                >
                  <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2" />
                  <span className="hidden sm:inline">Strategies</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="reports" 
                  className="flex-1 sm:flex-none data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold whitespace-nowrap" 
                  data-testid="tab-reports"
                >
                  <BarChart2 className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2" />
                  <span className="hidden sm:inline">Reports</span>
                </TabsTrigger>
              </TabsList>
            </div>

            {/* AI Tools Tab - Contains all 5 AI Tools - FIRST AND MOST VISIBLE */}
            <TabsContent value="ai-tools">
              <PlanTierGuard 
                requiredPlan="basic" 
                userSubscription={userSubscription} 
                featureName="AI Tools"
              >
              <div className="mb-6">
                <h2 className="text-2xl font-bold mb-2">AI-Powered Instagram Tools</h2>
                <p className="text-muted-foreground">Generate professional content with our advanced AI assistants</p>
              </div>

              <Tabs value={aiToolTab} onValueChange={setAiToolTab} className="space-y-6">
                <TabsList className="grid grid-cols-5 w-full max-w-3xl mx-auto">
                  <TabsTrigger value="captions" className="gap-2" data-testid="aitab-captions">
                    <Sparkles className="w-4 h-4" />
                    Captions
                  </TabsTrigger>
                  <TabsTrigger value="hashtags" className="gap-2" data-testid="aitab-hashtags">
                    <Hash className="w-4 h-4" />
                    Hashtags
                  </TabsTrigger>
                  <TabsTrigger value="ideas" className="gap-2" data-testid="aitab-ideas">
                    <Lightbulb className="w-4 h-4" />
                    Ideas
                  </TabsTrigger>
                  <TabsTrigger value="timing" className="gap-2" data-testid="aitab-timing">
                    <Clock className="w-4 h-4" />
                    Timing
                  </TabsTrigger>
                  <TabsTrigger value="bio" className="gap-2" data-testid="aitab-bio">
                    <User className="w-4 h-4" />
                    Bio
                  </TabsTrigger>
                </TabsList>

                {/* Caption Generator - BASIC */}
                <TabsContent value="captions" className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <Card className="p-6">
                  <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-pink-500" />
                    Generate Captions
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium mb-1 block">Post Topic <span className="text-red-500">*</span></label>
                      <Input placeholder="e.g., New Product Launch, Behind the scenes" value={postTopic} onChange={(e) => setPostTopic(e.target.value)} data-testid="input-post-topic" />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">Tone</label>
                      <select className="w-full p-2 rounded border bg-background" value={tone} onChange={(e) => setTone(e.target.value)} data-testid="select-tone">
                        <option value="professional">Professional</option>
                        <option value="casual">Casual</option>
                        <option value="funny">Funny</option>
                        <option value="inspirational">Inspirational</option>
                        <option value="educational">Educational</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">Target Audience (optional)</label>
                      <Input placeholder="e.g., Gen Z, Professionals, Parents" value={targetAudience} onChange={(e) => setTargetAudience(e.target.value)} data-testid="input-target-audience" />
                    </div>
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
                    <Button 
                      className="w-full bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600" 
                      onClick={() => captionMutation.mutate({ postTopic, tone, targetAudience, includeEmojis, includeHashtags })} 
                      disabled={!postTopic || captionMutation.isPending}
                      data-testid="button-generate-captions"
                    >
                      {captionMutation.isPending ? "Generating..." : "Generate Captions"}
                    </Button>
                  </div>
                </Card>

                {captionResults && (
                  <Card className="p-6 max-h-[600px] overflow-y-auto">
                    <h3 className="text-lg font-semibold mb-4">Generated Captions ({captionResults.captions?.length || 0})</h3>
                    <div className="space-y-4">
                      {captionResults.captions?.map((caption: any, idx: number) => (
                        <div key={idx} className="p-4 bg-pink-500/5 rounded border relative" data-testid={`caption-result-${idx}`}>
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

            {/* Hashtag Generator */}
            <TabsContent value="hashtags" className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <Card className="p-6">
                  <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <Hash className="w-5 h-5 text-purple-500" />
                    Generate Hashtags
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium mb-1 block">Niche <span className="text-red-500">*</span></label>
                      <Input placeholder="e.g., Fitness, Fashion, Music, Travel" value={hashtagNiche} onChange={(e) => setHashtagNiche(e.target.value)} data-testid="input-hashtag-niche" />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">Content Type</label>
                      <Input placeholder="e.g., Reel, Photo, Story" value={contentType} onChange={(e) => setContentType(e.target.value)} data-testid="input-content-type" />
                    </div>
                    <select className="w-full p-2 rounded border bg-background" value={targetSize} onChange={(e) => setTargetSize(e.target.value)} data-testid="select-target-size">
                      <option value="mixed">Mixed Sizes</option>
                      <option value="high">High Competition</option>
                      <option value="medium">Medium Competition</option>
                      <option value="low">Low Competition</option>
                    </select>
                    <Button 
                      className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600" 
                      onClick={() => hashtagMutation.mutate({ niche: hashtagNiche, contentType, targetSize })} 
                      disabled={!hashtagNiche || hashtagMutation.isPending}
                      data-testid="button-generate-hashtags"
                    >
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

            {/* Content Ideas */}
            <TabsContent value="ideas" className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <Card className="p-6">
                  <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <Lightbulb className="w-5 h-5 text-yellow-500" />
                    Content Ideas
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium mb-1 block">Niche <span className="text-red-500">*</span></label>
                      <Input placeholder="e.g., Music, Travel, Food, Tech" value={ideasNiche} onChange={(e) => setIdeasNiche(e.target.value)} data-testid="input-ideas-niche" />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">Goals</label>
                      <Input placeholder="e.g., Increase engagement, Build community" value={goals} onChange={(e) => setGoals(e.target.value)} data-testid="input-goals" />
                    </div>
                    <Input placeholder="Posting Frequency (e.g., 5 times/week)" value={postingFrequency} onChange={(e) => setPostingFrequency(e.target.value)} data-testid="input-posting-frequency" />
                    <Button 
                      className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600" 
                      onClick={() => contentIdeasMutation.mutate({ niche: ideasNiche, goals, postingFrequency })} 
                      disabled={!ideasNiche || contentIdeasMutation.isPending}
                      data-testid="button-generate-ideas"
                    >
                      {contentIdeasMutation.isPending ? "Generating..." : "Generate Ideas"}
                    </Button>
                  </div>
                </Card>

                {contentIdeas && (
                  <Card className="p-6 max-h-[600px] overflow-y-auto">
                    <h3 className="text-lg font-semibold mb-4">Content Ideas ({contentIdeas.ideas?.length || 0})</h3>
                    <div className="space-y-3">
                      {contentIdeas.ideas?.map((idea: any, idx: number) => (
                        <div key={idx} className="p-4 bg-yellow-500/5 rounded border" data-testid={`idea-result-${idx}`}>
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

            {/* Best Time Analyzer */}
            <TabsContent value="timing" className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <Card className="p-6">
                  <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-blue-500" />
                    Best Time to Post
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium mb-1 block">Niche <span className="text-red-500">*</span></label>
                      <Input placeholder="e.g., Fitness, Business, Art" value={timeNiche} onChange={(e) => setTimeNiche(e.target.value)} data-testid="input-time-niche" />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">Target Audience</label>
                      <Input placeholder="e.g., Young adults, Professionals, Students" value={timeAudience} onChange={(e) => setTimeAudience(e.target.value)} data-testid="input-time-audience" />
                    </div>
                    <select className="w-full p-2 rounded border bg-background" value={timezone} onChange={(e) => setTimezone(e.target.value)} data-testid="select-timezone">
                      <option value="UTC">UTC</option>
                      <option value="America/New_York">Eastern Time</option>
                      <option value="America/Chicago">Central Time</option>
                      <option value="America/Denver">Mountain Time</option>
                      <option value="America/Los_Angeles">Pacific Time</option>
                      <option value="Europe/London">London</option>
                      <option value="Europe/Madrid">Madrid</option>
                    </select>
                    <Button 
                      className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600" 
                      onClick={() => bestTimeMutation.mutate({ niche: timeNiche, targetAudience: timeAudience, timezone })} 
                      disabled={!timeNiche || bestTimeMutation.isPending}
                      data-testid="button-analyze-time"
                    >
                      {bestTimeMutation.isPending ? "Analyzing..." : "Analyze Best Times"}
                    </Button>
                  </div>
                </Card>

                {timeAnalysis && (
                  <Card className="p-6 max-h-[600px] overflow-y-auto">
                    <h3 className="text-lg font-semibold mb-4">Best Posting Times</h3>
                    <div className="space-y-4">
                      {timeAnalysis.weekdaySchedule && (
                        <div className="p-4 bg-blue-500/5 rounded border">
                          <p className="font-medium mb-2">📅 Weekday Schedule</p>
                          <div className="space-y-2 text-sm">
                            {Object.entries(timeAnalysis.weekdaySchedule).map(([day, times]: [string, any]) => (
                              <div key={day} className="flex justify-between">
                                <span className="font-medium capitalize">{day}:</span>
                                <span className="text-muted-foreground">{times.join(', ')}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {timeAnalysis.peakEngagementHours && (
                        <div className="p-4 bg-green-500/5 rounded border">
                          <p className="font-medium mb-2">🔥 Peak Engagement Hours</p>
                          <div className="flex flex-wrap gap-2">
                            {timeAnalysis.peakEngagementHours.map((hour: string, i: number) => (
                              <Badge key={i} className="bg-green-500">{hour}</Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      {timeAnalysis.recommendations && (
                        <div className="p-3 bg-purple-500/5 rounded text-sm">
                          <p className="font-medium mb-1">💡 Recommendations:</p>
                          <p className="text-muted-foreground">{timeAnalysis.recommendations}</p>
                        </div>
                      )}
                    </div>
                  </Card>
                )}
              </div>
            </TabsContent>

            {/* Bio Optimizer */}
            <TabsContent value="bio" className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <Card className="p-6">
                  <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <User className="w-5 h-5 text-green-500" />
                    Optimize Bio
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium mb-1 block">Current Bio (optional)</label>
                      <textarea 
                        className="w-full p-2 rounded border bg-background min-h-[100px]" 
                        placeholder="Paste your current bio here if you want to improve it" 
                        value={currentBio} 
                        onChange={(e) => setCurrentBio(e.target.value)}
                        data-testid="textarea-current-bio"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">Niche <span className="text-red-500">*</span></label>
                      <Input placeholder="e.g., Travel Blogger, Musician, Coach" value={bioNiche} onChange={(e) => setBioNiche(e.target.value)} data-testid="input-bio-niche" />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">Goals</label>
                      <Input placeholder="e.g., Drive sales, Build brand, Get collaborations" value={bioGoals} onChange={(e) => setBioGoals(e.target.value)} data-testid="input-bio-goals" />
                    </div>
                    <Input placeholder="Website URL (optional)" value={websiteUrl} onChange={(e) => setWebsiteUrl(e.target.value)} data-testid="input-website-url" />
                    <Button 
                      className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600" 
                      onClick={() => bioMutation.mutate({ currentBio, niche: bioNiche, goals: bioGoals, websiteUrl })} 
                      disabled={!bioNiche || bioMutation.isPending}
                      data-testid="button-optimize-bio"
                    >
                      {bioMutation.isPending ? "Optimizing..." : "Optimize Bio"}
                    </Button>
                  </div>
                </Card>

                {bioResults && (
                  <Card className="p-6 max-h-[600px] overflow-y-auto">
                    <h3 className="text-lg font-semibold mb-4">Optimized Bios ({bioResults.optimization?.bios?.length || 0})</h3>
                    <div className="space-y-4">
                      {bioResults.optimization?.bios?.map((bio: any, idx: number) => (
                        <div key={idx} className="p-4 bg-green-500/5 rounded border relative" data-testid={`bio-result-${idx}`}>
                          <p className="text-sm mb-2">{bio.bio}</p>
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
              </PlanTierGuard>
            </TabsContent>

            {/* Community Tab - PRO */}
            <TabsContent value="community" className="space-y-6">
              <PlanTierGuard 
                requiredPlan="pro" 
                userSubscription={userSubscription} 
                featureName="Community Tools"
              >
              {/* Quick Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[
                  { label: "Posts This Week", value: "12", change: "+15%", icon: FileText, trend: "up" },
                  { label: "Engagement Rate", value: "8.4%", change: "+2.3%", icon: Heart, trend: "up" },
                  { label: "Comments", value: "342", change: "+12%", icon: MessageCircle, trend: "up" },
                  { label: "New Followers", value: "156", change: "+8%", icon: Users, trend: "up" }
                ].map((stat, idx) => (
                  <Card key={idx} className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <stat.icon className="h-5 w-5 text-orange-500" />
                      <Badge variant="outline" className={stat.trend === "up" ? "text-green-500" : "text-red-500"}>
                        {stat.change}
                      </Badge>
                    </div>
                    <div className="text-2xl font-bold">{stat.value}</div>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                  </Card>
                ))}
              </div>

              <div className="grid gap-6 lg:grid-cols-2">
                {/* Content Calendar */}
                <Card className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-xl font-semibold flex items-center gap-2">
                        <Calendar className="h-5 w-5 text-orange-500" />
                        Content Calendar
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1">Manage your posting schedule</p>
                    </div>
                    <Button size="sm" className="bg-orange-500 hover:bg-orange-600">
                      <Plus className="h-4 w-4 mr-2" />
                      New Post
                    </Button>
                  </div>

                  <div className="space-y-3">
                    {contentItems.map((item: any) => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-4 rounded-lg border border-orange-500/20 hover:border-orange-500/40 bg-orange-500/5 transition-all group"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              {item.type === 'post' && <Image className="h-4 w-4 text-orange-500" />}
                              {item.type === 'story' && <Zap className="h-4 w-4 text-purple-500" />}
                              {item.type === 'reel' && <Video className="h-4 w-4 text-pink-500" />}
                              <span className="font-medium">{item.title}</span>
                            </div>
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <span>{new Date(item.date).toLocaleDateString()}</span>
                              <Badge variant={item.status === 'published' ? "default" : "outline"} className="text-xs">
                                {item.status}
                              </Badge>
                            </div>
                          </div>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button variant="ghost" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </Card>

                {/* Engagement Dashboard */}
                <Card className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-xl font-semibold flex items-center gap-2">
                        <MessageCircle className="h-5 w-5 text-orange-500" />
                        Engagement Dashboard
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1">Monitor interactions</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {/* Recent Activity */}
                    <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                      <div className="flex items-center gap-3 mb-3">
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        <span className="font-medium">45 Comments Pending</span>
                      </div>
                      <Button variant="outline" size="sm" className="w-full">
                        Respond Now
                      </Button>
                    </div>

                    <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
                      <div className="flex items-center gap-3 mb-3">
                        <ThumbsUp className="h-5 w-5 text-blue-500" />
                        <span className="font-medium">127 New Likes Today</span>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        +23% from yesterday
                      </div>
                    </div>

                    <div className="p-4 rounded-lg bg-purple-500/10 border border-purple-500/20">
                      <div className="flex items-center gap-3 mb-3">
                        <Star className="h-5 w-5 text-purple-500" />
                        <span className="font-medium">Top Performing Post</span>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">"Behind the Scenes"</p>
                      <div className="flex gap-4 text-xs">
                        <span>❤️ 234</span>
                        <span>💬 45</span>
                        <span>📤 12</span>
                      </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="pt-4 space-y-2">
                      <h4 className="font-medium text-sm mb-3">Quick Actions</h4>
                      <div className="grid grid-cols-2 gap-2">
                        <Button variant="outline" size="sm" className="w-full text-xs sm:text-sm">
                          <Heart className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 text-red-500" />
                          <span className="hidden sm:inline">Like Posts</span>
                          <span className="sm:hidden">Like</span>
                        </Button>
                        <Button variant="outline" size="sm" className="w-full text-xs sm:text-sm">
                          <MessageCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 text-blue-500" />
                          <span className="hidden sm:inline">Reply</span>
                          <span className="sm:hidden">Reply</span>
                        </Button>
                        <Button variant="outline" size="sm" className="w-full text-xs sm:text-sm">
                          <UserPlus className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 text-green-500" />
                          <span className="hidden sm:inline">Follow Back</span>
                          <span className="sm:hidden">Follow</span>
                        </Button>
                        <Button variant="outline" size="sm" className="w-full text-xs sm:text-sm">
                          <Share2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 text-purple-500" />
                          <span className="hidden sm:inline">Share</span>
                          <span className="sm:hidden">Share</span>
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
              </PlanTierGuard>
            </TabsContent>

            {/* Influencers Tab - PREMIUM */}
            <TabsContent value="influencers" className="space-y-6">
              <PlanTierGuard 
                requiredPlan="premium" 
                userSubscription={userSubscription} 
                featureName="Influencer Tools"
              >
              {/* Search and Filters */}
              <Card className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search influencers..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 text-sm"
                    />
                  </div>
                  <select
                    value={selectedNiche}
                    onChange={(e) => setSelectedNiche(e.target.value)}
                    className="px-3 py-2 text-sm border bg-background"
                  >
                    <option value="all">All Niches</option>
                    <option value="fashion">Fashion</option>
                    <option value="tech">Tech</option>
                    <option value="beauty">Beauty</option>
                    <option value="fitness">Fitness</option>
                  </select>
                  <Button variant="outline" size="sm" className="text-xs sm:text-sm">
                    <Filter className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
                    <span className="hidden sm:inline">Filters</span>
                  </Button>
                </div>
              </Card>

              <div className="grid gap-6 lg:grid-cols-3">
                {/* Influencer Cards */}
                <div className="lg:col-span-2 space-y-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Recommended Influencers</h3>
                    <Badge variant="outline">{influencerResults?.influencers?.length || 0} Results</Badge>
                  </div>

                  {influencerSearchMutation.isPending ? (
                    <div className="text-center py-8">
                      <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
                      <p className="text-muted-foreground mt-2">Searching influencers...</p>
                    </div>
                  ) : influencerResults?.influencers?.length > 0 ? (
                    influencerResults.influencers.map((influencer: any, idx: number) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.1 }}
                    >
                      <Card className="p-5 hover:shadow-lg transition-all">
                        <div className="flex gap-4">
                          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-500/20 to-pink-500/20 flex items-center justify-center">
                            <User className="h-8 w-8 text-orange-500" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <h4 className="font-semibold text-lg">{influencer.name}</h4>
                                <p className="text-sm text-muted-foreground">{influencer.niche}</p>
                              </div>
                              <div className="flex items-center gap-1">
                                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                <span className="text-sm font-medium">{influencer.rating}</span>
                              </div>
                            </div>

                            <div className="grid grid-cols-3 gap-4 mb-4">
                              <div>
                                <p className="text-xs text-muted-foreground">Followers</p>
                                <p className="font-semibold">{influencer.followers}</p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">Engagement</p>
                                <p className="font-semibold text-green-500">{influencer.engagement}</p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">Posts</p>
                                <p className="font-semibold">{influencer.posts}</p>
                              </div>
                            </div>

                            <div className="flex flex-wrap gap-2">
                              <Button size="sm" className="bg-primary hover:bg-primary/90 text-xs sm:text-sm">
                                <UserPlus className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                                <span className="hidden sm:inline">Connect</span>
                                <span className="sm:hidden">Add</span>
                              </Button>
                              <Button size="sm" variant="outline" className="text-xs sm:text-sm">
                                <Eye className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                                <span className="hidden sm:inline">View Profile</span>
                                <span className="sm:hidden">View</span>
                              </Button>
                              <Button size="sm" variant="outline" className="text-xs sm:text-sm px-2 sm:px-3">
                                <MessageCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </Card>
                    </motion.div>
                  ))
                  ) : (
                    <div className="text-center py-8">
                      <Users className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                      <p className="text-muted-foreground">No influencers found. Try adjusting your filters.</p>
                    </div>
                  )}
                </div>

                {/* Campaign Management */}
                <div className="space-y-4">
                  <Card className="p-5">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold">Active Campaigns</h3>
                      <Button size="sm" className="bg-orange-500 hover:bg-orange-600">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="space-y-3">
                      {campaigns.map((campaign: any) => (
                        <div key={campaign.id} className="p-4 rounded-lg border border-orange-500/20 bg-orange-500/5">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <h4 className="font-medium text-sm mb-1">{campaign.name}</h4>
                              <p className="text-xs text-muted-foreground">
                                {campaign.influencers} influencers • {campaign.posts} posts
                              </p>
                            </div>
                            <Badge variant={campaign.status === 'active' ? 'default' : 'outline'} className="text-xs">
                              {campaign.status}
                            </Badge>
                          </div>

                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-muted-foreground">Progress</span>
                              <span className="font-medium">{campaign.progress}%</span>
                            </div>
                            <Progress value={campaign.progress} className="h-2" />

                            <div className="flex items-center justify-between mt-3 pt-3 border-t">
                              <div className="flex items-center gap-1 text-xs">
                                <DollarSign className="h-3 w-3 text-green-500" />
                                <span className="font-medium">${campaign.budget.toLocaleString()}</span>
                              </div>
                              <Button size="sm" variant="ghost">
                                <ChevronRight className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>

                  {/* Quick Stats */}
                  <Card className="p-5">
                    <h3 className="font-semibold mb-4">Campaign Stats</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Total Reach</span>
                        <span className="font-semibold">1.2M</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Engagement</span>
                        <span className="font-semibold text-green-500">7.8%</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">ROI</span>
                        <span className="font-semibold text-green-500">+342%</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Total Spend</span>
                        <span className="font-semibold">$8,000</span>
                      </div>
                    </div>
                  </Card>
                </div>
              </div>
              </PlanTierGuard>
            </TabsContent>

            {/* Strategies Tab - PREMIUM */}
            <TabsContent value="strategies" className="space-y-6">
              <PlanTierGuard 
                requiredPlan="premium" 
                userSubscription={userSubscription} 
                featureName="Strategy Tools"
              >
              <div className="grid gap-6 lg:grid-cols-2">
                {/* Content Mix Strategy */}
                <Card className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-xl font-semibold flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-orange-500" />
                        Content Mix Strategy
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1">Optimal balance for growth</p>
                    </div>
                    <Badge variant="outline">Optimized</Badge>
                  </div>

                  <div className="space-y-6">
                    {/* Interactive Sliders */}
                    <div className="space-y-4">
                      {[
                        { name: 'Entertainment', value: contentMix.entertainment, color: 'bg-orange-500' },
                        { name: 'Education', value: contentMix.education, color: 'bg-blue-500' },
                        { name: 'Promotion', value: contentMix.promotion, color: 'bg-green-500' }
                      ].map((type) => (
                        <div key={type.name} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">{type.name}</span>
                            <span className="text-sm font-bold">{type.value}%</span>
                          </div>
                          <div className="relative">
                            <div className="h-3 bg-muted rounded-full overflow-hidden">
                              <div className={`h-full ${type.color} transition-all`} style={{ width: `${type.value}%` }} />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Recommendations */}
                    <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
                      <div className="flex items-start gap-3">
                        <Zap className="h-5 w-5 text-blue-500 mt-0.5" />
                        <div>
                          <h4 className="font-medium text-sm mb-1">AI Recommendation</h4>
                          <p className="text-sm text-muted-foreground">
                            Increase educational content by 5% for better engagement with your target audience.
                          </p>
                        </div>
                      </div>
                    </div>

                    <Button className="w-full bg-orange-500 hover:bg-orange-600">
                      <Target className="h-4 w-4 mr-2" />
                      Apply Recommendations
                    </Button>
                  </div>
                </Card>

                {/* Hashtag Strategy */}
                <Card className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-xl font-semibold flex items-center gap-2">
                        <Hash className="h-5 w-5 text-orange-500" />
                        Hashtag Library
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1">Manage your hashtag sets</p>
                    </div>
                    <Button size="sm" variant="outline">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Set
                    </Button>
                  </div>

                  <div className="space-y-4">
                    {/* Search Bar */}
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search hashtags..."
                        value={hashtagSearch}
                        onChange={(e) => setHashtagSearch(e.target.value)}
                        className="pl-10"
                      />
                    </div>

                    {/* Saved Hashtags */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Saved Sets</span>
                        <Badge variant="outline">{savedHashtags.length} tags</Badge>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {savedHashtags.map((tag: any, idx: number) => (
                          <Badge
                            key={idx}
                            variant="secondary"
                            className="px-3 py-1.5 hover:bg-orange-500/10 cursor-pointer group"
                          >
                            #{tag}
                            <XCircle className="ml-1 h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* Hashtag Performance */}
                    <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                      <h4 className="font-medium text-sm mb-3">Top Performing Tags</h4>
                      <div className="space-y-2">
                        {['trending', 'viral', 'instagood'].map((tag, idx) => (
                          <div key={idx} className="flex items-center justify-between text-sm">
                            <span>#{tag}</span>
                            <div className="flex items-center gap-2">
                              <ArrowUpRight className="h-3 w-3 text-green-500" />
                              <span className="font-medium text-green-500">+{(idx + 1) * 12}%</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <Button className="w-full" variant="outline">
                      <Sparkles className="h-4 w-4 mr-2" />
                      Generate New Set
                    </Button>
                  </div>
                </Card>
              </div>

              {/* Best Posting Times */}
              <Card className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-xl font-semibold flex items-center gap-2">
                      <Clock className="h-5 w-5 text-orange-500" />
                      Optimal Posting Times
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">Based on your audience activity</p>
                  </div>
                  <select className="px-4 py-2 rounded-md border bg-background text-sm">
                    <option>This Week</option>
                    <option>Last 30 Days</option>
                    <option>All Time</option>
                  </select>
                </div>

                <div className="grid grid-cols-7 gap-3">
                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, idx) => (
                    <div key={day} className="text-center">
                      <div className="text-xs font-medium text-muted-foreground mb-2">{day}</div>
                      <div className="space-y-1">
                        {[9, 14, 18].map((hour) => {
                          const isOptimal = (idx === 2 && hour === 18) || (idx === 5 && hour === 14);
                          return (
                            <div
                              key={hour}
                              className={`p-2 rounded text-xs font-medium transition-colors ${
                                isOptimal
                                  ? 'bg-green-500/20 border border-green-500 text-green-500'
                                  : 'bg-muted hover:bg-muted/70'
                              }`}
                            >
                              {hour}:00
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex items-center gap-4 mt-6 p-4 rounded-lg bg-orange-500/10 border border-orange-500/20">
                  <Award className="h-5 w-5 text-orange-500" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Best Time to Post</p>
                    <p className="text-xs text-muted-foreground">Wednesday at 6:00 PM & Saturday at 2:00 PM</p>
                  </div>
                </div>
              </Card>
              </PlanTierGuard>
            </TabsContent>

            {/* Reports Tab - PREMIUM */}
            <TabsContent value="reports" className="space-y-6">
              <PlanTierGuard 
                requiredPlan="premium" 
                userSubscription={userSubscription} 
                featureName="Analytics Reports"
              >
              {/* Date Range Selector */}
              <Card className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <h3 className="font-semibold">Analytics Overview</h3>
                    <Badge variant="outline">{dateRange === '7d' ? 'Last 7 Days' : 'Last 30 Days'}</Badge>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant={dateRange === '7d' ? 'default' : 'outline'}
                      onClick={() => setDateRange('7d')}
                    >
                      7 Days
                    </Button>
                    <Button
                      size="sm"
                      variant={dateRange === '30d' ? 'default' : 'outline'}
                      onClick={() => setDateRange('30d')}
                    >
                      30 Days
                    </Button>
                    <Button
                      size="sm"
                      variant={dateRange === '90d' ? 'default' : 'outline'}
                      onClick={() => setDateRange('90d')}
                    >
                      90 Days
                    </Button>
                  </div>
                </div>
              </Card>

              {/* Performance Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { label: 'Total Followers', value: '24.5K', change: '+12.3%', icon: Users, isPositive: true },
                  { label: 'Avg Engagement Rate', value: '8.2%', change: '+2.1%', icon: Heart, isPositive: true },
                  { label: 'Reach', value: '156K', change: '+18.5%', icon: TrendingUp, isPositive: true }
                ].map((metric, idx) => (
                  <Card key={idx} className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className="p-2 rounded-lg bg-orange-500/10">
                        <metric.icon className="h-5 w-5 text-orange-500" />
                      </div>
                      <Badge
                        variant="outline"
                        className={metric.isPositive ? 'text-green-500 border-green-500' : 'text-red-500 border-red-500'}
                      >
                        {metric.isPositive ? <ArrowUpRight className="h-3 w-3 inline mr-1" /> : <ArrowDownRight className="h-3 w-3 inline mr-1" />}
                        {metric.change}
                      </Badge>
                    </div>
                    <div className="text-2xl font-bold mb-1">{metric.value}</div>
                    <p className="text-sm text-muted-foreground">{metric.label}</p>
                  </Card>
                ))}
              </div>

              <div className="grid gap-6 lg:grid-cols-2">
                {/* Growth Chart */}
                <Card className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-lg font-semibold">Growth Analytics</h3>
                      <p className="text-sm text-muted-foreground">Track your Instagram growth</p>
                    </div>
                    <select
                      value={selectedMetric}
                      onChange={(e) => setSelectedMetric(e.target.value)}
                      className="px-3 py-1.5 rounded-md border bg-background text-sm"
                    >
                      <option value="engagement">Engagement</option>
                      <option value="followers">Followers</option>
                      <option value="reach">Reach</option>
                    </select>
                  </div>

                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={engagementData}>
                        <defs>
                          <linearGradient id="colorGrowth" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#f97316" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#333" opacity={0.1} />
                        <XAxis dataKey="name" stroke="#888" fontSize={12} />
                        <YAxis stroke="#888" fontSize={12} />
                        <Tooltip
                          contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '8px' }}
                          labelStyle={{ color: '#fff' }}
                        />
                        <Area
                          type="monotone"
                          dataKey="value"
                          stroke="#f97316"
                          strokeWidth={2}
                          fillOpacity={1}
                          fill="url(#colorGrowth)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </Card>

                {/* Audience Insights */}
                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-6">Audience Demographics</h3>

                  <div className="space-y-6">
                    {/* Age Distribution */}
                    <div>
                      <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                        <Users className="h-4 w-4 text-orange-500" />
                        Age Distribution
                      </h4>
                      <div className="space-y-3">
                        {[
                          { age: '18-24', percentage: 42, color: 'bg-orange-500' },
                          { age: '25-34', percentage: 35, color: 'bg-blue-500' },
                          { age: '35-44', percentage: 15, color: 'bg-green-500' },
                          { age: '45+', percentage: 8, color: 'bg-purple-500' }
                        ].map((demo) => (
                          <div key={demo.age} className="space-y-1">
                            <div className="flex items-center justify-between text-sm">
                              <span>{demo.age} years</span>
                              <span className="font-medium">{demo.percentage}%</span>
                            </div>
                            <div className="h-2 bg-muted rounded-full overflow-hidden">
                              <div className={`h-full ${demo.color}`} style={{ width: `${demo.percentage}%` }} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Top Locations */}
                    <div>
                      <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                        <Globe className="h-4 w-4 text-orange-500" />
                        Top Locations
                      </h4>
                      <div className="space-y-2">
                        {[
                          { country: '🇺🇸 United States', percentage: 45 },
                          { country: '🇬🇧 United Kingdom', percentage: 22 },
                          { country: '🇨🇦 Canada', percentage: 15 },
                          { country: '🇦🇺 Australia', percentage: 10 }
                        ].map((location, idx) => (
                          <div key={idx} className="flex items-center justify-between p-2 rounded hover:bg-muted/50">
                            <span className="text-sm">{location.country}</span>
                            <span className="text-sm font-medium">{location.percentage}%</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Gender Split */}
                    <div>
                      <h4 className="text-sm font-medium mb-3">Gender Distribution</h4>
                      <div className="flex gap-2">
                        <div className="flex-1 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-center">
                          <div className="text-2xl font-bold text-blue-500">58%</div>
                          <div className="text-xs text-muted-foreground">Female</div>
                        </div>
                        <div className="flex-1 p-3 rounded-lg bg-orange-500/10 border border-orange-500/20 text-center">
                          <div className="text-2xl font-bold text-orange-500">42%</div>
                          <div className="text-xs text-muted-foreground">Male</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Top Performing Content */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Top Performing Posts</h3>
                <div className="grid gap-4 md:grid-cols-3">
                  {[
                    { title: 'Summer Collection Launch', likes: 1234, comments: 89, shares: 45, type: 'reel' },
                    { title: 'Behind the Scenes', likes: 987, comments: 67, shares: 32, type: 'post' },
                    { title: 'Customer Testimonials', likes: 856, comments: 54, shares: 28, type: 'story' }
                  ].map((post, idx) => (
                    <div key={idx} className="p-4 rounded-lg border bg-card hover:shadow-lg transition-all">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <Badge variant="outline" className="mb-2">{post.type}</Badge>
                          <h4 className="font-medium text-sm">{post.title}</h4>
                        </div>
                        <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div className="text-center">
                          <div className="font-semibold">{post.likes}</div>
                          <div className="text-muted-foreground">Likes</div>
                        </div>
                        <div className="text-center">
                          <div className="font-semibold">{post.comments}</div>
                          <div className="text-muted-foreground">Comments</div>
                        </div>
                        <div className="text-center">
                          <div className="font-semibold">{post.shares}</div>
                          <div className="text-muted-foreground">Shares</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </TabsContent>

          </Tabs>
        </div>
      </main>
    </div>
  );
}
