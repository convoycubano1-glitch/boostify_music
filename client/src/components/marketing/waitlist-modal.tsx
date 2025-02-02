import { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { Mail, Timer } from "lucide-react";
import { collection, addDoc, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

export function WaitlistModal() {
  const [open, setOpen] = useState(true);
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [timeLeft, setTimeLeft] = useState(20);
  const { toast } = useToast();

  useEffect(() => {
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

      // Add new email to waitlist
      await addDoc(waitlistRef, {
        email,
        createdAt: new Date(),
        source: window.location.hostname
      });

      toast({
        title: "Welcome to the Waitlist!",
        description: "You'll be notified when we launch on March 1st, 2025.",
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
              <p className="text-sm text-muted-foreground">
                Get early access when we launch on March 1st, 2025
              </p>
            </div>

            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-orange-500/5 to-red-500/5 rounded-lg blur-xl" />
              <div className="relative bg-background/50 backdrop-blur-sm rounded-lg p-4 border border-orange-500/10">
                <p className="text-sm text-muted-foreground">
                  Feel free to explore our platform features. While most functionality will be available at launch, you can preview what's coming!
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
          </motion.div>
        </div>
      </DialogContent>
    </Dialog>
  );
}