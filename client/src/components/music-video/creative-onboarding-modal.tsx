import { useState, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Upload, Music, Camera, Sparkles, X, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";

interface CreativeOnboardingModalProps {
  open: boolean;
  onComplete: (audioFile: File, referenceImages: string[]) => void;
}

export function CreativeOnboardingModal({ open, onComplete }: CreativeOnboardingModalProps) {
  const { toast } = useToast();
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [selectedAudioFile, setSelectedAudioFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    if (files.length + selectedImages.length > 5) {
      toast({
        title: "Límite alcanzado",
        description: "Puedes subir máximo 5 fotos de referencia",
        variant: "destructive",
      });
      return;
    }

    files.forEach(file => {
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Archivo inválido",
          description: "Solo se permiten imágenes (JPG, PNG, WebP)",
          variant: "destructive",
        });
        return;
      }

      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "Imagen muy grande",
          description: "Cada imagen debe ser menor a 10MB",
          variant: "destructive",
        });
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const base64 = e.target?.result as string;
        setSelectedImages(prev => [...prev, base64]);
      };
      reader.readAsDataURL(file);
    });
  }, [selectedImages, toast]);

  const handleAudioUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    
    if (!file) return;

    if (!file.type.startsWith('audio/')) {
      toast({
        title: "Archivo inválido",
        description: "Solo se permiten archivos de audio (MP3, WAV, M4A)",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      toast({
        title: "Archivo muy grande",
        description: "El audio debe ser menor a 50MB",
        variant: "destructive",
      });
      return;
    }

    setSelectedAudioFile(file);
  }, [toast]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, type: 'image' | 'audio') => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    
    if (type === 'image') {
      files.forEach(file => {
        if (file.type.startsWith('image/')) {
          const fakeEvent = {
            target: { files: [file] }
          } as unknown as React.ChangeEvent<HTMLInputElement>;
          handleImageUpload(fakeEvent);
        }
      });
    } else {
      const audioFile = files.find(f => f.type.startsWith('audio/'));
      if (audioFile) {
        const fakeEvent = {
          target: { files: [audioFile] }
        } as unknown as React.ChangeEvent<HTMLInputElement>;
        handleAudioUpload(fakeEvent);
      }
    }
  }, [handleImageUpload, handleAudioUpload]);

  const removeImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleContinue = () => {
    if (step === 1) {
      if (selectedImages.length < 3) {
        toast({
          title: "Fotos insuficientes",
          description: "Necesitas subir al menos 3 fotos del artista",
          variant: "destructive",
        });
        return;
      }
      setStep(2);
    } else {
      if (!selectedAudioFile) {
        toast({
          title: "Audio requerido",
          description: "Debes subir una canción para continuar",
          variant: "destructive",
        });
        return;
      }
      onComplete(selectedAudioFile, selectedImages);
    }
  };

  return (
    <Dialog open={open} modal={true}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-background via-background to-orange-950/20" data-testid="modal-onboarding">
        <DialogHeader>
          <DialogTitle className="text-3xl font-bold text-center flex items-center justify-center gap-3">
            <Sparkles className="h-8 w-8 text-orange-500" />
            Crea tu Video Musical con IA
          </DialogTitle>
        </DialogHeader>

        <div className="mt-6">
          {/* Progress Indicator */}
          <div className="flex items-center justify-center gap-4 mb-8">
            <div className={`flex items-center gap-2 ${step === 1 ? 'text-orange-500' : 'text-green-500'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${step === 1 ? 'border-orange-500 bg-orange-500/20' : 'border-green-500 bg-green-500/20'}`}>
                {step > 1 ? <Check className="h-5 w-5" /> : <Camera className="h-5 w-5" />}
              </div>
              <span className="font-semibold">Fotos del Artista</span>
            </div>
            <div className="w-16 h-0.5 bg-muted" />
            <div className={`flex items-center gap-2 ${step === 2 ? 'text-orange-500' : 'text-muted-foreground'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${step === 2 ? 'border-orange-500 bg-orange-500/20' : 'border-muted'}`}>
                <Music className="h-5 w-5" />
              </div>
              <span className="font-semibold">Tu Canción</span>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {step === 1 ? (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-6"
              >
                <Card className="bg-orange-500/10 border-orange-500/30">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <Camera className="h-6 w-6 text-orange-500 flex-shrink-0 mt-1" />
                      <div>
                        <h3 className="font-bold text-lg mb-2">Sube fotos del artista (mínimo 3)</h3>
                        <p className="text-muted-foreground mb-4">
                          Estas fotos servirán como referencia para mantener la consistencia facial del artista en todo el video. 
                          Mientras más fotos subas (hasta 5), mejores resultados obtendrás.
                        </p>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                          <li className="flex items-center gap-2">
                            <Check className="h-4 w-4 text-green-500" />
                            Usa fotos claras del rostro del artista
                          </li>
                          <li className="flex items-center gap-2">
                            <Check className="h-4 w-4 text-green-500" />
                            Diferentes ángulos y expresiones mejoran el resultado
                          </li>
                          <li className="flex items-center gap-2">
                            <Check className="h-4 w-4 text-green-500" />
                            Buena iluminación es esencial
                          </li>
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Image Upload Zone */}
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, 'image')}
                  className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-all ${
                    isDragging ? 'border-orange-500 bg-orange-500/10' : 'border-muted-foreground/30 hover:border-orange-500/50'
                  }`}
                  data-testid="dropzone-images"
                >
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageUpload}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    data-testid="input-images"
                  />
                  <Upload className="h-12 w-12 mx-auto mb-4 text-orange-500" />
                  <h3 className="font-semibold text-lg mb-2">
                    Arrastra fotos aquí o haz clic para seleccionar
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    JPG, PNG, WebP • Máx 10MB por imagen • {selectedImages.length}/5 fotos
                  </p>
                </div>

                {/* Image Preview Grid */}
                {selectedImages.length > 0 && (
                  <div className="grid grid-cols-3 md:grid-cols-5 gap-4">
                    {selectedImages.map((img, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="relative aspect-square group"
                      >
                        <img
                          src={img}
                          alt={`Reference ${index + 1}`}
                          className="w-full h-full object-cover rounded-lg border-2 border-orange-500/50"
                        />
                        <button
                          onClick={() => removeImage(index)}
                          className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          data-testid={`button-remove-image-${index}`}
                        >
                          <X className="h-4 w-4" />
                        </button>
                        <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                          #{index + 1}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}

                <div className="flex justify-between items-center pt-4">
                  <p className="text-sm text-muted-foreground">
                    {selectedImages.length < 3 
                      ? `Necesitas ${3 - selectedImages.length} foto${3 - selectedImages.length > 1 ? 's' : ''} más`
                      : `¡Perfecto! Tienes ${selectedImages.length} fotos`}
                  </p>
                  <Button
                    onClick={handleContinue}
                    disabled={selectedImages.length < 3}
                    className="bg-orange-500 hover:bg-orange-600"
                    data-testid="button-continue-step1"
                  >
                    Continuar <Check className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <Card className="bg-orange-500/10 border-orange-500/30">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <Music className="h-6 w-6 text-orange-500 flex-shrink-0 mt-1" />
                      <div>
                        <h3 className="font-bold text-lg mb-2">Sube tu canción</h3>
                        <p className="text-muted-foreground mb-4">
                          Esta será la base de tu video musical. Nuestra IA analizará la letra y el ritmo para crear escenas 
                          perfectamente sincronizadas con tu música.
                        </p>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                          <li className="flex items-center gap-2">
                            <Check className="h-4 w-4 text-green-500" />
                            Formatos: MP3, WAV, M4A
                          </li>
                          <li className="flex items-center gap-2">
                            <Check className="h-4 w-4 text-green-500" />
                            Tamaño máximo: 50MB
                          </li>
                          <li className="flex items-center gap-2">
                            <Check className="h-4 w-4 text-green-500" />
                            Audio de alta calidad recomendado
                          </li>
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Audio Upload Zone */}
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, 'audio')}
                  className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-all ${
                    isDragging ? 'border-orange-500 bg-orange-500/10' : 'border-muted-foreground/30 hover:border-orange-500/50'
                  }`}
                  data-testid="dropzone-audio"
                >
                  <input
                    type="file"
                    accept="audio/*,.mp3,.wav,.m4a,.aac,.ogg,.flac,.mp4,.webm"
                    onChange={handleAudioUpload}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    data-testid="input-audio"
                  />
                  <Upload className="h-12 w-12 mx-auto mb-4 text-orange-500" />
                  <h3 className="font-semibold text-lg mb-2">
                    Arrastra tu audio aquí o haz clic para seleccionar
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    MP3, WAV, M4A • Máx 50MB
                  </p>
                </div>

                {/* Audio Preview */}
                {selectedAudioFile && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-green-500/10 border-2 border-green-500/30 rounded-lg p-4"
                  >
                    <div className="flex items-center gap-4">
                      <div className="bg-green-500/20 p-3 rounded-full">
                        <Music className="h-6 w-6 text-green-500" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold">{selectedAudioFile.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {(selectedAudioFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                      <Check className="h-6 w-6 text-green-500" />
                    </div>
                  </motion.div>
                )}

                <div className="flex justify-between items-center pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setStep(1)}
                    data-testid="button-back"
                  >
                    Volver
                  </Button>
                  <Button
                    onClick={handleContinue}
                    disabled={!selectedAudioFile}
                    className="bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600"
                    data-testid="button-start-creation"
                  >
                    <Sparkles className="mr-2 h-4 w-4" />
                    Crear Video Musical
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
}
