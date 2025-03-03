import { useEffect } from "react";
import { MusicAIGenerator } from "@/components/music/music-ai-generator";
import { Sparkles, Music2, Headphones } from "lucide-react";

export default function MusicGeneratorPage() {
  useEffect(() => {
    // Actualizar el título de la página
    document.title = "Generador de Música con IA | Boostify";
  }, []);

  return (
    <div className="container py-8 max-w-4xl mx-auto">
      <div className="flex flex-col items-center mb-8 text-center">
        <h1 className="text-3xl md:text-4xl font-bold mb-4">
          Generador de Música con IA
          <Sparkles className="inline-block ml-2 h-6 w-6 text-amber-400" />
        </h1>
        
        <p className="text-lg text-muted-foreground max-w-3xl">
          Crea música profesional a partir de tus ideas con tecnología de inteligencia
          artificial avanzada. Nuestro sistema integra Udio y Suno para ofrecerte
          resultados de alta calidad.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-card rounded-lg p-4 border flex flex-col items-center text-center">
          <div className="bg-primary/10 p-3 rounded-full mb-3">
            <Music2 className="h-6 w-6 text-primary" />
          </div>
          <h3 className="font-medium mb-2">Versatilidad Musical</h3>
          <p className="text-sm text-muted-foreground">
            Crea música en diversos géneros, desde pop y rock hasta jazz y música clásica.
          </p>
        </div>
        
        <div className="bg-card rounded-lg p-4 border flex flex-col items-center text-center">
          <div className="bg-primary/10 p-3 rounded-full mb-3">
            <Headphones className="h-6 w-6 text-primary" />
          </div>
          <h3 className="font-medium mb-2">Calidad Profesional</h3>
          <p className="text-sm text-muted-foreground">
            Genera pistas de audio de alta calidad listas para usar en tus proyectos.
          </p>
        </div>
        
        <div className="bg-card rounded-lg p-4 border flex flex-col items-center text-center">
          <div className="bg-primary/10 p-3 rounded-full mb-3">
            <Sparkles className="h-6 w-6 text-primary" />
          </div>
          <h3 className="font-medium mb-2">Personalización</h3>
          <p className="text-sm text-muted-foreground">
            Controla aspectos como letras, instrumentación y continuación de canciones.
          </p>
        </div>
      </div>

      <MusicAIGenerator />

      <div className="mt-8 bg-muted p-4 rounded-lg">
        <h3 className="font-semibold mb-2">Consejos para mejores resultados:</h3>
        <ul className="text-sm text-muted-foreground space-y-2 list-disc list-inside">
          <li>Sé específico con los géneros musicales y el estilo que buscas</li>
          <li>Incluye referencias a artistas o canciones para influir en el resultado</li>
          <li>Menciona los instrumentos que deseas que sean prominentes</li>
          <li>Detalla el estado de ánimo o emoción que quieres transmitir</li>
          <li>Para letras personalizadas, asegúrate de que tengan una estructura clara</li>
        </ul>
      </div>
    </div>
  );
}