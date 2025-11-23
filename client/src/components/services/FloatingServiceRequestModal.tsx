import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { X, AlertCircle, DollarSign, Clock } from "lucide-react";
import { apiRequest } from "../../lib/queryClient";

const MOCK_REQUESTS = [
  {
    id: 999001,
    title: "Need Professional Vocal Recording",
    description: "Looking for a high-quality vocal recording for my indie track. Need something with good presence.",
    serviceType: "vocals",
    budget: "$200-300",
    client: { displayName: "Alex Music Studios" },
  },
  {
    id: 999002,
    title: "Guitar Solo Composition",
    description: "Need a creative guitar solo for my rock anthem. Modern, energetic style preferred.",
    serviceType: "guitar",
    budget: "$150-250",
    client: { displayName: "Creative Beats" },
  },
  {
    id: 999003,
    title: "Mixing & Mastering Service",
    description: "Have a full 8-track song ready for professional mixing and mastering.",
    serviceType: "mixing",
    budget: "$300+",
    client: { displayName: "Indie Label Co" },
  },
  {
    id: 999004,
    title: "Drum Programming for Electronic Track",
    description: "Need programmed drums for an electronic/synth track. Looking for punchy, modern sound.",
    serviceType: "drums",
    budget: "$100-200",
    client: { displayName: "Synth Wave Productions" },
  },
  {
    id: 999005,
    title: "Piano Accompaniment Recording",
    description: "Need beautiful piano accompaniment for classical-inspired vocal piece.",
    serviceType: "piano",
    budget: "$180-280",
    client: { displayName: "Classical Fusion Studio" },
  },
];

interface FloatingServiceRequest {
  id: number;
  title: string;
  description: string;
  serviceType: string;
  budget?: string;
  client?: { displayName: string };
}

export function FloatingServiceRequestModal() {
  const [isVisible, setIsVisible] = useState(false);
  const [currentRequest, setCurrentRequest] = useState<FloatingServiceRequest | null>(null);
  const [allRequests, setAllRequests] = useState<FloatingServiceRequest[]>(MOCK_REQUESTS);

  // Load real requests from API
  useEffect(() => {
    const loadRequests = async () => {
      try {
        const data = await apiRequest({
          url: "/api/social/service-requests?status=open",
          method: "GET"
        }) as any[];
        
        if (data && data.length > 0) {
          setAllRequests([...data, ...MOCK_REQUESTS]);
        }
      } catch (error) {
        // Keep mock requests if API fails
        console.log("Using demo requests");
      }
    };

    loadRequests();
  }, []);

  // Show random request every 15 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (allRequests.length > 0) {
        const randomRequest = allRequests[Math.floor(Math.random() * allRequests.length)];
        setCurrentRequest(randomRequest);
        setIsVisible(true);

        // Auto-hide after 8 seconds
        const timeout = setTimeout(() => {
          setIsVisible(false);
        }, 8000);

        return () => clearTimeout(timeout);
      }
    }, 15000);

    return () => clearInterval(interval);
  }, [allRequests]);

  const handleClose = () => {
    setIsVisible(false);
  };

  if (!currentRequest) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ duration: 0.3 }}
          className="fixed bottom-6 right-6 z-50 w-96 max-w-[calc(100vw-2rem)]"
        >
          <Card className="border-orange-500/30 bg-gradient-to-br from-slate-900 to-slate-800 shadow-2xl">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <AlertCircle className="h-4 w-4 text-orange-500 animate-pulse" />
                    <span className="text-xs font-semibold text-orange-400">NEW REQUEST</span>
                  </div>
                  <CardTitle className="text-base line-clamp-2">{currentRequest.title}</CardTitle>
                </div>
                <button
                  onClick={handleClose}
                  className="flex-shrink-0 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </CardHeader>

            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground line-clamp-2">
                {currentRequest.description}
              </p>

              <div className="flex items-center gap-3 text-xs">
                <span className="px-2 py-1 rounded-full bg-orange-500/10 text-orange-400 font-medium">
                  {currentRequest.serviceType}
                </span>
                {currentRequest.budget && (
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <DollarSign className="h-3 w-3" />
                    <span>{currentRequest.budget}</span>
                  </div>
                )}
              </div>

              <div className="pt-2 border-t border-slate-700">
                <p className="text-xs text-muted-foreground mb-3">
                  Posted by <span className="text-slate-300">{currentRequest.client?.displayName}</span>
                </p>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    className="flex-1 bg-orange-500 hover:bg-orange-600 text-white"
                    onClick={handleClose}
                  >
                    View Details
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="px-3"
                    onClick={handleClose}
                  >
                    Dismiss
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
