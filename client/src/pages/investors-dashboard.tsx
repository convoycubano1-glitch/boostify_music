import { useState, useEffect } from "react";
import { Header } from "../components/layout/header";
import { Footer } from "../components/layout/footer";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { ScrollArea } from "../components/ui/scroll-area";
import { Separator } from "../components/ui/separator";
import { useAuth } from "../hooks/use-auth";
import { useToast } from "../hooks/use-toast";
import {
  Users,
  DollarSign,
  TrendingUp,
  BarChart2,
  Activity,
  Clock,
  Info,
  FileText,
  Calendar,
  ChevronRight,
  Search,
  Download
} from "lucide-react";
import InvestmentCalculator from "../components/InvestmentCalculator";

/**
 * Panel de Inversores - Permite a los usuarios ver oportunidades de inversión,
 * calcular retornos y realizar inversiones
 */
export default function InvestorsDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("calculator");
  const [investments, setInvestments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Cargar inversiones del usuario si está autenticado
  useEffect(() => {
    if (user?.uid) {
      fetchUserInvestments();
    }
  }, [user]);
  
  // Función para cargar inversiones del usuario
  const fetchUserInvestments = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/investors/user-investments');
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && Array.isArray(data.investments)) {
          setInvestments(data.investments);
        }
      } else {
        console.error('Error fetching user investments:', response.statusText);
      }
    } catch (error) {
      console.error('Failed to fetch investments:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-muted/30">
      <Header />
      
      <main className="flex-1 container px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">Panel de Inversores</h1>
            <p className="text-muted-foreground">
              Explora oportunidades de inversión, calcula retornos y gestiona tu portafolio.
            </p>
          </div>
          
          {user && (
            <Button 
              variant="outline" 
              className="flex items-center gap-2"
              onClick={() => {
                setActiveTab("portfolio");
                fetchUserInvestments();
              }}
            >
              <Activity className="h-4 w-4" />
              Mi Portafolio
            </Button>
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="p-5 flex items-center">
            <div className="bg-primary/10 p-3 rounded-full mr-4">
              <TrendingUp className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Rendimiento Promedio</p>
              <p className="text-2xl font-semibold">5.3% mensual</p>
            </div>
          </Card>
          
          <Card className="p-5 flex items-center">
            <div className="bg-primary/10 p-3 rounded-full mr-4">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Inversores Activos</p>
              <p className="text-2xl font-semibold">2,500+</p>
            </div>
          </Card>
          
          <Card className="p-5 flex items-center">
            <div className="bg-primary/10 p-3 rounded-full mr-4">
              <DollarSign className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Capital Invertido</p>
              <p className="text-2xl font-semibold">$5.2M</p>
            </div>
          </Card>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-background mb-2">
            <TabsTrigger value="calculator" className="flex items-center gap-2">
              <BarChart2 className="h-4 w-4" />
              <span>Calculadora</span>
            </TabsTrigger>
            <TabsTrigger value="portfolio" disabled={!user} className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              <span>Mi Portafolio</span>
            </TabsTrigger>
            <TabsTrigger value="information" className="flex items-center gap-2">
              <Info className="h-4 w-4" />
              <span>Información</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="calculator" className="space-y-8">
            <Card className="p-8">
              <h2 className="text-2xl font-bold mb-2">Calculadora de Inversiones</h2>
              <p className="text-muted-foreground mb-6">
                Configura los parámetros de tu inversión y calcula tu retorno estimado.
              </p>
              
              <InvestmentCalculator />
            </Card>
          </TabsContent>
          
          <TabsContent value="portfolio" className="space-y-8">
            <Card className="p-8">
              <h2 className="text-2xl font-bold mb-2">Mi Portafolio de Inversiones</h2>
              <p className="text-muted-foreground mb-6">
                Gestiona y monitorea tus inversiones activas.
              </p>
              
              {isLoading ? (
                <div className="py-8 flex justify-center">
                  <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
                </div>
              ) : investments.length > 0 ? (
                <ScrollArea className="h-[500px] rounded-md border p-4">
                  <div className="space-y-6">
                    {investments.map((investment) => (
                      <Card key={investment.id} className="p-4 hover:bg-secondary/10 transition-colors">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h3 className="font-semibold text-lg">
                              Inversión de ${investment.amount?.toLocaleString()}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              {investment.projectName || 'Proyecto de inversión'}
                            </p>
                          </div>
                          <div className="px-3 py-1 rounded-full text-xs font-medium capitalize bg-green-100 text-green-700">
                            {investment.status || 'pendiente'}
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                          <div>
                            <p className="text-xs text-muted-foreground flex items-center">
                              <DollarSign className="h-3 w-3 mr-1" />
                              Monto
                            </p>
                            <p className="font-medium">${investment.amount?.toLocaleString()}</p>
                          </div>
                          
                          <div>
                            <p className="text-xs text-muted-foreground flex items-center">
                              <Calendar className="h-3 w-3 mr-1" />
                              Duración
                            </p>
                            <p className="font-medium">{investment.duration} meses</p>
                          </div>
                          
                          <div>
                            <p className="text-xs text-muted-foreground flex items-center">
                              <TrendingUp className="h-3 w-3 mr-1" />
                              Tasa
                            </p>
                            <p className="font-medium">{investment.rate}% mensual</p>
                          </div>
                          
                          <div>
                            <p className="text-xs text-muted-foreground flex items-center">
                              <DollarSign className="h-3 w-3 mr-1" />
                              Retorno est.
                            </p>
                            <p className="font-medium">
                              ${((investment.amount * investment.rate * investment.duration) / 100).toFixed(2)}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex justify-end gap-2">
                          <Button size="sm" variant="outline" className="text-xs">
                            <FileText className="h-3 w-3 mr-1" />
                            Detalles
                          </Button>
                          {investment.status === 'active' && (
                            <Button size="sm" variant="outline" className="text-xs">
                              <Download className="h-3 w-3 mr-1" />
                              Certificado
                            </Button>
                          )}
                        </div>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <div className="text-center py-12 border rounded-lg bg-muted/20">
                  <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <Search className="h-6 w-6 text-primary/60" />
                  </div>
                  <h3 className="font-semibold mb-2">No tienes inversiones activas</h3>
                  <p className="text-muted-foreground text-sm mb-4 max-w-md mx-auto">
                    Utiliza nuestra calculadora para simular y realizar tu primera inversión.
                  </p>
                  <Button 
                    onClick={() => setActiveTab("calculator")}
                    className="mt-2"
                  >
                    Ir a la calculadora
                  </Button>
                </div>
              )}
            </Card>
          </TabsContent>
          
          <TabsContent value="information" className="space-y-8">
            <Card className="p-8">
              <h2 className="text-2xl font-bold mb-2">Información sobre Inversiones</h2>
              <p className="text-muted-foreground mb-6">
                Aprende sobre nuestros planes de inversión y cómo funcionan.
              </p>
              
              <div className="space-y-6">
                <div className="p-6 border rounded-lg">
                  <h3 className="text-xl font-semibold mb-3 flex items-center">
                    <Clock className="mr-2 h-5 w-5 text-primary" />
                    Cómo funciona
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    Nuestro programa de inversión está diseñado para permitir a artistas, productores y 
                    entusiastas de la música invertir en proyectos musicales con alto potencial de crecimiento.
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                    <div className="space-y-2">
                      <div className="bg-primary/10 rounded-full h-8 w-8 flex items-center justify-center mb-2">
                        <span className="font-semibold text-primary">1</span>
                      </div>
                      <h4 className="font-semibold">Calcula</h4>
                      <p className="text-sm text-muted-foreground">
                        Utiliza nuestra calculadora para simular diferentes escenarios de inversión.
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="bg-primary/10 rounded-full h-8 w-8 flex items-center justify-center mb-2">
                        <span className="font-semibold text-primary">2</span>
                      </div>
                      <h4 className="font-semibold">Invierte</h4>
                      <p className="text-sm text-muted-foreground">
                        Realiza tu inversión de forma segura a través de nuestra plataforma.
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="bg-primary/10 rounded-full h-8 w-8 flex items-center justify-center mb-2">
                        <span className="font-semibold text-primary">3</span>
                      </div>
                      <h4 className="font-semibold">Recibe retornos</h4>
                      <p className="text-sm text-muted-foreground">
                        Obtén retornos mensuales directamente en tu cuenta.
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="p-6 border rounded-lg">
                  <h3 className="text-xl font-semibold mb-3 flex items-center">
                    <FileText className="mr-2 h-5 w-5 text-primary" />
                    Preguntas frecuentes
                  </h3>
                  
                  <div className="space-y-4 mt-4">
                    <div>
                      <h4 className="font-semibold mb-1">¿Cuál es el monto mínimo de inversión?</h4>
                      <p className="text-sm text-muted-foreground">
                        El monto mínimo de inversión es de $1,000 USD.
                      </p>
                    </div>
                    
                    <Separator />
                    
                    <div>
                      <h4 className="font-semibold mb-1">¿Cómo se generan los retornos?</h4>
                      <p className="text-sm text-muted-foreground">
                        Los retornos se generan a través de diversas fuentes de ingresos musicales, 
                        incluyendo royalties, streaming, y otros derechos de propiedad intelectual.
                      </p>
                    </div>
                    
                    <Separator />
                    
                    <div>
                      <h4 className="font-semibold mb-1">¿Puedo retirar mi inversión antes de tiempo?</h4>
                      <p className="text-sm text-muted-foreground">
                        Sí, pero puede aplicarse un fee de salida temprana del 2% del monto invertido.
                      </p>
                    </div>
                    
                    <Separator />
                    
                    <div>
                      <h4 className="font-semibold mb-1">¿Cómo se procesan los pagos?</h4>
                      <p className="text-sm text-muted-foreground">
                        Los pagos se procesan de forma segura a través de Stripe, una de las plataformas 
                        de pago más confiables del mundo.
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-primary/5 p-6 rounded-lg flex flex-col md:flex-row justify-between items-center gap-4">
                  <div>
                    <h3 className="text-xl font-semibold mb-1">¿Necesitas más información?</h3>
                    <p className="text-muted-foreground">
                      Nuestro equipo está disponible para resolver todas tus dudas.
                    </p>
                  </div>
                  <Button className="flex items-center gap-2 min-w-[180px]">
                    Contactar soporte
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
      
      <Footer />
    </div>
  );
}