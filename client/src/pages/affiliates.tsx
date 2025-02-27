import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/layout/header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AffiliateOverview } from "@/components/affiliate-overview";
import { AffiliateRegistration } from "@/components/affiliate-registration";
import { AffiliateLinks } from "@/components/affiliate-links";
import { AffiliateEarnings } from "@/components/affiliate-earnings";
import { AffiliateContentGenerator } from "@/components/affiliate-content-generator";
import { AffiliateResources } from "@/components/affiliate-resources";
import { AffiliateSupport } from "@/components/affiliate-support";
import { useAuth } from "@/hooks/use-auth";
import { db, auth } from "@/lib/firebase";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";

export default function AffiliatesPage() {
  const { user } = useAuth() || {};
  const [activeTab, setActiveTab] = useState("overview");

  // Consulta sobre si el usuario actual es un afiliado
  const { data: affiliateData, isLoading: isLoadingAffiliateData } = useQuery({
    queryKey: ["affiliate", user?.uid],
    queryFn: async () => {
      if (!user?.uid) return null;
      
      const affiliateRef = doc(db, "affiliates", user.uid);
      const affiliateDoc = await getDoc(affiliateRef);
      
      if (affiliateDoc.exists()) {
        return { ...affiliateDoc.data(), id: affiliateDoc.id };
      }
      
      return null;
    },
    enabled: !!user?.uid,
  });

  // Determinar si mostrar el formulario de registro o el panel de afiliados
  const isAffiliate = !!affiliateData;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="flex flex-col gap-8">
          <div className="space-y-4">
            <h1 className="text-3xl font-bold tracking-tight">Programa de Afiliados</h1>
            <p className="text-muted-foreground max-w-3xl">
              Únete al programa de afiliados de Boostify y gana comisiones promocionando nuestros productos y servicios. 
              Tendrás acceso a herramientas de marketing, contenido exclusivo y soporte personalizado.
            </p>
          </div>

          {isLoadingAffiliateData ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : !isAffiliate ? (
            // Si no es afiliado, mostrar el formulario de registro
            <AffiliateRegistration />
          ) : (
            // Si es afiliado, mostrar el panel completo
            <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="space-y-4">
              <TabsList className="grid grid-cols-2 md:grid-cols-7 gap-2">
                <TabsTrigger value="overview">Resumen</TabsTrigger>
                <TabsTrigger value="links">Enlaces</TabsTrigger>
                <TabsTrigger value="earnings">Ganancias</TabsTrigger>
                <TabsTrigger value="content">Generador de Contenido</TabsTrigger>
                <TabsTrigger value="resources">Recursos</TabsTrigger>
                <TabsTrigger value="support">Soporte</TabsTrigger>
                <TabsTrigger value="settings">Ajustes</TabsTrigger>
              </TabsList>
              
              <TabsContent value="overview" className="space-y-4">
                <AffiliateOverview affiliateData={affiliateData} />
              </TabsContent>
              
              <TabsContent value="links" className="space-y-4">
                <AffiliateLinks affiliateData={affiliateData} />
              </TabsContent>
              
              <TabsContent value="earnings" className="space-y-4">
                <AffiliateEarnings affiliateData={affiliateData} />
              </TabsContent>
              
              <TabsContent value="content" className="space-y-4">
                <AffiliateContentGenerator affiliateData={affiliateData} />
              </TabsContent>
              
              <TabsContent value="resources" className="space-y-4">
                <AffiliateResources />
              </TabsContent>
              
              <TabsContent value="support" className="space-y-4">
                <AffiliateSupport />
              </TabsContent>
              
              <TabsContent value="settings" className="space-y-4">
                <div className="grid gap-4">
                  <h3 className="text-lg font-medium">Configuración de cuenta</h3>
                  <p className="text-sm text-muted-foreground">
                    Administra tu información de afiliado y preferencias de pago.
                  </p>
                  {/* Componente de configuración de afiliado aquí */}
                </div>
              </TabsContent>
            </Tabs>
          )}
        </div>
      </main>
    </div>
  );
}