import { useState } from "react";
import { Header } from "@/components/layout/header";
import { ImageStyleAdvisor } from "@/components/image-advisor/image-style-advisor";
import { VirtualTryOnComponent } from "@/components/kling/tryon-component";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, Sparkles, Camera, Palette, Music2, TrendingUp, Image as ImageIcon, Star, ArrowLeft, Shirt } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.3
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

export default function ArtistImageAdvisorPage() {
  const [activeTab, setActiveTab] = useState("upload");
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Navigation */}
      <div className="container mx-auto px-4 py-4">
        <Button 
          variant="ghost" 
          onClick={() => setLocation("/")}
          className="text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Home
        </Button>
      </div>

      <main className="container mx-auto px-4 py-8 md:py-12">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center space-y-4 mb-12"
        >
          <h1 className="text-3xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-500 to-red-500">
            AI-Powered Image Advisor
          </h1>
          <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
            Transform your artist image with cutting-edge AI technology. Get personalized style recommendations and visualize your perfect look.
          </p>
        </motion.div>

        {/* Features Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-12"
        >
          <motion.div variants={itemVariants}>
            <Card className="p-6 border-orange-500/20 bg-black/40 backdrop-blur-sm hover:bg-black/50 transition-colors">
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 rounded-full bg-orange-500/10 flex items-center justify-center">
                  <Camera className="h-6 w-6 text-orange-500" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">AI Analysis</h3>
                  <p className="text-sm text-muted-foreground">
                    Get instant style feedback and personalized recommendations
                  </p>
                </div>
              </div>
            </Card>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Card className="p-6 border-orange-500/20 bg-black/40 backdrop-blur-sm hover:bg-black/50 transition-colors">
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 rounded-full bg-orange-500/10 flex items-center justify-center">
                  <Sparkles className="h-6 w-6 text-orange-500" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">Style Generation</h3>
                  <p className="text-sm text-muted-foreground">
                    Transform your vision into reality with AI-powered suggestions
                  </p>
                </div>
              </div>
            </Card>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Card className="p-6 border-orange-500/20 bg-black/40 backdrop-blur-sm hover:bg-black/50 transition-colors">
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 rounded-full bg-orange-500/10 flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-orange-500" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">Brand Growth</h3>
                  <p className="text-sm text-muted-foreground">
                    Optimize your image impact and grow your audience
                  </p>
                </div>
              </div>
            </Card>
          </motion.div>
        </motion.div>

        {/* Main Interface */}
        <Card className="border-orange-500/20 bg-black/40 backdrop-blur-sm overflow-hidden">
          <Tabs value={activeTab} onValueChange={handleTabChange}>
            <div className="sticky top-0 z-30 bg-black/60 backdrop-blur-sm border-b border-orange-500/20 px-4 py-2">
              <TabsList className="w-full grid grid-cols-3 md:grid-cols-5 gap-2 max-w-3xl mx-auto">
                <TabsTrigger 
                  value="upload" 
                  className="flex items-center gap-2 data-[state=active]:bg-orange-500"
                >
                  <Upload className="h-4 w-4" />
                  <span className="hidden md:inline">Upload</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="style" 
                  className="flex items-center gap-2 data-[state=active]:bg-orange-500"
                >
                  <Music2 className="h-4 w-4" />
                  <span className="hidden md:inline">Style</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="virtual-tryon" 
                  className="flex items-center gap-2 data-[state=active]:bg-orange-500"
                >
                  <Shirt className="h-4 w-4" />
                  <span className="hidden md:inline">Try On</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="generate" 
                  className="flex items-center gap-2 data-[state=active]:bg-orange-500"
                >
                  <ImageIcon className="h-4 w-4" />
                  <span className="hidden md:inline">Generate</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="results" 
                  className="flex items-center gap-2 data-[state=active]:bg-orange-500"
                >
                  <Star className="h-4 w-4" />
                  <span className="hidden md:inline">Results</span>
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="p-4 md:p-8">
              <TabsContent value="upload" className="mt-0">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <ImageStyleAdvisor />
                </motion.div>
              </TabsContent>
              
              <TabsContent value="style" className="mt-0">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <div className="space-y-6">
                    <div className="text-center mb-6">
                      <h2 className="text-2xl font-bold">Music Style Analysis</h2>
                      <p className="text-muted-foreground">
                        Analiza cómo tu género musical influye en tu imagen visual como artista
                      </p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <Card className="p-6 backdrop-blur-sm border-orange-500/20">
                        <div className="space-y-4">
                          <h3 className="text-xl font-semibold flex items-center gap-2">
                            <Palette className="h-5 w-5 text-orange-500" /> 
                            Paletas de Color Recomendadas
                          </h3>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-2">
                              <div className="h-20 rounded-md bg-gradient-to-r from-purple-500 to-blue-600"></div>
                              <p className="text-xs text-center">Rock Alternativo</p>
                            </div>
                            <div className="space-y-2">
                              <div className="h-20 rounded-md bg-gradient-to-r from-amber-500 to-pink-600"></div>
                              <p className="text-xs text-center">Pop Moderno</p>
                            </div>
                            <div className="space-y-2">
                              <div className="h-20 rounded-md bg-gradient-to-r from-emerald-500 to-cyan-600"></div>
                              <p className="text-xs text-center">Electrónica</p>
                            </div>
                            <div className="space-y-2">
                              <div className="h-20 rounded-md bg-gradient-to-r from-stone-600 to-neutral-900"></div>
                              <p className="text-xs text-center">Hip-Hop Urbano</p>
                            </div>
                          </div>
                        </div>
                      </Card>
                      
                      <Card className="p-6 backdrop-blur-sm border-orange-500/20">
                        <div className="space-y-4">
                          <h3 className="text-xl font-semibold flex items-center gap-2">
                            <TrendingUp className="h-5 w-5 text-orange-500" /> 
                            Tendencias en Imagen
                          </h3>
                          <ul className="space-y-2 text-sm">
                            <li className="flex items-start gap-2">
                              <div className="h-5 w-5 rounded-full bg-orange-500/20 flex-shrink-0 mt-0.5 flex items-center justify-center">
                                <span className="text-orange-500 text-xs">1</span>
                              </div>
                              <p>Minimalismo en alta definición con contraste potente</p>
                            </li>
                            <li className="flex items-start gap-2">
                              <div className="h-5 w-5 rounded-full bg-orange-500/20 flex-shrink-0 mt-0.5 flex items-center justify-center">
                                <span className="text-orange-500 text-xs">2</span>
                              </div>
                              <p>Fusión de estéticas retro con elementos futuristas</p>
                            </li>
                            <li className="flex items-start gap-2">
                              <div className="h-5 w-5 rounded-full bg-orange-500/20 flex-shrink-0 mt-0.5 flex items-center justify-center">
                                <span className="text-orange-500 text-xs">3</span>
                              </div>
                              <p>Estética visual coherente entre plataformas digitales</p>
                            </li>
                            <li className="flex items-start gap-2">
                              <div className="h-5 w-5 rounded-full bg-orange-500/20 flex-shrink-0 mt-0.5 flex items-center justify-center">
                                <span className="text-orange-500 text-xs">4</span>
                              </div>
                              <p>Narrativas visuales que complementan la historia musical</p>
                            </li>
                          </ul>
                        </div>
                      </Card>
                    </div>
                  </div>
                </motion.div>
              </TabsContent>
              
              <TabsContent value="virtual-tryon" className="mt-0">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <div className="space-y-6">
                    <div className="text-center mb-6">
                      <h2 className="text-2xl font-bold">Virtual Try-On</h2>
                      <p className="text-muted-foreground">
                        Prueba prendas virtualmente para visualizar tu estilo perfecto como artista
                      </p>
                    </div>
                    <VirtualTryOnComponent />
                  </div>
                </motion.div>
              </TabsContent>
              
              <TabsContent value="generate" className="mt-0">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <div className="space-y-6">
                    <div className="text-center mb-6">
                      <h2 className="text-2xl font-bold">Generación de Imagen Artística</h2>
                      <p className="text-muted-foreground">
                        Crea nuevas imágenes para tu proyecto artístico basadas en tus preferencias
                      </p>
                    </div>
                    <Card className="p-6 backdrop-blur-sm border-orange-500/20">
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-4">
                            <Label htmlFor="prompt">Describe tu imagen ideal</Label>
                            <textarea 
                              id="prompt" 
                              className="w-full h-32 p-3 bg-black/40 border border-orange-500/20 rounded-md focus:border-orange-500 focus:ring focus:ring-orange-500/20 focus:outline-none"
                              placeholder="Describe tu visión artística en detalle. Por ejemplo: Un retrato artístico de un músico en un estudio, con iluminación dramática azul y roja, estilo cyberpunk, fotografía profesional de alta calidad."
                            ></textarea>
                            
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label htmlFor="style">Estilo</Label>
                                <Select defaultValue="cinematic">
                                  <SelectTrigger id="style">
                                    <SelectValue placeholder="Seleccionar estilo" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="cinematic">Cinematográfico</SelectItem>
                                    <SelectItem value="photorealistic">Fotorealista</SelectItem>
                                    <SelectItem value="artistic">Artístico</SelectItem>
                                    <SelectItem value="cyberpunk">Cyberpunk</SelectItem>
                                    <SelectItem value="vintage">Vintage</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="aspect">Proporción</Label>
                                <Select defaultValue="square">
                                  <SelectTrigger id="aspect">
                                    <SelectValue placeholder="Seleccionar proporción" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="square">Cuadrada (1:1)</SelectItem>
                                    <SelectItem value="portrait">Vertical (3:4)</SelectItem>
                                    <SelectItem value="landscape">Horizontal (16:9)</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                            
                            <Button className="w-full bg-orange-500 hover:bg-orange-600">
                              <Sparkles className="h-4 w-4 mr-2" />
                              Generar Imagen
                            </Button>
                          </div>
                          
                          <div className="flex flex-col items-center justify-center border-2 border-dashed border-orange-500/20 rounded-md p-4 bg-black/20 h-full min-h-[300px]">
                            <div className="text-center space-y-3">
                              <ImageIcon className="h-10 w-10 text-orange-500/50 mx-auto" />
                              <p className="text-muted-foreground">Tu imagen generada aparecerá aquí</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Card>
                  </div>
                </motion.div>
              </TabsContent>
              
              <TabsContent value="results" className="mt-0">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <div className="space-y-6">
                    <div className="text-center mb-6">
                      <h2 className="text-2xl font-bold">Resultados y Recomendaciones</h2>
                      <p className="text-muted-foreground">
                        Resumen de análisis y recomendaciones personalizadas para tu imagen artística
                      </p>
                    </div>
                    
                    <div className="space-y-6">
                      <Card className="p-6 backdrop-blur-sm border-orange-500/20">
                        <div className="space-y-4">
                          <h3 className="text-xl font-semibold flex items-center gap-2">
                            <Star className="h-5 w-5 text-orange-500" /> 
                            Análisis de Imagen Actual
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="md:col-span-1">
                              <div className="aspect-square bg-black/40 rounded-md overflow-hidden">
                                <div className="bg-gradient-to-br from-orange-500/10 to-red-500/10 h-full w-full flex items-center justify-center">
                                  <Camera className="h-12 w-12 text-orange-500/40" />
                                </div>
                              </div>
                            </div>
                            <div className="md:col-span-2 space-y-3">
                              <div className="space-y-1">
                                <div className="flex justify-between text-sm">
                                  <span>Coherencia con el género</span>
                                  <span>78%</span>
                                </div>
                                <div className="h-2 bg-black/40 rounded-full overflow-hidden">
                                  <div className="h-full bg-orange-500 rounded-full" style={{ width: '78%' }}></div>
                                </div>
                              </div>
                              <div className="space-y-1">
                                <div className="flex justify-between text-sm">
                                  <span>Profesionalismo</span>
                                  <span>65%</span>
                                </div>
                                <div className="h-2 bg-black/40 rounded-full overflow-hidden">
                                  <div className="h-full bg-orange-500 rounded-full" style={{ width: '65%' }}></div>
                                </div>
                              </div>
                              <div className="space-y-1">
                                <div className="flex justify-between text-sm">
                                  <span>Originalidad</span>
                                  <span>82%</span>
                                </div>
                                <div className="h-2 bg-black/40 rounded-full overflow-hidden">
                                  <div className="h-full bg-orange-500 rounded-full" style={{ width: '82%' }}></div>
                                </div>
                              </div>
                              <div className="space-y-1">
                                <div className="flex justify-between text-sm">
                                  <span>Impacto visual</span>
                                  <span>70%</span>
                                </div>
                                <div className="h-2 bg-black/40 rounded-full overflow-hidden">
                                  <div className="h-full bg-orange-500 rounded-full" style={{ width: '70%' }}></div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </Card>
                      
                      <Card className="p-6 backdrop-blur-sm border-orange-500/20">
                        <div className="space-y-4">
                          <h3 className="text-xl font-semibold">Recomendaciones Finales</h3>
                          <ul className="space-y-3">
                            <li className="flex items-start gap-3 p-2 rounded-md bg-orange-500/5 border border-orange-500/10">
                              <div className="mt-0.5 text-orange-500">
                                <Sparkles className="h-5 w-5" />
                              </div>
                              <div>
                                <p className="font-medium">Mejora la coherencia visual</p>
                                <p className="text-sm text-muted-foreground">Establece una paleta de colores consistente en todas tus imágenes y plataformas digitales.</p>
                              </div>
                            </li>
                            <li className="flex items-start gap-3 p-2 rounded-md bg-orange-500/5 border border-orange-500/10">
                              <div className="mt-0.5 text-orange-500">
                                <Shirt className="h-5 w-5" />
                              </div>
                              <div>
                                <p className="font-medium">Experimenta con la funcionalidad Try-On</p>
                                <p className="text-sm text-muted-foreground">Utiliza la herramienta de Virtual Try-On para explorar diferentes estilos de vestimenta que potencien tu imagen artística.</p>
                              </div>
                            </li>
                            <li className="flex items-start gap-3 p-2 rounded-md bg-orange-500/5 border border-orange-500/10">
                              <div className="mt-0.5 text-orange-500">
                                <Camera className="h-5 w-5" />
                              </div>
                              <div>
                                <p className="font-medium">Invierte en fotografía profesional</p>
                                <p className="text-sm text-muted-foreground">El análisis sugiere que unas sesiones de fotos profesionales mejorarían significativamente tu presencia visual.</p>
                              </div>
                            </li>
                          </ul>
                        </div>
                      </Card>
                      
                      <div className="flex justify-center">
                        <Button className="bg-orange-500 hover:bg-orange-600">
                          Descargar Informe Completo
                        </Button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </TabsContent>
            </div>
          </Tabs>
        </Card>
      </main>
    </div>
  );
}