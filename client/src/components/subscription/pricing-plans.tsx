import React, { useState } from 'react';
import { Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useSubscription } from '@/lib/context/subscription-context';
import { createCheckoutSession } from '@/lib/api/stripe-service';
import { useAuth } from '@/lib/context/auth-context';
import { Skeleton } from '@/components/ui/skeleton';

// Define the pricing plans
const pricingPlans = [
  {
    name: 'Free',
    key: 'free',
    description: 'Basic tools for music creators',
    price: {
      monthly: 0,
      yearly: 0
    },
    priceId: {
      monthly: '',
      yearly: ''
    },
    features: [
      { name: 'Basic profile page', included: true },
      { name: 'Music uploads (3 tracks)', included: true },
      { name: 'Limited analytics', included: true },
      { name: 'Community access', included: true },
      { name: 'Advanced AI tools', included: false },
      { name: 'Priority support', included: false },
      { name: 'Unlimited uploads', included: false }
    ]
  },
  {
    name: 'Basic',
    key: 'basic',
    description: 'Complete tools for emerging artists',
    price: {
      monthly: 59.99,
      yearly: 599.90  // 10 months for the price of 12
    },
    priceId: {
      monthly: 'price_monthly_basic',
      yearly: 'price_yearly_basic'
    },
    popular: true,
    features: [
      { name: 'Enhanced profile page', included: true },
      { name: 'Music uploads (20 tracks)', included: true },
      { name: 'Standard analytics', included: true },
      { name: 'Community access', included: true },
      { name: 'Basic AI tools', included: true },
      { name: 'Email support', included: true },
      { name: 'Custom audio watermark', included: false }
    ]
  },
  {
    name: 'Pro',
    key: 'pro',
    description: 'Advanced tools for professional artists',
    price: {
      monthly: 99.99,
      yearly: 999.90  // 10 months for the price of 12
    },
    priceId: {
      monthly: 'price_monthly_pro',
      yearly: 'price_yearly_pro'
    },
    features: [
      { name: 'Professional profile page', included: true },
      { name: 'Music uploads (50 tracks)', included: true },
      { name: 'Advanced analytics', included: true },
      { name: 'Priority community access', included: true },
      { name: 'Advanced AI tools', included: true },
      { name: 'Priority support', included: true },
      { name: 'Custom landing page', included: true }
    ]
  },
  {
    name: 'Premium',
    key: 'premium',
    description: 'Complete solution for established artists',
    price: {
      monthly: 149.99,
      yearly: 1499.90  // 10 months for the price of 12
    },
    priceId: {
      monthly: 'price_monthly_premium',
      yearly: 'price_yearly_premium'
    },
    features: [
      { name: 'Custom branded profile', included: true },
      { name: 'Unlimited music uploads', included: true },
      { name: 'Enterprise analytics', included: true },
      { name: 'VIP community access', included: true },
      { name: 'Premium AI tools', included: true },
      { name: '24/7 dedicated support', included: true },
      { name: 'Marketing promotion tools', included: true }
    ]
  }
];

interface PricingPlansProps {
  simplified?: boolean;
}

/**
 * PricingPlans component displays subscription plans with pricing options
 * Supports both full and simplified views for different contexts
 */
export function PricingPlans({ simplified = false }: PricingPlansProps) {
  const [yearly, setYearly] = useState(false);
  const { user, isLoading: authLoading } = useAuth();
  const { subscription, isLoading: subscriptionLoading } = useSubscription();
  
  const isLoading = authLoading || subscriptionLoading;

  const handleSubscribe = async (planKey: string, yearly: boolean) => {
    if (!user) {
      // Redirect to login if not authenticated
      window.location.href = '/auth/login?redirect=/pricing';
      return;
    }
    
    // Si es el administrador (convoycubano@gmail.com), mostrar mensaje especial
    if (user.email === 'convoycubano@gmail.com') {
      alert('Como administrador, ya tienes acceso completo a todas las funcionalidades sin necesidad de suscripción.');
      return;
    }

    const plan = pricingPlans.find(p => p.key === planKey);
    if (!plan) return;

    try {
      // Get the plan's price ID based on billing cycle
      const priceId = yearly ? plan.priceId.yearly : plan.priceId.monthly;
      
      // Get the user's auth token
      const token = await user?.getIdToken();
      
      if (!token) {
        throw new Error("No se pudo obtener el token de autenticación");
      }
      
      // Start the checkout process
      await createCheckoutSession(token, priceId);
    } catch (error) {
      console.error('Error starting checkout:', error);
    }
  };

  // Return simplified view for embedded contexts
  if (simplified) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {pricingPlans.map((plan) => (
          <Card key={plan.key} className={`flex flex-col ${plan.popular ? 'border-primary' : ''}`}>
            <CardHeader>
              <CardTitle>{plan.name}</CardTitle>
              <CardDescription>{plan.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex-1">
              <div className="text-3xl font-bold">
                ${yearly ? plan.price.yearly : plan.price.monthly}
                {plan.price.monthly > 0 && <span className="text-sm font-normal text-muted-foreground"> / {yearly ? 'year' : 'month'}</span>}
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                className="w-full" 
                variant={plan.popular ? 'default' : 'outline'}
                onClick={() => handleSubscribe(plan.key, yearly)}
                disabled={isLoading || (subscription.active && subscription.plan === plan.key)}
              >
                {isLoading ? (
                  <Skeleton className="h-4 w-20" />
                ) : subscription.active && subscription.plan === plan.key ? (
                  'Current Plan'
                ) : (
                  'Subscribe'
                )}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    );
  }

  // Full detailed pricing view
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mx-auto mb-10 max-w-md text-center">
        <h2 className="text-3xl font-bold">Pricing Plans</h2>
        <p className="mt-4 text-muted-foreground">
          Choose the perfect plan for your music career growth
        </p>
      </div>
      
      <div className="flex justify-center mb-8">
        <div className="flex items-center space-x-2">
          <Label htmlFor="billing-toggle" className={yearly ? 'text-muted-foreground' : ''}>Monthly</Label>
          <Switch
            id="billing-toggle"
            checked={yearly}
            onCheckedChange={setYearly}
          />
          <Label htmlFor="billing-toggle" className={!yearly ? 'text-muted-foreground' : ''}>
            Yearly <span className="text-green-500 text-xs font-medium">(Save 16%)</span>
          </Label>
        </div>
      </div>
      
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
        {pricingPlans.map((plan) => (
          <Card key={plan.key} className={`flex flex-col ${plan.popular ? 'border-primary shadow-md relative' : ''}`}>
            {plan.popular && (
              <div className="absolute -top-4 left-0 right-0 mx-auto w-24 rounded-full bg-primary text-white text-xs py-1 text-center font-medium">
                Popular
              </div>
            )}
            <CardHeader>
              <CardTitle>{plan.name}</CardTitle>
              <CardDescription>{plan.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex-1">
              <div className="text-4xl font-bold mb-4">
                ${yearly ? plan.price.yearly : plan.price.monthly}
                {plan.price.monthly > 0 && <span className="text-sm font-normal text-muted-foreground"> / {yearly ? 'year' : 'month'}</span>}
              </div>
              
              <ul className="space-y-2 mb-6">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    {feature.included ? (
                      <Check className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                    ) : (
                      <X className="h-5 w-5 text-muted-foreground mr-2 flex-shrink-0" />
                    )}
                    <span className={!feature.included ? 'text-muted-foreground' : ''}>
                      {feature.name}
                    </span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              <Button 
                className="w-full" 
                variant={plan.popular ? 'default' : 'outline'}
                onClick={() => handleSubscribe(plan.key, yearly)}
                disabled={isLoading || (subscription.active && subscription.plan === plan.key)}
              >
                {isLoading ? (
                  <Skeleton className="h-4 w-20" />
                ) : subscription.active && subscription.plan === plan.key ? (
                  'Current Plan'
                ) : (
                  'Subscribe'
                )}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}