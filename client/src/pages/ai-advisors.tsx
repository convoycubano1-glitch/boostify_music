/**
 * AI Advisors Page with Subscription Plans
 * 
 * This page allows users to get professional advice
 * based on their current subscription plan.
 * 
 * Enhanced with sophisticated UI elements, animations, and particle effects.
 */

import { useState, useEffect, useRef } from 'react';
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
  
  // Componente de efecto de partículas
const ParticleBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Ajustar el tamaño del canvas
    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    
    window.addEventListener('resize', handleResize);
    handleResize();
    
    // Crear partículas
    const particlesArray: any[] = [];
    const numberOfParticles = 80;
    
    class Particle {
      x: number;
      y: number;
      size: number;
      speedX: number;
      speedY: number;
      color: string;
      
      constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * 3 + 1;
        this.speedX = Math.random() * 1 - 0.5;
        this.speedY = Math.random() * 1 - 0.5;
        this.color = `hsla(${Math.random() * 60 + 200}, 100%, 50%, 0.8)`;
      }
      
      update() {
        this.x += this.speedX;
        this.y += this.speedY;
        
        if (this.x > canvas.width) this.x = 0;
        else if (this.x < 0) this.x = canvas.width;
        if (this.y > canvas.height) this.y = 0;
        else if (this.y < 0) this.y = canvas.height;
      }
      
      draw() {
        if (!ctx) return;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    
    const init = () => {
      for (let i = 0; i < numberOfParticles; i++) {
        particlesArray.push(new Particle());
      }
    };
    
    const connect = () => {
      if (!ctx) return;
      const maxDistance = 150;
      
      for (let a = 0; a < particlesArray.length; a++) {
        for (let b = a; b < particlesArray.length; b++) {
          const dx = particlesArray[a].x - particlesArray[b].x;
          const dy = particlesArray[a].y - particlesArray[b].y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance < maxDistance) {
            const opacity = 1 - distance / maxDistance;
            ctx.strokeStyle = `rgba(140, 85, 250, ${opacity * 0.5})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(particlesArray[a].x, particlesArray[a].y);
            ctx.lineTo(particlesArray[b].x, particlesArray[b].y);
            ctx.stroke();
          }
        }
      }
    };
    
    const animate = () => {
      if (!ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      for (let i = 0; i < particlesArray.length; i++) {
        particlesArray[i].update();
        particlesArray[i].draw();
      }
      
      connect();
      requestAnimationFrame(animate);
    };
    
    init();
    animate();
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);
  
  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 z-0 pointer-events-none opacity-30"
    />
  );
};

// Efecto de texto animado para el título
const AnimatedTitle = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="relative overflow-hidden">
      <h1 className="text-4xl md:text-5xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-purple-600 via-blue-500 to-indigo-400 animate-gradient-x pb-1">
        {children}
      </h1>
    </div>
  );
};

return (
    <div className="container max-w-6xl py-6 md:py-10 space-y-6 relative">
      <ParticleBackground />
      {/* Cabecera */}
      <div className="space-y-4 relative z-10">
        <AnimatedTitle>AI Advisors</AnimatedTitle>
        <p className="text-muted-foreground text-lg max-w-2xl">
          Contact specialized advisors in the music industry to boost your career
        </p>
      </div>
      
      {/* Introducción/Banner */}
      <div className="mb-8 p-6 bg-gradient-to-r from-primary/10 via-background to-blue-500/10 rounded-xl border border-muted/60 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern-light opacity-10 pointer-events-none"></div>
        
        {/* Efecto de partículas decorativas */}
        <div className="absolute top-10 right-10 w-20 h-20 bg-primary/10 rounded-full blur-xl"></div>
        <div className="absolute bottom-12 left-32 w-16 h-16 bg-blue-400/10 rounded-full blur-lg"></div>
        
        <div className="relative z-10 md:max-w-3xl">
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-2">Expert guidance at your fingertips</h2>
          <p className="text-muted-foreground text-lg mb-4">
            Connect with specialized AI advisors to get personalized insights and advice for your music career. Our advisors combine deep industry expertise with AI-powered analytics to help you make informed decisions.
          </p>
          
          <div className="flex flex-wrap gap-3 mt-4">
            <div className="bg-card/50 backdrop-blur-sm px-3 py-1.5 rounded-full border border-border/50 flex items-center text-sm">
              <Phone className="mr-2 h-3.5 w-3.5 text-primary" />
              One-on-one calls
            </div>
            <div className="bg-card/50 backdrop-blur-sm px-3 py-1.5 rounded-full border border-border/50 flex items-center text-sm">
              <Users className="mr-2 h-3.5 w-3.5 text-primary" />
              10 specialized experts
            </div>
            <div className="bg-card/50 backdrop-blur-sm px-3 py-1.5 rounded-full border border-border/50 flex items-center text-sm">
              <TrendingUp className="mr-2 h-3.5 w-3.5 text-primary" />
              Data-driven insights
            </div>
          </div>
        </div>
      </div>
      
      {/* Pestañas mejoradas */}
      <Tabs defaultValue="advisors" className="w-full">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6">
          <div className="flex items-center">
            <TabsList className="p-1 bg-muted/60">
              <TabsTrigger value="advisors" className="rounded-md data-[state=active]:bg-card data-[state=active]:shadow-sm text-sm px-4">
                <Phone className="mr-2 h-4 w-4" />
                Advisors
              </TabsTrigger>
              <TabsTrigger value="history" className="rounded-md data-[state=active]:bg-card data-[state=active]:shadow-sm text-sm px-4">
                <MessageSquare className="mr-2 h-4 w-4" />
                History
              </TabsTrigger>
              <TabsTrigger value="plans" className="rounded-md data-[state=active]:bg-card data-[state=active]:shadow-sm text-sm px-4">
                <BookOpen className="mr-2 h-4 w-4" />
                Plans
              </TabsTrigger>
            </TabsList>
          </div>
          
          {/* Badge de plan actual */}
          <div className="flex items-center gap-1.5">
            <span className="text-sm text-muted-foreground">Current subscription:</span>
            <Badge 
              variant={
                currentPlan === 'premium' ? 'default' : 
                currentPlan === 'pro' ? 'secondary' : 
                currentPlan === 'basic' ? 'outline' : 
                'secondary'
              }
              className="py-1.5 font-medium uppercase tracking-wide"
            >
              {currentPlan.toUpperCase()} PLAN
            </Badge>
          </div>
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
                  {advisors.map((advisor, index) => (
                    <div 
                      key={advisor.id}
                      className="transition-all duration-500"
                      style={{ 
                        opacity: 0,
                        animation: 'fadeIn 0.5s forwards',
                        animationDelay: `${index * 0.1}s`
                      }}
                    >
                      <Card 
                        className="overflow-hidden advisor-card group hover:shadow-lg transition-all duration-500 relative border-[1.5px] glow-on-hover"
                      >
                        {/* Efecto de partículas en la esquina */}
                        <div className="absolute top-0 right-0 w-32 h-32 opacity-30 pointer-events-none">
                          <div className="absolute right-0 top-0 w-16 h-16 rounded-full bg-gradient-to-br from-white/5 to-white/20 blur-md"></div>
                          <div className="absolute right-6 top-6 w-4 h-4 rounded-full bg-white/30 blur-sm animate-pulse-slow"></div>
                          <div className="absolute right-10 top-2 w-2 h-2 rounded-full bg-white/40 blur-sm animate-pulse-slow delay-700"></div>
                        </div>
                        
                        <CardHeader className={`pb-2 bg-gradient-to-br ${advisor.color} relative`}>
                          <div className="absolute inset-0 bg-black/20 backdrop-blur-[1px]" />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                          
                          <div className="relative z-10 flex justify-between items-start">
                            <div>
                              <CardTitle className="text-white text-xl drop-shadow-md">{advisor.name}</CardTitle>
                              <CardDescription className="text-white/90 drop-shadow-sm">
                                {advisor.title}
                              </CardDescription>
                            </div>
                            <div className="p-3 rounded-full bg-white/20 backdrop-blur-md shadow-lg group-hover:scale-110 transition-transform duration-300">
                              <advisor.icon className="h-5 w-5 text-white" />
                            </div>
                          </div>
                        </CardHeader>
                        
                        <CardContent className="pt-4 pb-3">
                          <p className="text-sm leading-relaxed">{advisor.description}</p>
                        </CardContent>
                        
                        <CardFooter className="border-t pt-3">
                          <Button 
                            className="w-full group-hover:bg-opacity-90 transition-all duration-300 relative overflow-hidden" 
                            onClick={() => handleAdvisorClick(advisor)}
                            disabled={calling}
                          >
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                            <Phone className="mr-2 h-4 w-4" />
                            <span>{calling ? 'Calling...' : 'Call now'}</span>
                          </Button>
                        </CardFooter>
                      </Card>
                    </div>
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
            {/* Plan Free con efectos visuales */}
            <Card className={`border-2 relative overflow-hidden ${currentPlan === 'free' ? 'border-primary' : 'border-transparent'}`}>
              {/* Efecto sutil de fondo */}
              <div className="absolute -bottom-16 -left-16 w-32 h-32 bg-gradient-to-tr from-blue-300/10 to-transparent rounded-full blur-xl"></div>
              
              <CardHeader className="relative z-10">
                <CardTitle className="text-2xl font-bold">Free Plan</CardTitle>
                <CardDescription className="text-base">Basic AI advisors access</CardDescription>
                <div className="mt-3 flex items-end">
                  <span className="text-4xl font-extrabold">$0</span>
                  <span className="text-muted-foreground ml-1 mb-1">/month</span>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-5 relative z-10">
                <div className="space-y-3">
                  <div className="flex items-center">
                    <div className="w-4 h-4 rounded-full bg-primary/20 flex items-center justify-center mr-2">
                      <div className="w-2 h-2 rounded-full bg-primary" />
                    </div>
                    <span>3 monthly calls</span>
                  </div>
                  
                  <div className="flex items-center">
                    <div className="w-4 h-4 rounded-full bg-primary/20 flex items-center justify-center mr-2">
                      <div className="w-2 h-2 rounded-full bg-primary" />
                    </div>
                    <span>Access to 1 advisor</span>
                  </div>
                  
                  <div className="flex items-center">
                    <div className="w-4 h-4 rounded-full bg-primary/20 flex items-center justify-center mr-2">
                      <div className="w-2 h-2 rounded-full bg-primary" />
                    </div>
                    <span>Maximum duration: 5 minutes</span>
                  </div>
                </div>
                
                <Separator />
                
                <div className="space-y-2">
                  <p className="font-semibold text-sm flex items-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary mr-2"></div>
                    Available advisors:
                  </p>
                  <div className="text-sm">
                    <span className="inline-block w-1 h-1 rounded-full bg-primary mr-2"></span>
                    Sarah Mills (Publicist)
                  </div>
                </div>
              </CardContent>
              
              <CardFooter className="relative z-10">
                <Button 
                  variant={currentPlan === 'free' ? 'outline' : 'default'} 
                  className="w-full relative group overflow-hidden"
                  disabled={currentPlan === 'free'}
                  onClick={() => setLocation('/pricing')}
                >
                  <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out"></div>
                  <span className="relative z-10">
                    {currentPlan === 'free' ? 'Current Plan' : 'Select Plan'}
                  </span>
                </Button>
              </CardFooter>
            </Card>
            
            {/* Plan Basic con efectos visuales */}
            <Card className={`border-2 relative overflow-hidden ${currentPlan === 'basic' ? 'border-primary' : 'border-transparent'}`}>
              {/* Efectos de fondo */}
              <div className="absolute -top-24 -right-24 w-36 h-36 bg-gradient-to-bl from-cyan-400/10 to-transparent rounded-full blur-xl"></div>
              <div className="absolute -bottom-16 -left-16 w-32 h-32 bg-gradient-to-tr from-blue-400/10 to-transparent rounded-full blur-xl"></div>
              
              <CardHeader className="relative z-10">
                <CardTitle className="text-2xl font-bold">Basic Plan</CardTitle>
                <CardDescription className="text-base">For emerging artists</CardDescription>
                <div className="mt-3 flex items-end">
                  <span className="text-4xl font-extrabold">$9.99</span>
                  <span className="text-muted-foreground ml-1 mb-1">/month</span>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-5 relative z-10">
                <div className="space-y-3">
                  <div className="flex items-center border-l-4 border-blue-400/40 pl-3 py-1 bg-gradient-to-r from-blue-400/5 to-transparent rounded-sm">
                    <div className="w-4 h-4 rounded-full bg-primary/20 flex items-center justify-center mr-2">
                      <div className="w-2 h-2 rounded-full bg-primary" />
                    </div>
                    <span className="font-medium">10 monthly calls</span>
                  </div>
                  
                  <div className="flex items-center">
                    <div className="w-4 h-4 rounded-full bg-primary/20 flex items-center justify-center mr-2">
                      <div className="w-2 h-2 rounded-full bg-primary" />
                    </div>
                    <span>Access to 3 advisors</span>
                  </div>
                  
                  <div className="flex items-center">
                    <div className="w-4 h-4 rounded-full bg-primary/20 flex items-center justify-center mr-2">
                      <div className="w-2 h-2 rounded-full bg-primary" />
                    </div>
                    <span>Maximum duration: 10 minutes</span>
                  </div>
                </div>
                
                <Separator />
                
                <div className="space-y-2">
                  <p className="font-semibold text-sm flex items-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary mr-2"></div>
                    Available advisors:
                  </p>
                  <div className="grid grid-cols-1 gap-2">
                    <div className="text-sm flex items-center">
                      <span className="inline-block w-1 h-1 rounded-full bg-primary mr-2"></span>
                      Sarah Mills (Publicist)
                    </div>
                    <div className="text-sm flex items-center">
                      <span className="inline-block w-1 h-1 rounded-full bg-primary mr-2"></span>
                      Emily Rodríguez (Creative Director)
                    </div>
                    <div className="text-sm flex items-center">
                      <span className="inline-block w-1 h-1 rounded-full bg-primary mr-2"></span>
                      Lucia González (Artist Support)
                    </div>
                  </div>
                </div>
              </CardContent>
              
              <CardFooter className="relative z-10">
                <Button 
                  variant={currentPlan === 'basic' ? 'outline' : 'default'} 
                  className="w-full relative group overflow-hidden"
                  disabled={currentPlan === 'basic'}
                  onClick={() => setLocation('/pricing')}
                >
                  <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out"></div>
                  <span className="relative z-10">
                    {currentPlan === 'basic' ? 'Current Plan' : 'Select Plan'}
                  </span>
                </Button>
              </CardFooter>
            </Card>
            
            {/* Plan Pro - Versión mejorada con efectos visuales */}
            <Card className={`border-2 relative overflow-hidden ${currentPlan === 'pro' ? 'border-primary' : 'border-transparent'}`}>
              {/* Efecto de resplandor superior */}
              <div className="absolute -top-24 -right-24 w-48 h-48 bg-gradient-to-br from-primary/20 via-primary/10 to-transparent rounded-full blur-xl"></div>
              <div className="absolute -bottom-16 -left-16 w-40 h-40 bg-gradient-to-tr from-blue-500/20 to-transparent rounded-full blur-xl"></div>
              
              {/* Insignia de recomendado con efecto especial */}
              <div className="absolute -top-1 -right-1 rotate-12">
                <div className="relative">
                  <Badge 
                    variant="default" 
                    className="px-3 py-1.5 font-semibold uppercase text-xs tracking-wide shadow-md relative z-10"
                  >
                    Recommended
                  </Badge>
                  <div className="absolute inset-0 bg-primary/20 rounded-sm blur-sm -z-0 scale-110"></div>
                </div>
              </div>
              
              <CardHeader className="relative z-10">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-2xl font-bold flex items-center">
                      Pro Plan
                      <div className="inline-block ml-2 w-2 h-2 rounded-full bg-primary animate-pulse"></div>
                    </CardTitle>
                    <CardDescription className="text-base">For professional artists</CardDescription>
                  </div>
                </div>
                <div className="mt-3 flex items-end">
                  <span className="text-4xl font-extrabold">$29.99</span>
                  <span className="text-muted-foreground ml-1 mb-1">/month</span>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-5 relative z-10">
                <div className="space-y-3">
                  {/* Elemento destacado con un borde especial */}
                  <div className="flex items-center border-l-4 border-primary pl-3 py-1 bg-gradient-to-r from-primary/5 to-transparent rounded-sm">
                    <div className="w-4 h-4 rounded-full bg-primary/20 flex items-center justify-center mr-2">
                      <div className="w-2 h-2 rounded-full bg-primary" />
                    </div>
                    <span className="font-medium">30 monthly calls</span>
                  </div>
                  
                  <div className="flex items-center">
                    <div className="w-4 h-4 rounded-full bg-primary/20 flex items-center justify-center mr-2">
                      <div className="w-2 h-2 rounded-full bg-primary" />
                    </div>
                    <span>Access to all advisors</span>
                  </div>
                  
                  <div className="flex items-center">
                    <div className="w-4 h-4 rounded-full bg-primary/20 flex items-center justify-center mr-2">
                      <div className="w-2 h-2 rounded-full bg-primary" />
                    </div>
                    <span>Maximum duration: 20 minutes</span>
                  </div>
                  
                  <div className="flex items-center">
                    <div className="w-4 h-4 rounded-full bg-primary/20 flex items-center justify-center mr-2">
                      <div className="w-2 h-2 rounded-full bg-primary" />
                    </div>
                    <span>Call history export</span>
                  </div>
                  
                  <div className="flex items-center">
                    <div className="w-4 h-4 rounded-full bg-primary/20 flex items-center justify-center mr-2">
                      <div className="w-2 h-2 rounded-full bg-primary" />
                    </div>
                    <span>Priority support</span>
                  </div>
                </div>
                
                <Separator />
                
                <div className="space-y-2">
                  <p className="font-semibold text-sm flex items-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary mr-2"></div>
                    Featured advisors:
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="text-sm flex items-center">
                      <span className="inline-block w-1 h-1 rounded-full bg-primary mr-2"></span>
                      Mark Johnson (Manager)
                    </div>
                    <div className="text-sm flex items-center">
                      <span className="inline-block w-1 h-1 rounded-full bg-primary mr-2"></span>
                      David Williams (Producer)
                    </div>
                    <div className="text-sm flex items-center">
                      <span className="inline-block w-1 h-1 rounded-full bg-primary mr-2"></span>
                      Alicia Torres (Marketing)
                    </div>
                    <div className="text-sm flex items-center">
                      <span className="inline-block w-1 h-1 rounded-full bg-primary mr-2"></span>
                      All 10 music advisors
                    </div>
                  </div>
                </div>
              </CardContent>
              
              <CardFooter className="relative z-10">
                <Button 
                  variant={currentPlan === 'pro' ? 'outline' : 'default'} 
                  className="w-full relative group overflow-hidden"
                  disabled={currentPlan === 'pro'}
                  onClick={() => setLocation('/pricing')}
                >
                  {/* Efecto de brillo animado en hover */}
                  <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out"></div>
                  <span className="relative z-10">
                    {currentPlan === 'pro' ? 'Current Plan' : 'Select Plan'}
                  </span>
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