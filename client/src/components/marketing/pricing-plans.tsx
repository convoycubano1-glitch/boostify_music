import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Check, Crown, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { loadStripe } from "@stripe/stripe-js";
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
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold">
          Elige tu Plan
        </h2>
        <p className="mt-4 text-lg text-muted-foreground">
          Planes flexibles para cada etapa de tu carrera
        </p>
      </div>

      <div className="grid gap-8 md:grid-cols-3 max-w-7xl mx-auto">
        {plans.map((plan) => (
          <Card key={plan.name} className={`p-6 ${plan.popular ? 'border-orange-500' : ''}`}>
            {plan.popular && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="bg-orange-500 text-white px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1">
                  <Crown className="w-4 h-4" />
                  Más Popular
                </span>
              </div>
            )}

            <div className="mb-6">
              <h3 className="text-2xl font-bold">{plan.name}</h3>
              <div className="mt-4 flex items-baseline">
                <span className="text-4xl font-bold">${plan.price}</span>
                <span className="text-muted-foreground ml-2">/mes</span>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                {plan.description}
              </p>
            </div>

            <ul className="space-y-3 mb-6">
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-orange-500" />
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
              onClick={() => handleSubscribe(plan)}
              disabled={processingPlanId === plan.priceId}
            >
              {processingPlanId === plan.priceId ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Procesando...
                </>
              ) : (
                'Suscribirse'
              )}
            </Button>
          </Card>
        ))}
      </div>
    </div>
  );
}