import { useState } from "react";
import { Button } from "../ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { CheckCircle2, CreditCard, Loader2, Lock, Sparkles, Zap } from "lucide-react";
import { useToast } from "../../hooks/use-toast";
import { apiRequest } from "../../lib/queryClient";

interface PaymentSectionProps {
  songName: string;
  duration: number;
  userId: string;
  isPaid: boolean;
  onPaymentSuccess: () => void;
}

export function PaymentSection({ 
  songName, 
  duration, 
  userId,
  isPaid,
  onPaymentSuccess 
}: PaymentSectionProps) {
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  const handlePayment = async () => {
    setIsProcessing(true);
    try {
      const response = await apiRequest({
        url: '/api/stripe/create-music-video-payment',
        method: 'POST',
        data: {
          userId,
          songName,
          duration
        }
      }) as { url: string };

      if (response.url) {
        // Redirigir a Stripe Checkout
        window.location.href = response.url;
      } else {
        throw new Error('No se recibió URL de pago');
      }
    } catch (error) {
      console.error('Error al crear sesión de pago:', error);
      toast({
        title: "Error de pago",
        description: error instanceof Error ? error.message : "No se pudo iniciar el proceso de pago",
        variant: "destructive",
      });
      setIsProcessing(false);
    }
  };

  if (isPaid) {
    return (
      <Card className="border-green-500/20 bg-green-500/5">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-green-500" />
            Video Completo Desbloqueado
          </CardTitle>
          <CardDescription>
            Has pagado por el video musical completo
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              <span>30 escenas cinematográficas</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              <span>Video completo ({duration}s)</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              <span>Calidad profesional con modelo seleccionado</span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4" data-testid="payment-section">
      {/* Plan Gratuito */}
      <Card className="border-muted">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Vista Previa Gratuita</CardTitle>
            <Badge variant="secondary">Gratis</Badge>
          </div>
          <CardDescription>
            Prueba antes de pagar
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Zap className="w-4 h-4" />
              <span>10 segundos de preview</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Zap className="w-4 h-4" />
              <span>3-5 escenas de prueba</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Zap className="w-4 h-4" />
              <span>Calidad estándar</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Plan Premium */}
      <Card className="border-primary shadow-lg relative overflow-hidden">
        {/* Gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-purple-500/5" />
        
        <CardHeader className="relative">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              Video Completo Premium
            </CardTitle>
            <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
              $199.00
            </Badge>
          </div>
          <CardDescription>
            Video musical completo de nivel profesional
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4 relative">
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-primary" />
              <span className="font-medium">30 escenas cinematográficas únicas</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-primary" />
              <span className="font-medium">Video completo ({Math.round(duration)}s)</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-primary" />
              <span className="font-medium">Modelos premium (KLING, Veo, Sora)</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-primary" />
              <span className="font-medium">Prompts variados y creativos</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-primary" />
              <span className="font-medium">Descarga en alta calidad</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-primary" />
              <span className="font-medium">Guardado permanente en tu cuenta</span>
            </div>
          </div>

          <Button
            onClick={handlePayment}
            disabled={isProcessing}
            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg"
            size="lg"
            data-testid="button-pay-premium"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Procesando...
              </>
            ) : (
              <>
                <CreditCard className="w-4 h-4 mr-2" />
                Pagar $199 - Desbloquear Video Completo
              </>
            )}
          </Button>

          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <Lock className="w-3 h-3" />
            <span>Pago seguro con Stripe</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
