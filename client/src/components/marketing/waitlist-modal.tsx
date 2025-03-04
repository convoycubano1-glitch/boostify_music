import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { Mail, Timer, Calendar } from "lucide-react";
import { collection, addDoc, query, where, getDocs, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

export function WaitlistModal() {
  const [open, setOpen] = useState(true);
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [timeLeft, setTimeLeft] = useState(20);
  const [daysUntilLaunch, setDaysUntilLaunch] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    // Calculate days until April 1st, 2025
    const calculateDaysUntilLaunch = () => {
      const launchDate = new Date('2025-04-01T00:00:00');
      const now = new Date();
      const diffTime = launchDate.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      setDaysUntilLaunch(diffDays);
    };

    calculateDaysUntilLaunch();

    if (!open) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setOpen(false);
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    try {
      setIsSubmitting(true);
      console.log("Attempting to add email to waitlist:", email); // Debug log

      // Check if email already exists
      const waitlistRef = collection(db, "waitlist");
      const q = query(waitlistRef, where("email", "==", email));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        toast({
          title: "Already Registered",
          description: "This email is already on our waitlist!",
          variant: "default",
        });
        return;
      }

      // Add new email to waitlist with additional metadata
      const docRef = await addDoc(waitlistRef, {
        email,
        createdAt: serverTimestamp(),
        source: window.location.hostname,
        userAgent: navigator.userAgent,
        referrer: document.referrer || 'direct',
        status: 'active',
        notificationsSent: 0,
        daysUntilLaunch
      });

      console.log("Successfully added to waitlist with ID:", docRef.id); // Debug log

      toast({
        title: "Welcome to the Waitlist!",
        description: "You'll be notified when we launch on April 1st, 2025. Try our beta features, including the new Kling tools (Virtual Try-On, Lipsync, and Effects).",
      });
      setOpen(false);
    } catch (error) {
      console.error("Error adding to waitlist:", error);
      toast({
        title: "Error",
        description: "Failed to join waitlist. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md border-orange-500/20">
        <DialogTitle className="sr-only">Boostify Music Waitlist</DialogTitle>
        <div className="relative overflow-hidden">
          {/* Timer */}
          <div className="absolute top-0 right-0 p-2">
            <motion.div 
              className="bg-orange-500/10 backdrop-blur-sm rounded-full px-3 py-1 text-sm font-medium text-orange-500 flex items-center gap-2"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Timer className="h-4 w-4" />
              {timeLeft}s
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            <div className="space-y-2 text-center">
              <h2 className="text-2xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-orange-500 to-red-500">
                Join Our Waitlist
              </h2>
              <div className="flex flex-col items-center gap-2">
                <p className="text-sm text-muted-foreground">
                  Get early access when we launch
                </p>
                <div className="bg-orange-500/10 rounded-lg px-4 py-2">
                  <p className="text-xl font-bold text-orange-500">
                    {daysUntilLaunch} days until launch!
                  </p>
                  <p className="text-sm text-muted-foreground">April 1st, 2025</p>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-orange-500/5 to-red-500/5 rounded-lg blur-xl" />
              <div className="relative bg-background/50 backdrop-blur-sm rounded-lg p-4 border border-orange-500/10">
                <p className="text-sm text-muted-foreground">
                  All features are currently in beta mode until our official launch on April 1st, 2025. Our new Kling tools (Virtual Try-On, Lipsync, and Effects) are also available for testing. Feel free to explore our platform and provide feedback!
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-orange-500/10 to-red-500/10 rounded-lg blur-lg" />
                <div className="relative flex gap-2">
                  <div className="relative flex-1">
                    <Mail className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                    <Input
                      type="email"
                      placeholder="Enter your email"
                      className="pl-10 bg-background/50 backdrop-blur-sm border-orange-500/20"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="bg-orange-500 hover:bg-orange-600"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Joining..." : "Join Waitlist"}
                  </Button>
                </div>
              </div>
            </form>

            {/* Beta Features Container */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-orange-500/10 to-red-500/10 rounded-lg blur-lg" />
              <div className="relative bg-background/50 backdrop-blur-sm rounded-lg p-6 border border-orange-500/20">
                <div className="flex flex-col items-center gap-4">
                  <div className="flex items-center gap-2 text-orange-500">
                    <Calendar className="h-5 w-5" />
                    <span className="font-medium">Beta Features Available</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 w-full">
                    <div className="p-2 bg-orange-500/10 rounded-lg text-center">
                      <p className="text-sm font-medium text-orange-500">Virtual Try-On</p>
                    </div>
                    <div className="p-2 bg-orange-500/10 rounded-lg text-center">
                      <p className="text-sm font-medium text-orange-500">Lipsync</p>
                    </div>
                    <div className="p-2 bg-orange-500/10 rounded-lg text-center">
                      <p className="text-sm font-medium text-orange-500">Effects</p>
                    </div>
                  </div>
                  <p className="text-sm text-center text-muted-foreground">
                    Try our beta features before official launch
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </DialogContent>
    </Dialog>
  );
}