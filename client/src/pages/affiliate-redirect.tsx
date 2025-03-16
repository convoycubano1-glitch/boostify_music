import React, { useEffect, useState } from "react";
import axios from "axios";
import { ProgressCircular } from "../components/ui/progress-circular";
import { 
  AlertTriangle, 
  ArrowRight, 
  ExternalLink, 
  Link, 
  LinkIcon, 
  LucideIcon,
} from "lucide-react";
import { useLocation, useRoute } from "wouter";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "../components/ui/alert";
import { Separator } from "../components/ui/separator";

/**
 * Página de redirección para enlaces de afiliados
 * 
 * Esta página se muestra cuando alguien hace clic en un enlace de afiliado.
 * Registra el clic en la base de datos y luego redirige a la URL final.
 */
export default function AffiliateRedirect() {
  const [, setLocation] = useLocation();
  const [match, params] = useRoute<{ linkId: string }>("/api/affiliate/track/:linkId");
  const [redirectData, setRedirectData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(5);
  
  // Obtener información del enlace y registrar el clic
  useEffect(() => {
    if (!match || !params?.linkId) {
      setError("Enlace no válido o no encontrado.");
      return;
    }
    
    const fetchLinkData = async () => {
      try {
        // Registrar el clic y obtener información del enlace
        const response = await axios.get(`/api/affiliate/track/${params.linkId}`);
        setRedirectData(response.data);
      } catch (error: any) {
        console.error("Error tracking affiliate link:", error);
        setError(error.response?.data?.message || "No se pudo procesar el enlace. Por favor, inténtalo de nuevo.");
      }
    };
    
    fetchLinkData();
  }, [match, params?.linkId]);
  
  // Iniciar temporizador para redirección automática
  useEffect(() => {
    if (!redirectData || !redirectData.targetUrl) return;
    
    const timer = setInterval(() => {
      setTimeLeft((prevTime) => {
        if (prevTime <= 1) {
          clearInterval(timer);
          // Redirigir a la URL destino
          window.location.href = redirectData.targetUrl;
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);
    
    // Limpiar el temporizador si el componente se desmonta
    return () => clearInterval(timer);
  }, [redirectData]);
  
  // Si hay un error, mostrar mensaje de error
  if (error) {
    return (
      <div className="container max-w-md mx-auto py-10 px-4">
        <Card className="border-destructive/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Error en el enlace
            </CardTitle>
            <CardDescription>
              No pudimos procesar este enlace de afiliado
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            
            <div className="mt-4 text-sm text-muted-foreground">
              <p>Posibles razones:</p>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>El enlace puede haber expirado</li>
                <li>El enlace puede haber sido desactivado</li>
                <li>El ID del enlace es incorrecto</li>
              </ul>
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              className="w-full gap-1" 
              onClick={() => setLocation("/")}
            >
              Volver al inicio
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }
  
  // Si está cargando, mostrar indicador de carga
  if (!redirectData) {
    return (
      <div className="container max-w-md mx-auto py-10 px-4">
        <Card>
          <CardHeader>
            <CardTitle>Procesando enlace</CardTitle>
            <CardDescription>
              Estamos procesando tu solicitud
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center py-6">
            <ProgressCircular size="lg" />
            <p className="mt-4 text-muted-foreground text-center">
              Validando el enlace de afiliado...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  // Mostrar página de redirección
  return (
    <div className="container max-w-md mx-auto py-10 px-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <LinkIcon className="h-5 w-5 text-primary" />
              Enlace verificado
            </CardTitle>
            
            {redirectData.affiliateName && (
              <div className="text-xs text-muted-foreground">
                Afiliado: {redirectData.affiliateName}
              </div>
            )}
          </div>
          <CardDescription>
            Estás siendo redirigido a:
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="border rounded-md p-3 bg-muted/30 flex items-center gap-2 overflow-hidden">
            <Link className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
            <span className="text-sm font-medium truncate" title={redirectData.targetUrl}>
              {redirectData.targetUrl}
            </span>
          </div>
          
          {redirectData.productName && (
            <div className="flex flex-col gap-1">
              <h3 className="text-sm font-medium">Producto:</h3>
              <div className="text-sm">{redirectData.productName}</div>
            </div>
          )}
          
          <div className="rounded-md border p-4 text-center">
            <div className="text-2xl font-bold">{timeLeft}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Serás redirigido automáticamente en {timeLeft} segundo{timeLeft !== 1 ? 's' : ''}
            </p>
          </div>
          
          <Separator />
          
          <div className="flex flex-col gap-1 text-center text-xs text-muted-foreground">
            <p>
              Este enlace ha sido compartido por uno de nuestros afiliados. 
              Al continuar, aceptas los términos y condiciones del programa de afiliados.
            </p>
            <p>
              Tu actividad se registrará para la atribución de comisiones.
            </p>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-2">
          <Button 
            className="w-full gap-1" 
            onClick={() => window.location.href = redirectData.targetUrl}
          >
            Continuar ahora
            <ArrowRight className="h-4 w-4" />
          </Button>
          
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full gap-1 text-xs" 
            onClick={() => setLocation("/")}
          >
            Cancelar y volver
          </Button>
        </CardFooter>
      </Card>
      
      <div className="mt-4 flex justify-center">
        <Button 
          variant="link" 
          size="sm" 
          className="text-xs text-muted-foreground"
          onClick={() => setLocation("/affiliates")}
        >
          Convertirse en afiliado
        </Button>
      </div>
    </div>
  );
}