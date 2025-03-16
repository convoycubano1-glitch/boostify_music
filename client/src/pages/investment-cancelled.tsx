import { Header } from "../components/layout/header";
import { Link } from "wouter";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { AlertCircle, BarChart2, Calculator, ArrowRight, RefreshCcw } from "lucide-react";

/**
 * Página mostrada cuando un pago de inversión es cancelado
 * 
 * Esta página se muestra cuando el usuario cancela un pago de Stripe
 * o cuando el pago no se completa correctamente.
 */
export default function InvestmentCancelledPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1 pt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-3xl mx-auto">
            <Card className="p-8 text-center mb-6">
              <div className="h-24 w-24 rounded-full bg-amber-500/20 mx-auto mb-6 flex items-center justify-center">
                <AlertCircle className="h-12 w-12 text-amber-500" />
              </div>
              <h1 className="text-3xl font-bold mb-2">Inversión cancelada</h1>
              <p className="text-xl text-muted-foreground mb-8">
                Tu proceso de inversión ha sido cancelado
              </p>
              
              <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
                No te preocupes, no se ha realizado ningún cargo a tu método de pago.
                Puedes volver a intentarlo cuando estés listo.
              </p>
              
              <div className="flex flex-wrap justify-center gap-4">
                <Button asChild>
                  <Link to="/investors-dashboard?tab=calculator">
                    <Calculator className="mr-2 h-5 w-5" />
                    Volver a la calculadora
                  </Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link to="/investors-dashboard">
                    <BarChart2 className="mr-2 h-5 w-5" />
                    Ir al Dashboard
                  </Link>
                </Button>
              </div>
            </Card>
            
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">¿Tuviste algún problema?</h2>
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="bg-orange-500/10 p-2 rounded">
                    <RefreshCcw className="h-5 w-5 text-orange-500" />
                  </div>
                  <div>
                    <h3 className="font-medium">Puedes intentarlo nuevamente</h3>
                    <p className="text-muted-foreground text-sm">
                      Si tuviste problemas con tu método de pago, puedes intentar de nuevo 
                      con otro método desde nuestra calculadora de inversiones.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="bg-orange-500/10 p-2 rounded">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-orange-500">
                      <path d="M14 9a2 2 0 0 1-2 2H6l-4 4V4c0-1.1.9-2 2-2h8a2 2 0 0 1 2 2v5Z"></path>
                      <path d="M18 9h2a2 2 0 0 1 2 2v11l-4-4h-6a2 2 0 0 1-2-2v-1"></path>
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-medium">Contacta a nuestro equipo</h3>
                    <p className="text-muted-foreground text-sm">
                      Si necesitas ayuda o tienes preguntas sobre el proceso de inversión,
                      no dudes en contactar a nuestro equipo de soporte.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="bg-orange-500/10 p-2 rounded">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-orange-500">
                      <rect width="20" height="14" x="2" y="5" rx="2"></rect>
                      <line x1="2" x2="22" y1="10" y2="10"></line>
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-medium">Verifica tu método de pago</h3>
                    <p className="text-muted-foreground text-sm">
                      Asegúrate de que tu tarjeta tenga fondos suficientes y esté habilitada
                      para compras en línea o pagos internacionales.
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
          </div>
        </div>
      </main>
    </div>
  );
}