import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Plus, RefreshCw, Video } from "lucide-react";
import { TimelineClip } from "./timeline-editor";

interface MovementIntegrationProps {
  clips?: TimelineClip[];
  audioBuffer?: AudioBuffer | null;
  onUpdateClip?: (clipId: number, updates: Partial<TimelineClip>) => void;
}

export function MovementIntegration({ clips = [], audioBuffer, onUpdateClip }: MovementIntegrationProps) {
  return (
    <div className="border rounded-lg p-4">
      <Label className="text-lg font-semibold mb-4">Integración de Movimientos</Label>
      <div className="space-y-4">
        <div className="p-4 bg-orange-500/10 rounded-lg">
          <p className="text-sm text-orange-600">
            Próximamente: Captura y transferencia de movimientos para personalizar las coreografías
          </p>
        </div>

        {/* Subida de Videos de Referencia */}
        <div className="space-y-2">
          <Label>Videos de Referencia</Label>
          <div className="grid gap-4">
            <Input
              type="file"
              accept="video/*"
              disabled
              className="cursor-not-allowed"
              multiple
            />
            <div className="grid grid-cols-2 gap-2">
              <div className="aspect-video rounded-lg border-2 border-dashed border-muted-foreground/25 flex items-center justify-center">
                <Video className="h-8 w-8 text-muted-foreground/25" />
              </div>
              <div className="aspect-video rounded-lg border-2 border-dashed border-muted-foreground/25 flex items-center justify-center">
                <Plus className="h-8 w-8 text-muted-foreground/25" />
              </div>
            </div>
          </div>
        </div>

        {/* Selección de Secciones */}
        <div className="space-y-2">
          <Label>Aplicar Movimientos en:</Label>
          <div className="grid gap-2">
            {[
              'Coro',
              'Verso',
              'Puente',
              'Introducción',
              'Solo',
              'Final'
            ].map((section) => (
              <div key={section} className="flex items-center space-x-2 p-2 border rounded-lg">
                <input
                  type="checkbox"
                  id={`movement-${section}`}
                  disabled
                  className="cursor-not-allowed"
                />
                <Label htmlFor={`movement-${section}`} className="text-sm">
                  {section}
                </Label>
              </div>
            ))}
          </div>
        </div>

        {/* Opciones de Transferencia */}
        <div className="space-y-2">
          <Label>Opciones de Transferencia</Label>
          <Select disabled>
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar estilo de transferencia" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="exact">Movimientos Exactos</SelectItem>
              <SelectItem value="stylized">Estilizado</SelectItem>
              <SelectItem value="enhanced">Mejorado con IA</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Ajustes de Intensidad */}
        <div className="space-y-2">
          <Label>Intensidad de Movimientos (50%)</Label>
          <Slider
            disabled
            defaultValue={[50]}
            max={100}
            step={1}
          />
        </div>

        <Button disabled className="w-full">
          <RefreshCw className="mr-2 h-4 w-4" />
          Procesar y Aplicar Movimientos (Próximamente)
        </Button>

        <div className="text-xs text-muted-foreground">
          <p>Esta función permitirá:</p>
          <ul className="list-disc list-inside mt-1 space-y-1">
            <li>Subir videos de referencia con movimientos del artista</li>
            <li>Capturar y analizar movimientos específicos</li>
            <li>Transferir los movimientos a las escenas seleccionadas</li>
            <li>Ajustar la intensidad y estilo de los movimientos</li>
            <li>Sincronizar con el ritmo de la música</li>
            <li>Previsualizar los resultados antes de aplicar</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
