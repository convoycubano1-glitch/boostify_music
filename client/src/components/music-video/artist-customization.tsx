import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Image as ImageIcon } from "lucide-react";
import { TimelineClip } from "./timeline-editor";

interface ArtistCustomizationProps {
  clips?: TimelineClip[];
  onUpdateClip?: (clipId: number, updates: Partial<TimelineClip>) => void;
}

export function ArtistCustomization({ clips = [], onUpdateClip }: ArtistCustomizationProps) {
  return (
    <div className="border rounded-lg p-4">
      <Label className="text-lg font-semibold mb-4">Personalización de Artista</Label>
      <div className="space-y-4">
        <div className="p-4 bg-orange-500/10 rounded-lg">
          <p className="text-sm text-orange-600">
            Próximamente: Face swap con IA para personalizar el video con tu imagen
          </p>
        </div>

        <div className="space-y-2">
          <Label>Foto del Artista</Label>
          <div className="grid gap-4">
            <Input
              type="file"
              accept="image/*"
              disabled
              className="cursor-not-allowed"
            />
            <div className="aspect-square w-32 rounded-lg border-2 border-dashed border-muted-foreground/25 flex items-center justify-center">
              <ImageIcon className="h-8 w-8 text-muted-foreground/25" />
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Aplicar Face Swap en:</Label>
          <div className="grid gap-2">
            {['close-up', 'extreme close-up', 'medium shot'].map((shotType) => (
              <div key={shotType} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id={`faceswap-${shotType}`}
                  disabled
                  className="cursor-not-allowed"
                />
                <Label htmlFor={`faceswap-${shotType}`} className="text-sm">
                  {shotType}
                </Label>
              </div>
            ))}
          </div>
        </div>

        <Button disabled className="w-full">
          <ImageIcon className="mr-2 h-4 w-4" />
          Aplicar Face Swap (Próximamente)
        </Button>

        <div className="text-xs text-muted-foreground">
          <p>Esta función permitirá:</p>
          <ul className="list-disc list-inside mt-1 space-y-1">
            <li>Subir una foto del artista</li>
            <li>Seleccionar en qué tipos de planos aplicar el face swap</li>
            <li>Mantener la consistencia visual del estilo</li>
            <li>Preview en tiempo real de los resultados</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
