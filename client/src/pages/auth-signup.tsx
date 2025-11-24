import { Button } from "@/components/ui/button";
import { logger } from "../lib/logger";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Lock, Shield, CheckCircle2, Mail, Github, Star, Zap, 
  Music2, Video, TrendingUp, Users, Sparkles, Crown, Rocket
} from "lucide-react";
import { SiGoogle, SiApple } from "react-icons/si";
import { motion } from "framer-motion";
import { useState } from "react";
import { createCheckoutSession } from "@/lib/api/stripe-service";
import { useToast } from "@/hooks/use-toast";

const plans = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    priceId: null,
    description: "Explore the basics",
    popular: false,
    features: [
      "Profile (Basic)",
      "Contacts (Limited)",
      "Education Hub (View only)",
      "Boostify TV (Limited access)",
      "Community forum access"
    ],
    color: "from-orange-400 to-orange-600",
    icon: Music2
  },
  {
    name: "Creator",
    price: "$59.99",
    period: "per month",
    priceId: "price_1R0lay2LyFplWimfQxUL6Hn0",
    description: "For emerging artists",
    popular: true,
    features: [
      "Everything in Free",
      "Profile (Complete)",
      "Contacts (Full access)",
      "Music Generator (Basic)",
      "Music Videos (Standard)",
      "AI Agents (Basic)",
      "Artist Image (Basic)",
      "Analytics (Basic)",
      "Merchandise (Basic)",
      "Education Hub (Full access)"
    ],
    color: "from-orange-500 to-orange-700",
    icon: Video
  },
  {
    name: "Professional",
    price: "$99.99",
    period: "per month",
    priceId: "price_1R0laz2LyFplWimfsBd5ASoa",
    description: "For serious creators",
    popular: false,
    features: [
      "Everything in Creator",
      "Music Generator (Advanced)",
      "Music Videos (Professional)",
      "AI Agents (Advanced)",
      "Artist Image (Professional)",
      "Analytics (Advanced)",
      "Merchandise (Full catalog)",
      "YouTube Boost",
      "Instagram Boost",
      "Spotify Boost",
      "Contracts (Legal documents)",
      "Priority support"
    ],
    color: "from-orange-600 to-red-600",
    icon: Zap
  },
  {
    name: "Enterprise",
    price: "$149.99",
    period: "per month",
    priceId: "price_1R0lb12LyFplWimf7JpMynKA",
    description: "For studios & labels",
    popular: false,
    features: [
      "Everything in Professional",
      "Record Label (Full suite)",
      "Music Generator (Unlimited)",
      "Music Videos (Unlimited)",
      "AI Agents (Custom)",
      "Analytics (Enterprise)",
      "White-label branding",
      "Multi-user team collaboration",
      "API access for integrations",
      "Dedicated account manager",
      "Priority 24/7 support",
      "Early access to new features"
    ],
    color: "from-orange-700 to-red-700",
    icon: Crown
  }
];

const authProviders = [
  { name: "Google", icon: SiGoogle, color: "from-orange-500 to-red-500" },
  { name: "GitHub", icon: Github, color: "from-gray-700 to-gray-900" },
  { name: "Apple", icon: SiApple, color: "from-gray-800 to-black" },
  { name: "Email", icon: Mail, color: "from-orange-600 to-orange-800" }
];

export default function AuthSignupPage() {
  const [selectedPlan, setSelectedPlan] = useState("Basic");
  const [processingPlan, setProcessingPlan] = useState<string | null>(null);
  const { toast } = useToast();

  const handleSignUp = async (planName?: string, priceId?: string | null) => {
    setProcessingPlan(planName || "login");

    try {
      // Si hay plan seleccionado, guardar en localStorage
      if (planName) {
        const planData = {
          planName,
          priceId: priceId || null,
          timestamp: Date.now()
        };
        localStorage.setItem("selectedPlan", JSON.stringify(planData));

        if (!priceId || planName === "Free") {
          toast({
            title: "¡Bienvenido!",
            description: `Iniciando sesión con plan ${planName}...`,
          });
        } else {
          toast({
            title: "Procesando suscripción",
            description: `Por favor completa tu suscripción al plan ${planName}.`,
          });
        }
      } else {
        toast({
          title: "Iniciando sesión",
          description: "Conectando con Replit...",
        });
      }

      // Redirigir directamente a Replit Auth (sin página de consentimiento)
      window.location.href = "/api/login";
    } catch (error) {
      logger.error("Error al procesar signup:", error);
      toast({
        title: "Error",
        description: "Hubo un problema al procesar tu solicitud. Por favor, intenta de nuevo.",
        variant: "destructive",
      });
      setProcessingPlan(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50 dark:from-gray-950 dark:via-gray-900 dark:to-orange-950">
      {/* Beta Notice Banner */}
      <div className="bg-gradient-to-r from-orange-600 to-red-600 text-white py-3">
        <div className="container mx-auto px-4">
          <p className="text-center text-sm md:text-base font-medium">
            🚀 Platform in Beta Testing & Development Phase - Official Launch: January 2026
          </p>
        </div>
      </div>

      {/* Hero Section */}
      <div className="container mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <Badge className="mb-4 text-sm px-4 py-1" variant="secondary">
            <Sparkles className="w-3 h-3 mr-1 inline" />
            Trusted by 10,000+ Artists Worldwide
          </Badge>
          
          <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-orange-600 via-red-600 to-orange-800 bg-clip-text text-transparent">
            Boost Your Music Career
          </h1>
          
          <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto mb-8">
            Join the AI-powered platform helping artists grow their audience, 
            create stunning content, and manage their music business.
          </p>

          {/* Hero Image */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="mb-8"
          >
            <div className="relative max-w-4xl mx-auto rounded-2xl overflow-hidden shadow-2xl">
              <img 
                src="/images/signup-hero.png" 
                alt="Boostify Music Platform" 
                className="w-full h-auto object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
            </div>
          </motion.div>

          <div className="flex flex-wrap gap-4 justify-center mb-8">
            {authProviders.map((provider) => (
              <Button
                key={provider.name}
                onClick={() => handleSignUp()}
                variant="outline"
                size="lg"
                className="group hover:scale-105 transition-transform"
                data-testid={`button-auth-${provider.name.toLowerCase()}`}
              >
                <provider.icon className={`w-5 h-5 mr-2 bg-gradient-to-r ${provider.color} bg-clip-text`} />
                Continue with {provider.name}
              </Button>
            ))}
          </div>

          <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Shield className="w-4 h-4 text-green-600" />
              <span>Secure Authentication</span>
            </div>
            <span>•</span>
            <div className="flex items-center gap-1">
              <Lock className="w-4 h-4 text-green-600" />
              <span>256-bit Encryption</span>
            </div>
            <span>•</span>
            <span>No Credit Card Required</span>
          </div>
        </motion.div>

        {/* Plans Section */}
        <div className="mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
            Choose Your Plan
          </h2>
          <p className="text-center text-muted-foreground mb-8">
            Start free, upgrade anytime. All plans include 14-day money-back guarantee.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
            {plans.map((plan, index) => {
              const Icon = plan.icon;
              return (
                <motion.div
                  key={plan.name}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <Card 
                    className={`relative h-full transition-all duration-300 hover:shadow-2xl cursor-pointer ${
                      selectedPlan === plan.name 
                        ? 'ring-2 ring-orange-600 shadow-xl scale-105' 
                        : 'hover:scale-102'
                    } ${plan.popular ? 'border-orange-600 border-2' : ''}`}
                    onClick={() => setSelectedPlan(plan.name)}
                    data-testid={`card-plan-${plan.name.toLowerCase()}`}
                  >
                    {plan.popular && (
                      <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                        <Badge className="bg-gradient-to-r from-orange-600 to-red-600 text-white px-4 py-1">
                          Más Popular
                        </Badge>
                      </div>
                    )}

                    <CardHeader className="pb-4">
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${plan.color} flex items-center justify-center mb-4`}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      
                      <CardTitle className="text-2xl">{plan.name}</CardTitle>
                      <CardDescription>{plan.description}</CardDescription>
                      
                      <div className="mt-4">
                        <span className="text-4xl font-bold">{plan.price}</span>
                        <span className="text-muted-foreground ml-2">/ {plan.period}</span>
                      </div>
                    </CardHeader>

                    <CardContent>
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSignUp(plan.name, plan.priceId);
                        }}
                        disabled={processingPlan === plan.name}
                        className={`w-full mb-6 bg-gradient-to-r ${plan.color} hover:opacity-90 transition-opacity text-white`}
                        size="lg"
                        data-testid={`button-signup-${plan.name.toLowerCase()}`}
                      >
                        {processingPlan === plan.name ? (
                          <>
                            <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                            Procesando...
                          </>
                        ) : (
                          plan.price === "$0" ? "Comenzar Gratis" : `Obtener ${plan.name}`
                        )}
                      </Button>

                      <div className="space-y-3">
                        {plan.features.map((feature, idx) => (
                          <div key={idx} className="flex items-start gap-2">
                            <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                            <span className="text-sm text-muted-foreground">{feature}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Features Highlight */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="max-w-4xl mx-auto"
        >
          <Card className="bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-950/20 dark:to-red-950/20 border-orange-200 dark:border-orange-800">
            <CardContent className="p-8">
              <h3 className="text-2xl font-bold text-center mb-6">
                Por Qué los Artistas Eligen Boostify Music
              </h3>
              
              <div className="grid md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-orange-600 to-red-600 flex items-center justify-center">
                    <Zap className="w-8 h-8 text-white" />
                  </div>
                  <h4 className="font-semibold mb-2">Herramientas IA</h4>
                  <p className="text-sm text-muted-foreground">
                    Crea videos musicales, genera contenido y automatiza marketing con IA de vanguardia
                  </p>
                </div>

                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-orange-500 to-orange-700 flex items-center justify-center">
                    <TrendingUp className="w-8 h-8 text-white" />
                  </div>
                  <h4 className="font-semibold mb-2">Crece tu Audiencia</h4>
                  <p className="text-sm text-muted-foreground">
                    Impulsa tu presencia en Spotify, Instagram y YouTube con estrategias probadas
                  </p>
                </div>

                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-red-600 to-orange-600 flex items-center justify-center">
                    <Users className="w-8 h-8 text-white" />
                  </div>
                  <h4 className="font-semibold mb-2">Plataforma Todo-en-Uno</h4>
                  <p className="text-sm text-muted-foreground">
                    Gestiona contratos, reservas, campañas de PR y más desde un solo panel
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Security Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="text-center mt-12 space-y-4"
        >
          <div className="flex flex-wrap justify-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-600" />
              <span>OpenID Connect & OAuth 2.0</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-600" />
              <span>End-to-end Encryption</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-600" />
              <span>GDPR Compliant</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-600" />
              <span>14-Day Money Back</span>
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            By signing up, you agree to our{" "}
            <a href="/terms" className="underline hover:text-foreground">Terms of Service</a>
            {" "}and{" "}
            <a href="/privacy" className="underline hover:text-foreground">Privacy Policy</a>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
