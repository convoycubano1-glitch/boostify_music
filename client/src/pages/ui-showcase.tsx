import { motion } from "framer-motion";
import { useState } from "react";
import { MusicLoadingSpinner } from "@/components/ui/music-loading-spinner";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ProgressSteps } from "@/components/music-video/progress-steps";
import { PremiumButton } from "@/components/ui/premium-button";
import { AnimatedCard } from "@/components/ui/animated-card";
import { AudioVisualizer } from "@/components/ui/audio-visualizer";
import { 
  Sparkles, 
  Music2, 
  Play, 
  Crown, 
  Mic2, 
  Video, 
  Download, 
  ArrowRight, 
  Star, 
  Check 
} from "lucide-react";

export default function UIShowcase() {
  const [currentStep, setCurrentStep] = useState(1);
  
  const handleNextStep = () => {
    if (currentStep < 5) {
      setCurrentStep(prev => prev + 1);
    } else {
      setCurrentStep(1);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-background/95 pt-10 pb-20">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-10"
        >
          <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-500 to-orange-600 mb-2">
            Componentes Premium
          </h1>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Colección de componentes de interfaz con diseño premium para la plataforma
            de creación musical más avanzada del mundo.
          </p>
        </motion.div>

        <Tabs defaultValue="loaders" className="w-full max-w-4xl mx-auto">
          <TabsList className="w-full grid grid-cols-4 mb-10">
            <TabsTrigger value="loaders" className="text-sm">
              Indicadores de Carga
            </TabsTrigger>
            <TabsTrigger value="progress" className="text-sm">
              Indicadores de Progreso
            </TabsTrigger>
            <TabsTrigger value="buttons" className="text-sm">
              Botones Premium
            </TabsTrigger>
            <TabsTrigger value="cards" className="text-sm">
              Componentes Avanzados
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="loaders">
            <Card className="border-border bg-card/30 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-orange-500" /> 
                  <span>Indicadores de Carga</span>
                </CardTitle>
                <CardDescription>
                  Spinners especializados para indicar procesamiento de audio y música.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-10 place-items-center py-10">
                  <div className="flex flex-col items-center gap-8">
                    <MusicLoadingSpinner size="md" variant="default" />
                    <span className="text-sm text-muted-foreground">Default</span>
                  </div>
                  
                  <div className="flex flex-col items-center gap-8">
                    <MusicLoadingSpinner size="md" variant="subtle" />
                    <span className="text-sm text-muted-foreground">Subtle</span>
                  </div>
                  
                  <div className="flex flex-col items-center gap-8">
                    <MusicLoadingSpinner size="md" variant="premium" text="Procesando Audio" />
                    <span className="text-sm text-muted-foreground">Premium</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="progress">
            <Card className="border-border bg-card/30 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-orange-500" /> 
                  <span>Indicadores de Progreso</span>
                </CardTitle>
                <CardDescription>
                  Visualización premium del progreso en flujos de trabajo complejos.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-10">
                <ProgressSteps currentStep={currentStep} />
              </CardContent>
              <CardFooter className="flex justify-center pb-10">
                <Button 
                  onClick={handleNextStep}
                  className="bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white"
                >
                  Siguiente Paso
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
          
          <TabsContent value="buttons">
            <Card className="border-border bg-card/30 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-orange-500" /> 
                  <span>Botones Premium</span>
                </CardTitle>
                <CardDescription>
                  Botones con estilos premium y gradientes que resaltan las acciones importantes.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-10 py-10">
                  {/* Sección de variantes de botón */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-orange-500">Variantes</h3>
                    <div className="flex flex-wrap gap-4">
                      <PremiumButton variant="default">Default</PremiumButton>
                      <PremiumButton variant="vibrant">Vibrant</PremiumButton>
                      <PremiumButton variant="glow">Glow Effect</PremiumButton>
                      <PremiumButton variant="outline">Outline</PremiumButton>
                      <PremiumButton variant="ghost">Ghost</PremiumButton>
                      <PremiumButton variant="premium" sparkleAnimations>Premium</PremiumButton>
                    </div>
                  </div>
                  
                  {/* Sección de tamaños */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-orange-500">Tamaños</h3>
                    <div className="flex items-center flex-wrap gap-4">
                      <PremiumButton variant="premium" size="sm">Small</PremiumButton>
                      <PremiumButton variant="premium" size="md">Medium</PremiumButton>
                      <PremiumButton variant="premium" size="lg">Large</PremiumButton>
                      <PremiumButton variant="premium" size="xl">Extra Large</PremiumButton>
                    </div>
                  </div>
                  
                  {/* Sección de botones con iconos */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-orange-500">Con Iconos</h3>
                    <div className="flex flex-wrap gap-4">
                      <PremiumButton variant="premium" leftIcon={<Play />}>Reproducir</PremiumButton>
                      <PremiumButton variant="vibrant" leftIcon={<Crown />}>Premium</PremiumButton>
                      <PremiumButton variant="default" leftIcon={<Music2 />}>Música</PremiumButton>
                      <PremiumButton variant="glow" rightIcon={<ArrowRight />}>Continuar</PremiumButton>
                      <PremiumButton variant="outline" leftIcon={<Star />}>Destacar</PremiumButton>
                      <PremiumButton variant="premium" isSparkle>Crear</PremiumButton>
                    </div>
                  </div>
                  
                  {/* Sección de estados */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-orange-500">Estados</h3>
                    <div className="flex flex-wrap gap-4">
                      <PremiumButton variant="premium" disabled>Deshabilitado</PremiumButton>
                      <PremiumButton variant="premium" isLoading>Cargando...</PremiumButton>
                      <PremiumButton variant="premium" isLoading loadingText="Procesando">Enviar</PremiumButton>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="cards">
            <div className="space-y-10">
              {/* Tarjetas Animadas */}
              <Card className="border-border bg-card/30 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-orange-500" /> 
                    <span>Tarjetas Interactivas</span>
                  </CardTitle>
                  <CardDescription>
                    Tarjetas con animaciones premium y efectos interactivos al pasar el cursor.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-6">
                    <AnimatedCard
                      title="Grabación de Voz"
                      description="Tecnología AI para grabar voces con calidad profesional"
                      icon={Mic2}
                      hoverEffect="lift"
                      variant="premium"
                    >
                      <div className="flex flex-col gap-2 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-green-500" />
                          <span>Reducción de ruido</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-green-500" />
                          <span>Ecualización automática</span>
                        </div>
                      </div>
                    </AnimatedCard>
                    
                    <AnimatedCard
                      title="Creación de Videos"
                      description="Genera videos de alta calidad a partir de tu música"
                      icon={Video}
                      hoverEffect="glow"
                      variant="default"
                    >
                      <div className="flex flex-col gap-2 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-green-500" />
                          <span>Sincronización automática</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-green-500" />
                          <span>Estilos personalizables</span>
                        </div>
                      </div>
                    </AnimatedCard>
                    
                    <AnimatedCard
                      title="Mastering Premium"
                      description="Finalización profesional para tus canciones"
                      icon={Music2}
                      hoverEffect="scale"
                      variant="gradient"
                      imageUrl="/assets/mastering-bg.svg"
                      footer={
                        <Button className="w-full" variant="outline">
                          <Crown className="mr-2 h-4 w-4 text-orange-400" />
                          <span>Upgrade</span>
                        </Button>
                      }
                    >
                      <div className="flex flex-col gap-2 text-sm text-foreground/90">
                        <div className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-orange-400" />
                          <span>Calidad de estudio</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-orange-400" />
                          <span>Formato listo para distribución</span>
                        </div>
                      </div>
                    </AnimatedCard>
                  </div>
                </CardContent>
              </Card>
              
              {/* Audio Visualizer */}
              <Card className="border-border bg-card/30 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-orange-500" /> 
                    <span>Controles de Audio</span>
                  </CardTitle>
                  <CardDescription>
                    Controles de audio con visualizaciones de ondas y estilos premium.
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center gap-6 py-8">
                  {/* Visualizador estándar */}
                  <AudioVisualizer 
                    audioUrl="/assets/demo-track.mp3"
                    title="Dreamscape Journey"
                    artist="Electronic Vibes"
                    theme="default"
                  />
                  
                  {/* Visualizador premium con cubierta */}
                  <AudioVisualizer 
                    audioUrl="/assets/demo-track.mp3"
                    title="Summer Breeze (Extended Mix)"
                    artist="Tropical House Masters"
                    coverImage="/assets/album-cover.svg"
                    theme="premium"
                  />
                  
                  {/* Visualizador minimalista */}
                  <AudioVisualizer 
                    audioUrl="/assets/demo-track.mp3"
                    title="Midnight Serenade"
                    artist="Acoustic Sessions"
                    theme="minimal"
                  />
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}