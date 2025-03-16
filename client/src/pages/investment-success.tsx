import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Header } from "../components/layout/header";
import { Footer } from "../components/layout/footer";
import { Button } from "../components/ui/button";
import { CircularProgress } from "../components/ui/circular-progress";
import { Card } from "../components/ui/card";
import { Check, DollarSign, ChevronRight, AlertTriangle } from "lucide-react";
import { useToast } from "../hooks/use-toast";

export default function InvestmentSuccessPage() {
  const { toast } = useToast();
  const [location, setLocation] = useLocation();
  const [loading, setLoading] = useState(true);
  const [investment, setInvestment] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchInvestmentDetails() {
      try {
        // Obtener el ID de la sesión de los parámetros de la URL
        const params = new URLSearchParams(window.location.search);
        const sessionId = params.get("session_id");

        if (!sessionId) {
          setError("No se encontró información de la transacción.");
          setLoading(false);
          return;
        }

        // Buscar la inversión por su ID de sesión de Stripe
        const response = await fetch(`/api/investors/status/${sessionId}`);
        const data = await response.json();

        if (data.success && data.investment) {
          setInvestment(data.investment);
        } else {
          throw new Error(data.error || "No se pudo cargar la información de la inversión");
        }
      } catch (error: any) {
        console.error("Error al cargar los detalles de la inversión:", error);
        setError(error.message || "Ocurrió un error al cargar los detalles de la inversión");
        
        // Mostrar un toast de error
        toast({
          title: "Error",
          description: "No pudimos cargar los detalles de tu inversión. Por favor, contacta a soporte.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    }

    fetchInvestmentDetails();
  }, [toast]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 pt-24 pb-16">
        <div className="container max-w-4xl mx-auto px-4">
          <Card className="p-6 md:p-8 shadow-lg">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <CircularProgress size={60} value={80} />
                <p className="mt-4 text-center text-muted-foreground">
                  Cargando los detalles de tu inversión...
                </p>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
                  <AlertTriangle className="h-8 w-8 text-red-500" />
                </div>
                <h1 className="text-2xl font-bold mb-2">Ocurrió un problema</h1>
                <p className="text-muted-foreground mb-6 max-w-md">
                  {error}
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button 
                    onClick={() => setLocation("/investors-dashboard")}
                    variant="outline"
                  >
                    Volver al panel
                  </Button>
                  <Button 
                    onClick={() => window.location.reload()}
                  >
                    Intentar de nuevo
                  </Button>
                </div>
              </div>
            ) : investment ? (
              <div className="flex flex-col items-center text-center">
                <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mb-6">
                  <Check className="h-10 w-10 text-green-500" />
                </div>
                <h1 className="text-2xl md:text-3xl font-bold mb-2">¡Inversión Exitosa!</h1>
                <p className="text-muted-foreground mb-8 max-w-md">
                  Tu inversión ha sido procesada correctamente. Pronto recibirás un correo electrónico con la confirmación y detalles adicionales.
                </p>
                
                <Card className="bg-muted/30 p-6 w-full max-w-md mb-8">
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Monto invertido:</span>
                      <span className="font-semibold">${investment.amount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Duración:</span>
                      <span className="font-semibold">{investment.duration} meses</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Tasa de retorno:</span>
                      <span className="font-semibold">{investment.rate}% mensual</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Retorno estimado:</span>
                      <span className="font-semibold text-green-500">${investment.estimatedReturn?.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Fecha:</span>
                      <span className="font-semibold">
                        {new Date().toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">ID:</span>
                      <span className="font-semibold text-xs">{investment.id}</span>
                    </div>
                  </div>
                </Card>
                
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button 
                    onClick={() => setLocation("/investors-dashboard")}
                    variant="outline"
                  >
                    <ChevronRight className="mr-2 h-4 w-4" />
                    Volver al panel
                  </Button>
                  <Button 
                    onClick={() => setLocation("/investors-dashboard?tab=investments")}
                    className="bg-orange-500 hover:bg-orange-600"
                  >
                    <DollarSign className="mr-2 h-4 w-4" />
                    Ver mis inversiones
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mb-4">
                  <AlertTriangle className="h-8 w-8 text-amber-500" />
                </div>
                <h1 className="text-2xl font-bold mb-2">Información no disponible</h1>
                <p className="text-muted-foreground mb-6 max-w-md">
                  No pudimos encontrar los detalles de tu inversión. Si completaste un pago, este ha sido procesado pero necesitamos más información.
                </p>
                <Button 
                  onClick={() => setLocation("/investors-dashboard")}
                >
                  <ChevronRight className="mr-2 h-4 w-4" />
                  Volver al panel
                </Button>
              </div>
            )}
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}