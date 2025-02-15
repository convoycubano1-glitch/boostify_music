import { Header } from "@/components/layout/header";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Users,
  CreditCard,
  Mail,
  UserX,
  Star,
  RefreshCcw,
  Settings,
  Download,
  UserCheck
} from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";

export default function AdminPage() {
  const [selectedTab, setSelectedTab] = useState("subscriptions");
  const { user } = useAuth();

  // Mock data - replace with actual API calls
  const subscriptionData = {
    activeSubscriptions: 150,
    totalRevenue: 15000,
    recentCancellations: 5
  };

  const affiliateData = {
    totalAffiliates: 45,
    activeAffiliates: 32,
    totalCommissions: 2500
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 pt-20">
        <ScrollArea className="flex-1 h-[calc(100vh-5rem)]">
          <div className="container mx-auto px-4 py-6">
            {/* Hero Section */}
            <section className="relative rounded-xl overflow-hidden mb-12 bg-gradient-to-br from-orange-500/20 via-orange-500/10 to-background p-8">
              <div className="relative">
                <h1 className="text-4xl md:text-5xl font-bold mb-4">
                  Panel de Administración
                </h1>
                <p className="text-xl text-muted-foreground max-w-2xl">
                  Gestiona suscripciones, afiliados y datos de usuarios desde un solo lugar
                </p>
              </div>
            </section>

            <Tabs value={selectedTab} onValueChange={setSelectedTab}>
              <TabsList className="grid grid-cols-3 max-w-[600px] mb-8">
                <TabsTrigger value="subscriptions" className="data-[state=active]:bg-orange-500">
                  <CreditCard className="w-4 h-4 mr-2" />
                  Suscripciones
                </TabsTrigger>
                <TabsTrigger value="affiliates" className="data-[state=active]:bg-orange-500">
                  <Star className="w-4 h-4 mr-2" />
                  Afiliados
                </TabsTrigger>
                <TabsTrigger value="data" className="data-[state=active]:bg-orange-500">
                  <Mail className="w-4 h-4 mr-2" />
                  Datos y Emails
                </TabsTrigger>
              </TabsList>

              {/* Suscripciones Tab */}
              <TabsContent value="subscriptions">
                <div className="grid md:grid-cols-3 gap-6 mb-8">
                  <Card className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-orange-500/10 rounded-lg">
                        <Users className="h-6 w-6 text-orange-500" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Suscripciones Activas</p>
                        <p className="text-2xl font-bold">{subscriptionData.activeSubscriptions}</p>
                      </div>
                    </div>
                  </Card>
                  
                  <Card className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-orange-500/10 rounded-lg">
                        <CreditCard className="h-6 w-6 text-orange-500" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Ingresos Totales</p>
                        <p className="text-2xl font-bold">${subscriptionData.totalRevenue}</p>
                      </div>
                    </div>
                  </Card>

                  <Card className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-orange-500/10 rounded-lg">
                        <UserX className="h-6 w-6 text-orange-500" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Cancelaciones Recientes</p>
                        <p className="text-2xl font-bold">{subscriptionData.recentCancellations}</p>
                      </div>
                    </div>
                  </Card>
                </div>

                <Card className="p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-semibold">Gestión de Suscripciones</h3>
                    <Button variant="outline" size="sm">
                      <RefreshCcw className="h-4 w-4 mr-2" />
                      Actualizar
                    </Button>
                  </div>
                  
                  <div className="space-y-6">
                    {/* Add subscription management table/list here */}
                    <div className="text-center text-muted-foreground">
                      Tabla de suscripciones se implementará aquí
                    </div>
                  </div>
                </Card>
              </TabsContent>

              {/* Afiliados Tab */}
              <TabsContent value="affiliates">
                <div className="grid md:grid-cols-3 gap-6 mb-8">
                  <Card className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-orange-500/10 rounded-lg">
                        <Users className="h-6 w-6 text-orange-500" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Total Afiliados</p>
                        <p className="text-2xl font-bold">{affiliateData.totalAffiliates}</p>
                      </div>
                    </div>
                  </Card>

                  <Card className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-orange-500/10 rounded-lg">
                        <UserCheck className="h-6 w-6 text-orange-500" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Afiliados Activos</p>
                        <p className="text-2xl font-bold">{affiliateData.activeAffiliates}</p>
                      </div>
                    </div>
                  </Card>

                  <Card className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-orange-500/10 rounded-lg">
                        <CreditCard className="h-6 w-6 text-orange-500" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Comisiones Totales</p>
                        <p className="text-2xl font-bold">${affiliateData.totalCommissions}</p>
                      </div>
                    </div>
                  </Card>
                </div>

                <Card className="p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-semibold">Programa de Afiliados</h3>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-2" />
                        Exportar
                      </Button>
                      <Button variant="outline" size="sm">
                        <Settings className="h-4 w-4 mr-2" />
                        Configuración
                      </Button>
                    </div>
                  </div>
                  
                  <div className="space-y-6">
                    {/* Add affiliate management table/list here */}
                    <div className="text-center text-muted-foreground">
                      Tabla de afiliados se implementará aquí
                    </div>
                  </div>
                </Card>
              </TabsContent>

              {/* Datos y Emails Tab */}
              <TabsContent value="data">
                <Card className="p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-semibold">Gestión de Datos y Emails</h3>
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      Exportar Datos
                    </Button>
                  </div>
                  
                  <div className="space-y-6">
                    {/* Add email and data management interface here */}
                    <div className="text-center text-muted-foreground">
                      Interface de gestión de datos se implementará aquí
                    </div>
                  </div>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </ScrollArea>
      </main>
    </div>
  );
}
