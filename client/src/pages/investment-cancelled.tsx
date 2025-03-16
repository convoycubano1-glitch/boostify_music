import { useLocation } from "wouter";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { DollarSign, XCircle, ArrowLeft, RotateCcw } from "lucide-react";

/**
 * Página de cancelación para cuando el usuario abandona el proceso de pago
 * de inversión en Stripe o cuando ocurre un error durante el procesamiento
 */
export default function InvestmentCancelled() {
  const [location, navigate] = useLocation();

  // Manejar el retorno al panel de inversores
  const handleReturn = () => {
    navigate('/investors-dashboard');
  };

  // Manejar el reintentar la inversión
  const handleRetry = () => {
    navigate('/investors-dashboard');
  };

  return (
    <div className="container max-w-2xl mx-auto py-10 px-4">
      <Card className="p-8 shadow-lg border-red-100">
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <XCircle className="h-8 w-8 text-red-600" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Inversión Cancelada</h1>
          <p className="text-muted-foreground">
            La transacción ha sido cancelada y no se ha procesado ningún cargo.
          </p>
        </div>

        <div className="space-y-6">
          <div className="bg-muted/30 p-6 rounded-lg">
            <h3 className="text-xl font-semibold mb-4">¿Qué puedo hacer ahora?</h3>
            
            <ul className="space-y-4">
              <li className="flex gap-3">
                <div className="bg-primary/10 rounded-full p-1.5 h-fit">
                  <RotateCcw className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="font-medium">Reintentar la inversión</p>
                  <p className="text-sm text-muted-foreground">
                    Puedes volver al panel de inversores y configurar tu inversión nuevamente.
                  </p>
                </div>
              </li>
              
              <li className="flex gap-3">
                <div className="bg-primary/10 rounded-full p-1.5 h-fit">
                  <DollarSign className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="font-medium">Ajustar los parámetros</p>
                  <p className="text-sm text-muted-foreground">
                    Modifica el monto, duración o tasa para encontrar un plan que se ajuste mejor a tus necesidades.
                  </p>
                </div>
              </li>
            </ul>
          </div>

          <div className="bg-red-50 p-6 rounded-lg border border-red-100">
            <h3 className="text-lg font-semibold mb-2">Información importante</h3>
            <p className="text-sm text-muted-foreground">
              Si experimentaste problemas técnicos durante el proceso de pago o tienes preguntas sobre las opciones de inversión, 
              no dudes en contactar a nuestro equipo de soporte para recibir asistencia personalizada.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 mt-6">
            <Button 
              className="flex-1"
              onClick={handleReturn}
              variant="outline"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver al panel
            </Button>
            
            <Button 
              className="flex-1"
              onClick={handleRetry}
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Reintentar inversión
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}