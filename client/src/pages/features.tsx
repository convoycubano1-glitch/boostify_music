import React from "react";
import { motion } from "framer-motion";
import { Sparkles, Zap, Music, Video, Bot, LineChart, Share2, Globe, LucideIcon } from "lucide-react";
import { Header } from "../components/layout/header";
import { Footer } from "../components/layout/footer";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";

// Interfaces para nuestros tipos de datos
interface Feature {
  title: string;
  description: string;
  icon: LucideIcon;
  category: "music" | "video" | "ai" | "analytics" | "social" | "all";
  isPremium?: boolean;
}

interface CategoryTab {
  id: string;
  label: string;
  icon: LucideIcon;
}

// Pestañas de categorías para filtrar características
const categoryTabs: CategoryTab[] = [
  { id: "all", label: "Todas", icon: Sparkles },
  { id: "music", label: "Música", icon: Music },
  { id: "video", label: "Video", icon: Video },
  { id: "ai", label: "Inteligencia Artificial", icon: Bot },
  { id: "analytics", label: "Analítica", icon: LineChart },
  { id: "social", label: "Social", icon: Share2 },
];

// Lista de características con sus detalles
const features: Feature[] = [
  {
    title: "Generación de Música con IA",
    description: "Crea pistas musicales completas con nuestra avanzada IA. Personaliza estilo, género y ánimo.",
    icon: Music,
    category: "music",
    isPremium: true,
  },
  {
    title: "Creador de Videos Musicales",
    description: "Transforma tus canciones en videos musicales profesionales con plantillas y personalización total.",
    icon: Video,
    category: "video",
    isPremium: true,
  },
  {
    title: "IA Advisors",
    description: "Recibe consejos personalizados de expertos en la industria musical impulsados por IA.",
    icon: Bot,
    category: "ai",
    isPremium: true,
  },
  {
    title: "Análisis de Audiencia",
    description: "Comprende a tu audiencia con análisis detallados sobre demografía, comportamiento y preferencias.",
    icon: LineChart,
    category: "analytics",
  },
  {
    title: "Distribución Musical Global",
    description: "Distribuye tu música a todas las plataformas principales con un solo clic.",
    icon: Globe,
    category: "music",
  },
  {
    title: "Red Social Musical",
    description: "Conecta con otros artistas, productores y fans en nuestra plataforma social especializada.",
    icon: Share2,
    category: "social",
  },
  {
    title: "Masterización Automática",
    description: "Mejora la calidad de tus pistas con nuestras herramientas de masterización automatizada.",
    icon: Zap,
    category: "music",
  },
  {
    title: "Generación de Imágenes para Artistas",
    description: "Crea portadas de álbumes, fotos promocionales y arte visual con nuestra herramienta de IA.",
    icon: Bot,
    category: "ai",
    isPremium: true,
  },
  {
    title: "Analytics Avanzados",
    description: "Visualiza métricas avanzadas sobre el rendimiento de tu música y campañas de marketing.",
    icon: LineChart,
    category: "analytics",
    isPremium: true,
  },
  {
    title: "Generación de Videos con Texto",
    description: "Convierte tus descripciones textuales en videos de alta calidad automáticamente.",
    icon: Video,
    category: "video",
    isPremium: true,
  },
  {
    title: "Herramientas de Colaboración",
    description: "Trabaja en tiempo real con otros artistas y productores desde cualquier parte del mundo.",
    icon: Share2,
    category: "social",
  },
  {
    title: "Virtual Record Label",
    description: "Accede a servicios completos de sello discográfico virtual con promoción, distribución y más.",
    icon: Music,
    category: "music",
    isPremium: true,
  },
];

export default function FeaturesPage() {
  const [selectedCategory, setSelectedCategory] = React.useState("all");
  
  // Filtrar características basadas en la categoría seleccionada
  const filteredFeatures = features.filter(
    feature => selectedCategory === "all" || feature.category === selectedCategory
  );

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      
      <main className="flex-1">
        {/* Sección Hero */}
        <section className="py-16 md:py-24 px-4 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-orange-500/10 to-background z-0"></div>
          <div className="absolute inset-0 opacity-30 bg-[url('/assets/noise.svg')] z-0"></div>
          
          <div className="max-w-7xl mx-auto relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-center max-w-3xl mx-auto"
            >
              <Badge className="mb-4" variant="outline">Boostify Music</Badge>
              <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-orange-500 to-red-500">
                Potencia tu carrera musical con herramientas avanzadas
              </h1>
              <p className="text-lg text-muted-foreground mb-8">
                Descubre todas las características que Boostify Music ofrece para ayudarte a crear, promocionar y crecer en la industria musical.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600">
                  Comenzar ahora
                </Button>
                <Button size="lg" variant="outline">
                  Ver planes
                </Button>
              </div>
            </motion.div>
          </div>
        </section>
        
        {/* Sección de características */}
        <section className="py-16 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Características principales</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Explora nuestras potentes herramientas diseñadas para cada aspecto de tu carrera musical
              </p>
            </div>
            
            <Tabs defaultValue="all" className="w-full" onValueChange={setSelectedCategory}>
              <div className="flex justify-center mb-8">
                <TabsList className="grid grid-cols-3 md:grid-cols-6 gap-1">
                  {categoryTabs.map((tab) => (
                    <TabsTrigger key={tab.id} value={tab.id} className="flex items-center gap-2">
                      <tab.icon className="h-4 w-4" />
                      <span className="hidden md:inline">{tab.label}</span>
                    </TabsTrigger>
                  ))}
                </TabsList>
              </div>
              
              <TabsContent value={selectedCategory} className="mt-0">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredFeatures.map((feature, index) => (
                    <motion.div
                      key={feature.title}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                    >
                      <Card className="h-full border-border hover:border-orange-500/50 transition-colors">
                        <CardHeader className="pb-2">
                          <div className="flex justify-between items-start">
                            <div className="h-10 w-10 rounded-full bg-orange-500/10 flex items-center justify-center">
                              <feature.icon className="h-5 w-5 text-orange-500" />
                            </div>
                            {feature.isPremium && (
                              <Badge variant="outline" className="bg-orange-500/10 text-orange-500 border-orange-500/20">
                                Premium
                              </Badge>
                            )}
                          </div>
                          <CardTitle className="mt-4">{feature.title}</CardTitle>
                          <CardDescription>{feature.description}</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <Button variant="ghost" className="p-0 h-auto text-orange-500 hover:text-orange-600">
                            Saber más →
                          </Button>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </section>
        
        {/* Sección de llamada a la acción */}
        <section className="py-16 md:py-24 px-4 bg-orange-500/5 relative">
          <div className="absolute inset-0 opacity-30 bg-[url('/assets/noise.svg')] z-0"></div>
          <div className="max-w-7xl mx-auto relative z-10">
            <div className="text-center max-w-3xl mx-auto">
              <Badge className="mb-4 bg-orange-500/10 text-orange-500 border-orange-500/20">
                ¿Listo para empezar?
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Eleva tu música al siguiente nivel con Boostify
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                Únete a miles de artistas que ya están potenciando su carrera musical con nuestras herramientas.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600">
                  Comenzar ahora
                </Button>
                <Button size="lg" variant="outline">
                  Ver demo
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
}