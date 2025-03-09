import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Mic, Music, AlertCircle, CheckCircle2, Info } from "lucide-react";
import { TimelineClip } from "./timeline-editor";
import { KlingLipsync } from "@/components/lipsync/kling-lipsync";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { db } from "@/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { useAuth } from "@/lib/context/auth-context";

interface LipSyncIntegrationProps {
  clips?: TimelineClip[];
  transcription?: string;
  audioBuffer?: AudioBuffer | null;
  onUpdateClip?: (clipId: number, updates: Partial<TimelineClip>) => void;
  videoTaskId?: string;
  isPurchased?: boolean;
}

export function LipSyncIntegration({
  clips = [],
  transcription = "",
  audioBuffer,
  onUpdateClip,
  videoTaskId,
  isPurchased = true
}: LipSyncIntegrationProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [selectedTab, setSelectedTab] = useState<"preview" | "advanced">("preview");
  const [isSynchronizing, setIsSynchronizing] = useState(false);
  const [resultVideoUrl, setResultVideoUrl] = useState<string | null>(null);
  const [selectedClipId, setSelectedClipId] = useState<number | null>(null);
  
  // Filtrar solo los planos cercanos y medios donde la sincronización de labios funcionará mejor
  const eligibleClips = clips.filter(clip => 
    ['close-up', 'extreme close-up', 'medium', 'medium close-up'].includes(clip.shotType?.toLowerCase() || '')
  );

  // Función para manejar cuando el componente KlingLipsync completa el proceso
  const handleLipSyncComplete = (result: { videoUrl: string }) => {
    console.log("LipSync completado:", result);
    setResultVideoUrl(result.videoUrl);
    
    // Actualizar el clip correspondiente si existe la función
    if (onUpdateClip && selectedClipId) {
      onUpdateClip(selectedClipId, {
        // Agregamos los metadatos del LipSync al clip
        lipsyncApplied: true,
        lipsyncVideoUrl: result.videoUrl
      });
    }
    
    // Guardar resultado en Firestore para referencia
    if (user?.uid && videoTaskId) {
      saveLipsyncResult(videoTaskId, result.videoUrl);
    }
    
    toast({
      title: "LipSync completado",
      description: "La sincronización de labios se ha aplicado correctamente al video.",
    });
  };
  
  // Guardar el resultado del LipSync en Firestore
  const saveLipsyncResult = async (videoId: string, resultUrl: string) => {
    try {
      if (!user?.uid) return;
      
      await addDoc(collection(db, "lipsync_results"), {
        userId: user.uid,
        videoTaskId: videoId,
        resultUrl,
        createdAt: serverTimestamp(),
      });
      
      console.log("Resultado de LipSync guardado en Firestore");
    } catch (error) {
      console.error("Error al guardar resultado de LipSync:", error);
    }
  };

  return (
    <div className="border rounded-lg p-4 space-y-6">
      <div className="flex justify-between items-center mb-4">
        <Label className="text-lg font-semibold">Sincronización de Labios (LipSync)</Label>
      </div>
      
      <Tabs defaultValue="preview" value={selectedTab} onValueChange={(value) => setSelectedTab(value as "preview" | "advanced")}>
        <TabsList className="mb-4">
          <TabsTrigger value="preview">Vista Previa</TabsTrigger>
          <TabsTrigger value="advanced">Avanzado</TabsTrigger>
        </TabsList>
        
        <TabsContent value="preview" className="space-y-4">
          {!videoTaskId ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Necesita generar el video primero</AlertTitle>
              <AlertDescription>
                Para usar la función de sincronización de labios, primero debe generar el video completo.
              </AlertDescription>
            </Alert>
          ) : (
            <KlingLipsync 
              videoTaskId={videoTaskId}
              clips={eligibleClips}
              isPurchased={isPurchased}
              onLipSyncComplete={(result) => {
                // Estamos integrando directamente con el clip seleccionado en el componente KlingLipsync
                handleLipSyncComplete(result);
                
                // Notificar al usuario que el proceso se completó
                toast({
                  title: "Sincronización completada",
                  description: "La sincronización de labios se ha aplicado correctamente al clip seleccionado.",
                });
              }}
            />
          )}
        </TabsContent>
        
        <TabsContent value="advanced" className="space-y-4">
          <Alert variant="default" className="bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800">
            <Info className="h-4 w-4 text-blue-500" />
            <AlertTitle>Información avanzada</AlertTitle>
            <AlertDescription>
              Esta sección muestra detalles técnicos sobre la sincronización de labios.
            </AlertDescription>
          </Alert>
          
          {/* Lista de Planos Disponibles */}
          <div className="space-y-2">
            <Label>Planos Disponibles para LipSync</Label>
            <ScrollArea className="h-[200px] w-full rounded-md border p-4">
              {eligibleClips.length > 0 ? (
                eligibleClips.map((clip) => (
                  <div
                    key={clip.id}
                    className="flex items-center justify-between p-2 border-b last:border-0"
                  >
                    <div className="flex items-center gap-2">
                      <Mic className="h-4 w-4 text-orange-500" />
                      <div className="grid gap-1">
                        <p className="text-sm font-medium">{clip.shotType}</p>
                        <p className="text-xs text-muted-foreground">
                          {clip.start.toFixed(2)}s - {(clip.start + clip.duration).toFixed(2)}s
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      {clip.lipsyncApplied && (
                        <CheckCircle2 className="h-4 w-4 text-green-500 mr-2" />
                      )}
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => setSelectedClipId(Number(clip.id))}
                        className={selectedClipId === Number(clip.id) ? "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300" : ""}
                      >
                        Seleccionar
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  No hay planos cercanos o medios disponibles para sincronización de labios
                </div>
              )}
            </ScrollArea>
          </div>

          {/* Letra de la Canción */}
          {transcription && (
            <div className="space-y-2">
              <Label>Letra de la Canción</Label>
              <ScrollArea className="h-[200px] w-full rounded-md border p-4">
                <pre className="text-sm whitespace-pre-wrap">{transcription}</pre>
              </ScrollArea>
            </div>
          )}
          
          <Card>
            <CardHeader>
              <CardTitle>Información técnica</CardTitle>
              <CardDescription>
                Detalles del proceso de sincronización de labios con PiAPI
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p>
                La sincronización de labios utiliza la API de Kling a través de PiAPI para analizar el movimiento de los labios
                en los planos cercanos y sincronizarlos con el audio o la letra proporcionada.
              </p>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <h4 className="font-semibold">Métodos disponibles:</h4>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Sincronización con archivo de audio</li>
                    <li>Generación de voz a partir de texto</li>
                  </ul>
                </div>
                <div className="space-y-1">
                  <h4 className="font-semibold">Timbres de voz:</h4>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Rock, Pop, Jazz, Folk</li>
                    <li>Classic, Opera</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
