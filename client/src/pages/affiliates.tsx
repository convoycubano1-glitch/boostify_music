import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "../components/ui/card";
import { 
  AlertTriangle, 
  BadgeCheck, 
  ChevronRight, 
  LinkIcon, 
  LineChart, 
  Share, 
  Info,
  Users,
  BarChart3
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "../components/ui/alert";
import { Badge } from "../components/ui/badge";
import { ProgressCircular } from "../components/ui/progress-circular";
import { AffiliateOverview } from "../components/affiliates/overview";
import { AffiliateLinks } from "../components/affiliates/links";
import { Separator } from "../components/ui/separator";
import { useNavigate } from "wouter";

/**
 * Página principal del programa de afiliados
 * 
 * Esta página permite:
 * 1. Registrarse como afiliado
 * 2. Ver estadísticas y ganancias
 * 3. Administrar enlaces de afiliado
 * 4. Acceder a recursos y materiales promocionales
 */
export default function AffiliatePage() {
  const [activeTab, setActiveTab] = useState("overview");
  const [, navigate] = useNavigate();
  
  // Verificar si el usuario está registrado como afiliado
  const {
    data: affiliateData,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["affiliate", "me"],
    queryFn: async () => {
      try {
        const response = await axios.get("/api/affiliate/me");
        return response.data;
      } catch (error) {
        // Si el error es 404, el usuario no está registrado como afiliado
        if (axios.isAxiosError(error) && error.response?.status === 404) {
          return { registered: false };
        }
        console.error("Error fetching affiliate data:", error);
        throw error;
      }
    },
  });
  
  // Si está cargando, mostrar indicador de carga
  if (isLoading) {
    return (
      <div className="container max-w-6xl mx-auto py-12 px-4">
        <div className="flex flex-col items-center justify-center py-12">
          <ProgressCircular size="lg" />
          <p className="mt-4 text-muted-foreground">Cargando información de afiliado...</p>
        </div>
      </div>
    );
  }
  
  // Si hay un error, mostrar mensaje de error
  if (isError) {
    return (
      <div className="container max-w-6xl mx-auto py-12 px-4">
        <Alert variant="destructive" className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            No pudimos cargar la información de afiliado. Por favor, intenta de nuevo más tarde.
            <Button onClick={() => refetch()} className="mt-2" variant="outline" size="sm">
              Reintentar
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }
  
  // Si el usuario no está registrado como afiliado, mostrar página de registro
  if (!affiliateData?.registered) {
    return <AffiliateRegistration onRegistered={refetch} />;
  }
  
  return (
    <div className="container max-w-6xl mx-auto py-8 px-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Programa de Afiliados</h1>
          <p className="text-muted-foreground mt-1">
            Gestiona tus enlaces, revisa tus estadísticas y aumenta tus ganancias
          </p>
        </div>
        
        <div className="flex gap-2">
          <Badge variant="outline" className="gap-1 py-1 px-2 border-green-600/40 bg-green-600/10 text-green-700">
            <BadgeCheck className="h-3.5 w-3.5" />
            Afiliado Activo
          </Badge>
          
          {affiliateData?.level && (
            <Badge variant="outline" className="gap-1 py-1 px-2 border-blue-600/40 bg-blue-600/10 text-blue-700">
              {affiliateData.level === "pro" ? "Nivel Pro" : 
               affiliateData.level === "elite" ? "Nivel Elite" : 
               "Nivel Básico"}
            </Badge>
          )}
        </div>
      </div>
      
      <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 md:inline-flex md:w-auto">
          <TabsTrigger value="overview">Vista General</TabsTrigger>
          <TabsTrigger value="links">Enlaces</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          <AffiliateOverview />
        </TabsContent>
        
        <TabsContent value="links" className="space-y-4">
          <AffiliateLinks />
        </TabsContent>
      </Tabs>
    </div>
  );
}

interface RegistrationProps {
  onRegistered: () => void;
}

function AffiliateRegistration({ onRegistered }: RegistrationProps) {
  const [isRegistering, setIsRegistering] = useState(false);
  
  // Manejar registro como afiliado
  const handleRegister = async () => {
    try {
      setIsRegistering(true);
      await axios.post("/api/affiliate/register");
      onRegistered(); // Recargar datos después del registro
    } catch (error) {
      console.error("Error registering as affiliate:", error);
      setIsRegistering(false);
    }
  };
  
  return (
    <div className="container max-w-6xl mx-auto py-12 px-4">
      <div className="flex flex-col md:flex-row items-start gap-6 md:gap-12">
        <div className="flex-1 space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Programa de Afiliados</h1>
            <p className="text-muted-foreground mt-2">
              Gana comisiones promocionando productos y servicios para artistas y creadores musicales.
            </p>
          </div>
          
          <Alert className="bg-muted/50 border-primary/20">
            <Info className="h-4 w-4" />
            <AlertTitle>Todavía no eres afiliado</AlertTitle>
            <AlertDescription>
              Únete a nuestro programa de afiliados para empezar a promocionar productos y ganar comisiones.
            </AlertDescription>
          </Alert>
          
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle>¿Por qué unirse?</CardTitle>
              <CardDescription>Beneficios del programa de afiliados</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <BenefitCard 
                  icon={BarChart3}
                  title="15% de comisión"
                  description="Obtén hasta el 15% de comisión por cada venta generada a través de tus enlaces"
                />
                
                <BenefitCard 
                  icon={Users}
                  title="Sin límite de referidos"
                  description="Promociona a tantas personas como quieras sin restricciones"
                />
                
                <BenefitCard 
                  icon={LineChart}
                  title="Analíticas en tiempo real"
                  description="Rastrea clics, conversiones y ganancias con estadísticas detalladas"
                />
                
                <BenefitCard 
                  icon={LinkIcon}
                  title="Enlaces personalizados"
                  description="Crea enlaces de seguimiento para cualquier producto o servicio"
                />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Cómo funciona</CardTitle>
              <CardDescription>El proceso es simple</CardDescription>
            </CardHeader>
            <CardContent className="pb-0">
              <ol className="space-y-4">
                <li className="p-4 rounded-lg border">
                  <div className="flex gap-4">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium">
                      1
                    </div>
                    <div>
                      <h3 className="font-medium">Regístrate como afiliado</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        Completa un simple registro para activar tu cuenta de afiliado
                      </p>
                    </div>
                  </div>
                </li>
                
                <li className="p-4 rounded-lg border">
                  <div className="flex gap-4">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium">
                      2
                    </div>
                    <div>
                      <h3 className="font-medium">Crea enlaces personalizados</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        Genera enlaces únicos para productos y servicios que quieras promocionar
                      </p>
                    </div>
                  </div>
                </li>
                
                <li className="p-4 rounded-lg border">
                  <div className="flex gap-4">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium">
                      3
                    </div>
                    <div>
                      <h3 className="font-medium">Comparte con tu audiencia</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        Promociona los enlaces en redes sociales, sitios web, correos electrónicos o cualquier canal
                      </p>
                    </div>
                  </div>
                </li>
                
                <li className="p-4 rounded-lg border">
                  <div className="flex gap-4">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium">
                      4
                    </div>
                    <div>
                      <h3 className="font-medium">Recibe comisiones</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        Gana una comisión por cada compra realizada a través de tus enlaces
                      </p>
                    </div>
                  </div>
                </li>
              </ol>
            </CardContent>
          </Card>
        </div>
        
        <div className="md:w-80 lg:w-96 space-y-6">
          <Card className="border-primary/20">
            <CardHeader className="pb-2">
              <CardTitle>Únete hoy mismo</CardTitle>
              <CardDescription>
                Regístrate ahora y comienza a ganar comisiones
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center">
                    <BadgeCheck className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <span className="text-sm">Registro gratuito</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center">
                    <BadgeCheck className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <span className="text-sm">Comisiones hasta del 15%</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center">
                    <BadgeCheck className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <span className="text-sm">Pagos mensuales</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center">
                    <BadgeCheck className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <span className="text-sm">Sin requisitos mínimos</span>
                </div>
              </div>
              
              <Separator className="my-2" />
              
              <div className="bg-muted/30 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <Share className="h-4 w-4 text-primary" />
                  <p className="font-medium text-sm">Programa recomendado</p>
                </div>
                <p className="text-xs text-muted-foreground">
                  Más de 1,000 afiliados ya están ganando con nosotros. ¡Únete ahora!
                </p>
              </div>
            </CardContent>
            <CardContent className="pt-0">
              <Button 
                className="w-full gap-1" 
                size="lg" 
                onClick={handleRegister}
                disabled={isRegistering}
              >
                {isRegistering ? (
                  <>
                    <ProgressCircular className="mr-1" size="sm" />
                    Procesando...
                  </>
                ) : (
                  <>
                    Registrarme como afiliado
                    <ChevronRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Términos y condiciones</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li>Las comisiones se acumulan cuando una compra es completada exitosamente</li>
                <li>El pago mínimo es de 50€ para recibir un desembolso</li>
                <li>Los pagos se procesan el día 15 de cada mes</li>
                <li>Las comisiones por ventas se acreditan después de 30 días para permitir reembolsos</li>
              </ul>
              <Button 
                variant="link" 
                className="p-0 h-auto mt-2 text-xs" 
                onClick={() => window.open('/terms', '_blank')}
              >
                Ver términos completos
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

interface BenefitCardProps {
  icon: React.ElementType;
  title: string;
  description: string;
}

function BenefitCard({ icon: Icon, title, description }: BenefitCardProps) {
  return (
    <div className="bg-muted/20 p-4 rounded-lg">
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-md bg-primary/10">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h3 className="font-medium">{title}</h3>
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        </div>
      </div>
    </div>
  );
}