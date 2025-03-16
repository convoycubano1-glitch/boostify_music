import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { DollarSign, Check, ArrowRight, Calendar, BarChart2, Clock, Loader } from "lucide-react";
import { checkInvestmentSessionStatus } from "../lib/api/stripe-service";
import { useToast } from "../hooks/use-toast";

/**
 * Página de éxito después de completar una inversión con Stripe
 * Muestra los detalles de la inversión y opciones para continuar
 */
export default function InvestmentSuccess() {
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [investment, setInvestment] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchInvestmentDetails = async () => {
      try {
        setLoading(true);
        // Obtener el session_id de los parámetros de la URL
        const params = new URLSearchParams(window.location.search);
        const sessionId = params.get('session_id');

        if (!sessionId) {
          setError('No se encontró información de la inversión');
          toast({
            title: "Error",
            description: "No se pudo obtener la información de la inversión",
            variant: "destructive"
          });
          return;
        }

        // Verificar el estado de la inversión
        const result = await checkInvestmentSessionStatus(sessionId);
        
        if (result.success && result.investment) {
          setInvestment(result.investment);
          
          // Mostrar mensaje de éxito
          toast({
            title: "¡Inversión completada!",
            description: "Tu inversión ha sido procesada con éxito",
            variant: "default"
          });
        } else {
          setError(result.error || 'Error al obtener los detalles de la inversión');
          toast({
            title: "Error",
            description: "No se pudo verificar el estado de la inversión",
            variant: "destructive"
          });
        }
      } catch (error: any) {
        console.error('Error fetching investment details:', error);
        setError(error.message || 'Error al obtener los detalles de la inversión');
        toast({
          title: "Error",
          description: error.message || "Ocurrió un error al procesar tu inversión",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchInvestmentDetails();
  }, []);

  // Calcular el retorno mensual y total
  const monthlyReturn = investment ? (investment.amount * investment.rate) / 100 : 0;
  const totalReturn = investment ? monthlyReturn * investment.duration : 0;
  const totalAmount = investment ? investment.amount + totalReturn : 0;

  return (
    <div className="container max-w-3xl mx-auto py-10 px-4">
      <Card className="p-8 shadow-lg border-green-200">
        <div className="text-center mb-8">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-8">
              <Loader className="h-12 w-12 text-primary animate-spin mb-4" />
              <h2 className="text-2xl font-semibold mb-2">Verificando información...</h2>
              <p className="text-muted-foreground">Estamos procesando los detalles de tu inversión</p>
            </div>
          ) : error ? (
            <div className="py-8">
              <h2 className="text-2xl font-semibold mb-4 text-red-500">Error al procesar la inversión</h2>
              <p className="text-muted-foreground mb-4">{error}</p>
              <Button onClick={() => navigate('/investors-dashboard')}>
                Volver al panel de inversores
              </Button>
            </div>
          ) : (
            <>
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <Check className="h-8 w-8 text-green-600" />
              </div>
              <h1 className="text-3xl font-bold mb-2">¡Inversión Exitosa!</h1>
              <p className="text-muted-foreground">
                Tu inversión ha sido procesada correctamente y ya está activa en el sistema.
              </p>
            </>
          )}
        </div>

        {investment && (
          <div className="space-y-6">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-muted/30 p-4 rounded-lg">
                <div className="flex items-center mb-2">
                  <DollarSign className="h-5 w-5 text-muted-foreground mr-2" />
                  <h3 className="font-medium">Monto invertido</h3>
                </div>
                <p className="text-2xl font-semibold">${investment.amount.toLocaleString()}</p>
              </div>
              
              <div className="bg-muted/30 p-4 rounded-lg">
                <div className="flex items-center mb-2">
                  <BarChart2 className="h-5 w-5 text-muted-foreground mr-2" />
                  <h3 className="font-medium">Retorno mensual</h3>
                </div>
                <p className="text-2xl font-semibold">${monthlyReturn.toFixed(2)}</p>
              </div>
              
              <div className="bg-muted/30 p-4 rounded-lg">
                <div className="flex items-center mb-2">
                  <Calendar className="h-5 w-5 text-muted-foreground mr-2" />
                  <h3 className="font-medium">Duración</h3>
                </div>
                <p className="text-2xl font-semibold">{investment.duration} meses</p>
              </div>
              
              <div className="bg-muted/30 p-4 rounded-lg">
                <div className="flex items-center mb-2">
                  <Clock className="h-5 w-5 text-muted-foreground mr-2" />
                  <h3 className="font-medium">Porcentaje</h3>
                </div>
                <p className="text-2xl font-semibold">{investment.rate}% mensual</p>
              </div>
            </div>

            <div className="bg-green-50 p-6 rounded-lg border border-green-200 mt-6">
              <h3 className="text-xl font-semibold mb-4">Resumen de la inversión</h3>
              
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Monto invertido:</span>
                  <span className="font-medium">${investment.amount.toLocaleString()}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Retorno mensual estimado:</span>
                  <span className="font-medium">${monthlyReturn.toFixed(2)}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Retorno total estimado:</span>
                  <span className="font-medium">${totalReturn.toFixed(2)}</span>
                </div>
                
                <div className="border-t pt-3 mt-3">
                  <div className="flex justify-between">
                    <span className="font-semibold">Monto total al finalizar:</span>
                    <span className="font-bold text-xl text-green-600">${totalAmount.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col md:flex-row gap-4 mt-8">
              <Button 
                className="flex-1"
                onClick={() => navigate('/investors-dashboard')}
                variant="outline"
              >
                Volver al panel de inversores
              </Button>
              
              <Button 
                className="flex-1 bg-green-600 hover:bg-green-700"
                onClick={() => navigate('/dashboard')}
              >
                Ir al panel principal
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}