import React, { useEffect, useState } from "react";
import { useRoute } from "wouter";
import { ProgressCircular } from "../components/ui/progress-circular";
import { Card, CardContent } from "../components/ui/card";
import axios from "axios";
import { ExternalLink } from "lucide-react";

export default function AffiliateRedirect() {
  // Extract link ID from URL
  const [, params] = useRoute("/affiliate/link/:linkId");
  const linkId = params?.linkId;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [destination, setDestination] = useState<string | null>(null);
  const [productName, setProductName] = useState<string | null>(null);
  const [countdownValue, setCountdownValue] = useState(3);

  useEffect(() => {
    const trackLinkClick = async () => {
      if (!linkId) {
        setError("Enlace no válido");
        setLoading(false);
        return;
      }

      try {
        // Track the click and get the destination URL
        const response = await axios.get(`/api/affiliate/track/${linkId}`);
        
        if (response.data.success) {
          setDestination(response.data.destination);
          setProductName(response.data.productName || "nuestro producto");
          
          // Start countdown
          const countdownInterval = setInterval(() => {
            setCountdownValue((prev) => {
              if (prev <= 1) {
                clearInterval(countdownInterval);
                // Redirect after countdown
                window.location.href = response.data.destination;
                return 0;
              }
              return prev - 1;
            });
          }, 1000);
          
          // Cleanup interval
          return () => clearInterval(countdownInterval);
        } else {
          setError(response.data.message || "No se pudo encontrar el destino del enlace");
        }
      } catch (err) {
        console.error("Error tracking link click:", err);
        setError("Error al procesar tu enlace. Por favor intenta nuevamente.");
      } finally {
        setLoading(false);
      }
    };

    trackLinkClick();
  }, [linkId]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <ProgressCircular 
            className="mx-auto" 
            size="lg" 
            variant="default" 
          />
          <h2 className="mt-4 text-xl font-semibold">Procesando tu enlace...</h2>
          <p className="mt-2 text-muted-foreground">
            Serás redirigido automáticamente en unos segundos.
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
              <span className="text-red-600 text-xl">×</span>
            </div>
            <h2 className="mt-4 text-xl font-semibold">Enlace no válido</h2>
            <p className="mt-2 text-muted-foreground">
              {error}
            </p>
            <div className="mt-6">
              <a href="/" className="text-primary hover:underline">
                Volver a la página principal
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <Card className="max-w-md w-full">
        <CardContent className="pt-6 text-center">
          <div className="mx-auto w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
            <ProgressCircular 
              value={(3 - countdownValue) * 33.33} 
              size="default" 
              variant="default" 
              showValue={false}
            />
            <span className="absolute text-lg font-medium">{countdownValue}</span>
          </div>
          
          <h2 className="mt-4 text-xl font-semibold">Redirigiendo...</h2>
          <p className="mt-2 text-muted-foreground">
            Estás siendo redirigido a {productName}.
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Si no eres redirigido automáticamente, haz clic en el botón:
          </p>
          
          <div className="mt-6">
            <a 
              href={destination || "#"} 
              className="inline-flex items-center gap-1 text-primary hover:underline"
            >
              Continuar <ExternalLink className="h-4 w-4" />
            </a>
          </div>
          
          <p className="mt-8 text-xs text-muted-foreground">
            Este enlace fue compartido a través de nuestro programa de afiliados.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}