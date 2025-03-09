import React, { useState, useEffect } from 'react';
import { Check, X, Loader2 } from 'lucide-react';
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
}

// Función para convertir planes de la API al formato que usa el componente
function transformApiPlans(apiPlans: SubscriptionPlan[]): ProcessedPlan[] {
  if (!apiPlans || apiPlans.length === 0) {
    return [];
  }

  return apiPlans.map(plan => {
    const key = planKeyMap[plan.name] || plan.name.toLowerCase();
    
    // Configuración predeterminada para descripciones
    const descriptions = {
      'free': 'Basic tools for music creators',
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
      features: includedFeatures
    };
  });
}

/**
 * PricingPlans component displays subscription plans with pricing options
 * Supports both full and simplified views for different contexts
 */
export function PricingPlans({ simplified = false }: PricingPlansProps) {
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
      description: 'Basic tools for music creators',
      price: { monthly: 0, yearly: 0 },
      priceId: { monthly: '', yearly: '' },
      features: [
        { name: 'Basic profile page', included: true },
        { name: 'Music uploads (3 tracks)', included: true },
        { name: 'Limited analytics', included: true },
        { name: 'Community access', included: true }
      ]
    },
    {
      name: 'Basic',
      key: 'basic',
      description: 'Complete tools for emerging artists',
      price: { monthly: 59.99, yearly: 599.90 },
      priceId: priceIdMap['basic'],
      popular: true,
      features: [
        { name: 'Enhanced profile page', included: true },
        { name: 'Music uploads (20 tracks)', included: true },
        { name: 'Standard analytics', included: true },
        { name: 'Basic AI tools', included: true }
      ]
    },
    {
      name: 'Pro',
      key: 'pro',
      description: 'Advanced tools for professional artists',
      price: { monthly: 99.99, yearly: 999.90 },
      priceId: priceIdMap['pro'],
      features: [
        { name: 'Professional profile page', included: true },
        { name: 'Music uploads (50 tracks)', included: true },
        { name: 'Advanced analytics', included: true },
        { name: 'Advanced AI tools', included: true }
      ]
    },
    {
      name: 'Premium',
      key: 'premium',
      description: 'Complete solution for established artists',
      price: { monthly: 149.99, yearly: 1499.90 },
      priceId: priceIdMap['premium'],
      features: [
        { name: 'Custom branded profile', included: true },
        { name: 'Unlimited music uploads', included: true },
        { name: 'Enterprise analytics', included: true },
        { name: 'Premium AI tools', included: true }
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
      // Opción 1: Usar enlaces directos de Stripe para cada plan (configurados previamente en el Dashboard de Stripe)
      const checkoutLinks = {
        basic: {
          monthly: 'https://buy.stripe.com/test_4gw8A04ot7YY60oeUV', // Plan Basic mensual
          yearly: 'https://buy.stripe.com/test_4gw8A04ot7YY60oeUV'  // Plan Basic anual (mismo link por ahora)
        },
        pro: {
          monthly: 'https://buy.stripe.com/test_28o5tO68R0qmdo4eUW', // Plan Pro mensual
          yearly: 'https://buy.stripe.com/test_28o5tO68R0qmdo4eUW'   // Plan Pro anual (mismo link por ahora)
        },
        premium: {
          monthly: 'https://buy.stripe.com/test_5kA4pKeCn3Mm0LYcMP', // Plan Premium mensual
          yearly: 'https://buy.stripe.com/test_5kA4pKeCn3Mm0LYcMP'    // Plan Premium anual (mismo link por ahora)
        }
      };
      
      // Opción 2: Usar la API de createCheckoutSession que generará una URL de sesión de checkout
      const priceId = yearly ? 
        plan.priceId.yearly : 
        plan.priceId.monthly;
      
      // Determinar qué enlace usar basado en el plan y si es anual o mensual
      const billingCycle = yearly ? 'yearly' : 'monthly';
      const checkoutUrl = checkoutLinks[planKey as keyof typeof checkoutLinks]?.[billingCycle];
      
      // MÉTODO 1: Enlaces directos preconfigurados
      if (checkoutUrl) {
        // Redirigir directamente al checkout de Stripe (opción más simple)
        window.location.href = checkoutUrl;
        return;
      }
      
      // MÉTODO 2: Crear sesión de checkout dinámica con API
      // Solo se ejecuta si no se encontró un enlace directo
      if (priceId) {
        const response = await createCheckoutSession(priceId);
        if (response.success && response.url) {
          window.location.href = response.url;
          return;
        }
      }
      
      // Si ninguno de los métodos funcionó
      throw new Error("No hay enlace de checkout disponible para el plan seleccionado");
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
                disabled={isLoading || (subscription?.status === 'active' && subscription?.currentPlan === plan.key)}
              >
                {isLoading ? (
                  <Skeleton className="h-4 w-20" />
                ) : subscription?.status === 'active' && subscription?.currentPlan === plan.key ? (
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
                disabled={isLoading || (subscription?.status === 'active' && subscription?.currentPlan === plan.key)}
              >
                {isLoading ? (
                  <Skeleton className="h-4 w-20" />
                ) : subscription?.status === 'active' && subscription?.currentPlan === plan.key ? (
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