import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Play, TrendingUp, PackageCheck, AlertCircle, Clock, Home, CheckCircle2, Shield, Users } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { loadStripe } from "@stripe/stripe-js";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { getAuthToken } from "@/lib/firebase";
import { createYouTubeViewsOrder, checkApifyRun, YouTubeViewsData } from "@/lib/youtube-store";
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import { motion, AnimatePresence } from "framer-motion";
import 'react-circular-progressbar/dist/styles.css';
import { Link } from "wouter";
import { SiYoutube } from "react-icons/si";
import mainVideo from '../images/videos/Standard_Mode_Generated_Video (1).mp4';
import enhanceVideo from '../images/videos/bostify.mp4';
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
import youtubeImage from '../images/youtube.jpg';
import { Users2 } from "lucide-react";
import { Header } from "@/components/layout/header";

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

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
    return Math.ceil(views * 0.04); // $0.04 per view for custom amounts
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

      // Create order in Firebase first
      const orderData = await createYouTubeViewsOrder(user, {
        videoUrl,
        purchasedViews: desiredViews,
        apifyRunId: '',
      });

      if (!orderData || !orderData.id) {
        throw new Error('Failed to create order');
      }

      const stripe = await stripePromise;
      if (!stripe) {
        throw new Error("Could not initialize Stripe");
      }

      // Create Stripe checkout session
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

      // Redirect to Stripe checkout
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
    // Simulate process steps
    let step = 0;
    const interval = setInterval(() => {
      step++;
      setProcessingStep(step);
      if (step >= 3) {
        clearInterval(interval);
        setShowDialog(true); // Show payment dialog
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

  // Add URL parameter handling
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

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <div className="flex-1 space-y-8 p-8 pt-6 bg-gradient-to-b from-background to-background/80">
        {/* Hero Section with Video Background */}
        <div className="relative w-full h-[70vh] md:h-[90vh] overflow-hidden rounded-xl mb-12">
          <div 
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: "url('/assets/VzOu774PPeGzuzXmcP83y_5cd275d118e340239a4d0b6400689592.jpg')"
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 to-black/40" />
          <div className="relative h-full flex items-center justify-start px-8 md:px-12 pt-24 md:pt-0">
            <div className="max-w-2xl">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
                  Boost Your Presence on{" "}
                  <span className="bg-gradient-to-r from-orange-500 to-orange-400 bg-clip-text text-transparent">
                    YouTube
                  </span>
                </h1>
                <p className="text-lg md:text-xl text-gray-200 mb-8">
                  Enhance your videos with organic, high-retention views. Reach your ideal audience and increase your visibility.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button 
                    size="lg" 
                    className="bg-orange-500 hover:bg-orange-600 text-white"
                    onClick={() => document.getElementById('packages')?.scrollIntoView({ behavior: 'smooth' })}
                  >
                    <Play className="w-5 h-5 mr-2" />
                    Start Now
                  </Button>
                  <Button 
                    size="lg" 
                    variant="outline" 
                    className="bg-black/50 hover:bg-black/60 border-white/20 text-white"
                  >
                    Watch Demo
                  </Button>
                </div>
                <div className="mt-8 flex items-center gap-8">
                  <div className="flex items-center gap-2">
                    <div className="w-12 h-12 rounded-full bg-orange-500/20 flex items-center justify-center">
                      <TrendingUp className="w-6 h-6 text-orange-500" />
                    </div>
                    <div>
                      <p className="text-white font-semibold">+2M</p>
                      <p className="text-gray-400 text-sm">Generated Views</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
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
          className="flex items-center justify-between"
        >
          <div className="flex items-center gap-4">
            <SiYoutube className="w-12 h-12 text-orange-500" />
            <div>
              <h2 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-orange-500 to-orange-500/70 bg-clip-text text-transparent">
                YouTube Views Generator
              </h2>
              <p className="text-muted-foreground mt-2">
                Boost your videos with organic, high-retention views
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Link href="/dashboard">
              <Button variant="outline" className="gap-2">
                <Home className="w-4 h-4" />
                Dashboard
              </Button>
            </Link>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Card className="overflow-hidden border-orange-500/10">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="p-6 flex flex-col justify-center">
                <h3 className="text-2xl font-bold mb-4 bg-gradient-to-r from-orange-500 to-orange-500/70 bg-clip-text text-transparent">
                  Boost Your YouTube Presence
                </h3>
                <p className="text-muted-foreground mb-6">
                  Get real, high-retention views from genuine users. Our service helps you increase your video's visibility and engagement organically.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button className="bg-orange-500 hover:bg-orange-600">
                    <Play className="w-4 h-4 mr-2" />
                    Get Started
                  </Button>
                  <Button variant="outline">
                    Learn More
                  </Button>
                </div>
              </div>
              <div className="relative">
                <div className="absolute inset-0 bg-orange-500/5" />
                <AspectRatio ratio={16 / 9} className="bg-muted">
                  <div className="h-full w-full relative overflow-hidden">
                    <video
                      src={enhanceVideo}
                      autoPlay
                      loop
                      muted
                      playsInline
                      className="object-cover w-full h-full"
                    />
                  </div>
                </AspectRatio>
              </div>
            </div>
          </Card>
        </motion.div>

        <div className="grid gap-6 md:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card className="p-6 relative overflow-hidden backdrop-blur-sm border-orange-500/10">
              <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 via-orange-500/5 to-transparent" />
              <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:20px_20px]" />
              <div className="relative">
                <div className="flex items-center gap-2 mb-4">
                  <Clock className="h-5 w-5 text-orange-500" />
                  <h3 className="text-lg font-semibold">Real-Time Progress</h3>
                </div>
                <div className="flex items-center justify-between">
                  <div className="w-32 h-32 relative">
                    <div className="absolute inset-0 bg-orange-500/5 rounded-full animate-pulse" />
                    <CircularProgressbar
                      value={progress}
                      text={`${progress}%`}
                      styles={buildStyles({
                        pathColor: `hsl(var(--primary))`,
                        textColor: `hsl(var(--primary))`,
                        trailColor: 'rgba(255,255,255,0.1)',
                        pathTransition: 'stroke-dashoffset 0.5s ease 0s',
                      })}
                    />
                  </div>
                  <div className="flex-1 ml-8">
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">Current Views</p>
                      <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="text-4xl font-bold tabular-nums bg-gradient-to-r from-orange-500 to-orange-500/70 bg-clip-text text-transparent"
                      >
                        {currentViews.toLocaleString()}
                      </motion.div>
                      <p className="text-sm text-orange-500 flex items-center">
                        <TrendingUp className="w-4 h-4 mr-1" />
                        +2.5% since yesterday
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Card className="p-6 relative overflow-hidden backdrop-blur-sm border-orange-500/10">
              <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 via-orange-500/5 to-transparent" />
              <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:20px_20px]" />
              <div className="relative">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="h-5 w-5 text-orange-500" />
                  <h3 className="text-lg font-semibold">Trends</h3>
                </div>
                <div className="h-[180px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={[
                      { time: '1h', views: 120 },
                      { time: '2h', views: 250 },
                      { time: '3h', views: 380 },
                      { time: '4h', views: 470 },
                      { time: '5h', views: 600 }
                    ]}>
                      <defs>
                        <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted-foreground)/0.1)" />
                      <XAxis dataKey="time" stroke="hsl(var(--muted-foreground))" />
                      <YAxis stroke="hsl(var(--muted-foreground))" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--background))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="views"
                        stroke="hsl(var(--primary))"
                        fillOpacity={1}
                        fill="url(#colorViews)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <Card className="p-6 backdrop-blur-sm border-orange-500/10">
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
                    <p className="text-sm font-medium">Real Views</p>
                    <p className="text-xs text-muted-foreground">High Retention</p>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>
        

        <div className="grid gap-6 md:grid-cols-3" id="packages">
          {viewsPackages.map((pkg, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 + index * 0.1 }}
            >
              <Card className="p-6 relative overflow-hidden backdrop-blur-sm border-orange-500/10 hover:border-orange-500/30 transition-all duration-300">
                <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 via-orange-500/5 to-transparent opacity-50" />
                <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:20px_20px]" />
                <div className="relative">
                  <h3 className="text-2xl font-bold bg-gradient-to-r from-orange-500 to-orange-500/70 bg-clip-text text-transparent">
                    {pkg.views.toLocaleString()} Views
                  </h3>
                  <p className="text-3xl font-bold mt-2">${pkg.price}</p>
                  <p className="text-sm text-muted-foreground mt-2">{pkg.description}</p>

                  <ul className="mt-4 space-y-2">
                    {pkg.features.map((feature, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm">
                        <PackageCheck className="h-4 w-4 text-orange-500" />
                        {feature}
                      </li>
                    ))}
                  </ul>

                  <Button 
                    className="w-full mt-6 bg-orange-500 hover:bg-orange-600 text-white"
                    onClick={() => handlePackageSelect(index)}
                  >
                    Select Plan
                  </Button>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>

        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogContent className="sm:max-w-[425px] backdrop-blur-sm bg-background/95">
            <DialogHeader>
              <DialogTitle>Confirm Views Purchase</DialogTitle>
              <DialogDescription>
                Review your purchase details before proceeding
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <h4 className="font-medium">Order details</h4>
                  <div className="space-y-4 rounded-lg border p-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Video URL:</span>
                      <span className="text-sm font-medium">{videoUrl}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Views:</span>
                      <span className="text-sm font-medium">{desiredViews.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Price:</span>
                      <span className="text-lg font-bold">${currentPrice}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-4">
                <Button variant="outline" onClick={() => setShowDialog(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handlePayment}
                  className="bg-orange-500 hover:bg-orange-600"
                >
                  Confirm Purchase
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {paymentStatus === 'success' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="p-6 border-green-500/20 bg-green-500/5 backdrop-blur-sm">
              <div className="flex items-start gap-4">
                <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-green-500">Payment Successful</h4>
                  <p className="text-sm text-muted-foreground">
                    Your order is being processed. You can track the progress of your views here.
                  </p>
                </div>
              </div>
            </Card>
          </motion.div>
        )}

        {paymentStatus === 'canceled' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="p-6 border-orange-500/20 bg-orange-500/5 backdrop-blur-sm">
              <div className="flex items-start gap-4">
                <AlertCircle className="h-5 w-5 text-orange-500 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-orange-500">Payment Canceled</h4>
                  <p className="text-sm text-muted-foreground">
                    Your payment was not completed. You can try again when you're ready.
                  </p>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <Card className="p-6 border-orange-500/20 bg-orange-500/5 backdrop-blur-sm">
            <div className="flex items-start gap-4">
              <AlertCircle className="h-5 w-5 text-orange-500 mt-0.5" />
              <div>
                <h4 className="font-semibold text-orange-500">Important Information</h4>
                <ul className="mt-2 space-y-1 text-sm">
                  <li>• Views are delivered gradually to maintain natural growth</li>
                  <li>• Process takes 24-72 hours depending on package size</li>
                  <li>• We guarantee high retention and quality views</li>
                  <li>• 24/7 Support for any questions</li>
                </ul>
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
            <Card className="p-6 backdrop-blur-sm border-orange-500/10">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Process Status</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Generated Views</p>
                    <p className="text-2xl font-bold bg-gradient-to-r from-orange-500 to-orange-500/70 bg-clip-text text-transparent">
                      {apifyData.stats.viewsGenerated.toLocaleString()}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Remaining Views</p>
                    <p className="text-2xl font-bold bg-gradient-to-r from-orange-500 to-orange-500/70 bg-clip-text text-transparent">
                      {apifyData.stats.remainingViews.toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="pt-4">
                  <div className="flex items-center gap-2 text-sm">
                    <TrendingUp className="h-4 w-4 text-orange-500" />
                    <span>Status: {apifyData.status}</span>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
}