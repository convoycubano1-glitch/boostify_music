import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Check, Crown, Loader2, Music2, Star, Rocket, Youtube, FileText, Megaphone, ShoppingBag, Brain, Mail, Settings, LineChart } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { loadStripe } from "@stripe/stripe-js";
import { useState, useEffect } from "react";
import { SiSpotify, SiInstagram } from "react-icons/si";

// Handle Stripe initialization safely
const getStripe = async () => {
  if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
    throw new Error("Stripe public key is not configured");
  }
  return await loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);
};

const plans = [
  {
    name: "Starter",
    price: 59.99,
    features: [
      {
        text: "Spotify Analytics Dashboard",
        icon: SiSpotify
      },
      {
        text: "Basic Instagram Management",
        icon: SiInstagram
      },
      {
        text: "5,000 YouTube Views Boost",
        icon: Youtube
      },
      {
        text: "Basic Contract Templates",
        icon: FileText
      },
      {
        text: "1 Merchandise Design/Month",
        icon: ShoppingBag
      },
      {
        text: "Access to 2 AI Models",
        icon: Brain
      },
      {
        text: "Email Support",
        icon: Mail
      },
      {
        text: "Basic Performance Metrics",
        icon: LineChart
      },
      {
        text: "Social Media Calendar",
        icon: Settings
      }
    ],
    description: "Perfect for emerging artists taking their first steps into professional music marketing",
    popular: false,
    priceId: "price_starter_monthly"
  },
  {
    name: "Professional",
    price: 99.99,
    features: [
      {
        text: "Advanced Spotify Analytics",
        icon: SiSpotify
      },
      {
        text: "Instagram Growth Campaigns",
        icon: SiInstagram
      },
      {
        text: "25,000 YouTube Views Boost",
        icon: Youtube
      },
      {
        text: "Custom Contract Creation",
        icon: FileText
      },
      {
        text: "5 Merchandise Designs/Month",
        icon: ShoppingBag
      },
      {
        text: "Access to 5 AI Models",
        icon: Brain
      },
      {
        text: "Basic PR Campaign",
        icon: Megaphone
      },
      {
        text: "Marketing Automation Suite",
        icon: Settings
      },
      {
        text: "Priority Support 24/7",
        icon: Star
      },
      {
        text: "Advanced Analytics Dashboard",
        icon: LineChart
      },
      {
        text: "Content Calendar & Planner",
        icon: Settings
      }
    ],
    description: "Ideal for growing artists and small labels ready to scale their presence",
    popular: true,
    priceId: "price_pro_monthly"
  },
  {
    name: "Enterprise",
    price: 149.99,
    features: [
      {
        text: "Complete Music Marketing Suite",
        icon: Music2
      },
      {
        text: "Premium Spotify Promotion",
        icon: SiSpotify
      },
      {
        text: "Full Instagram Management",
        icon: SiInstagram
      },
      {
        text: "100,000 YouTube Views Boost",
        icon: Youtube
      },
      {
        text: "Advanced Contract System",
        icon: FileText
      },
      {
        text: "Unlimited Merchandise Designs",
        icon: ShoppingBag
      },
      {
        text: "Full AI Models Access",
        icon: Brain
      },
      {
        text: "Complete PR Campaign",
        icon: Megaphone
      },
      {
        text: "Custom Analytics Solution",
        icon: LineChart
      },
      {
        text: "Dedicated Account Manager",
        icon: Star
      },
      {
        text: "Multi-platform Strategy",
        icon: Settings
      },
      {
        text: "Brand Development",
        icon: Star
      }
    ],
    description: "For professional artists and record labels seeking comprehensive management",
    popular: false,
    priceId: "price_enterprise_monthly"
  }
];

export function PricingPlans() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [processingPlanId, setProcessingPlanId] = useState<string | null>(null);
  const [stripeError, setStripeError] = useState<string | null>(null);

  useEffect(() => {
    // Verify Stripe configuration on component load
    getStripe().catch((error) => {
      console.error('Error initializing Stripe:', error);
      setStripeError(error.message);
      toast({
        title: "Configuration Error",
        description: "There's an issue with the payment setup. Please try again later.",
        variant: "destructive"
      });
    });
  }, []);

  const handleSubscribe = async (plan: typeof plans[0]) => {
    if (!user) {
      toast({
        title: "Login Required",
        description: "Please log in to subscribe to a plan",
        variant: "destructive"
      });
      return;
    }

    if (stripeError) {
      toast({
        title: "Configuration Error",
        description: "The payment system is currently unavailable. Please try again later.",
        variant: "destructive"
      });
      return;
    }

    try {
      setProcessingPlanId(plan.priceId);

      const stripe = await getStripe();

      const response = await fetch('/api/create-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId: plan.priceId,
          planName: plan.name,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error creating payment session');
      }

      const { sessionId } = await response.json();
      console.log('Session ID received:', sessionId);

      const { error } = await stripe!.redirectToCheckout({ sessionId });
      if (error) {
        console.error('Error in redirectToCheckout:', error);
        throw error;
      }
    } catch (error: any) {
      console.error('Error in payment process:', error);
      toast({
        title: "Error",
        description: error.message || "There was an error processing the payment",
        variant: "destructive"
      });
    } finally {
      setProcessingPlanId(null);
    }
  };

  return (
    <div className="py-12 px-4">
      <div className="text-center mb-12 space-y-4">
        <h2 className="text-4xl font-bold bg-gradient-to-r from-orange-500 to-orange-500/70 bg-clip-text text-transparent">
          Amplify Your Music Career
        </h2>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Choose the perfect plan to elevate your music career with our comprehensive marketing tools
        </p>
      </div>

      <div className="grid gap-8 md:grid-cols-3 max-w-7xl mx-auto">
        {plans.map((plan) => (
          <Card 
            key={plan.name} 
            className={`p-6 relative backdrop-blur-sm transition-all duration-300 hover:scale-105
              ${plan.popular ? 'border-orange-500 shadow-lg shadow-orange-500/20' : 'border-orange-500/10 hover:border-orange-500/30'}`}
          >
            {plan.popular && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="bg-orange-500 text-white px-4 py-1 rounded-full text-sm font-medium flex items-center gap-1">
                  <Crown className="w-4 h-4" />
                  Most Popular
                </span>
              </div>
            )}

            <div className="mb-6">
              <h3 className="text-2xl font-bold">{plan.name}</h3>
              <div className="mt-4 flex items-baseline">
                <span className="text-4xl font-bold bg-gradient-to-r from-orange-500 to-orange-500/70 bg-clip-text text-transparent">
                  ${plan.price}
                </span>
                <span className="text-muted-foreground ml-2">/month</span>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                {plan.description}
              </p>
            </div>

            <ul className="space-y-4 mb-8">
              {plan.features.map((feature, index) => (
                <li key={index} className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-orange-500/10 flex items-center justify-center">
                    <feature.icon className="h-4 w-4 text-orange-500" />
                  </div>
                  <span className="text-sm">{feature.text}</span>
                </li>
              ))}
            </ul>

            <Button
              className={`w-full h-12 ${
                plan.popular 
                  ? 'bg-orange-500 hover:bg-orange-600 text-white' 
                  : 'bg-orange-500/10 hover:bg-orange-500/20 text-orange-500'
              }`}
              onClick={() => handleSubscribe(plan)}
              disabled={processingPlanId === plan.priceId || !!stripeError}
            >
              {processingPlanId === plan.priceId ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Rocket className="mr-2 h-5 w-5" />
                  {stripeError ? "Not Available" : "Get Started"}
                </>
              )}
            </Button>
          </Card>
        ))}
      </div>
    </div>
  );
}