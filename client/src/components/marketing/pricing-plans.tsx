import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Check, Crown } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { loadStripe } from "@stripe/stripe-js";
import { getAuthToken } from "@/lib/firebase";

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
    priceId: "price_basic"
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
    priceId: "price_pro"
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
    priceId: "price_enterprise"
  }
];

export function PricingPlans() {
  const { user } = useAuth();
  const { toast } = useToast();

  const handleGetStarted = async (plan: typeof plans[0]) => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to subscribe to a plan",
        variant: "destructive"
      });
      return;
    }

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
          priceId: plan.priceId,
          planName: plan.name
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
      const { error } = await stripe.redirectToCheckout({ sessionId });

      if (error) {
        throw new Error(error.message);
      }
    } catch (error: any) {
      console.error('Subscription process error:', error);
      toast({
        title: "Subscription Error",
        description: error.message || "There was an error processing your subscription. Please try again.",
        variant: "destructive"
      });
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
        {plans.map((plan, index) => (
          <motion.div
            key={plan.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
          >
            <Card className={`relative p-8 h-full backdrop-blur-sm border-orange-500/10 hover:border-orange-500/30 transition-all duration-300 ${
              plan.popular ? 'border-orange-500/50 shadow-lg' : ''
            }`}>
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <motion.div
                    initial={{ scale: 0.9 }}
                    animate={{ scale: 1 }}
                    transition={{ 
                      duration: 0.3,
                      repeat: Infinity,
                      repeatType: "reverse"
                    }}
                  >
                    <span className="bg-orange-500 text-white px-3 py-1 rounded-full text-sm font-medium inline-flex items-center gap-1">
                      <Crown className="w-4 h-4" />
                      Most Popular
                    </span>
                  </motion.div>
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
                  <motion.li 
                    key={feature} 
                    className="flex items-center gap-2"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Check className="h-4 w-4 text-orange-500 flex-shrink-0" />
                    <span className="text-sm">{feature}</span>
                  </motion.li>
                ))}
              </ul>
              <div className="mt-auto">
                <Button 
                  className={`w-full ${
                    plan.popular 
                      ? 'bg-orange-500 hover:bg-orange-600 text-white' 
                      : 'bg-orange-500/10 hover:bg-orange-500/20 text-orange-500'
                  }`}
                  onClick={() => handleGetStarted(plan)}
                >
                  Get Started
                </Button>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}