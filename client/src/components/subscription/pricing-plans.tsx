import React, { useState, useEffect } from 'react';
import { Check, X, Loader2, Sparkles, Music, Users, TrendingUp, BarChart2, Star, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useSubscription } from '@/lib/context/subscription-context';
import { 
  createCheckoutSession, 
  fetchStripePublicKey, 
  fetchSubscriptionPlans,
  SubscriptionPlan 
} from '@/lib/api/stripe-service';
import { useAuth } from '@/hooks/use-auth';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
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
    monthly: 'price_1R0lay2LyFplWimfQxUL6Hn0', // $59.99/month (ID mar-2025)
    yearly: 'price_1R0lay2LyFplWimfQxUL6Hn0'   // Mismo ID para simplificar
  },
  'pro': {
    monthly: 'price_1R0laz2LyFplWimfsBd5ASoa', // $99.99/month (ID mar-2025)
    yearly: 'price_1R0laz2LyFplWimfsBd5ASoa'   // Mismo ID para simplificar
  },
  'premium': {
    monthly: 'price_1R0lb12LyFplWimf7JpMynKA', // $149.99/month (ID mar-2025)
    yearly: 'price_1R0lb12LyFplWimf7JpMynKA'   // Mismo ID para simplificar
  }
};

interface PricingPlansProps {
  simplified?: boolean;
  withAnimation?: boolean;
}

// Función para convertir planes de la API al formato que usa el componente
function transformApiPlans(apiPlans: SubscriptionPlan[]): ProcessedPlan[] {
  if (!apiPlans || apiPlans.length === 0) {
    return [];
  }

  const icons = {
    'free': <Music className="h-8 w-8 text-gray-400" />,
    'basic': <Star className="h-8 w-8 text-orange-500" />,
    'pro': <TrendingUp className="h-8 w-8 text-blue-500" />,
    'premium': <Sparkles className="h-8 w-8 text-purple-500" />
  };

  const highlights = {
    'free': 'Start for free',
    'basic': 'Most popular',
    'pro': 'Best value',
    'premium': 'All features'
  };

  return apiPlans.map(plan => {
    const key = planKeyMap[plan.name] || plan.name.toLowerCase();
    
    // Configuración predeterminada para descripciones
    const descriptions = {
      'free': 'Essential tools for starting artists',
      'basic': 'Complete tools for emerging artists',
      'pro': 'Advanced tools for professional artists',
      'premium': 'Complete solution for established artists'
    };

    // Separar características en incluidas y excluidas
    const includedFeatures = plan.features.map(feature => ({ 
      name: feature, 
      included: true 
    }));

    // Precio anual es 10 meses por el precio de 12 (16% de descuento)
    const yearlyPrice = Math.round(plan.price * 10 * 100) / 100;

    return {
      name: plan.name,
      key,
      description: descriptions[key as keyof typeof descriptions] || `${plan.name} subscription plan`,
      price: {
        monthly: plan.price,
        yearly: yearlyPrice
      },
      priceId: priceIdMap[key] || { monthly: '', yearly: '' },
      popular: key === 'basic', // El plan basic es el popular
      highlight: highlights[key as keyof typeof highlights],
      icon: icons[key as keyof typeof icons],
      features: includedFeatures
    };
  });
}

/**
 * PricingPlans component displays subscription plans with pricing options
 * Supports both full and simplified views for different contexts
 */
export function PricingPlans({ simplified = false, withAnimation = false }: PricingPlansProps) {
  const [yearly, setYearly] = useState(false);
  const { user, isLoading: authLoading } = useAuth();
  const { subscription, isLoading: subscriptionLoading } = useSubscription();
  
  // Obtener planes desde la API
  const { data: plansData, isLoading: plansLoading, error: plansError } = useQuery({
    queryKey: ['subscription-plans'],
    queryFn: fetchSubscriptionPlans
  });
  
  const isLoading = authLoading || subscriptionLoading || plansLoading;

  // Transformar planes de la API a nuestro formato
  const processedPlans = React.useMemo(() => {
    if (plansLoading || !plansData?.plans) {
      return [];
    }
    return transformApiPlans(plansData.plans);
  }, [plansData, plansLoading]);

  // Planes de respaldo en caso de error
  const fallbackPlans: ProcessedPlan[] = [
    {
      name: 'Free',
      key: 'free',
      description: 'Essential tools for starting artists',
      highlight: 'Start for free',
      icon: <Music className="h-8 w-8 text-gray-400" />,
      price: { monthly: 0, yearly: 0 },
      priceId: { monthly: '', yearly: '' },
      features: [
        { name: 'Basic profile page', included: true },
        { name: 'Music uploads (3 tracks)', included: true },
        { name: 'Limited analytics', included: true },
        { name: 'Community access', included: true },
        { name: 'Basic AI tools', included: false },
        { name: 'Strategic promotion', included: false },
        { name: 'Custom branding', included: false },
        { name: 'Premium support', included: false }
      ]
    },
    {
      name: 'Basic',
      key: 'basic',
      description: 'Complete tools for emerging artists',
      highlight: 'Most popular',
      icon: <Star className="h-8 w-8 text-orange-500" />,
      price: { monthly: 59.99, yearly: 599.90 },
      priceId: priceIdMap['basic'],
      popular: true,
      features: [
        { name: 'Enhanced profile page', included: true },
        { name: 'Music uploads (20 tracks)', included: true },
        { name: 'Standard analytics', included: true },
        { name: 'Community access', included: true },
        { name: 'Basic AI tools', included: true },
        { name: 'Strategic promotion', included: true },
        { name: 'Custom branding', included: false },
        { name: 'Premium support', included: false }
      ]
    },
    {
      name: 'Pro',
      key: 'pro',
      description: 'Advanced tools for professional artists',
      highlight: 'Best value',
      icon: <TrendingUp className="h-8 w-8 text-blue-500" />,
      price: { monthly: 99.99, yearly: 999.90 },
      priceId: priceIdMap['pro'],
      features: [
        { name: 'Professional profile page', included: true },
        { name: 'Music uploads (50 tracks)', included: true },
        { name: 'Advanced analytics', included: true },
        { name: 'Community access', included: true },
        { name: 'Advanced AI tools', included: true },
        { name: 'Strategic promotion', included: true },
        { name: 'Custom branding', included: true },
        { name: 'Standard support', included: true }
      ]
    },
    {
      name: 'Premium',
      key: 'premium',
      description: 'Complete solution for established artists',
      highlight: 'All features',
      icon: <Sparkles className="h-8 w-8 text-purple-500" />,
      price: { monthly: 149.99, yearly: 1499.90 },
      priceId: priceIdMap['premium'],
      features: [
        { name: 'Custom branded profile', included: true },
        { name: 'Unlimited music uploads', included: true },
        { name: 'Enterprise analytics', included: true },
        { name: 'Priority community features', included: true },
        { name: 'Premium AI tools', included: true },
        { name: 'Advanced promotion', included: true },
        { name: 'Custom branding', included: true },
        { name: 'Premium 24/7 support', included: true }
      ]
    }
  ];

  // Elegir entre planes reales o fallback
  const pricingPlans = processedPlans.length > 0 ? processedPlans : fallbackPlans;

  const handleSubscribe = async (planKey: string, yearly: boolean) => {
    if (!user) {
      // Redirect to login if not authenticated
      window.location.href = '/auth/login?redirect=/pricing';
      return;
    }
    
    // Si es el administrador (convoycubano@gmail.com), mostrar mensaje especial
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
      // Obtener el priceId basado en si es plan anual o mensual
      const priceId = yearly ? 
        plan.priceId.yearly : 
        plan.priceId.monthly;
      
      // Mostrar un toast informativo mientras se crea la sesión
      toast({
        title: "Creando sesión de pago",
        description: "Por favor espera mientras te redirigimos a la página de pago...",
        variant: "default"
      });
      
      // MÉTODO MEJORADO: Siempre usar la API para crear una sesión de checkout dinámica
      if (priceId) {
        try {
          // Intentar crear una sesión de checkout con la API
          const sessionUrl = await createCheckoutSession(priceId);
          console.log("URL de sesión de checkout:", sessionUrl);
          
          // Redirigir al usuario a la URL de checkout generada
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

  // Si está cargando, mostrar skeleton
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="flex flex-col">
            <CardHeader>
              <Skeleton className="h-8 w-24 mb-2" />
              <Skeleton className="h-4 w-full" />
            </CardHeader>
            <CardContent className="flex-1">
              <Skeleton className="h-10 w-24 mb-6" />
              <div className="space-y-2">
                {[...Array(4)].map((_, j) => (
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

  // Manejar errores de carga de planes
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

  // Variantes para animaciones
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
        duration: 0.4
      }
    }
  };

  // Return simplified view for embedded contexts
  if (simplified) {
    const Wrapper = withAnimation ? motion.div : 'div';
    const CardWrapper = withAnimation ? motion.div : React.Fragment;
    
    return (
      <Wrapper
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
        {...(withAnimation ? { 
          variants: containerVariants,
          initial: "hidden",
          animate: "visible"
        } : {})}
      >
        {pricingPlans.map((plan) => (
          <CardWrapper key={plan.key} {...(withAnimation ? { variants: itemVariants } : {})}>
            <Card className={`flex flex-col h-full relative overflow-hidden ${plan.popular ? 'border-primary shadow-lg' : 'hover:border-primary/40 hover:shadow-md'} transition-all duration-300`}>
              {plan.highlight && (
                <Badge 
                  className={`absolute top-4 right-4 ${
                    plan.key === 'basic' ? 'bg-orange-500' :
                    plan.key === 'pro' ? 'bg-blue-500' :
                    plan.key === 'premium' ? 'bg-purple-500' : 
                    'bg-gray-500'
                  }`}
                >
                  {plan.highlight}
                </Badge>
              )}
              <CardHeader>
                {plan.icon && <div className="mb-2">{plan.icon}</div>}
                <CardTitle>{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex-1">
                <div className="text-3xl font-bold">
                  {plan.price.monthly === 0 ? 'Free' : (
                    <>
                      ${yearly ? plan.price.yearly : plan.price.monthly}
                      <span className="text-sm font-normal text-muted-foreground"> / {yearly ? 'year' : 'month'}</span>
                    </>
                  )}
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  className="w-full" 
                  variant={plan.popular ? 'default' : 'outline'}
                  onClick={() => handleSubscribe(plan.key, yearly)}
                  disabled={isLoading || (subscription?.active && subscription?.currentPlan === plan.key)}
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : subscription?.active && subscription?.currentPlan === plan.key ? (
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
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mx-auto mb-10 max-w-md text-center">
        <h2 className="text-3xl font-bold">Pricing Plans</h2>
        <p className="mt-4 text-muted-foreground">
          Choose the perfect plan for your music career growth
        </p>
      </div>
      
      <div className="flex justify-center mb-8">
        <div className="relative flex items-center p-1 bg-muted/30 rounded-full">
          <div 
            className={`absolute inset-y-1 transition-all duration-200 ease-out rounded-full bg-primary/20 backdrop-blur-sm ${
              yearly ? 'left-[50%] right-1' : 'left-1 right-[50%]'
            }`}
          />
          <Label 
            htmlFor="monthly" 
            className={`relative z-10 px-6 py-2 cursor-pointer rounded-full transition-colors ${
              !yearly ? 'text-primary font-medium' : 'text-muted-foreground'
            }`}
            onClick={() => setYearly(false)}
          >
            Monthly
          </Label>
          <Label 
            htmlFor="yearly" 
            className={`relative z-10 px-6 py-2 cursor-pointer rounded-full transition-colors flex items-center gap-2 ${
              yearly ? 'text-primary font-medium' : 'text-muted-foreground'
            }`}
            onClick={() => setYearly(true)}
          >
            Yearly
            <Badge variant="outline" className="text-green-500 border-green-500/20 bg-green-500/10">Save 16%</Badge>
          </Label>
          <Switch
            id="billing-toggle"
            className="sr-only"
            checked={yearly}
            onCheckedChange={setYearly}
          />
        </div>
      </div>
      
      <Wrapper
        className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4 mt-12"
        {...(withAnimation ? { 
          variants: containerVariants, 
          initial: "hidden", 
          animate: "visible"
        } : {})}
      >
        {pricingPlans.map((plan) => (
          <CardWrapper key={plan.key} {...(withAnimation ? { variants: itemVariants } : {})}>
            <Card 
              className={`flex flex-col h-full relative overflow-hidden ${
                plan.popular 
                  ? 'border-primary shadow-xl relative scale-105 z-10' 
                  : 'hover:border-primary/40 hover:shadow-md hover:scale-[1.02]'
              } transition-all duration-300`}
            >
              {plan.highlight && (
                <div className={`absolute top-0 left-0 right-0 py-2 text-center text-white text-xs font-semibold ${
                  plan.key === 'basic' ? 'bg-orange-500' :
                  plan.key === 'pro' ? 'bg-blue-500' :
                  plan.key === 'premium' ? 'bg-purple-500' :
                  'bg-gray-500'
                }`}>
                  {plan.highlight}
                </div>
              )}
              <CardHeader className="pt-10">
                <div className="flex items-center gap-3 mb-3">
                  {plan.icon}
                  <CardTitle>{plan.name}</CardTitle>
                </div>
                <CardDescription>{plan.description}</CardDescription>
              </CardHeader>
              
              <CardContent className="flex-1">
                <div className="text-5xl font-bold mb-4 flex items-end">
                  {plan.price.monthly === 0 ? (
                    'Free'
                  ) : (
                    <>
                      <span className="text-3xl mr-1">$</span>
                      {yearly ? plan.price.yearly : plan.price.monthly}
                      <span className="text-base font-normal text-muted-foreground ml-1">
                        /{yearly ? 'year' : 'month'}
                      </span>
                    </>
                  )}
                </div>
                
                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start">
                      {feature.included ? (
                        <div className="rounded-full bg-green-500/10 p-1 mr-2 flex-shrink-0">
                          <Check className="h-4 w-4 text-green-500" />
                        </div>
                      ) : (
                        <div className="rounded-full bg-muted p-1 mr-2 flex-shrink-0">
                          <X className="h-4 w-4 text-muted-foreground" />
                        </div>
                      )}
                      <span className={!feature.included ? 'text-muted-foreground' : ''}>
                        {feature.name}
                      </span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              
              <CardFooter className="pb-8">
                <Button 
                  className={`w-full py-6 ${
                    plan.popular 
                      ? 'bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600' 
                      : ''
                  }`}
                  variant={plan.popular ? 'default' : 'outline'}
                  size="lg"
                  onClick={() => handleSubscribe(plan.key, yearly)}
                  disabled={isLoading || (subscription?.active && subscription?.currentPlan === plan.key)}
                >
                  {isLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : subscription?.active && subscription?.currentPlan === plan.key ? (
                    'Current Plan'
                  ) : plan.price.monthly === 0 ? (
                    'Get Started'
                  ) : (
                    'Subscribe Now'
                  )}
                </Button>
              </CardFooter>
            </Card>
          </CardWrapper>
        ))}
      </Wrapper>
    </div>
  );
}