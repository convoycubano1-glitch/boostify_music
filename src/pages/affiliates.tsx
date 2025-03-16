import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/layout/header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AffiliateOverview } from "@/components/affiliates/overview";
import { AffiliateRegistration } from "@/components/affiliates/registration";
import { AffiliateLinks } from "@/components/affiliates/links";
import { AffiliateEarnings } from "@/components/affiliates/earnings";
import { AffiliateContentGenerator } from "@/components/affiliates/content-generator";
import { AffiliateResources } from "@/components/affiliates/resources";
import { AffiliateSupport } from "@/components/affiliates/affiliate-support";
import { useAuth } from "@/hooks/use-auth";
import { db, auth } from "@/lib/firebase";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  CircleCheck, 
  GraduationCap, 
  LineChart, 
  Rocket, 
  Stars, 
  Sparkles, 
  Award, 
  Users, 
  DollarSign, 
  Link, 
  FileText, 
  LifeBuoy, 
  Settings2,
  Mail,
  Video,
  AlertCircle,
  Zap,
  Crown,
  Headphones as HeadphonesIcon
} from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

// Define AffiliateData type
type AffiliateDataType = {
  id: string;
  level?: string;
  stats?: {
    totalClicks?: number;
    totalSales?: number;
    totalCommission?: number;
  };
  // Add other properties as needed
};

export default function AffiliatesPage() {
  const { user } = useAuth() || {};
  const [activeTab, setActiveTab] = useState("overview");

  // Query to check if the current user is an affiliate
  const { data: affiliateData, isLoading: isLoadingAffiliateData } = useQuery<AffiliateDataType | null>({
    queryKey: ["affiliate", user?.uid],
    queryFn: async () => {
      if (!user?.uid) return null;
      
      const affiliateRef = doc(db, "affiliates", user.uid);
      const affiliateDoc = await getDoc(affiliateRef);
      
      if (affiliateDoc.exists()) {
        return { ...affiliateDoc.data(), id: affiliateDoc.id } as AffiliateDataType;
      }
      
      return null;
    },
    enabled: !!user?.uid,
  });

  // Determine if we should show the registration form or the affiliate dashboard
  // Para desarrollo, un valor para testing
  const isAffiliate = affiliateData !== null && affiliateData !== undefined;
  
  // Datos de afiliado de prueba para el modo de desarrollo
  const mockAffiliateData = {
    id: user?.uid || "mock-user-123",
    level: "Premium",
    name: user?.displayName || "Usuario de Prueba",
    stats: {
      totalClicks: 3254,
      conversions: 187,
      earnings: 1256.75,
      pendingPayment: 342.50
    },
    links: [
      { id: "link1", name: "Enlace de promoción 1", url: "https://example.com/aff/1", clicks: 856, conversions: 45 },
      { id: "link2", name: "Enlace de promoción 2", url: "https://example.com/aff/2", clicks: 542, conversions: 32 }
    ],
    paymentHistory: [
      { id: "pay1", date: new Date(), amount: 287.75, status: "completed" },
      { id: "pay2", date: new Date(), amount: 203.25, status: "completed" }
    ],
    savedContent: []
  };

  // Benefits of the affiliate program
  const benefits = [
    {
      icon: <DollarSign className="h-8 w-8 text-primary" />,
      title: "Competitive Commissions",
      description: "Earn up to 30% commission on every sale made through your unique affiliate links"
    },
    {
      icon: <Rocket className="h-8 w-8 text-primary" />,
      title: "Instant Access",
      description: "Start promoting immediately with ready-to-use marketing resources and tools"
    },
    {
      icon: <Stars className="h-8 w-8 text-primary" />,
      title: "Premium Content",
      description: "Access exclusive content and promotional materials designed to boost conversions"
    },
    {
      icon: <Users className="h-8 w-8 text-primary" />,
      title: "Dedicated Support",
      description: "Get personalized assistance from our affiliate team to maximize your earnings"
    }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        {!isAffiliate ? (
          <>
            <div className="relative overflow-hidden rounded-lg bg-gradient-to-r from-primary/20 via-primary/10 to-background mb-8 p-8 border border-primary/10 shadow-sm">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                <div className="space-y-6">
                  <Badge className="bg-primary/20 text-primary hover:bg-primary/30 transition-colors py-2 px-4 text-base">
                    Ahora Disponible
                  </Badge>
                  <h1 className="text-3xl md:text-4xl font-bold tracking-tight leading-tight">Amplifica tus Ingresos con el Programa de Afiliados Boostify</h1>
                  <p className="text-muted-foreground text-base md:text-lg">
                    Únete a nuestra comunidad de afiliados de alto rendimiento y gana comisiones generosas promocionando productos premium de educación musical.
                  </p>
                  <div className="flex flex-wrap gap-6 pt-6">
                    <Button className="gap-2 text-base py-6" size="lg">
                      <Sparkles className="h-5 w-5" /> Unirse Ahora
                    </Button>
                    <Button variant="outline" className="text-base py-6" size="lg">
                      Saber Más
                    </Button>
                  </div>
                </div>
                <div className="hidden md:block relative h-72">
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/30 to-primary/10 rounded-lg flex items-center justify-center shadow-md">
                    <div className="text-center p-6">
                      <Sparkles className="h-16 w-16 text-primary mx-auto mb-4" />
                      <p className="text-3xl font-bold">Gana hasta 30%</p>
                      <p className="text-xl mt-2">en cada venta</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mb-12 text-center">
              <h2 className="text-3xl font-bold mb-6">¿Por qué convertirte en afiliado de Boostify?</h2>
              <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4 mt-8">
                <div className="flex flex-col items-center p-6 rounded-xl bg-gradient-to-b from-primary/5 to-transparent border border-primary/10">
                  <div className="bg-primary/10 p-4 rounded-full mb-4">
                    <DollarSign className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">Comisiones Competitivas</h3>
                  <p className="text-muted-foreground text-center">
                    Gana hasta un 30% de comisión en cada venta realizada a través de tus enlaces de afiliado
                  </p>
                </div>
                
                <div className="flex flex-col items-center p-6 rounded-xl bg-gradient-to-b from-primary/5 to-transparent border border-primary/10">
                  <div className="bg-primary/10 p-4 rounded-full mb-4">
                    <Zap className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">Acceso Instantáneo</h3>
                  <p className="text-muted-foreground text-center">
                    Comienza a promocionar inmediatamente con materiales y herramientas de marketing listas para usar
                  </p>
                </div>
                
                <div className="flex flex-col items-center p-6 rounded-xl bg-gradient-to-b from-primary/5 to-transparent border border-primary/10">
                  <div className="bg-primary/10 p-4 rounded-full mb-4">
                    <Crown className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">Contenido Premium</h3>
                  <p className="text-muted-foreground text-center">
                    Accede a contenido exclusivo y materiales promocionales diseñados para impulsar conversiones
                  </p>
                </div>
                
                <div className="flex flex-col items-center p-6 rounded-xl bg-gradient-to-b from-primary/5 to-transparent border border-primary/10">
                  <div className="bg-primary/10 p-4 rounded-full mb-4">
                    <HeadphonesIcon className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">Soporte Dedicado</h3>
                  <p className="text-muted-foreground text-center">
                    Recibe asistencia personalizada de nuestro equipo de afiliados para maximizar tus ganancias
                  </p>
                </div>
              </div>
            </div>

            <div className="border-t pt-10 mb-16">
              <div className="max-w-3xl mx-auto text-center mb-12">
                <Badge className="mb-4">Proceso Simple</Badge>
                <h2 className="text-3xl font-bold mb-6">Cómo funciona</h2>
                <p className="text-lg text-muted-foreground">
                  Unirse al programa de afiliados de Boostify es fácil y puedes comenzar a ganar comisiones en minutos.
                </p>
              </div>
              
              <div className="grid md:grid-cols-3 gap-8">
                <div className="flex flex-col items-center text-center">
                  <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mb-4">
                    <span className="text-2xl font-bold text-primary">1</span>
                  </div>
                  <h3 className="text-xl font-bold mb-2">Regístrate como afiliado</h3>
                  <p className="text-muted-foreground">
                    Completa el formulario y recibe aprobación rápida para comenzar a promocionar
                  </p>
                </div>
                
                <div className="flex flex-col items-center text-center">
                  <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mb-4">
                    <span className="text-2xl font-bold text-primary">2</span>
                  </div>
                  <h3 className="text-xl font-bold mb-2">Promociona productos</h3>
                  <p className="text-muted-foreground">
                    Comparte tus enlaces únicos en redes sociales, blogs, emails o donde prefieras
                  </p>
                </div>
                
                <div className="flex flex-col items-center text-center">
                  <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mb-4">
                    <span className="text-2xl font-bold text-primary">3</span>
                  </div>
                  <h3 className="text-xl font-bold mb-2">Gana comisiones</h3>
                  <p className="text-muted-foreground">
                    Recibe pagos mensuales por cada venta generada a través de tus enlaces
                  </p>
                </div>
              </div>
            </div>
            
            <div className="py-10">
              <div className="max-w-3xl mx-auto">
                <h2 className="text-3xl font-bold mb-8 text-center">Solicitud de Afiliado</h2>
                <AffiliateRegistration />
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Panel de Afiliado</h1>
                <p className="text-muted-foreground">
                  Gestiona tu cuenta, enlaces y ganancias
                </p>
              </div>
              
              {affiliateData && (
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="gap-1 py-1.5 px-3 text-base">
                    <Award className="h-4 w-4 mr-1 text-primary" />
                    <span>{affiliateData.level || "Basic"}</span>
                  </Badge>
                  <Button variant="outline" size="icon">
                    <Settings2 className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
            
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3 md:grid-cols-6 h-auto">
                <TabsTrigger value="overview" className="flex flex-col py-2 px-4 h-auto">
                  <LineChart className="h-4 w-4 mb-1" />
                  <span>Resumen</span>
                </TabsTrigger>
                <TabsTrigger value="links" className="flex flex-col py-2 px-4 h-auto">
                  <Link className="h-4 w-4 mb-1" />
                  <span>Enlaces</span>
                </TabsTrigger>
                <TabsTrigger value="earnings" className="flex flex-col py-2 px-4 h-auto">
                  <DollarSign className="h-4 w-4 mb-1" />
                  <span>Ganancias</span>
                </TabsTrigger>
                <TabsTrigger value="content" className="flex flex-col py-2 px-4 h-auto">
                  <FileText className="h-4 w-4 mb-1" />
                  <span>Contenido</span>
                </TabsTrigger>
                <TabsTrigger value="resources" className="flex flex-col py-2 px-4 h-auto">
                  <GraduationCap className="h-4 w-4 mb-1" />
                  <span>Recursos</span>
                </TabsTrigger>
                <TabsTrigger value="support" className="flex flex-col py-2 px-4 h-auto">
                  <LifeBuoy className="h-4 w-4 mb-1" />
                  <span>Soporte</span>
                </TabsTrigger>
              </TabsList>
              
              <div className="mt-6">
                <TabsContent value="overview">
                  <AffiliateOverview affiliateData={affiliateData || mockAffiliateData} />
                </TabsContent>
                
                <TabsContent value="links">
                  <AffiliateLinks affiliateData={affiliateData || mockAffiliateData} />
                </TabsContent>
                
                <TabsContent value="earnings">
                  <AffiliateEarnings affiliateData={affiliateData || mockAffiliateData} />
                </TabsContent>
                
                <TabsContent value="content">
                  <AffiliateContentGenerator affiliateData={affiliateData || mockAffiliateData} />
                </TabsContent>
                
                <TabsContent value="resources">
                  <AffiliateResources />
                </TabsContent>
                
                <TabsContent value="support">
                  <AffiliateSupport />
                </TabsContent>
              </div>
            </Tabs>
          </>
        )}
      </main>
    </div>
  );
}