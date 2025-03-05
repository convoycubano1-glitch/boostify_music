import { useState, useEffect } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { doc, setDoc, collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/firebase";
import { v4 as uuidv4 } from "uuid";

// UI Components
import { Header } from "@/components/layout/header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

// Icons
import {
  Building2,
  Music2,
  ChevronRight,
  Globe,
  Users,
  Sparkles,
  Calendar,
  DollarSign,
  ArrowRight,
  Home,
  Check,
  Image,
  Wand2,
  Loader2,
  BarChart2,
  MessageSquare,
  CloudUpload,
  Shield,
  Zap,
  Database,
  Music,
  Award,
  Megaphone,
  Radio,
  Mail,
  Film,
  Bot
} from "lucide-react";
import { SiSpotify, SiApplemusic, SiYoutube, SiTiktok, SiInstagram } from "react-icons/si";

// Types
interface RecordLabelConfig {
  id: string;
  name: string;
  type: string;
  genre: string;
  platforms: string[];
  artistCount: number;
  artists: ArtistPreview[];
  logoUrl?: string;
  userId: string;
  createdAt: Date;
}

interface ArtistPreview {
  id: string;
  name: string;
  imagePrompt?: string;
  genre?: string;
  style?: string;
}

interface PlatformOption {
  id: string;
  name: string;
  icon: React.ReactNode;
}

interface GenreOption {
  id: string;
  name: string;
}

interface LabelTypeOption {
  id: string;
  name: string;
  description: string;
}

interface PlanOption {
  id: string;
  name: string;
  artistCount: number;
  price: number;
  features: string[];
  popular?: boolean;
}

// useEffect para simular la actualización periódica del estado
const useUpdateEffect = (callbackFn: () => void, delay: number) => {
  useEffect(() => {
    const interval = setInterval(() => {
      callbackFn();
    }, delay);
    
    return () => clearInterval(interval);
  }, [callbackFn, delay]);
};

export default function VirtualRecordLabelPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [isGeneratingLogo, setIsGeneratingLogo] = useState(false);
  const [isCreatingLabel, setIsCreatingLabel] = useState(false);
  
  // Progress simulation states
  const [showProgress, setShowProgress] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressStage, setProgressStage] = useState(0);
  const [isUnderReview, setIsUnderReview] = useState(false);
  
  // Stages for creation process
  const creationStages = [
    { 
      title: "Setup AI Music Engine", 
      description: "Configuring AI algorithms for music composition and audio mastering",
      icon: <CloudUpload className="h-5 w-5 text-orange-500" />
    },
    { 
      title: "Video Generation Framework", 
      description: "Setting up AI-powered video creation for artists through PiAPI",
      icon: <Film className="h-5 w-5 text-orange-500" />
    },
    { 
      title: "AI Artist Generation", 
      description: "Creating virtual artists with GPT-based personalities and backstories",
      icon: <Users className="h-5 w-5 text-orange-500" />
    },
    { 
      title: "CRM Integration", 
      description: "Configuring contact management system for industry professionals",
      icon: <Megaphone className="h-5 w-5 text-orange-500" />
    },
    { 
      title: "Analytics Dashboard", 
      description: "Setting up performance tracking and insights for your label",
      icon: <BarChart2 className="h-5 w-5 text-orange-500" />
    },
    { 
      title: "Digital Rights Management", 
      description: "Implementing protection systems for your intellectual property",
      icon: <Shield className="h-5 w-5 text-orange-500" />
    },
    { 
      title: "Distribution Network", 
      description: "Connecting to global streaming platforms and music marketplaces",
      icon: <DollarSign className="h-5 w-5 text-orange-500" />
    },
    { 
      title: "Finalizing Launch", 
      description: "Last touches before your virtual record label goes live",
      icon: <Zap className="h-5 w-5 text-orange-500" />
    }
  ];

  // Configuration state
  const [config, setConfig] = useState<Partial<RecordLabelConfig>>({
    name: "",
    type: "",
    genre: "",
    platforms: [],
    artistCount: 3,
    artists: [],
  });

  // Platform options
  const platforms: PlatformOption[] = [
    { id: "spotify", name: "Spotify", icon: <SiSpotify className="h-4 w-4" /> },
    { id: "apple", name: "Apple Music", icon: <SiApplemusic className="h-4 w-4" /> },
    { id: "youtube", name: "YouTube", icon: <SiYoutube className="h-4 w-4" /> },
    { id: "tiktok", name: "TikTok", icon: <SiTiktok className="h-4 w-4" /> },
    { id: "instagram", name: "Instagram", icon: <SiInstagram className="h-4 w-4" /> },
  ];

  // Genre options
  const genres: GenreOption[] = [
    { id: "pop", name: "Pop" },
    { id: "rock", name: "Rock" },
    { id: "hiphop", name: "Hip-Hop" },
    { id: "electronic", name: "Electronic" },
    { id: "rnb", name: "R&B" },
    { id: "jazz", name: "Jazz" },
    { id: "classical", name: "Classical" },
    { id: "country", name: "Country" },
    { id: "latin", name: "Latin" }
  ];

  // Label type options
  const labelTypes: LabelTypeOption[] = [
    { 
      id: "indie", 
      name: "Indie Label", 
      description: "Focus on niche genres and emerging artists with authentic creative direction"
    },
    { 
      id: "major", 
      name: "Major Label", 
      description: "Mainstream commercial approach with wide distribution and high-budget productions"
    },
    { 
      id: "personal", 
      name: "Personal Label", 
      description: "Dedicated to your own projects with complete creative control"
    }
  ];

  // Pricing plans
  const plans: PlanOption[] = [
    {
      id: "starter",
      name: "Starter",
      artistCount: 3,
      price: 49.99,
      features: [
        "3 AI-generated artists",
        "Basic strategic planning",
        "Standard distribution",
        "Simple analytics"
      ]
    },
    {
      id: "professional",
      name: "Professional",
      artistCount: 5,
      price: 99.99,
      popular: true,
      features: [
        "5 AI-generated artists",
        "Advanced release strategies",
        "Priority distribution",
        "Comprehensive analytics",
        "AI marketing assistant"
      ]
    },
    {
      id: "enterprise",
      name: "Enterprise",
      artistCount: 10,
      price: 199.99,
      features: [
        "10 AI-generated artists",
        "Custom release strategies",
        "Premium distribution",
        "Advanced analytics dashboard",
        "AI marketing campaigns",
        "Custom branding",
        "24/7 support"
      ]
    }
  ];

  // Testimonials
  const testimonials = [
    {
      name: "Sarah Johnson",
      label: "Cosmic Beats Records",
      quote: "Creating my Virtual Record Label has been transformative. With 5 AI artists, I've been able to expand into multiple genres and build a real audience.",
      image: "https://randomuser.me/api/portraits/women/32.jpg"
    },
    {
      name: "Michael Rodriguez",
      label: "Future Sound",
      quote: "The automation and AI features take care of the tedious parts of running a label. I'm now focusing on the creative direction while the platform handles the rest.",
      image: "https://randomuser.me/api/portraits/men/54.jpg"
    },
    {
      name: "Jasmine Chen",
      label: "Nebula Music Group",
      quote: "From zero music business experience to running a profitable label with multiple AI artists in just three months. The platform made it all possible.",
      image: "https://randomuser.me/api/portraits/women/68.jpg"
    }
  ];

  // FAQs
  const faqs = [
    {
      question: "How does the Virtual Record Label work?",
      answer: "Our platform uses AI to generate complete artist profiles including music, promotional content, and release strategies. You control the creative direction, genre, and marketing approach while our AI handles content creation and promotional tasks."
    },
    {
      question: "Can I customize my AI artists?",
      answer: "Yes, you can customize the name, style, genre, and visual appearance of each AI artist in your label. You can also direct their musical style and creative direction."
    },
    {
      question: "How is the music distributed?",
      answer: "We integrate with major distribution platforms including Spotify, Apple Music, YouTube Music, and more. The distribution process is automated once you approve releases."
    },
    {
      question: "Do I own the rights to the music?",
      answer: "Yes, all content created through your Virtual Record Label is owned by you, including full commercial rights."
    },
    {
      question: "Can I upgrade my plan later?",
      answer: "Absolutely! You can upgrade your plan at any time to access more AI artists and additional features."
    }
  ];

  // Step navigation
  const nextStep = () => {
    if (currentStep < 5) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Generate random artist names based on genre
  const generateArtistNames = (genre: string, count: number) => {
    const prefixes = {
      pop: ["Crystal", "Echo", "Stellar", "Neon", "Pulse", "Nova", "Aura", "Luna"],
      rock: ["Thunder", "Raven", "Midnight", "Storm", "Savage", "Rebel", "Chaos", "Vortex"],
      hiphop: ["Young", "Lil", "MC", "DJ", "King", "Queen", "Dr.", "Professor"],
      electronic: ["Cyber", "Digital", "Binary", "Circuit", "Synth", "Pixel", "Vector", "Quantum"],
      rnb: ["Silk", "Velvet", "Soul", "Rhythm", "Harmony", "Melody", "Divine", "Royal"],
      jazz: ["Blue", "Smooth", "Midnight", "Brass", "Sax", "Rhythm", "Cool", "Mellow"],
      classical: ["Maestro", "Virtuoso", "Aria", "Symphony", "Opus", "Concerto", "Harmony", "Allegro"],
      country: ["Whiskey", "Dusty", "Desert", "Texas", "Wild", "Southern", "Ranch", "Prairie"],
      latin: ["Ritmo", "Fuego", "Salsa", "Latino", "Sol", "Alma", "Corazón", "Vida"]
    };

    const suffixes = {
      pop: ["Star", "Wave", "Glow", "Dream", "Heart", "Voice", "Shine", "Spark"],
      rock: ["Blade", "Fury", "Rage", "Fist", "Axe", "Fire", "Wolf", "Riff"],
      hiphop: ["Money", "Cash", "Flow", "Beats", "Hustler", "Lyric", "Rhyme", "Style"],
      electronic: ["Pulse", "Wave", "Byte", "Code", "Matrix", "Grid", "Glitch", "Techno"],
      rnb: ["Love", "Groove", "Vibe", "Feel", "Smooth", "Heartbreak", "Passion", "Mood"],
      jazz: ["Notes", "Tone", "Groove", "Soul", "Blues", "Rhythm", "Swing", "Improv"],
      classical: ["Sonata", "Quartet", "Ensemble", "Philharmonic", "Orchestra", "Chamber", "Strings", "Piano"],
      country: ["Road", "Trail", "Heart", "Boots", "Sunset", "Horizon", "Creek", "Valley"],
      latin: ["Caliente", "Ritmo", "Noche", "Estrella", "Sabor", "Pasión", "Fiesta", "Sol"]
    };

    const randomNames = [];
    const genreKey = genre as keyof typeof prefixes || "pop";
    const genrePrefixes = prefixes[genreKey] || prefixes.pop;
    const genreSuffixes = suffixes[genreKey] || suffixes.pop;

    for (let i = 0; i < count; i++) {
      const prefix = genrePrefixes[Math.floor(Math.random() * genrePrefixes.length)];
      const suffix = genreSuffixes[Math.floor(Math.random() * genreSuffixes.length)];
      const useSuffix = Math.random() > 0.3; // Sometimes don't use a suffix
      
      const name = useSuffix ? `${prefix} ${suffix}` : prefix;
      randomNames.push({ 
        id: uuidv4(),
        name,
        genre: genre,
        imagePrompt: `${genre} music artist ${name} professional portrait, high quality`
      });
    }

    return randomNames;
  };

  // Update artist count when plan changes
  const handlePlanChange = (planId: string) => {
    const selectedPlan = plans.find(plan => plan.id === planId);
    if (selectedPlan) {
      setConfig({
        ...config,
        artistCount: selectedPlan.artistCount
      });
    }
  };

  // Update artists when genre changes
  const handleGenreChange = (genre: string) => {
    setConfig(prev => {
      const artistCount = prev.artistCount || 3;
      return {
        ...prev,
        genre,
        artists: generateArtistNames(genre, artistCount)
      };
    });
  };

  // Generate logo for the record label
  const generateLogo = async () => {
    if (!config.name || !config.genre) {
      toast({
        title: "Missing information",
        description: "Please fill in your label name and genre first.",
        variant: "destructive"
      });
      return;
    }

    setIsGeneratingLogo(true);

    try {
      // In a real implementation, this would call an AI image generation API
      // For now, we'll simulate a delay and provide a static example
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Placeholder for AI-generated logo URL
      const logoUrl = "https://placehold.co/400x400/orange/white?text="+encodeURIComponent(config.name || "Record Label");
      
      setConfig({
        ...config,
        logoUrl
      });
      
      toast({
        title: "Logo generated",
        description: "Your record label logo has been created successfully."
      });
    } catch (error) {
      console.error("Error generating logo:", error);
      toast({
        title: "Error",
        description: "Could not generate logo. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGeneratingLogo(false);
    }
  };

  // Create the virtual record label with progress simulation
  const createRecordLabel = async () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to create your record label.",
        variant: "destructive"
      });
      return;
    }

    if (!config.name || !config.type || !config.genre || !config.platforms || config.platforms.length === 0) {
      toast({
        title: "Missing information",
        description: "Please complete all required fields before creating your label.",
        variant: "destructive"
      });
      return;
    }

    setIsCreatingLabel(true);
    setShowProgress(true);
    setProgress(0);
    setProgressStage(0);

    try {
      // Create a complete record label object
      const recordLabel: RecordLabelConfig = {
        id: uuidv4(),
        name: config.name || "",
        type: config.type || "",
        genre: config.genre || "",
        platforms: config.platforms || [],
        artistCount: config.artistCount || 3,
        artists: config.artists || [],
        logoUrl: config.logoUrl,
        userId: user.uid,
        createdAt: new Date()
      };
      
      // Simulate creation process with stages
      let currentProgress = 0;
      let currentStage = 0;
      
      // Function to update progress with animation
      const updateProgress = (stage: number, progressValue: number) => {
        return new Promise<void>(resolve => {
          setProgressStage(stage);
          
          // Animate progress bar
          const interval = setInterval(() => {
            setProgress(prev => {
              if (prev >= progressValue) {
                clearInterval(interval);
                resolve();
                return prev;
              }
              return prev + 1;
            });
          }, 30);
        });
      };
      
      // Process each stage
      for (let i = 0; i < creationStages.length; i++) {
        // Calculate target progress for this stage
        const targetProgress = Math.round(((i + 1) / creationStages.length) * 100);
        
        // Update UI with current stage and animate progress
        await updateProgress(i, targetProgress);
        
        // Simulate processing time for this stage
        await new Promise(resolve => setTimeout(resolve, 
          i === creationStages.length - 1 ? 2000 : 3000)); // Last stage is shorter
      }
      
      // Save to Firestore
      const docRef = doc(collection(db, "record_labels"), recordLabel.id);
      await setDoc(docRef, recordLabel);
      
      // Show success toast
      toast({
        title: "Record Label Created",
        description: "Your virtual record label is now under review!",
      });
      
      // Show "Under Review" screen instead of success
      setIsUnderReview(true);
      
    } catch (error) {
      console.error("Error creating record label:", error);
      toast({
        title: "Error",
        description: "Could not create your record label. Please try again.",
        variant: "destructive"
      });
      setShowProgress(false);
    } finally {
      setIsCreatingLabel(false);
    }
  };

  // Toggle platform selection
  const togglePlatform = (platformId: string) => {
    setConfig(prev => {
      const currentPlatforms = prev.platforms || [];
      if (currentPlatforms.includes(platformId)) {
        return {
          ...prev,
          platforms: currentPlatforms.filter(id => id !== platformId)
        };
      } else {
        return {
          ...prev,
          platforms: [...currentPlatforms, platformId]
        };
      }
    });
  };

  // Show progress overlay over normal content
  const ProgressOverlay = () => (
    <motion.div 
      className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="bg-background w-full max-w-md rounded-xl p-8 space-y-6">
        <div className="text-center space-y-2 mb-6">
          <h2 className="text-2xl font-bold">Creating Your Record Label</h2>
          <p className="text-muted-foreground">Please wait while we set up your label.</p>
        </div>
        
        <div className="space-y-6">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <p className="text-sm font-medium">Progress</p>
              <p className="text-sm text-muted-foreground">{progress}%</p>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
          
          <div className="border rounded-lg p-4 bg-muted/50">
            <div className="flex items-center gap-4">
              {creationStages[progressStage].icon}
              <div>
                <h3 className="font-semibold">{creationStages[progressStage].title}</h3>
                <p className="text-sm text-muted-foreground">{creationStages[progressStage].description}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
  
  // Under Review Screen
  const UnderReviewScreen = () => (
    <motion.div 
      className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="bg-background w-full max-w-2xl rounded-xl p-8">
        <div className="text-center space-y-4 mb-8">
          <div className="w-16 h-16 bg-orange-500/10 rounded-full mx-auto flex items-center justify-center mb-2">
            <Shield className="h-8 w-8 text-orange-500" />
          </div>
          <h2 className="text-3xl font-bold">Your Record Label is Under Review</h2>
          <p className="text-lg text-muted-foreground max-w-md mx-auto">
            Our team is reviewing your submission. You'll receive an email at {user?.email} once it's approved.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="p-4 space-y-2 bg-orange-500/5 border-orange-500/20">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-orange-500" />
              <h3 className="font-semibold">Review Timeline</h3>
            </div>
            <p className="text-sm text-muted-foreground">Typically within 24-48 hours</p>
          </Card>
          
          <Card className="p-4 space-y-2 bg-orange-500/5 border-orange-500/20">
            <div className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-orange-500" />
              <h3 className="font-semibold">Email Notification</h3>
            </div>
            <p className="text-sm text-muted-foreground">You'll be notified once approved</p>
          </Card>
          
          <Card className="p-4 space-y-2 bg-orange-500/5 border-orange-500/20">
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-orange-500" />
              <h3 className="font-semibold">Quick Start</h3>
            </div>
            <p className="text-sm text-muted-foreground">Full access to your dashboard</p>
          </Card>
        </div>
        
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">
            While you wait, you can explore our library of resources for record label management.
          </p>
          <div className="flex gap-4 justify-center">
            <Button variant="outline" className="flex gap-2">
              <Music2 className="h-4 w-4" />
              Resources
            </Button>
            <Button onClick={() => setIsUnderReview(false)} className="flex gap-2 bg-orange-500 hover:bg-orange-600">
              <Home className="h-4 w-4" />
              Return Home
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Progress Overlay */}
      {showProgress && <ProgressOverlay />}
      
      {/* Under Review Screen */}
      {isUnderReview && <UnderReviewScreen />}
      
      {/* Breadcrumb */}
      <div className="container pt-4 pb-2">
        <Breadcrumb className="mb-4">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/">
                  <Home className="h-3.5 w-3.5 mr-1" />
                  Home
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Virtual Record Label</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      {/* Hero Section with Video Background */}
      <section className="relative mb-12 overflow-hidden rounded-xl">
        {/* Video Background */}
        <div className="absolute inset-0 w-full h-full z-0">
          <video 
            className="w-full h-full object-cover opacity-70"
            autoPlay 
            loop 
            muted 
            playsInline
          >
            <source src="/background-video.mp4" type="video/mp4" />
          </video>
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-transparent z-10"></div>
        </div>
        
        {/* Content */}
        <div className="container relative z-20 py-16">
          <div className="flex flex-col md:flex-row gap-8 items-center">
            <div className="flex-1">
              <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-orange-500 via-red-500 to-purple-600">
                Create Your Own Virtual Record Label with AI Artists
              </h1>
              <p className="text-xl text-white mb-6">
                Build a complete record label powered by cutting-edge AI technology:
                <span className="block mt-2 ml-4">• Advanced music generation with proprietary AI algorithms</span>
                <span className="block ml-4">• Professional video creation using PiAPI's video engine</span>
                <span className="block ml-4">• Virtual artists with unique personalities and backstories</span>
                <span className="block ml-4">• Integrated CRM system for industry connections</span>
              </p>
              <p className="text-lg text-white/80 mb-8">
                Our platform gives you everything you need to produce, promote, and profit from music without traditional limitations. Choose your genre, platforms, and number of artists to launch your digital music empire today.
              </p>
              <div className="flex flex-wrap gap-4">
                <Button 
                  size="lg" 
                  className="bg-orange-500 hover:bg-orange-600 text-white"
                  onClick={() => setCurrentStep(1)}
                >
                  Get Started
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button 
                  size="lg" 
                  variant="outline"
                  className="bg-black/50 text-white border-white/30 hover:bg-black/70"
                >
                  Watch Demo
                </Button>
              </div>
            </div>
            
            <div className="flex-1">
              <motion.div 
                className="relative"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <div className="absolute -top-10 -left-10 w-40 h-40 bg-orange-500/20 rounded-full blur-3xl" />
                <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-purple-500/20 rounded-full blur-3xl" />
                <img 
                  src="/assets/virtual-record-label-concept.png" 
                  alt="Virtual Record Label"
                  className="rounded-2xl shadow-xl w-full"
                  onError={(e) => { 
                    // Fallback if image doesn't exist
                    e.currentTarget.src = "https://placehold.co/600x400/orange/white?text=Virtual+Record+Label";
                  }}
                />
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Configuration Steps */}
      <section className="container mb-16">
        <div className="max-w-4xl mx-auto">
          <div className="mb-10">
            <div className="relative">
              {/* Progress Bar */}
              <div className="absolute top-1/2 -translate-y-1/2 left-0 w-full h-1 bg-gray-200 dark:bg-gray-700">
                <div 
                  className="h-1 bg-orange-500 transition-all duration-300"
                  style={{ width: `${(currentStep - 1) * 25}%` }}
                />
              </div>
              
              {/* Step Indicators */}
              <div className="relative flex justify-between">
                {[1, 2, 3, 4, 5].map((step) => (
                  <div 
                    key={step}
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                      currentStep >= step 
                        ? 'bg-orange-500 text-white' 
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                    }`}
                  >
                    {currentStep > step ? (
                      <Check className="h-5 w-5" />
                    ) : (
                      step
                    )}
                  </div>
                ))}
              </div>
            </div>
            
            <div className="flex justify-between mt-2 text-sm text-muted-foreground">
              <span>Label Type</span>
              <span>Genre & Platform</span>
              <span>Artists</span>
              <span>Summary</span>
              <span>Done</span>
            </div>
          </div>

          {/* Step 1: Label Type */}
          {currentStep === 1 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-8"
            >
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold mb-2">Step 1: Choose Your Label Type</h2>
                <p className="text-muted-foreground">Select the type of record label you want to create</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {labelTypes.map((type) => (
                  <Card 
                    key={type.id}
                    className={`p-6 cursor-pointer transition-all hover:shadow-md ${
                      config.type === type.id ? 'border-orange-500 bg-orange-500/5' : ''
                    }`}
                    onClick={() => setConfig({ ...config, type: type.id })}
                  >
                    <div className="flex flex-col h-full">
                      <div className="mb-4">
                        <Building2 className="h-8 w-8 text-orange-500 mb-2" />
                        <h3 className="text-xl font-bold">{type.name}</h3>
                      </div>
                      <p className="text-muted-foreground flex-grow">{type.description}</p>
                      {config.type === type.id && (
                        <div className="mt-4 flex justify-end">
                          <div className="bg-orange-500 text-white rounded-full p-1">
                            <Check className="h-4 w-4" />
                          </div>
                        </div>
                      )}
                    </div>
                  </Card>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <Label htmlFor="label-name">Record Label Name</Label>
                  <Input 
                    id="label-name" 
                    placeholder="Enter your label name"
                    value={config.name}
                    onChange={(e) => setConfig({ ...config, name: e.target.value })}
                  />
                </div>
                
                <div className="flex items-end">
                  <Button 
                    className="w-full bg-orange-500 hover:bg-orange-600"
                    disabled={!config.type || !config.name}
                    onClick={nextStep}
                  >
                    Continue
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 2: Genre & Platform */}
          {currentStep === 2 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-8"
            >
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold mb-2">Step 2: Select Genre & Platforms</h2>
                <p className="text-muted-foreground">Choose your music genre and distribution platforms</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Genre Selection */}
                <div className="space-y-4">
                  <Label>Music Genre</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {genres.map((genre) => (
                      <Button
                        key={genre.id}
                        variant="outline"
                        className={`border h-10 py-2 px-4 rounded-md transition-all ${
                          config.genre === genre.id 
                            ? 'bg-orange-500 text-white hover:bg-orange-600' 
                            : 'hover:bg-orange-500/10 hover:text-orange-500'
                        }`}
                        onClick={() => handleGenreChange(genre.id)}
                      >
                        {genre.name}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Platform Selection */}
                <div className="space-y-4">
                  <Label>Distribution Platforms</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {platforms.map((platform) => (
                      <Button
                        key={platform.id}
                        variant="outline"
                        className={`border h-10 py-2 px-4 rounded-md transition-all flex items-center gap-2 ${
                          (config.platforms || []).includes(platform.id)
                            ? 'bg-orange-500 text-white hover:bg-orange-600'
                            : 'hover:bg-orange-500/10 hover:text-orange-500'
                        }`}
                        onClick={() => togglePlatform(platform.id)}
                      >
                        {platform.icon}
                        {platform.name}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-between">
                <Button 
                  variant="outline"
                  onClick={prevStep}
                >
                  Back
                </Button>
                <Button 
                  className="bg-orange-500 hover:bg-orange-600"
                  disabled={!config.genre || !(config.platforms || []).length}
                  onClick={nextStep}
                >
                  Continue
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </motion.div>
          )}

          {/* Step 3: Artist Count / Plan Selection */}
          {currentStep === 3 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-8"
            >
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold mb-2">Step 3: Choose Your Plan</h2>
                <p className="text-muted-foreground">Select the number of AI artists for your label</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {plans.map((plan) => (
                  <Card
                    key={plan.id}
                    className={`relative overflow-hidden transition-all ${
                      config.artistCount === plan.artistCount 
                        ? 'border-orange-500 bg-orange-500/5' 
                        : ''
                    } ${
                      plan.popular ? 'shadow-lg' : ''
                    }`}
                  >
                    {plan.popular && (
                      <div className="absolute top-0 right-0 bg-orange-500 text-white px-3 py-1 text-xs font-medium rounded-bl-lg">
                        Popular
                      </div>
                    )}
                    <div className="p-6">
                      <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
                      <div className="flex items-baseline mb-4">
                        <span className="text-3xl font-bold">${plan.price}</span>
                        <span className="text-muted-foreground text-sm ml-2">/month</span>
                      </div>
                      <div className="border-t border-border pt-4 mb-6">
                        <div className="flex items-center gap-2 text-sm mb-2">
                          <Users className="h-4 w-4 text-orange-500" />
                          <span className="font-semibold">{plan.artistCount} AI Artists</span>
                        </div>
                        <ul className="space-y-2 mb-6">
                          {plan.features.map((feature, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm">
                              <Check className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
                              <span>{feature}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <Button
                        className={`w-full ${
                          plan.popular 
                            ? 'bg-orange-500 hover:bg-orange-600 text-white' 
                            : 'bg-orange-500/10 hover:bg-orange-500/20 text-orange-500'
                        }`}
                        onClick={() => handlePlanChange(plan.id)}
                      >
                        {config.artistCount === plan.artistCount ? 'Selected' : 'Select Plan'}
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>

              <div className="flex justify-between">
                <Button 
                  variant="outline"
                  onClick={prevStep}
                >
                  Back
                </Button>
                <Button 
                  className="bg-orange-500 hover:bg-orange-600"
                  disabled={!config.artistCount}
                  onClick={nextStep}
                >
                  Continue
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </motion.div>
          )}

          {/* Step 4: Summary & Confirmation */}
          {currentStep === 4 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-8"
            >
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold mb-2">Step 4: Review & Confirm</h2>
                <p className="text-muted-foreground">Review your Virtual Record Label details</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Label Preview */}
                <div className="md:col-span-2">
                  <Card className="p-6 overflow-hidden">
                    <div className="flex flex-col md:flex-row gap-6 items-start">
                      {/* Logo */}
                      <div className="flex-shrink-0">
                        {config.logoUrl ? (
                          <img 
                            src={config.logoUrl} 
                            alt={config.name} 
                            className="w-32 h-32 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="w-32 h-32 bg-orange-500/10 rounded-lg flex items-center justify-center">
                            <Building2 className="h-12 w-12 text-orange-500" />
                          </div>
                        )}
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="mt-2 w-full"
                          onClick={generateLogo}
                          disabled={isGeneratingLogo}
                        >
                          {isGeneratingLogo ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Generating...
                            </>
                          ) : (
                            <>
                              <Image className="mr-2 h-4 w-4" />
                              Generate Logo
                            </>
                          )}
                        </Button>
                      </div>
                      
                      {/* Label Details */}
                      <div className="flex-1">
                        <h3 className="text-2xl font-bold mb-1">{config.name || "Your Record Label"}</h3>
                        <p className="text-muted-foreground mb-4">
                          {labelTypes.find(t => t.id === config.type)?.name || "Record Label"}
                        </p>
                        
                        <div className="space-y-4">
                          <div>
                            <Label className="text-sm text-muted-foreground">Genre</Label>
                            <p className="font-medium">{genres.find(g => g.id === config.genre)?.name || "Not selected"}</p>
                          </div>
                          
                          <div>
                            <Label className="text-sm text-muted-foreground">Distribution Platforms</Label>
                            <div className="flex flex-wrap gap-2 mt-1">
                              {(config.platforms || []).map(platform => {
                                const plat = platforms.find(p => p.id === platform);
                                return (
                                  <div 
                                    key={platform}
                                    className="bg-orange-500/10 text-orange-500 px-2 py-1 rounded-md text-sm flex items-center gap-1"
                                  >
                                    {plat?.icon}
                                    {plat?.name}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                          
                          <div>
                            <Label className="text-sm text-muted-foreground">AI Artists</Label>
                            <p className="font-medium">{config.artistCount} artists</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Artists Preview */}
                    <div className="mt-6 border-t pt-4">
                      <h4 className="font-semibold mb-3">Generated Artists</h4>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {(config.artists || []).map((artist, index) => (
                          <div key={artist.id} className="flex items-center gap-2">
                            <div className="w-10 h-10 bg-orange-500/10 rounded-full flex items-center justify-center">
                              <Music2 className="h-5 w-5 text-orange-500" />
                            </div>
                            <span>{artist.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </Card>
                </div>
                
                {/* Integrations */}
                <Card className="p-6">
                  <h3 className="font-semibold mb-4">Label Integrations</h3>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-orange-500/10 rounded-full flex items-center justify-center">
                        <Wand2 className="h-5 w-5 text-orange-500" />
                      </div>
                      <div>
                        <p className="font-medium">AI Marketing Assistant</p>
                        <p className="text-sm text-muted-foreground">Personalized strategies</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-orange-500/10 rounded-full flex items-center justify-center">
                        <Calendar className="h-5 w-5 text-orange-500" />
                      </div>
                      <div>
                        <p className="font-medium">Release Automation</p>
                        <p className="text-sm text-muted-foreground">Scheduled publishing</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-orange-500/10 rounded-full flex items-center justify-center">
                        <BarChart2 className="h-5 w-5 text-orange-500" />
                      </div>
                      <div>
                        <p className="font-medium">Analytics Dashboard</p>
                        <p className="text-sm text-muted-foreground">Performance tracking</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-orange-500/10 rounded-full flex items-center justify-center">
                        <Globe className="h-5 w-5 text-orange-500" />
                      </div>
                      <div>
                        <p className="font-medium">Global Distribution</p>
                        <p className="text-sm text-muted-foreground">Multi-platform support</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-6 pt-4 border-t">
                    <Button 
                      className="w-full bg-orange-500 hover:bg-orange-600"
                      onClick={createRecordLabel}
                      disabled={isCreatingLabel}
                    >
                      {isCreatingLabel ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        <>
                          <Building2 className="mr-2 h-4 w-4" />
                          Create My Virtual Record Label
                          <Bot className="ml-2 h-4 w-4 text-orange-400" />
                        </>
                      )}
                    </Button>
                  </div>
                </Card>
              </div>

              <div className="flex justify-between">
                <Button 
                  variant="outline"
                  onClick={prevStep}
                >
                  Back
                </Button>
                <Button 
                  className="bg-orange-500 hover:bg-orange-600"
                  onClick={createRecordLabel}
                  disabled={isCreatingLabel}
                >
                  {isCreatingLabel ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Building2 className="mr-2 h-4 w-4" />
                      Create My Virtual Record Label
                      <Bot className="ml-2 h-4 w-4 text-orange-400" />
                    </>
                  )}
                </Button>
              </div>
            </motion.div>
          )}

          {/* Step 5: Success */}
          {currentStep === 5 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="text-center space-y-6"
            >
              <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto">
                <Check className="h-10 w-10 text-green-600 dark:text-green-400" />
              </div>
              
              <div>
                <h2 className="text-2xl font-bold mb-2">Your Virtual Record Label is Ready!</h2>
                <p className="text-muted-foreground mb-6 max-w-lg mx-auto">
                  Congratulations! You've successfully created your AI-powered record label. 
                  You can now manage your artists, releases, and marketing from your dashboard.
                </p>
              </div>
              
              <div className="flex flex-col md:flex-row gap-4 justify-center">
                <Button 
                  className="bg-orange-500 hover:bg-orange-600"
                  size="lg"
                >
                  <Building2 className="mr-2 h-5 w-5" />
                  Go to Label Dashboard
                </Button>
                <Button 
                  variant="outline"
                  size="lg"
                >
                  <ArrowRight className="mr-2 h-5 w-5" />
                  Explore Label Tools
                </Button>
              </div>
            </motion.div>
          )}
        </div>
      </section>

      {/* Testimonials */}
      <section className="bg-muted py-16">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Success Stories</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Join hundreds of creators who are building successful music businesses with Virtual Record Labels
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={testimonial.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <Card className="p-6 h-full">
                  <div className="mb-4 flex items-center gap-4">
                    <img 
                      src={testimonial.image} 
                      alt={testimonial.name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                    <div>
                      <h3 className="font-semibold">{testimonial.name}</h3>
                      <p className="text-sm text-orange-500">{testimonial.label}</p>
                    </div>
                  </div>
                  <p className="text-muted-foreground italic">"{testimonial.quote}"</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="container py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Frequently Asked Questions</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Everything you need to know about Virtual Record Labels and AI artists
          </p>
        </div>
        
        <div className="max-w-3xl mx-auto space-y-6">
          {faqs.map((faq, index) => (
            <Card key={index} className="p-6">
              <h3 className="text-xl font-semibold mb-2">{faq.question}</h3>
              <p className="text-muted-foreground">{faq.answer}</p>
            </Card>
          ))}
        </div>
        
        <div className="text-center mt-12">
          <p className="text-muted-foreground mb-6">Still have questions?</p>
          <Button 
            className="bg-orange-500 hover:bg-orange-600"
            size="lg"
          >
            <MessageSquare className="mr-2 h-5 w-5" />
            Contact Support
          </Button>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-orange-500 to-purple-600 text-white py-16">
        <div className="container text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Launch Your Virtual Record Label?</h2>
          <p className="max-w-2xl mx-auto mb-8 text-white/90">
            Start your journey today and join the future of music creation and distribution.
          </p>
          <Button 
            size="lg" 
            className="bg-white text-orange-500 hover:bg-white/90"
            onClick={() => setCurrentStep(1)}
          >
            <Building2 className="mr-2 h-5 w-5" />
            Create Your Label Now
          </Button>
        </div>
      </section>
    </div>
  );
}