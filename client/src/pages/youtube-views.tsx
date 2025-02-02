import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Play, TrendingUp, PackageCheck, AlertCircle, Clock, Home } from "lucide-react";
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

  const { data: apifyData, refetch } = useQuery({
    queryKey: ["apify-run", orderId],
    queryFn: async () => {
      if (!orderId) return null;
      return checkApifyRun(orderId);
    },
    enabled: !!orderId,
    refetchInterval: orderId ? 5000 : false
  });

  const handlePackageSelect = async (packageIndex: number) => {
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

    setSelectedPackage(packageIndex);

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

      const orderData = await createYouTubeViewsOrder(user, {
        videoUrl,
        purchasedViews: viewsPackages[packageIndex].views,
        apifyRunId: '',
      });

      const stripe = await stripePromise;
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
          views: viewsPackages[packageIndex].views,
          price: viewsPackages[packageIndex].price
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error creating payment session');
      }

      const session = await response.json();
      if (!session.id) {
        throw new Error('Stripe session ID was not received');
      }

      setOrderId(`${user.uid}_${Date.now()}`);
      const result = await stripe.redirectToCheckout({
        sessionId: session.id,
      });

      if (result.error) {
        throw new Error(result.error.message);
      }
    } catch (error: any) {
      console.error('Payment process error:', error);
      toast({
        title: "Payment Error",
        description: error.message || "There was an error processing the payment. Please try again.",
        variant: "destructive"
      });
    }
  };
    const chartData = Array.from({ length: 7 }, (_, i) => ({
        day: `Day ${i + 1}`,
        views: Math.floor(Math.random() * 5000) + 1000
      }));

  const progress = 75;
  const currentViews = 7500;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <div className="flex-1 space-y-8 p-8 pt-6 bg-gradient-to-b from-background to-background/80">
        {/* Hero Section with Video Background */}
        <div className="relative w-full h-[70vh] overflow-hidden rounded-xl mb-12">
          <video
            autoPlay
            loop
            muted
            playsInline
            className="absolute inset-0 w-full h-full object-cover"
            src={mainVideo}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 to-black/40" />
          <div className="relative h-full flex items-center justify-start px-8 md:px-12">
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
            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="video-url" className="text-sm font-medium">
                  Video URL
                </label>
                <Input
                  id="video-url"
                  placeholder="https://youtube.com/watch?v=..."
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  className="bg-background/50 border-orange-500/10 focus:border-orange-500"
                />
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
                    onClick={() => {
                      if (!videoUrl) {
                        toast({
                          title: "Error",
                          description: "Please enter a valid YouTube URL",
                          variant: "destructive"
                        });
                        return;
                      }
                      setSelectedPackage(index);
                      setShowDialog(true);
                    }}
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
                  <h4 className="font-medium">Order details:</h4>
                  <ul className="list-disc list-inside space-y-2 text-sm">
                    <li>Video URL: {videoUrl}</li>
                    <li>Price: ${selectedPackage !== null ? viewsPackages[selectedPackage].price : ''}</li>
                    <li>Views: {selectedPackage !== null ? viewsPackages[selectedPackage].views.toLocaleString() : ''}</li>
                  </ul>
                </div>
              </div>
              <div className="flex justify-end gap-4">
                <Button variant="outline" onClick={() => setShowDialog(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={() => {
                    if (selectedPackage !== null) {
                      handlePackageSelect(selectedPackage);
                      setShowDialog(false);
                    }
                  }}
                >
                  Confirm Purchase
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

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