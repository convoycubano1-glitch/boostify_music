import { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { useToast } from "../../hooks/use-toast";
import { Loader2, Image as ImageIcon, Upload, X, Sparkles } from "lucide-react";
import { db, storage } from "../../firebase";
import { collection, doc, setDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { Card } from "../ui/card";

interface ImageGalleryGeneratorProps {
  artistId: string;
  artistName: string;
  onGalleryCreated?: () => void;
}

export function ImageGalleryGenerator({ 
  artistId, 
  artistName,
  onGalleryCreated 
}: ImageGalleryGeneratorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [referenceImages, setReferenceImages] = useState<string[]>([]);
  const [singleName, setSingleName] = useState("");
  const [basePrompt, setBasePrompt] = useState("");
  const [styleInstructions, setStyleInstructions] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    // Máximo 3 imágenes de referencia
    if (referenceImages.length + files.length > 3) {
      toast({
        title: "Límite de imágenes",
        description: "Puedes subir máximo 3 imágenes de referencia.",
        variant: "destructive",
      });
      return;
    }

    const newImages: string[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const reader = new FileReader();
      reader.onloadend = () => {
        newImages.push(reader.result as string);
        if (newImages.length === files.length) {
          setReferenceImages([...referenceImages, ...newImages]);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const removeReferenceImage = (index: number) => {
    setReferenceImages(referenceImages.filter((_, i) => i !== index));
  };

  const handleGenerateGallery = async () => {
    if (!singleName.trim()) {
      toast({
        title: "Campo requerido",
        description: "Por favor ingresa el nombre del sencillo.",
        variant: "destructive",
      });
      return;
    }

    if (referenceImages.length === 0) {
      toast({
        title: "Imágenes requeridas",
        description: "Sube al menos 1 imagen de referencia del artista.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    try {
      // Subir las imágenes de referencia a Firebase Storage
      const referenceUrls: string[] = [];
      for (let i = 0; i < referenceImages.length; i++) {
        const imageRef = ref(storage, `galleries/${artistId}/${Date.now()}-ref-${i}.jpg`);
        
        // Convertir base64 a blob
        const base64Data = referenceImages[i].split(',')[1];
        const blob = await fetch(`data:image/jpeg;base64,${base64Data}`).then(r => r.blob());
        
        await uploadBytes(imageRef, blob);
        const url = await getDownloadURL(imageRef);
        referenceUrls.push(url);
      }

      // Llamar al backend para generar las 6 imágenes
      const response = await fetch('/api/image-gallery/create-and-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          singleName,
          artistName,
          basePrompt: basePrompt || `Professional promotional photos of ${artistName} for "${singleName}"`,
          styleInstructions: styleInstructions || "Modern, high-quality, professional artist photography with creative lighting and composition",
          referenceImages: referenceUrls
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Error al generar galería');
      }

      // Guardar la galería en Firestore
      const galleryRef = doc(collection(db, "image_galleries"));
      await setDoc(galleryRef, {
        ...data.gallery,
        id: galleryRef.id,
        userId: artistId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      toast({
        title: "¡Galería creada!",
        description: data.message,
      });

      // Limpiar formulario y cerrar
      setSingleName("");
      setBasePrompt("");
      setStyleInstructions("");
      setReferenceImages([]);
      setIsOpen(false);
      
      if (onGalleryCreated) {
        onGalleryCreated();
      }

    } catch (error: any) {
      console.error('Error generating gallery:', error);
      toast({
        title: "Error",
        description: error.message || "No se pudo generar la galería",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2" data-testid="button-create-gallery">
          <Sparkles className="h-4 w-4" />
          Crear Galería de Imágenes
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Crear Galería de Imágenes</DialogTitle>
          <DialogDescription>
            Genera 6 imágenes profesionales del artista manteniendo su identidad facial
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Nombre del sencillo */}
          <div className="space-y-2">
            <Label htmlFor="singleName">Nombre del Sencillo *</Label>
            <Input
              id="singleName"
              value={singleName}
              onChange={(e) => setSingleName(e.target.value)}
              placeholder="Mi Nuevo Sencillo"
              data-testid="input-single-name"
            />
          </div>

          {/* Imágenes de referencia */}
          <div className="space-y-2">
            <Label>Imágenes de Referencia (1-3) *</Label>
            <p className="text-sm text-muted-foreground">
              Sube 1 a 3 fotos claras del artista para mantener su identidad facial en todas las imágenes generadas.
            </p>
            
            <div className="grid grid-cols-3 gap-4">
              {referenceImages.map((img, index) => (
                <Card key={index} className="relative p-2">
                  <img 
                    src={img} 
                    alt={`Referencia ${index + 1}`} 
                    className="w-full h-32 object-cover rounded"
                  />
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute -top-2 -right-2 h-6 w-6"
                    onClick={() => removeReferenceImage(index)}
                    data-testid={`button-remove-ref-${index}`}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Card>
              ))}
              
              {referenceImages.length < 3 && (
                <Card 
                  className="p-2 border-dashed cursor-pointer hover:border-primary transition-colors flex items-center justify-center h-32"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div className="text-center">
                    <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">Subir imagen</p>
                  </div>
                </Card>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleFileUpload}
            />
          </div>

          {/* Prompt base (opcional) */}
          <div className="space-y-2">
            <Label htmlFor="basePrompt">Descripción Base (Opcional)</Label>
            <Textarea
              id="basePrompt"
              value={basePrompt}
              onChange={(e) => setBasePrompt(e.target.value)}
              placeholder={`Professional promotional photos of ${artistName} for "${singleName || 'this single'}"`}
              rows={2}
              data-testid="input-base-prompt"
            />
          </div>

          {/* Instrucciones de estilo (opcional) */}
          <div className="space-y-2">
            <Label htmlFor="styleInstructions">Instrucciones de Estilo (Opcional)</Label>
            <Textarea
              id="styleInstructions"
              value={styleInstructions}
              onChange={(e) => setStyleInstructions(e.target.value)}
              placeholder="Modern, high-quality, professional artist photography..."
              rows={2}
              data-testid="input-style-instructions"
            />
          </div>

          <Button
            onClick={handleGenerateGallery}
            disabled={isGenerating || referenceImages.length === 0 || !singleName.trim()}
            className="w-full gap-2"
            data-testid="button-generate-gallery"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Generando 6 imágenes...
              </>
            ) : (
              <>
                <ImageIcon className="h-4 w-4" />
                Generar Galería (6 Imágenes)
              </>
            )}
          </Button>

          <p className="text-xs text-muted-foreground text-center">
            La generación puede tardar 1-2 minutos. Las imágenes mantendrán la identidad facial del artista.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
