import { useState } from "react";
import { Header } from "../components/layout/header";
import { ImageStyleAdvisor } from "../components/image-advisor/image-style-advisor";
import { VirtualTryOnComponent } from "../components/kling/tryon-component";
import { ArtistVirtualTryOn } from "../components/kling/artist-virtual-tryon";
import { EnglishVirtualTryOn } from "../components/kling/english-virtual-tryon";
import { FluxUploadSection } from "../components/image-generation/sections/flux-upload-section";
import { FluxStyleSection } from "../components/image-generation/sections/flux-style-section";
import { motion } from "framer-motion";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Label } from "../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Upload, Sparkles, Camera, Palette, Music2, TrendingUp, Image as ImageIcon, Star, ArrowLeft, Shirt } from "lucide-react";
import { useToast } from "../hooks/use-toast";
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
  const [language, setLanguage] = useState<"en" | "es">("en");
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
        {/* Hero Section with Video Background */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="relative rounded-xl overflow-hidden mb-12"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/40 to-black/60 z-10"></div>
          
          {/* Video Background */}
          <div className="relative h-[350px] md:h-[400px] w-full overflow-hidden">
            <video 
              autoPlay 
              loop 
              muted 
              playsInline
              className="absolute w-full h-full object-cover"
            >
              <source src="/assets/Standard_Mode_Generated_Video%20(9).mp4" type="video/mp4" />
            </video>
            
            {/* Content overlay */}
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center text-center p-6">
              <div className="bg-black/50 p-8 rounded-xl backdrop-blur-sm">
                <h1 className="text-3xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-500 to-red-500 mb-4">
                  AI-Powered Image Advisor
                </h1>
                <p className="text-base md:text-lg text-white max-w-2xl mx-auto">
                  Transform your artist image with cutting-edge AI technology. Get personalized style recommendations and visualize your perfect look.
                </p>
                <Button 
                  className="mt-6 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 shadow-lg"
                >
                  <Sparkles className="mr-2 h-5 w-5" />
                  Start Your Transformation
                </Button>
              </div>
            </div>
          </div>
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
                  <FluxUploadSection language={language} />
                </motion.div>
              </TabsContent>
              
              <TabsContent value="style" className="mt-0">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <FluxStyleSection language={language} />
                </motion.div>
              </TabsContent>
              
              <TabsContent value="virtual-tryon" className="mt-0">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <div className="space-y-6">
                    <div className="flex justify-between items-center mb-6">
                      <div className="text-center flex-1">
                        <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary/90 to-primary">Virtual Try-On</h2>
                        <p className="text-muted-foreground max-w-2xl mx-auto">
                          Try on clothing virtually to visualize your perfect style as an artist. 
                          Upload your photo and the clothing item you want to try for instant results.
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Label htmlFor="language-selector" className="text-sm mr-2">Language:</Label>
                        <Select
                          value={language}
                          onValueChange={(value) => setLanguage(value as "en" | "es")}
                        >
                          <SelectTrigger id="language-selector" className="w-[120px]">
                            <SelectValue placeholder="Select language" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="en">English</SelectItem>
                            <SelectItem value="es">Español</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    {/* Video Tutorial Background */}
                    <div className="relative mb-8 rounded-lg overflow-hidden border border-primary/20">
                      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-background/40 z-10"></div>
                      <video
                        autoPlay
                        loop
                        muted
                        playsInline
                        className="w-full object-cover h-[220px]"
                        poster="/assets/virtual-tryon/virtual-tryon-poster.svg"
                      >
                        <source src="/assets/tv/Welcome to Boostify Music.mp4" type="video/mp4" />
                        Your browser does not support the video tag.
                      </video>
                      <div className="absolute inset-0 z-20 flex items-center justify-center flex-col p-6 text-center">
                        <h3 className="text-xl font-semibold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/80">
                          {language === "en" ? "AI-Powered Virtual Try-On" : "Prueba Virtual con IA"}
                        </h3>
                        <p className="text-sm text-white/90 max-w-3xl">
                          {language === "en" 
                            ? "Create your perfect artist look with our advanced AI technology. Simply upload your photo and clothing items to see how they look together instantly."
                            : "Crea tu look artístico perfecto con nuestra tecnología avanzada de IA. Simplemente sube tu foto y las prendas para ver cómo se ven juntas al instante."}
                        </p>
                      </div>
                    </div>
                    
                    {language === "en" ? <EnglishVirtualTryOn /> : <ArtistVirtualTryOn />}
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
                      <h2 className="text-2xl font-bold">Results and Recommendations</h2>
                      <p className="text-muted-foreground">
                        Analysis summary and personalized recommendations for your artist image
                      </p>
                    </div>
                    
                    <div className="space-y-6">
                      <Card className="p-6 backdrop-blur-sm border-orange-500/20">
                        <div className="space-y-4">
                          <h3 className="text-xl font-semibold flex items-center gap-2">
                            <Star className="h-5 w-5 text-orange-500" /> 
                            Current Image Analysis
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
                                  <span>Genre coherence</span>
                                  <span>78%</span>
                                </div>
                                <div className="h-2 bg-black/40 rounded-full overflow-hidden">
                                  <div className="h-full bg-orange-500 rounded-full" style={{ width: '78%' }}></div>
                                </div>
                              </div>
                              <div className="space-y-1">
                                <div className="flex justify-between text-sm">
                                  <span>Professionalism</span>
                                  <span>65%</span>
                                </div>
                                <div className="h-2 bg-black/40 rounded-full overflow-hidden">
                                  <div className="h-full bg-orange-500 rounded-full" style={{ width: '65%' }}></div>
                                </div>
                              </div>
                              <div className="space-y-1">
                                <div className="flex justify-between text-sm">
                                  <span>Originality</span>
                                  <span>82%</span>
                                </div>
                                <div className="h-2 bg-black/40 rounded-full overflow-hidden">
                                  <div className="h-full bg-orange-500 rounded-full" style={{ width: '82%' }}></div>
                                </div>
                              </div>
                              <div className="space-y-1">
                                <div className="flex justify-between text-sm">
                                  <span>Visual impact</span>
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
                          <h3 className="text-xl font-semibold">Final Recommendations</h3>
                          <ul className="space-y-3">
                            <li className="flex items-start gap-3 p-2 rounded-md bg-orange-500/5 border border-orange-500/10">
                              <div className="mt-0.5 text-orange-500">
                                <Sparkles className="h-5 w-5" />
                              </div>
                              <div>
                                <p className="font-medium">Improve visual coherence</p>
                                <p className="text-sm text-muted-foreground">Establish a consistent color palette across all your images and digital platforms.</p>
                              </div>
                            </li>
                            <li className="flex items-start gap-3 p-2 rounded-md bg-orange-500/5 border border-orange-500/10">
                              <div className="mt-0.5 text-orange-500">
                                <Shirt className="h-5 w-5" />
                              </div>
                              <div>
                                <p className="font-medium bg-clip-text text-transparent bg-gradient-to-r from-orange-500 to-red-500">Experiment with the Try-On functionality</p>
                                <p className="text-sm text-muted-foreground">Use the Virtual Try-On tool to explore different clothing styles that enhance your artistic image as a musician. Try various combinations to discover your unique style.</p>
                              </div>
                            </li>
                            <li className="flex items-start gap-3 p-2 rounded-md bg-orange-500/5 border border-orange-500/10">
                              <div className="mt-0.5 text-orange-500">
                                <Camera className="h-5 w-5" />
                              </div>
                              <div>
                                <p className="font-medium">Invest in professional photography</p>
                                <p className="text-sm text-muted-foreground">The analysis suggests that professional photo sessions would significantly improve your visual presence.</p>
                              </div>
                            </li>
                          </ul>
                        </div>
                      </Card>
                      
                      <div className="flex justify-center">
                        <Button className="bg-gradient-to-r from-primary/90 to-primary hover:from-primary hover:to-primary/90">
                          Download Complete Report
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