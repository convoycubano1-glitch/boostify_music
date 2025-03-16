/**
 * Página de asesores IA con planes de suscripción
 * 
 * Esta página permite a los usuarios obtener asesoramiento profesional
 * basado en su plan de suscripción actual.
 */

import { useState } from 'react';
import { useToast } from '../hooks/use-toast';
import { useAuth } from '../hooks/use-auth';
import { useLocation } from 'wouter';
import { Advisor } from '../lib/services/advisor-call-service';
import { useSubscription } from '../lib/context/subscription-context';

// Componentes
import { CallHistory } from '../components/ai-advisors/call-history';
import { CallLimits } from '../components/ai-advisors/call-limits';
import { CallModal } from '../components/ai-advisors/call-modal';

// Componentes UI
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '../components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '../components/ui/tabs';
import { Button } from '../components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '../components/ui/alert';
import { Badge } from '../components/ui/badge';
import { Separator } from '../components/ui/separator';

// Iconos
import {
  MessageSquare,
  Phone,
  VideoIcon,
  Music,
  Users,
  TrendingUp,
  BriefcaseBusiness,
  FileText,
  AlertTriangle,
  ChevronRight,
  BookOpen,
  Megaphone,
  HandCoins,
  BarChart,
  Rocket,
} from 'lucide-react';

// Crear lista de asesores
const advisors: Advisor[] = [
  {
    id: 'publicist',
    name: 'Sarah Mills',
    title: 'Publicista',
    description: 'Especialista en relaciones públicas y prensa musical',
    icon: Megaphone,
    color: 'from-purple-500 to-blue-500',
    animationDelay: 0,
  },
  {
    id: 'manager',
    name: 'Mark Johnson',
    title: 'Manager',
    description: 'Asesor experto en gestión de carreras artísticas',
    icon: Users,
    color: 'from-blue-500 to-cyan-400',
    animationDelay: 0.1,
  },
  {
    id: 'producer',
    name: 'David Williams',
    title: 'Productor Musical',
    description: 'Especialista en producción y arreglos musicales',
    icon: Music,
    color: 'from-amber-500 to-orange-600',
    animationDelay: 0.2,
  },
  {
    id: 'creative',
    name: 'Emily Rodríguez',
    title: 'Directora Creativa',
    description: 'Experta en imagen visual y conceptualización artística',
    icon: VideoIcon,
    color: 'from-pink-500 to-rose-500',
    animationDelay: 0.3,
  },
  {
    id: 'business',
    name: 'Robert Chen',
    title: 'Consultor de Negocios',
    description: 'Especialista en monetización y estrategias de negocio',
    icon: BriefcaseBusiness,
    color: 'from-emerald-500 to-green-600',
    animationDelay: 0.4,
  },
  {
    id: 'marketing',
    name: 'Alicia Torres',
    title: 'Especialista de Marketing',
    description: 'Asesora de estrategias digitales y campañas promocionales',
    icon: TrendingUp,
    color: 'from-red-500 to-rose-600',
    animationDelay: 0.5,
  },
  {
    id: 'lawyer',
    name: 'Michael Barnes',
    title: 'Abogado Musical',
    description: 'Experto en contratos y propiedad intelectual',
    icon: FileText,
    color: 'from-indigo-500 to-violet-600',
    animationDelay: 0.6,
  },
  {
    id: 'support',
    name: 'Lucia González',
    title: 'Soporte al Artista',
    description: 'Asistente para todas tus necesidades como artista',
    icon: HandCoins,
    color: 'from-teal-500 to-green-400',
    animationDelay: 0.7,
  },
  {
    id: 'analytics',
    name: 'Thomas Lee',
    title: 'Analista de Datos',
    description: 'Interpretación de métricas y tendencias musicales',
    icon: BarChart,
    color: 'from-cyan-500 to-blue-600',
    animationDelay: 0.8,
  },
  {
    id: 'strategist',
    name: 'Rebecca Taylor',
    title: 'Estratega de Crecimiento',
    description: 'Especialista en expansión y nuevas audiencias',
    icon: Rocket,
    color: 'from-orange-500 to-amber-400',
    animationDelay: 0.9,
  },
];

// Lista de consejos rápidos
const quickTips = [
  "Mantén una presencia constante en redes sociales para aumentar tu visibilidad",
  "Invierte en material visual de calidad para destacar frente a la competencia",
  "Construye relaciones genuinas con tus seguidores respondiendo a comentarios",
  "Colabora con otros artistas para acceder a nuevas audiencias",
  "Define tu propuesta de valor única: ¿qué te hace diferente?",
  "Aprovecha herramientas de análisis para entender mejor a tu audiencia",
  "Establece un calendario de lanzamientos para mantener el interés",
  "Considera trabajar con un distribuidor digital independiente para tus lanzamientos",
  "Desarrolla contenido exclusivo para tus seguidores más dedicados",
  "Registra tus obras en sociedades de gestión de derechos de autor"
];

export default function AIAdvisorsPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { subscription, currentPlan } = useSubscription();
  
  // Estado de llamada
  const [selectedAdvisor, setSelectedAdvisor] = useState<Advisor | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [calling, setCalling] = useState(false);
  
  // Manejar clic en asesor
  const handleAdvisorClick = (advisor: Advisor) => {
    if (!user) {
      toast({
        title: "Inicia sesión para continuar",
        description: "Necesitas iniciar sesión para contactar a un asesor",
        variant: "destructive"
      });
      
      // Redirigir a login
      setLocation('/login');
      return;
    }
    
    setSelectedAdvisor(advisor);
    setModalOpen(true);
  };
  
  return (
    <div className="container max-w-6xl py-6 md:py-10 space-y-6">
      {/* Cabecera */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">AI Advisors</h1>
        <p className="text-muted-foreground">
          Contacta con asesores especializados en la industria musical para impulsar tu carrera
        </p>
      </div>
      
      {/* Pestañas principales */}
      <Tabs defaultValue="advisors" className="w-full">
        <div className="flex justify-between items-center">
          <TabsList>
            <TabsTrigger value="advisors">Asesores</TabsTrigger>
            <TabsTrigger value="history">Historial</TabsTrigger>
            <TabsTrigger value="plans">Planes</TabsTrigger>
          </TabsList>
          
          {/* Badge de plan actual */}
          <Badge 
            variant={
              currentPlan === 'premium' ? 'default' : 
              currentPlan === 'pro' ? 'secondary' : 
              currentPlan === 'basic' ? 'outline' : 
              'secondary'
            }
            className="hidden md:flex"
          >
            Plan {currentPlan.toUpperCase()}
          </Badge>
        </div>
        
        {/* Contenido: Tab Asesores */}
        <TabsContent value="advisors" className="pt-4 space-y-6">
          {/* Alerta de límite (si aplica) */}
          {!user ? (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Acceso limitado</AlertTitle>
              <AlertDescription>
                Inicia sesión para contactar con los asesores y recibir ayuda personalizada.
                <Button 
                  variant="link" 
                  className="p-0 ml-2 h-auto" 
                  onClick={() => setLocation('/login')}
                >
                  Iniciar sesión
                </Button>
              </AlertDescription>
            </Alert>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Panel lateral - Estadísticas y límites */}
              <div className="space-y-4">
                {/* Límites de llamadas */}
                <CallLimits 
                  variant="compact" 
                  showUpgradeButton={true}
                />
                
                {/* Historial reciente compacto */}
                <CallHistory 
                  variant="compact" 
                  maxCalls={5} 
                  showHeader={false}
                  showFooter={false}
                />
                
                {/* Consejos rápidos */}
                <Card>
                  <CardHeader className="pb-2">
                    <div className="flex items-center">
                      <BookOpen className="w-4 h-4 mr-2 text-primary" />
                      <CardTitle className="text-sm">Consejos rápidos</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="pb-3">
                    <div className="text-sm">
                      {quickTips[Math.floor(Math.random() * quickTips.length)]}
                    </div>
                  </CardContent>
                  <CardFooter className="pt-0">
                    <Button variant="ghost" size="sm" className="w-full text-xs" onClick={() => setLocation('/resources')}>
                      Más recursos
                      <ChevronRight className="ml-1 h-3 w-3" />
                    </Button>
                  </CardFooter>
                </Card>
              </div>
              
              {/* Lista de asesores */}
              <div className="md:col-span-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {advisors.map((advisor) => (
                    <Card 
                      key={advisor.id}
                      className="overflow-hidden group hover:shadow-md transition-shadow duration-300"
                    >
                      <CardHeader className={`pb-2 bg-gradient-to-br ${advisor.color} relative`}>
                        <div className="absolute inset-0 bg-black/20" />
                        <div className="relative z-10 flex justify-between items-start">
                          <div>
                            <CardTitle className="text-white">{advisor.name}</CardTitle>
                            <CardDescription className="text-white/90">
                              {advisor.title}
                            </CardDescription>
                          </div>
                          <div className="p-2 rounded-full bg-white/20 backdrop-blur-sm">
                            <advisor.icon className="h-5 w-5 text-white" />
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-3">
                        <p className="text-sm">{advisor.description}</p>
                      </CardContent>
                      <CardFooter className="border-t pt-3">
                        <Button 
                          className="w-full" 
                          onClick={() => handleAdvisorClick(advisor)}
                          disabled={calling}
                        >
                          <Phone className="mr-2 h-4 w-4" />
                          {calling ? 'Llamando...' : 'Llamar ahora'}
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          )}
        </TabsContent>
        
        {/* Contenido: Tab Historial */}
        <TabsContent value="history" className="pt-4">
          {!user ? (
            <div className="text-center py-12">
              <MessageSquare className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium">Inicia sesión para ver tu historial</h3>
              <p className="text-muted-foreground mb-6">
                Necesitas iniciar sesión para ver tu historial de llamadas con asesores
              </p>
              <Button onClick={() => setLocation('/login')}>
                Iniciar sesión
              </Button>
            </div>
          ) : (
            <CallHistory 
              showHeader={true}
              showFooter={true}
              showFilters={true}
              maxCalls={50}
            />
          )}
        </TabsContent>
        
        {/* Contenido: Tab Planes */}
        <TabsContent value="plans" className="pt-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Plan Gratuito */}
            <Card className={`border-2 ${currentPlan === 'free' ? 'border-primary' : 'border-transparent'}`}>
              <CardHeader>
                <CardTitle>Plan Gratuito</CardTitle>
                <CardDescription>Acceso básico a asesores IA</CardDescription>
                <div className="mt-2">
                  <span className="text-3xl font-bold">$0</span>
                  <span className="text-muted-foreground ml-1">/mes</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center">
                    <div className="w-4 h-4 rounded-full bg-primary/20 flex items-center justify-center mr-2">
                      <div className="w-2 h-2 rounded-full bg-primary" />
                    </div>
                    <span className="text-sm">3 llamadas mensuales</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-4 h-4 rounded-full bg-primary/20 flex items-center justify-center mr-2">
                      <div className="w-2 h-2 rounded-full bg-primary" />
                    </div>
                    <span className="text-sm">Acceso a 1 asesor</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-4 h-4 rounded-full bg-primary/20 flex items-center justify-center mr-2">
                      <div className="w-2 h-2 rounded-full bg-primary" />
                    </div>
                    <span className="text-sm">Duración máxima: 5 minutos</span>
                  </div>
                </div>
                
                <Separator />
                
                <div className="space-y-1 text-sm">
                  <p className="font-medium">Asesores disponibles:</p>
                  <p>• Sarah Mills (Publicista)</p>
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  variant={currentPlan === 'free' ? 'outline' : 'default'} 
                  className="w-full"
                  disabled={currentPlan === 'free'}
                  onClick={() => setLocation('/pricing')}
                >
                  {currentPlan === 'free' ? 'Plan Actual' : 'Seleccionar Plan'}
                </Button>
              </CardFooter>
            </Card>
            
            {/* Plan Básico */}
            <Card className={`border-2 ${currentPlan === 'basic' ? 'border-primary' : 'border-transparent'}`}>
              <CardHeader>
                <CardTitle>Plan Básico</CardTitle>
                <CardDescription>Para artistas emergentes</CardDescription>
                <div className="mt-2">
                  <span className="text-3xl font-bold">$9.99</span>
                  <span className="text-muted-foreground ml-1">/mes</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center">
                    <div className="w-4 h-4 rounded-full bg-primary/20 flex items-center justify-center mr-2">
                      <div className="w-2 h-2 rounded-full bg-primary" />
                    </div>
                    <span className="text-sm">10 llamadas mensuales</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-4 h-4 rounded-full bg-primary/20 flex items-center justify-center mr-2">
                      <div className="w-2 h-2 rounded-full bg-primary" />
                    </div>
                    <span className="text-sm">Acceso a 3 asesores</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-4 h-4 rounded-full bg-primary/20 flex items-center justify-center mr-2">
                      <div className="w-2 h-2 rounded-full bg-primary" />
                    </div>
                    <span className="text-sm">Duración máxima: 10 minutos</span>
                  </div>
                </div>
                
                <Separator />
                
                <div className="space-y-1 text-sm">
                  <p className="font-medium">Asesores disponibles:</p>
                  <p>• Sarah Mills (Publicista)</p>
                  <p>• Emily Rodríguez (Directora Creativa)</p>
                  <p>• Lucia González (Soporte al Artista)</p>
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  variant={currentPlan === 'basic' ? 'outline' : 'default'} 
                  className="w-full"
                  disabled={currentPlan === 'basic'}
                  onClick={() => setLocation('/pricing')}
                >
                  {currentPlan === 'basic' ? 'Plan Actual' : 'Seleccionar Plan'}
                </Button>
              </CardFooter>
            </Card>
            
            {/* Plan Pro */}
            <Card className={`border-2 ${currentPlan === 'pro' ? 'border-primary' : 'border-transparent'}`}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>Plan Pro</CardTitle>
                    <CardDescription>Para artistas profesionales</CardDescription>
                  </div>
                  <Badge variant="default">Recomendado</Badge>
                </div>
                <div className="mt-2">
                  <span className="text-3xl font-bold">$29.99</span>
                  <span className="text-muted-foreground ml-1">/mes</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center">
                    <div className="w-4 h-4 rounded-full bg-primary/20 flex items-center justify-center mr-2">
                      <div className="w-2 h-2 rounded-full bg-primary" />
                    </div>
                    <span className="text-sm">30 llamadas mensuales</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-4 h-4 rounded-full bg-primary/20 flex items-center justify-center mr-2">
                      <div className="w-2 h-2 rounded-full bg-primary" />
                    </div>
                    <span className="text-sm">Acceso a todos los asesores</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-4 h-4 rounded-full bg-primary/20 flex items-center justify-center mr-2">
                      <div className="w-2 h-2 rounded-full bg-primary" />
                    </div>
                    <span className="text-sm">Duración máxima: 20 minutos</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-4 h-4 rounded-full bg-primary/20 flex items-center justify-center mr-2">
                      <div className="w-2 h-2 rounded-full bg-primary" />
                    </div>
                    <span className="text-sm">Exportación de historial</span>
                  </div>
                </div>
                
                <Separator />
                
                <div className="space-y-1 text-sm">
                  <p className="font-medium">Asesores destacados:</p>
                  <p>• Mark Johnson (Manager)</p>
                  <p>• David Williams (Productor Musical)</p>
                  <p>• Alicia Torres (Especialista Marketing)</p>
                  <p>• Y todos los demás asesores (10 total)</p>
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  variant={currentPlan === 'pro' ? 'outline' : 'default'} 
                  className="w-full"
                  disabled={currentPlan === 'pro'}
                  onClick={() => setLocation('/pricing')}
                >
                  {currentPlan === 'pro' ? 'Plan Actual' : 'Seleccionar Plan'}
                </Button>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
      
      {/* Modal de llamada */}
      <CallModal 
        advisor={selectedAdvisor}
        open={modalOpen}
        onOpenChange={setModalOpen}
      />
    </div>
  );
}