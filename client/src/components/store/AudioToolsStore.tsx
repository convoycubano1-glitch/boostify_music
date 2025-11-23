import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { motion } from "framer-motion";
import { Volume2, Mic, Zap, Waves, Check, Loader2, DollarSign } from "lucide-react";
import { useToast } from "../../hooks/use-toast";
import axios from "axios";

const audioTools = [
  {
    id: "audio-mastering",
    name: "Professional Audio Mastering",
    description: "Industry-standard audio mastering tool with AI-powered optimization",
    price: 29.99,
    monthlyPrice: 9.99,
    icon: Volume2,
    features: [
      "Real-time audio analysis",
      "16 professional EQ presets",
      "Multiband compression",
      "Loudness normalization",
      "A/B comparison tools",
      "Export to multiple formats"
    ],
    popular: true
  },
  {
    id: "voice-cloning",
    name: "Voice Cloning Studio",
    description: "Advanced voice cloning and synthesis with 50+ voice models",
    price: 49.99,
    monthlyPrice: 19.99,
    icon: Mic,
    features: [
      "50+ professional voices",
      "Real-time voice conversion",
      "Custom voice training",
      "Emotion control",
      "Multi-language support",
      "Commercial license"
    ],
    premium: true
  },
  {
    id: "audio-suite",
    name: "Audio Production Suite",
    description: "Complete audio production toolkit with mixing, editing, and effects",
    price: 39.99,
    monthlyPrice: 14.99,
    icon: Zap,
    features: [
      "Multi-track mixing",
      "100+ professional effects",
      "Real-time spectrogram",
      "Advanced automation",
      "Plugin compatibility",
      "Cloud project sync"
    ]
  },
  {
    id: "mixing-mastering",
    name: "Pro Mixing & Mastering Suite",
    description: "Complete solution for mixing and mastering with advanced tools",
    price: 59.99,
    monthlyPrice: 24.99,
    icon: Waves,
    features: [
      "Advanced mixing console",
      "Mastering-grade EQ & compression",
      "Multi-band processing",
      "AI mixing assistant",
      "Metering and analysis",
      "Studio-grade monitoring"
    ],
    premium: true
  }
];

interface AudioToolsStoreProps {
  onPurchaseComplete?: () => void;
}

export function AudioToolsStore({ onPurchaseComplete }: AudioToolsStoreProps) {
  const [loadingTools, setLoadingTools] = useState<Record<string, boolean>>({});
  const [purchasedTools, setPurchasedTools] = useState<Record<string, boolean>>({});
  const { toast } = useToast();

  const handlePurchaseTool = async (tool: typeof audioTools[0]) => {
    try {
      setLoadingTools(prev => ({ ...prev, [tool.id]: true }));

      const response = await axios.post('/api/stripe/create-product-payment', {
        productId: tool.id,
        productType: 'audio_tool',
        amount: tool.price,
        name: tool.name,
        monthlyPrice: tool.monthlyPrice
      });

      if (response.data.alreadyPurchased) {
        toast({
          title: "Ya tienes acceso",
          description: `Ya has adquirido ${tool.name}`,
          variant: "default"
        });
        setPurchasedTools(prev => ({ ...prev, [tool.id]: true }));
        setLoadingTools(prev => ({ ...prev, [tool.id]: false }));
        return;
      }

      if (response.data.success && response.data.url) {
        window.location.href = response.data.url;
      } else {
        throw new Error("No se pudo iniciar el proceso de pago");
      }
    } catch (error) {
      toast({
        title: "Error de pago",
        description: "No se pudo procesar la compra. Intenta nuevamente.",
        variant: "destructive"
      });
      setLoadingTools(prev => ({ ...prev, [tool.id]: false }));
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center mb-12">
        <h2 className="text-4xl font-bold mb-4">Audio Production Tools</h2>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Acceso ilimitado a herramientas profesionales de audio con Stripe
        </p>
      </div>

      {/* Tools Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        {audioTools.map((tool, index) => {
          const Icon = tool.icon;
          const isPurchased = purchasedTools[tool.id];
          const isLoading = loadingTools[tool.id];

          return (
            <motion.div
              key={tool.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <Card className={`h-full flex flex-col border transition-all duration-300 ${
                tool.popular ? 'border-orange-500/50 shadow-lg shadow-orange-500/20' : 'border-slate-700'
              } ${isPurchased ? 'bg-green-500/5' : 'hover:border-orange-500/30'}`}>
                <CardHeader>
                  <div className="flex items-start justify-between mb-3">
                    <Icon className="h-8 w-8 text-orange-500" />
                    {tool.popular && (
                      <Badge className="bg-orange-500 text-white">Popular</Badge>
                    )}
                    {tool.premium && (
                      <Badge className="bg-purple-500 text-white">Premium</Badge>
                    )}
                  </div>
                  <CardTitle className="text-lg">{tool.name}</CardTitle>
                  <CardDescription className="text-sm">{tool.description}</CardDescription>
                </CardHeader>

                <CardContent className="flex-1 flex flex-col space-y-6">
                  {/* Price */}
                  <div className="space-y-2">
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-bold text-orange-500">${tool.price}</span>
                      <span className="text-sm text-muted-foreground">o ${tool.monthlyPrice}/mes</span>
                    </div>
                  </div>

                  {/* Features */}
                  <div className="space-y-3">
                    {tool.features.map((feature, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm">
                        <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                        <span className="text-muted-foreground">{feature}</span>
                      </div>
                    ))}
                  </div>

                  {/* Button */}
                  <Button
                    onClick={() => handlePurchaseTool(tool)}
                    disabled={isLoading || isPurchased}
                    className={`w-full mt-auto ${
                      isPurchased
                        ? 'bg-green-500 hover:bg-green-600'
                        : 'bg-orange-500 hover:bg-orange-600'
                    }`}
                  >
                    {isPurchased ? (
                      <>
                        <Check className="h-4 w-4 mr-2" />
                        Comprado
                      </>
                    ) : isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Procesando...
                      </>
                    ) : (
                      <>
                        <DollarSign className="h-4 w-4 mr-2" />
                        Comprar ahora
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* FAQ Section */}
      <Card className="border-slate-700 bg-slate-900/50 p-8">
        <h3 className="text-2xl font-bold mb-6">Preguntas Frecuentes</h3>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-semibold mb-2">¿Puedo usar estas herramientas comercialmente?</h4>
            <p className="text-sm text-muted-foreground">
              Sí, todas nuestras herramientas incluyen licencia comercial completa.
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-2">¿Hay acceso de por vida?</h4>
            <p className="text-sm text-muted-foreground">
              Ofrecemos compra de por vida O suscripción mensual. Elige la que mejor se adapte.
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-2">¿Incluyen soporte?</h4>
            <p className="text-sm text-muted-foreground">
              Sí, todos los clientes reciben soporte por email y acceso a nuestra comunidad.
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-2">¿Hay descuentos para paquetes?</h4>
            <p className="text-sm text-muted-foreground">
              Contacta a nuestro equipo para paquetes especiales y descuentos por volumen.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
