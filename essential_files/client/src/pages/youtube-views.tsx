import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Card } from "../components/ui/card";
import { AspectRatio } from "../components/ui/aspect-ratio";
import { useState, useEffect } from "react";
import { useAuth } from "../hooks/use-auth";
import { useToast } from "../hooks/use-toast";
import { Loader2, Play, TrendingUp, PackageCheck, AlertCircle, Clock, Home, CheckCircle2, Shield, Users, Key, Video, FileText, MessageSquare, Eye, Database, Brain, Music2, Scissors, Type, Sparkles, Music, Search, Image } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
// Stripe is loaded dynamically to prevent initialization errors
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "../components/ui/dialog";
import { getAuthToken } from "../lib/firebase";
import { createYouTubeViewsOrder, checkApifyRun, YouTubeViewsData } from "../lib/youtube-store";
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import { motion, AnimatePresence } from "framer-motion";
import 'react-circular-progressbar/dist/styles.css';
import { Link } from "wouter";
import { SiYoutube } from "react-icons/si";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Textarea } from "../components/ui/textarea";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart
} from "recharts";
import { Users2 } from "lucide-react";
import { Header } from "../components/layout/header";

// Function to load Stripe dynamically
const getStripe = async () => {
  try {
    const { loadStripe } = await import('@stripe/stripe-js');
    return await loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);
  } catch (error) {
    console.error('Error loading Stripe:', error);
    return null;
  }
};

const viewsPackages = [
  {
    views: 1000,
    price: 50,
    description: "Perfect for new content creators",
    features: ["Organic views", "24/7 Support", "Real-time tracking"]
  },
  {
    views: 10000,
    price: 450,
    description: "Most popular for growing channels",
    features: ["Premium viewer retention", "Priority support", "Detailed analytics"]
  },
  {
    views: 100000,
    price: 4000,
    description: "For professional content creators",
    features: ["Maximum engagement", "Dedicated account manager", "Custom delivery schedule"]
  }
];

export default function YoutubeViewsPage() {
  const [videoUrl, setVideoUrl] = useState("");
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedPackage, setSelectedPackage] = useState<number | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [desiredViews, setDesiredViews] = useState(1000);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState(0);
  const [paymentStatus, setPaymentStatus] = useState<'success' | 'canceled' | null>(null);
  const [activeTab, setActiveTab] = useState("strategy");
  const [keywordInput, setKeywordInput] = useState("");
  const [generatedKeywords, setGeneratedKeywords] = useState<string[]>([]);
  const [videoTitle, setVideoTitle] = useState("");
  const [generatingCover, setGeneratingCover] = useState(false);

  const { data: apifyData, refetch } = useQuery({
    queryKey: ["apify-run", orderId],
    queryFn: async () => {
      if (!orderId) return null;
      return checkApifyRun(orderId);
    },
    enabled: !!orderId,
    refetchInterval: orderId ? 5000 : false
  });

  const getPackagePrice = (views: number) => {
    if (views <= 1000) return 50;
    if (views <= 10000) return 450;
    return Math.ceil(views * 0.04);
  };

  const currentPrice = getPackagePrice(desiredViews);

  const handlePackageSelect = async (packageIndex: number) => {
    if (!videoUrl) {
      toast({
        title: "Error",
        description: "Please enter a valid YouTube URL",
        variant: "destructive"
      });
      return;
    }

    setDesiredViews(viewsPackages[packageIndex].views);
    setShowDialog(true);
  };

  const handlePayment = async () => {
    if (!videoUrl) {
      toast({
        title: "Error",
        description: "Please enter a valid YouTube URL",
        variant: "destructive"
      });
      return;
    }

    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to continue",
        variant: "destructive"
      });
      return;
    }

    try {
      const token = await getAuthToken();
      if (!token) {
        toast({
          title: "Authentication Error",
          description: "Please log in to continue",
          variant: "destructive"
        });
        return;
      }

      setIsProcessing(true);

      const orderData = await createYouTubeViewsOrder(user, {
        videoUrl,
        purchasedViews: desiredViews,
        apifyRunId: '',
      });

      if (!orderData || !orderData.id) {
        throw new Error('Failed to create order');
      }

      const stripe = await getStripe();
      if (!stripe) {
        throw new Error("Could not initialize Stripe");
      }

      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          videoUrl,
          views: desiredViews,
          price: currentPrice,
          orderId: orderData.id
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error creating payment session');
      }

      const { sessionId } = await response.json();
      if (!sessionId) {
        throw new Error('Stripe session ID was not received');
      }

      const { error } = await stripe.redirectToCheckout({
        sessionId
      });

      if (error) {
        throw new Error(error.message);
      }
    } catch (error: any) {
      console.error('Payment process error:', error);
      toast({
        title: "Payment Error",
        description: error.message || "There was an error processing the payment. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
      setShowDialog(false);
    }
  };
  const chartData = Array.from({ length: 7 }, (_, i) => ({
      day: `Day ${i + 1}`,
      views: Math.floor(Math.random() * 5000) + 1000
    }));

  const progress = 75;
  const currentViews = 7500;

  const startViewsProcess = () => {
    if (!videoUrl) {
      toast({
        title: "Error",
        description: "Please enter a valid YouTube URL",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);
    let step = 0;
    const interval = setInterval(() => {
      step++;
      setProcessingStep(step);
      if (step >= 3) {
        clearInterval(interval);
        setShowDialog(true);
      }
    }, 1500);
  };

  const getStepMessage = (step: number) => {
    switch (step) {
      case 1:
        return "Validating video URL...";
      case 2:
        return "Analyzing current metrics...";
      case 3:
        return "Ready to start. Payment required to continue.";
      default:
        return "Initializing process...";
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get('session_id');
    const success = params.get('success');
    const canceled = params.get('canceled');

    if (sessionId && success === 'true') {
      setPaymentStatus('success');
      toast({
        title: "Payment Successful",
        description: "Your order has been processed successfully. You can track your views progress here.",
        variant: "default",
      });
    } else if (canceled === 'true') {
      setPaymentStatus('canceled');
      toast({
        title: "Payment Canceled",
        description: "Your payment was canceled. You can try again when you're ready.",
        variant: "destructive",
      });
    }
  }, []);

  const handleGenerateKeywords = async () => {
    setGeneratedKeywords([
      "#trending", "#viral", "#youtubegrowth",
      "#contentcreator", "#youtubetips", "#socialmedia"
    ]);
  };

  const handleGenerateCover = async () => {
    setGeneratingCover(true);
    setTimeout(() => {
      setGeneratingCover(false);
      toast({
        title: "Cover Generated",
        description: "Your video cover has been generated successfully",
      });
    }, 2000);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 space-y-8 p-4 md:p-8 pt-6">
        <div className="relative w-full h-[70vh] md:h-[90vh] overflow-hidden rounded-xl mb-12">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: "url('/assets/VzOu774PPeGzuzXmcP83y_5cd275d118e340239a4d0b6400689592.jpg')"
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 to-black/40" />
          <div className="relative h-full flex items-center justify-start px-4 md:px-12 pt-16 md:pt-0">
            <div className="max-w-2xl">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <h1 className="text-3xl md:text-6xl font-bold text-white mb-4">
                  Boost Your Presence on{" "}
                  <span className="bg-gradient-to-r from-orange-500 to-orange-400 bg-clip-text text-transparent">
                    YouTube
                  </span>
                </h1>
                <p className="text-base md:text-xl text-gray-200 mb-8">
                  Enhance your videos with organic, high-retention views. Reach your ideal audience and increase your visibility.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button
                    size="lg"
                    className="bg-orange-500 hover:bg-orange-600 text-white w-full sm:w-auto"
                    onClick={() => document.getElementById('packages')?.scrollIntoView({ behavior: 'smooth' })}
                  >
                    <Play className="w-5 h-5 mr-2" />
                    Start Now
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="bg-black/50 hover:bg-black/60 border-white/20 text-white w-full sm:w-auto"
                  >
                    Watch Demo
                  </Button>
                </div>
                <div className="mt-8 flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-8">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-orange-500/20 flex items-center justify-center">
                      <TrendingUp className="w-6 h-6 text-orange-500" />
                    </div>
                    <div>
                      <p className="text-white font-semibold">+2M</p>
                      <p className="text-gray-400 text-sm">Generated Views</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-orange-500/20 flex items-center justify-center">
                      <Users2 className="w-6 h-6 text-orange-500" />
                    </div>
                    <div>
                      <p className="text-white font-semibold">10k+</p>
                      <p className="text-gray-400 text-sm">Satisfied Clients</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col md:flex-row md:items-center justify-between gap-4"
        >
          <div className="flex items-center gap-4">
            <SiYoutube className="w-12 h-12 text-orange-500" />
            <div>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight bg-gradient-to-r from-orange-500 to-orange-500/70 bg-clip-text text-transparent">
                YouTube Views Generator
              </h2>
              <p className="text-muted-foreground mt-2">
                Boost your videos with organic, high-retention views
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Link href="/dashboard">
              <Button variant="outline" className="gap-2 w-full md:w-auto">
                <Home className="w-4 h-4" />
                Dashboard
              </Button>
            </Link>
          </div>
        </motion.div>

        <div className="container mx-auto">
          <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="flex flex-wrap gap-2 md:grid md:grid-cols-7">
              {[
                { value: "strategy", icon: <Brain className="w-4 h-4" />, label: "AI Strategy" },
                { value: "keywords", icon: <Key className="w-4 h-4" />, label: "Keywords" },
                { value: "cover", icon: <Video className="w-4 h-4" />, label: "Cover Gen" },
                { value: "shorts", icon: <FileText className="w-4 h-4" />, label: "Shorts" },
                { value: "comments", icon: <MessageSquare className="w-4 h-4" />, label: "Comments" },
                { value: "views", icon: <Eye className="w-4 h-4" />, label: "Views" },
                { value: "scraping", icon: <Database className="w-4 h-4" />, label: "Scraping" }
              ].map(({ value, icon, label }) => (
                <TabsTrigger
                  key={value}
                  value={value}
                  className="flex-1 md:flex-none data-[state=active]:bg-orange-500 min-w-[80px]"
                >
                  {icon}
                  <span className="hidden md:inline ml-2">{label}</span>
                  <span className="md:hidden ml-2">{label.split(' ')[0]}</span>
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value="strategy">
              <Card className="p-4 md:p-6">
                <div className="flex flex-col md:flex-row items-start md:items-center gap-4 mb-6">
                  <div className="p-3 md:p-4 bg-orange-500/10 rounded-lg">
                    <Brain className="h-6 w-6 md:h-8 md:w-8 text-orange-500" />
                  </div>
                  <div>
                    <h3 className="text-xl md:text-2xl font-semibold">AI YouTube Strategy</h3>
                    <p className="text-sm md:text-base text-muted-foreground">
                      Get personalized content and growth strategies
                    </p>
                  </div>
                </div>
                <div className="space-y-6">
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-4">Ask AI Assistant</h4>
                    <Textarea
                      className="mb-4"
                      placeholder="Ask about content strategy, audience growth, or optimization tips..."
                      rows={4}
                    />
                    <Button className="w-full bg-orange-500 hover:bg-orange-600">
                      Get AI Response
                    </Button>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-medium mb-4">Quick Analysis</h4>
                      <div className="space-y-4">
                        <Button variant="outline" className="w-full justify-start">
                          <TrendingUp className="mr-2 h-4 w-4" />
                          Analyze Channel Growth
                        </Button>
                        <Button variant="outline" className="w-full justify-start">
                          <Users className="mr-2 h-4 w-4" />
                          Audience Insights
                        </Button>
                      </div>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-medium mb-4">Strategy Tools</h4>
                      <div className="space-y-4">
                        <Button variant="outline" className="w-full justify-start">
                          <Clock className="mr-2 h-4 w-4" />
                          Best Upload Times
                        </Button>
                        <Button variant="outline" className="w-full justify-start">
                          <TrendingUp className="mr-2 h-4 w-4" />
                          Trending Topics
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </TabsContent>
            <TabsContent value="keywords">
              <Card className="p-4 md:p-6">
                <div className="flex flex-col md:flex-row items-start md:items-center gap-4 mb-6">
                  <div className="p-3 md:p-4 bg-orange-500/10 rounded-lg">
                    <Key className="h-6 w-6 md:h-8 md:w-8 text-orange-500" />
                  </div>
                  <div>
                    <h3 className="text-xl md:text-2xl font-semibold">Keywords Generator</h3>
                    <p className="text-sm md:text-base text-muted-foreground">
                      Generate optimized keywords for your videos
                    </p>
                  </div>
                </div>
                <div className="space-y-6">
                  <div className="p-4 border rounded-lg">
                    <Input
                      placeholder="Enter your video topic..."
                      value={keywordInput}
                      onChange={(e) => setKeywordInput(e.target.value)}
                      className="mb-4"
                    />
                    <Button
                      className="w-full bg-orange-500 hover:bg-orange-600"
                      onClick={handleGenerateKeywords}
                    >
                      Generate Keywords
                    </Button>
                  </div>
                  {generatedKeywords.length > 0 && (
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-medium mb-4">Generated Keywords</h4>
                      <div className="flex flex-wrap gap-2">
                        {generatedKeywords.map((keyword, index) => (
                          <div key={index} className="px-3 py-1 bg-orange-500/10 rounded-full text-sm">
                            {keyword}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            </TabsContent>
            <TabsContent value="cover">
              <Card className="p-4 md:p-6">
                <div className="flex flex-col md:flex-row items-start md:items-center gap-4 mb-6">
                  <div className="p-3 md:p-4 bg-orange-500/10 rounded-lg">
                    <Video className="h-6 w-6 md:h-8 md:w-8 text-orange-500" />
                  </div>
                  <div>
                    <h3 className="text-xl md:text-2xl font-semibold">Cover Generator</h3>
                    <p className="text-sm md:text-base text-muted-foreground">
                      Create eye-catching thumbnails for your videos
                    </p>
                  </div>
                </div>
                <div className="space-y-6">
                  <div className="p-4 border rounded-lg">
                    <Input
                      placeholder="Enter video title..."
                      value={videoTitle}
                      onChange={(e) => setVideoTitle(e.target.value)}
                      className="mb-4"
                    />
                    <Button
                      className="w-full bg-orange-500 hover:bg-orange-600"
                      onClick={handleGenerateCover}
                      disabled={generatingCover}
                    >
                      {generatingCover ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        'Generate Cover'
                      )}
                    </Button>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-medium mb-4">Style Presets</h4>
                      <div className="space-y-4">
                        <Button variant="outline" className="w-full justify-start">
                          <Play className="mr-2 h-4 w-4" />
                          Gaming Style
                        </Button>
                        <Button variant="outline" className="w-full justify-start">
                          <Users className="mr-2 h-4 w-4" />
                          Vlog Style
                        </Button>
                      </div>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-medium mb-4">Elements</h4>
                      <div className="space-y-4">
                        <Button variant="outline" className="w-full justify-start">
                          <FileText className="mr-2 h-4 w-4" />
                          Add Text
                        </Button>
                        <Button variant="outline" className="w-full justify-start">
                          <Image className="mr-2 h-4 w-4" />
                          Add Image
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </TabsContent>
            <TabsContent value="shorts">
              <Card className="p-4 md:p-6">
                <div className="flex flex-col md:flex-row items-start md:items-center gap-4 mb-6">
                  <div className="p-3 md:p-4 bg-orange-500/10 rounded-lg">
                    <FileText className="h-6 w-6 md:h-8 md:w-8 text-orange-500" />
                  </div>
                  <div>
                    <h3 className="text-xl md:text-2xl font-semibold">Shorts Creator</h3>
                    <p className="text-sm md:text-base text-muted-foreground">
                      Create engaging short-form videos
                    </p>
                  </div>
                </div>
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-4">Video Templates</h4>
                    <div className="space-y-4">
                      <Button variant="outline" className="w-full justify-start">
                        <Play className="mr-2 h-4 w-4" />
                        Tutorial Template
                      </Button>
                      <Button variant="outline" className="w-full justify-start">
                        <Music2 className="mr-2 h-4 w-4" />
                        Music Template
                      </Button>
                    </div>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-4">Edit Tools</h4>
                    <div className="space-y-4">
                      <Button variant="outline" className="w-full justify-start">
                        <Scissors className="mr-2 h-4 w-4" />
                        Trim Video
                      </Button>
                      <Button variant="outline" className="w-full justify-start">
                        <Type className="mr-2 h-4 w-4" />
                        Add Captions
                      </Button>
                    </div>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-4">Effects</h4>
                    <div className="space-y-4">
                      <Button variant="outline" className="w-full justify-start">
                        <Sparkles className="mr-2 h-4 w-4" />
                        Visual Effects
                      </Button>
                      <Button variant="outline" className="w-full justify-start">
                        <Music className="mr-2 h-4 w-4" />
                        Sound Effects
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            </TabsContent>
            <TabsContent value="comments">
              <Card className="p-4 md:p-6">
                <div className="flex flex-col md:flex-row items-start md:items-center gap-4 mb-6">
                  <div className="p-3 md:p-4 bg-orange-500/10 rounded-lg">
                    <MessageSquare className="h-6 w-6 md:h-8 md:w-8 text-orange-500" />
                  </div>
                  <div>
                    <h3 className="text-xl md:text-2xl font-semibold">Auto Comments</h3>
                    <p className="text-sm md:text-base text-muted-foreground">
                      Manage automated comments and engagement
                    </p>
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-6">
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-medium mb-4">Comment Templates</h4>
                      <Textarea
                        className="mb-4"
                        placeholder="Create your comment template..."
                        rows={4}
                      />
                      <Button className="w-full bg-orange-500 hover:bg-orange-600">
                        Save Template
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-6">
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-medium mb-4">Bot Settings</h4>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span>Comment Frequency</span>
                          <Input type="number" className="w-24" placeholder="30" />
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Daily Limit</span>
                          <Input type="number" className="w-24" placeholder="100" />
                        </div>
                        <Button className="w-full bg-orange-500 hover:bg-orange-600">
                          Start Bot
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </TabsContent>
            <TabsContent value="views">
              <Card className="p-4 md:p-6">
                <div className="flex flex-col md:flex-row items-start md:items-center gap-4 mb-6">
                  <div className="p-3 md:p-4 bg-orange-500/10 rounded-lg">
                    <Eye className="h-6 w-6 md:h-8 md:w-8 text-orange-500" />
                  </div>
                  <div>
                    <h3 className="text-xl md:text-2xl font-semibold">Views Generator</h3>
                    <p className="text-sm md:text-base text-muted-foreground">
                      Boost your video views organically
                    </p>
                  </div>
                </div>
                <div className="space-y-8">
                  <div>
                    <h3 className="text-2xl font-bold mb-4 bg-gradient-to-r from-orange-500 to-orange-500/70 bg-clip-text text-transparent">
                      Start Growing Your Views
                    </h3>
                    <p className="text-muted-foreground">
                      Enter your video details and desired view count to begin
                    </p>
                  </div>

                  <div className="grid gap-6">
                    <div className="space-y-2">
                      <label htmlFor="video-url" className="text-sm font-medium">
                        Video URL
                      </label>
                      <div className="relative">
                        <Input
                          id="video-url"
                          placeholder="https://youtube.com/watch?v=..."
                          value={videoUrl}
                          onChange={(e) => setVideoUrl(e.target.value)}
                          className="bg-background/50 border-orange-500/10 focus:border-orange-500 pl-10"
                        />
                        <SiYoutube className="absolute left-3 top-1/2 transform -translate-y-1/2 text-orange-500 h-4 w-4" />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="desired-views" className="text-sm font-medium">
                        Desired Views
                      </label>
                      <div className="relative">
                        <Input
                          id="desired-views"
                          type="number"
                          min="1000"
                          step="1000"
                          value={desiredViews}
                          onChange={(e) => setDesiredViews(parseInt(e.target.value))}
                          className="bg-background/50 border-orange-500/10 focus:border-orange-500"
                        />
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-muted-foreground">
                          Views
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <PackageCheck className="h-4 w-4" />
                        Minimum: 1,000 views
                      </p>
                    </div>

                    <div className="p-4 bg-orange-500/5 rounded-lg border border-orange-500/10">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium">Estimated Price</span>
                        <span className="text-2xl font-bold">${currentPrice}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Based on {desiredViews.toLocaleString()} views at ${(currentPrice / desiredViews).toFixed(3)} per view
                      </p>
                    </div>

                    {isProcessing ? (
                      <div className="space-y-4">
                        <div className="h-2 bg-orange-500/20 rounded-full overflow-hidden">
                          <motion.div
                            className="h-full bg-orange-500"
                            initial={{ width: "0%" }}
                            animate={{ width: `${(processingStep / 3) * 100}%` }}
                            transition={{ duration: 0.5 }}
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-full bg-orange-500/20 flex items-center justify-center">
                            {processingStep < 3 ? (
                              <Loader2 className="h-4 w-4 text-orange-500 animate-spin" />
                            ) : (
                              <CheckCircle2 className="h-4 w-4 text-orange-500" />
                            )}
                          </div>
                          <p className="text-sm font-medium">
                            {getStepMessage(processingStep)}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <Button
                        onClick={startViewsProcess}
                        className="w-full bg-orange-500 hover:bg-orange-600 text-lg h-12"
                      >
                        <Play className="w-5 h-5 mr-2" />
                        Start Process
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-4 pt-4">
                    <div className="flex items-center gap-2">
                      <div className="h-10 w-10 rounded-full bg-orange-500/20 flex items-center justify-center">
                        <Shield className="h-5 w-5 text-orange-500" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">Secure</p>
                        <p className="text-xs text-muted-foreground">SSL Protected</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-10 w-10 rounded-full bg-orange-500/20 flex items-center justify-center">
                        <Clock className="h-5 w-5 text-orange-500" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">Fast Delivery</p>
                        <p className="text-xs text-muted-foreground">24-72 hours</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-10 w-10 rounded-full bg-orange-500/20 flex items-center justify-center">
                        <Users className="h-5 w-5 text-orange-500" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">Support</p>
                        <p className="text-xs text-muted-foreground">24/7 Available</p>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="scraping">
              <Card className="p-4 md:p-6">
                <div className="flex flex-col md:flex-row items-start md:items-center gap-4 mb-6">
                  <div className="p-3 md:p-4 bg-orange-500/10 rounded-lg">
                    <Database className="h-6 w-6 md:h-8 md:w-8 text-orange-500" />
                  </div>
                  <div>
                    <h3 className="text-xl md:text-2xl font-semibold">Scraping Tools</h3>
                    <p className="text-sm md:text-base text-muted-foreground">
                      Analyze competitors and track trends
                    </p>
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-4">Competitor Analysis</h4>
                    <Input
                      placeholder="Enter channel URL..."
                      className="mb-4"
                    />
                    <Button className="w-full bg-orange-500 hover:bg-orange-600">
                      Analyze Channel
                    </Button>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-4">Trend Tracking</h4>
                    <div className="space-y-4">
                      <Button variant="outline" className="w-full justify-start">
                        <TrendingUp className="mr-2 h-4 w-4" />
                        Track Hashtags
                      </Button>
                      <Button variant="outline" className="w-full justify-start">
                        <Search className="mr-2 h-4 w-4" />
                        Find Keywords
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <Card className="p-4 md:p-6 backdrop-blur-sm border-orange-500/10">
            <div className="space-y-8">
              <div>
                <h3 className="text-xl md:text-2xl font-bold mb-4 bg-gradient-to-r from-orange-500 to-orange-500/70 bg-clip-text text-transparent">
                  Start Growing Your Views
                </h3>
                <p className="text-sm md:text-base text-muted-foreground">
                  Enter your video details and desired view count to begin
                </p>
              </div>

              <div className="grid gap-6">
                <div className="space-y-2">
                  <label htmlFor="video-url" className="text-sm font-medium">
                    Video URL
                  </label>
                  <div className="relative">
                    <Input
                      id="video-url"
                      placeholder="https://youtube.com/watch?v=..."
                      value={videoUrl}
                      onChange={(e) => setVideoUrl(e.target.value)}
                      className="bg-background/50 border-orange-500/10 focus:border-orange-500 pl-10"
                    />
                    <SiYoutube className="absolute left-3 top-1/2 transform -translate-y-1/2 text-orange-500 h-4 w-4" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="desired-views" className="text-sm font-medium">
                    Desired Views
                  </label>
                  <div className="relative">
                    <Input
                      id="desired-views"
                      type="number"
                      min="1000"
                      step="1000"
                      value={desiredViews}
                      onChange={(e) => setDesiredViews(parseInt(e.target.value))}
                      className="bg-background/50 border-orange-500/10 focus:border-orange-500"
                    />
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-muted-foreground">
                      Views
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <PackageCheck className="h-4 w-4" />
                    Minimum: 1,000 views
                  </p>
                </div>

                <div className="p-4 bg-orange-500/5 rounded-lg border border-orange-500/10">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">Estimated Price</span>
                    <span className="text-2xl font-bold">${currentPrice}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Based on {desiredViews.toLocaleString()} views at ${(currentPrice / desiredViews).toFixed(3)} per view
                  </p>
                </div>

                {isProcessing ? (
                  <div className="space-y-4">
                    <div className="h-2 bg-orange-500/20 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-orange-500"
                        initial={{ width: "0%" }}
                        animate={{ width: `${(processingStep / 3) * 100}%` }}
                        transition={{ duration: 0.5 }}
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-orange-500/20 flex items-center justify-center">
                        {processingStep < 3 ? (
                          <Loader2 className="h-4 w-4 text-orange-500 animate-spin" />
                        ) : (
                          <CheckCircle2 className="h-4 w-4 text-orange-500" />
                        )}
                      </div>
                      <p className="text-sm font-medium">
                        {getStepMessage(processingStep)}
                      </p>
                    </div>
                  </div>
                ) : (
                  <Button
                    onClick={startViewsProcess}
                    className="w-full bg-orange-500 hover:bg-orange-600 text-lg h-12"
                  >
                    <Play className="w-5 h-5 mr-2" />
                    Start Process
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-3 gap-4 pt-4">
                <div className="flex items-center gap-2">
                  <div className="h-10 w-10 rounded-full bg-orange-500/20 flex items-center justify-center">
                    <Shield className="h-5 w-5 text-orange-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Secure</p>
                    <p className="text-xs text-muted-foreground">SSL Protected</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-10 w-10 rounded-full bg-orange-500/20 flex items-center justify-center">
                    <Clock className="h-5 w-5 text-orange-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Fast Delivery</p>
                    <p className="text-xs text-muted-foreground">24-72 hours</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-10 w-10 rounded-full bg-orange-500/20 flex items-center justify-center">
                    <Users className="h-5 w-5 text-orange-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Support</p>
                    <p className="text-xs text-muted-foreground">24/7 Available</p>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        {apifyData && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="p-4 md:p-6 backdrop-blur-sm border-orange-500/10">
              <div className="space-y-4">
                <h3 className="text-lg md:text-xl font-semibold">Process Status</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Generated Views</p>
                    <p className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-orange-500 to-orange-500/70 bg-clip-text text-transparent">
                      {apifyData.stats.viewsGenerated.toLocaleString()}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Remaining Views</p>
                    <p className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-orange-500 to-orange-500/70 bg-clip-text text-transparent">
                      {apifyData.stats.remainingViews.toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="pt-4">
                  <div className="flex items-center gap-2 text-sm md:text-base">
                    <TrendingUp className="h-4 w-4 md:h-5 md:w-5 text-orange-500" />
                    <span>Status: {apifyData.status}</span>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </main>
    </div>
  );
}