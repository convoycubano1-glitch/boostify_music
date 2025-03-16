import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Header } from "../components/layout/header";
import { Footer } from "../components/layout/footer";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { ChevronRight, X, AlertCircle } from "lucide-react";

export default function InvestmentCancelledPage() {
  const [location, setLocation] = useLocation();
  
  // Podríamos agregar lógica más avanzada si necesitamos rastrear cancelaciones
  // pero por ahora mantenemos una página simple

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 pt-24 pb-16">
        <div className="container max-w-4xl mx-auto px-4">
          <Card className="p-6 md:p-8 shadow-lg">
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mb-6">
                <X className="h-10 w-10 text-red-500" />
              </div>
              <h1 className="text-2xl md:text-3xl font-bold mb-2">Inversión Cancelada</h1>
              <p className="text-muted-foreground mb-8 max-w-md">
                Has cancelado el proceso de inversión. No se ha realizado ningún cargo a tu cuenta.
              </p>
              
              <div className="bg-muted/30 p-6 w-full max-w-md mb-8 rounded-lg border border-muted">
                <div className="flex items-start space-x-4">
                  <AlertCircle className="h-6 w-6 text-amber-500 flex-shrink-0 mt-0.5" />
                  <div className="text-left">
                    <h3 className="font-medium mb-2">¿Tienes preguntas sobre cómo invertir?</h3>
                    <p className="text-muted-foreground text-sm">
                      Nuestro equipo está disponible para ayudarte a entender las opciones de inversión y responder cualquier duda que puedas tener.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  onClick={() => setLocation("/investors-dashboard")}
                  variant="outline"
                >
                  <ChevronRight className="mr-2 h-4 w-4" />
                  Volver al panel
                </Button>
                <Button 
                  onClick={() => setLocation("/contact")}
                  className="bg-orange-500 hover:bg-orange-600"
                >
                  <ChevronRight className="mr-2 h-4 w-4" />
                  Contactar a soporte
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