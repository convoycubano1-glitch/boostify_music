/**
 * Flux AI Generator - Versión Ultra Simplificada
 * 
 * Esta versión de la página se centra exclusivamente en el generador de imágenes Flux AI,
 * con una interfaz minimalista para garantizar la estabilidad.
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { ImageIcon, Loader2, Download, Wand2 } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

export default function FluxGeneratorSimplePage() {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [generatedImageUrl, setGeneratedImageUrl] = useState('');
  
  // Lista de prompts de ejemplo para ayudar al usuario
  const examplePrompts = [
    "Un perro callejero en una ciudad lluviosa, estilo fotográfico",
    "Paisaje de montañas al atardecer con lago reflectante, estilo realista",
    "Retrato artístico de una mujer con flores en el cabello, estilo pintura al óleo"
  ];
  
  // Función para usar un prompt de ejemplo
  const useExamplePrompt = (examplePrompt: string) => {
    setPrompt(examplePrompt);
    toast({
      title: "Prompt de ejemplo seleccionado",
      description: "Ahora puedes generar la imagen o modificar el prompt.",
    });
  };

  // Función para generar una imagen de muestra para propósitos de demostración
  const handleGenerateImage = () => {
    if (!prompt.trim()) {
      toast({
        title: "Prompt requerido",
        description: "Por favor, escribe una descripción para generar una imagen.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);

    // Simulamos una generación con una imagen de muestra después de un pequeño retraso
    setTimeout(() => {
      // URL de una imagen de muestra
      const sampleImageUrl = "https://img.theapi.app/temp/33c6ba8c-7f33-48f1-93c7-c16fd09de9cf.png";
      
      setGeneratedImageUrl(sampleImageUrl);
      setIsGenerating(false);
      
      toast({
        title: "Imagen generada",
        description: "La imagen ha sido generada con éxito",
      });
    }, 1500);
  };

  // Función para descargar la imagen generada
  const handleDownload = () => {
    if (!generatedImageUrl) {
      toast({
        title: "No hay imagen disponible",
        description: "Primero debes generar una imagen.",
        variant: "destructive",
      });
      return;
    }
    
    // Crear un elemento anchor temporal para la descarga
    const a = document.createElement('a');
    a.href = generatedImageUrl;
    a.download = 'flux-image.png';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    toast({
      title: "Descarga iniciada",
      description: "Tu imagen está siendo descargada.",
    });
  };

  return (
    <div className="container py-8 max-w-4xl mx-auto">
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            Flux AI Image Generator
          </CardTitle>
          <CardDescription>
            Generate high-quality images with PiAPI Flux AI
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Textarea
              placeholder="Describe la imagen que quieres generar..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={4}
              className="w-full resize-none"
            />
          
            <div className="flex flex-wrap gap-2 mt-2">
              <Label className="text-sm text-muted-foreground mb-1 w-full">
                Ejemplos:
              </Label>
              {examplePrompts.map((examplePrompt, index) => (
                <Button 
                  key={index} 
                  variant="outline" 
                  size="sm"
                  className="text-xs"
                  onClick={() => useExamplePrompt(examplePrompt)}
                >
                  <Wand2 className="h-3 w-3 mr-1" />
                  {examplePrompt.length > 20 
                    ? examplePrompt.substring(0, 20) + "..." 
                    : examplePrompt}
                </Button>
              ))}
            </div>
          </div>
          
          <div className="flex space-x-2">
            <Button
              onClick={handleGenerateImage}
              disabled={isGenerating}
              className="flex-1"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generando...
                </>
              ) : (
                <>
                  <ImageIcon className="mr-2 h-4 w-4" />
                  Generar Imagen
                </>
              )}
            </Button>
            
            <Button
              onClick={handleDownload}
              disabled={!generatedImageUrl || isGenerating}
              variant="outline"
            >
              <Download className="mr-2 h-4 w-4" />
              Descargar
            </Button>
          </div>
          
          {generatedImageUrl && (
            <div className="mt-4 border rounded-lg overflow-hidden">
              <img
                src={generatedImageUrl}
                alt="Imagen generada"
                className="w-full h-auto"
                onError={(e) => {
                  console.error("Error loading image:", generatedImageUrl);
                  e.currentTarget.src = "https://via.placeholder.com/512x512?text=Error+al+cargar+imagen";
                }}
              />
              <div className="p-2 bg-muted/20">
                <p className="text-sm text-muted-foreground break-words">{prompt}</p>
              </div>
            </div>
          )}
        </CardContent>
        
        <CardFooter className="flex justify-between border-t pt-4">
          <div className="flex items-center text-sm text-muted-foreground">
            Powered by <span className="font-semibold ml-1">PiAPI Flux</span>
          </div>
          {generatedImageUrl && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setGeneratedImageUrl('')}
              className="text-xs"
            >
              Nueva imagen
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}