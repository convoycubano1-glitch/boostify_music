import { Header } from "../components/layout/header";
import { logger } from "../lib/logger";
import { Card } from "../components/ui/card";
import { ScrollArea } from "../components/ui/scroll-area";
import { Button } from "../components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Slider } from "../components/ui/slider";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "../components/ui/form";
import {
  DollarSign,
  Download,
  FileText,
  TrendingUp,
  Calendar,
  BarChart2,
  Clock,
  AlertTriangle,
  ChevronRight,
  Users,
  BarChart,
  Target,
  CreditCard,
  Check, 
  Calculator,
  UserPlus,
  Save,
  PenSquare
} from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "../hooks/use-auth";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { db } from "../firebase";
import { doc, setDoc, collection, addDoc, serverTimestamp } from "firebase/firestore";
import { useToast } from "../hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { apiRequest } from "@/lib/queryClient";

// Revenue Simulations Calculator Component
function RevenueSimulationsCalculator() {
  const [activeUsers, setActiveUsers] = useState(5000);
  const [videoConversion, setVideoConversion] = useState(20);
  const [blockchainVolume, setBlockchainVolume] = useState(100000);
  
  // Calculate all revenue streams
  const calculations = {
    subscriptions: {
      basic: (activeUsers * 0.35 * 59.99),
      pro: (activeUsers * 0.40 * 99.99),
      premium: (activeUsers * 0.25 * 149.99),
      total: function() { return this.basic + this.pro + this.premium; }
    },
    musicVideos: (activeUsers * videoConversion / 100) * 199,
    blockchain: {
      dexTrading: (blockchainVolume * 0.05),
      tokenDeployment: (blockchainVolume * 0.03),
      royalties: (blockchainVolume * 0.02),
      total: function() { return this.dexTrading + this.tokenDeployment + this.royalties; }
    },
    merchandise: (activeUsers * 10 * 0.5) * 0.20, // avg 10 artists per 1k users, $500 sales, 20% commission
    licensing: {
      youtube: 50000,
      spotify: 30000,
      total: function() { return this.youtube + this.spotify; }
    },
    onlyFans: 75000,
    token: 50000,
    courses: 30000,
    artistCards: 60000,
    mocapApi: 40000,
  };

  const monthlyTotal = 
    calculations.subscriptions.total() +
    calculations.musicVideos +
    calculations.blockchain.total() +
    calculations.merchandise +
    calculations.licensing.total() +
    calculations.onlyFans +
    calculations.token +
    calculations.courses +
    calculations.artistCards +
    calculations.mocapApi;

  const annualTotal = monthlyTotal * 12;

  return (
    <Card className="p-6 bg-black/30 border-orange-500/20 mb-8">
      <h5 className="font-bold text-white text-lg mb-6">Revenue Simulations Calculator - Adjust Parameters</h5>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Active Users Slider */}
        <div className="p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
          <div className="flex justify-between mb-3">
            <label className="text-sm font-medium text-white">Active Users</label>
            <span className="text-lg font-bold text-blue-400">{activeUsers.toLocaleString()}</span>
          </div>
          <Slider
            value={[activeUsers]}
            min={1000}
            max={50000}
            step={500}
            onValueChange={(value) => setActiveUsers(value[0])}
            className="w-full"
          />
          <p className="text-xs text-white/60 mt-2">Range: 1k - 50k users</p>
        </div>

        {/* Video Conversion Rate */}
        <div className="p-4 bg-purple-500/10 rounded-lg border border-purple-500/20">
          <div className="flex justify-between mb-3">
            <label className="text-sm font-medium text-white">Video Users %</label>
            <span className="text-lg font-bold text-purple-400">{videoConversion}%</span>
          </div>
          <Slider
            value={[videoConversion]}
            min={5}
            max={50}
            step={1}
            onValueChange={(value) => setVideoConversion(value[0])}
            className="w-full"
          />
          <p className="text-xs text-white/60 mt-2">% generating videos</p>
        </div>

        {/* Blockchain Volume */}
        <div className="p-4 bg-green-500/10 rounded-lg border border-green-500/20">
          <div className="flex justify-between mb-3">
            <label className="text-sm font-medium text-white">Blockchain Volume</label>
            <span className="text-lg font-bold text-green-400">${(blockchainVolume/1000000).toFixed(2)}M</span>
          </div>
          <Slider
            value={[blockchainVolume]}
            min={50000}
            max={10000000}
            step={500000}
            onValueChange={(value) => setBlockchainVolume(value[0])}
            className="w-full"
          />
          <p className="text-xs text-white/60 mt-2">Monthly trading volume</p>
        </div>
      </div>

      {/* Revenue Breakdown Table */}
      <div className="bg-black/50 rounded-lg p-6 mb-6 overflow-x-auto">
        <h6 className="text-white font-bold mb-4">Monthly Revenue by Stream</h6>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10">
              <th className="text-left text-white/70 pb-3 font-medium">Revenue Stream</th>
              <th className="text-right text-white/70 pb-3 font-medium">Amount</th>
              <th className="text-right text-white/70 pb-3 font-medium">% of Total</th>
            </tr>
          </thead>
          <tbody className="space-y-2">
            <tr className="border-b border-white/10">
              <td className="text-white py-2">1. Subscriptions</td>
              <td className="text-right text-green-400 font-semibold">${calculations.subscriptions.total().toLocaleString('en-US', {maximumFractionDigits: 0})}/mo</td>
              <td className="text-right text-white/60">{((calculations.subscriptions.total() / monthlyTotal) * 100).toFixed(1)}%</td>
            </tr>
            <tr className="border-b border-white/10">
              <td className="text-white py-2">2. Music Video Generator ($199/video)</td>
              <td className="text-right text-purple-400 font-semibold">${calculations.musicVideos.toLocaleString('en-US', {maximumFractionDigits: 0})}/mo</td>
              <td className="text-right text-white/60">{((calculations.musicVideos / monthlyTotal) * 100).toFixed(1)}%</td>
            </tr>
            <tr className="border-b border-white/10">
              <td className="text-white py-2">3. Blockchain & Tokenization (5% fees)</td>
              <td className="text-right text-cyan-400 font-semibold">${calculations.blockchain.total().toLocaleString('en-US', {maximumFractionDigits: 0})}/mo</td>
              <td className="text-right text-white/60">{((calculations.blockchain.total() / monthlyTotal) * 100).toFixed(1)}%</td>
            </tr>
            <tr className="border-b border-white/10">
              <td className="text-white py-2">4. Artist Merchandise (20% commission)</td>
              <td className="text-right text-amber-400 font-semibold">${calculations.merchandise.toLocaleString('en-US', {maximumFractionDigits: 0})}/mo</td>
              <td className="text-right text-white/60">{((calculations.merchandise / monthlyTotal) * 100).toFixed(1)}%</td>
            </tr>
            <tr className="border-b border-white/10">
              <td className="text-white py-2">5. Music Licensing & Streaming</td>
              <td className="text-right text-indigo-400 font-semibold">${calculations.licensing.total().toLocaleString('en-US', {maximumFractionDigits: 0})}/mo</td>
              <td className="text-right text-white/60">{((calculations.licensing.total() / monthlyTotal) * 100).toFixed(1)}%</td>
            </tr>
            <tr className="border-b border-white/10">
              <td className="text-white py-2">6. OnlyFans & Exclusive Content</td>
              <td className="text-right text-pink-400 font-semibold">${calculations.onlyFans.toLocaleString('en-US', {maximumFractionDigits: 0})}/mo</td>
              <td className="text-right text-white/60">{((calculations.onlyFans / monthlyTotal) * 100).toFixed(1)}%</td>
            </tr>
            <tr className="border-b border-white/10">
              <td className="text-white py-2">7. Boostify Token ($BOOST)</td>
              <td className="text-right text-blue-400 font-semibold">${calculations.token.toLocaleString('en-US', {maximumFractionDigits: 0})}/mo</td>
              <td className="text-right text-white/60">{((calculations.token / monthlyTotal) * 100).toFixed(1)}%</td>
            </tr>
            <tr className="border-b border-white/10">
              <td className="text-white py-2">8. Courses & Professional Services</td>
              <td className="text-right text-red-400 font-semibold">${calculations.courses.toLocaleString('en-US', {maximumFractionDigits: 0})}/mo</td>
              <td className="text-right text-white/60">{((calculations.courses / monthlyTotal) * 100).toFixed(1)}%</td>
            </tr>
            <tr className="border-b border-white/10">
              <td className="text-white py-2">9. Artist Card Marketplace</td>
              <td className="text-right text-yellow-400 font-semibold">${calculations.artistCards.toLocaleString('en-US', {maximumFractionDigits: 0})}/mo</td>
              <td className="text-right text-white/60">{((calculations.artistCards / monthlyTotal) * 100).toFixed(1)}%</td>
            </tr>
            <tr className="border-b border-white/10">
              <td className="text-white py-2">10. Motion Capture & API Services</td>
              <td className="text-right text-violet-400 font-semibold">${calculations.mocapApi.toLocaleString('en-US', {maximumFractionDigits: 0})}/mo</td>
              <td className="text-right text-white/60">{((calculations.mocapApi / monthlyTotal) * 100).toFixed(1)}%</td>
            </tr>
            <tr className="bg-orange-500/20">
              <td className="text-white font-bold py-3">TOTAL MONTHLY REVENUE</td>
              <td className="text-right text-orange-400 font-bold text-lg py-3">${monthlyTotal.toLocaleString('en-US', {maximumFractionDigits: 0})}</td>
              <td className="text-right text-white/60 py-3">100%</td>
            </tr>
            <tr>
              <td className="text-white font-bold py-3">ANNUAL REVENUE</td>
              <td className="text-right text-green-400 font-bold text-lg py-3">${annualTotal.toLocaleString('en-US', {maximumFractionDigits: 0})}</td>
              <td className="text-right text-white/60 py-3">-</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Key Metrics Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-3 bg-orange-500/10 rounded-lg border border-orange-500/20">
          <p className="text-white/70 text-xs mb-1">Monthly Revenue</p>
          <p className="text-2xl font-bold text-orange-400">${(monthlyTotal/1000).toFixed(1)}k</p>
        </div>
        <div className="p-3 bg-green-500/10 rounded-lg border border-green-500/20">
          <p className="text-white/70 text-xs mb-1">Annual Revenue</p>
          <p className="text-2xl font-bold text-green-400">${(annualTotal/1000000).toFixed(2)}M</p>
        </div>
        <div className="p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
          <p className="text-white/70 text-xs mb-1">Top Revenue Stream</p>
          <p className="text-lg font-bold text-blue-400">Subscriptions</p>
          <p className="text-xs text-white/60">{((calculations.subscriptions.total() / monthlyTotal) * 100).toFixed(0)}% of revenue</p>
        </div>
        <div className="p-3 bg-purple-500/10 rounded-lg border border-purple-500/20">
          <p className="text-white/70 text-xs mb-1">Revenue per User</p>
          <p className="text-2xl font-bold text-purple-400">${(monthlyTotal / activeUsers).toFixed(2)}</p>
          <p className="text-xs text-white/60">per user/month</p>
        </div>
      </div>
    </Card>
  );
}

// Investment Calculator Component
function InvestmentCalculator() {
  const [investmentAmount, setInvestmentAmount] = useState(5000);
  const [returnRate, setReturnRate] = useState(5); // Default to 5%
  const [durationMonths, setDurationMonths] = useState(12);
  const [monthlyReturn, setMonthlyReturn] = useState(0);
  const [totalReturn, setTotalReturn] = useState(0);
  const [finalAmount, setFinalAmount] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  // Recalculate returns whenever inputs change
  useEffect(() => {
    // Calculate return rate based on amount
    let adjustedReturnRate = 0.04; // 4% default
    if (investmentAmount >= 10000) adjustedReturnRate = 0.06; // 6%
    else if (investmentAmount >= 5000) adjustedReturnRate = 0.05; // 5%
    
    setReturnRate(adjustedReturnRate * 100);
    
    const calculatedMonthlyReturn = investmentAmount * adjustedReturnRate;
    const calculatedTotalReturn = calculatedMonthlyReturn * durationMonths;
    const calculatedFinalAmount = investmentAmount + calculatedTotalReturn;

    setMonthlyReturn(calculatedMonthlyReturn);
    setTotalReturn(calculatedTotalReturn);
    setFinalAmount(calculatedFinalAmount);
  }, [investmentAmount, durationMonths]);

  // Handle investment with Stripe
  const handleInvestWithStripe = async () => {
    try {
      setIsProcessing(true);
      
      if (investmentAmount < 2000) {
        toast({
          title: "Invalid Amount",
          description: "Minimum investment is $2,000 USD",
          variant: "destructive",
        });
        setIsProcessing(false);
        return;
      }

      // Call API to create Stripe checkout session
      const response = await apiRequest({
        url: '/api/investors/investment/create-checkout',
        method: 'POST',
        data: {
          amount: investmentAmount,
          planType: investmentAmount >= 10000 ? 'premium' : investmentAmount >= 5000 ? 'standard' : 'basic',
          duration: durationMonths
        }
      });

      if (response.success && response.url) {
        // Redirect to Stripe checkout
        window.location.href = response.url;
      }

    } catch (error: any) {
      logger.error("Error creating checkout session:", error);
      
      const errorMessage = error.response?.data?.message || "Error processing payment. Please try again.";
      
      toast({
        title: "Payment Error",
        description: errorMessage,
        variant: "destructive",
      });
      
      setIsProcessing(false);
    }
  };

  return (
    <div className="grid md:grid-cols-2 gap-8">
      <div>
        <Card className="p-6 mb-6">
          <h4 className="text-base font-medium mb-6">Adjust Parameters</h4>
          
          <div className="space-y-8">
            <div>
              <div className="flex justify-between mb-2">
                <label className="text-sm font-medium">Investment Amount</label>
                <span className="text-sm font-medium">${investmentAmount.toLocaleString()}</span>
              </div>
              <div className="flex items-center gap-4">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <Slider
                  value={[investmentAmount]}
                  min={2000}
                  max={100000}
                  step={1000}
                  onValueChange={(value) => setInvestmentAmount(value[0])}
                  className="flex-1"
                />
              </div>
            </div>
            
            <div>
              <div className="flex justify-between mb-2">
                <label className="text-sm font-medium">Return Rate</label>
                <span className="text-sm font-medium">{returnRate}% monthly</span>
              </div>
              <div className="flex items-center gap-4">
                <BarChart2 className="h-4 w-4 text-muted-foreground" />
                <Slider
                  value={[returnRate]}
                  min={4}
                  max={6}
                  step={0.1}
                  onValueChange={(value) => setReturnRate(value[0])}
                  className="flex-1"
                />
              </div>
            </div>
            
            <div>
              <div className="flex justify-between mb-2">
                <label className="text-sm font-medium">Duration</label>
                <span className="text-sm font-medium">{durationMonths} months</span>
              </div>
              <div className="flex items-center gap-4">
                <Calculator className="h-4 w-4 text-muted-foreground" />
                <Slider
                  value={[durationMonths]}
                  min={6}
                  max={36}
                  step={1}
                  onValueChange={(value) => setDurationMonths(value[0])}
                  className="flex-1"
                />
              </div>
            </div>

            <Button className="w-full" variant="outline">
              <Calculator className="mr-2 h-4 w-4" />
              Recalculate
            </Button>
          </div>
        </Card>

        <div className="text-sm text-muted-foreground">
          <p>
            This calculator provides an estimate based on our current investment plans. Actual returns may vary.
          </p>
        </div>
      </div>

      <div>
        <Card className="p-6 overflow-hidden bg-gradient-to-br from-orange-500/10 to-background border-orange-500/20">
          <h4 className="text-lg font-medium mb-8">Investment Results</h4>
          
          <div className="space-y-6">
            <div className="flex justify-between items-center p-4 bg-background rounded-lg border">
              <div>
                <p className="text-sm text-muted-foreground">Monthly Return</p>
                <p className="text-2xl font-bold">${monthlyReturn.toFixed(2)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-orange-500 opacity-50" />
            </div>
            
            <div className="flex justify-between items-center p-4 bg-background rounded-lg border">
              <div>
                <p className="text-sm text-muted-foreground">Total Return</p>
                <p className="text-2xl font-bold">${totalReturn.toFixed(2)}</p>
              </div>
              <BarChart2 className="h-8 w-8 text-orange-500 opacity-50" />
            </div>
            
            <div className="flex justify-between items-center p-4 bg-orange-500/10 rounded-lg border border-orange-500/30">
              <div>
                <p className="text-sm text-muted-foreground">Monto Final</p>
                <p className="text-3xl font-bold">${finalAmount.toFixed(2)}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">ROI</p>
                <p className="text-xl font-bold text-orange-500">{((totalReturn / investmentAmount) * 100).toFixed(2)}%</p>
              </div>
            </div>

            <Button 
              className="w-full bg-orange-500 hover:bg-orange-600 mt-4"
              onClick={handleInvestWithStripe}
              disabled={isProcessing || investmentAmount < 2000}
              data-testid="button-invest-stripe"
            >
              {isProcessing ? (
                <>
                  <Clock className="mr-2 h-4 w-4 animate-spin" />
                  Procesando...
                </>
              ) : (
                <>
                  <CreditCard className="mr-2 h-4 w-4" />
                  Pagar con Stripe
                </>
              )}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}

// Componente Timeline Roadmap
function RoadmapTimeline() {
  const [expandedItems, setExpandedItems] = useState<number[]>([]);
  
  const toggleExpand = (index: number) => {
    setExpandedItems(prev => 
      prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
    );
  };

  const roadmapData = [
    {
      date: "January 2024",
      title: "Boostify Project Launch",
      description: "Development of technological foundation: platform architecture, initial Firebase integration, and business model design.",
      stats: "Foundation established",
      status: "completed",
      isKey: true
    },
    {
      date: "March 2024",
      title: "AI Music Video Generation Prototype",
      description: "Initial implementation of AI-powered music video generation. First tests with Gemini 2.5 Flash (Nano Banana).",
      stats: "10 test videos generated",
      status: "completed"
    },
    {
      date: "June 2024",
      title: "Director System & JSON Profiles",
      description: "Development of 10 cinematographic directors with unique styles, each with detailed JSON profiles for video customization.",
      stats: "10 directors configured",
      status: "completed"
    },
    {
      date: "August 2024",
      title: "Lip-Sync Integration with Fal.ai MuseTalk",
      description: "Implementation of automatic lip-sync for music videos, significantly improving final product quality.",
      stats: "Perfect lip-sync synchronization",
      status: "completed"
    },
    {
      date: "October 2024",
      title: "Firebase Storage & Media Management",
      description: "Complete cloud storage system for AI-generated videos, images, and assets.",
      stats: "Scalable infrastructure ready",
      status: "completed"
    },
    {
      date: "December 2024",
      title: "Distribution Tools & Manager Suite",
      description: "Launch of music distribution tools and comprehensive manager suite with automatic generation of 11 professional document types.",
      stats: "Closed beta with 50 users",
      status: "completed",
      isKey: true
    },
    {
      date: "February 2025",
      title: "Artist Social Network",
      description: "Internal social platform connecting artists, producers, and managers. Posts, comments, and collaboration system.",
      stats: "200 active beta users",
      status: "completed"
    },
    {
      date: "April 2025",
      title: "Stripe Integration",
      description: "Complete payment and subscription system. Basic ($59.99), Pro ($99.99), and Premium ($149.99) monthly plans.",
      stats: "Payment system operational",
      status: "completed"
    },
    {
      date: "June 2025",
      title: "Investors Dashboard",
      description: "Investor portal with financial simulations, roadmap, and registration system. Seed Round launch.",
      stats: "Seed Round open",
      status: "completed",
      isKey: true
    },
    {
      date: "August 2025",
      title: "Cinematic Cover Art Generation",
      description: "AI system for generating album covers with cinematic quality using renowned director styles.",
      stats: "1,000+ covers generated",
      status: "in-progress"
    },
    {
      date: "October 2025",
      title: "Infrastructure Optimization",
      description: "Preparation of infrastructure for massive growth. Database optimization, distributed caching, and global CDN.",
      stats: "Scalable infrastructure ready",
      status: "upcoming"
    },
    {
      date: "December 2025",
      title: "Spotify & Apple Music Integration",
      description: "Direct connection with major streaming platforms for automatic profile sync, analytics, and distribution.",
      stats: "APIs fully integrated",
      status: "upcoming"
    },
    {
      date: "January 2026",
      title: "Auto Music Video Generator + 1,000 Users Milestone",
      description: "Complete implementation of automatic music video generator. Fully operational system integrated with artist platform. First growth milestone achieved.",
      stats: "100% functional videos, 1,000 users, $100K MRR",
      status: "upcoming",
      isKey: true
    },
    {
      date: "February 2026",
      title: "Boostify Records Launch",
      description: "Creation of Boostify Records: world's first AI-powered record label identifying, signing, and developing artists with predictive AI analysis.",
      stats: "World's first 100% AI label",
      status: "upcoming",
      isKey: true
    },
    {
      date: "March 2026",
      title: "Collaboration Marketplace",
      description: "Platform connecting artists with producers, engineers, videographers, and other creative professionals.",
      stats: "500+ active collaborations",
      status: "upcoming"
    },
    {
      date: "May 2026",
      title: "Angel Round - $1.2M",
      description: "Second investment round for AI functionality expansion and user base growth.",
      stats: "Investment to scale AI",
      status: "upcoming",
      isKey: true
    },
    {
      date: "June 2026",
      title: "AI Record Label - Predictive System",
      description: "Implementation of machine learning algorithms to identify artists with viral potential. Streaming data, engagement, and trend analysis.",
      stats: "AI identifies hits with 85% accuracy",
      status: "upcoming"
    },
    {
      date: "July 2026",
      title: "Milestone: 5,000 Active Users",
      description: "Significant user base expansion. Target of $550K monthly recurring revenue.",
      stats: "5,000 users, $550K MRR",
      status: "upcoming",
      isKey: true
    },
    {
      date: "August 2026",
      title: "Boostify Blockchain - Music Tokenization",
      description: "Launch of proprietary blockchain for tokenizing music rights, creating song NFTs, and automatic smart contract royalties.",
      stats: "First music blockchain",
      status: "upcoming",
      isKey: true
    },
    {
      date: "September 2026",
      title: "TikTok & YouTube Integration",
      description: "Automatic distribution of music videos to social networks. Promotion tools and engagement analytics.",
      stats: "Complete multi-platform",
      status: "upcoming"
    },
    {
      date: "October 2026",
      title: "Series A - $3.5M",
      description: "Third investment round focused on market expansion and enterprise features for record labels.",
      stats: "International expansion",
      status: "upcoming",
      isKey: true
    },
    {
      date: "December 2026",
      title: "Milestone: 10,000 Active Users",
      description: "Strategic milestone achieved. Consolidation as leading AI-powered music platform. Projected $1.2M monthly revenue.",
      stats: "10,000 users, $1.2M MRR",
      status: "upcoming",
      isKey: true
    },
    {
      date: "January 2027",
      title: "Series B - $8M",
      description: "Fourth investment round for global scaling, advanced AI features development, and strategic partnerships.",
      stats: "Global scale and advanced AI",
      status: "upcoming",
      isKey: true
    },
    {
      date: "March 2027",
      title: "Boostify Records - First Signed Artists",
      description: "Signing of first 10 AI-identified artists. Production, marketing, and distribution completely algorithm-managed.",
      stats: "10 artists under AI management",
      status: "upcoming"
    },
    {
      date: "June 2027",
      title: "Live Blockchain Royalties",
      description: "Real-time royalty payment system using Boostify Blockchain. Complete transparency and automatic distribution to all stakeholders.",
      stats: "Instant 24/7 payments",
      status: "upcoming",
      isKey: true
    }
  ];

  return (
    <div className="space-y-6">
      {/* Projected Growth Chart */}
      <div className="bg-gradient-to-r from-orange-500/10 to-transparent p-6 rounded-lg mb-8">
        <h4 className="text-lg font-semibold mb-4">Projected User Growth</h4>
        <div className="h-64 relative">
          {/* Y-Axis */}
          <div className="absolute left-0 top-0 bottom-0 w-12 flex flex-col justify-between items-end pr-2">
            <span className="text-xs text-muted-foreground">50K</span>
            <span className="text-xs text-muted-foreground">37.5K</span>
            <span className="text-xs text-muted-foreground">25K</span>
            <span className="text-xs text-muted-foreground">12.5K</span>
            <span className="text-xs text-muted-foreground">0</span>
          </div>
          
          {/* Chart */}
          <div className="ml-12 h-full flex items-end">
            <div className="flex-1 flex items-end space-x-4">
              {[
                { month: "Jan '26", users: 15000, height: "50px" },
                { month: "Feb '26", users: 20000, height: "80px" },
                { month: "Mar '26", users: 25000, height: "110px" },
                { month: "Apr '26", users: 35000, height: "160px" },
                { month: "May '26", users: 50000, height: "220px" },
                { month: "Jun '26", users: 65000, height: "280px" },
                { month: "Jul '26", users: 80000, height: "330px" },
                { month: "Aug '26", users: 100000, height: "360px" }
              ].map((item, index) => (
                <div key={index} className="flex flex-col items-center flex-1">
                  <div 
                    className="w-full max-w-[50px] bg-gradient-to-t from-orange-500 to-orange-400 rounded-t relative group cursor-pointer transition-all hover:from-orange-600 hover:to-orange-500"
                    style={{ height: item.height }}
                  >
                    <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-black/80 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      {item.users.toLocaleString()} users
                    </div>
                  </div>
                  <span className="text-xs mt-2 text-muted-foreground">{item.month}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      {/* Timeline */}
      <div className="relative mt-8">
        <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-orange-500/20"></div>
        <div className="space-y-8">
          {roadmapData.map((item, index) => (
            <div key={index} className="relative pl-16">
              <div className={`absolute left-5 top-1 w-7 h-7 rounded-full flex items-center justify-center border-2 cursor-pointer hover:scale-110 transition-transform ${
                item.status === 'completed' ? 'bg-orange-500 border-orange-500' : 
                item.status === 'in-progress' ? 'bg-background border-orange-500' : 
                item.isKey ? 'bg-background border-yellow-500' : 'bg-background border-muted-foreground'
              }`} onClick={() => toggleExpand(index)}>
                {item.status === 'completed' ? (
                  <Check className="h-3.5 w-3.5 text-white" />
                ) : item.status === 'in-progress' ? (
                  <Clock className="h-3.5 w-3.5 text-orange-500" />
                ) : item.isKey ? (
                  <Calendar className="h-3.5 w-3.5 text-yellow-500" />
                ) : (
                  <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                )}
              </div>

              <div className={`pb-4 cursor-pointer transition-all ${item.isKey ? 'bg-orange-500/5 p-4 rounded-lg border border-orange-500/20' : ''}`} onClick={() => toggleExpand(index)}>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <span className={`text-sm font-medium ${item.isKey ? 'text-orange-500' : 'text-muted-foreground'} px-2 py-1 ${item.isKey ? 'bg-orange-500/10' : 'bg-muted/50'} rounded mb-2 inline-block`}>
                      {item.date}
                    </span>
                    <h4 className={`text-base font-medium mt-2 mb-1 ${item.isKey ? 'text-orange-500' : ''}`}>{item.title}</h4>
                  </div>
                  <span className={`ml-2 text-lg transform transition-transform ${expandedItems.includes(index) ? 'rotate-180' : ''}`}>
                    ▼
                  </span>
                </div>
                
                {expandedItems.includes(index) && (
                  <div className="mt-3 pt-3 border-t border-white/10 animate-in fade-in">
                    <p className="text-sm text-muted-foreground mb-2">{item.description}</p>
                    {item.stats && (
                      <div className="mt-2 text-xs inline-block px-2 py-1 bg-black/20 rounded font-medium">
                        {item.stats}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Componente Gráfico de Rendimiento de Inversión
function InvestmentPerformanceChart({ data }: { data: { month: string; return: number }[] }) {
  return (
    <div className="w-full h-64 flex flex-col justify-center">
      <div className="flex justify-between items-center h-full">
        {data.map((item, index) => (
          <div key={index} className="flex flex-col items-center justify-end h-full flex-1">
            <div 
              className="w-8 bg-orange-500 rounded-t-sm relative group"
              style={{ height: `${(item.return / 6) * 100}%` }}
            >
              <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-background border border-border px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                {item.return}% en {item.month}
              </div>
            </div>
            <span className="text-xs text-muted-foreground mt-2">{item.month}</span>
          </div>
        ))}
      </div>
      <div className="mt-4 text-center text-sm text-muted-foreground">
        Rendimiento mensual en porcentaje (%)
      </div>
    </div>
  );
}

// Componente Tabla de Riesgo/Retorno
function RiskReturnTable() {
  const riskReturnData = [
    { riskLevel: "Bajo", returnRange: "4.0 - 4.5%", volatility: "Baja", recommendation: "Conservadores" },
    { riskLevel: "Medio", returnRange: "4.5 - 5.5%", volatility: "Media", recommendation: "Balanceados" },
    { riskLevel: "Alto", returnRange: "5.5 - 6.0%", volatility: "Alta", recommendation: "Crecimiento" }
  ];

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b">
            <th className="text-left py-2 px-3">Nivel de Riesgo</th>
            <th className="text-left py-2 px-3">Retorno Mensual</th>
            <th className="text-left py-2 px-3">Volatilidad</th>
            <th className="text-left py-2 px-3">Recomendado para</th>
          </tr>
        </thead>
        <tbody>
          {riskReturnData.map((item, index) => (
            <tr key={index} className="border-b hover:bg-muted/50">
              <td className="py-3 px-3">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${
                    item.riskLevel === "Bajo" ? "bg-blue-500" :
                    item.riskLevel === "Medio" ? "bg-orange-500" : "bg-red-500"
                  }`}></div>
                  {item.riskLevel}
                </div>
              </td>
              <td className="py-3 px-3">{item.returnRange}</td>
              <td className="py-3 px-3">{item.volatility}</td>
              <td className="py-3 px-3">Inversores {item.recommendation}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Investor Registration Form Component
function InvestorRegistrationForm() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Define form validation schema
  const formSchema = z.object({
    fullName: z.string().min(2, { message: "Full name must be at least 2 characters." }),
    email: z.string().email({ message: "Please enter a valid email address." }),
    phone: z.string().min(10, { message: "Please enter a valid phone number." }),
    country: z.string().min(2, { message: "Please select your country." }),
    investmentAmount: z.string().min(1, { message: "Please enter your investment amount." }),
    investmentGoals: z.string().min(10, { message: "Please describe your investment goals." }),
    riskTolerance: z.enum(["low", "medium", "high"], {
      required_error: "Please select your risk tolerance.",
    }),
    investorType: z.enum(["individual", "corporate", "institutional"], {
      required_error: "Please select your investor type.",
    }),
    termsAccepted: z.boolean().refine((val) => val === true, {
      message: "You must accept the terms and conditions.",
    }),
  });

  // Create form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: "",
      email: user?.email || "",
      phone: "",
      country: "",
      investmentAmount: "",
      investmentGoals: "",
      riskTolerance: "medium",
      investorType: "individual",
      termsAccepted: false,
    },
  });

  // Handle form submission using Firestore directly
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setIsSubmitting(true);
      
      if (!user) {
        toast({
          title: "Authentication Required",
          description: "You must be logged in to register as an investor.",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }
      
      const investorData = {
        fullName: values.fullName,
        email: values.email,
        phone: values.phone,
        country: values.country,
        investmentAmount: parseFloat(values.investmentAmount),
        investmentGoals: values.investmentGoals,
        riskTolerance: values.riskTolerance,
        investorType: values.investorType,
        termsAccepted: values.termsAccepted,
        userId: user.uid,
        status: "pending",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      // Save to Firestore
      const docRef = await addDoc(collection(db, 'investors'), investorData);
      
      logger.info("Investor registered with ID:", docRef.id);
      
      // Send webhook notification to Make.com
      try {
        await axios.post('https://hook.us2.make.com/hfnbfse1q9gtm71xeamn5p5tj48fyv8x', {
          investorId: docRef.id,
          userId: user.uid,
          fullName: values.fullName,
          email: values.email,
          phone: values.phone,
          country: values.country,
          investmentAmount: parseFloat(values.investmentAmount),
          investmentGoals: values.investmentGoals,
          riskTolerance: values.riskTolerance,
          investorType: values.investorType,
          termsAccepted: values.termsAccepted,
          status: "pending",
          registrationDate: new Date().toISOString()
        });
        logger.info("Webhook sent to Make.com successfully");
      } catch (webhookError) {
        logger.error("Failed to send webhook to Make.com:", webhookError);
        // Continue even if webhook fails
      }
      
      toast({
        title: "Registration Successful",
        description: "Your investor registration has been submitted successfully.",
      });
      
      // Reset form
      form.reset();
      
      // Refresh investor data
      window.location.reload();
      
    } catch (error: any) {
      logger.error("Error submitting investor registration:", error);
      
      const errorMessage = error.message || "There was an unexpected error. Please try again.";
      
      toast({
        title: "Registration Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="p-6">
      <div className="flex items-center gap-4 mb-6">
        <div className="p-3 bg-orange-500/10 rounded-full">
          <UserPlus className="h-6 w-6 text-orange-500" />
        </div>
        <div>
          <h3 className="text-xl font-semibold">Investor Registration</h3>
          <p className="text-sm text-muted-foreground">
            Register to become an investor in Boostify Music
          </p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <FormField
              control={form.control}
              name="fullName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input placeholder="John Doe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="john@example.com" type="email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number</FormLabel>
                  <FormControl>
                    <Input placeholder="+1 (123) 456-7890" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="country"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Country</FormLabel>
                  <FormControl>
                    <Input placeholder="United States" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="investmentAmount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Investment Amount (USD)</FormLabel>
                  <FormControl>
                    <Input placeholder="5000" type="number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="investorType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Investor Type</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select investor type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="individual">Individual</SelectItem>
                      <SelectItem value="corporate">Corporate</SelectItem>
                      <SelectItem value="institutional">Institutional</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="riskTolerance"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Risk Tolerance</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select risk tolerance" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="md:col-span-2">
              <FormField
                control={form.control}
                name="investmentGoals"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Investment Goals</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Describe your investment goals and expectations..." 
                        className="min-h-[120px]" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="md:col-span-2">
              <FormField
                control={form.control}
                name="termsAccepted"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md p-4 bg-muted/50">
                    <FormControl>
                      <input
                        type="checkbox"
                        className="h-4 w-4 mt-1"
                        checked={field.value}
                        onChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>
                        I accept the terms and conditions of investment
                      </FormLabel>
                      <p className="text-sm text-muted-foreground">
                        By checking this box, you agree to our investment terms, privacy policy, and acknowledge the risks involved.
                      </p>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          <Button 
            type="submit" 
            className="w-full md:w-auto bg-orange-500 hover:bg-orange-600"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <span className="mr-2">Submitting</span>
                <Clock className="h-4 w-4 animate-spin" />
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Register as Investor
              </>
            )}
          </Button>
        </form>
      </Form>
    </Card>
  );
}

// Componente Estadísticas del Inversor 
function InvestorStats({ investorData, globalStats }: { investorData?: any; globalStats?: any }) {
  const stats = [
    { 
      title: "TOTAL INVESTMENTS", 
      value: `$${(investorData?.stats?.totalInvested || 1200000).toLocaleString()}`, 
      growth: "+12.0%", 
      icon: DollarSign,
      color: "text-cyan-400",
      bgColor: "bg-cyan-500/10" 
    },
    { 
      title: "CURRENT RETURN", 
      value: `+${(investorData?.stats?.currentReturn || 18.5).toFixed(1)}%`, 
      growth: "+2.5%", 
      icon: TrendingUp,
      color: "text-green-400",
      bgColor: "bg-green-500/10" 
    },
    { 
      title: "PROJECTED YIELD", 
      value: `${(investorData?.stats?.projectedYield || 24.0).toFixed(1)}%`, 
      growth: "+4.5%", 
      icon: Target,
      color: "text-yellow-400",
      bgColor: "bg-yellow-500/10" 
    },
    { 
      title: "PLATFORM CAPITAL", 
      value: `$${((globalStats?.data?.totalCapital || 8500000) / 1000000).toFixed(1)}M`, 
      growth: "+8.3%", 
      icon: BarChart,
      color: "text-purple-400",
      bgColor: "bg-purple-500/10" 
    }
  ];

  return (
    <>
      {stats.map((stat, index) => (
        <Card 
          key={index} 
          className="relative p-6 bg-gradient-to-br from-slate-900/90 to-slate-900/50 border border-cyan-500/20 hover:border-cyan-500/50 transition-all duration-300 overflow-hidden group"
        >
          {/* Glow effect on hover */}
          <div className={`absolute inset-0 ${stat.bgColor} opacity-0 group-hover:opacity-10 transition-opacity duration-300`}></div>
          
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 ${stat.bgColor} rounded-xl shadow-lg`}>
                <stat.icon className={`h-6 w-6 ${stat.color}`} />
              </div>
              <span className="text-sm font-semibold text-green-400">{stat.growth}</span>
            </div>
            <div>
              <p className="text-sm text-slate-400 mb-2">{stat.title}</p>
              <p className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-cyan-300 to-cyan-100 bg-clip-text text-transparent">{stat.value}</p>
            </div>
          </div>
        </Card>
      ))}
    </>
  );
}

export default function InvestorsDashboard() {
  const [selectedTab, setSelectedTab] = useState("overview");
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Query investor data from API
  const { data: investorData, isLoading: isLoadingInvestor } = useQuery<any>({
    queryKey: ['/api/investors/me'],
    enabled: !!user,
  });

  // Query global stats from API
  const { data: globalStats } = useQuery<any>({
    queryKey: ['/api/investors/stats'],
  });

  // Extract investment data
  const investmentData = {
    totalInvested: 0,
    currentValue: 0,
    monthlyReturns: [
      { month: 'Jan', return: 4.5 },
      { month: 'Feb', return: 5.2 },
      { month: 'Mar', return: 4.8 },
      { month: 'Apr', return: 5.6 },
      { month: 'May', return: 5.1 },
      { month: 'Jun', return: 5.9 }
    ],
    nextPaymentDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    investmentRounds: [
      { 
        name: 'Seed Round', 
        date: 'December 15, 2025', 
        status: 'Active', 
        target: '$250K',
        equity: '10%',
        raisedStatus: 'Active Round',
        goal: '1,000 Active Users',
        description: 'Seed round funding to accelerate platform development, expand core features, and establish strong market presence. Focus on achieving 1,000 active users and $100K MRR.'
      },
      { 
        name: 'Series A', 
        date: 'June 5, 2026', 
        status: 'Upcoming', 
        target: '$750K',
        equity: '5%',
        raisedStatus: 'Upcoming Round',
        goal: '10,000 Active Users',
        description: 'Series A funding to scale AI-powered video generation, expand AI capabilities, enhance creator tools, and accelerate global user acquisition across music production community.'
      },
      { 
        name: 'Series B', 
        date: 'November 15, 2026', 
        status: 'Upcoming', 
        target: '$2M',
        equity: '5%',
        raisedStatus: 'Strategic Round',
        goal: '50,000 Active Users',
        description: 'Series B to drive global expansion, launch Boostify Records AI label, scale blockchain for automated royalties, establish enterprise partnerships, and solidify market leadership.'
      }
    ]
  };

  const isRegistered = investorData?.data?.registered || false;

  // Handle investment button click - Directs the user to the registration form
  const handleInvestNow = () => {
    logger.info("Directing to investment registration form");
    // Switch to the register tab
    setSelectedTab("register");
    // Scroll to the form
    setTimeout(() => {
      const registrationForm = document.getElementById("investor-registration-form");
      if (registrationForm) {
        registrationForm.scrollIntoView({ behavior: "smooth" });
      }
    }, 100);
  };

  // Handle contract download - Opens the investment contract
  const handleDownloadContract = () => {
    logger.info("Opening investment contract...");
    // Show toast about demo contract
    toast({
      title: "Demo Contract",
      description: "This is a preview of the investment contract. The official contract will be sent to you by email after your application is approved.",
      variant: "default",
    });
    // Open the contract in a new tab
    window.open("/investment-contract.html", "_blank");
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 pb-14 sm:pb-0">
      <Header />
      <main className="flex-1 pt-14 sm:pt-16">
        <ScrollArea className="flex-1 h-[calc(100vh-5rem)]">
          <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-6">
            {/* Hero Section - Modern Design */}
            <section className="relative rounded-2xl overflow-hidden mb-8 sm:mb-12 bg-gradient-to-br from-cyan-500/10 via-slate-900 to-slate-950 p-6 sm:p-10 border border-cyan-500/20">
              {/* Glowing effect */}
              <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full filter blur-3xl opacity-20"></div>
              <div className="absolute bottom-0 left-0 w-96 h-96 bg-yellow-500/10 rounded-full filter blur-3xl opacity-20"></div>
              
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-400 to-cyan-600 flex items-center justify-center">
                    <TrendingUp className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-3xl md:text-5xl font-bold bg-gradient-to-r from-cyan-400 via-cyan-300 to-yellow-400 bg-clip-text text-transparent">
                      INVESTOR DASHBOARD
                    </h1>
                  </div>
                </div>
                <p className="text-base md:text-xl text-slate-300 max-w-3xl mb-8">
                  Manage your investments, monitor returns, and explore new opportunities with Boostify Music
                </p>
                <div className="flex flex-wrap gap-4">
                  <Button 
                    onClick={handleInvestNow} 
                    size="lg" 
                    className="bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-slate-950 font-semibold shadow-lg shadow-yellow-500/30"
                  >
                    <DollarSign className="mr-2 h-5 w-5" />
                    Invest Now
                  </Button>
                  <Button 
                    variant="outline" 
                    size="lg" 
                    className="border-cyan-500/50 text-cyan-300 hover:bg-cyan-500/10 hover:text-cyan-200"
                    onClick={handleDownloadContract}
                  >
                    <Download className="mr-2 h-5 w-5" />
                    Download Contract
                  </Button>
                </div>
              </div>
            </section>

            {/* Main Content Tabs - Modern Design */}
            <Tabs value={selectedTab} onValueChange={setSelectedTab}>
              <TabsList className="grid grid-cols-5 max-w-[1000px] mb-6 sm:mb-10 bg-slate-900/50 border border-cyan-500/20 p-1">
                <TabsTrigger 
                  value="investments" 
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500 data-[state=active]:to-cyan-600 data-[state=active]:text-white text-slate-400 data-[state=active]:shadow-lg data-[state=active]:shadow-cyan-500/30"
                >
                  <TrendingUp className="w-4 h-4 mr-2" />
                  <span className="text-xs sm:text-sm">Investments</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="roadmap" 
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500 data-[state=active]:to-cyan-600 data-[state=active]:text-white text-slate-400 data-[state=active]:shadow-lg data-[state=active]:shadow-cyan-500/30"
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  <span className="text-xs sm:text-sm">Roadmap</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="calculator" 
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500 data-[state=active]:to-cyan-600 data-[state=active]:text-white text-slate-400 data-[state=active]:shadow-lg data-[state=active]:shadow-cyan-500/30"
                >
                  <DollarSign className="w-4 h-4 mr-2" />
                  <span className="text-xs sm:text-sm">Calculator</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="overview" 
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500 data-[state=active]:to-cyan-600 data-[state=active]:text-white text-slate-400 data-[state=active]:shadow-lg data-[state=active]:shadow-cyan-500/30"
                >
                  <BarChart2 className="w-4 h-4 mr-2" />
                  <span className="text-xs sm:text-sm">Overview</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="register" 
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500 data-[state=active]:to-cyan-600 data-[state=active]:text-white text-slate-400 data-[state=active]:shadow-lg data-[state=active]:shadow-cyan-500/30"
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  <span className="text-xs sm:text-sm">Register</span>
                </TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                  <InvestorStats investorData={investorData?.data} globalStats={globalStats} />
                </div>

                <div className="grid md:grid-cols-2 gap-6 mb-8">
                  <Card className="p-6 bg-gradient-to-br from-slate-900/90 to-slate-900/50 border border-cyan-500/20">
                    <h3 className="text-lg font-semibold mb-6 text-cyan-300">Portfolio Value Over Time</h3>
                    <InvestmentPerformanceChart data={investmentData.monthlyReturns} />
                  </Card>

                  <div className="grid grid-cols-2 gap-4">
                    <Card className="p-6 bg-gradient-to-br from-slate-900/90 to-slate-900/50 border border-cyan-500/20 flex flex-col items-center justify-center">
                      <p className="text-sm text-slate-400 mb-2">Diversification</p>
                      <div className="relative w-32 h-32">
                        <svg className="w-full h-full transform -rotate-90">
                          <circle cx="64" cy="64" r="56" fill="none" stroke="rgb(30 41 59)" strokeWidth="12"/>
                          <circle cx="64" cy="64" r="56" fill="none" stroke="rgb(6 182 212)" strokeWidth="12" strokeDasharray="264" strokeDashoffset="66" strokeLinecap="round"/>
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-3xl font-bold text-cyan-300">75%</span>
                        </div>
                      </div>
                    </Card>
                    
                    <Card className="p-6 bg-gradient-to-br from-slate-900/90 to-slate-900/50 border border-yellow-500/20 flex flex-col items-center justify-center">
                      <p className="text-sm text-slate-400 mb-2">Risk Level</p>
                      <div className="relative w-32 h-32">
                        <svg className="w-full h-full transform -rotate-90">
                          <circle cx="64" cy="64" r="56" fill="none" stroke="rgb(30 41 59)" strokeWidth="12"/>
                          <circle cx="64" cy="64" r="56" fill="none" stroke="rgb(234 179 8)" strokeWidth="12" strokeDasharray="264" strokeDashoffset="184" strokeLinecap="round"/>
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-3xl font-bold text-yellow-400">30%</span>
                        </div>
                      </div>
                    </Card>
                  </div>
                </div>

                <Card className="p-6 bg-gradient-to-br from-slate-900/90 to-slate-900/50 border border-cyan-500/20 mb-8">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-semibold text-cyan-300">Investor Information</h3>
                    <Button variant="outline" size="sm" className="border-cyan-500/50 text-cyan-300 hover:bg-cyan-500/10">
                      <Download className="h-4 w-4 mr-2" />
                      Download Info
                    </Button>
                  </div>

                  <div className="space-y-4 text-slate-300">
                    <div>
                      <h4 className="text-base font-semibold mb-2 text-white">Investing in Boostify Music</h4>
                      <p className="text-sm">
                        Boostify Music offers a unique opportunity to invest in the future of the music industry. Our AI-powered platform is revolutionizing how artists, producers, and fans interact with music.
                      </p>
                    </div>
                    
                    <div>
                      <h4 className="text-base font-semibold mb-3 text-white">Investment Benefits</h4>
                      <ul className="space-y-2 text-sm">
                        <li className="flex items-start gap-2">
                          <Check className="h-4 w-4 text-green-400 mt-0.5 flex-shrink-0" />
                          <span><strong className="text-cyan-300">Monthly Returns:</strong> 4-6% based on your selected investment plan</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <Check className="h-4 w-4 text-green-400 mt-0.5 flex-shrink-0" />
                          <span><strong className="text-cyan-300">Minimum Investment:</strong> $2,000 USD</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <Check className="h-4 w-4 text-green-400 mt-0.5 flex-shrink-0" />
                          <span><strong className="text-cyan-300">Monthly Payments:</strong> Profit distribution on the 15th of each month</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <Check className="h-4 w-4 text-green-400 mt-0.5 flex-shrink-0" />
                          <span><strong className="text-cyan-300">Transparent Contracts:</strong> Clear terms and comprehensive documentation</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <Check className="h-4 w-4 text-green-400 mt-0.5 flex-shrink-0" />
                          <span><strong className="text-cyan-300">Exclusive Dashboard:</strong> Access to real-time statistics and analysis tools</span>
                        </li>
                      </ul>
                    </div>

                    <div>
                      <h4 className="text-base font-semibold mb-2 text-white">Upcoming Milestones</h4>
                      <p className="text-sm">
                        We're rapidly expanding, with the upcoming launch of our AI-enhanced streaming platform and new creator tools. Series B funding will accelerate our international growth.
                      </p>
                    </div>
                    
                    <div className="pt-4">
                      <Button 
                        onClick={handleInvestNow} 
                        className="bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-slate-950 font-semibold w-full sm:w-auto"
                      >
                        <DollarSign className="mr-2 h-4 w-4" />
                        Start Investing
                      </Button>
                    </div>
                  </div>
                </Card>
              </TabsContent>

              {/* Calculator Tab */}
              <TabsContent value="calculator">
                <Card className="p-4 sm:p-6 mb-8">
                  <h3 className="text-lg sm:text-xl font-semibold mb-4 sm:mb-6">Investment Calculator</h3>
                  <InvestmentCalculator />
                </Card>

                <Card className="p-4 sm:p-6">
                  <div className="flex justify-between items-center mb-4 sm:mb-6">
                    <h3 className="text-base sm:text-lg font-semibold">Investment Plans</h3>
                    <Button variant="outline" size="sm">
                      <FileText className="h-4 w-4 mr-2" />
                      View Full Details
                    </Button>
                  </div>

                  <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
                    <Card className="p-4 sm:p-6 border-2 border-muted">
                      <div className="flex justify-between items-start mb-4">
                        <h4 className="text-base sm:text-lg font-medium">Standard Plan</h4>
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">Low Risk</span>
                      </div>
                      <div className="flex items-baseline mb-4 sm:mb-6">
                        <span className="text-3xl sm:text-4xl font-bold">4%</span>
                        <span className="text-muted-foreground ml-1">monthly</span>
                      </div>
                      <ul className="space-y-2 mb-4 sm:mb-6 text-sm sm:text-base">
                        <li className="flex items-center">
                          <ChevronRight className="h-4 w-4 text-orange-500 mr-2 flex-shrink-0" />
                          <span>Minimum investment: $2,000</span>
                        </li>
                        <li className="flex items-center">
                          <ChevronRight className="h-4 w-4 text-orange-500 mr-2 flex-shrink-0" />
                          <span>Minimum term: 6 months</span>
                        </li>
                        <li className="flex items-center">
                          <ChevronRight className="h-4 w-4 text-orange-500 mr-2 flex-shrink-0" />
                          <span>Monthly payments</span>
                        </li>
                      </ul>
                      <Button className="w-full" variant="outline">Select Plan</Button>
                    </Card>

                    <Card className="p-4 sm:p-6 border-2 border-orange-500 shadow-lg relative">
                      <div className="absolute -top-3 right-4 px-3 py-1 bg-orange-500 text-white text-xs rounded-full">
                        Recommended
                      </div>
                      <div className="flex justify-between items-start mb-4">
                        <h4 className="text-base sm:text-lg font-medium">Premium Plan</h4>
                        <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded-full text-xs">Medium Risk</span>
                      </div>
                      <div className="flex items-baseline mb-4 sm:mb-6">
                        <span className="text-3xl sm:text-4xl font-bold">5%</span>
                        <span className="text-muted-foreground ml-1">monthly</span>
                      </div>
                      <ul className="space-y-2 mb-4 sm:mb-6 text-sm sm:text-base">
                        <li className="flex items-center">
                          <ChevronRight className="h-4 w-4 text-orange-500 mr-2 flex-shrink-0" />
                          <span>Minimum investment: $5,000</span>
                        </li>
                        <li className="flex items-center">
                          <ChevronRight className="h-4 w-4 text-orange-500 mr-2 flex-shrink-0" />
                          <span>Minimum term: 12 months</span>
                        </li>
                        <li className="flex items-center">
                          <ChevronRight className="h-4 w-4 text-orange-500 mr-2 flex-shrink-0" />
                          <span>Monthly payments</span>
                        </li>
                        <li className="flex items-center">
                          <ChevronRight className="h-4 w-4 text-orange-500 mr-2 flex-shrink-0" />
                          <span>Access to exclusive events</span>
                        </li>
                      </ul>
                      <Button className="w-full bg-orange-500 hover:bg-orange-600">Select Plan</Button>
                    </Card>

                    <Card className="p-4 sm:p-6 border-2 border-muted sm:col-span-2 md:col-span-1">
                      <div className="flex justify-between items-start mb-4">
                        <h4 className="text-base sm:text-lg font-medium">Elite Plan</h4>
                        <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs">High Potential</span>
                      </div>
                      <div className="flex items-baseline mb-4 sm:mb-6">
                        <span className="text-3xl sm:text-4xl font-bold">6%</span>
                        <span className="text-muted-foreground ml-1">monthly</span>
                      </div>
                      <ul className="space-y-2 mb-4 sm:mb-6 text-sm sm:text-base">
                        <li className="flex items-center">
                          <ChevronRight className="h-4 w-4 text-orange-500 mr-2 flex-shrink-0" />
                          <span>Minimum investment: $25,000</span>
                        </li>
                        <li className="flex items-center">
                          <ChevronRight className="h-4 w-4 text-orange-500 mr-2 flex-shrink-0" />
                          <span>Minimum term: 18 months</span>
                        </li>
                        <li className="flex items-center">
                          <ChevronRight className="h-4 w-4 text-orange-500 mr-2 flex-shrink-0" />
                          <span>Monthly payments</span>
                        </li>
                        <li className="flex items-center">
                          <ChevronRight className="h-4 w-4 text-orange-500 mr-2 flex-shrink-0" />
                          <span>Participation in strategic decisions</span>
                        </li>
                      </ul>
                      <Button className="w-full" variant="outline">Select Plan</Button>
                    </Card>
                  </div>

                  <div className="mt-6 sm:mt-8 p-3 sm:p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 rounded-lg">
                    <div className="flex items-start">
                      <AlertTriangle className="h-5 w-5 text-amber-500 mr-2 sm:mr-3 mt-0.5 flex-shrink-0" />
                      <div>
                        <h4 className="font-medium text-amber-800 dark:text-amber-300 text-sm sm:text-base">Important Notice</h4>
                        <p className="text-xs sm:text-sm text-amber-700 dark:text-amber-400">
                          All investments involve risks. Past returns do not guarantee future results. Please read the contract carefully and consult a financial advisor before investing.
                        </p>
                      </div>
                    </div>
                  </div>
                </Card>
              </TabsContent>

              {/* Investments Tab */}
              <TabsContent value="investments">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
                  <Card className="p-4 sm:p-6">
                    <div className="flex items-center gap-3 sm:gap-4">
                      <div className="p-2 sm:p-3 bg-orange-500/10 rounded-lg">
                        <DollarSign className="h-5 w-5 sm:h-6 sm:w-6 text-orange-500" />
                      </div>
                      <div>
                        <p className="text-xs sm:text-sm text-muted-foreground">Total Investment</p>
                        <p className="text-xl sm:text-2xl font-bold">${investmentData.totalInvested}</p>
                      </div>
                    </div>
                  </Card>

                  <Card className="p-4 sm:p-6">
                    <div className="flex items-center gap-3 sm:gap-4">
                      <div className="p-2 sm:p-3 bg-orange-500/10 rounded-lg">
                        <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-orange-500" />
                      </div>
                      <div>
                        <p className="text-xs sm:text-sm text-muted-foreground">Current Value</p>
                        <p className="text-xl sm:text-2xl font-bold">${investmentData.currentValue}</p>
                      </div>
                    </div>
                  </Card>

                  <Card className="p-4 sm:p-6 sm:col-span-1">
                    <div className="flex items-center gap-3 sm:gap-4">
                      <div className="p-2 sm:p-3 bg-orange-500/10 rounded-lg">
                        <Clock className="h-5 w-5 sm:h-6 sm:w-6 text-orange-500" />
                      </div>
                      <div>
                        <p className="text-xs sm:text-sm text-muted-foreground">Next Payment</p>
                        <p className="text-xl sm:text-2xl font-bold">{new Date(investmentData.nextPaymentDate).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </Card>
                </div>

                <Card className="p-4 sm:p-6 mb-6 sm:mb-8">
                  <h3 className="text-base sm:text-lg font-semibold mb-4 sm:mb-6">Investment History</h3>
                  
                  <div className="overflow-x-auto -mx-4 sm:mx-0">
                    <table className="w-full min-w-[640px]">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2 sm:py-3 px-4 text-xs sm:text-sm">Date</th>
                          <th className="text-left py-2 sm:py-3 px-4 text-xs sm:text-sm">Type</th>
                          <th className="text-left py-2 sm:py-3 px-4 text-xs sm:text-sm">Amount</th>
                          <th className="text-left py-2 sm:py-3 px-4 text-xs sm:text-sm">Status</th>
                          <th className="text-left py-2 sm:py-3 px-4 text-xs sm:text-sm">Return</th>
                        </tr>
                      </thead>
                      <tbody className="text-xs sm:text-sm">
                        <tr className="border-b hover:bg-muted/50">
                          <td className="py-2 sm:py-3 px-4 text-muted-foreground">-</td>
                          <td className="py-2 sm:py-3 px-4 text-muted-foreground">No investments yet</td>
                          <td className="py-2 sm:py-3 px-4 text-muted-foreground">-</td>
                          <td className="py-2 sm:py-3 px-4">
                            <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs">Pending</span>
                          </td>
                          <td className="py-2 sm:py-3 px-4 text-muted-foreground">-</td>
                        </tr>
                        <tr className="hover:bg-muted/50">
                          <td colSpan={5} className="py-4 sm:py-6 px-4 text-center">
                            <p className="text-sm text-muted-foreground mb-3">Start investing in Boostify Music today!</p>
                            <Button 
                              size="sm" 
                              onClick={handleInvestNow}
                              className="bg-orange-500 hover:bg-orange-600"
                            >
                              <DollarSign className="h-4 w-4 mr-2" />
                              Register as Investor
                            </Button>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </Card>

                <Card className="p-4 sm:p-6">
                  <div className="flex justify-between items-center mb-6 sm:mb-8">
                    <div>
                      <h3 className="text-lg sm:text-2xl font-bold mb-1">Investment Funding Rounds</h3>
                      <p className="text-xs sm:text-sm text-muted-foreground">Professional funding opportunities with tiered growth targets</p>
                    </div>
                    <Button 
                      onClick={handleInvestNow}
                      size="lg"
                      className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold shadow-lg"
                    >
                      <CreditCard className="h-4 w-4 mr-2" />
                      Invest Now
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
                    {investmentData.investmentRounds.map((round: any, index: number) => (
                      <Card key={index} className={`p-4 sm:p-6 relative overflow-hidden ${
                        round.status === 'Active' 
                          ? 'bg-gradient-to-br from-orange-500/20 to-orange-500/5 border-orange-500/30' 
                          : 'bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-slate-700/30'
                      }`}>
                        {round.status === 'Active' && (
                          <div className="absolute -top-3 right-4 px-3 py-1 bg-orange-500 text-white text-xs rounded-full font-semibold">
                            OPEN NOW
                          </div>
                        )}
                        
                        <div className="mb-4">
                          <div className="flex justify-between items-start mb-3">
                            <h4 className="text-lg sm:text-xl font-bold">{round.name}</h4>
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                              round.status === 'Active' ? 'bg-green-500/20 text-green-400' : 'bg-blue-500/20 text-blue-400'
                            }`}>
                              {round.status}
                            </span>
                          </div>
                          <p className="text-xs sm:text-sm text-muted-foreground mb-4">{round.description}</p>
                        </div>
                        
                        <div className="space-y-3 mb-4">
                          <div className="flex justify-between items-center pb-2 border-b border-white/10">
                            <span className="text-xs text-muted-foreground">Launch Date</span>
                            <span className="font-semibold text-sm">{round.date}</span>
                          </div>
                          <div className="flex justify-between items-center pb-2 border-b border-white/10">
                            <span className="text-xs text-muted-foreground">Equity Offered</span>
                            <span className="font-bold text-lg text-orange-400">{round.equity}</span>
                          </div>
                          <div className="flex justify-between items-center pb-2 border-b border-white/10">
                            <span className="text-xs text-muted-foreground">Funding Target</span>
                            <span className="font-bold text-sm">{round.target}</span>
                          </div>
                          <div className="flex justify-between items-center pb-2 border-b border-white/10">
                            <span className="text-xs text-muted-foreground">Round Type</span>
                            <span className="text-xs font-semibold text-cyan-400">{round.raisedStatus}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-muted-foreground">User Growth Goal</span>
                            <span className="font-bold text-sm text-yellow-400">{round.goal}</span>
                          </div>
                        </div>
                        
                        {round.status === 'Active' && (
                          <Button 
                            onClick={handleInvestNow}
                            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold mt-2"
                          >
                            <DollarSign className="h-4 w-4 mr-2" />
                            Invest Now
                          </Button>
                        )}
                        {round.status === 'Upcoming' && (
                          <Button 
                            disabled
                            variant="outline"
                            className="w-full"
                          >
                            Coming Soon
                          </Button>
                        )}
                      </Card>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <Card className="p-4 bg-orange-500/10 border-orange-500/20">
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-orange-500/20 rounded-lg">
                          <Target className="h-5 w-5 text-orange-500" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Total Capital Target</p>
                          <p className="text-2xl font-bold">$3M</p>
                          <p className="text-xs text-muted-foreground mt-1">Across all rounds</p>
                        </div>
                      </div>
                    </Card>

                    <Card className="p-4 bg-cyan-500/10 border-cyan-500/20">
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-cyan-500/20 rounded-lg">
                          <Users className="h-5 w-5 text-cyan-500" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">User Growth Goal</p>
                          <p className="text-2xl font-bold">50K+</p>
                          <p className="text-xs text-muted-foreground mt-1">By Series B close</p>
                        </div>
                      </div>
                    </Card>

                    <Card className="p-4 bg-yellow-500/10 border-yellow-500/20">
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-yellow-500/20 rounded-lg">
                          <TrendingUp className="h-5 w-5 text-yellow-500" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Total Equity Available</p>
                          <p className="text-2xl font-bold">20%</p>
                          <p className="text-xs text-muted-foreground mt-1">Across funding rounds</p>
                        </div>
                      </div>
                    </Card>
                  </div>
                </Card>
              </TabsContent>

              {/* Roadmap Tab */}
              <TabsContent value="roadmap">
                <Card className="p-4 sm:p-6 mb-6 sm:mb-8 bg-black/20 border-orange-500/20">
                  <h3 className="text-lg sm:text-xl font-semibold mb-4 sm:mb-6 text-white">Boostify Music Roadmap</h3>
                  <RoadmapTimeline />
                </Card>

                <Card className="p-4 sm:p-6 bg-black/20 border-orange-500/20">
                  <h3 className="text-base sm:text-lg font-semibold mb-4 sm:mb-6 text-white">Financial Projections</h3>
                  
                  <div className="grid sm:grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
                    <div>
                      <h4 className="text-sm sm:text-base font-medium mb-3 sm:mb-4 text-white">Projected User Growth</h4>
                      <div className="h-48 sm:h-64 bg-black/30 rounded-lg p-4 overflow-hidden relative">
                        <div className="absolute inset-0 bg-gradient-to-r from-orange-500/5 to-orange-500/10"></div>
                        <div className="relative z-10 h-full flex flex-col">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-xs text-white/70">Users (millions)</span>
                            <div className="flex space-x-2">
                              <span className="text-xs px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-200">Current</span>
                              <span className="text-xs px-1.5 py-0.5 rounded bg-orange-500/20 text-orange-200">Projected</span>
                            </div>
                          </div>
                          
                          <div className="flex-1 flex items-end space-x-2">
                            {/* Q1 2025 */}
                            <div className="flex-1 flex flex-col items-center">
                              <div className="h-[15%] w-3 bg-blue-500 rounded-t mb-1"></div>
                              <div className="h-[25%] w-3 bg-orange-500/70 rounded-t"></div>
                              <span className="text-[8px] sm:text-xs mt-1 text-white/70">Q1</span>
                            </div>
                            
                            {/* Q2 2025 */}
                            <div className="flex-1 flex flex-col items-center">
                              <div className="h-[22%] w-3 bg-blue-500 rounded-t mb-1"></div>
                              <div className="h-[35%] w-3 bg-orange-500/70 rounded-t"></div>
                              <span className="text-[8px] sm:text-xs mt-1 text-white/70">Q2</span>
                            </div>
                            
                            {/* Q3 2025 */}
                            <div className="flex-1 flex flex-col items-center">
                              <div className="h-[30%] w-3 bg-blue-500 rounded-t mb-1"></div>
                              <div className="h-[45%] w-3 bg-orange-500/70 rounded-t"></div>
                              <span className="text-[8px] sm:text-xs mt-1 text-white/70">Q3</span>
                            </div>
                            
                            {/* Q4 2025 */}
                            <div className="flex-1 flex flex-col items-center">
                              <div className="h-[40%] w-3 bg-blue-500 rounded-t mb-1"></div>
                              <div className="h-[60%] w-3 bg-orange-500/70 rounded-t"></div>
                              <span className="text-[8px] sm:text-xs mt-1 text-white/70">Q4</span>
                            </div>
                            
                            {/* Q1 2026 */}
                            <div className="flex-1 flex flex-col items-center">
                              <div className="h-[50%] w-3 bg-blue-500 rounded-t mb-1"></div>
                              <div className="h-[80%] w-3 bg-orange-500/70 rounded-t"></div>
                              <span className="text-[8px] sm:text-xs mt-1 text-white/70">Q1 '26</span>
                            </div>
                            
                            {/* Q2 2026 */}
                            <div className="flex-1 flex flex-col items-center">
                              <div className="h-[60%] w-3 bg-blue-500 rounded-t mb-1"></div>
                              <div className="h-full w-3 bg-orange-500/70 rounded-t"></div>
                              <span className="text-[8px] sm:text-xs mt-1 text-white/70">Q2 '26</span>
                            </div>
                          </div>
                          
                          <div className="mt-2 pt-2 border-t border-white/10">
                            <div className="flex justify-between">
                              <span className="text-xs text-white/70">0.8M now</span>
                              <span className="text-xs text-white/70">50M+ goal by 2027</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="text-sm sm:text-base font-medium mb-3 sm:mb-4 text-white">Projected Revenue Growth</h4>
                      <div className="h-48 sm:h-64 bg-black/30 rounded-lg p-4 overflow-hidden relative">
                        <div className="absolute inset-0 bg-gradient-to-r from-orange-500/5 to-orange-500/10"></div>
                        <div className="relative z-10 h-full flex flex-col">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-xs text-white/70">Revenue ($ millions)</span>
                            <div className="flex space-x-2">
                              <span className="text-xs px-1.5 py-0.5 rounded bg-green-500/20 text-green-200">Actual</span>
                              <span className="text-xs px-1.5 py-0.5 rounded bg-orange-500/20 text-orange-200">Projected</span>
                            </div>
                          </div>
                          
                          {/* Line chart */}
                          <div className="flex-1 relative">
                            {/* Horizontal grid lines */}
                            <div className="absolute left-0 right-0 top-0 bottom-0">
                              <div className="border-t border-white/10 absolute top-0 left-0 right-0"></div>
                              <div className="border-t border-white/10 absolute top-1/4 left-0 right-0"></div>
                              <div className="border-t border-white/10 absolute top-1/2 left-0 right-0"></div>
                              <div className="border-t border-white/10 absolute top-3/4 left-0 right-0"></div>
                              <div className="border-t border-white/10 absolute bottom-0 left-0 right-0"></div>
                            </div>
                            
                            {/* Actual revenue line */}
                            <svg className="absolute inset-0" viewBox="0 0 100 100" preserveAspectRatio="none">
                              <path 
                                d="M0,100 L10,90 L20,85 L30,75 L40,65 L50,55" 
                                fill="none" 
                                stroke="#22c55e" 
                                strokeWidth="2"
                                strokeLinecap="round"
                              />
                              
                              {/* Projected revenue line (dashed) */}
                              <path 
                                d="M50,70 L60,58 L70,42 L80,28 L90,15 L100,2" 
                                fill="none" 
                                stroke="#f97316" 
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeDasharray="2 2"
                              />
                              
                              {/* Dots for data points */}
                              <circle cx="0" cy="100" r="1.5" fill="#22c55e" />
                              <circle cx="10" cy="90" r="1.5" fill="#22c55e" />
                              <circle cx="20" cy="85" r="1.5" fill="#22c55e" />
                              <circle cx="30" cy="75" r="1.5" fill="#22c55e" />
                              <circle cx="40" cy="65" r="1.5" fill="#22c55e" />
                              <circle cx="50" cy="70" r="1.5" fill="#22c55e" />
                              
                              <circle cx="60" cy="58" r="1.5" fill="#f97316" />
                              <circle cx="70" cy="42" r="1.5" fill="#f97316" />
                              <circle cx="80" cy="28" r="1.5" fill="#f97316" />
                              <circle cx="90" cy="15" r="1.5" fill="#f97316" />
                              <circle cx="100" cy="2" r="1.5" fill="#f97316" />
                            </svg>
                          </div>
                          
                          <div className="grid grid-cols-6 mt-2">
                            <div className="text-center text-[8px] sm:text-xs text-white/70">2023</div>
                            <div className="text-center text-[8px] sm:text-xs text-white/70">2024</div>
                            <div className="text-center text-[8px] sm:text-xs text-white/70">2025</div>
                            <div className="text-center text-[8px] sm:text-xs text-white/70">2026</div>
                            <div className="text-center text-[8px] sm:text-xs text-white/70">2027</div>
                            <div className="text-center text-[8px] sm:text-xs text-white/70">2028</div>
                          </div>
                          
                          <div className="mt-2 pt-2 border-t border-white/10">
                            <div className="flex justify-between">
                              <span className="text-xs text-white/70">$8M now</span>
                              <span className="text-xs text-white/70">$540M+ by 2027</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Interactive Revenue Simulations Calculator */}
                  <div className="mt-8">
                    <RevenueSimulationsCalculator />
                  </div>

                  {/* Revenue Simulations Based on Business Model */}
                  <div className="mt-8">
                    <h4 className="text-base sm:text-lg font-semibold mb-6 text-white">Revenue Projections - User Growth Scenarios</h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                      {/* Simulation 1: 1,000 Active Users */}
                      <Card className="p-4 bg-black/30 border-orange-500/20">
                        <div className="mb-4">
                          <div className="flex items-center justify-between mb-2">
                            <h5 className="font-semibold text-white">1,000 Users</h5>
                            <Users className="h-5 w-5 text-orange-400" />
                          </div>
                          <p className="text-xs text-white/60">Conservative Growth Scenario</p>
                        </div>
                        
                        <div className="space-y-3 text-xs">
                          <div className="flex justify-between items-center pb-2 border-b border-white/10">
                            <span className="text-white/70">Basic Plan (40%)</span>
                            <span className="font-semibold text-white">$23,996/mo</span>
                          </div>
                          <div className="flex justify-between items-center pb-2 border-b border-white/10">
                            <span className="text-white/70">Pro Plan (35%)</span>
                            <span className="font-semibold text-white">$34,997/mo</span>
                          </div>
                          <div className="flex justify-between items-center pb-2 border-b border-white/10">
                            <span className="text-white/70">Premium Plan (25%)</span>
                            <span className="font-semibold text-white">$37,498/mo</span>
                          </div>
                          <div className="flex justify-between items-center pb-2 border-b border-white/10">
                            <span className="text-white/70">Music Videos (20 units)</span>
                            <span className="font-semibold text-white">$3,980/mo</span>
                          </div>
                          <div className="flex justify-between items-center pb-2 border-b border-white/10">
                            <span className="text-white/70">Distribution Fees (5%)</span>
                            <span className="font-semibold text-white">$5,024/mo</span>
                          </div>
                          <div className="flex justify-between items-center pt-2">
                            <span className="font-bold text-orange-400">Total Monthly</span>
                            <span className="font-bold text-orange-400 text-lg">$105,495</span>
                          </div>
                          <div className="flex justify-between items-center pt-1">
                            <span className="font-bold text-white">Annual Revenue</span>
                            <span className="font-bold text-white text-lg">$1.27M</span>
                          </div>
                        </div>
                      </Card>

                      {/* Simulation 2: 5,000 Active Users */}
                      <Card className="p-4 bg-black/30 border-orange-500/20 ring-2 ring-orange-500/50">
                        <div className="mb-4">
                          <div className="flex items-center justify-between mb-2">
                            <h5 className="font-semibold text-white">5,000 Users</h5>
                            <Users className="h-5 w-5 text-orange-400" />
                          </div>
                          <p className="text-xs text-white/60">Target Growth Scenario</p>
                        </div>
                        
                        <div className="space-y-3 text-xs">
                          <div className="flex justify-between items-center pb-2 border-b border-white/10">
                            <span className="text-white/70">Basic Plan (35%)</span>
                            <span className="font-semibold text-white">$104,983/mo</span>
                          </div>
                          <div className="flex justify-between items-center pb-2 border-b border-white/10">
                            <span className="text-white/70">Pro Plan (40%)</span>
                            <span className="font-semibold text-white">$199,980/mo</span>
                          </div>
                          <div className="flex justify-between items-center pb-2 border-b border-white/10">
                            <span className="text-white/70">Premium Plan (25%)</span>
                            <span className="font-semibold text-white">$187,488/mo</span>
                          </div>
                          <div className="flex justify-between items-center pb-2 border-b border-white/10">
                            <span className="text-white/70">Music Videos (120 units)</span>
                            <span className="font-semibold text-white">$23,880/mo</span>
                          </div>
                          <div className="flex justify-between items-center pb-2 border-b border-white/10">
                            <span className="text-white/70">Distribution Fees (8%)</span>
                            <span className="font-semibold text-white">$41,228/mo</span>
                          </div>
                          <div className="flex justify-between items-center pt-2">
                            <span className="font-bold text-orange-400">Total Monthly</span>
                            <span className="font-bold text-orange-400 text-lg">$557,559</span>
                          </div>
                          <div className="flex justify-between items-center pt-1">
                            <span className="font-bold text-white">Annual Revenue</span>
                            <span className="font-bold text-white text-lg">$6.69M</span>
                          </div>
                        </div>
                      </Card>

                      {/* Simulation 3: 10,000 Active Users */}
                      <Card className="p-4 bg-black/30 border-orange-500/20">
                        <div className="mb-4">
                          <div className="flex items-center justify-between mb-2">
                            <h5 className="font-semibold text-white">10,000 Users</h5>
                            <Users className="h-5 w-5 text-orange-400" />
                          </div>
                          <p className="text-xs text-white/60">Optimistic Growth Scenario</p>
                        </div>
                        
                        <div className="space-y-3 text-xs">
                          <div className="flex justify-between items-center pb-2 border-b border-white/10">
                            <span className="text-white/70">Basic Plan (30%)</span>
                            <span className="font-semibold text-white">$179,970/mo</span>
                          </div>
                          <div className="flex justify-between items-center pb-2 border-b border-white/10">
                            <span className="text-white/70">Pro Plan (40%)</span>
                            <span className="font-semibold text-white">$399,960/mo</span>
                          </div>
                          <div className="flex justify-between items-center pb-2 border-b border-white/10">
                            <span className="text-white/70">Premium Plan (30%)</span>
                            <span className="font-semibold text-white">$449,970/mo</span>
                          </div>
                          <div className="flex justify-between items-center pb-2 border-b border-white/10">
                            <span className="text-white/70">Music Videos (280 units)</span>
                            <span className="font-semibold text-white">$55,720/mo</span>
                          </div>
                          <div className="flex justify-between items-center pb-2 border-b border-white/10">
                            <span className="text-white/70">Distribution Fees (10%)</span>
                            <span className="font-semibold text-white">$108,562/mo</span>
                          </div>
                          <div className="flex justify-between items-center pt-2">
                            <span className="font-bold text-orange-400">Total Monthly</span>
                            <span className="font-bold text-orange-400 text-lg">$1,194,182</span>
                          </div>
                          <div className="flex justify-between items-center pt-1">
                            <span className="font-bold text-white">Annual Revenue</span>
                            <span className="font-bold text-white text-lg">$14.33M</span>
                          </div>
                        </div>
                      </Card>
                    </div>

                    {/* Revenue Breakdown Details - Business Model Components */}
                    <Card className="p-4 bg-black/30 border-orange-500/20">
                      <h5 className="font-semibold text-white mb-6">Business Model Components - Comprehensive Revenue Streams</h5>
                      
                      {/* Subscription Plans */}
                      <div className="mb-6">
                        <h6 className="text-white/80 text-xs font-bold mb-3 uppercase">1. Subscription Plans Revenue</h6>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <div className="p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
                            <p className="text-white/70 text-xs mb-1">Basic Plan</p>
                            <p className="font-bold text-white">$59.99/mo</p>
                            <p className="text-xs text-white/60 mt-2">• Core features + 10 productions</p>
                            <p className="text-xs text-white/60">• 30% of users (1k users = $18k/mo)</p>
                          </div>
                          <div className="p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
                            <p className="text-white/70 text-xs mb-1">Pro Plan</p>
                            <p className="font-bold text-white">$99.99/mo</p>
                            <p className="text-xs text-white/60 mt-2">• Advanced AI + 30 productions</p>
                            <p className="text-xs text-white/60">• 40% of users (1k users = $39.9k/mo)</p>
                          </div>
                          <div className="p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
                            <p className="text-white/70 text-xs mb-1">Premium Plan</p>
                            <p className="font-bold text-white">$149.99/mo</p>
                            <p className="text-xs text-white/60 mt-2">• Unlimited + Masterclasses</p>
                            <p className="text-xs text-white/60">• 30% of users (1k users = $44.9k/mo)</p>
                          </div>
                        </div>
                      </div>

                      {/* Music Video Generator */}
                      <div className="mb-6">
                        <h6 className="text-white/80 text-xs font-bold mb-3 uppercase">2. Music Video Generator ($199/video)</h6>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <div className="p-3 bg-purple-500/10 rounded-lg border border-purple-500/20">
                            <p className="text-white/70 text-xs mb-1">1,000 Users</p>
                            <p className="text-xs text-white/60 mb-2">20% generate videos (200 videos)</p>
                            <p className="font-bold text-white">$39,800/mo</p>
                            <p className="text-xs text-white/60 mt-2">Annual: $477,600</p>
                          </div>
                          <div className="p-3 bg-purple-500/10 rounded-lg border border-purple-500/20">
                            <p className="text-white/70 text-xs mb-1">5,000 Users</p>
                            <p className="text-xs text-white/60 mb-2">20% generate videos (1,000 videos)</p>
                            <p className="font-bold text-white">$199,000/mo</p>
                            <p className="text-xs text-white/60 mt-2">Annual: $2,388,000</p>
                          </div>
                          <div className="p-3 bg-purple-500/10 rounded-lg border border-purple-500/20">
                            <p className="text-white/70 text-xs mb-1">10,000 Users</p>
                            <p className="text-xs text-white/60 mb-2">20% generate videos (2,000 videos)</p>
                            <p className="font-bold text-white">$398,000/mo</p>
                            <p className="text-xs text-white/60 mt-2">Annual: $4,776,000</p>
                          </div>
                        </div>
                      </div>

                      {/* Blockchain & Tokenization */}
                      <div className="mb-6">
                        <h6 className="text-white/80 text-xs font-bold mb-3 uppercase">3. Blockchain Fees & Tokenization (5% per transaction)</h6>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <div className="p-3 bg-green-500/10 rounded-lg border border-green-500/20">
                            <p className="text-white/70 text-xs mb-1">BoostiSwap DEX Trading</p>
                            <p className="text-xs text-white/60 mb-2">5% commission on trades</p>
                            <p className="font-bold text-white">$50,000-150k/mo*</p>
                            <p className="text-xs text-white/60 mt-2">*Depends on trading volume</p>
                          </div>
                          <div className="p-3 bg-green-500/10 rounded-lg border border-green-500/20">
                            <p className="text-white/70 text-xs mb-1">Artist Token Deployment</p>
                            <p className="text-xs text-white/60 mb-2">Gas fees + platform commission</p>
                            <p className="font-bold text-white">$20,000-80k/mo*</p>
                            <p className="text-xs text-white/60 mt-2">*Per deployment volume</p>
                          </div>
                          <div className="p-3 bg-green-500/10 rounded-lg border border-green-500/20">
                            <p className="text-white/70 text-xs mb-1">Smart Contract Royalties</p>
                            <p className="text-xs text-white/60 mb-2">Automated royalty distribution 2-3%</p>
                            <p className="font-bold text-white">$30,000-100k/mo*</p>
                            <p className="text-xs text-white/60 mt-2">*Recurring from volume</p>
                          </div>
                        </div>
                      </div>

                      {/* Artist Merchandise & Products */}
                      <div className="mb-6">
                        <h6 className="text-white/80 text-xs font-bold mb-3 uppercase">4. Artist Merchandise & Product Sales (20% commission)</h6>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <div className="p-3 bg-amber-500/10 rounded-lg border border-amber-500/20">
                            <p className="text-white/70 text-xs mb-1">1,000 Active Artists</p>
                            <p className="text-xs text-white/60 mb-2">$500/mo avg sales per artist</p>
                            <p className="font-bold text-white">$100,000/mo</p>
                            <p className="text-xs text-white/60 mt-2">20% = $20,000/mo</p>
                          </div>
                          <div className="p-3 bg-amber-500/10 rounded-lg border border-amber-500/20">
                            <p className="text-white/70 text-xs mb-1">5,000 Active Artists</p>
                            <p className="text-xs text-white/60 mb-2">$500/mo avg sales per artist</p>
                            <p className="font-bold text-white">$500,000/mo</p>
                            <p className="text-xs text-white/60 mt-2">20% = $100,000/mo</p>
                          </div>
                          <div className="p-3 bg-amber-500/10 rounded-lg border border-amber-500/20">
                            <p className="text-white/70 text-xs mb-1">10,000 Active Artists</p>
                            <p className="text-xs text-white/60 mb-2">$500/mo avg sales per artist</p>
                            <p className="font-bold text-white">$1,000,000/mo</p>
                            <p className="text-xs text-white/60 mt-2">20% = $200,000/mo</p>
                          </div>
                        </div>
                      </div>

                      {/* Music Licensing & Streaming Revenue */}
                      <div className="mb-6">
                        <h6 className="text-white/80 text-xs font-bold mb-3 uppercase">5. Music Licensing & Streaming Revenue</h6>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div className="p-3 bg-indigo-500/10 rounded-lg border border-indigo-500/20">
                            <p className="text-white/70 text-xs mb-1">AI Artist YouTube Channels</p>
                            <p className="text-xs text-white/60 mb-2">100+ AI-generated channels</p>
                            <p className="text-xs text-white/60 mb-2">Ad revenue share: $2k-5k/mo per channel</p>
                            <p className="font-bold text-white">$200,000-500k/mo</p>
                          </div>
                          <div className="p-3 bg-indigo-500/10 rounded-lg border border-indigo-500/20">
                            <p className="text-white/70 text-xs mb-1">Streaming Royalties (Spotify, Apple Music)</p>
                            <p className="text-xs text-white/60 mb-2">API integration with platforms</p>
                            <p className="text-xs text-white/60 mb-2">30-50% of artist royalties</p>
                            <p className="font-bold text-white">$150,000-400k/mo</p>
                          </div>
                        </div>
                      </div>

                      {/* Digital Artist Channels */}
                      <div className="mb-6">
                        <h6 className="text-white/80 text-xs font-bold mb-3 uppercase">6. OnlyFans & Explicit Digital Artist Channels</h6>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div className="p-3 bg-pink-500/10 rounded-lg border border-pink-500/20">
                            <p className="text-white/70 text-xs mb-1">OnlyFans Integration</p>
                            <p className="text-xs text-white/60 mb-2">50+ artist channels active</p>
                            <p className="text-xs text-white/60 mb-2">$3k-8k/mo per channel</p>
                            <p className="font-bold text-white">$150,000-400k/mo</p>
                          </div>
                          <div className="p-3 bg-pink-500/10 rounded-lg border border-pink-500/20">
                            <p className="text-white/70 text-xs mb-1">Exclusive Content Revenue</p>
                            <p className="text-xs text-white/60 mb-2">Behind-the-scenes + explicit content</p>
                            <p className="text-xs text-white/60 mb-2">Platform takes 15-20% cut</p>
                            <p className="font-bold text-white">$80,000-250k/mo</p>
                          </div>
                        </div>
                      </div>

                      {/* Boostify Token Revenue */}
                      <div className="mb-6">
                        <h6 className="text-white/80 text-xs font-bold mb-3 uppercase">7. Boostify Token ($BOOST) Ecosystem</h6>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div className="p-3 bg-cyan-500/10 rounded-lg border border-cyan-500/20">
                            <p className="text-white/70 text-xs mb-1">Token Sales & Staking</p>
                            <p className="text-xs text-white/60 mb-2">IDO + ongoing secondary sales</p>
                            <p className="text-xs text-white/60 mb-2">3-5% platform commission</p>
                            <p className="font-bold text-white">$100,000-300k/mo</p>
                          </div>
                          <div className="p-3 bg-cyan-500/10 rounded-lg border border-cyan-500/20">
                            <p className="text-white/70 text-xs mb-1">Staking Rewards Pool</p>
                            <p className="text-xs text-white/60 mb-2">12% APY for token holders</p>
                            <p className="text-xs text-white/60 mb-2">Platform revenue from inflation</p>
                            <p className="font-bold text-white">$50,000-150k/mo</p>
                          </div>
                        </div>
                      </div>

                      {/* Educational & Services */}
                      <div className="mb-6">
                        <h6 className="text-white/80 text-xs font-bold mb-3 uppercase">8. Courses, Masterclasses & Professional Services</h6>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <div className="p-3 bg-red-500/10 rounded-lg border border-red-500/20">
                            <p className="text-white/70 text-xs mb-1">Premium Courses</p>
                            <p className="text-xs text-white/60 mb-2">Music production, AI tools, Web3</p>
                            <p className="text-xs text-white/60 mb-2">$29-99 per course</p>
                            <p className="font-bold text-white">$20,000-60k/mo</p>
                          </div>
                          <div className="p-3 bg-red-500/10 rounded-lg border border-red-500/20">
                            <p className="text-white/70 text-xs mb-1">Musician Services (20% commission)</p>
                            <p className="text-xs text-white/60 mb-2">Production, mixing, mastering services</p>
                            <p className="text-xs text-white/60 mb-2">$500-5k per service</p>
                            <p className="font-bold text-white">$50,000-150k/mo</p>
                          </div>
                          <div className="p-3 bg-red-500/10 rounded-lg border border-red-500/20">
                            <p className="text-white/70 text-xs mb-1">Artist Management Packages</p>
                            <p className="text-xs text-white/60 mb-2">Profile customization, branding</p>
                            <p className="text-xs text-white/60 mb-2">$99-499/mo premium tiers</p>
                            <p className="font-bold text-white">$30,000-100k/mo</p>
                          </div>
                        </div>
                      </div>

                      {/* Artist Cards */}
                      <div className="mb-6">
                        <h6 className="text-white/80 text-xs font-bold mb-3 uppercase">9. Artist Cards</h6>
                        <div className="grid grid-cols-1 md:grid-cols-1 gap-3">
                          <div className="p-3 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
                            <p className="text-white/70 text-xs mb-1">Artist Card Marketplace</p>
                            <p className="text-xs text-white/60 mb-2">2.5-5% commission on secondary sales</p>
                            <p className="text-xs text-white/60 mb-2">Growing trading volume between users</p>
                            <p className="font-bold text-white">$40,000-120k/mo</p>
                          </div>
                        </div>
                      </div>

                      {/* Motion Capture & API Services */}
                      <div className="mb-6">
                        <h6 className="text-white/80 text-xs font-bold mb-3 uppercase">10. Motion Capture & Advanced API Services</h6>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div className="p-3 bg-violet-500/10 rounded-lg border border-violet-500/20">
                            <p className="text-white/70 text-xs mb-1">Motion Capture API</p>
                            <p className="text-xs text-white/60 mb-2">Professional mocap data licensing</p>
                            <p className="text-xs text-white/60 mb-2">$500-2k per project/license</p>
                            <p className="font-bold text-white">$30,000-100k/mo</p>
                          </div>
                          <div className="p-3 bg-violet-500/10 rounded-lg border border-violet-500/20">
                            <p className="text-white/70 text-xs mb-1">Premium API & Webhooks</p>
                            <p className="text-xs text-white/60 mb-2">For external developers & studios</p>
                            <p className="text-xs text-white/60 mb-2">$99-999/mo tier pricing</p>
                            <p className="font-bold text-white">$20,000-60k/mo</p>
                          </div>
                        </div>
                      </div>

                      {/* Total Projection */}
                      <div className="p-4 bg-orange-500/20 rounded-lg border border-orange-500/40 mt-6">
                        <h6 className="text-white font-bold mb-3">Projected Monthly Revenue by User Base</h6>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="text-white/70 mb-1">1,000 Users (Jan 2026)</p>
                            <p className="text-2xl font-bold text-orange-400">$600k - $950k/mo</p>
                            <p className="text-xs text-white/60 mt-2">Annual: $7.2M - $11.4M</p>
                          </div>
                          <div>
                            <p className="text-white/70 mb-1">5,000 Users (Jul 2026)</p>
                            <p className="text-2xl font-bold text-orange-400">$3M - $4.5M/mo</p>
                            <p className="text-xs text-white/60 mt-2">Annual: $36M - $54M</p>
                          </div>
                          <div>
                            <p className="text-white/70 mb-1">10,000 Users (Dec 2026)</p>
                            <p className="text-2xl font-bold text-orange-400">$5.5M - $9M/mo</p>
                            <p className="text-xs text-white/60 mt-2">Annual: $66M - $108M</p>
                          </div>
                          <div className="ring-2 ring-orange-400/50">
                            <p className="text-white/70 mb-1">50,000 Users (2027 Goal)</p>
                            <p className="text-2xl font-bold text-orange-300">$27M - $45M/mo</p>
                            <p className="text-xs text-white/60 mt-2">Annual: $324M - $540M</p>
                          </div>
                        </div>
                      </div>
                    </Card>
                  </div>

                  <div className="mt-6 sm:mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
                    <Card className="p-3 sm:p-4 bg-black/30 border-orange-500/20">
                      <div className="flex items-center gap-2 sm:gap-3 mb-2">
                        <div className="p-1.5 rounded-full bg-blue-500/20">
                          <Users className="h-4 w-4 sm:h-5 sm:w-5 text-blue-400" />
                        </div>
                        <h4 className="text-sm sm:text-base font-medium text-white">Projected Users</h4>
                      </div>
                      <p className="text-2xl sm:text-3xl font-bold text-white">2.5M</p>
                      <p className="text-xs sm:text-sm text-white/70">By the end of 2028</p>
                    </Card>
                    
                    <Card className="p-3 sm:p-4 bg-black/30 border-orange-500/20">
                      <div className="flex items-center gap-2 sm:gap-3 mb-2">
                        <div className="p-1.5 rounded-full bg-green-500/20">
                          <BarChart className="h-4 w-4 sm:h-5 sm:w-5 text-green-400" />
                        </div>
                        <h4 className="text-sm sm:text-base font-medium text-white">Annual Revenue</h4>
                      </div>
                      <p className="text-2xl sm:text-3xl font-bold text-white">$12M</p>
                      <p className="text-xs sm:text-sm text-white/70">Projected for 2026</p>
                    </Card>
                    
                    <Card className="p-3 sm:p-4 bg-black/30 border-orange-500/20">
                      <div className="flex items-center gap-2 sm:gap-3 mb-2">
                        <div className="p-1.5 rounded-full bg-orange-500/20">
                          <Target className="h-4 w-4 sm:h-5 sm:w-5 text-orange-400" />
                        </div>
                        <h4 className="text-sm sm:text-base font-medium text-white">Return on Investment</h4>
                      </div>
                      <p className="text-2xl sm:text-3xl font-bold text-white">78%</p>
                      <p className="text-xs sm:text-sm text-white/70">Projected ROI over 24 months</p>
                    </Card>
                  </div>
                </Card>
              </TabsContent>
              
              {/* Register Tab */}
              <TabsContent value="register">
                <div className="max-w-4xl mx-auto">
                  <div className="mb-6 sm:mb-8">
                    <h3 className="text-xl sm:text-2xl font-bold mb-2">Investor Registration</h3>
                    <p className="text-muted-foreground">
                      Complete the form below to register as an investor in Boostify Music. 
                      All information will be kept confidential and secure.
                    </p>
                  </div>
                  
                  <div id="investor-registration-form">
                    <InvestorRegistrationForm />
                  </div>
                  
                  <div className="mt-8 bg-muted p-4 sm:p-6 rounded-lg">
                    <h4 className="text-lg font-medium mb-4">After Registration</h4>
                    <div className="space-y-3">
                      <div className="flex gap-3">
                        <div className="bg-orange-500/10 p-2 rounded h-min">
                          <Check className="h-5 w-5 text-orange-500" />
                        </div>
                        <div>
                          <h5 className="font-medium">Verification Process</h5>
                          <p className="text-sm text-muted-foreground">
                            Our team will review your application and contact you within 48 hours.
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex gap-3">
                        <div className="bg-orange-500/10 p-2 rounded h-min">
                          <Check className="h-5 w-5 text-orange-500" />
                        </div>
                        <div>
                          <h5 className="font-medium">Investment Options</h5>
                          <p className="text-sm text-muted-foreground">
                            You'll receive personalized investment plans based on your profile and preferences.
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex gap-3">
                        <div className="bg-orange-500/10 p-2 rounded h-min">
                          <Check className="h-5 w-5 text-orange-500" />
                        </div>
                        <div>
                          <h5 className="font-medium">Contract Signing</h5>
                          <p className="text-sm text-muted-foreground">
                            Once approved, you'll receive a digital contract to sign securely online.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </ScrollArea>
      </main>
    </div>
  );
}