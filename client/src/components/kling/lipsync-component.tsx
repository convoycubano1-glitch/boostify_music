import { useState } from "react";
import { Button } from "../ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "../ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { RefreshCw, Upload, Camera, Sparkles, Mic, FileAudio2, X } from "lucide-react";

/**
 * LipsyncComponent
 * A simple placeholder component for Kling Lipsync
 */
export function LipsyncComponent() {
  const [videoFile, setVideoFile] = useState<string>("");
  const [inputType, setInputType] = useState<"text" | "audio">("text");
  const [text, setText] = useState<string>("");
  const [audioFile, setAudioFile] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const handleFileChange = (
    event: React.ChangeEvent<HTMLInputElement>,
    setFile: React.Dispatch<React.SetStateAction<string>>,
    type: "video" | "audio"
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (type === "video" && !file.type.startsWith("video/")) {
      toast({
        title: "Tipo de archivo inválido",
        description: "Por favor, sube solo archivos de video (MP4, MOV, etc.)",
        variant: "destructive",
      });
      return;
    }

    if (type === "audio" && !file.type.startsWith("audio/")) {
      toast({
        title: "Tipo de archivo inválido",
        description: "Por favor, sube solo archivos de audio (MP3, WAV, etc.)",
        variant: "destructive",
      });
      return;
    }

    // Read and convert to data URL
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        setFile(e.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleLipsyncGeneration = () => {
    if (!videoFile) {
      toast({
        title: "Video requerido",
        description: "Por favor, sube un video para continuar",
        variant: "destructive",
      });
      return;
    }

    if (inputType === "text" && !text) {
      toast({
        title: "Texto requerido",
        description: "Por favor, ingresa el texto que deseas sincronizar",
        variant: "destructive",
      });
      return;
    }

    if (inputType === "audio" && !audioFile) {
      toast({
        title: "Audio requerido",
        description: "Por favor, sube un archivo de audio para continuar",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    
    // Simulate processing
    setTimeout(() => {
      setIsProcessing(false);
      toast({
        title: "Funcionalidad en desarrollo",
        description: "La generación de lipsync estará disponible próximamente",
      });
    }, 1500);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="videoFile" className="text-sm font-medium">
          Video para sincronización
        </Label>
        
        <div className="aspect-video relative bg-muted/40 rounded-md overflow-hidden border border-input flex items-center justify-center">
          {videoFile ? (
            <>
              <video 
                src={videoFile} 
                controls
                className="w-full h-full object-contain"
              />
              <Button 
                variant="destructive" 
                size="icon" 
                className="absolute top-2 right-2 h-8 w-8 opacity-80 hover:opacity-100"
                onClick={() => setVideoFile("")}
              >
                <X className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <div className="text-center p-4">
              <Camera className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">Sube un video que contenga una persona hablando</p>
            </div>
          )}
        </div>

        <div className="flex justify-center">
          <Label 
            htmlFor="videoFile" 
            className="cursor-pointer inline-flex items-center justify-center gap-1 text-sm text-primary py-1 px-2 rounded hover:bg-primary/10"
          >
            <Upload className="h-3 w-3" />
            {videoFile ? "Cambiar" : "Subir"} video
          </Label>
          <Input 
            id="videoFile" 
            type="file" 
            accept="video/*" 
            className="hidden" 
            onChange={(e) => handleFileChange(e, setVideoFile, "video")}
          />
        </div>
      </div>

      <div className="space-y-3">
        <Label className="text-sm font-medium">
          Tipo de entrada
        </Label>
        
        <RadioGroup value={inputType} onValueChange={(value: any) => setInputType(value)} className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Label
            htmlFor="type-text"
            className={`flex items-center justify-between rounded-md border-2 p-4 ${
              inputType === "text" ? "border-primary bg-primary/5" : "border-muted"
            } cursor-pointer`}
          >
            <div className="flex items-center gap-3">
              <Mic className={`h-5 w-5 ${inputType === "text" ? "text-primary" : "text-muted-foreground"}`} />
              <div className="space-y-1">
                <p className={`text-sm font-medium ${inputType === "text" ? "text-primary" : ""}`}>Texto a Voz</p>
                <p className="text-xs text-muted-foreground">Introduce texto para convertir a audio</p>
              </div>
            </div>
            <RadioGroupItem value="text" id="type-text" className="sr-only" />
          </Label>
          
          <Label
            htmlFor="type-audio"
            className={`flex items-center justify-between rounded-md border-2 p-4 ${
              inputType === "audio" ? "border-primary bg-primary/5" : "border-muted"
            } cursor-pointer`}
          >
            <div className="flex items-center gap-3">
              <FileAudio2 className={`h-5 w-5 ${inputType === "audio" ? "text-primary" : "text-muted-foreground"}`} />
              <div className="space-y-1">
                <p className={`text-sm font-medium ${inputType === "audio" ? "text-primary" : ""}`}>Archivo de Audio</p>
                <p className="text-xs text-muted-foreground">Sube un archivo de audio existente</p>
              </div>
            </div>
            <RadioGroupItem value="audio" id="type-audio" className="sr-only" />
          </Label>
        </RadioGroup>
      </div>

      {inputType === "text" ? (
        <div className="space-y-2">
          <Label htmlFor="lipsyncText" className="text-sm font-medium">
            Texto para sincronización
          </Label>
          <Textarea
            id="lipsyncText"
            placeholder="Escribe aquí lo que quieres que diga la persona en el video..."
            className="min-h-32"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
        </div>
      ) : (
        <div className="space-y-2">
          <Label htmlFor="audioFile" className="text-sm font-medium">
            Audio para sincronización
          </Label>
          
          <div className="h-32 relative bg-muted/40 rounded-md overflow-hidden border border-input flex items-center justify-center">
            {audioFile ? (
              <div className="w-full">
                <audio 
                  src={audioFile} 
                  controls
                  className="w-full"
                />
                <Button 
                  variant="destructive" 
                  size="icon" 
                  className="absolute top-2 right-2 h-8 w-8 opacity-80 hover:opacity-100"
                  onClick={() => setAudioFile("")}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="text-center p-4">
                <FileAudio2 className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">Sube un archivo de audio para sincronizar</p>
              </div>
            )}
          </div>

          <div className="flex justify-center">
            <Label 
              htmlFor="audioFile" 
              className="cursor-pointer inline-flex items-center justify-center gap-1 text-sm text-primary py-1 px-2 rounded hover:bg-primary/10"
            >
              <Upload className="h-3 w-3" />
              {audioFile ? "Cambiar" : "Subir"} audio
            </Label>
            <Input 
              id="audioFile" 
              type="file" 
              accept="audio/*" 
              className="hidden" 
              onChange={(e) => handleFileChange(e, setAudioFile, "audio")}
            />
          </div>
        </div>
      )}

      <div className="flex justify-center mt-6">
        <Button 
          onClick={handleLipsyncGeneration} 
          disabled={!videoFile || (inputType === "text" ? !text : !audioFile) || isProcessing}
          className="w-full md:w-auto"
        >
          {isProcessing ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Procesando...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              Generar Lipsync
            </>
          )}
        </Button>
      </div>

      <div className="text-center text-sm text-muted-foreground mt-4 border-t pt-4 border-dashed">
        <p>Esta función está actualmente en desarrollo.</p>
        <p>Pronto podrás sincronizar los labios de tus videos con cualquier texto o audio.</p>
      </div>
    </div>
  );
}