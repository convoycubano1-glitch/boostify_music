import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";
import { 
  Phone, 
  X, 
  Music, 
  Video, 
  Palette, 
  Camera, 
  BriefcaseBusiness, 
  LucideIcon,
  HelpCircle,
  Sparkles,
  Scale,
  Users2,
  Search,
  Filter,
  ArrowRight
} from "lucide-react";
import { Button } from "../components/ui/button";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from "../components/ui/dialog";
import { toast } from "../hooks/use-toast";
import { SubscriptionFeature } from "../components/subscription/subscription-feature";

interface Advisor {
  id: string;
  name: string;
  title: string;
  description: string;
  icon: LucideIcon;
  phoneNumber: string;
  color: string;
  animationDelay: number;
}

export default function AIAdvisorsPage() {
  const [open, setOpen] = useState(false);
  const [selectedAdvisor, setSelectedAdvisor] = useState<Advisor | null>(null);
  const [calling, setCalling] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [, setLocation] = useLocation();

  const advisors: Advisor[] = [
    {
      id: "publicist",
      name: "Sarah Mills",
      title: "Publicist",
      description: "Expert in media relations, press releases, and public image management. Call to discuss publicity campaigns, media opportunities, or crisis management.",
      icon: Camera,
      phoneNumber: "+1-555-PUBLIC",
      color: "from-rose-500 to-pink-600",
      animationDelay: 0
    },
    {
      id: "manager",
      name: "Mike Reynolds",
      title: "Manager",
      description: "Specializes in career planning, scheduling, and business development. Contact for touring strategies, performance opportunities, and career decisions.",
      icon: BriefcaseBusiness,
      phoneNumber: "+1-555-MANAGE",
      color: "from-blue-500 to-indigo-600",
      animationDelay: 0.1
    },
    {
      id: "creative",
      name: "Alex Chen",
      title: "Creative Assistant",
      description: "Helps with songwriting, composition, and creative direction. Call for inspiration, feedback on your work, or collaborative brainstorming.",
      icon: Music,
      phoneNumber: "+1-555-CREATE",
      color: "from-amber-500 to-orange-600",
      animationDelay: 0.2
    },
    {
      id: "video",
      name: "Jordan Black",
      title: "Video Director",
      description: "Expert in music video production, visual aesthetics, and storytelling. Reach out for concept development, production planning, or visual branding.",
      icon: Video,
      phoneNumber: "+1-555-VIDEO",
      color: "from-violet-500 to-purple-600",
      animationDelay: 0.3
    },
    {
      id: "fashion",
      name: "Taylor Reed",
      title: "Fashion Advisor",
      description: "Specializes in artist image, stage attire, and visual branding. Contact for styling advice, photoshoot concepts, or brand partnerships.",
      icon: Palette,
      phoneNumber: "+1-555-STYLE",
      color: "from-emerald-500 to-teal-600",
      animationDelay: 0.4
    },
    {
      id: "legal",
      name: "Daniel Morgan",
      title: "Legal Advisor",
      description: "Provides expert guidance on contracts, copyright, licensing, and intellectual property issues. Contact for legal consultation on music industry matters.",
      icon: Scale,
      phoneNumber: "+1-555-LEGAL",
      color: "from-cyan-500 to-blue-600",
      animationDelay: 0.5
    },
    {
      id: "community",
      name: "Sophia Patel",
      title: "Community Manager",
      description: "Specializes in fan engagement, social media strategies, and building your artist community. Get advice on growing and nurturing your fanbase.",
      icon: Users2,
      phoneNumber: "+1-555-SOCIAL",
      color: "from-pink-500 to-purple-600",
      animationDelay: 0.6
    },
    {
      id: "support",
      name: "Jamie West",
      title: "Support Specialist",
      description: "Here to help with any questions about the platform, technical issues, or general assistance. Your go-to problem solver for anything Boostify-related.",
      icon: HelpCircle,
      phoneNumber: "+1-555-HELP",
      color: "from-gray-500 to-slate-600",
      animationDelay: 0.7
    }
  ];

  // Define categories for filtering
  const categories = [
    { id: "all", name: "All Advisors" },
    { id: "creative", name: "Creative" },
    { id: "business", name: "Business" },
    { id: "legal", name: "Legal" },
    { id: "support", name: "Support" }
  ];

  // Filter advisors based on search query and category
  const filteredAdvisors = advisors.filter(advisor => {
    // Filter by search query
    const matchesSearch = 
      searchQuery === "" || 
      advisor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      advisor.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      advisor.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Filter by category
    const matchesCategory = 
      filterCategory === "all" ||
      (filterCategory === "creative" && ["creative", "video", "fashion"].includes(advisor.id)) ||
      (filterCategory === "business" && ["publicist", "manager", "community"].includes(advisor.id)) ||
      (filterCategory === "legal" && advisor.id === "legal") ||
      (filterCategory === "support" && advisor.id === "support");
    
    return matchesSearch && matchesCategory;
  });

  // Función para llamar a un asesor, encapsulada para control de acceso
  const callAdvisor = (advisor: Advisor) => {
    setSelectedAdvisor(advisor);
    setCalling(true);
    
    // Simulate a call connection
    setTimeout(() => {
      setCalling(false);
      toast({
        title: "Call Connected",
        description: `You're now speaking with ${advisor.name}, your ${advisor.title.toLowerCase()}.`,
      });
    }, 2000);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-[#0F0F13]">
      {/* Floating particles for creative effect */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(15)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 rounded-full bg-orange-500/30"
            initial={{ 
              x: `${Math.random() * 100}vw`, 
              y: `${Math.random() * 100}vh`,
              opacity: Math.random() * 0.5 + 0.3
            }}
            animate={{ 
              x: `${Math.random() * 100}vw`, 
              y: `${Math.random() * 100}vh`,
              opacity: [Math.random() * 0.5 + 0.3, 0.1, Math.random() * 0.5 + 0.3]
            }}
            transition={{ 
              duration: Math.random() * 20 + 20,
              repeat: Infinity,
              ease: "linear"
            }}
            style={{ width: `${Math.random() * 4 + 1}px`, height: `${Math.random() * 4 + 1}px` }}
          />
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 w-full max-w-5xl"
      >
        <div className="rounded-2xl overflow-hidden bg-[#16161A] border border-[#27272A]">
          <div className="relative p-8 md:p-10">
            {/* Header with gradient line */}
            <div className="mb-6 mt-4">
              <div className="h-1 w-20 bg-gradient-to-r from-orange-500 to-pink-500 rounded-full mb-6"></div>
              <div className="flex justify-between items-start">
                <div>
                  <motion.h1 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-300"
                  >
                    AI Advisory Team
                  </motion.h1>
                  <motion.p 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                    className="text-gray-400 mt-2"
                  >
                    Personalized expert guidance available 24/7
                  </motion.p>
                </div>
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 300, delay: 0.4 }}
                >
                  <Sparkles className="h-6 w-6 text-orange-500" />
                </motion.div>
              </div>
            </div>

            {/* Search and filter bar */}
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="mb-8 flex flex-col md:flex-row gap-4"
            >
              {/* Search box */}
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  className="w-full pl-10 pr-4 py-2 bg-[#1C1C24] border border-[#27272A] rounded-lg focus:outline-none focus:ring-1 focus:ring-orange-500 text-white text-sm"
                  placeholder="Search advisors by name, title or expertise..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {/* Category filter buttons */}
              <div className="flex gap-2 overflow-x-auto pb-1 md:pb-0 scrollbar-hide">
                {categories.map(category => (
                  <Button
                    key={category.id}
                    size="sm"
                    variant={filterCategory === category.id ? "default" : "outline"}
                    className={
                      filterCategory === category.id 
                        ? "bg-orange-500 hover:bg-orange-600 text-white" 
                        : "border-[#27272A] text-gray-300 hover:bg-[#27272A] hover:text-white"
                    }
                    onClick={() => setFilterCategory(category.id)}
                  >
                    {category.id === "all" && <Filter className="h-3.5 w-3.5 mr-1.5" />}
                    {category.name}
                  </Button>
                ))}
              </div>
            </motion.div>

            {/* Results count */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.6 }}
              className="mb-6 text-sm text-gray-400"
            >
              {filteredAdvisors.length === 0 ? (
                <p>No advisors found matching your criteria. Try adjusting your search.</p>
              ) : (
                <p>Showing {filteredAdvisors.length} {filteredAdvisors.length === 1 ? 'advisor' : 'advisors'}</p>
              )}
            </motion.div>

            {/* Advisor cards with staggered animation */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredAdvisors.map((advisor, index) => (
                <motion.div
                  key={advisor.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.5 + (index * 0.1) }}
                  whileHover={{ 
                    y: -5,
                    transition: { duration: 0.2 }
                  }}
                  className="group"
                >
                  <div className="relative overflow-hidden rounded-xl bg-[#1C1C24] border border-[#27272A]">
                    {/* Gradient overlay that appears on hover */}
                    <div className="absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-10 transition-opacity duration-300" 
                         style={{ backgroundImage: `linear-gradient(to bottom right, var(--${advisor.color}))` }}></div>
                    
                    {/* Subtle gradient line at top */}
                    <div className="h-1 w-full bg-gradient-to-r opacity-80" 
                         style={{ backgroundImage: `linear-gradient(to right, var(--${advisor.color}))` }}></div>
                    
                    <div className="p-6">
                      <div className="flex items-center mb-4">
                        <div className={`flex p-3 rounded-full bg-gradient-to-br ${advisor.color}`}>
                          <advisor.icon className="h-5 w-5 text-white" />
                        </div>
                        <div className="ml-3">
                          <h3 className="text-lg font-bold text-white">{advisor.name}</h3>
                          <p className="text-xs font-medium text-gray-400">{advisor.title}</p>
                        </div>
                      </div>
                      
                      <p className="text-gray-400 text-sm mb-5 line-clamp-3">{advisor.description}</p>
                      
                      {advisor.id === "publicist" ? (
                        // Sarah Mills (Publicist) is available on the free plan
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full border border-[#27272A] text-white hover:bg-[#27272A] group-hover:border-opacity-0 group-hover:bg-gradient-to-r transition-all duration-300"
                          style={{ 
                            backgroundImage: `linear-gradient(to right, var(--${advisor.color}))`,
                            opacity: 0.9,
                            backgroundSize: '0 100%',
                            backgroundRepeat: 'no-repeat',
                            transition: 'background-size 0.3s ease'
                          }}
                          onClick={() => callAdvisor(advisor)}
                        >
                          <Phone className="h-4 w-4 mr-2" /> Contact Advisor
                        </Button>
                      ) : (
                        // Other advisors require Pro plan ($99.99/month)
                        <SubscriptionFeature
                          requiredPlan="pro"
                          title="Premium AI Advisory Team"
                          description="Upgrade to Pro ($99.99/month) to access our complete team of expert AI advisors for personalized guidance and professional support"
                          adminEmails={['convoycubano@gmail.com']}
                          redirectUrl="/pricing"
                          preview={true}
                        >
                          <div className="flex flex-col space-y-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="w-full border border-[#27272A] text-white hover:bg-[#27272A] group-hover:border-opacity-0 group-hover:bg-gradient-to-r transition-all duration-300"
                              style={{ 
                                backgroundImage: `linear-gradient(to right, var(--${advisor.color}))`,
                                opacity: 0.9,
                                backgroundSize: '0 100%',
                                backgroundRepeat: 'no-repeat',
                                transition: 'background-size 0.3s ease'
                              }}
                              onClick={() => callAdvisor(advisor)}
                            >
                              <Phone className="h-4 w-4 mr-2" /> Contact Advisor
                            </Button>
                            <Button
                              variant="default"
                              size="sm"
                              className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold px-4 py-2 shadow-lg"
                              onClick={() => setLocation("/pricing")}
                            >
                              Suscribirse PRO ($99.99/mes)
                            </Button>
                          </div>
                        </SubscriptionFeature>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      <Dialog open={selectedAdvisor !== null} onOpenChange={(open) => !open && setSelectedAdvisor(null)}>
        <DialogContent 
          className="sm:max-w-md border-[#27272A] bg-[#16161A] text-white" 
          aria-describedby="advisor-dialog-description"
        >
          <DialogHeader>
            <DialogTitle className="flex items-center text-white">
              {calling ? (
                <span className="flex items-center">
                  <span className="animate-pulse mr-2">📞</span> 
                  Calling...
                </span>
              ) : (
                <span>Connected with {selectedAdvisor?.name}</span>
              )}
            </DialogTitle>
            <DialogDescription id="advisor-dialog-description" className="text-gray-400">
              {calling ? (
                <div className="flex flex-col items-center justify-center py-6">
                  <div className="relative w-24 h-24 mb-4">
                    <motion.div 
                      className="absolute inset-0 rounded-full bg-gradient-to-r from-orange-500 to-pink-500"
                      animate={{ 
                        scale: [1, 1.1, 1],
                        opacity: [0.5, 0.8, 0.5]
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                    />
                    <div className="absolute inset-2 bg-[#16161A] rounded-full flex items-center justify-center">
                      <Phone className="h-8 w-8 text-orange-500 animate-bounce" />
                    </div>
                  </div>
                  <p className="text-gray-300">Connecting to your {selectedAdvisor?.title}...</p>
                </div>
              ) : (
                <div className="py-4">
                  <p>You're now connected with your {selectedAdvisor?.title?.toLowerCase() || "advisor"}. This AI advisor is ready to help with any questions or guidance you need.</p>
                  <div className="flex items-center mt-4 p-4 bg-[#1C1C24] rounded-lg border border-[#27272A]">
                    <div className="mr-3 bg-gradient-to-r from-orange-500 to-pink-500 rounded-full p-2 flex-shrink-0">
                      {selectedAdvisor && <selectedAdvisor.icon className="h-4 w-4 text-white" />}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">{selectedAdvisor?.name}</p>
                      <p className="text-xs text-gray-400">AI {selectedAdvisor?.title}</p>
                    </div>
                  </div>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          {!calling && (
            <div className="flex flex-col space-y-3">
              <div className="bg-[#1C1C24] p-3 rounded-lg border border-[#27272A]">
                <p className="text-sm italic text-gray-400">This feature will connect to an AI agent trained specifically to provide expert advice in {selectedAdvisor?.title?.toLowerCase() || "advisor"} services.</p>
              </div>
            </div>
          )}
          <DialogFooter className="gap-2 sm:gap-0">
            {!calling && (
              <Button
                type="button" 
                variant="outline" 
                className="border-orange-500/50 text-orange-500 hover:bg-orange-500/10"
                onClick={() => setSelectedAdvisor(null)}
              >
                End Call
              </Button>
            )}
            {calling && (
              <Button
                type="button" 
                variant="destructive"
                onClick={() => {
                  setCalling(false);
                  setSelectedAdvisor(null);
                }}
              >
                Cancel
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}