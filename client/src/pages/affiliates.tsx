import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { ArrowRight, Award, BarChart, Gift, Globe, LinkIcon, Sparkles, Users } from "lucide-react";
import { Separator } from "../components/ui/separator";
import { AffiliateOverview } from "../components/affiliates/overview";
import { AffiliateLinks } from "../components/affiliates/links";

/**
 * Página principal del programa de afiliados
 * Muestra información sobre el programa y permite registrarse/administrar enlaces
 */
export default function AffiliatePage() {
  const [activeTab, setActiveTab] = useState("overview");

  // Consultar datos del afiliado
  const {
    data: affiliateData,
    isLoading,
    isError,
    error,
    refetch
  } = useQuery({
    queryKey: ["affiliate", "me"],
    queryFn: async () => {
      try {
        const response = await axios.get("/api/affiliate/me");
        return response.data;
      } catch (error: any) {
        if (error?.response?.status === 404) {
          // No es un afiliado todavía, retornar null
          return null;
        }
        throw error;
      }
    },
    refetchOnWindowFocus: false,
  });

  // Determinar si el usuario ya es un afiliado registrado
  const isAffiliate = affiliateData && affiliateData.id;
  
  // Si está cargando, mostrar pantalla de carga
  if (isLoading) {
    return (
      <div className="container py-12">
        <div className="flex flex-col items-center justify-center min-h-[40vh]">
          <div className="animate-pulse rounded-full h-12 w-12 bg-primary/20 flex items-center justify-center">
            <LinkIcon className="h-6 w-6 text-primary/40" />
          </div>
          <h1 className="mt-4 text-2xl font-bold">Cargando programa de afiliados...</h1>
        </div>
      </div>
    );
  }

  // Si el usuario no es afiliado, mostrar pantalla de registro
  if (!isAffiliate) {
    return <AffiliateRegistrationView onRegisterSuccess={refetch} />;
  }

  // Si es afiliado, mostrar panel de control
  return (
    <div className="container py-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold">Panel de Afiliado</h1>
          <p className="text-muted-foreground mt-2">
            Administra tus enlaces, estadísticas y comisiones como afiliado
          </p>
        </div>
        
        <Button variant="outline" className="md:w-auto w-full gap-2">
          <Globe className="h-4 w-4" />
          Ver guía de afiliados
        </Button>
      </div>
      
      <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid grid-cols-3 md:w-[400px]">
          <TabsTrigger value="overview">Resumen</TabsTrigger>
          <TabsTrigger value="links">Enlaces</TabsTrigger>
          <TabsTrigger value="payouts">Pagos</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-6">
          <AffiliateOverview affiliateData={affiliateData} />
        </TabsContent>
        
        <TabsContent value="links" className="space-y-6">
          <AffiliateLinks affiliateData={affiliateData} />
        </TabsContent>
        
        <TabsContent value="payouts" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Historial de pagos</CardTitle>
              <CardDescription>
                Revisa tus comisiones y pagos recibidos como afiliado
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border p-8 flex flex-col items-center justify-center text-center">
                <Gift className="h-12 w-12 text-muted-foreground/70 mb-4" />
                <h3 className="text-xl font-semibold mb-2">Aún no hay pagos disponibles</h3>
                <p className="text-muted-foreground max-w-md">
                  Los pagos se generan el día 15 de cada mes. Comienza promocionando tus enlaces para generar comisiones.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

/**
 * Componente para el registro de nuevos afiliados
 */
function AffiliateRegistrationView({ onRegisterSuccess }: { onRegisterSuccess: () => void }) {
  const [isRegistering, setIsRegistering] = useState(false);
  
  // Función para registrarse como afiliado
  const handleRegister = async () => {
    try {
      setIsRegistering(true);
      
      // Enviar solicitud de registro
      const response = await axios.post("/api/affiliate/register", {
        acceptsTerms: true,
        paymentMethod: "transferencia",
      });
      
      // Si es exitoso, actualizar datos
      if (response.data) {
        onRegisterSuccess();
      }
    } catch (error) {
      console.error("Error al registrarse como afiliado:", error);
    } finally {
      setIsRegistering(false);
    }
  };
  
  return (
    <div className="container py-10">
      <div className="max-w-5xl mx-auto">
        {/* Cabecera */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center p-2 bg-primary/10 rounded-full mb-4">
            <Award className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-4xl font-bold mb-4">Programa de Afiliados</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Gana comisiones por cada compra realizada a través de tus enlaces de afiliado
          </p>
        </div>
        
        {/* Beneficios */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center">
                <div className="h-12 w-12 rounded-full flex items-center justify-center bg-primary/10 mb-4">
                  <BarChart className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Comisiones atractivas</h3>
                <p className="text-muted-foreground">
                  Gana hasta un 30% por cada venta realizada a través de tus enlaces
                </p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center">
                <div className="h-12 w-12 rounded-full flex items-center justify-center bg-primary/10 mb-4">
                  <Globe className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Herramientas de promoción</h3>
                <p className="text-muted-foreground">
                  Acceso a materiales promocionales y enlaces personalizados
                </p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center">
                <div className="h-12 w-12 rounded-full flex items-center justify-center bg-primary/10 mb-4">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Soporte dedicado</h3>
                <p className="text-muted-foreground">
                  Equipo de soporte para maximizar tus resultados
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Niveles y comisiones */}
        <Card className="mb-12">
          <CardHeader>
            <CardTitle>Niveles y comisiones</CardTitle>
            <CardDescription>Aumenta tus ganancias a medida que generas más ventas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="border rounded-lg p-6 relative">
                <div className="text-sm font-medium text-muted-foreground mb-1">Nivel Básico</div>
                <div className="text-2xl font-bold mb-2">15%</div>
                <p className="text-sm text-muted-foreground mb-4">
                  Comisión por cada venta
                </p>
                <Separator className="my-4" />
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 flex-shrink-0 mt-1">✓</span>
                    <span>Acceso al dashboard básico</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 flex-shrink-0 mt-1">✓</span>
                    <span>Materiales promocionales</span>
                  </li>
                </ul>
              </div>
              
              <div className="border rounded-lg p-6 relative bg-primary/5 border-primary/20 shadow-sm">
                <div className="absolute top-0 right-0 transform translate-x-1/4 -translate-y-1/3">
                  <div className="bg-primary px-3 py-1 rounded-full text-xs font-semibold text-primary-foreground">
                    Popular
                  </div>
                </div>
                <div className="text-sm font-medium text-muted-foreground mb-1">Nivel Pro</div>
                <div className="text-2xl font-bold mb-2">25%</div>
                <p className="text-sm text-muted-foreground mb-4">
                  Desde 10 ventas al mes
                </p>
                <Separator className="my-4" />
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 flex-shrink-0 mt-1">✓</span>
                    <span>Todos los beneficios del nivel básico</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 flex-shrink-0 mt-1">✓</span>
                    <span>Enlaces personalizados</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 flex-shrink-0 mt-1">✓</span>
                    <span>Estadísticas avanzadas</span>
                  </li>
                </ul>
              </div>
              
              <div className="border rounded-lg p-6 relative">
                <div className="text-sm font-medium text-muted-foreground mb-1">Nivel Elite</div>
                <div className="text-2xl font-bold mb-2">30%</div>
                <p className="text-sm text-muted-foreground mb-4">
                  Desde 25 ventas al mes
                </p>
                <Separator className="my-4" />
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 flex-shrink-0 mt-1">✓</span>
                    <span>Todos los beneficios del nivel Pro</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 flex-shrink-0 mt-1">✓</span>
                    <span>Acceso anticipado a productos</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 flex-shrink-0 mt-1">✓</span>
                    <span>Soporte prioritario</span>
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* CTA */}
        <Card>
          <CardContent className="pt-6 pb-8">
            <div className="max-w-xl mx-auto text-center">
              <Sparkles className="h-12 w-12 mx-auto mb-4 text-primary" />
              <h2 className="text-2xl font-bold mb-3">¿Estás listo para empezar a ganar?</h2>
              <p className="text-muted-foreground mb-6">
                Únete a nuestro programa de afiliados y comienza a promocionar nuestros productos para ganar comisiones atractivas.
              </p>
              <Button 
                size="lg" 
                className="gap-2"
                onClick={handleRegister}
                disabled={isRegistering}
              >
                {isRegistering ? (
                  "Registrando..."
                ) : (
                  <>
                    Registrarme como afiliado
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
              
              <p className="text-xs text-muted-foreground mt-4">
                Al registrarte, aceptas los términos y condiciones del programa de afiliados.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}