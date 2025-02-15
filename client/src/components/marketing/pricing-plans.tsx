import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Check, Crown, Loader2, Music2, Star, Rocket, Youtube, FileText, Megaphone, ShoppingBag, Brain, Mail, Settings, LineChart } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { loadStripe } from "@stripe/stripe-js";
import { useState, useEffect } from "react";
import { SiSpotify, SiInstagram } from "react-icons/si";

// Manejar la inicialización de Stripe de manera segura
const getStripe = async () => {
  if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
    throw new Error("La clave pública de Stripe no está configurada");
  }
  return await loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);
};

const plans = [
  {
    name: "Starter",
    price: 59.99,
    features: [
      {
        text: "Análisis Básico de Spotify",
        icon: SiSpotify
      },
      {
        text: "Gestión Básica de Instagram",
        icon: SiInstagram
      },
      {
        text: "5,000 Vistas en YouTube",
        icon: Youtube
      },
      {
        text: "Plantillas de Contratos Básicas",
        icon: FileText
      },
      {
        text: "1 Diseño de Merch al Mes",
        icon: ShoppingBag
      },
      {
        text: "Acceso a 2 Modelos de IA",
        icon: Brain
      },
      {
        text: "Soporte por Email",
        icon: Mail
      }
    ],
    description: "Perfecto para artistas emergentes que inician su carrera",
    popular: false,
    priceId: "price_starter_monthly" // Actualizar con el ID real de Stripe
  },
  {
    name: "Professional",
    price: 99.99,
    features: [
      {
        text: "Analytics Avanzado de Spotify",
        icon: SiSpotify
      },
      {
        text: "Campañas de Instagram",
        icon: SiInstagram
      },
      {
        text: "25,000 Vistas en YouTube",
        icon: Youtube
      },
      {
        text: "Creación de Contratos Personalizados",
        icon: FileText
      },
      {
        text: "5 Diseños de Merch al Mes",
        icon: ShoppingBag
      },
      {
        text: "Acceso a 5 Modelos de IA",
        icon: Brain
      },
      {
        text: "Campaña PR Básica",
        icon: Megaphone
      },
      {
        text: "Marketing Automation",
        icon: Settings
      },
      {
        text: "Soporte Prioritario",
        icon: Star
      }
    ],
    description: "Ideal para artistas en crecimiento y sellos pequeños",
    popular: true,
    priceId: "price_pro_monthly" // Actualizar con el ID real de Stripe
  },
  {
    name: "Enterprise",
    price: 149.99,
    features: [
      {
        text: "Suite Completa de Marketing Musical",
        icon: Music2
      },
      {
        text: "Promoción Premium en Spotify",
        icon: SiSpotify
      },
      {
        text: "Gestión Completa de Instagram",
        icon: SiInstagram
      },
      {
        text: "100,000 Vistas en YouTube",
        icon: Youtube
      },
      {
        text: "Sistema Avanzado de Contratos",
        icon: FileText
      },
      {
        text: "Diseños Ilimitados de Merch",
        icon: ShoppingBag
      },
      {
        text: "Acceso a Todos los Modelos de IA",
        icon: Brain
      },
      {
        text: "Campaña PR Completa",
        icon: Megaphone
      },
      {
        text: "Analytics Personalizado",
        icon: LineChart
      },
      {
        text: "Gestor de Cuenta Dedicado",
        icon: Star
      }
    ],
    description: "Para artistas profesionales y sellos discográficos",
    popular: false,
    priceId: "price_enterprise_monthly" // Actualizar con el ID real de Stripe
  }
];

export function PricingPlans() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [processingPlanId, setProcessingPlanId] = useState<string | null>(null);
  const [stripeError, setStripeError] = useState<string | null>(null);

  useEffect(() => {
    // Verificar la configuración de Stripe al cargar el componente
    getStripe().catch((error) => {
      console.error('Error al inicializar Stripe:', error);
      setStripeError(error.message);
      toast({
        title: "Error de configuración",
        description: "Hay un problema con la configuración de pagos. Por favor, inténtelo más tarde.",
        variant: "destructive"
      });
    });
  }, []);

  const handleSubscribe = async (plan: typeof plans[0]) => {
    if (!user) {
      toast({
        title: "Inicio de sesión requerido",
        description: "Por favor, inicia sesión para suscribirte a un plan",
        variant: "destructive"
      });
      return;
    }

    if (stripeError) {
      toast({
        title: "Error de configuración",
        description: "El sistema de pagos no está disponible en este momento. Por favor, inténtelo más tarde.",
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
        throw new Error(errorData.error || 'Error al crear la sesión de pago');
      }

      const { sessionId } = await response.json();
      console.log('ID de sesión recibido:', sessionId);

      const { error } = await stripe.redirectToCheckout({ sessionId });
      if (error) {
        console.error('Error en redirectToCheckout:', error);
        throw error;
      }
    } catch (error: any) {
      console.error('Error en el proceso de pago:', error);
      toast({
        title: "Error",
        description: error.message || "Hubo un error al procesar el pago",
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
          Potencia tu Música
        </h2>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Elige el plan perfecto para impulsar tu carrera musical con nuestras herramientas de marketing integral
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
                  Más Popular
                </span>
              </div>
            )}

            <div className="mb-6">
              <h3 className="text-2xl font-bold">{plan.name}</h3>
              <div className="mt-4 flex items-baseline">
                <span className="text-4xl font-bold bg-gradient-to-r from-orange-500 to-orange-500/70 bg-clip-text text-transparent">
                  ${plan.price}
                </span>
                <span className="text-muted-foreground ml-2">/mes</span>
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
                  Procesando...
                </>
              ) : (
                <>
                  <Rocket className="mr-2 h-5 w-5" />
                  {stripeError ? "No disponible" : "Comenzar Ahora"}
                </>
              )}
            </Button>
          </Card>
        ))}
      </div>
    </div>
  );
}