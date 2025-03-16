import { useLocation } from "wouter";
import { Header } from "../components/layout/header";
import { Footer } from "../components/layout/footer";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { ChevronRight, AlertTriangle, DollarSign, Calculator } from "lucide-react";

export default function InvestmentCancelledPage() {
  const [location, setLocation] = useLocation();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 pt-24 pb-16">
        <div className="container max-w-4xl mx-auto px-4">
          <Card className="p-6 md:p-8 shadow-lg">
            <div className="flex flex-col items-center text-center py-8">
              <div className="w-20 h-20 rounded-full bg-amber-100 flex items-center justify-center mb-6">
                <AlertTriangle className="h-10 w-10 text-amber-500" />
              </div>
              <h1 className="text-2xl md:text-3xl font-bold mb-2">Inversión Cancelada</h1>
              <p className="text-muted-foreground mb-8 max-w-lg">
                Has cancelado el proceso de inversión. No se ha realizado ningún cargo a tu cuenta.
                Si tienes preguntas o necesitas ayuda, no dudes en contactar a nuestro equipo de soporte.
              </p>
              
              <div className="bg-muted/30 p-6 w-full max-w-md mb-8 rounded-lg">
                <h3 className="text-lg font-medium mb-4">¿Por qué invertir con nosotros?</h3>
                <ul className="space-y-2 text-left">
                  <li className="flex items-start">
                    <ChevronRight className="h-5 w-5 text-orange-500 mr-2 flex-shrink-0 mt-0.5" />
                    <span>Retornos mensuales competitivos del 4% al 6%</span>
                  </li>
                  <li className="flex items-start">
                    <ChevronRight className="h-5 w-5 text-orange-500 mr-2 flex-shrink-0 mt-0.5" />
                    <span>Diferentes plazos de inversión para adaptarse a tus necesidades</span>
                  </li>
                  <li className="flex items-start">
                    <ChevronRight className="h-5 w-5 text-orange-500 mr-2 flex-shrink-0 mt-0.5" />
                    <span>Inversión mínima accesible desde $2,000</span>
                  </li>
                  <li className="flex items-start">
                    <ChevronRight className="h-5 w-5 text-orange-500 mr-2 flex-shrink-0 mt-0.5" />
                    <span>Panel de inversión exclusivo para seguir tus ganancias</span>
                  </li>
                </ul>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  onClick={() => setLocation("/investors-dashboard")}
                  variant="outline"
                >
                  <ChevronRight className="mr-2 h-4 w-4" />
                  Volver al Panel
                </Button>
                <Button 
                  onClick={() => setLocation("/investors-dashboard?tab=calculator")}
                  className="bg-orange-500 hover:bg-orange-600"
                >
                  <Calculator className="mr-2 h-4 w-4" />
                  Volver a Calculadora
                </Button>
                <Button onClick={() => setLocation("/investors-dashboard")}>
                  <DollarSign className="mr-2 h-4 w-4" />
                  Intentar de Nuevo
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}