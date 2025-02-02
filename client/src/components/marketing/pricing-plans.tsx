import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Check, Crown } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { loadStripe } from "@stripe/stripe-js";
import { getAuthToken } from "@/lib/firebase";
import { useState } from "react";

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

const plans = [
  {
    name: "Basic",
    price: 19,
    features: [
      "Basic Analytics",
      "Spotify Integration",
      "1 Artist Profile",
      "Email Support"
    ],
    description: "Perfect for emerging artists starting their journey",
    popular: false,
    priceId: "price_1Oq2YuBwX8aK6b3XhGjK9J2Y"
  },
  {
    name: "Pro",
    price: 49,
    features: [
      "Advanced Analytics",
      "Priority Spotify Integration",
      "5 Artist Profiles",
      "PR Management Tools",
      "24/7 Support"
    ],
    description: "Best for growing artists and small labels",
    popular: true,
    priceId: "price_1Oq2ZsBwX8aK6b3XQrY8K9L3"
  },
  {
    name: "Enterprise",
    price: 99,
    features: [
      "Custom Analytics",
      "Multiple Artist Management",
      "Dedicated Account Manager",
      "API Access",
      "Custom Integrations"
    ],
    description: "For professional artists and labels",
    popular: false,
    priceId: "price_1Oq2a7BwX8aK6b3XmNpL5K8M"
  }
];

export function PricingPlans() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [showDialog, setShowDialog] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<typeof plans[0] | null>(null);

  const handlePlanSelect = (plan: typeof plans[0]) => {
    console.log('Plan selected:', plan.name);
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to subscribe to a plan",
        variant: "destructive"
      });
      return;
    }
    setSelectedPlan(plan);
    setShowDialog(true);
  };

  const handlePayment = async () => {
    if (!selectedPlan) return;

    try {
      const token = await getAuthToken();
      if (!token) {
        toast({
          title: "Authentication Error",
          description: "Please log in to continue",
          variant: "destructive"
        });
        return;
      }

      const stripe = await stripePromise;
      if (!stripe) {
        throw new Error("Could not initialize Stripe");
      }

      // Create Stripe checkout session
      const response = await fetch('/api/create-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          priceId: selectedPlan.priceId,
          planName: selectedPlan.name,
          price: selectedPlan.price
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error creating subscription session');
      }

      const { sessionId } = await response.json();
      if (!sessionId) {
        throw new Error('Stripe session ID was not received');
      }

      // Redirect to Stripe checkout
      const { error } = await stripe.redirectToCheckout({
        sessionId
      });

      if (error) {
        throw new Error(error.message);
      }
    } catch (error: any) {
      console.error('Payment process error:', error);
      toast({
        title: "Payment Error",
        description: error.message || "There was an error processing your subscription. Please try again.",
        variant: "destructive"
      });
    } finally {
      setShowDialog(false);
    }
  };

  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-orange-500 to-orange-500/70 bg-clip-text text-transparent">
          Choose Your Plan
        </h2>
        <p className="mt-4 text-lg text-muted-foreground">
          Flexible plans for every stage of your career
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-3 max-w-7xl mx-auto">
        {plans.map((plan) => (
          <div key={plan.name}>
            <Card className={`p-8 ${plan.popular ? 'border-orange-500' : ''}`}>
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-orange-500 text-white px-3 py-1 rounded-full text-sm font-medium inline-flex items-center gap-1">
                    <Crown className="w-4 h-4" />
                    Most Popular
                  </span>
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-2xl font-bold">{plan.name}</h3>
                <div className="mt-4 flex items-baseline">
                  <span className="text-4xl font-bold">${plan.price}</span>
                  <span className="text-muted-foreground ml-2">/mo</span>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  {plan.description}
                </p>
              </div>

              <ul className="space-y-3 mb-6">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-orange-500 flex-shrink-0" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>

              <Button 
                className={`w-full ${
                  plan.popular 
                    ? 'bg-orange-500 hover:bg-orange-600 text-white' 
                    : 'bg-orange-500/10 hover:bg-orange-500/20 text-orange-500'
                }`}
                onClick={() => {
                  console.log('Button clicked for plan:', plan.name);
                  handlePlanSelect(plan);
                }}
              >
                Get Started
              </Button>
            </Card>
          </div>
        ))}
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Subscription</DialogTitle>
            <DialogDescription>
              Review your subscription details before proceeding
            </DialogDescription>
          </DialogHeader>
          {selectedPlan && (
            <div className="space-y-4">
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <h4 className="font-medium">Plan details</h4>
                  <div className="space-y-4 rounded-lg border p-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Plan:</span>
                      <span className="text-sm font-medium">{selectedPlan.name}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Price:</span>
                      <span className="text-lg font-bold">${selectedPlan.price}/mo</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-4">
                <Button variant="outline" onClick={() => setShowDialog(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handlePayment}
                  className="bg-orange-500 hover:bg-orange-600"
                >
                  Confirm Purchase
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}