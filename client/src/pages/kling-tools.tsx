import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EffectsComponent } from "@/components/kling/effects-component";
import { VirtualTryOnComponent } from "@/components/kling/tryon-component";
import { LipsyncComponent } from "@/components/kling/lipsync-component";
import { Shirt, Sparkles, Mic } from 'lucide-react';

export default function KlingToolsPage() {
  // El estado del tab activo determina qué sección se muestra
  const [activeTab, setActiveTab] = useState("effects");

  return (
    <div className="container mx-auto py-8">
      <div className="flex flex-col gap-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Herramientas de Kling IA</h1>
          <p className="text-muted-foreground">
            Explora las capacidades de Kling para transformar imágenes, probar ropa virtualmente y sincronizar labios en videos
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-3 mb-8">
            <TabsTrigger value="effects" className="flex items-center">
              <Sparkles className="mr-2 h-4 w-4" />
              <span>Efectos</span>
            </TabsTrigger>
            <TabsTrigger value="tryOn" className="flex items-center">
              <Shirt className="mr-2 h-4 w-4" />
              <span>Virtual Try-On</span>
            </TabsTrigger>
            <TabsTrigger value="lipsync" className="flex items-center">
              <Mic className="mr-2 h-4 w-4" />
              <span>Lipsync</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="effects">
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Kling Effects</CardTitle>
                  <CardDescription>
                    Transforma imágenes estáticas en videos animados con efectos especiales
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <EffectsComponent />
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Acerca de Kling Effects</CardTitle>
                  <CardDescription>
                    Información sobre esta herramienta
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p>
                    Kling Effects utiliza inteligencia artificial para añadir efectos dinámicos a tus imágenes,
                    convirtiéndolas en videos animados atractivos.
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <h3 className="text-lg font-semibold">Efecto Squish</h3>
                      <p className="text-sm text-muted-foreground">
                        El efecto squish aplica una transformación de compresión y expansión a la imagen,
                        creando una sensación de elasticidad o rebote que da vida a cualquier objeto o personaje.
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <h3 className="text-lg font-semibold">Efecto Expansion</h3>
                      <p className="text-sm text-muted-foreground">
                        El efecto expansion crea una animación donde la imagen parece expandirse desde su centro,
                        generando un movimiento dinámico que llama la atención y destaca los elementos principales.
                      </p>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-md mt-4">
                    <h3 className="font-medium mb-2">Casos de uso</h3>
                    <ul className="list-disc pl-4 space-y-1 text-sm text-muted-foreground">
                      <li>Marketing en redes sociales con publicaciones animadas</li>
                      <li>Creación de GIFs expresivos para comunicaciones</li>
                      <li>Dar vida a fotografías de productos para tiendas online</li>
                      <li>Animación rápida de personajes para proyectos creativos</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="tryOn">
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Virtual Try-On</CardTitle>
                  <CardDescription>
                    Prueba virtualmente prendas de vestir en modelos usando IA
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <VirtualTryOnComponent />
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Acerca de Virtual Try-On</CardTitle>
                  <CardDescription>
                    Información sobre esta herramienta
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p>
                    Virtual Try-On utiliza avanzados algoritmos de inteligencia artificial para superponer prendas de vestir
                    en imágenes de modelos, permitiendo visualizar cómo se vería una prenda sin necesidad de una prueba física.
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <h3 className="text-lg font-semibold">Vestido Completo</h3>
                      <p className="text-sm text-muted-foreground">
                        Permite probar vestidos o prendas de cuerpo completo, adaptándose a la silueta del modelo
                        para lograr un resultado realista.
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <h3 className="text-lg font-semibold">Parte Superior</h3>
                      <p className="text-sm text-muted-foreground">
                        Ideal para camisas, blusas, chaquetas y otras prendas superiores. El algoritmo ajusta la prenda
                        a los hombros y torso del modelo.
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <h3 className="text-lg font-semibold">Parte Inferior</h3>
                      <p className="text-sm text-muted-foreground">
                        Para pantalones, faldas y shorts. La IA adapta la prenda a la parte inferior del cuerpo del modelo,
                        respetando las proporciones.
                      </p>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-md mt-4">
                    <h3 className="font-medium mb-2">Casos de uso</h3>
                    <ul className="list-disc pl-4 space-y-1 text-sm text-muted-foreground">
                      <li>Tiendas online que quieren ofrecer experiencias virtuales de prueba</li>
                      <li>Diseñadores de moda que desean visualizar sus creaciones en diferentes modelos</li>
                      <li>Retailers que buscan reducir devoluciones mostrando cómo quedan las prendas</li>
                      <li>Influencers y creadores de contenido para mostrar diversas opciones de vestimenta</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="lipsync">
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Kling Lipsync</CardTitle>
                  <CardDescription>
                    Sincroniza los labios en videos con audio o texto para crear diálogos realistas
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <LipsyncComponent />
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Acerca de Kling Lipsync</CardTitle>
                  <CardDescription>
                    Información sobre esta herramienta
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p>
                    Kling Lipsync permite sincronizar el movimiento de los labios en un video con un audio o texto proporcionado,
                    creando la ilusión de que el personaje del video está realmente hablando esas palabras.
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <h3 className="text-lg font-semibold">Sincronización con Texto</h3>
                      <p className="text-sm text-muted-foreground">
                        Introduce el texto que deseas que diga el personaje del video y selecciona una voz.
                        La IA convertirá el texto a voz y sincronizará los labios del personaje con las palabras.
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <h3 className="text-lg font-semibold">Sincronización con Audio</h3>
                      <p className="text-sm text-muted-foreground">
                        Sube un archivo de audio existente o proporciona una URL. La IA analizará el audio
                        y sincronizará los movimientos labiales del personaje con el contenido del audio.
                      </p>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-md mt-4">
                    <h3 className="font-medium mb-2">Casos de uso</h3>
                    <ul className="list-disc pl-4 space-y-1 text-sm text-muted-foreground">
                      <li>Localización de videos a diferentes idiomas</li>
                      <li>Creación de contenido educativo con personajes animados</li>
                      <li>Doblaje de escenas de películas o clips de video</li>
                      <li>Creación de avatares digitales para presentaciones o marketing</li>
                      <li>Producción de contenido para redes sociales con mensajes personalizados</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}