import React, { useState, useEffect } from 'react';
import { Check, X, Loader2, Sparkles, Music, Video, Zap, Crown, Mic, Camera, Wand2, TrendingUp } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { Switch } from '../ui/switch';
import { Label } from '../ui/label';
import { useSubscription } from '../../lib/context/subscription-context';
import { 
  createCheckoutSession, 
  fetchStripePublicKey, 
  fetchSubscriptionPlans,
  SubscriptionPlan 
} from '../../lib/api/stripe-service';
import { useAuth } from '../../hooks/use-auth';
import { Skeleton } from '../ui/skeleton';
import { toast } from '../../hooks/use-toast';
import { useQuery } from '@tanstack/react-query';
import { Badge } from '../ui/badge';
import { motion } from 'framer-motion';

interface ProcessedPlan {
  name: string;
  key: string;
  description: string;
  price: {
    monthly: number;
    yearly: number;
  };
  priceId: {
    monthly: string;
    yearly: string;
  };
  popular?: boolean;
  highlight?: string;
  icon?: React.ReactNode;
  features: { name: string; included: boolean }[];
}

// Mapping del API a nuestro formato de planes
const planKeyMap: Record<string, string> = {
  'Free': 'free',
  'Basic': 'basic',
  'Pro': 'pro',
  'Premium': 'premium'
};

// Mapping de precios a priceIds de Stripe (actualizados marzo 2025)
const priceIdMap: Record<string, { monthly: string; yearly: string }> = {
  'free': {
    monthly: '',
    yearly: ''
  },
  'basic': {
    monthly: 'price_1R0lay2LyFplWimfQxUL6Hn0',
    yearly: 'price_1R0lay2LyFplWimfQxUL6Hn0'
  },
  'pro': {
    monthly: 'price_1R0laz2LyFplWimfsBd5ASoa',
    yearly: 'price_1R0laz2LyFplWimfsBd5ASoa'
  },
  'premium': {
    monthly: 'price_1R0lb12LyFplWimf7JpMynKA',
    yearly: 'price_1R0lb12LyFplWimf7JpMynKA'
  }
};

interface PricingPlansProps {
  simplified?: boolean;
  withAnimation?: boolean;
}

/**
 * PricingPlans component displays subscription plans with pricing options
 * Supports both full and simplified views for different contexts
 */
export function PricingPlans({ simplified = false, withAnimation = false }: PricingPlansProps) {
  const [yearly, setYearly] = useState(false);
  const { user, loading: authLoading } = useAuth();
  const { subscription, currentPlan, isLoading: subscriptionLoading } = useSubscription();
  
  const { data: plansData, isLoading: plansLoading, error: plansError } = useQuery({
    queryKey: ['subscription-plans'],
    queryFn: fetchSubscriptionPlans
  });
  
  const isLoading = authLoading || subscriptionLoading || plansLoading;

  // Efecto para procesar plan guardado después del login
  useEffect(() => {
    if (user && !authLoading) {
      const selectedPlanStr = localStorage.getItem('selectedPlan');
      if (selectedPlanStr) {
        try {
          const { planKey, yearly: savedYearly } = JSON.parse(selectedPlanStr);
          
          localStorage.removeItem('selectedPlan');
          
          toast({
            title: "Procesando tu suscripción",
            description: `Continuando con el plan ${planKey.toUpperCase()}...`,
            variant: "default"
          });
          
          setTimeout(() => {
            handleSubscribe(planKey, savedYearly);
          }, 500);
        } catch (error) {
          console.error('Error procesando plan guardado:', error);
          localStorage.removeItem('selectedPlan');
        }
      }
    }
  }, [user, authLoading]);

  // Planes mejorados y adaptados a los servicios reales de la plataforma
  const pricingPlans: ProcessedPlan[] = [
    {
      name: 'Free',
      key: 'free',
      description: 'Explore the basics',
      highlight: 'Try it free',
      icon: <Music className="h-6 w-6" />,
      price: { monthly: 0, yearly: 0 },
      priceId: { monthly: '', yearly: '' },
      features: [
        { name: 'Profile (Basic)', included: true },
        { name: 'Contacts (Limited)', included: true },
        { name: 'Education Hub (View only)', included: true },
        { name: 'Boostify TV (Limited access)', included: true },
        { name: 'Community forum access', included: true },
        { name: 'Music Generator', included: false },
        { name: 'Music Videos', included: false },
        { name: 'AI Agents', included: false },
        { name: 'Artist Image', included: false },
        { name: 'Analytics', included: false },
        { name: 'Merchandise', included: false },
        { name: 'Social Media Boost', included: false }
      ]
    },
    {
      name: 'Creator',
      key: 'basic',
      description: 'For emerging artists',
      highlight: 'Most popular',
      icon: <Video className="h-6 w-6" />,
      price: { monthly: 59.99, yearly: 599.90 },
      priceId: priceIdMap['basic'],
      popular: true,
      features: [
        { name: 'Everything in Free', included: true },
        { name: 'Profile (Complete)', included: true },
        { name: 'Contacts (Full access)', included: true },
        { name: 'Music Generator (Basic)', included: true },
        { name: 'Music Videos (Standard)', included: true },
        { name: 'AI Agents (Basic)', included: true },
        { name: 'Artist Image (Basic)', included: true },
        { name: 'Analytics (Basic)', included: true },
        { name: 'Merchandise (Basic)', included: true },
        { name: 'Education Hub (Full access)', included: true },
        { name: 'YouTube Boost', included: false },
        { name: 'Instagram Boost', included: false },
        { name: 'Spotify Boost', included: false }
      ]
    },
    {
      name: 'Professional',
      key: 'pro',
      description: 'For serious creators',
      highlight: 'Best value',
      icon: <Zap className="h-6 w-6" />,
      price: { monthly: 99.99, yearly: 999.90 },
      priceId: priceIdMap['pro'],
      features: [
        { name: 'Everything in Creator', included: true },
        { name: 'Music Generator (Advanced)', included: true },
        { name: 'Music Videos (Professional)', included: true },
        { name: 'AI Agents (Advanced)', included: true },
        { name: 'Artist Image (Professional)', included: true },
        { name: 'Analytics (Advanced)', included: true },
        { name: 'Merchandise (Full catalog)', included: true },
        { name: 'YouTube Boost', included: true },
        { name: 'Instagram Boost', included: true },
        { name: 'Spotify Boost', included: true },
        { name: 'Contracts (Legal documents)', included: true },
        { name: 'Priority support', included: true }
      ]
    },
    {
      name: 'Enterprise',
      key: 'premium',
      description: 'For studios & labels',
      highlight: 'Full power',
      icon: <Crown className="h-6 w-6" />,
      price: { monthly: 149.99, yearly: 1499.90 },
      priceId: priceIdMap['premium'],
      features: [
        { name: 'Everything in Professional', included: true },
        { name: 'Record Label (Full suite)', included: true },
        { name: 'Music Generator (Unlimited)', included: true },
        { name: 'Music Videos (Unlimited)', included: true },
        { name: 'AI Agents (Custom)', included: true },
        { name: 'Analytics (Enterprise)', included: true },
        { name: 'White-label branding', included: true },
        { name: 'Multi-user team collaboration', included: true },
        { name: 'API access for integrations', included: true },
        { name: 'Dedicated account manager', included: true },
        { name: 'Priority 24/7 support', included: true },
        { name: 'Early access to new features', included: true }
      ]
    }
  ];

  const handleSubscribe = async (planKey: string, yearly: boolean) => {
    console.log('handleSubscribe called:', { planKey, yearly, user });
    
    if (!user) {
      localStorage.setItem('selectedPlan', JSON.stringify({ planKey, yearly }));
      
      console.log('User not authenticated, redirecting to /auth');
      toast({
        title: "Inicia sesión para continuar",
        description: `Has seleccionado el plan ${planKey.toUpperCase()}. Por favor inicia sesión para completar tu suscripción.`,
        variant: "default"
      });
      
      window.location.href = '/auth?returnTo=/pricing';
      return;
    }
    
    if (user.email === 'convoycubano@gmail.com') {
      toast({
        title: "Acceso administrativo",
        description: "Como administrador, ya tienes acceso completo a todas las funcionalidades sin necesidad de suscripción.",
        variant: "default"
      });
      return;
    }

    const plan = pricingPlans.find(p => p.key === planKey);
    if (!plan) return;

    try {
      const priceId = yearly ? 
        plan.priceId.yearly : 
        plan.priceId.monthly;
      
      toast({
        title: "Creando sesión de pago",
        description: "Por favor espera mientras te redirigimos a la página de pago...",
        variant: "default"
      });
      
      if (priceId) {
        try {
          const sessionUrl = await createCheckoutSession(priceId);
          console.log("URL de sesión de checkout:", sessionUrl);
          
          if (typeof sessionUrl === 'string') {
            window.location.href = sessionUrl;
          } else {
            throw new Error("Formato de respuesta de sesión incorrecto");
          }
          return;
        } catch (error) {
          console.error("Error al crear sesión de checkout:", error);
          throw error;
        }
      } else {
        throw new Error("ID de precio no disponible para el plan seleccionado");
      }
    } catch (error) {
      console.error('Error starting checkout:', error);
      toast({
        title: "Error",
        description: "No se pudo iniciar el proceso de suscripción. Por favor, inténtalo de nuevo más tarde.",
        variant: "destructive"
      });
    }
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="flex flex-col">
            <CardHeader>
              <Skeleton className="h-8 w-24 mb-2" />
              <Skeleton className="h-4 w-full" />
            </CardHeader>
            <CardContent className="flex-1">
              <Skeleton className="h-10 w-24 mb-6" />
              <div className="space-y-2">
                {[...Array(6)].map((_, j) => (
                  <Skeleton key={j} className="h-4 w-full" />
                ))}
              </div>
            </CardContent>
            <CardFooter>
              <Skeleton className="h-10 w-full" />
            </CardFooter>
          </Card>
        ))}
      </div>
    );
  }

  if (plansError && !pricingPlans.length) {
    return (
      <div className="text-center p-8">
        <h3 className="text-xl font-bold mb-2">Error cargando planes</h3>
        <p className="text-muted-foreground mb-4">
          No pudimos cargar los planes de suscripción. Por favor, intenta nuevamente más tarde.
        </p>
        <Button onClick={() => window.location.reload()}>
          Reintentar
        </Button>
      </div>
    );
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: [0.22, 1, 0.36, 1]
      }
    }
  };

  if (simplified) {
    const Wrapper = withAnimation ? motion.div : 'div';
    const CardWrapper = withAnimation ? motion.div : React.Fragment;
    
    return (
      <Wrapper
        className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4"
        {...(withAnimation ? { 
          variants: containerVariants,
          initial: "hidden",
          animate: "visible"
        } : {})}
      >
        {pricingPlans.map((plan) => (
          <CardWrapper key={plan.key} {...(withAnimation ? { variants: itemVariants } : {})}>
            <Card className={`flex flex-col h-full relative overflow-hidden border-2 ${
              plan.popular 
                ? 'border-orange-500 shadow-xl shadow-orange-500/20' 
                : 'border-border hover:border-primary/50 hover:shadow-lg'
            } transition-all duration-300`}>
              {plan.highlight && (
                <Badge 
                  className={`absolute top-3 right-3 ${
                    plan.key === 'basic' ? 'bg-orange-500' :
                    plan.key === 'pro' ? 'bg-blue-500' :
                    plan.key === 'premium' ? 'bg-purple-600' : 
                    'bg-gray-500'
                  }`}
                  data-testid={`badge-${plan.key}`}
                >
                  {plan.highlight}
                </Badge>
              )}
              <CardHeader>
                <div className="flex items-center gap-2 mb-1">
                  {plan.icon}
                  <CardTitle className="text-xl">{plan.name}</CardTitle>
                </div>
                <CardDescription className="text-sm">{plan.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex-1">
                <div className="text-3xl font-bold mb-4">
                  {plan.price.monthly === 0 ? (
                    <span className="text-foreground">Free</span>
                  ) : (
                    <>
                      <span className="text-foreground">${yearly ? plan.price.yearly : plan.price.monthly}</span>
                      <span className="text-sm font-normal text-muted-foreground">/{yearly ? 'yr' : 'mo'}</span>
                    </>
                  )}
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  className="w-full" 
                  variant={plan.popular ? 'default' : 'outline'}
                  onClick={() => handleSubscribe(plan.key, yearly)}
                  disabled={isLoading || (subscription?.status === 'active' && currentPlan === plan.key)}
                  data-testid={`button-subscribe-${plan.key}`}
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : subscription?.status === 'active' && currentPlan === plan.key ? (
                    'Current Plan'
                  ) : plan.price.monthly === 0 ? (
                    'Get Started'
                  ) : (
                    'Subscribe'
                  )}
                </Button>
              </CardFooter>
            </Card>
          </CardWrapper>
        ))}
      </Wrapper>
    );
  }

  // Full detailed pricing view
  const Wrapper = withAnimation ? motion.div : 'div';
  const CardWrapper = withAnimation ? motion.div : React.Fragment;

  return (
    <div className="mx-auto max-w-7xl px-4 py-12">
      {/* Header */}
      <div className="mx-auto mb-12 max-w-3xl text-center">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-orange-500 to-purple-600 bg-clip-text text-transparent">
            Choose Your Creative Power
          </h2>
          <p className="text-lg text-muted-foreground">
            Create stunning AI music videos with professional tools. From audio transcription to lip-sync generation.
          </p>
        </motion.div>
      </div>
      
      {/* Billing Toggle */}
      <motion.div 
        className="flex justify-center mb-12"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <div className="relative inline-flex items-center p-1 bg-muted rounded-full">
          <div 
            className={`absolute inset-y-1 transition-all duration-300 ease-out rounded-full bg-background shadow-md ${
              yearly ? 'left-[50%] right-1' : 'left-1 right-[50%]'
            }`}
          />
          <Label 
            htmlFor="monthly" 
            className={`relative z-10 px-8 py-3 cursor-pointer rounded-full transition-colors font-medium ${
              !yearly ? 'text-foreground' : 'text-muted-foreground'
            }`}
            onClick={() => setYearly(false)}
          >
            Monthly
          </Label>
          <Label 
            htmlFor="yearly" 
            className={`relative z-10 px-8 py-3 cursor-pointer rounded-full transition-colors flex items-center gap-2 font-medium ${
              yearly ? 'text-foreground' : 'text-muted-foreground'
            }`}
            onClick={() => setYearly(true)}
          >
            Yearly
            <Badge variant="outline" className="text-xs text-green-600 border-green-500/30 bg-green-500/10">
              Save 16%
            </Badge>
          </Label>
          <Switch
            id="billing-toggle"
            className="sr-only"
            checked={yearly}
            onCheckedChange={setYearly}
          />
        </div>
      </motion.div>
      
      {/* Pricing Cards */}
      <Wrapper
        className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4"
        {...(withAnimation ? { 
          variants: containerVariants, 
          initial: "hidden", 
          animate: "visible"
        } : {})}
      >
        {pricingPlans.map((plan, index) => (
          <CardWrapper key={plan.key} {...(withAnimation ? { variants: itemVariants } : {})}>
            <Card 
              className={`flex flex-col h-full relative overflow-hidden border-2 ${
                plan.popular 
                  ? 'border-orange-500 shadow-2xl shadow-orange-500/30 scale-105 z-10' 
                  : 'border-border hover:border-primary/50 hover:shadow-xl hover:scale-[1.02]'
              } transition-all duration-300`}
              data-testid={`card-plan-${plan.key}`}
            >
              {/* Highlight Badge */}
              {plan.highlight && (
                <div className={`absolute top-0 left-0 right-0 py-2.5 text-center text-white text-xs font-bold tracking-wide ${
                  plan.key === 'basic' ? 'bg-gradient-to-r from-orange-500 to-orange-600' :
                  plan.key === 'pro' ? 'bg-gradient-to-r from-blue-500 to-blue-600' :
                  plan.key === 'premium' ? 'bg-gradient-to-r from-purple-600 to-purple-700' :
                  'bg-gradient-to-r from-gray-500 to-gray-600'
                }`}>
                  {plan.highlight}
                </div>
              )}

              <CardHeader className={plan.highlight ? 'pt-12' : 'pt-6'}>
                <div className="flex items-center gap-3 mb-3">
                  <div className={`p-2 rounded-lg ${
                    plan.key === 'basic' ? 'bg-orange-500/10 text-orange-500' :
                    plan.key === 'pro' ? 'bg-blue-500/10 text-blue-500' :
                    plan.key === 'premium' ? 'bg-purple-600/10 text-purple-600' :
                    'bg-gray-500/10 text-gray-500'
                  }`}>
                    {plan.icon}
                  </div>
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                </div>
                <CardDescription className="text-base">{plan.description}</CardDescription>
              </CardHeader>
              
              <CardContent className="flex-1 space-y-6">
                {/* Price */}
                <div className="flex items-baseline gap-1">
                  {plan.price.monthly === 0 ? (
                    <span className="text-5xl font-bold">Free</span>
                  ) : (
                    <>
                      <span className="text-2xl font-bold text-muted-foreground">$</span>
                      <span className="text-5xl font-bold">
                        {yearly ? plan.price.yearly : plan.price.monthly}
                      </span>
                      <span className="text-lg text-muted-foreground font-medium">
                        /{yearly ? 'year' : 'month'}
                      </span>
                    </>
                  )}
                </div>
                
                {/* Features List */}
                <ul className="space-y-3">
                  {plan.features.slice(0, 8).map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      {feature.included ? (
                        <div className="rounded-full bg-green-500/15 p-0.5 mt-0.5 flex-shrink-0">
                          <Check className="h-4 w-4 text-green-600" strokeWidth={3} />
                        </div>
                      ) : (
                        <div className="rounded-full bg-muted p-0.5 mt-0.5 flex-shrink-0">
                          <X className="h-4 w-4 text-muted-foreground" />
                        </div>
                      )}
                      <span className={`text-sm ${!feature.included ? 'text-muted-foreground line-through' : 'text-foreground'}`}>
                        {feature.name}
                      </span>
                    </li>
                  ))}
                  {plan.features.length > 8 && (
                    <li className="text-sm text-muted-foreground italic pl-6">
                      + {plan.features.length - 8} more features
                    </li>
                  )}
                </ul>
              </CardContent>
              
              <CardFooter className="pt-6 pb-8">
                <Button 
                  className={`w-full h-12 text-base font-semibold ${
                    plan.popular 
                      ? 'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 shadow-lg shadow-orange-500/30' 
                      : ''
                  }`}
                  variant={plan.popular ? 'default' : 'outline'}
                  size="lg"
                  onClick={() => handleSubscribe(plan.key, yearly)}
                  disabled={isLoading || (subscription?.status === 'active' && currentPlan === plan.key)}
                  data-testid={`button-subscribe-${plan.key}`}
                >
                  {isLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : subscription?.status === 'active' && currentPlan === plan.key ? (
                    <>
                      <Check className="h-5 w-5 mr-2" />
                      Current Plan
                    </>
                  ) : plan.price.monthly === 0 ? (
                    'Get Started Free'
                  ) : (
                    'Start Creating'
                  )}
                </Button>
              </CardFooter>
            </Card>
          </CardWrapper>
        ))}
      </Wrapper>

      {/* Feature Highlights */}
      <motion.div 
        className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <div className="text-center p-6 rounded-xl bg-gradient-to-br from-orange-500/10 to-orange-500/5 border border-orange-500/20">
          <Mic className="h-10 w-10 text-orange-500 mx-auto mb-3" />
          <h3 className="font-semibold mb-2">Music Video Creation</h3>
          <p className="text-sm text-muted-foreground">Create professional music videos with AI-powered tools</p>
        </div>
        <div className="text-center p-6 rounded-xl bg-gradient-to-br from-blue-500/10 to-blue-500/5 border border-blue-500/20">
          <Camera className="h-10 w-10 text-blue-500 mx-auto mb-3" />
          <h3 className="font-semibold mb-2">Artist Image Generation</h3>
          <p className="text-sm text-muted-foreground">Design stunning visuals for your artist brand and promotions</p>
        </div>
        <div className="text-center p-6 rounded-xl bg-gradient-to-br from-purple-600/10 to-purple-600/5 border border-purple-600/20">
          <Wand2 className="h-10 w-10 text-purple-600 mx-auto mb-3" />
          <h3 className="font-semibold mb-2">Multi-Platform Distribution</h3>
          <p className="text-sm text-muted-foreground">Reach your audience on YouTube, Spotify, and Instagram</p>
        </div>
      </motion.div>

      {/* Trust Badge */}
      <motion.div 
        className="mt-12 text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
      >
        <p className="text-sm text-muted-foreground mb-2">Trusted by creators worldwide</p>
        <div className="flex justify-center items-center gap-6">
          <Badge variant="outline" className="text-xs">Cancel anytime</Badge>
          <Badge variant="outline" className="text-xs">Secure payments</Badge>
          <Badge variant="outline" className="text-xs">24/7 Support</Badge>
        </div>
      </motion.div>
    </div>
  );
}
