import { useState, useEffect } from "react";
import { useAuth } from "../hooks/use-auth";
import { useToast } from "../hooks/use-toast";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Slider } from "./ui/slider";
import {
  DollarSign,
  BarChart2,
  Calendar,
  Calculator,
  AlertTriangle
} from "lucide-react";
import { v4 as uuidv4 } from 'uuid';

/**
 * Calculadora de inversiones que permite a los usuarios configurar
 * y procesar pagos para inversiones a través de Stripe
 */
export default function InvestmentCalculator() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [investmentAmount, setInvestmentAmount] = useState(5000);
  const [returnRate, setReturnRate] = useState(5); // Default a 5%
  const [durationMonths, setDurationMonths] = useState(12);
  const [monthlyReturn, setMonthlyReturn] = useState(0);
  const [totalReturn, setTotalReturn] = useState(0);
  const [finalAmount, setFinalAmount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [showAuthWarning, setShowAuthWarning] = useState(false);
  const [email, setEmail] = useState("");

  // Recalcular retornos cuando cambian los inputs
  useEffect(() => {
    const calculatedMonthlyReturn = (investmentAmount * returnRate) / 100;
    const calculatedTotalReturn = calculatedMonthlyReturn * durationMonths;
    const calculatedFinalAmount = investmentAmount + calculatedTotalReturn;

    setMonthlyReturn(calculatedMonthlyReturn);
    setTotalReturn(calculatedTotalReturn);
    setFinalAmount(calculatedFinalAmount);
  }, [investmentAmount, returnRate, durationMonths]);

  // Función para procesar la inversión con Stripe
  const handleInvestmentPayment = async () => {
    try {
      setIsLoading(true);
      
      // Si el usuario no está autenticado y no ha proporcionado un email, mostrar advertencia
      if (!user && !email) {
        setShowAuthWarning(true);
        setIsLoading(false);
        return;
      }
      
      // Mostrar toast de procesamiento
      toast({
        title: "Procesando inversión",
        description: "Estamos preparando tu sesión de pago...",
        variant: "default"
      });
      
      // Generar un ID único para esta inversión
      const investmentId = `inv-${uuidv4()}`;
      
      // Preparar datos para la solicitud
      const paymentData = {
        investmentId,
        amount: investmentAmount,
        duration: durationMonths,
        rate: returnRate,
        projectName: `Inversión de $${investmentAmount} por ${durationMonths} meses`,
        userId: user?.uid || 'guest',
        email: email || user?.email
      };
      
      // Enviar solicitud al servidor
      const response = await fetch('/api/investors/create-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paymentData),
      });
      
      const data = await response.json();
      
      if (data.success && data.url) {
        // Mostrar mensaje de éxito antes de redirigir
        toast({
          title: "Redirigiéndote a Stripe",
          description: "Te estamos llevando a la página de pago segura...",
          variant: "default"
        });
        
        // Pequeña pausa para que el usuario vea el mensaje
        setTimeout(() => {
          // Redirigir al usuario a la página de pago de Stripe
          window.location.href = data.url;
        }, 1500);
      } else {
        throw new Error(data.error || 'Error al crear la sesión de pago');
      }
    } catch (error: any) {
      console.error('Error al procesar inversión:', error);
      toast({
        title: "Error",
        description: error.message || "No se pudo procesar tu inversión. Inténtalo de nuevo más tarde.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="grid md:grid-cols-2 gap-8">
      <div>
        <Card className="p-6 mb-6">
          <h4 className="text-base font-medium mb-6">Configura tu inversión</h4>
          
          <div className="space-y-8">
            {!user && (
              <div className="mb-4">
                <Label htmlFor="email" className="text-sm font-medium">
                  Email para recibir información de tu inversión
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@email.com"
                  className="mt-1"
                  required={!user}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Necesitamos tu email para enviarte información sobre tu inversión.
                </p>
                {showAuthWarning && !email && (
                  <div className="flex items-center mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
                    <AlertTriangle className="h-4 w-4 mr-2 flex-shrink-0" />
                    <p>Por favor proporciona un email para continuar</p>
                  </div>
                )}
              </div>
            )}
            
            <div>
              <div className="flex justify-between mb-2">
                <label className="text-sm font-medium">Monto de inversión</label>
                <span className="text-sm font-medium">${investmentAmount.toLocaleString()}</span>
              </div>
              <div className="flex items-center gap-4">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <Slider
                  value={[investmentAmount]}
                  min={1000}
                  max={100000}
                  step={1000}
                  onValueChange={(value) => setInvestmentAmount(value[0])}
                  className="flex-1"
                />
              </div>
            </div>
            
            <div>
              <div className="flex justify-between mb-2">
                <label className="text-sm font-medium">Tasa de retorno</label>
                <span className="text-sm font-medium">{returnRate}% mensual</span>
              </div>
              <div className="flex items-center gap-4">
                <BarChart2 className="h-4 w-4 text-muted-foreground" />
                <Slider
                  value={[returnRate]}
                  min={2}
                  max={6}
                  step={0.1}
                  onValueChange={(value) => setReturnRate(value[0])}
                  className="flex-1"
                />
              </div>
            </div>
            
            <div>
              <div className="flex justify-between mb-2">
                <label className="text-sm font-medium">Duración</label>
                <span className="text-sm font-medium">{durationMonths} meses</span>
              </div>
              <div className="flex items-center gap-4">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <Slider
                  value={[durationMonths]}
                  min={6}
                  max={36}
                  step={1}
                  onValueChange={(value) => setDurationMonths(value[0])}
                  className="flex-1"
                />
              </div>
            </div>

            <Button 
              className="w-full" 
              variant="outline"
              onClick={() => {
                // Solo recalcula, manteniendo los valores actuales
                const event = new Event('recalculate');
                window.dispatchEvent(event);
              }}
            >
              <Calculator className="mr-2 h-4 w-4" />
              Recalcular
            </Button>
          </div>
        </Card>

        <div className="text-sm text-muted-foreground">
          <p>
            Este calculador proporciona estimaciones basadas en nuestros planes actuales de inversión. Los rendimientos reales pueden variar.
          </p>
        </div>
      </div>

      <div>
        <Card className="p-6 overflow-hidden bg-gradient-to-br from-orange-500/10 to-background border-orange-500/20">
          <h4 className="text-lg font-medium mb-8">Resultados de la inversión</h4>
          
          <div className="space-y-6">
            <div className="flex justify-between items-center p-4 bg-background rounded-lg border">
              <div>
                <p className="text-sm text-muted-foreground">Retorno mensual</p>
                <p className="text-2xl font-bold">${monthlyReturn.toFixed(2)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-orange-500 opacity-50" />
            </div>
            
            <div className="flex justify-between items-center p-4 bg-background rounded-lg border">
              <div>
                <p className="text-sm text-muted-foreground">Retorno total</p>
                <p className="text-2xl font-bold">${totalReturn.toFixed(2)}</p>
              </div>
              <BarChart2 className="h-8 w-8 text-orange-500 opacity-50" />
            </div>
            
            <div className="flex justify-between items-center p-4 bg-orange-500/10 rounded-lg border border-orange-500/30">
              <div>
                <p className="text-sm text-muted-foreground">Monto Final</p>
                <p className="text-3xl font-bold">${finalAmount.toFixed(2)}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">ROI</p>
                <p className="text-xl font-bold text-orange-500">{((totalReturn / investmentAmount) * 100).toFixed(2)}%</p>
              </div>
            </div>

            <Button 
              className="w-full bg-orange-500 hover:bg-orange-600 mt-4"
              onClick={handleInvestmentPayment}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <span className="animate-spin mr-2">
                    <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  </span>
                  Procesando...
                </>
              ) : (
                <>
                  <DollarSign className="mr-2 h-4 w-4" />
                  Invertir Ahora
                </>
              )}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}