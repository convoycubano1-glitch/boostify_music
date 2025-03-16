import { useEffect, useState } from "react";
import { useParams, useLocation } from "wouter";
import { CircularProgress } from "../components/ui/progress-circular";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { ExternalLink, ArrowRight } from "lucide-react";
import { db } from "../lib/firebase";
import { getDoc, doc, updateDoc, increment, addDoc, collection, serverTimestamp } from "firebase/firestore";

export default function AffiliateRedirect() {
  const [linkId] = useParams();
  const [, navigate] = useLocation();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [linkData, setLinkData] = useState<any | null>(null);
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    const fetchLinkData = async () => {
      try {
        if (!linkId) {
          throw new Error("ID del enlace no proporcionado");
        }

        const linkRef = doc(db, "affiliateLinks", linkId);
        const linkDoc = await getDoc(linkRef);

        if (!linkDoc.exists()) {
          throw new Error("Enlace no encontrado");
        }

        const data = linkDoc.data();
        setLinkData(data);

        // Registrar el clic
        await updateDoc(linkRef, {
          clicks: increment(1)
        });

        // Registrar la analítica del clic
        await addDoc(collection(db, "affiliateClicks"), {
          linkId,
          affiliateId: data.affiliateId,
          productId: data.productId,
          timestamp: serverTimestamp()
        });

        // Actualizar el total de clics en el afiliado
        const affiliateRef = doc(db, "affiliates", data.affiliateId);
        await updateDoc(affiliateRef, {
          "stats.totalClicks": increment(1)
        });

        // Iniciar cuenta regresiva para redirección
        const timer = setInterval(() => {
          setCountdown((prev) => {
            if (prev <= 1) {
              clearInterval(timer);
              redirectToTarget(data);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);

        return () => clearInterval(timer);
      } catch (error: any) {
        console.error("Error al obtener datos del enlace:", error);
        setError(error.message || "Error al procesar el enlace");
      } finally {
        setIsLoading(false);
      }
    };

    fetchLinkData();
  }, [linkId, navigate]);

  const redirectToTarget = (data: any) => {
    if (!data || !data.productUrl) return;

    // Construir la URL de redirección con parámetros UTM
    const redirectUrl = new URL(data.productUrl);

    // Añadir parámetros UTM
    if (data.utmParams) {
      if (data.utmParams.source) {
        redirectUrl.searchParams.append('utm_source', data.utmParams.source);
      }
      if (data.utmParams.medium) {
        redirectUrl.searchParams.append('utm_medium', data.utmParams.medium);
      }
      if (data.utmParams.campaign) {
        redirectUrl.searchParams.append('utm_campaign', data.utmParams.campaign);
      }
    }

    // Añadir identificadores de afiliado
    redirectUrl.searchParams.append('aff_id', data.affiliateId);
    redirectUrl.searchParams.append('aff_link', linkId || '');

    // Redireccionar al usuario
    window.location.href = redirectUrl.toString();
  };

  const handleManualRedirect = () => {
    if (linkData) {
      redirectToTarget(linkData);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <CircularProgress className="h-12 w-12 mb-4" />
          <p className="text-muted-foreground">Procesando enlace de afiliado...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle>Error en el enlace</CardTitle>
            <CardDescription>No pudimos procesar el enlace solicitado</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-destructive">{error}</p>
          </CardContent>
          <CardFooter>
            <Button variant="outline" onClick={() => navigate("/")}>
              Volver al inicio
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-primary/5 to-background">
      <Card className="max-w-md w-full shadow-lg border-primary/10">
        <CardHeader className="pb-4">
          <CardTitle>Redireccionando</CardTitle>
          <CardDescription>
            Estás siendo redirigido a {linkData?.productName || "el sitio destino"}
          </CardDescription>
        </CardHeader>
        <CardContent className="pb-4">
          <div className="flex items-center justify-center py-8">
            <div className="relative">
              <CircularProgress value={countdown * 20} className="h-24 w-24" />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl font-bold">{countdown}</span>
              </div>
            </div>
          </div>
          <p className="text-sm text-muted-foreground text-center">
            Serás redireccionado automáticamente en {countdown} segundos
          </p>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={() => navigate("/")}>
            Cancelar
          </Button>
          <Button onClick={handleManualRedirect} className="gap-2">
            Ir ahora <ArrowRight className="h-4 w-4" />
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}