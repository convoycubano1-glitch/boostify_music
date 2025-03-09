import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useSubscription } from '@/lib/context/subscription-context';
import { createCheckoutSession } from '@/lib/api/stripe-service';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, X, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from 'wouter';

interface PricingPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  interval: 'month' | 'year';
  currency: string;
  features: {
    included: string[];
    excluded: string[];
  };
  cta: string;
  plan: 'free' | 'basic' | 'pro' | 'premium';
  mostPopular?: boolean;
}

interface PricingPlansProps {
  /**
   * Whether to show all plans (default) or just the upgrade plans
   */
  simplified?: boolean;
}

/**
 * The pricing plans offered by the platform
 */
export function PricingPlans({ simplified = false }: PricingPlansProps) {
  const { user } = useAuth();
  const { status, currentPlan } = useSubscription();
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const { toast } = useToast();
  const [_, setLocation] = useLocation();

  const plans: PricingPlan[] = [
    {
      id: 'free',
      name: 'Free',
      description: 'Basic features for starting musicians',
      price: 0,
      interval: 'month',
      currency: 'USD',
      features: {
        included: [
          'Basic music analytics',
          'Limited song storage',
          'Public artist profile',
          'Educational resources'
        ],
        excluded: [
          'AI music generation',
          'Marketing tools',
          'Advanced analytics',
          'Distribution tools',
          'Priority support'
        ]
      },
      cta: 'Get Started',
      plan: 'free'
    },
    {
      id: 'basic',
      name: 'Basic',
      description: 'Essential tools for developing artists',
      price: 59.99,
      interval: 'month',
      currency: 'USD',
      features: {
        included: [
          'Everything in Free',
          'Standard music analytics',
          'Increased song storage',
          'Basic marketing tools',
          'Email support'
        ],
        excluded: [
          'AI music generation',
          'Advanced analytics',
          'Distribution tools',
          'Priority support'
        ]
      },
      cta: 'Subscribe',
      plan: 'basic',
      mostPopular: true
    },
    {
      id: 'pro',
      name: 'Pro',
      description: 'Professional tools for serious artists',
      price: 99.99,
      interval: 'month',
      currency: 'USD',
      features: {
        included: [
          'Everything in Basic',
          'Advanced analytics',
          'AI music generation',
          'Enhanced marketing tools',
          'Distribution planning',
          'Priority email support'
        ],
        excluded: [
          'Unlimited song storage',
          'Dedicated support manager'
        ]
      },
      cta: 'Subscribe',
      plan: 'pro'
    },
    {
      id: 'premium',
      name: 'Premium',
      description: 'Complete solution for professional artists',
      price: 149.99,
      interval: 'month',
      currency: 'USD',
      features: {
        included: [
          'Everything in Pro',
          'Unlimited song storage',
          'Full access to AI tools',
          'Complete analytics suite',
          'Premium distribution tools',
          'Dedicated support manager',
          'Early access to new features'
        ],
        excluded: []
      },
      cta: 'Subscribe',
      plan: 'premium'
    }
  ];

  // Filter plans based on current subscription
  const filteredPlans = simplified
    ? plans.filter(plan => {
        // Show plans with higher tier than current plan
        if (currentPlan === 'free') return plan.plan !== 'free';
        if (currentPlan === 'basic') return plan.plan !== 'free' && plan.plan !== 'basic';
        if (currentPlan === 'pro') return plan.plan === 'premium';
        return false; // Don't show any plans if already on premium
      })
    : plans;

  // If using the simplified view and there are no valid upgrade plans, show a message
  if (simplified && filteredPlans.length === 0) {
    return (
      <div className="text-center p-8">
        <h3 className="text-xl font-bold mb-2">You're on our highest plan!</h3>
        <p className="text-muted-foreground">
          You're already subscribed to our Premium plan with all features unlocked.
        </p>
      </div>
    );
  }

  const handleSubscribe = async (planId: string) => {
    if (!user) {
      toast({
        title: "Login Required",
        description: "Please login to subscribe to a plan",
        variant: "destructive",
      });
      setLocation('/');
      return;
    }

    try {
      setIsLoading(planId);
      const response = await createCheckoutSession(planId);
      
      if (response.url) {
        window.location.href = response.url;
      } else {
        throw new Error('No checkout URL returned');
      }
    } catch (error) {
      console.error('Error creating checkout session:', error);
      toast({
        title: "Subscription Error",
        description: "There was an error setting up your subscription. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(null);
    }
  };

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: price % 1 === 0 ? 0 : 2,
    }).format(price);
  };

  return (
    <div className="container mx-auto py-10">
      {!simplified && (
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold mb-3">Choose Your Plan</h2>
          <p className="text-lg text-muted-foreground">
            Select the perfect plan for your music career stage
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {filteredPlans.map((plan) => {
          const isCurrentPlan = status?.plan === plan.plan;
          
          return (
            <Card 
              key={plan.id}
              className={`flex flex-col h-full ${plan.mostPopular ? 'border-primary shadow-lg' : ''}`}
            >
              <CardHeader>
                {plan.mostPopular && (
                  <Badge className="w-fit mb-2">Most Popular</Badge>
                )}
                <CardTitle>{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex-grow">
                <div className="mb-6">
                  <span className="text-3xl font-bold">{formatPrice(plan.price, plan.currency)}</span>
                  <span className="text-muted-foreground">/{plan.interval}</span>
                </div>
                
                <div className="space-y-4">
                  {plan.features.included.map((feature, i) => (
                    <div key={i} className="flex items-center">
                      <Check className="text-green-500 mr-2 h-5 w-5 flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </div>
                  ))}
                  
                  {plan.features.excluded.map((feature, i) => (
                    <div key={i} className="flex items-center text-muted-foreground">
                      <X className="text-red-400 mr-2 h-5 w-5 flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  className="w-full" 
                  variant={plan.price === 0 ? "outline" : (plan.mostPopular ? "default" : "secondary")}
                  onClick={() => plan.price > 0 ? handleSubscribe(plan.id) : setLocation('/dashboard')}
                  disabled={isCurrentPlan || isLoading === plan.id}
                >
                  {isLoading === plan.id ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : isCurrentPlan ? (
                    'Current Plan'
                  ) : (
                    plan.cta
                  )}
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </div>
  );
}