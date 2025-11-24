import { Button } from "../components/ui/button";
import { logger } from "../lib/logger";
import { Input } from "../components/ui/input";
import { Card } from "../components/ui/card";
import { useState } from "react";
import { useAuth } from "../hooks/use-auth";
import { useToast } from "../hooks/use-toast";
import { PlanTierGuard } from "../components/youtube-views/plan-tier-guard";
import { 
  Loader2, Play, TrendingUp, Home, Key, Video, MessageSquare, 
  Eye, Database, Brain, FileText, Sparkles, CheckCircle, 
  AlertTriangle, Copy, X, Star, Lightbulb, Target, Award,
  Image, Search, TrendingDown, Scissors, Users, Calendar,
  Gauge, Code
} from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { SiYoutube } from "react-icons/si";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Textarea } from "../components/ui/textarea";
import { Users2 } from "lucide-react";
import { Header } from "../components/layout/header";
import { Progress } from "../components/ui/progress";
import { Badge } from "../components/ui/badge";
import { ExtraServicesSection } from "../components/services/extra-services-section";

// Types
interface PreLaunchResult {
  score: number;
  prediction: string;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  estimatedViews: {
    '7days': number;
    '30days': number;
  };
  remaining: number;
}

interface Keyword {
  keyword: string;
  difficulty: 'easy' | 'medium' | 'hard';
  relevance: number;
  estimatedSearches: number;
  competition: 'low' | 'medium' | 'high';
}

interface TitleAnalysis {
  score: number;
  ctrScore: number;
  seoScore: number;
  emotionalScore: number;
  strengths: string[];
  issues: string[];
  suggestions: string[];
  improvedTitles: string[];
  remaining: number;
}

interface VideoIdea {
  title: string;
  description: string;
  targetAudience: string;
  difficulty: 'easy' | 'medium' | 'hard';
  estimatedViews: number;
  keywords: string[];
  hook: string;
}

// PHASE 2 Types
interface ThumbnailResult {
  imageUrl: string;
  prompt: string;
  ctrScore: number;
  suggestedText: string;
  reason: string;
}

interface CompetitorAnalysis {
  channelName: string;
  avgViews: number;
  topPerformingTopics: string[];
  uploadFrequency: string;
  bestUploadDays: string[];
  bestUploadTime: string;
  contentGaps: string[];
  strengths: string[];
  weaknesses: string[];
  insights: string[];
}

interface Trend {
  topic: string;
  confidence: number;
  timeToAct: string;
  risingKeywords: string[];
  competitionLevel: 'low' | 'medium' | 'high';
  urgency: 'low' | 'medium' | 'high';
  reason: string;
}

interface ShortClip {
  startTime: string;
  endTime: string;
  duration: number;
  viralScore: number;
  reason: string;
  hook: string;
  suggestedTitle: string;
  tags: string[];
}

// PHASE 3 Types
interface TrackedChannel {
  id: string;
  channelName: string;
  channelUrl: string;
  metrics: {
    totalVideos: number;
    totalViews: number;
    subscribers: number;
    avgViews: number;
  };
}

interface CalendarVideo {
  day: string;
  date: string;
  title: string;
  description: string;
  keywords: string[];
  uploadTime: string;
  scriptOutline: string[];
  thumbnailConcept: string;
  estimatedViews: number;
}

interface CalendarWeek {
  weekNumber: number;
  videos: CalendarVideo[];
}

interface OptimizationAction {
  action: string;
  impact: 'high' | 'medium' | 'low';
  urgency: string;
  reason: string;
}

interface ApiKey {
  id: string;
  apiKey: string;
  createdAt: any;
  isActive: boolean;
  usageCount: number;
  rateLimit: number;
}

export default function YoutubeViewsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("pre-launch");
  
  // Detect user subscription plan
  const userSubscription = (user as any)?.subscriptionPlan?.toLowerCase() || null;
  
  // Pre-Launch Score states
  const [preLaunchTitle, setPreLaunchTitle] = useState("");
  const [preLaunchDescription, setPreLaunchDescription] = useState("");
  const [preLaunchNiche, setPreLaunchNiche] = useState("");
  const [preLaunchKeywords, setPreLaunchKeywords] = useState("");
  const [preLaunchLoading, setPreLaunchLoading] = useState(false);
  const [preLaunchResult, setPreLaunchResult] = useState<PreLaunchResult | null>(null);
  
  // Keywords Generator states
  const [keywordTopic, setKeywordTopic] = useState("");
  const [keywordNiche, setKeywordNiche] = useState("");
  const [keywordsLoading, setKeywordsLoading] = useState(false);
  const [generatedKeywords, setGeneratedKeywords] = useState<Keyword[]>([]);
  const [trendingTags, setTrendingTags] = useState<string[]>([]);
  
  // Title Analyzer states
  const [titleToAnalyze, setTitleToAnalyze] = useState("");
  const [titleNiche, setTitleNiche] = useState("");
  const [titleLoading, setTitleLoading] = useState(false);
  const [titleResult, setTitleResult] = useState<TitleAnalysis | null>(null);
  
  // Content Ideas states
  const [contentNiche, setContentNiche] = useState("");
  const [contentIdeasCount, setContentIdeasCount] = useState(5);
  const [contentLoading, setContentLoading] = useState(false);
  const [videoIdeas, setVideoIdeas] = useState<VideoIdea[]>([]);
  const [contentGaps, setContentGaps] = useState<string[]>([]);
  const [trendingSubtopics, setTrendingSubtopics] = useState<string[]>([]);

  // PHASE 2 - Thumbnail Generator states
  const [thumbnailTitle, setThumbnailTitle] = useState("");
  const [thumbnailStyle, setThumbnailStyle] = useState("modern");
  const [thumbnailNiche, setThumbnailNiche] = useState("");
  const [thumbnailLoading, setThumbnailLoading] = useState(false);
  const [thumbnails, setThumbnails] = useState<ThumbnailResult[]>([]);

  // PHASE 2 - Competitor Analysis states
  const [competitorChannel, setCompetitorChannel] = useState("");
  const [competitorLoading, setCompetitorLoading] = useState(false);
  const [competitorData, setCompetitorData] = useState<CompetitorAnalysis | null>(null);

  // PHASE 2 - Trend Predictor states
  const [trendNiche, setTrendNiche] = useState("");
  const [trendsLoading, setTrendsLoading] = useState(false);
  const [trends, setTrends] = useState<Trend[]>([]);

  // PHASE 2 - Transcript Extractor states
  const [transcriptUrl, setTranscriptUrl] = useState("");
  const [transcriptLoading, setTranscriptLoading] = useState(false);
  const [shortClips, setShortClips] = useState<ShortClip[]>([]);

  // PHASE 3 - Multi-Channel Tracking states
  const [newChannelUrl, setNewChannelUrl] = useState("");
  const [newChannelName, setNewChannelName] = useState("");
  const [channelsLoading, setChannelsLoading] = useState(false);
  const [trackedChannels, setTrackedChannels] = useState<TrackedChannel[]>([]);
  const [channelAnalytics, setChannelAnalytics] = useState<any>(null);

  // PHASE 3 - Content Calendar states
  const [calendarNiche, setCalendarNiche] = useState("");
  const [calendarGoals, setCalendarGoals] = useState("");
  const [videosPerWeek, setVideosPerWeek] = useState(3);
  const [calendarLoading, setCalendarLoading] = useState(false);
  const [calendarWeeks, setCalendarWeeks] = useState<CalendarWeek[]>([]);

  // PHASE 3 - Auto-Optimization states
  const [optVideoUrl, setOptVideoUrl] = useState("");
  const [optLoading, setOptLoading] = useState(false);
  const [optResult, setOptResult] = useState<any>(null);

  // PHASE 3 - API Access states
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [apiLoading, setApiLoading] = useState(false);

  // 1. PRE-LAUNCH SCORE
  const handlePreLaunchScore = async () => {
    if (!preLaunchTitle || !preLaunchNiche) {
      toast({
        title: "Missing Information",
        description: "Please provide both title and niche",
        variant: "destructive"
      });
      return;
    }

    setPreLaunchLoading(true);
    setPreLaunchResult(null);

    try {
      const response = await fetch('/api/youtube/pre-launch-score', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          title: preLaunchTitle,
          description: preLaunchDescription,
          keywords: preLaunchKeywords,
          niche: preLaunchNiche
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to analyze video');
      }

      setPreLaunchResult(data);
      toast({
        title: "Analysis Complete!",
        description: `Your video scored ${data.score}/100`,
      });
    } catch (error: any) {
      logger.error('Pre-launch error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to analyze video concept",
        variant: "destructive"
      });
    } finally {
      setPreLaunchLoading(false);
    }
  };

  // 2. KEYWORDS GENERATOR
  const handleGenerateKeywords = async () => {
    if (!keywordTopic) {
      toast({
        title: "Missing Information",
        description: "Please provide a topic",
        variant: "destructive"
      });
      return;
    }

    setKeywordsLoading(true);
    setGeneratedKeywords([]);

    try {
      const response = await fetch('/api/youtube/generate-keywords', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          topic: keywordTopic,
          niche: keywordNiche
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate keywords');
      }

      setGeneratedKeywords(data.keywords);
      setTrendingTags(data.trendingTags);
      toast({
        title: "Keywords Generated!",
        description: `Found ${data.keywords.length} optimized keywords`,
      });
    } catch (error: any) {
      logger.error('Keywords error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to generate keywords",
        variant: "destructive"
      });
    } finally {
      setKeywordsLoading(false);
    }
  };

  // 3. TITLE ANALYZER
  const handleAnalyzeTitle = async () => {
    if (!titleToAnalyze) {
      toast({
        title: "Missing Information",
        description: "Please provide a title to analyze",
        variant: "destructive"
      });
      return;
    }

    setTitleLoading(true);
    setTitleResult(null);

    try {
      const response = await fetch('/api/youtube/analyze-title', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          title: titleToAnalyze,
          niche: titleNiche
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to analyze title');
      }

      setTitleResult(data);
      toast({
        title: "Title Analyzed!",
        description: `Your title scored ${data.score}/100`,
      });
    } catch (error: any) {
      logger.error('Title analysis error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to analyze title",
        variant: "destructive"
      });
    } finally {
      setTitleLoading(false);
    }
  };

  // 4. CONTENT IDEAS GENERATOR
  const handleGenerateContentIdeas = async () => {
    if (!contentNiche) {
      toast({
        title: "Missing Information",
        description: "Please provide a niche",
        variant: "destructive"
      });
      return;
    }

    setContentLoading(true);
    setVideoIdeas([]);

    try {
      const response = await fetch('/api/youtube/content-ideas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          niche: contentNiche,
          count: contentIdeasCount
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate ideas');
      }

      setVideoIdeas(data.videoIdeas);
      setContentGaps(data.contentGaps);
      setTrendingSubtopics(data.trendingSubtopics);
      toast({
        title: "Ideas Generated!",
        description: `Found ${data.videoIdeas.length} video ideas`,
      });
    } catch (error: any) {
      logger.error('Content ideas error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to generate content ideas",
        variant: "destructive"
      });
    } finally {
      setContentLoading(false);
    }
  };

  // PHASE 2 HANDLERS

  // 5. THUMBNAIL GENERATOR
  const handleGenerateThumbnails = async () => {
    if (!thumbnailTitle || !thumbnailNiche) {
      toast({
        title: "Missing Information",
        description: "Please provide title and niche",
        variant: "destructive"
      });
      return;
    }

    setThumbnailLoading(true);
    setThumbnails([]);

    try {
      const response = await fetch('/api/youtube/generate-thumbnail', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          title: thumbnailTitle,
          style: thumbnailStyle,
          niche: thumbnailNiche
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate thumbnails');
      }

      setThumbnails(data.thumbnails);
      toast({
        title: "Thumbnails Generated!",
        description: `Created ${data.thumbnails.length} AI thumbnails`,
      });
    } catch (error: any) {
      logger.error('Thumbnail generation error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to generate thumbnails",
        variant: "destructive"
      });
    } finally {
      setThumbnailLoading(false);
    }
  };

  // 6. COMPETITOR ANALYSIS
  const handleCompetitorAnalysis = async () => {
    if (!competitorChannel) {
      toast({
        title: "Missing Information",
        description: "Please provide a competitor channel name",
        variant: "destructive"
      });
      return;
    }

    setCompetitorLoading(true);
    setCompetitorData(null);

    try {
      const response = await fetch('/api/youtube/analyze-competitor', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          channelName: competitorChannel
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to analyze competitor');
      }

      setCompetitorData(data);
      toast({
        title: "Analysis Complete!",
        description: `Analyzed ${data.channelName}'s strategy`,
      });
    } catch (error: any) {
      logger.error('Competitor analysis error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to analyze competitor",
        variant: "destructive"
      });
    } finally {
      setCompetitorLoading(false);
    }
  };

  // 7. TREND PREDICTOR
  const handlePredictTrends = async () => {
    if (!trendNiche) {
      toast({
        title: "Missing Information",
        description: "Please provide a niche",
        variant: "destructive"
      });
      return;
    }

    setTrendsLoading(true);
    setTrends([]);

    try {
      const response = await fetch('/api/youtube/predict-trends', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          niche: trendNiche
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to predict trends');
      }

      setTrends(data.trends);
      toast({
        title: "Trends Detected!",
        description: `Found ${data.trends.length} emerging trends`,
      });
    } catch (error: any) {
      logger.error('Trend prediction error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to predict trends",
        variant: "destructive"
      });
    } finally {
      setTrendsLoading(false);
    }
  };

  // 8. TRANSCRIPT EXTRACTOR
  const handleExtractTranscript = async () => {
    if (!transcriptUrl) {
      toast({
        title: "Missing Information",
        description: "Please provide a video URL",
        variant: "destructive"
      });
      return;
    }

    setTranscriptLoading(true);
    setShortClips([]);

    try {
      const response = await fetch('/api/youtube/extract-transcript', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          videoUrl: transcriptUrl
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to extract transcript');
      }

      setShortClips(data.shortsOpportunities);
      toast({
        title: "Shorts Clips Found!",
        description: `Identified ${data.shortsOpportunities.length} viral moments`,
      });
    } catch (error: any) {
      logger.error('Transcript extraction error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to extract transcript",
        variant: "destructive"
      });
    } finally {
      setTranscriptLoading(false);
    }
  };

  // PHASE 3 HANDLERS

  // 9. MULTI-CHANNEL TRACKING
  const handleAddChannel = async () => {
    if (!newChannelUrl || !newChannelName) {
      toast({
        title: "Missing Information",
        description: "Please provide channel URL and name",
        variant: "destructive"
      });
      return;
    }

    setChannelsLoading(true);

    try {
      const response = await fetch('/api/youtube/track-channel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          action: 'add',
          channelUrl: newChannelUrl,
          channelName: newChannelName
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to add channel');
      }

      toast({
        title: "Channel Added!",
        description: `Now tracking ${newChannelName}`,
      });
      setNewChannelUrl("");
      setNewChannelName("");
      loadTrackedChannels();
    } catch (error: any) {
      logger.error('Add channel error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to add channel",
        variant: "destructive"
      });
    } finally {
      setChannelsLoading(false);
    }
  };

  const loadTrackedChannels = async () => {
    try {
      const response = await fetch('/api/youtube/track-channel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ action: 'list' })
      });

      const data = await response.json();
      if (response.ok) {
        setTrackedChannels(data.channels || []);
      }
    } catch (error) {
      logger.error('Load channels error:', error);
    }
  };

  const loadChannelAnalytics = async () => {
    try {
      const response = await fetch('/api/youtube/multi-channel-analytics', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      const data = await response.json();
      if (response.ok) {
        setChannelAnalytics(data);
      }
    } catch (error) {
      logger.error('Load analytics error:', error);
    }
  };

  // 10. CONTENT CALENDAR
  const handleGenerateCalendar = async () => {
    if (!calendarNiche) {
      toast({
        title: "Missing Information",
        description: "Please provide a niche",
        variant: "destructive"
      });
      return;
    }

    setCalendarLoading(true);
    setCalendarWeeks([]);

    try {
      const response = await fetch('/api/youtube/generate-calendar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          niche: calendarNiche,
          goals: calendarGoals,
          videosPerWeek: videosPerWeek
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate calendar');
      }

      setCalendarWeeks(data.weeks);
      toast({
        title: "Calendar Generated!",
        description: `Created ${data.totalVideos} video plan`,
      });
    } catch (error: any) {
      logger.error('Calendar generation error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to generate calendar",
        variant: "destructive"
      });
    } finally {
      setCalendarLoading(false);
    }
  };

  // 11. AUTO-OPTIMIZATION
  const handleCheckOptimization = async () => {
    if (!optVideoUrl) {
      toast({
        title: "Missing Information",
        description: "Please provide a video URL",
        variant: "destructive"
      });
      return;
    }

    setOptLoading(true);
    setOptResult(null);

    try {
      const response = await fetch('/api/youtube/check-optimization', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          videoUrl: optVideoUrl
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to check optimization');
      }

      setOptResult(data);
      toast({
        title: "Optimization Check Complete!",
        description: `Performance score: ${data.performanceScore}/100`,
      });
    } catch (error: any) {
      logger.error('Optimization check error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to check optimization",
        variant: "destructive"
      });
    } finally {
      setOptLoading(false);
    }
  };

  // 12. API ACCESS
  const handleGenerateApiKey = async () => {
    setApiLoading(true);

    try {
      const response = await fetch('/api/youtube/api-key/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate API key');
      }

      toast({
        title: "API Key Generated!",
        description: "Your new API key is ready to use",
      });
      loadApiKeys();
    } catch (error: any) {
      logger.error('API key generation error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to generate API key",
        variant: "destructive"
      });
    } finally {
      setApiLoading(false);
    }
  };

  const loadApiKeys = async () => {
    try {
      const response = await fetch('/api/youtube/api-keys', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      const data = await response.json();
      if (response.ok) {
        setApiKeys(data.keys || []);
      }
    } catch (error) {
      logger.error('Load API keys error:', error);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "Text copied to clipboard",
    });
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'text-green-500 bg-green-500/10';
      case 'medium': return 'text-yellow-500 bg-yellow-500/10';
      case 'hard': return 'text-red-500 bg-red-500/10';
      default: return 'text-gray-500 bg-gray-500/10';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-yellow-500';
    return 'text-red-500';
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-background via-background to-orange-500/5">
      <Header />
      <main className="flex-1 space-y-12 p-4 md:p-8 pt-6">
        {/* HERO SECTION - Redesigned */}
        <div className="relative w-full overflow-hidden">
          {/* Background Elements */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-orange-600/10 rounded-full blur-3xl"></div>
          </div>

          <div className="relative container mx-auto py-12 md:py-20">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center max-w-5xl mx-auto"
            >
              {/* Badge */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-500/10 border border-orange-500/20 mb-6"
              >
                <Sparkles className="w-4 h-4 text-orange-500" />
                <span className="text-sm font-medium">12 AI-Powered Tools for YouTube Success</span>
              </motion.div>

              {/* Main Heading */}
              <h1 className="text-4xl md:text-7xl font-bold mb-6 leading-tight">
                Grow Your YouTube Channel{" "}
                <span className="bg-gradient-to-r from-orange-500 via-orange-400 to-orange-600 bg-clip-text text-transparent">
                  10x Faster
                </span>
              </h1>

              {/* Subheading */}
              <p className="text-lg md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto">
                Advanced AI analytics, competitor insights, and content optimization—all in one platform
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-lg shadow-orange-500/25 text-base px-8"
                  onClick={() => document.getElementById('tools')?.scrollIntoView({ behavior: 'smooth' })}
                >
                  <Play className="w-5 h-5 mr-2" />
                  Start Free Analysis
                </Button>
                <Link href="/dashboard">
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-2 text-base px-8"
                  >
                    <Home className="w-5 h-5 mr-2" />
                    Go to Dashboard
                  </Button>
                </Link>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="p-4 rounded-xl bg-card/50 backdrop-blur border border-border/50"
                >
                  <div className="text-3xl font-bold text-orange-500 mb-1">12</div>
                  <div className="text-sm text-muted-foreground">AI Tools</div>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="p-4 rounded-xl bg-card/50 backdrop-blur border border-border/50"
                >
                  <div className="text-3xl font-bold text-orange-500 mb-1">3</div>
                  <div className="text-sm text-muted-foreground">Tiers</div>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="p-4 rounded-xl bg-card/50 backdrop-blur border border-border/50"
                >
                  <div className="text-3xl font-bold text-orange-500 mb-1">24/7</div>
                  <div className="text-sm text-muted-foreground">Monitoring</div>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="p-4 rounded-xl bg-card/50 backdrop-blur border border-border/50"
                >
                  <div className="text-3xl font-bold text-orange-500 mb-1">∞</div>
                  <div className="text-sm text-muted-foreground">Enterprise</div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* FEATURE SHOWCASE */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="container mx-auto"
        >
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            {/* Feature 1 */}
            <Card className="p-6 border-2 hover:border-orange-500/50 transition-all hover:shadow-lg hover:shadow-orange-500/10">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center mb-4">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-2">AI-Powered Insights</h3>
              <p className="text-muted-foreground">
                Advanced algorithms analyze millions of data points to give you actionable insights
              </p>
            </Card>

            {/* Feature 2 */}
            <Card className="p-6 border-2 hover:border-orange-500/50 transition-all hover:shadow-lg hover:shadow-orange-500/10">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center mb-4">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-2">Predict Trends Early</h3>
              <p className="text-muted-foreground">
                Detect emerging trends before they explode and stay ahead of the competition
              </p>
            </Card>

            {/* Feature 3 */}
            <Card className="p-6 border-2 hover:border-orange-500/50 transition-all hover:shadow-lg hover:shadow-orange-500/10">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-2">Multi-Channel Management</h3>
              <p className="text-muted-foreground">
                Manage unlimited channels with enterprise-grade analytics and automation
              </p>
            </Card>
          </div>
        </motion.div>

        {/* TOOLS SECTION HEADER */}
        <motion.div
          id="tools"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="container mx-auto"
        >
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
                <SiYoutube className="w-7 h-7 text-white" />
              </div>
              <h2 className="text-3xl md:text-5xl font-bold bg-gradient-to-r from-orange-500 to-orange-600 bg-clip-text text-transparent">
                Growth Tools Suite
              </h2>
            </div>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Everything you need to dominate YouTube, from pre-launch analysis to enterprise automation
            </p>
          </div>
        </motion.div>

        <div className="container mx-auto">
          <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <Card className="p-2">
              <TabsList className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2 h-auto bg-transparent">
                {/* PHASE 1 - CREATOR */}
                <TabsTrigger value="pre-launch" data-testid="tab-pre-launch" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-orange-600 data-[state=active]:text-white">
                  <Target className="w-4 h-4 mr-2" />
                  Pre-Launch
                </TabsTrigger>
                <TabsTrigger value="keywords" data-testid="tab-keywords" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-orange-600 data-[state=active]:text-white">
                  <Key className="w-4 h-4 mr-2" />
                  Keywords
                </TabsTrigger>
                <TabsTrigger value="title" data-testid="tab-title" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-orange-600 data-[state=active]:text-white">
                  <FileText className="w-4 h-4 mr-2" />
                  Title
                </TabsTrigger>
                <TabsTrigger value="content" data-testid="tab-content" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-orange-600 data-[state=active]:text-white">
                  <Lightbulb className="w-4 h-4 mr-2" />
                  Ideas
                </TabsTrigger>
                
                {/* PHASE 2 - PRO */}
                <TabsTrigger value="thumbnail" data-testid="tab-thumbnail" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-orange-600 data-[state=active]:text-white">
                  <Image className="w-4 h-4 mr-2" />
                  Thumbnail
                </TabsTrigger>
                <TabsTrigger value="competitor" data-testid="tab-competitor" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-orange-600 data-[state=active]:text-white">
                  <Search className="w-4 h-4 mr-2" />
                  Competitor
                </TabsTrigger>
                <TabsTrigger value="trends" data-testid="tab-trends" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-orange-600 data-[state=active]:text-white">
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Trends
                </TabsTrigger>
                <TabsTrigger value="transcript" data-testid="tab-transcript" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-orange-600 data-[state=active]:text-white">
                  <Scissors className="w-4 h-4 mr-2" />
                  Shorts
                </TabsTrigger>

                {/* PHASE 3 - ENTERPRISE */}
                <TabsTrigger value="channels" data-testid="tab-channels" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-purple-600 data-[state=active]:text-white">
                  <Users className="w-4 h-4 mr-2" />
                  Channels
                </TabsTrigger>
                <TabsTrigger value="calendar" data-testid="tab-calendar" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-purple-600 data-[state=active]:text-white">
                  <Calendar className="w-4 h-4 mr-2" />
                  Calendar
                </TabsTrigger>
                <TabsTrigger value="optimization" data-testid="tab-optimization" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-purple-600 data-[state=active]:text-white">
                  <Gauge className="w-4 h-4 mr-2" />
                  Optimize
                </TabsTrigger>
                <TabsTrigger value="api" data-testid="tab-api" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-purple-600 data-[state=active]:text-white">
                  <Code className="w-4 h-4 mr-2" />
                  API
                </TabsTrigger>
              </TabsList>
            </Card>

            {/* PRE-LAUNCH SCORE TAB - BASIC */}
            <TabsContent value="pre-launch">
              <PlanTierGuard 
                requiredPlan="basic" 
                userSubscription={userSubscription} 
                featureName="Pre-Launch Success Predictor"
              >
                <Card className="p-6">
                <div className="flex items-center gap-4 mb-6">
                  <div className="p-4 bg-orange-500/10 rounded-lg">
                    <Target className="h-8 w-8 text-orange-500" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-semibold">Pre-Launch Success Predictor</h3>
                    <p className="text-muted-foreground">
                      Predict video success before publishing with Boostify AI
                    </p>
                  </div>
                </div>

                <div className="space-y-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">Video Title *</label>
                    <Input
                      data-testid="input-pre-launch-title"
                      placeholder="Enter your video title..."
                      value={preLaunchTitle}
                      onChange={(e) => setPreLaunchTitle(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Niche/Category *</label>
                    <Input
                      data-testid="input-pre-launch-niche"
                      placeholder="e.g., Gaming, Tech Reviews, Cooking..."
                      value={preLaunchNiche}
                      onChange={(e) => setPreLaunchNiche(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Description (Optional)</label>
                    <Textarea
                      data-testid="input-pre-launch-description"
                      placeholder="Brief description of your video..."
                      value={preLaunchDescription}
                      onChange={(e) => setPreLaunchDescription(e.target.value)}
                      rows={3}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Keywords (Optional)</label>
                    <Input
                      data-testid="input-pre-launch-keywords"
                      placeholder="keyword1, keyword2, keyword3..."
                      value={preLaunchKeywords}
                      onChange={(e) => setPreLaunchKeywords(e.target.value)}
                    />
                  </div>
                  <Button
                    data-testid="button-analyze-pre-launch"
                    onClick={handlePreLaunchScore}
                    disabled={preLaunchLoading || !preLaunchTitle || !preLaunchNiche}
                    className="w-full bg-orange-500 hover:bg-orange-600"
                  >
                    {preLaunchLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Analyzing with Boostify AI...
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-2 h-4 w-4" />
                        Analyze Video Concept
                      </>
                    )}
                  </Button>
                </div>

                {preLaunchResult && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-6 mt-6 p-6 border rounded-lg bg-card"
                  >
                    <div className="text-center">
                      <h4 className="text-lg font-semibold mb-2">Success Score</h4>
                      <div className={`text-6xl font-bold ${getScoreColor(preLaunchResult.score)}`}>
                        {preLaunchResult.score}/100
                      </div>
                      <p className="text-muted-foreground mt-2">{preLaunchResult.prediction}</p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <h5 className="font-semibold mb-2 flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          Strengths
                        </h5>
                        <ul className="space-y-1">
                          {preLaunchResult.strengths.map((strength, idx) => (
                            <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                              <span className="text-green-500 mt-0.5">•</span>
                              {strength}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h5 className="font-semibold mb-2 flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-yellow-500" />
                          Weaknesses
                        </h5>
                        <ul className="space-y-1">
                          {preLaunchResult.weaknesses.map((weakness, idx) => (
                            <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                              <span className="text-yellow-500 mt-0.5">•</span>
                              {weakness}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div>
                      <h5 className="font-semibold mb-2">Recommendations</h5>
                      <div className="space-y-2">
                        {preLaunchResult.recommendations.map((rec, idx) => (
                          <div key={idx} className="p-3 bg-orange-500/5 rounded-lg text-sm">
                            <span className="text-orange-500 font-semibold mr-2">{idx + 1}.</span>
                            {rec}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4 pt-4 border-t">
                      <div className="text-center p-4 bg-muted rounded-lg">
                        <p className="text-sm text-muted-foreground mb-1">Estimated Views (7 days)</p>
                        <p className="text-2xl font-bold text-orange-500">
                          {preLaunchResult.estimatedViews['7days'].toLocaleString()}
                        </p>
                      </div>
                      <div className="text-center p-4 bg-muted rounded-lg">
                        <p className="text-sm text-muted-foreground mb-1">Estimated Views (30 days)</p>
                        <p className="text-2xl font-bold text-orange-500">
                          {preLaunchResult.estimatedViews['30days'].toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}
                </Card>
              </PlanTierGuard>
            </TabsContent>

            {/* KEYWORDS GENERATOR TAB - BASIC */}
            <TabsContent value="keywords">
              <PlanTierGuard 
                requiredPlan="basic" 
                userSubscription={userSubscription} 
                featureName="AI Keywords Generator"
              >
                <Card className="p-6">
                <div className="flex items-center gap-4 mb-6">
                  <div className="p-4 bg-orange-500/10 rounded-lg">
                    <Key className="h-8 w-8 text-orange-500" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-semibold">AI Keywords Generator</h3>
                    <p className="text-muted-foreground">
                      Discover optimized keywords based on trending YouTube data
                    </p>
                  </div>
                </div>

                <div className="space-y-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">Topic *</label>
                    <Input
                      data-testid="input-keyword-topic"
                      placeholder="What is your video about?"
                      value={keywordTopic}
                      onChange={(e) => setKeywordTopic(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Niche (Optional)</label>
                    <Input
                      data-testid="input-keyword-niche"
                      placeholder="e.g., Tech, Gaming, Lifestyle..."
                      value={keywordNiche}
                      onChange={(e) => setKeywordNiche(e.target.value)}
                    />
                  </div>
                  <Button
                    data-testid="button-generate-keywords"
                    onClick={handleGenerateKeywords}
                    disabled={keywordsLoading || !keywordTopic}
                    className="w-full bg-orange-500 hover:bg-orange-600"
                  >
                    {keywordsLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Generating Keywords with AI...
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-2 h-4 w-4" />
                        Generate Keywords
                      </>
                    )}
                  </Button>
                </div>

                {generatedKeywords.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-6"
                  >
                    <div>
                      <h4 className="font-semibold mb-4">Optimized Keywords ({generatedKeywords.length})</h4>
                      <div className="space-y-2">
                        {generatedKeywords.map((kw, idx) => (
                          <div key={idx} className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <span className="font-medium">{kw.keyword}</span>
                                  <Badge className={getDifficultyColor(kw.difficulty)}>
                                    {kw.difficulty}
                                  </Badge>
                                  <Badge variant="outline">{kw.competition} competition</Badge>
                                </div>
                                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                  <span>Relevance: {kw.relevance}/10</span>
                                  <span>~{kw.estimatedSearches.toLocaleString()} searches/month</span>
                                </div>
                              </div>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => copyToClipboard(kw.keyword)}
                                data-testid={`button-copy-keyword-${idx}`}
                              >
                                <Copy className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {trendingTags.length > 0 && (
                      <div>
                        <h4 className="font-semibold mb-4">Trending Tags in Niche</h4>
                        <div className="flex flex-wrap gap-2">
                          {trendingTags.map((tag, idx) => (
                            <Badge
                              key={idx}
                              variant="secondary"
                              className="cursor-pointer hover:bg-orange-500/20"
                              onClick={() => copyToClipboard(tag)}
                            >
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}
                </Card>
              </PlanTierGuard>
            </TabsContent>

            {/* TITLE ANALYZER TAB - BASIC */}
            <TabsContent value="title">
              <PlanTierGuard 
                requiredPlan="basic" 
                userSubscription={userSubscription} 
                featureName="Title Analyzer"
              >
              <Card className="p-6">
                <div className="flex items-center gap-4 mb-6">
                  <div className="p-4 bg-orange-500/10 rounded-lg">
                    <FileText className="h-8 w-8 text-orange-500" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-semibold">Title Analyzer</h3>
                    <p className="text-muted-foreground">
                      Optimize your video title for maximum clicks and SEO
                    </p>
                  </div>
                </div>

                <div className="space-y-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">Video Title *</label>
                    <Input
                      data-testid="input-title-analyze"
                      placeholder="Enter your video title..."
                      value={titleToAnalyze}
                      onChange={(e) => setTitleToAnalyze(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      {titleToAnalyze.length} characters (ideal: 50-70)
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Niche (Optional)</label>
                    <Input
                      data-testid="input-title-niche"
                      placeholder="e.g., Gaming, Tech, Cooking..."
                      value={titleNiche}
                      onChange={(e) => setTitleNiche(e.target.value)}
                    />
                  </div>
                  <Button
                    data-testid="button-analyze-title"
                    onClick={handleAnalyzeTitle}
                    disabled={titleLoading || !titleToAnalyze}
                    className="w-full bg-orange-500 hover:bg-orange-600"
                  >
                    {titleLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Analyzing Title...
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-2 h-4 w-4" />
                        Analyze Title
                      </>
                    )}
                  </Button>
                </div>

                {titleResult && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-6"
                  >
                    <div className="grid md:grid-cols-4 gap-4">
                      <div className="text-center p-4 border rounded-lg">
                        <p className="text-sm text-muted-foreground mb-1">Overall Score</p>
                        <p className={`text-3xl font-bold ${getScoreColor(titleResult.score)}`}>
                          {titleResult.score}
                        </p>
                      </div>
                      <div className="text-center p-4 border rounded-lg">
                        <p className="text-sm text-muted-foreground mb-1">CTR Score</p>
                        <p className={`text-3xl font-bold ${getScoreColor(titleResult.ctrScore)}`}>
                          {titleResult.ctrScore}
                        </p>
                      </div>
                      <div className="text-center p-4 border rounded-lg">
                        <p className="text-sm text-muted-foreground mb-1">SEO Score</p>
                        <p className={`text-3xl font-bold ${getScoreColor(titleResult.seoScore)}`}>
                          {titleResult.seoScore}
                        </p>
                      </div>
                      <div className="text-center p-4 border rounded-lg">
                        <p className="text-sm text-muted-foreground mb-1">Emotional</p>
                        <p className={`text-3xl font-bold ${getScoreColor(titleResult.emotionalScore)}`}>
                          {titleResult.emotionalScore}
                        </p>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <h5 className="font-semibold mb-2 text-green-500">What Works</h5>
                        <ul className="space-y-1">
                          {titleResult.strengths.map((str, idx) => (
                            <li key={idx} className="text-sm flex items-start gap-2">
                              <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                              {str}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h5 className="font-semibold mb-2 text-yellow-500">Needs Improvement</h5>
                        <ul className="space-y-1">
                          {titleResult.issues.map((issue, idx) => (
                            <li key={idx} className="text-sm flex items-start gap-2">
                              <AlertTriangle className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                              {issue}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div>
                      <h5 className="font-semibold mb-2">Suggestions</h5>
                      <div className="space-y-2">
                        {titleResult.suggestions.map((sug, idx) => (
                          <div key={idx} className="p-3 bg-muted rounded-lg text-sm">
                            {sug}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h5 className="font-semibold mb-2">Alternative Titles</h5>
                      <div className="space-y-2">
                        {titleResult.improvedTitles.map((title, idx) => (
                          <div key={idx} className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                            <div className="flex items-center justify-between">
                              <span className="flex-1">{title}</span>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => copyToClipboard(title)}
                                data-testid={`button-copy-title-${idx}`}
                              >
                                <Copy className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
                </Card>
              </PlanTierGuard>
            </TabsContent>

            {/* CONTENT IDEAS TAB - BASIC */}
            <TabsContent value="content">
              <PlanTierGuard 
                requiredPlan="basic" 
                userSubscription={userSubscription} 
                featureName="Content Ideas Generator"
              >
                <Card className="p-6">
                <div className="flex items-center gap-4 mb-6">
                  <div className="p-4 bg-orange-500/10 rounded-lg">
                    <Lightbulb className="h-8 w-8 text-orange-500" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-semibold">Content Ideas Generator</h3>
                    <p className="text-muted-foreground">
                      Discover untapped video opportunities in your niche
                    </p>
                  </div>
                </div>

                <div className="space-y-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">Niche *</label>
                    <Input
                      data-testid="input-content-niche"
                      placeholder="e.g., Tech Tutorials, Cooking, Fitness..."
                      value={contentNiche}
                      onChange={(e) => setContentNiche(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Number of Ideas</label>
                    <Input
                      type="number"
                      min="1"
                      max="10"
                      value={contentIdeasCount}
                      onChange={(e) => setContentIdeasCount(parseInt(e.target.value) || 5)}
                    />
                  </div>
                  <Button
                    data-testid="button-generate-content-ideas"
                    onClick={handleGenerateContentIdeas}
                    disabled={contentLoading || !contentNiche}
                    className="w-full bg-orange-500 hover:bg-orange-600"
                  >
                    {contentLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Analyzing Content Gaps...
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-2 h-4 w-4" />
                        Generate Video Ideas
                      </>
                    )}
                  </Button>
                </div>

                {videoIdeas.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-6"
                  >
                    {contentGaps.length > 0 && (
                      <div className="p-4 bg-orange-500/5 border border-orange-500/20 rounded-lg">
                        <h5 className="font-semibold mb-2 text-orange-500">Content Gaps Discovered</h5>
                        <div className="space-y-1">
                          {contentGaps.map((gap, idx) => (
                            <p key={idx} className="text-sm">• {gap}</p>
                          ))}
                        </div>
                      </div>
                    )}

                    {trendingSubtopics.length > 0 && (
                      <div>
                        <h5 className="font-semibold mb-2">Trending Subtopics</h5>
                        <div className="flex flex-wrap gap-2">
                          {trendingSubtopics.map((topic, idx) => (
                            <Badge key={idx} variant="secondary">
                              {topic}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    <div>
                      <h5 className="font-semibold mb-4">Video Ideas ({videoIdeas.length})</h5>
                      <div className="space-y-4">
                        {videoIdeas.map((idea, idx) => (
                          <div key={idx} className="p-6 border rounded-lg hover:bg-muted/50 transition-colors">
                            <div className="flex items-start justify-between mb-3">
                              <h6 className="font-semibold text-lg flex-1">{idea.title}</h6>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => copyToClipboard(idea.title)}
                                data-testid={`button-copy-idea-${idx}`}
                              >
                                <Copy className="w-4 h-4" />
                              </Button>
                            </div>
                            <p className="text-sm text-muted-foreground mb-4">{idea.description}</p>
                            <div className="flex flex-wrap gap-2 mb-3">
                              <Badge className={getDifficultyColor(idea.difficulty)}>
                                {idea.difficulty}
                              </Badge>
                              <Badge variant="outline">
                                <TrendingUp className="w-3 h-3 mr-1" />
                                ~{idea.estimatedViews.toLocaleString()} views
                              </Badge>
                            </div>
                            <div className="text-sm">
                              <p className="text-muted-foreground mb-1">
                                <span className="font-medium">Target Audience:</span> {idea.targetAudience}
                              </p>
                              <p className="text-muted-foreground mb-2">
                                <span className="font-medium">Opening Hook:</span> "{idea.hook}"
                              </p>
                              <p className="font-medium mb-1">Keywords:</p>
                              <div className="flex flex-wrap gap-1">
                                {idea.keywords.map((kw, kidx) => (
                                  <Badge key={kidx} variant="secondary" className="text-xs">
                                    {kw}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </Card>
              </PlanTierGuard>
            </TabsContent>

            {/* PHASE 2 - THUMBNAIL GENERATOR TAB */}
            <TabsContent value="thumbnail">
              <Card className="p-6">
                <div className="flex items-center gap-4 mb-6">
                  <div className="p-4 bg-orange-500/10 rounded-lg">
                    <Image className="h-8 w-8 text-orange-500" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-semibold">AI Thumbnail Generator</h3>
                    <p className="text-muted-foreground">Generate eye-catching thumbnails with Boostify AI - PRO Feature</p>
                  </div>
                </div>

                <div className="space-y-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">Video Title *</label>
                    <Input
                      placeholder="Enter your video title..."
                      value={thumbnailTitle}
                      onChange={(e) => setThumbnailTitle(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Niche *</label>
                    <Input
                      placeholder="e.g., Gaming, Tech, Cooking..."
                      value={thumbnailNiche}
                      onChange={(e) => setThumbnailNiche(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Style</label>
                    <select
                      className="w-full p-2 rounded-md border bg-background"
                      value={thumbnailStyle}
                      onChange={(e) => setThumbnailStyle(e.target.value)}
                    >
                      <option value="modern">Modern</option>
                      <option value="dramatic">Dramatic</option>
                      <option value="minimalist">Minimalist</option>
                      <option value="colorful">Colorful</option>
                    </select>
                  </div>
                  <Button
                    onClick={handleGenerateThumbnails}
                    disabled={thumbnailLoading}
                    className="w-full bg-orange-500 hover:bg-orange-600"
                  >
                    {thumbnailLoading ? <Loader2 className="animate-spin mr-2" /> : <Image className="mr-2" />}
                    Generate Thumbnails
                  </Button>
                </div>

                {thumbnails.length > 0 && (
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                    <h4 className="text-lg font-semibold mb-4">Generated Thumbnails ({thumbnails.length})</h4>
                    <div className="grid md:grid-cols-3 gap-4">
                      {thumbnails.map((thumb, idx) => (
                        <Card key={idx} className="p-4">
                          <img src={thumb.imageUrl} alt={`Thumbnail ${idx + 1}`} className="w-full h-48 object-cover rounded-lg mb-3" />
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="font-semibold">CTR Score:</span>
                              <span className={getScoreColor(thumb.ctrScore)}>{thumb.ctrScore}/100</span>
                            </div>
                            <p className="text-sm"><strong>Text:</strong> {thumb.suggestedText}</p>
                            <p className="text-sm text-muted-foreground">{thumb.reason}</p>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </motion.div>
                )}
              </Card>
            </TabsContent>

            {/* PHASE 2 - COMPETITOR ANALYSIS TAB */}
            <TabsContent value="competitor">
              <Card className="p-6">
                <div className="flex items-center gap-4 mb-6">
                  <div className="p-4 bg-orange-500/10 rounded-lg">
                    <Search className="h-8 w-8 text-orange-500" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-semibold">Competitor Deep Analysis</h3>
                    <p className="text-muted-foreground">Analyze competitor strategy - PRO Feature</p>
                  </div>
                </div>

                <div className="space-y-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">Competitor Channel Name *</label>
                    <Input
                      placeholder="e.g., MrBeast, PewDiePie..."
                      value={competitorChannel}
                      onChange={(e) => setCompetitorChannel(e.target.value)}
                    />
                  </div>
                  <Button
                    onClick={handleCompetitorAnalysis}
                    disabled={competitorLoading}
                    className="w-full bg-orange-500 hover:bg-orange-600"
                  >
                    {competitorLoading ? <Loader2 className="animate-spin mr-2" /> : <Search className="mr-2" />}
                    Analyze Competitor
                  </Button>
                </div>

                {competitorData && (
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                    <div className="space-y-6">
                      <div className="grid md:grid-cols-3 gap-4">
                        <Card className="p-4">
                          <p className="text-muted-foreground text-sm">Avg Views</p>
                          <p className="text-2xl font-bold text-orange-500">{competitorData.avgViews.toLocaleString()}</p>
                        </Card>
                        <Card className="p-4">
                          <p className="text-muted-foreground text-sm">Upload Frequency</p>
                          <p className="text-2xl font-bold">{competitorData.uploadFrequency}</p>
                        </Card>
                        <Card className="p-4">
                          <p className="text-muted-foreground text-sm">Best Time</p>
                          <p className="text-2xl font-bold">{competitorData.bestUploadTime}</p>
                        </Card>
                      </div>

                      <div>
                        <h4 className="font-semibold mb-2">Top Topics</h4>
                        <div className="flex flex-wrap gap-2">
                          {competitorData.topPerformingTopics.map((topic, idx) => (
                            <Badge key={idx} variant="secondary">{topic}</Badge>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h4 className="font-semibold mb-2">Content Gaps (Your Opportunities)</h4>
                        <ul className="space-y-2">
                          {competitorData.contentGaps.map((gap, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                              <Lightbulb className="w-4 h-4 text-orange-500 mt-1" />
                              <span>{gap}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <h4 className="font-semibold mb-2">Strategic Insights</h4>
                        <ul className="space-y-2">
                          {competitorData.insights.map((insight, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                              <CheckCircle className="w-4 h-4 text-green-500 mt-1" />
                              <span>{insight}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </motion.div>
                )}
              </Card>
            </TabsContent>

            {/* PHASE 2 - TREND PREDICTOR TAB */}
            <TabsContent value="trends">
              <Card className="p-6">
                <div className="flex items-center gap-4 mb-6">
                  <div className="p-4 bg-orange-500/10 rounded-lg">
                    <TrendingUp className="h-8 w-8 text-orange-500" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-semibold">Trend Predictor</h3>
                    <p className="text-muted-foreground">Detect trends BEFORE they explode - PRO Feature</p>
                  </div>
                </div>

                <div className="space-y-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">Your Niche *</label>
                    <Input
                      placeholder="e.g., Gaming, Tech, Fitness..."
                      value={trendNiche}
                      onChange={(e) => setTrendNiche(e.target.value)}
                    />
                  </div>
                  <Button
                    onClick={handlePredictTrends}
                    disabled={trendsLoading}
                    className="w-full bg-orange-500 hover:bg-orange-600"
                  >
                    {trendsLoading ? <Loader2 className="animate-spin mr-2" /> : <TrendingUp className="mr-2" />}
                    Predict Trends
                  </Button>
                </div>

                {trends.length > 0 && (
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                    <h4 className="text-lg font-semibold mb-4">Emerging Trends ({trends.length})</h4>
                    <div className="space-y-4">
                      {trends.map((trend, idx) => (
                        <Card key={idx} className="p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <h5 className="font-semibold text-lg">{trend.topic}</h5>
                              <p className="text-sm text-muted-foreground mt-1">{trend.reason}</p>
                            </div>
                            <Badge className={trend.urgency === 'high' ? 'bg-red-500' : trend.urgency === 'medium' ? 'bg-yellow-500' : 'bg-green-500'}>
                              {trend.urgency} urgency
                            </Badge>
                          </div>
                          <div className="grid grid-cols-3 gap-4 mb-3">
                            <div>
                              <p className="text-sm text-muted-foreground">Confidence</p>
                              <p className="font-semibold text-orange-500">{trend.confidence}%</p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Time to Act</p>
                              <p className="font-semibold">{trend.timeToAct}</p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Competition</p>
                              <Badge variant="outline">{trend.competitionLevel}</Badge>
                            </div>
                          </div>
                          <div>
                            <p className="text-sm font-medium mb-2">Rising Keywords:</p>
                            <div className="flex flex-wrap gap-2">
                              {trend.risingKeywords.map((kw, kidx) => (
                                <Badge key={kidx} variant="secondary">{kw}</Badge>
                              ))}
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </motion.div>
                )}
              </Card>
            </TabsContent>

            {/* PHASE 2 - TRANSCRIPT EXTRACTOR TAB */}
            <TabsContent value="transcript">
              <Card className="p-6">
                <div className="flex items-center gap-4 mb-6">
                  <div className="p-4 bg-orange-500/10 rounded-lg">
                    <Scissors className="h-8 w-8 text-orange-500" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-semibold">Shorts Clip Extractor</h3>
                    <p className="text-muted-foreground">Find viral moments for Shorts - PRO Feature</p>
                  </div>
                </div>

                <div className="space-y-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">Video URL *</label>
                    <Input
                      placeholder="https://youtube.com/watch?v=..."
                      value={transcriptUrl}
                      onChange={(e) => setTranscriptUrl(e.target.value)}
                    />
                  </div>
                  <Button
                    onClick={handleExtractTranscript}
                    disabled={transcriptLoading}
                    className="w-full bg-orange-500 hover:bg-orange-600"
                  >
                    {transcriptLoading ? <Loader2 className="animate-spin mr-2" /> : <Scissors className="mr-2" />}
                    Extract Shorts Clips
                  </Button>
                </div>

                {shortClips.length > 0 && (
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                    <h4 className="text-lg font-semibold mb-4">Viral Shorts Opportunities ({shortClips.length})</h4>
                    <div className="space-y-4">
                      {shortClips.map((clip, idx) => (
                        <Card key={idx} className="p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h5 className="font-semibold">{clip.suggestedTitle}</h5>
                              <p className="text-sm text-muted-foreground">
                                {clip.startTime} - {clip.endTime} ({clip.duration}s)
                              </p>
                            </div>
                            <Badge className={clip.viralScore >= 80 ? 'bg-green-500' : clip.viralScore >= 60 ? 'bg-yellow-500' : 'bg-gray-500'}>
                              {clip.viralScore}% viral
                            </Badge>
                          </div>
                          <p className="text-sm mb-3"><strong>Hook:</strong> "{clip.hook}"</p>
                          <p className="text-sm text-muted-foreground mb-3">{clip.reason}</p>
                          <div className="flex flex-wrap gap-1">
                            {clip.tags.map((tag, tidx) => (
                              <Badge key={tidx} variant="secondary" className="text-xs">{tag}</Badge>
                            ))}
                          </div>
                        </Card>
                      ))}
                    </div>
                  </motion.div>
                )}
              </Card>
            </TabsContent>

            {/* PHASE 3 - MULTI-CHANNEL TRACKING TAB */}
            <TabsContent value="channels">
              <Card className="p-6">
                <div className="flex items-center gap-4 mb-6">
                  <div className="p-4 bg-orange-500/10 rounded-lg">
                    <Users className="h-8 w-8 text-orange-500" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-semibold">Multi-Channel Tracking</h3>
                    <p className="text-muted-foreground">Manage multiple channels - ENTERPRISE Feature</p>
                  </div>
                </div>

                <div className="space-y-4 mb-6">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Channel Name *</label>
                      <Input
                        placeholder="e.g., Tech Channel"
                        value={newChannelName}
                        onChange={(e) => setNewChannelName(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Channel URL *</label>
                      <Input
                        placeholder="https://youtube.com/@channel"
                        value={newChannelUrl}
                        onChange={(e) => setNewChannelUrl(e.target.value)}
                      />
                    </div>
                  </div>
                  <Button
                    onClick={handleAddChannel}
                    disabled={channelsLoading}
                    className="w-full bg-orange-500 hover:bg-orange-600"
                  >
                    {channelsLoading ? <Loader2 className="animate-spin mr-2" /> : <Users className="mr-2" />}
                    Add Channel
                  </Button>
                </div>

                <div className="space-y-4">
                  <Button onClick={loadTrackedChannels} variant="outline" className="w-full">
                    <Eye className="mr-2 w-4 h-4" />
                    Load Tracked Channels
                  </Button>
                  {trackedChannels.length > 0 && (
                    <div className="grid md:grid-cols-2 gap-4">
                      {trackedChannels.map((channel) => (
                        <Card key={channel.id} className="p-4">
                          <h5 className="font-semibold mb-2">{channel.channelName}</h5>
                          <div className="space-y-1 text-sm">
                            <p>Videos: {channel.metrics?.totalVideos || 0}</p>
                            <p>Views: {(channel.metrics?.totalViews || 0).toLocaleString()}</p>
                            <p>Subscribers: {(channel.metrics?.subscribers || 0).toLocaleString()}</p>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              </Card>
            </TabsContent>

            {/* PHASE 3 - CONTENT CALENDAR TAB */}
            <TabsContent value="calendar">
              <Card className="p-6">
                <div className="flex items-center gap-4 mb-6">
                  <div className="p-4 bg-orange-500/10 rounded-lg">
                    <Calendar className="h-8 w-8 text-orange-500" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-semibold">AI Content Calendar</h3>
                    <p className="text-muted-foreground">Generate 30-day plan - ENTERPRISE Feature</p>
                  </div>
                </div>

                <div className="space-y-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">Niche *</label>
                    <Input
                      placeholder="e.g., Tech Reviews"
                      value={calendarNiche}
                      onChange={(e) => setCalendarNiche(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Goals (Optional)</label>
                    <Textarea
                      placeholder="e.g., Grow to 100k subs, increase engagement..."
                      value={calendarGoals}
                      onChange={(e) => setCalendarGoals(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Videos per Week</label>
                    <Input
                      type="number"
                      min="1"
                      max="7"
                      value={videosPerWeek}
                      onChange={(e) => setVideosPerWeek(parseInt(e.target.value))}
                    />
                  </div>
                  <Button
                    onClick={handleGenerateCalendar}
                    disabled={calendarLoading}
                    className="w-full bg-orange-500 hover:bg-orange-600"
                  >
                    {calendarLoading ? <Loader2 className="animate-spin mr-2" /> : <Calendar className="mr-2" />}
                    Generate Calendar
                  </Button>
                </div>

                {calendarWeeks.length > 0 && (
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                    <h4 className="text-lg font-semibold mb-4">Your 30-Day Plan</h4>
                    <div className="space-y-6">
                      {calendarWeeks.map((week) => (
                        <Card key={week.weekNumber} className="p-4">
                          <h5 className="font-semibold mb-3">Week {week.weekNumber}</h5>
                          <div className="space-y-3">
                            {week.videos.map((video, idx) => (
                              <div key={idx} className="border-l-4 border-orange-500 pl-4">
                                <div className="flex items-center justify-between mb-1">
                                  <p className="font-medium">{video.title}</p>
                                  <Badge variant="outline">{video.day}</Badge>
                                </div>
                                <p className="text-sm text-muted-foreground mb-2">{video.description}</p>
                                <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                                  <span>📅 {video.uploadTime}</span>
                                  <span>👁️ ~{video.estimatedViews.toLocaleString()} views</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </Card>
                      ))}
                    </div>
                  </motion.div>
                )}
              </Card>
            </TabsContent>

            {/* PHASE 3 - AUTO-OPTIMIZATION TAB */}
            <TabsContent value="optimization">
              <Card className="p-6">
                <div className="flex items-center gap-4 mb-6">
                  <div className="p-4 bg-orange-500/10 rounded-lg">
                    <Gauge className="h-8 w-8 text-orange-500" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-semibold">Auto-Optimization Engine</h3>
                    <p className="text-muted-foreground">24/7 Performance Monitoring - ENTERPRISE Feature</p>
                  </div>
                </div>

                <div className="space-y-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">Video URL *</label>
                    <Input
                      placeholder="https://youtube.com/watch?v=..."
                      value={optVideoUrl}
                      onChange={(e) => setOptVideoUrl(e.target.value)}
                    />
                  </div>
                  <Button
                    onClick={handleCheckOptimization}
                    disabled={optLoading}
                    className="w-full bg-orange-500 hover:bg-orange-600"
                  >
                    {optLoading ? <Loader2 className="animate-spin mr-2" /> : <Gauge className="mr-2" />}
                    Check Performance
                  </Button>
                </div>

                {optResult && (
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                    <div className="space-y-4">
                      <Card className="p-4 bg-gradient-to-r from-orange-500/10 to-orange-500/5">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-muted-foreground">Performance Score</p>
                            <p className="text-4xl font-bold text-orange-500">{optResult.performanceScore}/100</p>
                          </div>
                          <Badge className={optResult.status === 'exceeding' ? 'bg-green-500' : optResult.status === 'on-track' ? 'bg-blue-500' : 'bg-red-500'}>
                            {optResult.status}
                          </Badge>
                        </div>
                      </Card>

                      {optResult.criticalIssues && optResult.criticalIssues.length > 0 && (
                        <div>
                          <h5 className="font-semibold mb-2 text-red-500">Critical Issues</h5>
                          <ul className="space-y-1">
                            {optResult.criticalIssues.map((issue: string, idx: number) => (
                              <li key={idx} className="flex items-start gap-2">
                                <AlertTriangle className="w-4 h-4 text-red-500 mt-1" />
                                <span>{issue}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {optResult.optimizations && optResult.optimizations.length > 0 && (
                        <div>
                          <h5 className="font-semibold mb-3">Optimization Actions</h5>
                          <div className="space-y-3">
                            {optResult.optimizations.map((opt: OptimizationAction, idx: number) => (
                              <Card key={idx} className="p-4">
                                <div className="flex items-start justify-between mb-2">
                                  <p className="font-medium">{opt.action}</p>
                                  <div className="flex gap-2">
                                    <Badge variant={opt.impact === 'high' ? 'default' : 'outline'}>{opt.impact} impact</Badge>
                                    <Badge variant="secondary">{opt.urgency}</Badge>
                                  </div>
                                </div>
                                <p className="text-sm text-muted-foreground">{opt.reason}</p>
                              </Card>
                            ))}
                          </div>
                        </div>
                      )}

                      {optResult.predictedImprovement && (
                        <Card className="p-4 bg-green-500/10">
                          <p className="text-sm text-muted-foreground">Predicted Improvement</p>
                          <p className="text-xl font-bold text-green-500">{optResult.predictedImprovement}</p>
                        </Card>
                      )}
                    </div>
                  </motion.div>
                )}
              </Card>
            </TabsContent>

            {/* PHASE 3 - EXTRA SERVICES TAB */}
            <TabsContent value="services">
              <ExtraServicesSection
                category="youtube_boost"
                title="Premium Creator Services"
                description="Boost your channel with expert services from verified creators"
              />
            </TabsContent>

            {/* PHASE 3 - API ACCESS TAB */}
            <TabsContent value="api">
              <Card className="p-6">
                <div className="flex items-center gap-4 mb-6">
                  <div className="p-4 bg-orange-500/10 rounded-lg">
                    <Code className="h-8 w-8 text-orange-500" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-semibold">API Access</h3>
                    <p className="text-muted-foreground">External Integration - ENTERPRISE Feature</p>
                  </div>
                </div>

                <div className="space-y-4 mb-6">
                  <Button
                    onClick={handleGenerateApiKey}
                    disabled={apiLoading}
                    className="w-full bg-orange-500 hover:bg-orange-600"
                  >
                    {apiLoading ? <Loader2 className="animate-spin mr-2" /> : <Code className="mr-2" />}
                    Generate New API Key
                  </Button>
                  <Button onClick={loadApiKeys} variant="outline" className="w-full">
                    <Eye className="mr-2 w-4 h-4" />
                    Load My API Keys
                  </Button>
                </div>

                {apiKeys.length > 0 && (
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                    <h4 className="text-lg font-semibold mb-4">Your API Keys ({apiKeys.length})</h4>
                    <div className="space-y-3">
                      {apiKeys.map((key) => (
                        <Card key={key.id} className="p-4">
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-sm font-mono bg-muted px-3 py-1 rounded">{key.apiKey.substring(0, 40)}...</p>
                            <Button size="sm" variant="outline" onClick={() => copyToClipboard(key.apiKey)}>
                              <Copy className="w-4 h-4" />
                            </Button>
                          </div>
                          <div className="flex items-center justify-between text-sm text-muted-foreground">
                            <span>Usage: {key.usageCount.toLocaleString()} / {key.rateLimit.toLocaleString()}</span>
                            <Badge variant={key.isActive ? 'default' : 'secondary'}>
                              {key.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                          </div>
                        </Card>
                      ))}
                    </div>
                    <div className="mt-6 p-4 bg-muted rounded-lg">
                      <h5 className="font-semibold mb-2">API Documentation</h5>
                      <p className="text-sm text-muted-foreground mb-3">
                        Include your API key in the Authorization header:
                      </p>
                      <pre className="bg-background p-3 rounded text-xs overflow-x-auto">
{`curl -X POST https://boostify.com/api/youtube/pre-launch-score \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"title": "My Video", "niche": "Gaming"}'`}
                      </pre>
                    </div>
                  </motion.div>
                )}
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
