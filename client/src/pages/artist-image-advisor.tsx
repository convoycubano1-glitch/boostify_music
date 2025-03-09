import { useState } from 'react';
import { ArtisticImageGenerator } from "../components/image-generation/artistic-image-generator";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";

export default function ArtistImageAdvisorPage() {
  const [activeTab, setActiveTab] = useState("generator");
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);

  const handleImageGenerated = (imageUrl: string) => {
    setGeneratedImages(prev => [imageUrl, ...prev]);
  };

  return (
    <div className="container py-8 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-2">Asesor de Imágenes Artísticas</h1>
      <p className="text-muted-foreground mb-6">
        Genera imágenes artísticas profesionales para tu presencia musical
      </p>
      
      <Tabs defaultValue="generator" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="generator">Generador de Imágenes</TabsTrigger>
          <TabsTrigger value="gallery">Galería ({generatedImages.length})</TabsTrigger>
        </TabsList>
        
        <TabsContent value="generator" className="mt-0">
          <ArtisticImageGenerator onImageGenerated={handleImageGenerated} />
        </TabsContent>
        
        <TabsContent value="gallery" className="mt-0">
          {generatedImages.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {generatedImages.map((imageUrl, index) => (
                <Card key={index} className="overflow-hidden">
                  <CardContent className="p-2">
                    <img 
                      src={imageUrl} 
                      alt={`Imagen generada ${index + 1}`} 
                      className="w-full h-auto object-cover rounded-md aspect-square"
                    />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                Aún no has generado ninguna imagen. Ve a la pestaña "Generador de Imágenes" para crear tu primera imagen.
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}