import { motion } from "framer-motion";
import { useState } from "react";
import { MusicLoadingSpinner } from "@/components/ui/music-loading-spinner";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ProgressSteps } from "@/components/music-video/progress-steps";
import { Sparkles } from "lucide-react";

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
    <div className="min-h-screen bg-gradient-to-br from-background to-background/95 pt-10">
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
          <TabsList className="w-full grid grid-cols-2 mb-10">
            <TabsTrigger value="loaders" className="text-sm">
              Indicadores de Carga
            </TabsTrigger>
            <TabsTrigger value="progress" className="text-sm">
              Indicadores de Progreso
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
        </Tabs>
      </div>
    </div>
  );
}