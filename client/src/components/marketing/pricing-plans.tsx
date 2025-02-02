import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Check, Crown, Loader2, Music2, Star, Rocket, Youtube, FileText, Megaphone } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { loadStripe } from "@stripe/stripe-js";
import { useState } from "react";
import { SiSpotify, SiInstagram } from "react-icons/si";

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

const plans = [
  {
    name: "Starter",
    price: 49,
    features: [
      {
        text: "Spotify Basic Analytics",
        icon: SiSpotify
      },
      {
        text: "Instagram Profile Optimization",
        icon: SiInstagram
      },
      {
        text: "1,000 YouTube Views",
        icon: Youtube
      },
      {
        text: "Basic Contract Templates",
        icon: FileText
      },
      {
        text: "Email Support",
        icon: Megaphone
      }
    ],
    description: "Perfect for emerging artists starting their journey",
    popular: false,
    priceId: "price_1Oq2YuBwX8aK6b3XhGjK9J2Y"
  },
  {
    name: "Professional",
    price: 149,
    features: [
      {
        text: "Advanced Spotify Growth Tools",
        icon: SiSpotify
      },
      {
        text: "Instagram Boost Campaign",
        icon: SiInstagram
      },
      {
        text: "10,000 YouTube Views",
        icon: Youtube
      },
      {
        text: "Custom Contract Creation",
        icon: FileText
      },
      {
        text: "Basic PR Campaign",
        icon: Megaphone
      },
      {
        text: "Priority Support",
        icon: Star
      }
    ],
    description: "Ideal for growing artists and small labels",
    popular: true,
    priceId: "price_1Oq2ZsBwX8aK6b3XQrY8K9L3"
  },
  {
    name: "Enterprise",
    price: 499,
    features: [
      {
        text: "Full Music Marketing Suite",
        icon: Music2
      },
      {
        text: "Premium Spotify Promotion",
        icon: SiSpotify
      },
      {
        text: "Complete Instagram Management",
        icon: SiInstagram
      },
      {
        text: "100,000 YouTube Views",
        icon: Youtube
      },
      {
        text: "Advanced Contract Management",
        icon: FileText
      },
      {
        text: "Full PR Campaign",
        icon: Megaphone
      },
      {
        text: "Dedicated Account Manager",
        icon: Star
      }
    ],
    description: "For professional artists and labels",
    popular: false,
    priceId: "price_1Oq2a7BwX8aK6b3XmNpL5K8M"
  }
];

export function PricingPlans() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [processingPlanId, setProcessingPlanId] = useState<string | null>(null);

  const handleSubscribe = async (plan: typeof plans[0]) => {
    if (!user) {
      toast({
        title: "Inicio de sesión requerido",
        description: "Por favor, inicia sesión para suscribirte a un plan",
        variant: "destructive"
      });
      return;
    }

    try {
      console.log(`Iniciando suscripción para plan ${plan.name}`);
      setProcessingPlanId(plan.priceId);

      const stripe = await stripePromise;
      if (!stripe) {
        throw new Error("Error al inicializar Stripe");
      }

      console.log('Creando sesión de checkout...');
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
              disabled={processingPlanId === plan.priceId}
            >
              {processingPlanId === plan.priceId ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Procesando...
                </>
              ) : (
                <>
                  <Rocket className="mr-2 h-5 w-5" />
                  Comenzar Ahora
                </>
              )}
            </Button>
          </Card>
        ))}
      </div>
    </div>
  );
}