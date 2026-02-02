import { useState, useEffect } from "react";
import { logger } from "../lib/logger";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { ScrollArea } from "../components/ui/scroll-area";
import { Header } from "../components/layout/header";
import { useUser } from "@clerk/clerk-react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Upload, UserPlus, Users, FileSpreadsheet, Loader2, Mail, Building2, Phone, X, 
  Send, Search, Filter, Globe, Briefcase, Eye, MousePointerClick, MessageSquare,
  ChevronLeft, ChevronRight, LayoutTemplate, Zap, Target, CheckCircle2, Sparkles,
  Music, Play, ArrowRight, Rocket, Star, Heart
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { db, auth } from "../lib/firebase";
import { collection, query, where, getDocs, addDoc, serverTimestamp } from "firebase/firestore";
import { useToast } from "../hooks/use-toast";
import { Progress } from "../components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Badge } from "../components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Checkbox } from "../components/ui/checkbox";

// Types for Industry Contacts
interface IndustryContact {
  id: number;
  fullName: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  personalEmail?: string;
  phone?: string;
  jobTitle?: string;
  headline?: string;
  seniorityLevel?: string;
  industry?: string;
  companyName?: string;
  companyWebsite?: string;
  companySize?: string;
  city?: string;
  state?: string;
  country?: string;
  linkedin?: string;
  category?: string;
  status?: string;
  emailsSent?: number;
  opensCount?: number;
  clicksCount?: number;
  lastContactedAt?: string;
}

interface QuotaInfo {
  remaining: number;
  sent: number;
  limit: number;
}

interface ContactStats {
  total: number;
  byCategory: { category: string; count: number }[];
  byStatus: { status: string; count: number }[];
}

// Category labels for display
const categoryLabels: Record<string, string> = {
  record_label: "🎵 Record Labels",
  publishing: "📝 Publishing",
  radio: "📻 Radio",
  tv: "📺 TV/Film",
  sync: "🎬 Sync/Licensing",
  studio: "🎙️ Studios",
  streaming: "📱 Streaming",
  live_events: "🎤 Live Events",
  pr_marketing: "📢 PR/Marketing",
  distribution: "📦 Distribution",
  other: "📁 Other"
};

// Status colors
const statusColors: Record<string, string> = {
  new: "bg-blue-500/20 text-blue-400",
  queued: "bg-yellow-500/20 text-yellow-400",
  contacted: "bg-purple-500/20 text-purple-400",
  opened: "bg-green-500/20 text-green-400",
  clicked: "bg-emerald-500/20 text-emerald-400",
  responded: "bg-teal-500/20 text-teal-400",
  not_interested: "bg-gray-500/20 text-gray-400",
  deal_in_progress: "bg-orange-500/20 text-orange-400",
  unsubscribed: "bg-red-500/20 text-red-400",
  bounced: "bg-red-500/20 text-red-400"
};

// Animated How It Works Component
function HowItWorksAnimation({ onClose }: { onClose: () => void }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  
  const steps = [
    {
      id: 1,
      title: "Select Your Artist",
      description: "Choose the artist profile you want to promote",
      icon: Music,
      color: "from-purple-500 to-violet-600",
      bgColor: "bg-purple-500/10",
      illustration: (
        <div className="relative w-full h-32 md:h-40 flex items-center justify-center">
          <motion.div 
            className="absolute w-20 h-20 md:w-24 md:h-24 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/30"
            animate={{ 
              scale: [1, 1.1, 1],
              rotate: [0, 5, -5, 0]
            }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Music className="w-10 h-10 md:w-12 md:h-12 text-white" />
          </motion.div>
          {[...Array(3)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-3 h-3 rounded-full bg-purple-400"
              initial={{ opacity: 0, scale: 0 }}
              animate={{ 
                opacity: [0, 1, 0],
                scale: [0, 1, 0],
                x: Math.cos(i * 2.1) * 60,
                y: Math.sin(i * 2.1) * 60
              }}
              transition={{ 
                duration: 2, 
                repeat: Infinity, 
                delay: i * 0.3 
              }}
            />
          ))}
        </div>
      )
    },
    {
      id: 2,
      title: "Preview Your Email",
      description: "See exactly how your personalized email will look",
      icon: Eye,
      color: "from-green-500 to-emerald-600",
      bgColor: "bg-green-500/10",
      illustration: (
        <div className="relative w-full h-32 md:h-40 flex items-center justify-center">
          <motion.div 
            className="relative w-48 md:w-56 h-28 md:h-32 rounded-lg bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 overflow-hidden shadow-xl"
            animate={{ y: [0, -5, 0] }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            {/* Email header */}
            <div className="h-6 bg-gradient-to-r from-green-500/20 to-emerald-500/20 flex items-center px-2 gap-1">
              <div className="w-2 h-2 rounded-full bg-red-400" />
              <div className="w-2 h-2 rounded-full bg-yellow-400" />
              <div className="w-2 h-2 rounded-full bg-green-400" />
            </div>
            {/* Email content lines */}
            <div className="p-2 space-y-1.5">
              <motion.div 
                className="h-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded w-3/4"
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
              <div className="h-1.5 bg-gray-700 rounded w-full" />
              <div className="h-1.5 bg-gray-700 rounded w-5/6" />
              <div className="h-1.5 bg-gray-700 rounded w-4/6" />
            </div>
            {/* Sparkle effect */}
            <motion.div
              className="absolute top-2 right-2"
              animate={{ rotate: [0, 360], scale: [1, 1.2, 1] }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              <Sparkles className="w-4 h-4 text-green-400" />
            </motion.div>
          </motion.div>
        </div>
      )
    },
    {
      id: 3,
      title: "Select Industry Contacts",
      description: "Choose from 700+ verified music industry professionals",
      icon: Users,
      color: "from-blue-500 to-cyan-600",
      bgColor: "bg-blue-500/10",
      illustration: (
        <div className="relative w-full h-32 md:h-40 flex items-center justify-center">
          <div className="flex gap-2 md:gap-3">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-14 h-16 md:w-16 md:h-20 rounded-lg bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/30 flex flex-col items-center justify-center gap-1"
                initial={{ opacity: 0, y: 20 }}
                animate={{ 
                  opacity: 1, 
                  y: 0,
                  scale: currentStep === 2 ? [1, 1.05, 1] : 1
                }}
                transition={{ delay: i * 0.2, duration: 0.5 }}
              >
                <div className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-gradient-to-br from-blue-400 to-cyan-400" />
                <div className="w-8 md:w-10 h-1 bg-gray-600 rounded" />
                <motion.div 
                  className="w-4 h-4 rounded border-2 border-blue-500 flex items-center justify-center"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 0.5, delay: 1 + i * 0.2 }}
                >
                  {i < 2 && <CheckCircle2 className="w-3 h-3 text-blue-500" />}
                </motion.div>
              </motion.div>
            ))}
          </div>
        </div>
      )
    },
    {
      id: 4,
      title: "Send & Track",
      description: "Launch your campaign with daily limits to protect your reputation",
      icon: Rocket,
      color: "from-pink-500 to-rose-600",
      bgColor: "bg-pink-500/10",
      illustration: (
        <div className="relative w-full h-32 md:h-40 flex items-center justify-center overflow-hidden">
          <motion.div
            className="relative"
            animate={{ 
              x: [0, 100, 100],
              y: [0, -50, -50],
              opacity: [1, 1, 0]
            }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
          >
            <div className="w-12 h-12 md:w-14 md:h-14 rounded-lg bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center shadow-lg shadow-pink-500/30">
              <Send className="w-6 h-6 md:w-7 md:h-7 text-white" />
            </div>
          </motion.div>
          {/* Trail particles */}
          {[...Array(5)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 rounded-full bg-pink-400"
              animate={{
                x: [-20 + i * 15, 80 + i * 15],
                y: [10 - i * 5, -40 - i * 5],
                opacity: [0, 1, 0],
                scale: [0, 1, 0]
              }}
              transition={{ 
                duration: 2, 
                repeat: Infinity, 
                delay: i * 0.1 + 0.2,
                repeatDelay: 1
              }}
            />
          ))}
          {/* Success checkmark */}
          <motion.div
            className="absolute right-4 md:right-8 top-4"
            initial={{ scale: 0 }}
            animate={{ scale: [0, 1.2, 1] }}
            transition={{ delay: 1.5, duration: 0.5, repeat: Infinity, repeatDelay: 2.5 }}
          >
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-green-500 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 md:w-7 md:h-7 text-white" />
            </div>
          </motion.div>
        </div>
      )
    }
  ];
  
  // Auto-advance steps
  useEffect(() => {
    if (!isAutoPlaying) return;
    const timer = setInterval(() => {
      setCurrentStep(prev => (prev + 1) % steps.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [isAutoPlaying, steps.length]);
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="relative w-full max-w-lg md:max-w-2xl bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 rounded-2xl border border-gray-700 overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Animated background gradient */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 via-transparent to-pink-500/20" />
          <motion.div
            className="absolute w-96 h-96 rounded-full bg-purple-500/10 blur-3xl"
            animate={{
              x: [-100, 100, -100],
              y: [-50, 50, -50]
            }}
            transition={{ duration: 10, repeat: Infinity }}
          />
        </div>
        
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-gray-800/80 flex items-center justify-center hover:bg-gray-700 transition-colors"
        >
          <X className="w-4 h-4 text-gray-400" />
        </button>
        
        {/* Header */}
        <div className="relative px-6 pt-6 pb-4 text-center">
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 mb-4"
          >
            <Sparkles className="w-4 h-4 text-purple-400" />
            <span className="text-sm font-medium text-purple-300">How It Works</span>
          </motion.div>
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
            Industry Outreach Made Easy
          </h2>
          <p className="text-gray-400 text-sm md:text-base">
            Connect with labels, publishers & sync opportunities in 4 simple steps
          </p>
        </div>
        
        {/* Step Content */}
        <div className="relative px-6 py-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="text-center"
            >
              {/* Step illustration */}
              <div className={`mx-auto mb-6 rounded-2xl ${steps[currentStep].bgColor} p-4`}>
                {steps[currentStep].illustration}
              </div>
              
              {/* Step info */}
              <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-r ${steps[currentStep].color} mb-4 shadow-lg`}>
                {(() => {
                  const Icon = steps[currentStep].icon;
                  return <Icon className="w-6 h-6 text-white" />;
                })()}
              </div>
              <h3 className="text-xl font-bold text-white mb-2">
                Step {steps[currentStep].id}: {steps[currentStep].title}
              </h3>
              <p className="text-gray-400 text-sm md:text-base max-w-md mx-auto">
                {steps[currentStep].description}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>
        
        {/* Step indicators */}
        <div className="flex justify-center gap-2 pb-4">
          {steps.map((step, i) => (
            <button
              key={step.id}
              onClick={() => {
                setCurrentStep(i);
                setIsAutoPlaying(false);
              }}
              className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                i === currentStep 
                  ? `bg-gradient-to-r ${step.color} w-8` 
                  : 'bg-gray-600 hover:bg-gray-500'
              }`}
            />
          ))}
        </div>
        
        {/* Navigation */}
        <div className="flex items-center justify-between px-6 pb-6 pt-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setCurrentStep(prev => (prev - 1 + steps.length) % steps.length);
              setIsAutoPlaying(false);
            }}
            className="text-gray-400 hover:text-white"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Previous
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsAutoPlaying(!isAutoPlaying)}
            className={isAutoPlaying ? 'text-purple-400' : 'text-gray-400'}
          >
            {isAutoPlaying ? '⏸ Pause' : '▶ Play'}
          </Button>
          
          {currentStep === steps.length - 1 ? (
            <Button
              onClick={onClose}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500"
            >
              Get Started
              <Rocket className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setCurrentStep(prev => (prev + 1) % steps.length);
                setIsAutoPlaying(false);
              }}
              className="text-gray-400 hover:text-white"
            >
              Next
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function ContactsPage() {
  const { toast } = useToast();
  const { isSignedIn, isLoaded, user } = useUser();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  
  // Tab state
  const [activeTab, setActiveTab] = useState("industry");
  
  // How it works animation state
  const [showHowItWorks, setShowHowItWorks] = useState(false);
  
  // Industry contacts state
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedContacts, setSelectedContacts] = useState<number[]>([]);
  const [selectedArtist, setSelectedArtist] = useState<number | null>(null);
  
  // Dialog states
  const [isSendDialogOpen, setIsSendDialogOpen] = useState(false);
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");

  // Redirect to auth if not signed in
  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      setLocation("/auth");
    }
  }, [isLoaded, isSignedIn, setLocation]);

  // Fetch industry contacts
  const { data: contactsData, isLoading: isLoadingContacts } = useQuery({
    queryKey: ["industry-contacts", currentPage, searchQuery, categoryFilter, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: "20",
        ...(searchQuery && { search: searchQuery }),
        ...(categoryFilter !== "all" && { category: categoryFilter }),
        ...(statusFilter !== "all" && { status: statusFilter })
      });
      
      const res = await fetch(`/api/outreach/contacts?${params}`);
      if (!res.ok) throw new Error("Failed to fetch contacts");
      return res.json();
    },
    enabled: isSignedIn
  });

  // Fetch quota
  const { data: quota } = useQuery<QuotaInfo>({
    queryKey: ["outreach-quota"],
    queryFn: async () => {
      const res = await fetch("/api/outreach/quota?userId=1");
      if (!res.ok) throw new Error("Failed to fetch quota");
      return res.json();
    },
    enabled: isSignedIn,
    refetchInterval: 30000
  });

  // Fetch stats
  const { data: stats } = useQuery<ContactStats>({
    queryKey: ["contacts-stats"],
    queryFn: async () => {
      const res = await fetch("/api/outreach/contacts/stats");
      if (!res.ok) throw new Error("Failed to fetch stats");
      return res.json();
    },
    enabled: isSignedIn
  });

  // Fetch filter options
  const { data: filterOptions } = useQuery({
    queryKey: ["filter-options"],
    queryFn: async () => {
      const res = await fetch("/api/outreach/contacts/filters");
      if (!res.ok) throw new Error("Failed to fetch filters");
      return res.json();
    },
    enabled: isSignedIn
  });

  // Fetch default templates
  const { data: defaultTemplates } = useQuery({
    queryKey: ["default-templates"],
    queryFn: async () => {
      const res = await fetch("/api/outreach/templates/defaults");
      if (!res.ok) throw new Error("Failed to fetch templates");
      return res.json();
    },
    enabled: isSignedIn
  });

  // Fetch user's artists - use the new outreach endpoint
  const { data: myArtists, isLoading: isLoadingArtists } = useQuery({
    queryKey: ["outreach-my-artists"],
    queryFn: async () => {
      const res = await fetch("/api/outreach/my-artists?userId=33");
      if (!res.ok) return [];
      return res.json();
    },
    enabled: isSignedIn
  });

  // State for email preview
  const [previewArtistId, setPreviewArtistId] = useState<number | null>(null);
  const [showEmailPreview, setShowEmailPreview] = useState(false);

  // Send email mutation
  const sendEmailMutation = useMutation({
    mutationFn: async ({ contactId, artistId }: { contactId: number; artistId?: number }) => {
      const res = await fetch("/api/outreach/send-single", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: 1,
          contactId,
          artistId,
          customSubject: emailSubject || undefined,
          customBody: emailBody || undefined
        })
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to send email");
      }
      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Email Sent! 🎉",
        description: `Remaining today: ${data.remaining} emails`
      });
      queryClient.invalidateQueries({ queryKey: ["industry-contacts"] });
      queryClient.invalidateQueries({ queryKey: ["outreach-quota"] });
      setSelectedContacts([]);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to send",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Send batch mutation
  const sendBatchMutation = useMutation({
    mutationFn: async ({ contactIds, artistId }: { contactIds: number[]; artistId?: number }) => {
      const res = await fetch("/api/outreach/send-batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: 1,
          contactIds,
          artistId
        })
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to send emails");
      }
      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Batch Sent! 🎉",
        description: `Sent: ${data.sent}, Failed: ${data.failed}, Queued for tomorrow: ${data.queued}`
      });
      queryClient.invalidateQueries({ queryKey: ["industry-contacts"] });
      queryClient.invalidateQueries({ queryKey: ["outreach-quota"] });
      setSelectedContacts([]);
      setIsSendDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to send batch",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Apply template
  const applyTemplate = (type: string) => {
    if (!defaultTemplates) return;
    const template = defaultTemplates[type];
    if (template) {
      setEmailSubject(template.subject);
      setEmailBody(template.bodyHtml);
      setIsTemplateDialogOpen(false);
      toast({
        title: "Template Applied",
        description: `Using "${type.replace('_', ' ')}" template`
      });
    }
  };

  // Toggle contact selection
  const toggleContactSelection = (id: number) => {
    setSelectedContacts(prev => 
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  };

  // Select all on current page
  const selectAllOnPage = () => {
    if (!contactsData?.contacts) return;
    const pageIds = contactsData.contacts.map((c: IndustryContact) => c.id);
    setSelectedContacts(prev => {
      const allSelected = pageIds.every((id: number) => prev.includes(id));
      if (allSelected) {
        return prev.filter(id => !pageIds.includes(id));
      }
      return [...new Set([...prev, ...pageIds])];
    });
  };

  // Show loading while checking auth
  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin h-8 w-8 border-2 border-purple-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!isSignedIn) return null;

  const contacts: IndustryContact[] = contactsData?.contacts || [];
  const pagination = contactsData?.pagination;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      {/* How It Works Animation Modal */}
      <AnimatePresence>
        {showHowItWorks && (
          <HowItWorksAnimation onClose={() => setShowHowItWorks(false)} />
        )}
      </AnimatePresence>
      
      <main className="flex-1 pt-20">
        <ScrollArea className="flex-1">
          <div className="container mx-auto px-4 py-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
              <div>
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-500 to-pink-500">
                    Music Industry Contacts
                  </h1>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowHowItWorks(true)}
                    className="group border-purple-500/30 hover:border-purple-500 hover:bg-purple-500/10"
                  >
                    <Sparkles className="w-4 h-4 mr-1.5 text-purple-400 group-hover:text-purple-300" />
                    <span className="text-purple-400 group-hover:text-purple-300">How it Works</span>
                  </Button>
                </div>
                <p className="text-muted-foreground mt-2">
                  {stats?.total?.toLocaleString() || 0} contacts • Outreach to labels, publishers & more
                </p>
              </div>
              
              {/* Quota Display */}
              <Card className="p-4 bg-gradient-to-r from-purple-900/20 to-pink-900/20 border-purple-500/30">
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-purple-400">{quota?.remaining || 0}</p>
                    <p className="text-xs text-muted-foreground">Emails Left Today</p>
                  </div>
                  <div className="h-10 w-px bg-purple-500/30" />
                  <div className="text-center">
                    <p className="text-2xl font-bold text-pink-400">{quota?.sent || 0}</p>
                    <p className="text-xs text-muted-foreground">Sent Today</p>
                  </div>
                  <div className="h-10 w-px bg-purple-500/30" />
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-400">{quota?.limit || 20}</p>
                    <p className="text-xs text-muted-foreground">Daily Limit</p>
                  </div>
                </div>
              </Card>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {stats?.byStatus?.slice(0, 4).map(stat => (
                <Card key={stat.status} className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground capitalize">{stat.status?.replace('_', ' ')}</p>
                      <p className="text-2xl font-bold">{stat.count}</p>
                    </div>
                    <Badge className={statusColors[stat.status] || "bg-gray-500/20"}>
                      {stat.status === 'opened' && <Eye className="h-3 w-3" />}
                      {stat.status === 'clicked' && <MousePointerClick className="h-3 w-3" />}
                      {stat.status === 'responded' && <MessageSquare className="h-3 w-3" />}
                      {stat.status === 'contacted' && <Mail className="h-3 w-3" />}
                    </Badge>
                  </div>
                </Card>
              ))}
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <TabsList className="bg-background border">
                <TabsTrigger value="industry" className="data-[state=active]:bg-purple-500/20">
                  <Globe className="h-4 w-4 mr-2" />
                  Industry Database
                </TabsTrigger>
                <TabsTrigger value="email-preview" className="data-[state=active]:bg-green-500/20">
                  <Mail className="h-4 w-4 mr-2" />
                  Email Preview
                </TabsTrigger>
                <TabsTrigger value="templates" className="data-[state=active]:bg-pink-500/20">
                  <LayoutTemplate className="h-4 w-4 mr-2" />
                  Email Templates
                </TabsTrigger>
                <TabsTrigger value="my-contacts" className="data-[state=active]:bg-orange-500/20">
                  <Users className="h-4 w-4 mr-2" />
                  My Contacts
                </TabsTrigger>
              </TabsList>

              {/* Email Preview Tab - Shows artists and their email templates */}
              <TabsContent value="email-preview" className="space-y-6">
                <Card className="p-6">
                  <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <Mail className="h-5 w-5 text-green-500" />
                    Artist Email Templates
                  </h3>
                  <p className="text-muted-foreground mb-6">
                    Select an artist to preview their personalized email template. Each template is automatically generated based on the artist's landing page data.
                  </p>
                  
                  {/* Artist Selection Grid */}
                  {isLoadingArtists ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-green-500" />
                    </div>
                  ) : !myArtists || myArtists.length === 0 ? (
                    <div className="text-center py-8 border-2 border-dashed border-muted-foreground/30 rounded-lg">
                      <Users className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                      <p className="text-muted-foreground">No artists found</p>
                      <p className="text-sm text-muted-foreground mt-1">Create an artist to generate email templates</p>
                      <Button 
                        variant="outline" 
                        className="mt-4"
                        onClick={() => setLocation('/my-artists')}
                      >
                        Go to My Artists
                      </Button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {myArtists.map((artist: any) => (
                        <Card 
                          key={artist.id} 
                          className={`p-4 cursor-pointer transition-all hover:border-green-500/50 ${
                            previewArtistId === artist.id ? 'border-green-500 bg-green-500/5' : ''
                          }`}
                          onClick={() => setPreviewArtistId(artist.id)}
                        >
                          <div className="flex items-center gap-4">
                            {artist.profileImage ? (
                              <img 
                                src={artist.profileImage} 
                                alt={artist.name}
                                className="w-16 h-16 rounded-full object-cover border-2 border-purple-500/50"
                              />
                            ) : (
                              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center text-white text-xl font-bold">
                                {artist.name?.charAt(0) || 'A'}
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold truncate">{artist.name || 'Unnamed Artist'}</h4>
                              <p className="text-sm text-muted-foreground truncate">
                                {artist.genres?.join(', ') || 'Music'}
                              </p>
                              {artist.isAIGenerated && (
                                <Badge className="mt-1 bg-purple-500/20 text-purple-400 text-xs">AI Generated</Badge>
                              )}
                            </div>
                            {previewArtistId === artist.id && (
                              <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                            )}
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                  
                  {/* Preview Button */}
                  {previewArtistId && (
                    <div className="mt-6 flex justify-center">
                      <Button 
                        className="bg-gradient-to-r from-green-600 to-emerald-600"
                        onClick={() => setShowEmailPreview(true)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Preview Email for Selected Artist
                      </Button>
                    </div>
                  )}
                </Card>
                
                {/* Email Preview Iframe */}
                {showEmailPreview && previewArtistId && (
                  <Card className="overflow-hidden">
                    <div className="flex items-center justify-between p-4 border-b bg-muted/50">
                      <div className="flex items-center gap-2">
                        <Mail className="h-5 w-5 text-green-500" />
                        <span className="font-semibold">Email Preview</span>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => window.open(`/api/outreach/artist-preview/${previewArtistId}`, '_blank')}
                        >
                          <Target className="h-4 w-4 mr-1" />
                          Open in New Tab
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => setShowEmailPreview(false)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <iframe 
                      src={`/api/outreach/artist-preview/${previewArtistId}`}
                      className="w-full h-[700px] border-0"
                      title="Email Preview"
                    />
                  </Card>
                )}
              </TabsContent>

              {/* Industry Database Tab */}
              <TabsContent value="industry" className="space-y-4">
                {/* Filters & Actions Bar */}
                <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                  <div className="flex flex-wrap gap-3 items-center">
                    {/* Search */}
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search contacts..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 w-64"
                      />
                    </div>
                    
                    {/* Category Filter */}
                    <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                      <SelectTrigger className="w-48">
                        <SelectValue placeholder="All Categories" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        {Object.entries(categoryLabels).map(([key, label]) => (
                          <SelectItem key={key} value={key}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    
                    {/* Status Filter */}
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="All Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="new">New</SelectItem>
                        <SelectItem value="contacted">Contacted</SelectItem>
                        <SelectItem value="opened">Opened</SelectItem>
                        <SelectItem value="responded">Responded</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {/* Actions */}
                  <div className="flex gap-2">
                    {selectedContacts.length > 0 && (
                      <Button
                        onClick={() => setIsSendDialogOpen(true)}
                        className="bg-gradient-to-r from-purple-600 to-pink-600"
                        disabled={!quota || quota.remaining === 0}
                      >
                        <Send className="h-4 w-4 mr-2" />
                        Send to {selectedContacts.length} ({quota?.remaining || 0} left)
                      </Button>
                    )}
                    <Button variant="outline" onClick={selectAllOnPage}>
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      {contacts.every(c => selectedContacts.includes(c.id)) ? "Deselect All" : "Select Page"}
                    </Button>
                  </div>
                </div>

                {/* Contacts Table */}
                {isLoadingContacts ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
                  </div>
                ) : contacts.length === 0 ? (
                  <Card className="p-12 text-center">
                    <Users className="h-12 w-12 mx-auto text-muted-foreground" />
                    <h3 className="mt-4 text-lg font-semibold">No Contacts Found</h3>
                    <p className="text-muted-foreground mt-2">
                      Try adjusting your filters or import contacts
                    </p>
                  </Card>
                ) : (
                  <Card className="overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-muted/50">
                          <tr>
                            <th className="p-3 text-left w-10">
                              <Checkbox 
                                checked={contacts.every(c => selectedContacts.includes(c.id))}
                                onCheckedChange={selectAllOnPage}
                              />
                            </th>
                            <th className="p-3 text-left">Contact</th>
                            <th className="p-3 text-left">Company</th>
                            <th className="p-3 text-left">Category</th>
                            <th className="p-3 text-left">Status</th>
                            <th className="p-3 text-left">Stats</th>
                            <th className="p-3 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {contacts.map((contact) => (
                            <tr 
                              key={contact.id} 
                              className={`border-t hover:bg-muted/30 transition-colors ${
                                selectedContacts.includes(contact.id) ? "bg-purple-500/10" : ""
                              }`}
                            >
                              <td className="p-3">
                                <Checkbox 
                                  checked={selectedContacts.includes(contact.id)}
                                  onCheckedChange={() => toggleContactSelection(contact.id)}
                                />
                              </td>
                              <td className="p-3">
                                <div>
                                  <p className="font-medium">{contact.fullName}</p>
                                  <p className="text-sm text-muted-foreground">{contact.jobTitle}</p>
                                  <p className="text-xs text-purple-400">{contact.email || contact.personalEmail}</p>
                                </div>
                              </td>
                              <td className="p-3">
                                <div>
                                  <p className="font-medium">{contact.companyName}</p>
                                  <p className="text-sm text-muted-foreground">
                                    {contact.city}{contact.country ? `, ${contact.country}` : ""}
                                  </p>
                                </div>
                              </td>
                              <td className="p-3">
                                <Badge variant="outline" className="text-xs">
                                  {categoryLabels[contact.category || "other"] || contact.category}
                                </Badge>
                              </td>
                              <td className="p-3">
                                <Badge className={statusColors[contact.status || "new"]}>
                                  {contact.status?.replace('_', ' ')}
                                </Badge>
                              </td>
                              <td className="p-3">
                                <div className="flex gap-3 text-xs text-muted-foreground">
                                  <span title="Emails Sent">
                                    <Mail className="h-3 w-3 inline mr-1" />
                                    {contact.emailsSent || 0}
                                  </span>
                                  <span title="Opens">
                                    <Eye className="h-3 w-3 inline mr-1" />
                                    {contact.opensCount || 0}
                                  </span>
                                  <span title="Clicks">
                                    <MousePointerClick className="h-3 w-3 inline mr-1" />
                                    {contact.clicksCount || 0}
                                  </span>
                                </div>
                              </td>
                              <td className="p-3 text-right">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setSelectedContacts([contact.id]);
                                    setIsSendDialogOpen(true);
                                  }}
                                  disabled={!quota || quota.remaining === 0 || !contact.email && !contact.personalEmail}
                                >
                                  <Send className="h-3 w-3 mr-1" />
                                  Send
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    
                    {/* Pagination */}
                    {pagination && pagination.totalPages > 1 && (
                      <div className="flex items-center justify-between p-4 border-t">
                        <p className="text-sm text-muted-foreground">
                          Page {pagination.page} of {pagination.totalPages} • {pagination.total} total contacts
                        </p>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage(p => p - 1)}
                          >
                            <ChevronLeft className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={currentPage >= pagination.totalPages}
                            onClick={() => setCurrentPage(p => p + 1)}
                          >
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </Card>
                )}
              </TabsContent>

              {/* Templates Tab */}
              <TabsContent value="templates" className="space-y-4">
                <div className="grid md:grid-cols-3 gap-4">
                  {/* Artist Introduction Template */}
                  <Card className="p-6 hover:border-purple-500/50 transition-colors cursor-pointer" onClick={() => applyTemplate('artist_intro')}>
                    <div className="h-12 w-12 rounded-lg bg-purple-500/20 flex items-center justify-center mb-4">
                      <Target className="h-6 w-6 text-purple-400" />
                    </div>
                    <h3 className="font-semibold mb-2">Artist Introduction</h3>
                    <p className="text-sm text-muted-foreground">
                      Professional introduction email for presenting your artist to labels and publishers.
                    </p>
                    <Button variant="outline" className="mt-4 w-full">Use Template</Button>
                  </Card>
                  
                  {/* Sync Opportunity Template */}
                  <Card className="p-6 hover:border-pink-500/50 transition-colors cursor-pointer" onClick={() => applyTemplate('sync_opportunity')}>
                    <div className="h-12 w-12 rounded-lg bg-pink-500/20 flex items-center justify-center mb-4">
                      <Zap className="h-6 w-6 text-pink-400" />
                    </div>
                    <h3 className="font-semibold mb-2">Sync Opportunity</h3>
                    <p className="text-sm text-muted-foreground">
                      Perfect for reaching out to music supervisors and sync licensing opportunities.
                    </p>
                    <Button variant="outline" className="mt-4 w-full">Use Template</Button>
                  </Card>
                  
                  {/* Follow Up Template */}
                  <Card className="p-6 hover:border-orange-500/50 transition-colors cursor-pointer" onClick={() => applyTemplate('follow_up')}>
                    <div className="h-12 w-12 rounded-lg bg-orange-500/20 flex items-center justify-center mb-4">
                      <MessageSquare className="h-6 w-6 text-orange-400" />
                    </div>
                    <h3 className="font-semibold mb-2">Follow Up</h3>
                    <p className="text-sm text-muted-foreground">
                      Simple follow-up email for contacts who haven't responded to your initial outreach.
                    </p>
                    <Button variant="outline" className="mt-4 w-full">Use Template</Button>
                  </Card>
                </div>
                
                {/* Custom Template Editor */}
                <Card className="p-6">
                  <h3 className="font-semibold mb-4">Custom Email</h3>
                  <div className="space-y-4">
                    <div>
                      <Label>Subject Line</Label>
                      <Input
                        value={emailSubject}
                        onChange={(e) => setEmailSubject(e.target.value)}
                        placeholder="🎵 Introducing {{artist_name}} - A Rising Star"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Available variables: {"{{artist_name}}, {{contact_name}}, {{company_name}}, {{genre}}"}
                      </p>
                    </div>
                    <div>
                      <Label>Email Body (HTML)</Label>
                      <Textarea
                        value={emailBody}
                        onChange={(e) => setEmailBody(e.target.value)}
                        placeholder="Hi {{contact_name}},&#10;&#10;I wanted to introduce you to..."
                        className="min-h-[200px] font-mono text-sm"
                      />
                    </div>
                  </div>
                </Card>
              </TabsContent>

              {/* My Contacts Tab (Original) */}
              <TabsContent value="my-contacts">
                <Card className="p-8 text-center">
                  <Users className="h-12 w-12 mx-auto text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-semibold">Personal Contacts</h3>
                  <p className="text-muted-foreground mt-2">
                    Your manually added contacts and imports are stored here.
                  </p>
                  <Button className="mt-4 bg-orange-500 hover:bg-orange-600">
                    <UserPlus className="mr-2 h-4 w-4" />
                    Add Contact
                  </Button>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </ScrollArea>
      </main>

      {/* Send Email Dialog */}
      <Dialog open={isSendDialogOpen} onOpenChange={setIsSendDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Send Outreach Email</DialogTitle>
            <DialogDescription>
              Send promotional emails to {selectedContacts.length} selected contact(s)
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {/* Select Artist */}
            <div>
              <Label>Select Artist to Promote</Label>
              <Select value={selectedArtist?.toString() || ""} onValueChange={(v) => setSelectedArtist(parseInt(v))}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose an artist..." />
                </SelectTrigger>
                <SelectContent>
                  {myArtists?.map((artist: any) => (
                    <SelectItem key={artist.id} value={artist.id.toString()}>
                      {artist.artistName || artist.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* Template Selection */}
            <div>
              <Label>Email Template</Label>
              <div className="grid grid-cols-3 gap-2 mt-2">
                <Button variant="outline" size="sm" onClick={() => applyTemplate('artist_intro')}>
                  Artist Intro
                </Button>
                <Button variant="outline" size="sm" onClick={() => applyTemplate('sync_opportunity')}>
                  Sync Pitch
                </Button>
                <Button variant="outline" size="sm" onClick={() => applyTemplate('follow_up')}>
                  Follow Up
                </Button>
              </div>
            </div>
            
            {/* Preview */}
            {emailSubject && (
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-sm font-medium">Subject: {emailSubject.substring(0, 60)}...</p>
              </div>
            )}
            
            {/* Quota Warning */}
            {quota && quota.remaining < selectedContacts.length && (
              <div className="p-3 bg-yellow-500/20 border border-yellow-500/30 rounded-lg">
                <p className="text-sm text-yellow-400">
                  ⚠️ Only {quota.remaining} emails remaining today. {selectedContacts.length - quota.remaining} will be queued for tomorrow.
                </p>
              </div>
            )}
          </div>
          
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setIsSendDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => sendBatchMutation.mutate({ 
                contactIds: selectedContacts, 
                artistId: selectedArtist || undefined 
              })}
              disabled={sendBatchMutation.isPending || !quota || quota.remaining === 0}
              className="bg-gradient-to-r from-purple-600 to-pink-600"
            >
              {sendBatchMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              Send {Math.min(selectedContacts.length, quota?.remaining || 0)} Emails
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
