import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Phone, 
  X, 
  Music, 
  Video, 
  Palette, 
  Camera, 
  BriefcaseBusiness, 
  LucideIcon,
  HelpCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";

interface Advisor {
  id: string;
  name: string;
  title: string;
  description: string;
  icon: LucideIcon;
  phoneNumber: string;
  color: string;
}

export default function AIAdvisorsPage() {
  const [open, setOpen] = useState(false);
  const [selectedAdvisor, setSelectedAdvisor] = useState<Advisor | null>(null);
  const [calling, setCalling] = useState(false);

  const advisors: Advisor[] = [
    {
      id: "publicist",
      name: "Sarah Mills",
      title: "Publicist",
      description: "Expert in media relations, press releases, and public image management. Call to discuss publicity campaigns, media opportunities, or crisis management.",
      icon: Camera,
      phoneNumber: "+1-555-PUBLIC",
      color: "from-rose-500 to-pink-600"
    },
    {
      id: "manager",
      name: "Mike Reynolds",
      title: "Manager",
      description: "Specializes in career planning, scheduling, and business development. Contact for touring strategies, performance opportunities, and career decisions.",
      icon: BriefcaseBusiness,
      phoneNumber: "+1-555-MANAGE",
      color: "from-blue-500 to-indigo-600"
    },
    {
      id: "creative",
      name: "Alex Chen",
      title: "Creative Assistant",
      description: "Helps with songwriting, composition, and creative direction. Call for inspiration, feedback on your work, or collaborative brainstorming.",
      icon: Music,
      phoneNumber: "+1-555-CREATE",
      color: "from-amber-500 to-orange-600"
    },
    {
      id: "video",
      name: "Jordan Black",
      title: "Video Director",
      description: "Expert in music video production, visual aesthetics, and storytelling. Reach out for concept development, production planning, or visual branding.",
      icon: Video,
      phoneNumber: "+1-555-VIDEO",
      color: "from-violet-500 to-purple-600"
    },
    {
      id: "fashion",
      name: "Taylor Reed",
      title: "Fashion Advisor",
      description: "Specializes in artist image, stage attire, and visual branding. Contact for styling advice, photoshoot concepts, or brand partnerships.",
      icon: Palette,
      phoneNumber: "+1-555-STYLE",
      color: "from-emerald-500 to-teal-600"
    },
    {
      id: "support",
      name: "Jamie West",
      title: "Support Specialist",
      description: "Here to help with any questions about the platform, technical issues, or general assistance. Your go-to problem solver for anything Boostify-related.",
      icon: HelpCircle,
      phoneNumber: "+1-555-HELP",
      color: "from-gray-500 to-slate-600"
    }
  ];

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
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-background">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-4xl"
      >
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl overflow-hidden">
          <div className="p-6 md:p-8">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  Your AI Advisory Team
                </h1>
                <p className="text-gray-500 dark:text-gray-400 mt-2">
                  Expert guidance available 24/7 through personalized AI advisors
                </p>
              </div>
              <Button
                variant="outline"
                size="icon"
                className="rounded-full"
                onClick={() => setOpen(!open)}
              >
                <Phone className="h-5 w-5" />
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {advisors.map((advisor) => (
                <motion.div
                  key={advisor.id}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                  className="relative group"
                >
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-r opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10" 
                       style={{ backgroundImage: `linear-gradient(to right, var(--${advisor.color}))` }}></div>
                  <div className="p-6 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-xl shadow-sm group-hover:shadow-md transition-all duration-300">
                    <div className={`inline-flex p-3 rounded-full bg-gradient-to-br ${advisor.color} mb-4`}>
                      <advisor.icon className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{advisor.name}</h3>
                    <p className="text-sm font-medium text-primary mb-2">{advisor.title}</p>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">{advisor.description}</p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full group-hover:bg-primary group-hover:text-white transition-colors duration-300"
                      onClick={() => callAdvisor(advisor)}
                    >
                      <Phone className="h-4 w-4 mr-2" /> Contact
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      <Dialog open={selectedAdvisor !== null} onOpenChange={(open) => !open && setSelectedAdvisor(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              {calling ? (
                <span className="flex items-center">
                  <span className="animate-pulse mr-2">📞</span> 
                  Calling...
                </span>
              ) : (
                <span>Connected with {selectedAdvisor?.name}</span>
              )}
            </DialogTitle>
            <DialogDescription>
              {calling ? (
                <div className="flex flex-col items-center justify-center py-4">
                  <div className="relative w-24 h-24 mb-4">
                    <div className="absolute inset-0 rounded-full bg-gradient-to-r from-primary to-primary/80 animate-pulse"></div>
                    <div className="absolute inset-2 bg-background rounded-full flex items-center justify-center">
                      <Phone className="h-8 w-8 text-primary animate-bounce" />
                    </div>
                  </div>
                  <p>Connecting to your {selectedAdvisor?.title}...</p>
                </div>
              ) : (
                <div className="py-4">
                  <p>You're now connected with your {selectedAdvisor?.title.toLowerCase()}. This AI advisor is ready to help with any questions or guidance you need.</p>
                  <div className="flex items-center mt-4 p-3 bg-primary/10 rounded-lg">
                    <div className="mr-3 bg-primary rounded-full p-2">
                      {selectedAdvisor && <selectedAdvisor.icon className="h-4 w-4 text-white" />}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{selectedAdvisor?.name}</p>
                      <p className="text-xs text-gray-500">AI {selectedAdvisor?.title}</p>
                    </div>
                  </div>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          {!calling && (
            <div className="flex flex-col space-y-3">
              <div className="bg-muted p-3 rounded-lg">
                <p className="text-sm italic">This feature will connect to an AI agent trained specifically to provide expert advice in {selectedAdvisor?.title.toLowerCase()} services.</p>
              </div>
            </div>
          )}
          <DialogFooter className="gap-2 sm:gap-0">
            {!calling && (
              <Button
                type="button" 
                variant="secondary"
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