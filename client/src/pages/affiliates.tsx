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
import { CircleCheck, GraduationCap, LineChart, Rocket, Stars, Sparkles, Award, Users, DollarSign, Link, FileText, LifeBuoy, Settings2 } from "lucide-react";
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
  // Para pruebas, puedes cambiar esta línea a `true` para ver el dashboard
  const isAffiliate = true; // !!affiliateData;
  
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
        {!isAffiliate && (
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
                  <h3 className="text-xl font-bold mb-2">Acceso Inmediato</h3>
                  <p className="text-muted-foreground text-center">
                    Comienza a promocionar de inmediato con recursos de marketing listos para usar
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
          </>
        )}

        <div className="flex flex-col gap-8">
          {!isAffiliate && (
            <div>
              <h2 className="text-2xl font-bold mb-6 text-center">Why Become a Boostify Affiliate?</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {benefits.map((benefit, index) => (
                  <Card key={index} className="border-0 shadow-md hover:shadow-lg transition-all">
                    <CardHeader className="pb-2">
                      <div className="mb-2">{benefit.icon}</div>
                      <CardTitle>{benefit.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground">{benefit.description}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {isLoadingAffiliateData ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : !isAffiliate ? (
            // If not an affiliate, show registration form
            <AffiliateRegistration />
          ) : (
            // If already an affiliate, show full dashboard
            <div>
              <div className="mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                  <h1 className="text-3xl font-bold tracking-tight">Affiliate Dashboard</h1>
                  <p className="text-muted-foreground">
                    Welcome back! Track your performance and access all affiliate tools.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="text-sm py-1 px-3 flex items-center gap-1">
                    <Award className="h-3.5 w-3.5 text-yellow-500" />
                    <span>{mockAffiliateData.level || "Basic"} Level</span>
                  </Badge>
                  <Badge variant="secondary" className="text-sm py-1 px-3">
                    ID: {user?.uid?.substring(0, 8) || "mock-123"}
                  </Badge>
                </div>
              </div>

              <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <TabsList className="grid grid-cols-2 md:grid-cols-7 gap-2">
                  <TabsTrigger value="overview" className="flex items-center gap-1.5">
                    <LineChart className="h-4 w-4" />
                    <span>Overview</span>
                  </TabsTrigger>
                  <TabsTrigger value="links" className="flex items-center gap-1.5">
                    <Link className="h-4 w-4" />
                    <span>Links</span>
                  </TabsTrigger>
                  <TabsTrigger value="earnings" className="flex items-center gap-1.5">
                    <DollarSign className="h-4 w-4" />
                    <span>Earnings</span>
                  </TabsTrigger>
                  <TabsTrigger value="content" className="flex items-center gap-1.5">
                    <Sparkles className="h-4 w-4" />
                    <span>Content</span>
                  </TabsTrigger>
                  <TabsTrigger value="resources" className="flex items-center gap-1.5">
                    <FileText className="h-4 w-4" />
                    <span>Resources</span>
                  </TabsTrigger>
                  <TabsTrigger value="support" className="flex items-center gap-1.5">
                    <LifeBuoy className="h-4 w-4" />
                    <span>Support</span>
                  </TabsTrigger>
                  <TabsTrigger value="settings" className="flex items-center gap-1.5">
                    <Settings2 className="h-4 w-4" />
                    <span>Settings</span>
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="overview" className="space-y-4">
                  <AffiliateOverview affiliateData={mockAffiliateData} />
                </TabsContent>
                
                <TabsContent value="links" className="space-y-4">
                  <AffiliateLinks affiliateData={mockAffiliateData} />
                </TabsContent>
                
                <TabsContent value="earnings" className="space-y-4">
                  <AffiliateEarnings affiliateData={mockAffiliateData} />
                </TabsContent>
                
                <TabsContent value="content" className="space-y-4">
                  <AffiliateContentGenerator affiliateData={mockAffiliateData} />
                </TabsContent>
                
                <TabsContent value="resources" className="space-y-4">
                  <AffiliateResources />
                </TabsContent>
                
                <TabsContent value="support" className="space-y-4">
                  <AffiliateSupport />
                </TabsContent>
                
                <TabsContent value="settings" className="space-y-4">
                  <div className="grid gap-4">
                    <h3 className="text-lg font-medium">Account Settings</h3>
                    <p className="text-sm text-muted-foreground">
                      Manage your affiliate information and payment preferences.
                    </p>
                    {/* Affiliate settings component here */}
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          )}
        </div>

        {!isAffiliate && (
          <div className="mt-12 border-t pt-12">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-2xl font-bold mb-4">What Our Top Affiliates Are Saying</h2>
              <div className="grid gap-6 md:grid-cols-2 mt-6">
                <Card className="bg-muted/50">
                  <CardContent className="pt-6">
                    <p className="italic text-muted-foreground mb-4">
                      "The commission rates are among the best I've seen, and the marketing materials make promotion effortless. I've already earned over $5,000 in my first three months!"
                    </p>
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                        <span className="font-semibold">JM</span>
                      </div>
                      <div>
                        <p className="font-medium">James Morrison</p>
                        <p className="text-xs text-muted-foreground">Music Producer & Educator</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="bg-muted/50">
                  <CardContent className="pt-6">
                    <p className="italic text-muted-foreground mb-4">
                      "Boostify's affiliate dashboard is incredibly user-friendly. The content generator saves me hours of work and has significantly improved my conversion rates!"
                    </p>
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                        <span className="font-semibold">SR</span>
                      </div>
                      <div>
                        <p className="font-medium">Sarah Rodriguez</p>
                        <p className="text-xs text-muted-foreground">Music Marketing Specialist</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
            
            <div className="mt-16 mb-8 bg-gradient-to-r from-primary/20 via-primary/10 to-background rounded-lg p-8 text-center">
              <h2 className="text-2xl font-bold mb-4">Ready to Start Earning?</h2>
              <p className="text-muted-foreground max-w-xl mx-auto mb-6">
                Join our affiliate program today and start earning generous commissions by promoting our premium music education products.
              </p>
              <Button size="lg" className="gap-2">
                <Sparkles className="h-5 w-5" /> Become an Affiliate
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}