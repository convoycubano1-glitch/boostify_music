import { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { Mail, Timer } from "lucide-react";

export function WaitlistModal() {
  const [open, setOpen] = useState(true);
  const [email, setEmail] = useState("");
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
      // TODO: Implement actual waitlist signup
      toast({
        title: "Success!",
        description: "You've been added to our waitlist. We'll notify you when we launch!",
      });
      setOpen(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to join waitlist. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md">
        <div className="relative">
          <div className="absolute -top-12 right-0">
            <div className="bg-orange-500 rounded-full p-2 text-white flex items-center gap-2">
              <Timer className="h-4 w-4" />
              <span className="text-sm font-medium">{timeLeft}s</span>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            <div className="space-y-2 text-center">
              <h2 className="text-2xl font-bold tracking-tight">Join Our Waitlist</h2>
              <p className="text-sm text-muted-foreground">
                Our platform launches on March 1st, 2025. Join the waitlist to be among the first to access our powerful music marketing tools.
              </p>
            </div>

            <div className="bg-muted/50 rounded-lg p-4">
              <p className="text-sm">
                Feel free to explore the platform's features. While most functionality will be available on launch, you can get a preview of what's to come!
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Mail className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                  <Input
                    type="email"
                    placeholder="Enter your email"
                    className="pl-10"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="bg-orange-500 hover:bg-orange-600">
                  Join Waitlist
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
