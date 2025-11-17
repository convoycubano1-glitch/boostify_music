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
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("community");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Sample data for charts
  const engagementData = [
    { name: 'Mon', value: 45 },
    { name: 'Tue', value: 52 },
    { name: 'Wed', value: 49 },
    { name: 'Thu', value: 63 },
    { name: 'Fri', value: 58 },
    { name: 'Sat', value: 71 },
    { name: 'Sun', value: 68 }
  ];

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

  // Community Tab States
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [contentItems, setContentItems] = useState([
    { id: 1, title: 'Product Showcase', date: new Date(), status: 'scheduled', type: 'post' },
    { id: 2, title: 'Behind the Scenes', date: new Date(), status: 'draft', type: 'story' },
    { id: 3, title: 'User Feature', date: new Date(), status: 'published', type: 'reel' }
  ]);

  // Influencers Tab States
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedNiche, setSelectedNiche] = useState("all");
  const [campaigns, setCampaigns] = useState([
    { id: 1, name: 'Summer Collection', influencers: 3, posts: 15, budget: 5000, progress: 75, status: 'active' },
    { id: 2, name: 'Holiday Special', influencers: 2, posts: 8, budget: 3000, progress: 30, status: 'active' }
  ]);

  // Strategies Tab States
  const [contentMix, setContentMix] = useState({ entertainment: 40, education: 35, promotion: 25 });
  const [hashtagSearch, setHashtagSearch] = useState("");
  const [savedHashtags, setSavedHashtags] = useState(['fashion', 'style', 'beauty', 'ootd', 'trending']);

  // Reports Tab States
  const [dateRange, setDateRange] = useState("7d");
  const [selectedMetric, setSelectedMetric] = useState("engagement");

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
            <TabsList className="flex flex-nowrap overflow-x-auto p-1 bg-background/50 backdrop-blur-sm rounded-full border border-orange-500/20 w-full max-w-4xl mx-auto">
              <TabsTrigger value="community" className="data-[state=active]:bg-orange-500 rounded-full px-4 py-2 whitespace-nowrap">
                <Calendar className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Community</span>
                <span className="sm:hidden">Com</span>
              </TabsTrigger>
              <TabsTrigger value="influencers" className="data-[state=active]:bg-orange-500 rounded-full px-4 py-2 whitespace-nowrap">
                <UserPlus className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Influencers</span>
                <span className="sm:hidden">Inf</span>
              </TabsTrigger>
              <TabsTrigger value="strategies" className="data-[state=active]:bg-orange-500 rounded-full px-4 py-2 whitespace-nowrap">
                <Sparkles className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Strategies</span>
                <span className="sm:hidden">Str</span>
              </TabsTrigger>
              <TabsTrigger value="reports" className="data-[state=active]:bg-orange-500 rounded-full px-4 py-2 whitespace-nowrap">
                <BarChart2 className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Reports</span>
                <span className="sm:hidden">Rep</span>
              </TabsTrigger>
              <TabsTrigger value="ai-tools" className="data-[state=active]:bg-orange-500 rounded-full px-4 py-2 whitespace-nowrap">
                <Brain className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">AI Tools</span>
                <span className="sm:hidden">AI</span>
              </TabsTrigger>
            </TabsList>

            {/* Community Tab - Restructured */}
            <TabsContent value="community" className="space-y-6">
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
                    {contentItems.map((item) => (
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
                              <span>{item.date.toLocaleDateString()}</span>
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
                        <Button variant="outline" size="sm" className="justify-start">
                          <Heart className="h-4 w-4 mr-2 text-red-500" />
                          Like Posts
                        </Button>
                        <Button variant="outline" size="sm" className="justify-start">
                          <MessageCircle className="h-4 w-4 mr-2 text-blue-500" />
                          Reply
                        </Button>
                        <Button variant="outline" size="sm" className="justify-start">
                          <UserPlus className="h-4 w-4 mr-2 text-green-500" />
                          Follow Back
                        </Button>
                        <Button variant="outline" size="sm" className="justify-start">
                          <Share2 className="h-4 w-4 mr-2 text-purple-500" />
                          Share
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            </TabsContent>

            {/* Influencers Tab - Restructured */}
            <TabsContent value="influencers" className="space-y-6">
              {/* Search and Filters */}
              <Card className="p-6">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search influencers by name or niche..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <select
                    value={selectedNiche}
                    onChange={(e) => setSelectedNiche(e.target.value)}
                    className="px-4 py-2 rounded-md border bg-background"
                  >
                    <option value="all">All Niches</option>
                    <option value="fashion">Fashion & Lifestyle</option>
                    <option value="tech">Tech & Gaming</option>
                    <option value="beauty">Beauty & Makeup</option>
                    <option value="fitness">Fitness & Health</option>
                  </select>
                  <Button variant="outline">
                    <Filter className="h-4 w-4 mr-2" />
                    More Filters
                  </Button>
                </div>
              </Card>

              <div className="grid gap-6 lg:grid-cols-3">
                {/* Influencer Cards */}
                <div className="lg:col-span-2 space-y-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Recommended Influencers</h3>
                    <Badge variant="outline">24 Results</Badge>
                  </div>

                  {[
                    { name: 'Sarah Johnson', niche: 'Fashion & Lifestyle', followers: '125K', engagement: '8.2%', rating: 4.8, posts: 456 },
                    { name: 'Mike Stevens', niche: 'Tech & Gaming', followers: '89K', engagement: '6.5%', rating: 4.5, posts: 342 },
                    { name: 'Emma Davis', niche: 'Beauty & Makeup', followers: '210K', engagement: '9.1%', rating: 4.9, posts: 678 }
                  ].map((influencer, idx) => (
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

                            <div className="flex gap-2">
                              <Button size="sm" className="bg-orange-500 hover:bg-orange-600">
                                <UserPlus className="h-4 w-4 mr-2" />
                                Connect
                              </Button>
                              <Button size="sm" variant="outline">
                                <Eye className="h-4 w-4 mr-2" />
                                View Profile
                              </Button>
                              <Button size="sm" variant="outline">
                                <MessageCircle className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </Card>
                    </motion.div>
                  ))}
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
                      {campaigns.map((campaign) => (
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
            </TabsContent>

            {/* Strategies Tab */}
            <TabsContent value="strategies">
              <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
                <Card className="p-4 sm:p-6 hover:bg-orange-500/5 transition-colors bg-gradient-to-br from-background to-orange-500/5">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="p-3 bg-orange-500/10 rounded-lg">
                      <Sparkles className="h-6 w-6 text-orange-500" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold">Growth Strategies</h3>
                      <p className="text-sm text-muted-foreground">
                        Optimize your Instagram presence
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4 mb-6">
                    <div className="p-4 rounded-xl border border-orange-500/20 bg-background/50">
                      <h4 className="font-medium mb-2">Content Mix Strategy</h4>
                      <p className="text-sm text-muted-foreground mb-4">
                        Optimal content distribution for maximum engagement
                      </p>
                      <div className="grid grid-cols-3 gap-2">
                        <div className="p-2 bg-orange-500/10 rounded text-center">
                          <div className="text-lg font-bold text-orange-500">40%</div>
                          <div className="text-xs">Entertainment</div>
                        </div>
                        <div className="p-2 bg-orange-600/10 rounded text-center">
                          <div className="text-lg font-bold text-orange-600">35%</div>
                          <div className="text-xs">Education</div>
                        </div>
                        <div className="p-2 bg-orange-700/10 rounded text-center">
                          <div className="text-lg font-bold text-orange-700">25%</div>
                          <div className="text-xs">Promotion</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <Button className="w-full bg-orange-500 hover:bg-orange-600">
                    Get Custom Strategy
                  </Button>
                </Card>

                <Card className="p-4 sm:p-6 hover:bg-orange-500/5 transition-colors bg-gradient-to-br from-background to-orange-500/5">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="p-3 bg-orange-500/10 rounded-lg">
                      <Target className="h-6 w-6 text-orange-500" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold">Hashtag Strategy</h3>
                      <p className="text-sm text-muted-foreground">
                        Optimize your hashtag usage
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4 mb-6">
                    <div className="flex flex-wrap gap-2">
                      <span className="px-3 py-1 bg-orange-500/10 rounded-full text-sm">#fashion</span>
                      <span className="px-3 py-1 bg-orange-500/10 rounded-full text-sm">#style</span>
                      <span className="px-3 py-1 bg-orange-500/10 rounded-full text-sm">#beauty</span>
                    </div>
                    <Input
                      placeholder="Search hashtags..."
                      className="bg-background border-orange-500/20 focus:border-orange-500"
                    />
                  </div>

                  <Button className="w-full bg-orange-500 hover:bg-orange-600">
                    Generate Hashtags
                  </Button>
                </Card>
              </div>
            </TabsContent>

            {/* Reports Tab */}
            <TabsContent value="reports">
              <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
                <Card className="p-4 sm:p-6 hover:bg-orange-500/5 transition-colors bg-gradient-to-br from-background to-orange-500/5">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="p-3 bg-orange-500/10 rounded-lg">
                      <BarChart2 className="h-6 w-6 text-orange-500" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold">Growth Analytics</h3>
                      <p className="text-sm text-muted-foreground">
                        Track your Instagram growth
                      </p>
                    </div>
                  </div>

                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={engagementData}>
                        <defs>
                          <linearGradient id="colorEngagement" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#f97316" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Area
                          type="monotone"
                          dataKey="value"
                          stroke="#f97316"
                          fillOpacity={1}
                          fill="url(#colorEngagement)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </Card>

                <Card className="p-4 sm:p-6 hover:bg-orange-500/5 transition-colors bg-gradient-to-br from-background to-orange-500/5">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="p-3 bg-orange-500/10 rounded-lg">
                      <Users className="h-6 w-6 text-orange-500" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold">Audience Insights</h3>
                      <p className="text-sm text-muted-foreground">
                        Understand your followers
                      </p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <h4 className="font-medium mb-4">Demographics</h4>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Age 18-24</span>
                          <div className="w-32 h-2 bg-orange-500/20 rounded-full overflow-hidden">
                            <div className="w-3/4 h-full bg-orange-500" />
                          </div>
                          <span className="text-sm">75%</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Age 25-34</span>
                          <div className="w-32 h-2 bg-orange-500/20 rounded-full overflow-hidden">
                            <div className="w-1/2 h-full bg-orange-500" />
                          </div>
                          <span className="text-sm">50%</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium mb-4">Top Locations</h4>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm">United States</span>
                          <div className="w-32 h-2 bg-orange-500/20 rounded-full overflow-hidden">
                            <div className="w-4/5 h-full bg-orange-500" />
                          </div>
                          <span className="text-sm">80%</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">United Kingdom</span>
                          <div className="w-32 h-2 bg-orange-500/20 rounded-full overflow-hidden">
                            <div className="w-2/5 h-full bg-orange-500" />
                          </div>
                          <span className="text-sm">40%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            </TabsContent>

            {/* AI Tools Tab - Contains all 5 AI Tools */}
            <TabsContent value="ai-tools">
              <div className="mb-6">
                <h2 className="text-2xl font-bold mb-2">AI-Powered Instagram Tools</h2>
                <p className="text-muted-foreground">Generate professional content with our advanced AI assistants</p>
              </div>

              <Tabs value={activeTab === "ai-tools" ? "captions" : activeTab} onValueChange={setActiveTab} className="space-y-6">
                <TabsList className="grid grid-cols-5 w-full max-w-3xl mx-auto">
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

            {/* Caption Generator */}
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
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
