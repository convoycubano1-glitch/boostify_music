import { useEffect, useState } from "react";
import { Header } from "../components/layout/header";
import { Link, useLocation } from "wouter";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { CheckCircle, BarChart2, FileText, ChevronRight, ArrowRight } from "lucide-react";
import { checkInvestmentSessionStatus } from "../lib/api/stripe-service";
import { useToast } from "../hooks/use-toast";

/**
 * Página de éxito después de un pago de inversión
 * 
 * Esta página se muestra después de completar un pago exitoso a través de Stripe.
 * Recupera los datos de la inversión utilizando el ID de sesión proporcionado en la URL.
 */
export default function InvestmentSuccessPage() {
  const { toast } = useToast();
  const [, params] = useLocation();
  const sessionId = new URLSearchParams(params).get("session_id");
  const [investment, setInvestment] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Verificar el estado de la inversión al cargar la página
    async function verifyInvestment() {
      if (!sessionId) {
        setError("No se encontró ID de sesión");
        setLoading(false);
        return;
      }

      try {
        const result = await checkInvestmentSessionStatus(sessionId);
        
        if (result.success && result.investment) {
          console.log("Inversión encontrada:", result.investment);
          setInvestment(result.investment);
        } else {
          setError(result.error || "No se pudo encontrar la información de la inversión");
        }
      } catch (error: any) {
        console.error("Error al verificar la inversión:", error);
        setError(error.message || "Error al procesar la información de pago");
      } finally {
        setLoading(false);
      }
    }

    verifyInvestment();
  }, [sessionId]);

  // Función para formatear una fecha
  const formatDate = (dateStr: string) => {
    if (!dateStr) return "N/A";
    
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat("es-ES", {
      day: "numeric",
      month: "long",
      year: "numeric"
    }).format(date);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1 pt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-3xl mx-auto">
            {loading ? (
              <Card className="p-8 text-center">
                <div className="animate-pulse">
                  <div className="h-24 w-24 rounded-full bg-orange-500/20 mx-auto mb-6 flex items-center justify-center">
                    <BarChart2 className="h-12 w-12 text-orange-500/50" />
                  </div>
                  <h1 className="text-2xl font-bold mb-2">Verificando inversión...</h1>
                  <p className="text-muted-foreground">
                    Estamos confirmando los detalles de tu inversión
                  </p>
                </div>
              </Card>
            ) : error ? (
              <Card className="p-8 text-center">
                <div className="h-24 w-24 rounded-full bg-red-500/20 mx-auto mb-6 flex items-center justify-center">
                  <svg className="h-12 w-12 text-red-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <h1 className="text-2xl font-bold mb-2">Ha ocurrido un problema</h1>
                <p className="text-muted-foreground mb-6">
                  {error}
                </p>
                <div className="flex justify-center">
                  <Button asChild variant="outline">
                    <Link to="/investors-dashboard">
                      <ChevronRight className="mr-2 h-4 w-4" />
                      Volver al Dashboard
                    </Link>
                  </Button>
                </div>
              </Card>
            ) : (
              <>
                <Card className="p-8 text-center mb-6">
                  <div className="h-24 w-24 rounded-full bg-green-500/20 mx-auto mb-6 flex items-center justify-center">
                    <CheckCircle className="h-12 w-12 text-green-500" />
                  </div>
                  <h1 className="text-3xl font-bold mb-2">¡Inversión confirmada!</h1>
                  <p className="text-xl text-muted-foreground mb-8">
                    Tu inversión ha sido procesada exitosamente
                  </p>
                  
                  <div className="grid md:grid-cols-2 gap-4 mb-8">
                    <div className="bg-background p-4 rounded-lg border">
                      <p className="text-sm text-muted-foreground">Monto de inversión</p>
                      <p className="text-2xl font-bold">${investment?.amount?.toLocaleString()}</p>
                    </div>
                    <div className="bg-background p-4 rounded-lg border">
                      <p className="text-sm text-muted-foreground">Rendimiento mensual</p>
                      <p className="text-2xl font-bold">${(investment?.amount * investment?.rate / 100).toLocaleString()}</p>
                    </div>
                    <div className="bg-background p-4 rounded-lg border">
                      <p className="text-sm text-muted-foreground">Duración</p>
                      <p className="text-2xl font-bold">{investment?.duration} meses</p>
                    </div>
                    <div className="bg-background p-4 rounded-lg border">
                      <p className="text-sm text-muted-foreground">Retorno estimado</p>
                      <p className="text-2xl font-bold">${investment?.estimatedReturn?.toLocaleString()}</p>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap justify-center gap-4">
                    <Button asChild>
                      <Link to="/investors-dashboard">
                        <BarChart2 className="mr-2 h-5 w-5" />
                        Ir al Dashboard
                      </Link>
                    </Button>
                    <Button variant="outline" asChild>
                      <Link to="/investors-dashboard?tab=investments">
                        <FileText className="mr-2 h-5 w-5" />
                        Ver mis inversiones
                      </Link>
                    </Button>
                  </div>
                </Card>
                
                <Card className="p-6">
                  <h2 className="text-xl font-semibold mb-4">¿Qué sigue ahora?</h2>
                  <div className="space-y-4">
                    <div className="flex items-start gap-4">
                      <div className="bg-orange-500/10 p-2 rounded">
                        <span className="text-orange-500 font-bold">1</span>
                      </div>
                      <div>
                        <h3 className="font-medium">Confirmación por correo electrónico</h3>
                        <p className="text-muted-foreground text-sm">
                          Recibirás un correo con los detalles de tu inversión y el contrato en los próximos minutos.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="bg-orange-500/10 p-2 rounded">
                        <span className="text-orange-500 font-bold">2</span>
                      </div>
                      <div>
                        <h3 className="font-medium">Primer pago de rendimientos</h3>
                        <p className="text-muted-foreground text-sm">
                          Tu primer pago de rendimientos será depositado en {investment?.nextPaymentDate ? formatDate(investment.nextPaymentDate) : '30 días'}.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="bg-orange-500/10 p-2 rounded">
                        <span className="text-orange-500 font-bold">3</span>
                      </div>
                      <div>
                        <h3 className="font-medium">Seguimiento en el dashboard</h3>
                        <p className="text-muted-foreground text-sm">
                          Podrás seguir el rendimiento de tu inversión en tiempo real desde tu dashboard de inversor.
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-6 pt-6 border-t">
                    <Link to="/investors-dashboard" className="text-orange-500 hover:text-orange-600 inline-flex items-center font-medium">
                      Volver al Dashboard de Inversores
                      <ArrowRight className="ml-1 h-4 w-4" />
                    </Link>
                  </div>
                </Card>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}