import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Label } from "../components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Checkbox } from "../components/ui/checkbox";
import { Badge } from "../components/ui/badge";
import { Progress } from "../components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../components/ui/tooltip";
import { useToast } from "../hooks/use-toast";
import { useAuth } from "../hooks/use-auth";
import { Header } from "../components/layout/header";
import { apiRequest, queryClient } from "../lib/queryClient";
import { motion, AnimatePresence } from "framer-motion";
import {
  Rocket,
  Radio,
  Tv,
  Mic,
  Globe,
  Mail,
  Phone,
  TrendingUp,
  Calendar,
  CheckCircle,
  Clock,
  Pause,
  Play,
  Music,
  Video,
  Users,
  Megaphone,
  Target,
  ArrowRight,
  Loader2,
  Eye,
  MessageSquare,
  Star,
  Sparkles,
  Wand2,
  Image as ImageIcon,
  Copy,
  Download,
  Search,
  Filter,
  BarChart3,
  Lightbulb,
  Save,
  RefreshCw
} from "lucide-react";
import prHeroImage from "../../../attached_assets/generated_images/PR_Agent_Hero_Image_d3c922a5.png";

interface PRCampaign {
  id: number;
  userId: number;
  title: string;
  artistName: string;
  artistProfileUrl: string;
  contentType: "single" | "album" | "video" | "tour" | "announcement";
  contentTitle: string;
  contentUrl: string;
  targetMediaTypes: string[];
  targetCountries: string[];
  targetGenres: string[];
  pitchMessage: string;
  contactEmail: string;
  contactPhone: string;
  status: "draft" | "active" | "paused" | "completed";
  mediaContacted: number;
  emailsOpened: number;
  mediaReplied: number;
  interviewsBooked: number;
  createdAt: string;
  updatedAt: string;
}

interface WebhookEvent {
  id: number;
  campaignId: number;
  eventType: "email_sent" | "email_opened" | "media_replied" | "interview_booked";
  mediaName: string;
  mediaEmail: string;
  notes: string;
  createdAt: string;
}

const CONTENT_TYPES = [
  { value: "single", label: "Single", icon: Music },
  { value: "album", label: "Album", icon: Music },
  { value: "video", label: "Music Video", icon: Video },
  { value: "tour", label: "Tour/Concert", icon: Users },
  { value: "announcement", label: "Announcement", icon: Megaphone }
];

const MEDIA_TYPES = [
  { value: "radio", label: "Radio", icon: Radio },
  { value: "tv", label: "TV", icon: Tv },
  { value: "podcast", label: "Podcast", icon: Mic },
  { value: "blog", label: "Blog", icon: Globe },
  { value: "magazine", label: "Magazine", icon: Globe }
];

const COUNTRIES = [
  "USA", "Mexico", "Colombia", "Argentina", "Spain", "Chile", 
  "Peru", "Ecuador", "Venezuela", "Puerto Rico", "Dominican Republic"
];

const GENRES = [
  "Urban", "Latin Pop", "Reggaeton", "Trap", "Salsa", "Bachata",
  "Regional Mexican", "Cumbia", "Dembow", "Electronic", "Hip Hop"
];

export default function PRPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [activeView, setActiveView] = useState<"list" | "wizard" | "campaign" | "templates" | "compare">("list");
  const [wizardStep, setWizardStep] = useState(1);
  const [selectedCampaign, setSelectedCampaign] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "draft" | "active" | "paused" | "completed">("all");
  const [selectedCampaigns, setSelectedCampaigns] = useState<number[]>([]);
  const [draftSaved, setDraftSaved] = useState(false);
  const [compareCampaigns, setCompareCampaigns] = useState<number[]>([]);
  
  const [formData, setFormData] = useState({
    title: "",
    artistName: user?.artistName || "",
    artistProfileUrl: user?.slug ? `${window.location.origin}/artist/${user.slug}` : "",
    contentType: "single" as const,
    contentTitle: "",
    contentUrl: "",
    targetMediaTypes: [] as string[],
    targetCountries: [] as string[],
    targetGenres: [] as string[],
    pitchMessage: "",
    contactEmail: user?.email || "",
    contactPhone: "",
    campaignImage: ""
  });
  const [generatingImage, setGeneratingImage] = useState(false);

  // AUTO-SAVE FUNCTIONALITY (Improvement #1)
  useEffect(() => {
    const autoSaveTimer = setInterval(() => {
      if (activeView === "wizard" && (formData.title || formData.contentTitle)) {
        localStorage.setItem('pr_draft', JSON.stringify(formData));
        setDraftSaved(true);
        setTimeout(() => setDraftSaved(false), 2000);
      }
    }, 30000);
    return () => clearInterval(autoSaveTimer);
  }, [formData, activeView]);

  const { data: campaignsData, isLoading } = useQuery<{ success: boolean; campaigns: PRCampaign[] }>({
    queryKey: ['/api/pr/campaigns'],
    enabled: !!user
  });

  const { data: campaignDetails, isLoading: isLoadingDetails } = useQuery<{
    success: boolean;
    campaign: PRCampaign;
    events: WebhookEvent[];
  }>({
    queryKey: ['/api/pr/campaigns', selectedCampaign],
    enabled: !!selectedCampaign
  });

  const createCampaignMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      return apiRequest('/api/pr/campaigns', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },
    onSuccess: () => {
      toast({
        title: "Campaign created!",
        description: "Your PR campaign has been created successfully."
      });
      queryClient.invalidateQueries({ queryKey: ['/api/pr/campaigns'] });
      setActiveView("list");
      resetForm();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create campaign. Please try again.",
        variant: "destructive"
      });
    }
  });

  const activateCampaignMutation = useMutation({
    mutationFn: async (campaignId: number) => {
      return apiRequest(`/api/pr/campaigns/${campaignId}/activate`, {
        method: 'POST'
      });
    },
    onSuccess: (data: any) => {
      toast({
        title: "Campaign activated!",
        description: `${data.mediaCount || 0} media outlets will be contacted automatically.`
      });
      queryClient.invalidateQueries({ queryKey: ['/api/pr/campaigns'] });
      queryClient.invalidateQueries({ queryKey: ['/api/pr/campaigns', selectedCampaign] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to activate campaign.",
        variant: "destructive"
      });
    }
  });

  const pauseCampaignMutation = useMutation({
    mutationFn: async (campaignId: number) => {
      return apiRequest(`/api/pr/campaigns/${campaignId}/pause`, {
        method: 'POST'
      });
    },
    onSuccess: () => {
      toast({
        title: "Campaign paused",
        description: "The campaign has been paused successfully."
      });
      queryClient.invalidateQueries({ queryKey: ['/api/pr/campaigns'] });
      queryClient.invalidateQueries({ queryKey: ['/api/pr/campaigns', selectedCampaign] });
    }
  });

  // GENERATE IMAGE MUTATION
  const generateImageMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('/api/pr/generate-image', {
        method: 'POST',
        body: JSON.stringify({
          artistName: formData.artistName,
          contentType: formData.contentType,
          contentTitle: formData.contentTitle,
          genres: formData.targetGenres
        })
      });
    },
    onSuccess: (data: any) => {
      if (data.image) {
        setFormData({ ...formData, campaignImage: JSON.stringify(data.image) });
        toast({
          title: "Image generated!",
          description: "AI-powered campaign image created successfully."
        });
      }
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to generate image. Try again.",
        variant: "destructive"
      });
    }
  });

  const generatePitchMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('/api/pr-ai/generate-pitch', {
        method: 'POST',
        body: JSON.stringify({
          artistName: formData.artistName,
          contentType: formData.contentType,
          contentTitle: formData.contentTitle,
          genre: formData.targetGenres[0] || 'urban',
          biography: user?.biography || ''
        })
      });
    },
    onSuccess: (data: any) => {
      if (data.pitch) {
        setFormData({ ...formData, pitchMessage: data.pitch });
        toast({
          title: "Pitch generated!",
          description: "The message has been generated with AI."
        });
      }
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to generate pitch. Please try again.",
        variant: "destructive"
      });
    }
  });

  const improvePitchMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('/api/pr-ai/improve-text', {
        method: 'POST',
        body: JSON.stringify({
          text: formData.pitchMessage,
          context: 'communication with music media'
        })
      });
    },
    onSuccess: (data: any) => {
      if (data.improvedText) {
        setFormData({ ...formData, pitchMessage: data.improvedText });
        toast({
          title: "Text improved!",
          description: "The message has been optimized with AI."
        });
      }
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to improve text.",
        variant: "destructive"
      });
    }
  });

  const suggestTitleMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('/api/pr-ai/suggest-campaign-title', {
        method: 'POST',
        body: JSON.stringify({
          artistName: formData.artistName,
          contentType: formData.contentType,
          contentTitle: formData.contentTitle
        })
      });
    },
    onSuccess: (data: any) => {
      if (data.suggestions && data.suggestions.length > 0) {
        setFormData({ ...formData, title: data.suggestions[0] });
        toast({
          title: "Title suggested!",
          description: "You can edit it if you wish."
        });
      }
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to generate title.",
        variant: "destructive"
      });
    }
  });

  const resetForm = () => {
    setFormData({
      title: "",
      artistName: user?.artistName || "",
      artistProfileUrl: user?.slug ? `${window.location.origin}/artist/${user.slug}` : "",
      contentType: "single",
      contentTitle: "",
      contentUrl: "",
      targetMediaTypes: [],
      targetCountries: [],
      targetGenres: [],
      pitchMessage: "",
      contactEmail: user?.email || "",
      contactPhone: ""
    });
    localStorage.removeItem('pr_draft');
    setWizardStep(1);
  };

  // EXPORT TO CSV (Improvement #3)
  const exportToCSV = () => {
    if (!campaignsData?.campaigns) return;
    const csv = [
      ['Title', 'Artist', 'Status', 'Contacted', 'Opened', 'Replied', 'Interviews'],
      ...campaignsData.campaigns.map(c => [
        c.title, c.artistName, c.status, c.mediaContacted, 
        c.emailsOpened, c.mediaReplied, c.interviewsBooked
      ])
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `campaigns_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    toast({ title: "Downloaded!", description: "Campaigns exported to CSV" });
  };

  // DUPLICATE CAMPAIGN (Improvement #2)
  const duplicateCampaign = (campaign: PRCampaign) => {
    setFormData({
      title: `${campaign.title} (Copy)`,
      artistName: campaign.artistName,
      artistProfileUrl: campaign.artistProfileUrl,
      contentType: campaign.contentType,
      contentTitle: campaign.contentTitle,
      contentUrl: campaign.contentUrl,
      targetMediaTypes: [...campaign.targetMediaTypes],
      targetCountries: [...campaign.targetCountries],
      targetGenres: [...campaign.targetGenres],
      pitchMessage: campaign.pitchMessage,
      contactEmail: campaign.contactEmail,
      contactPhone: campaign.contactPhone
    });
    setActiveView("wizard");
    setWizardStep(1);
    toast({ title: "Campaign loaded", description: "Edit and save as new campaign" });
  };

  // FILTERED CAMPAIGNS (Improvement #4)
  const filteredCampaigns = campaignsData?.campaigns?.filter(c => {
    const matchesSearch = c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         c.artistName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === "all" || c.status === filterStatus;
    return matchesSearch && matchesStatus;
  }) || [];

  // KEYBOARD SHORTCUTS (Improvement #10)
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setActiveView('wizard');
        setWizardStep(1);
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'e') {
        e.preventDefault();
        exportToCSV();
      }
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [campaignsData]);

  const handleWizardNext = () => {
    if (wizardStep < 5) {
      setWizardStep(wizardStep + 1);
    } else {
      createCampaignMutation.mutate(formData);
    }
  };

  const handleWizardBack = () => {
    if (wizardStep > 1) {
      setWizardStep(wizardStep - 1);
    } else {
      setActiveView("list");
      resetForm();
    }
  };

  const toggleArrayValue = (array: string[], value: string, setter: (arr: string[]) => void) => {
    if (array.includes(value)) {
      setter(array.filter(v => v !== value));
    } else {
      setter([...array, value]);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      draft: { label: "Draft", variant: "secondary" as const, icon: Clock },
      active: { label: "Active", variant: "default" as const, icon: Play },
      paused: { label: "Paused", variant: "outline" as const, icon: Pause },
      completed: { label: "Completed", variant: "default" as const, icon: CheckCircle }
    };
    const config = statusConfig[status as keyof typeof statusConfig];
    const Icon = config.icon;
    return (
      <Badge variant={config.variant} className="gap-1" data-testid={`badge-status-${status}`}>
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  };

  const getEventIcon = (eventType: string) => {
    const icons = {
      email_sent: Mail,
      email_opened: Eye,
      media_replied: MessageSquare,
      interview_booked: Star
    };
    return icons[eventType as keyof typeof icons] || Mail;
  };

  const getEventLabel = (eventType: string) => {
    const labels = {
      email_sent: "Email sent",
      email_opened: "Email opened",
      media_replied: "Media replied",
      interview_booked: "Interview booked"
    };
    return labels[eventType as keyof typeof labels] || eventType;
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Authentication required</CardTitle>
              <CardDescription>
                You must be logged in to access the PR Agent
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-slate-950/20">
      <Header />
      
      <div className="container mx-auto px-4 py-12 max-w-7xl">
        {activeView === "list" && (
          <>
            {/* HERO SECTION - MODERN DESIGN */}
            <motion.div 
              className="relative rounded-2xl overflow-hidden mb-12 h-72 bg-cover bg-center shadow-2xl"
              style={{ backgroundImage: `url(${prHeroImage})` }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-slate-900/95 via-slate-900/80 to-blue-900/40 flex items-center">
                <div className="px-8 md:px-12 text-white max-w-2xl">
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
                    <div className="inline-block mb-4 px-4 py-2 bg-blue-600/30 border border-blue-400/50 rounded-full text-sm font-semibold text-blue-200">
                      ✨ AI-Powered Outreach
                    </div>
                  </motion.div>
                  <motion.h1 
                    className="text-5xl md:text-6xl font-black mb-4 tracking-tight" 
                    data-testid="text-hero-title"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    Automated PR Agent
                  </motion.h1>
                  <motion.p 
                    className="text-lg md:text-xl mb-8 text-blue-100/80 font-light" 
                    data-testid="text-hero-description"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                  >
                    Reach radio, podcasts, TV and media outlets instantly. No complications.
                  </motion.p>
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                  >
                    <Button 
                      size="lg" 
                      className="gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 px-8 py-6 text-base"
                      onClick={() => setActiveView("wizard")}
                      data-testid="button-new-campaign"
                    >
                      <Rocket className="w-5 h-5" />
                      Start New Campaign
                    </Button>
                  </motion.div>
                </div>
              </div>
            </motion.div>

            {/* STATS DASHBOARD - PREMIUM DESIGN */}
            {campaignsData?.campaigns && campaignsData.campaigns.length > 0 && (
              <motion.div 
                className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
              >
                <motion.div 
                  initial={{ opacity: 0, y: 20 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  className="bg-gradient-to-br from-blue-600/20 via-blue-500/10 to-transparent rounded-xl p-5 border border-blue-500/30 hover:border-blue-400/50 hover:bg-blue-600/25 transition-all duration-300 group"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2.5 bg-blue-600/30 rounded-lg group-hover:bg-blue-600/50 transition-colors">
                      <BarChart3 className="w-5 h-5 text-blue-400" />
                    </div>
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Total Campaigns</span>
                  </div>
                  <div className="text-3xl font-black text-blue-300">{campaignsData.campaigns.length}</div>
                </motion.div>
                
                <motion.div 
                  initial={{ opacity: 0, y: 20 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  transition={{ delay: 0.1 }}
                  className="bg-gradient-to-br from-green-600/20 via-green-500/10 to-transparent rounded-xl p-5 border border-green-500/30 hover:border-green-400/50 hover:bg-green-600/25 transition-all duration-300 group"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2.5 bg-green-600/30 rounded-lg group-hover:bg-green-600/50 transition-colors">
                      <Play className="w-5 h-5 text-green-400" />
                    </div>
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Active</span>
                  </div>
                  <div className="text-3xl font-black text-green-300">{campaignsData.campaigns.filter(c => c.status === 'active').length}</div>
                </motion.div>
                
                <motion.div 
                  initial={{ opacity: 0, y: 20 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  transition={{ delay: 0.2 }}
                  className="bg-gradient-to-br from-orange-600/20 via-orange-500/10 to-transparent rounded-xl p-5 border border-orange-500/30 hover:border-orange-400/50 hover:bg-orange-600/25 transition-all duration-300 group"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2.5 bg-orange-600/30 rounded-lg group-hover:bg-orange-600/50 transition-colors">
                      <Mail className="w-5 h-5 text-orange-400" />
                    </div>
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Contacted</span>
                  </div>
                  <div className="text-3xl font-black text-orange-300">{campaignsData.campaigns.reduce((a, c) => a + c.mediaContacted, 0)}</div>
                </motion.div>
                
                <motion.div 
                  initial={{ opacity: 0, y: 20 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  transition={{ delay: 0.3 }}
                  className="bg-gradient-to-br from-purple-600/20 via-purple-500/10 to-transparent rounded-xl p-5 border border-purple-500/30 hover:border-purple-400/50 hover:bg-purple-600/25 transition-all duration-300 group"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2.5 bg-purple-600/30 rounded-lg group-hover:bg-purple-600/50 transition-colors">
                      <Star className="w-5 h-5 text-purple-400" />
                    </div>
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Interviews</span>
                  </div>
                  <div className="text-3xl font-black text-purple-300">{campaignsData.campaigns.reduce((a, c) => a + c.interviewsBooked, 0)}</div>
                </motion.div>
              </motion.div>
            )}

            <div className="mb-10">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-3xl font-black bg-gradient-to-r from-slate-100 to-slate-300 bg-clip-text text-transparent">My Campaigns</h2>
                  <p className="text-sm text-slate-400 mt-1">Manage and track all your PR campaigns</p>
                </div>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={exportToCSV} 
                          className="gap-2 bg-slate-800/50 border-slate-700/50 hover:bg-slate-700/50 hover:border-slate-600 text-slate-200 transition-all"
                        >
                          <Download className="w-4 h-4" />
                          Export (⌘E)
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Export all campaigns to CSV</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </motion.div>
              </div>
              
              {/* SEARCH & FILTER - MODERN DESIGN */}
              <motion.div 
                className="flex gap-3 mb-6"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
              >
                <div className="flex-1 relative group">
                  <Search className="absolute left-4 top-3.5 w-5 h-5 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
                  <Input 
                    placeholder="Search by title or artist..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-12 bg-slate-800/50 border-slate-700/50 hover:border-slate-600 focus:border-blue-500 focus:bg-slate-800/80 text-slate-100 placeholder:text-slate-500 transition-all"
                  />
                </div>
                <Select value={filterStatus} onValueChange={(v: any) => setFilterStatus(v)}>
                  <SelectTrigger className="w-48 bg-slate-800/50 border-slate-700/50 hover:border-slate-600 text-slate-100"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="draft">📝 Draft</SelectItem>
                    <SelectItem value="active">🚀 Active</SelectItem>
                    <SelectItem value="paused">⏸ Paused</SelectItem>
                    <SelectItem value="completed">✓ Completed</SelectItem>
                  </SelectContent>
                </Select>
              </motion.div>
              
              {isLoading ? (
                <div className="space-y-4">
                  {[1,2,3].map(i => (
                    <div key={i} className="bg-muted animate-pulse h-32 rounded-lg" />
                  ))}
                </div>
              ) : filteredCampaigns.length > 0 ? (
                <AnimatePresence>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {filteredCampaigns.map((campaign, idx) => (
                      <motion.div
                        key={campaign.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ delay: idx * 0.1 }}
                      >
                        <Card 
                          className="hover:shadow-2xl hover:shadow-blue-500/20 hover:scale-105 transition-all duration-300 cursor-pointer bg-gradient-to-br from-slate-800/40 via-slate-800/20 to-slate-900/40 border-slate-700/50 hover:border-blue-500/50 backdrop-blur hover:bg-slate-800/60 group"
                          onClick={() => {
                            setSelectedCampaign(campaign.id);
                            setActiveView("campaign");
                          }}
                          data-testid={`card-campaign-${campaign.id}`}
                        >
                          <CardHeader className="pb-3">
                            <div className="flex items-start justify-between mb-3 group-hover:translate-x-1 transition-transform">
                              <CardTitle className="text-xl font-black bg-gradient-to-r from-blue-300 to-blue-100 bg-clip-text text-transparent" data-testid={`text-campaign-title-${campaign.id}`}>
                                {campaign.title}
                              </CardTitle>
                              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                {getStatusBadge(campaign.status)}
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button size="sm" variant="ghost" onClick={(e: any) => { e.stopPropagation(); duplicateCampaign(campaign); }}>
                                        <Copy className="w-4 h-4" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Duplicate campaign</TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              </div>
                            </div>
                            <CardDescription data-testid={`text-campaign-content-${campaign.id}`}>
                              {campaign.contentTitle}
                            </CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="grid grid-cols-2 gap-3 text-sm">
                              <motion.div className="bg-blue-600/20 rounded-lg p-3 border border-blue-500/30 hover:border-blue-400/50 hover:bg-blue-600/30 transition-all">
                                <div className="text-xs font-semibold text-slate-300 uppercase tracking-wide mb-1">📧 Sent</div>
                                <div className="text-2xl font-black text-blue-300" data-testid={`text-contacted-${campaign.id}`}>
                                  {campaign.mediaContacted}
                                </div>
                              </motion.div>
                              <motion.div className="bg-green-600/20 rounded-lg p-3 border border-green-500/30 hover:border-green-400/50 hover:bg-green-600/30 transition-all">
                                <div className="text-xs font-semibold text-slate-300 uppercase tracking-wide mb-1">👀 Opened</div>
                                <div className="text-2xl font-black text-green-300" data-testid={`text-opened-${campaign.id}`}>
                                  {campaign.emailsOpened}
                                </div>
                              </motion.div>
                              <motion.div className="bg-orange-600/20 rounded-lg p-3 border border-orange-500/30 hover:border-orange-400/50 hover:bg-orange-600/30 transition-all">
                                <div className="text-xs font-semibold text-slate-300 uppercase tracking-wide mb-1">💬 Replies</div>
                                <div className="text-2xl font-black text-orange-300" data-testid={`text-replied-${campaign.id}`}>
                                  {campaign.mediaReplied}
                                </div>
                              </motion.div>
                              <motion.div className="bg-purple-600/20 rounded-lg p-3 border border-purple-500/30 hover:border-purple-400/50 hover:bg-purple-600/30 transition-all">
                                <div className="text-xs font-semibold text-slate-300 uppercase tracking-wide mb-1">⭐ Interviews</div>
                                <div className="text-2xl font-black text-purple-300" data-testid={`text-booked-${campaign.id}`}>
                                  {campaign.interviewsBooked}
                                </div>
                              </motion.div>
                            </div>
                            {campaign.status === "active" && campaign.mediaContacted > 0 && (
                              <motion.div className="mt-4 bg-slate-700/40 rounded-lg p-3 border border-slate-600/30">
                                <div className="flex justify-between items-center text-xs mb-2">
                                  <span className="font-semibold text-slate-300">📊 Open Rate</span>
                                  <span className="font-black text-blue-400">{Math.round((campaign.emailsOpened / campaign.mediaContacted) * 100)}%</span>
                                </div>
                                <Progress 
                                  value={(campaign.emailsOpened / campaign.mediaContacted) * 100} 
                                  className="h-2 bg-slate-700"
                                />
                              </motion.div>
                            )}
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                </AnimatePresence>
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-800/50 via-slate-800/30 to-slate-900/50 border border-slate-700/50 backdrop-blur"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10 opacity-50" />
                  <CardContent className="relative flex flex-col items-center justify-center py-16 px-6">
                    <motion.div
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: "spring", stiffness: 100 }}
                      className="mb-6"
                    >
                      <div className="w-24 h-24 bg-gradient-to-br from-blue-600/30 to-purple-600/30 rounded-full flex items-center justify-center border border-blue-500/30">
                        <Megaphone className="w-12 h-12 text-blue-400" />
                      </div>
                    </motion.div>
                    <motion.h3 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.2 }}
                      className="text-3xl font-black bg-gradient-to-r from-slate-100 to-slate-300 bg-clip-text text-transparent mb-3"
                    >
                      No campaigns yet
                    </motion.h3>
                    <motion.p 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.3 }}
                      className="text-slate-400 mb-8 text-center max-w-md text-lg"
                    >
                      Create your first PR campaign and reach radio, podcasts, TV and media outlets instantly.
                    </motion.p>
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Button 
                        onClick={() => setActiveView("wizard")}
                        className="gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold px-8 py-6 text-base shadow-lg hover:shadow-blue-500/50 transition-all"
                        data-testid="button-create-first-campaign"
                      >
                        <Rocket className="w-5 h-5" />
                        Create First Campaign
                      </Button>
                    </motion.div>
                  </CardContent>
                </motion.div>
              )}
            </div>
          </>
        )}

        {activeView === "wizard" && (
          <Card className="max-w-4xl mx-auto">
            <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <CardTitle>New PR Campaign</CardTitle>
                  <CardDescription>
                    Step {wizardStep} of 5: {
                      wizardStep === 1 ? "Basic Information" :
                      wizardStep === 2 ? "Content to Promote" :
                      wizardStep === 3 ? "Media Target" :
                      wizardStep === 4 ? "Message & Contact" :
                      "Review & Launch"
                    }
                  </CardDescription>
                </div>
                {draftSaved && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="flex items-center gap-1 text-green-600 text-sm">
                    <CheckCircle className="w-4 h-4" /> Draft saved
                  </motion.div>
                )}
              </div>
              <motion.div initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 0.5 }}>
                <Progress value={(wizardStep / 5) * 100} className="mt-4 h-2" />
              </motion.div>
            </CardHeader>
            <CardContent className="space-y-6">
              {wizardStep === 1 && (
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label htmlFor="title" data-testid="label-campaign-title">Campaign Name</Label>
                      {formData.artistName && formData.contentTitle && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => suggestTitleMutation.mutate()}
                          disabled={suggestTitleMutation.isPending}
                          className="gap-2"
                          data-testid="button-suggest-title-ai"
                        >
                          {suggestTitleMutation.isPending ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <Sparkles className="w-3 h-3" />
                          )}
                          Generate with AI
                        </Button>
                      )}
                    </div>
                    <Input
                      id="title"
                      placeholder="E.g: November 2025 Single Launch"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      data-testid="input-campaign-title"
                    />
                  </div>
                  <div>
                    <Label htmlFor="artistName" data-testid="label-artist-name">Artist Name</Label>
                    <Input
                      id="artistName"
                      placeholder="Your artist name"
                      value={formData.artistName}
                      onChange={(e) => setFormData({ ...formData, artistName: e.target.value })}
                      data-testid="input-artist-name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="artistProfileUrl" data-testid="label-profile-url">
                      Profile Link {user?.slug && <span className="text-green-600">✓ Auto-loaded</span>}
                    </Label>
                    <Input
                      id="artistProfileUrl"
                      placeholder="https://boostify.app/artist/your-name"
                      value={formData.artistProfileUrl}
                      onChange={(e) => setFormData({ ...formData, artistProfileUrl: e.target.value })}
                      data-testid="input-profile-url"
                      className={user?.slug ? "border-green-500 bg-green-50 dark:bg-green-950/20" : ""}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      {user?.slug 
                        ? "✓ Your artist profile has been loaded automatically. You can edit it if you wish."
                        : "If you don't have one, we'll generate it automatically"
                      }
                    </p>
                  </div>
                </div>
              )}

              {wizardStep === 2 && (
                <div className="space-y-4">
                  <div>
                    <Label data-testid="label-content-type">What are you promoting?</Label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-2">
                      {CONTENT_TYPES.map((type) => {
                        const Icon = type.icon;
                        return (
                          <button
                            key={type.value}
                            type="button"
                            onClick={() => setFormData({ ...formData, contentType: type.value as any })}
                            className={`p-4 border rounded-lg flex flex-col items-center gap-2 transition-all ${
                              formData.contentType === type.value
                                ? "border-primary bg-primary/10"
                                : "border-border hover:border-primary/50"
                            }`}
                            data-testid={`button-content-type-${type.value}`}
                          >
                            <Icon className="w-6 h-6" />
                            <span className="text-sm font-medium">{type.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="contentTitle" data-testid="label-content-title">Content Title</Label>
                    <Input
                      id="contentTitle"
                      placeholder="E.g: The Silence Screams"
                      value={formData.contentTitle}
                      onChange={(e) => setFormData({ ...formData, contentTitle: e.target.value })}
                      data-testid="input-content-title"
                    />
                  </div>
                  <div>
                    <Label htmlFor="contentUrl" data-testid="label-content-url">Content Link</Label>
                    <Input
                      id="contentUrl"
                      placeholder="https://open.spotify.com/track/..."
                      value={formData.contentUrl}
                      onChange={(e) => setFormData({ ...formData, contentUrl: e.target.value })}
                      data-testid="input-content-url"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Spotify, YouTube, Apple Music, etc.
                    </p>
                  </div>
                </div>
              )}

              {wizardStep === 3 && (
                <div className="space-y-6">
                  <div>
                    <Label className="mb-3 block" data-testid="label-media-types">Media Types</Label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {MEDIA_TYPES.map((type) => {
                        const Icon = type.icon;
                        const isSelected = formData.targetMediaTypes.includes(type.value);
                        return (
                          <button
                            key={type.value}
                            type="button"
                            onClick={() => toggleArrayValue(
                              formData.targetMediaTypes,
                              type.value,
                              (arr) => setFormData({ ...formData, targetMediaTypes: arr })
                            )}
                            className={`p-3 border rounded-lg flex items-center gap-2 transition-all ${
                              isSelected
                                ? "border-primary bg-primary/10"
                                : "border-border hover:border-primary/50"
                            }`}
                            data-testid={`button-media-type-${type.value}`}
                          >
                            <Icon className="w-5 h-5" />
                            <span className="text-sm font-medium">{type.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <div>
                    <Label className="mb-3 block" data-testid="label-countries">Countries</Label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {COUNTRIES.map((country) => {
                        const isSelected = formData.targetCountries.includes(country);
                        return (
                          <button
                            key={country}
                            type="button"
                            onClick={() => toggleArrayValue(
                              formData.targetCountries,
                              country,
                              (arr) => setFormData({ ...formData, targetCountries: arr })
                            )}
                            className={`p-2 border rounded text-sm transition-all ${
                              isSelected
                                ? "border-primary bg-primary/10 font-medium"
                                : "border-border hover:border-primary/50"
                            }`}
                            data-testid={`button-country-${country}`}
                          >
                            {country}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <div>
                    <Label className="mb-3 block" data-testid="label-genres">Music Genres</Label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {GENRES.map((genre) => {
                        const isSelected = formData.targetGenres.includes(genre);
                        return (
                          <button
                            key={genre}
                            type="button"
                            onClick={() => toggleArrayValue(
                              formData.targetGenres,
                              genre,
                              (arr) => setFormData({ ...formData, targetGenres: arr })
                            )}
                            className={`p-2 border rounded text-sm transition-all ${
                              isSelected
                                ? "border-primary bg-primary/10 font-medium"
                                : "border-border hover:border-primary/50"
                            }`}
                            data-testid={`button-genre-${genre}`}
                          >
                            {genre}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {wizardStep === 3 && (
                <div className="space-y-4">
                  <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles className="w-5 h-5 text-blue-600" />
                      <span className="font-semibold">AI Campaign Image Generator</span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">Generate a professional campaign image for your PR outreach</p>
                    <Button 
                      onClick={() => generateImageMutation.mutate()}
                      disabled={generatingImage || !formData.contentTitle}
                      className="gap-2 w-full"
                    >
                      {generateImageMutation.isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4" />
                          Generate Image
                        </>
                      )}
                    </Button>
                    {formData.campaignImage && (
                      <div className="mt-3 p-2 bg-green-500/10 border border-green-500/20 rounded text-sm text-green-600">
                        ✓ Campaign image generated successfully
                      </div>
                    )}
                  </div>
                </div>
              )}

              {wizardStep === 4 && (
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label htmlFor="pitchMessage" data-testid="label-pitch-message">
                        Media Message (2-3 sentences)
                      </Label>
                      <div className="flex gap-2">
                        {formData.pitchMessage && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => improvePitchMutation.mutate()}
                            disabled={improvePitchMutation.isPending}
                            className="gap-2"
                            data-testid="button-improve-pitch-ai"
                          >
                            {improvePitchMutation.isPending ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <Wand2 className="w-3 h-3" />
                            )}
                            Improve with AI
                          </Button>
                        )}
                        {formData.artistName && formData.contentTitle && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => generatePitchMutation.mutate()}
                            disabled={generatePitchMutation.isPending}
                            className="gap-2"
                            data-testid="button-generate-pitch-ai"
                          >
                            {generatePitchMutation.isPending ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <Sparkles className="w-3 h-3" />
                            )}
                            Generate with AI
                          </Button>
                        )}
                      </div>
                    </div>
                    <Textarea
                      id="pitchMessage"
                      placeholder="E.g: Redwine releases his new single 'The Silence Screams', a unique fusion of cinema and Latin music. Available now on all platforms."
                      value={formData.pitchMessage}
                      onChange={(e) => setFormData({ ...formData, pitchMessage: e.target.value })}
                      rows={4}
                      data-testid="input-pitch-message"
                    />
                    {!formData.pitchMessage && formData.artistName && formData.contentTitle && (
                      <p className="text-xs text-muted-foreground mt-1">
                        💡 Tip: Use "Generate with AI" to create a professional message automatically
                      </p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="contactEmail" data-testid="label-contact-email">Contact Email</Label>
                    <Input
                      id="contactEmail"
                      type="email"
                      placeholder="your@email.com"
                      value={formData.contactEmail}
                      onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                      data-testid="input-contact-email"
                    />
                  </div>
                  <div>
                    <Label htmlFor="contactPhone" data-testid="label-contact-phone">
                      Phone/WhatsApp (Optional)
                    </Label>
                    <Input
                      id="contactPhone"
                      placeholder="+1 786 000 0000"
                      value={formData.contactPhone}
                      onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                      data-testid="input-contact-phone"
                    />
                  </div>
                </div>
              )}

              {wizardStep === 5 && (
                <div className="space-y-6">
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gradient-to-br from-blue-600/10 to-purple-600/10 rounded-xl p-6 space-y-4 border border-blue-500/20"
                  >
                    <h3 className="font-black text-xl bg-gradient-to-r from-slate-100 to-slate-300 bg-clip-text text-transparent">📋 Campaign Summary</h3>
                    <div className="grid gap-3 text-sm">
                      <div>
                        <span className="text-muted-foreground">Name:</span>
                        <div className="font-medium" data-testid="text-review-title">{formData.title}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Artist:</span>
                        <div className="font-medium" data-testid="text-review-artist">{formData.artistName}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Content:</span>
                        <div className="font-medium" data-testid="text-review-content">
                          {formData.contentTitle} ({formData.contentType})
                        </div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Media Types:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {formData.targetMediaTypes.map((type) => (
                            <Badge key={type} variant="secondary" data-testid={`badge-review-media-${type}`}>
                              {type}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Countries:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {formData.targetCountries.map((country) => (
                            <Badge key={country} variant="outline" data-testid={`badge-review-country-${country}`}>
                              {country}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Genres:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {formData.targetGenres.map((genre) => (
                            <Badge key={genre} variant="outline" data-testid={`badge-review-genre-${genre}`}>
                              {genre}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Message:</span>
                        <div className="font-medium mt-1 text-xs bg-background p-3 rounded" data-testid="text-review-message">
                          {formData.pitchMessage}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-gradient-to-br from-green-600/10 to-emerald-600/10 rounded-xl p-4 border border-green-500/20"
                  >
                    <h4 className="font-black mb-3 flex items-center gap-2 text-slate-100">
                      <Rocket className="w-5 h-5 text-green-400" />
                      What happens next?
                    </h4>
                    <ul className="text-sm space-y-3 text-slate-300">
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 mt-0.5 text-primary" />
                        <span>We'll filter media that matches your target</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 mt-0.5 text-primary" />
                        <span>Personalized emails will be sent automatically</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 mt-0.5 text-primary" />
                        <span>You'll receive notifications when they reply</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 mt-0.5 text-primary" />
                        <span>View real-time statistics</span>
                      </li>
                    </ul>
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleWizardBack}
                        className="gap-2"
                        data-testid="button-wizard-back"
                      >
                        {wizardStep === 1 ? "Cancel" : "Back"}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>{wizardStep === 1 ? "Cancel" : "Go to previous step"}</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        type="button"
                        onClick={handleWizardNext}
                        className="gap-2 flex-1 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 transition-all duration-300"
                        disabled={
                          (wizardStep === 1 && (!formData.title || !formData.artistName)) ||
                          (wizardStep === 2 && (!formData.contentTitle || !formData.contentUrl)) ||
                          (wizardStep === 3 && (formData.targetMediaTypes.length === 0 || formData.targetCountries.length === 0)) ||
                          (wizardStep === 4 && (!formData.pitchMessage || !formData.contactEmail)) ||
                          createCampaignMutation.isPending
                        }
                        data-testid="button-wizard-next"
                      >
                        {createCampaignMutation.isPending ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Creating...
                          </>
                        ) : wizardStep === 5 ? (
                          <>
                            <Rocket className="w-4 h-4" />
                            Create Campaign
                          </>
                        ) : (
                          <>
                            Next
                            <ArrowRight className="w-4 h-4" />
                          </>
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>{wizardStep === 5 ? "Launch campaign" : "Continue to next step"}</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </CardContent>
          </Card>
        )}

        {activeView === "campaign" && selectedCampaign && (
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                onClick={() => {
                  setActiveView("list");
                  setSelectedCampaign(null);
                }}
                data-testid="button-back-to-list"
              >
                ← Back
              </Button>
            </div>

            {isLoadingDetails ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : campaignDetails?.campaign ? (
              <>
                <Card>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-2xl mb-2" data-testid="text-campaign-detail-title">
                          {campaignDetails.campaign.title}
                        </CardTitle>
                        <CardDescription data-testid="text-campaign-detail-content">
                          {campaignDetails.campaign.contentTitle} • {campaignDetails.campaign.contentType}
                        </CardDescription>
                      </div>
                      <div className="flex gap-2">
                        {getStatusBadge(campaignDetails.campaign.status)}
                        {campaignDetails.campaign.status === "draft" && (
                          <Button
                            size="sm"
                            onClick={() => activateCampaignMutation.mutate(campaignDetails.campaign.id)}
                            disabled={activateCampaignMutation.isPending}
                            className="gap-2"
                            data-testid="button-activate-campaign"
                          >
                            {activateCampaignMutation.isPending ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Play className="w-4 h-4" />
                            )}
                            Activate
                          </Button>
                        )}
                        {campaignDetails.campaign.status === "active" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => pauseCampaignMutation.mutate(campaignDetails.campaign.id)}
                            disabled={pauseCampaignMutation.isPending}
                            className="gap-2"
                            data-testid="button-pause-campaign"
                          >
                            {pauseCampaignMutation.isPending ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Pause className="w-4 h-4" />
                            )}
                            Pause
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                      <div>
                        <div className="text-muted-foreground text-sm mb-1">Media Contacted</div>
                        <div className="text-3xl font-bold" data-testid="text-detail-contacted">
                          {campaignDetails.campaign.mediaContacted}
                        </div>
                      </div>
                      <div>
                        <div className="text-muted-foreground text-sm mb-1">Emails Opened</div>
                        <div className="text-3xl font-bold text-blue-600" data-testid="text-detail-opened">
                          {campaignDetails.campaign.emailsOpened}
                        </div>
                      </div>
                      <div>
                        <div className="text-muted-foreground text-sm mb-1">Replies</div>
                        <div className="text-3xl font-bold text-green-600" data-testid="text-detail-replied">
                          {campaignDetails.campaign.mediaReplied}
                        </div>
                      </div>
                      <div>
                        <div className="text-muted-foreground text-sm mb-1">Interviews Booked</div>
                        <div className="text-3xl font-bold text-primary" data-testid="text-detail-booked">
                          {campaignDetails.campaign.interviewsBooked}
                        </div>
                      </div>
                    </div>

                    {campaignDetails.campaign.mediaContacted > 0 && (
                      <div className="mt-6 space-y-4">
                        <div>
                          <div className="flex justify-between text-sm mb-2">
                            <span>Open Rate</span>
                            <span className="font-medium">
                              {Math.round((campaignDetails.campaign.emailsOpened / campaignDetails.campaign.mediaContacted) * 100)}%
                            </span>
                          </div>
                          <Progress 
                            value={(campaignDetails.campaign.emailsOpened / campaignDetails.campaign.mediaContacted) * 100}
                            className="h-2"
                          />
                        </div>
                        {campaignDetails.campaign.emailsOpened > 0 && (
                          <div>
                            <div className="flex justify-between text-sm mb-2">
                              <span>Conversion Rate (Replies)</span>
                              <span className="font-medium">
                                {Math.round((campaignDetails.campaign.mediaReplied / campaignDetails.campaign.emailsOpened) * 100)}%
                              </span>
                            </div>
                            <Progress 
                              value={(campaignDetails.campaign.mediaReplied / campaignDetails.campaign.emailsOpened) * 100}
                              className="h-2"
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {campaignDetails.events && campaignDetails.events.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Recent Activity</CardTitle>
                      <CardDescription>Latest media interactions</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {campaignDetails.events.map((event) => {
                          const Icon = getEventIcon(event.eventType);
                          return (
                            <div 
                              key={event.id} 
                              className="flex items-start gap-3 p-3 rounded-lg bg-muted/50"
                              data-testid={`event-${event.id}`}
                            >
                              <div className="p-2 rounded-full bg-background">
                                <Icon className="w-4 h-4" />
                              </div>
                              <div className="flex-1">
                                <div className="font-medium" data-testid={`text-event-media-${event.id}`}>
                                  {event.mediaName}
                                </div>
                                <div className="text-sm text-muted-foreground" data-testid={`text-event-type-${event.id}`}>
                                  {getEventLabel(event.eventType)}
                                </div>
                                {event.notes && (
                                  <div className="text-sm mt-1" data-testid={`text-event-notes-${event.id}`}>
                                    {event.notes}
                                  </div>
                                )}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {new Date(event.createdAt).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
