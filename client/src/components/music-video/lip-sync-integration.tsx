import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Mic, Music } from "lucide-react";
import { TimelineClip } from "./timeline-editor";

interface LipSyncIntegrationProps {
  clips?: TimelineClip[];
  transcription?: string;
  audioBuffer?: AudioBuffer | null;
  onUpdateClip?: (clipId: number, updates: Partial<TimelineClip>) => void;
}

export function LipSyncIntegration({
  clips = [],
  transcription = "",
  audioBuffer,
  onUpdateClip
}: LipSyncIntegrationProps) {
  // Filtrar solo los planos cercanos donde el artista está cantando
  const singingClips = clips.filter(clip => 
    ['close-up', 'extreme close-up'].includes(clip.title?.toLowerCase() || '')
  );

  return (
    <div className="border rounded-lg p-4">
      <Label className="text-lg font-semibold mb-4">Sincronización de Labios (LipSync)</Label>
      <div className="space-y-4">
        <div className="p-4 bg-orange-500/10 rounded-lg">
          <p className="text-sm text-orange-600">
            Próximamente: Sincronización automática de labios con la letra de la canción
          </p>
        </div>

        {/* Lista de Planos Disponibles */}
        <div className="space-y-2">
          <Label>Planos Disponibles para LipSync</Label>
          <ScrollArea className="h-[200px] w-full rounded-md border p-4">
            {singingClips.map((clip) => (
              <div
                key={clip.id}
                className="flex items-center justify-between p-2 border-b last:border-0"
              >
                <div className="flex items-center gap-2">
                  <Mic className="h-4 w-4 text-orange-500" />
                  <div className="grid gap-1">
                    <p className="text-sm font-medium">{clip.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {clip.start.toFixed(2)}s - {(clip.start + clip.duration).toFixed(2)}s
                    </p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" disabled>
                  Asignar Letra
                </Button>
              </div>
            ))}
          </ScrollArea>
        </div>

        {/* Letra de la Canción */}
        <div className="space-y-2">
          <Label>Letra de la Canción</Label>
          <ScrollArea className="h-[200px] w-full rounded-md border p-4">
            <pre className="text-sm whitespace-pre-wrap">{transcription}</pre>
          </ScrollArea>
        </div>

        {/* Opciones de Sincronización */}
        <div className="space-y-2">
          <Label>Precisión de Sincronización</Label>
          <div className="grid gap-2">
            <div className="flex items-center space-x-2 p-2 border rounded-lg">
              <input
                type="checkbox"
                id="phoneme-sync"
                disabled
                className="cursor-not-allowed"
              />
              <Label htmlFor="phoneme-sync" className="text-sm">
                Sincronización por fonemas
              </Label>
            </div>
            <div className="flex items-center space-x-2 p-2 border rounded-lg">
              <input
                type="checkbox"
                id="word-sync"
                disabled
                className="cursor-not-allowed"
              />
              <Label htmlFor="word-sync" className="text-sm">
                Sincronización por palabras
              </Label>
            </div>
          </div>
        </div>

        <Button disabled className="w-full">
          <Music className="mr-2 h-4 w-4" />
          Sincronizar Labios con Audio (Próximamente)
        </Button>

        <div className="text-xs text-muted-foreground">
          <p>Esta función permitirá:</p>
          <ul className="list-disc list-inside mt-1 space-y-1">
            <li>Detección automática de planos con canto</li>
            <li>Extracción de letra por segmentos temporales</li>
            <li>Sincronización precisa de labios con fonemas</li>
            <li>Ajuste de expresiones faciales según la intensidad</li>
            <li>Preview en tiempo real de la sincronización</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
