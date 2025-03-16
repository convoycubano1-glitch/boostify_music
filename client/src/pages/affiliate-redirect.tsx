import React, { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { ProgressCircular } from "../components/ui/progress-circular";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "../components/ui/alert";
import { Button } from "../components/ui/button";
import { useToast } from "../hooks/use-toast";
import { ExclamationTriangleIcon, InfoIcon, LinkIcon, ShoppingCart } from "lucide-react";

export default function AffiliateRedirectPage() {
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  const [countdown, setCountdown] = useState(5);
  const [redirectComplete, setRedirectComplete] = useState(false);
  
  // Obtener parámetros de la URL
  const urlParams = new URLSearchParams(window.location.search);
  const linkId = urlParams.get("ref");
  
  // Obtener información del enlace y registrar el clic
  const { 
    data: linkInfo, 
    isLoading, 
    isError, 
    error 
  } = useQuery({
    queryKey: ["affiliate", "trackLink", linkId],
    queryFn: async () => {
      try {
        if (!linkId) {
          throw new Error("ID de enlace no especificado");
        }
        const response = await axios.get(`/api/affiliate/track/${linkId}`);
        return response.data;
      } catch (error: any) {
        console.error("Error fetching link info:", error);
        throw error;
      }
    },
    enabled: !!linkId,
    retry: 1,
    staleTime: 0, // No cachear este resultado
  });
  
  // Temporizador de redirección automática
  useEffect(() => {
    if (linkInfo && !redirectComplete) {
      // Iniciar temporizador de redirección
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            // Redirigir al usuario
            window.location.href = linkInfo.productUrl;
            setRedirectComplete(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
      return () => {
        clearInterval(timer);
      };
    }
  }, [linkInfo, redirectComplete]);
  
  // Manejar redirección manual
  const handleRedirect = () => {
    if (linkInfo) {
      setRedirectComplete(true);
      window.location.href = linkInfo.productUrl;
      
      toast({
        title: "Redirigiendo...",
        description: "Te estamos llevando al destino",
      });
    }
  };
  
  // Si está cargando
  if (isLoading) {
    return (
      <div className="container max-w-md mx-auto my-12 p-4">
        <Card>
          <CardContent className="pt-6 flex flex-col items-center justify-center min-h-[200px]">
            <ProgressCircular size="lg" className="mb-4" />
            <h2 className="text-xl font-semibold mb-2">Preparando tu redirección</h2>
            <p className="text-center text-muted-foreground">
              Estamos procesando tu enlace de afiliado...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  // Si hay un error
  if (isError || !linkId) {
    return (
      <div className="container max-w-md mx-auto my-12 p-4">
        <Card className="border-destructive">
          <CardHeader>
            <div className="flex items-center gap-2">
              <ExclamationTriangleIcon className="h-5 w-5 text-destructive" />
              <CardTitle>Enlace no válido</CardTitle>
            </div>
            <CardDescription>
              No pudimos encontrar la información del enlace solicitado
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive" className="mb-4">
              <AlertTitle className="flex items-center">
                <InfoIcon className="h-4 w-4 mr-2" />
                Error en la redirección
              </AlertTitle>
              <AlertDescription>
                {error instanceof Error 
                  ? error.message 
                  : "El enlace que intentas acceder no es válido o ha expirado"}
              </AlertDescription>
            </Alert>
            <p className="text-sm text-muted-foreground mb-4">
              Puedes intentar lo siguiente:
            </p>
            <ul className="text-sm text-muted-foreground list-disc pl-5 space-y-1 mb-4">
              <li>Verificar que la URL sea correcta</li>
              <li>Contactar a la persona que te compartió el enlace</li>
              <li>Volver a la página principal</li>
            </ul>
          </CardContent>
          <CardFooter>
            <Button 
              variant="default" 
              className="w-full"
              onClick={() => navigate("/")}
            >
              Ir a la página principal
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }
  
  // Redirección exitosa
  return (
    <div className="container max-w-md mx-auto my-12 p-4">
      <Card className="overflow-hidden">
        <div className="h-2 bg-gradient-to-r from-green-500 to-emerald-600"></div>
        <CardHeader>
          <div className="flex items-center gap-2">
            <LinkIcon className="h-5 w-5 text-primary" />
            <CardTitle>Enlace de afiliado</CardTitle>
          </div>
          <CardDescription>
            Enlace verificado correctamente
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted/50 rounded-lg p-4 flex items-center gap-3 border">
            <div className="rounded-full bg-primary/10 p-2">
              <ShoppingCart className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-medium">
                {linkInfo?.productName || "Producto"}
              </h3>
              <p className="text-xs text-muted-foreground truncate max-w-[250px]">
                {linkInfo?.productUrl}
              </p>
            </div>
          </div>
          
          <p className="text-sm">
            Serás redirigido automáticamente en <span className="font-semibold">{countdown} segundos</span>.
          </p>
        </CardContent>
        <CardFooter>
          <Button
            className="w-full" 
            onClick={handleRedirect}
            disabled={redirectComplete}
          >
            Ir ahora
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}