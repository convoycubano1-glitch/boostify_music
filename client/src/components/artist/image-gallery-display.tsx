import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "../ui/dialog";
import { Skeleton } from "../ui/skeleton";
import { Badge } from "../ui/badge";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { db, storage } from "../../firebase";
import { collection, query, where, getDocs, doc, setDoc, updateDoc, arrayUnion } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { Image as ImageIcon, Download, Trash2, RotateCw, Upload, Plus } from "lucide-react";
import { useToast } from "../../hooks/use-toast";

interface GeneratedImage {
  id: string;
  url: string;
  prompt: string;
  createdAt: string;
  isVideo: boolean;
  videoUrl?: string;
  thumbnailUrl?: string;
}

interface ImageGallery {
  id: string;
  userId: string;
  singleName: string;
  artistName: string;
  basePrompt: string;
  styleInstructions: string;
  referenceImageUrls: string[];
  generatedImages: GeneratedImage[];
  createdAt: string;
  updatedAt: string;
  isPublic: boolean;
}

interface ImageGalleryDisplayProps {
  artistId: string;
  isOwner?: boolean;
}

export function ImageGalleryDisplay({ artistId, isOwner = false }: ImageGalleryDisplayProps) {
  const [galleries, setGalleries] = useState<ImageGallery[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<{ url: string; prompt: string } | null>(null);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [galleryTitle, setGalleryTitle] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    console.log('🖼️ ImageGalleryDisplay montado para artistId:', artistId);
    loadGalleries();
  }, [artistId]);

  const loadGalleries = async () => {
    try {
      setIsLoading(true);
      console.log('📥 Cargando galerías para artistId:', artistId);
      
      const galleriesRef = collection(db, "image_galleries");
      const q = query(
        galleriesRef,
        where("userId", "==", artistId)
      );
      
      const querySnapshot = await getDocs(q);
      console.log('📊 Documentos encontrados:', querySnapshot.size);
      
      const galleriesData = querySnapshot.docs.map((doc) => {
        const data = doc.data();
        console.log('📄 Documento:', doc.id, data);
        return {
          id: doc.id,
          ...data,
        } as ImageGallery;
      });
      
      // Ordenar en el cliente en lugar de Firestore para evitar índices
      galleriesData.sort((a, b) => {
        const dateA = new Date(a.createdAt).getTime();
        const dateB = new Date(b.createdAt).getTime();
        return dateB - dateA; // Más reciente primero
      });
      
      console.log('✅ Galerías cargadas:', galleriesData.length);
      setGalleries(galleriesData);
    } catch (error) {
      console.error("❌ Error loading galleries:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las galerías",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const downloadImage = async (url: string, filename: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename;
      link.click();
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error("Error downloading image:", error);
      toast({
        title: "Error",
        description: "No se pudo descargar la imagen",
        variant: "destructive",
      });
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setUploadedFiles(prev => [...prev, ...files]);
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleUploadImages = async () => {
    if (!galleryTitle.trim()) {
      toast({
        title: "Error",
        description: "Por favor proporciona un título para la galería",
        variant: "destructive",
      });
      return;
    }

    if (uploadedFiles.length === 0) {
      toast({
        title: "Error",
        description: "Por favor selecciona al menos una imagen",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    try {
      const uploadedImages: GeneratedImage[] = [];
      
      for (let i = 0; i < uploadedFiles.length; i++) {
        const file = uploadedFiles[i];
        const storagePath = `image_galleries/${artistId}/${Date.now()}_${file.name}`;
        const storageRef = ref(storage, storagePath);
        
        await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(storageRef);
        
        uploadedImages.push({
          id: `${Date.now()}_${i}`,
          url: downloadURL,
          prompt: `Imagen subida: ${file.name}`,
          createdAt: new Date().toISOString(),
          isVideo: false,
        });
      }

      const newGalleryRef = doc(collection(db, "image_galleries"));
      await setDoc(newGalleryRef, {
        userId: artistId,
        singleName: galleryTitle,
        artistName: galleryTitle,
        basePrompt: "Imágenes subidas manualmente",
        styleInstructions: "N/A",
        referenceImageUrls: [],
        generatedImages: uploadedImages,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isPublic: true,
      });

      toast({
        title: "¡Galería creada!",
        description: `Se han subido ${uploadedImages.length} imágenes exitosamente.`,
      });

      setShowUploadDialog(false);
      setGalleryTitle('');
      setUploadedFiles([]);
      loadGalleries();
    } catch (error) {
      console.error("Error uploading images:", error);
      toast({
        title: "Error al subir",
        description: "No se pudieron subir las imágenes. Por favor intenta de nuevo.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-96" />
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  if (galleries.length === 0 && !isOwner) {
    return null; // No mostrar nada si no hay galerías y no es el dueño
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ImageIcon className="h-5 w-5" />
          <h2 className="text-2xl font-bold">Galerías de Imágenes</h2>
        </div>
        {isOwner && (
          <Button
            onClick={() => setShowUploadDialog(true)}
            className="gap-2"
            data-testid="button-upload-images"
          >
            <Plus className="h-4 w-4" />
            Subir Imágenes
          </Button>
        )}
      </div>

      {galleries.length === 0 && isOwner && (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            <ImageIcon className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No tienes galerías de imágenes aún.</p>
            <p className="text-sm mt-1">Haz clic en "Subir Imágenes" para crear tu primera galería.</p>
          </CardContent>
        </Card>
      )}

      {galleries.map((gallery) => (
        <Card key={gallery.id} data-testid={`gallery-${gallery.id}`}>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle>{gallery.singleName}</CardTitle>
                <CardDescription>
                  {gallery.generatedImages.length} imágenes generadas
                </CardDescription>
              </div>
              <Badge variant="secondary">
                {new Date(gallery.createdAt).toLocaleDateString()}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {gallery.generatedImages.map((image, index) => (
                <div
                  key={image.id}
                  className="relative group cursor-pointer rounded-lg overflow-hidden border hover:border-primary transition-all"
                  onClick={() => setSelectedImage({ url: image.url, prompt: image.prompt })}
                  data-testid={`image-${gallery.id}-${index}`}
                >
                  <img
                    src={image.url}
                    alt={`${gallery.singleName} - ${index + 1}`}
                    className="w-full aspect-square object-cover"
                  />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <Button
                      variant="secondary"
                      size="icon"
                      className="h-8 w-8"
                      onClick={(e) => {
                        e.stopPropagation();
                        downloadImage(image.url, `${gallery.singleName}-${index + 1}.jpg`);
                      }}
                      data-testid={`button-download-${index}`}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Diálogo para subir imágenes */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Subir Imágenes</DialogTitle>
            <DialogDescription>
              Crea una nueva galería subiendo imágenes desde tu dispositivo
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="gallery-title">Título de la Galería</Label>
              <Input
                id="gallery-title"
                value={galleryTitle}
                onChange={(e) => setGalleryTitle(e.target.value)}
                placeholder="Ej: Fotos de Concierto 2024"
              />
            </div>

            <div className="space-y-2">
              <Label>Imágenes</Label>
              <div className="border-2 border-dashed rounded-lg p-6 text-center">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <Upload className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  type="button"
                >
                  Seleccionar Imágenes
                </Button>
                <p className="text-sm text-muted-foreground mt-2">
                  Selecciona una o más imágenes (JPG, PNG, GIF)
                </p>
              </div>
            </div>

            {uploadedFiles.length > 0 && (
              <div className="space-y-2">
                <Label>Imágenes Seleccionadas ({uploadedFiles.length})</Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-60 overflow-y-auto">
                  {uploadedFiles.map((file, index) => (
                    <div
                      key={index}
                      className="relative group rounded-lg border overflow-hidden"
                    >
                      <img
                        src={URL.createObjectURL(file)}
                        alt={file.name}
                        className="w-full aspect-square object-cover"
                      />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Button
                          variant="destructive"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => removeFile(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 bg-black/70 px-2 py-1">
                        <p className="text-xs text-white truncate">{file.name}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowUploadDialog(false);
                setGalleryTitle('');
                setUploadedFiles([]);
              }}
              disabled={isUploading}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleUploadImages}
              disabled={isUploading || uploadedFiles.length === 0 || !galleryTitle.trim()}
            >
              {isUploading ? 'Subiendo...' : 'Crear Galería'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal para ver imagen en tamaño completo */}
      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Imagen Generada</DialogTitle>
          </DialogHeader>
          {selectedImage && (
            <div className="space-y-4">
              <img
                src={selectedImage.url}
                alt="Imagen generada"
                className="w-full rounded-lg"
              />
              <div className="text-sm text-muted-foreground bg-muted p-3 rounded">
                <strong>Prompt:</strong> {selectedImage.prompt}
              </div>
              <Button
                onClick={() => downloadImage(selectedImage.url, 'generated-image.jpg')}
                className="w-full gap-2"
                data-testid="button-download-full"
              >
                <Download className="h-4 w-4" />
                Descargar Imagen
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
