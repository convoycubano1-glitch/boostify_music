import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "../ui/dialog";
import { Skeleton } from "../ui/skeleton";
import { Badge } from "../ui/badge";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { db, storage } from "../../firebase";
import { collection, query, where, getDocs, doc, setDoc, updateDoc, arrayUnion, deleteDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { Image as ImageIcon, Download, Trash2, RotateCw, Upload, Plus, ChevronLeft, ChevronRight, Maximize2 } from "lucide-react";
import { useToast } from "../../hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../ui/alert-dialog";

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
  refreshKey?: number;
}

export function ImageGalleryDisplay({ artistId, isOwner = false, refreshKey = 0 }: ImageGalleryDisplayProps) {
  const [galleries, setGalleries] = useState<ImageGallery[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [selectedImage, setSelectedImage] = useState<{ url: string; prompt: string } | null>(null);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [showAddToGalleryDialog, setShowAddToGalleryDialog] = useState(false);
  const [selectedGalleryToAddImages, setSelectedGalleryToAddImages] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [additionalFiles, setAdditionalFiles] = useState<File[]>([]);
  const [galleryTitle, setGalleryTitle] = useState('');
  const [galleryToDelete, setGalleryToDelete] = useState<string | null>(null);
  const [imageToDelete, setImageToDelete] = useState<{ galleryId: string; imageId: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const additionalFilesInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    console.log('🖼️ ImageGalleryDisplay montado para artistId:', artistId, 'refreshKey:', refreshKey);
    loadGalleries();
  }, [artistId, refreshKey]);

  // Auto-rotación de imágenes cada 5 segundos
  useEffect(() => {
    if (galleries.length === 0 || isPaused) return;

    const allImages = galleries.flatMap(g => g.generatedImages);
    if (allImages.length === 0) return;

    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % allImages.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [galleries, isPaused]);

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
      
      galleriesData.sort((a, b) => {
        const dateA = new Date(a.createdAt).getTime();
        const dateB = new Date(b.createdAt).getTime();
        return dateB - dateA;
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

  const handleDeleteGallery = async () => {
    if (!galleryToDelete) return;

    setIsDeleting(true);
    try {
      await deleteDoc(doc(db, "image_galleries", galleryToDelete));
      
      toast({
        title: "Galería eliminada",
        description: "La galería ha sido eliminada exitosamente.",
      });

      setGalleryToDelete(null);
      loadGalleries();
    } catch (error) {
      console.error("Error deleting gallery:", error);
      toast({
        title: "Error",
        description: "No se pudo eliminar la galería. Por favor intenta de nuevo.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteImage = async () => {
    if (!imageToDelete) return;
    
    try {
      setIsDeleting(true);
      const { galleryId, imageId } = imageToDelete;
      
      // Obtener la galería actual
      const gallery = galleries.find(g => g.id === galleryId);
      if (!gallery) {
        throw new Error("Galería no encontrada");
      }
      
      // Filtrar la imagen a eliminar
      const updatedImages = gallery.generatedImages.filter(img => img.id !== imageId);
      
      // Si no quedan imágenes, eliminar toda la galería
      if (updatedImages.length === 0) {
        await deleteDoc(doc(db, "image_galleries", galleryId));
        toast({
          title: "Galería eliminada",
          description: "Se eliminó la última imagen, por lo que se eliminó toda la galería",
        });
      } else {
        // Actualizar la galería con las imágenes restantes
        await updateDoc(doc(db, "image_galleries", galleryId), {
          generatedImages: updatedImages,
          updatedAt: new Date().toISOString()
        });
        
        toast({
          title: "Imagen eliminada",
          description: "La imagen ha sido eliminada correctamente",
        });
      }
      
      setImageToDelete(null);
      await loadGalleries();
    } catch (error) {
      console.error("Error deleting image:", error);
      toast({
        title: "Error",
        description: "No se pudo eliminar la imagen",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleAddImagesToGallery = async () => {
    if (!selectedGalleryToAddImages || additionalFiles.length === 0) {
      toast({
        title: "Error",
        description: "Por favor selecciona al menos una imagen",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsUploading(true);
      const gallery = galleries.find(g => g.id === selectedGalleryToAddImages);
      if (!gallery) {
        throw new Error("Galería no encontrada");
      }

      // Subir imágenes a Cloudinary
      const uploadedImages: GeneratedImage[] = [];
      for (const file of additionalFiles) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', 'boostify_preset');
        
        const response = await fetch(
          'https://api.cloudinary.com/v1_1/dq3chxk1v/image/upload',
          { method: 'POST', body: formData }
        );
        
        const data = await response.json();
        uploadedImages.push({
          id: crypto.randomUUID(),
          url: data.secure_url,
          prompt: `Agregado a ${gallery.singleName}`,
          createdAt: new Date().toISOString(),
        });
      }

      // Actualizar la galería con las nuevas imágenes
      const updatedImages = [...gallery.generatedImages, ...uploadedImages];
      await updateDoc(doc(db, "image_galleries", selectedGalleryToAddImages), {
        generatedImages: updatedImages,
        updatedAt: new Date().toISOString()
      });

      toast({
        title: "¡Imágenes agregadas!",
        description: `Se han agregado ${uploadedImages.length} imágenes a la galería.`,
      });

      setShowAddToGalleryDialog(false);
      setAdditionalFiles([]);
      setSelectedGalleryToAddImages(null);
      await loadGalleries();
    } catch (error) {
      console.error("Error adding images to gallery:", error);
      toast({
        title: "Error al agregar",
        description: "No se pudieron agregar las imágenes. Por favor intenta de nuevo.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleAdditionalFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setAdditionalFiles(files);
  };

  const allImages = galleries.flatMap(g => g.generatedImages.map(img => ({
    ...img,
    galleryName: g.singleName,
    galleryId: g.id
  })));

  const goToPrevious = () => {
    setCurrentImageIndex((prev) => (prev - 1 + allImages.length) % allImages.length);
    setIsPaused(true);
    setTimeout(() => setIsPaused(false), 10000);
  };

  const goToNext = () => {
    setCurrentImageIndex((prev) => (prev + 1) % allImages.length);
    setIsPaused(true);
    setTimeout(() => setIsPaused(false), 10000);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    );
  }

  if (galleries.length === 0 && !isOwner) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Hero Carousel de Galerías */}
      {allImages.length > 0 && (
        <div className="relative h-[60vh] md:h-[70vh] lg:h-[80vh] rounded-2xl overflow-hidden group">
          {/* Imagen de fondo con animación */}
          <div className="absolute inset-0">
            {allImages.map((image, index) => (
              <div
                key={image.id}
                className={`absolute inset-0 transition-all duration-1000 ease-in-out ${
                  index === currentImageIndex
                    ? 'opacity-100 scale-100'
                    : 'opacity-0 scale-105'
                }`}
              >
                <img
                  src={image.url}
                  alt={image.galleryName}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
              </div>
            ))}
          </div>

          {/* Contenido fijo encima */}
          <div className="relative h-full flex flex-col justify-between p-6 md:p-8 z-10">
            {/* Badge superior izquierdo */}
            <div>
              <Badge variant="secondary" className="backdrop-blur-md bg-white/20 text-white border-white/30 w-fit">
                <ImageIcon className="h-3 w-3 mr-1" />
                {currentImageIndex + 1} / {allImages.length}
              </Badge>
            </div>

            {/* Botones de acción en la parte inferior */}
            <div className="flex flex-wrap gap-3">
              <Button
                onClick={() => setSelectedImage({
                  url: allImages[currentImageIndex].url,
                  prompt: allImages[currentImageIndex].prompt
                })}
                className="backdrop-blur-md bg-white/20 hover:bg-white/30 text-white border border-white/30"
                data-testid="button-view-full"
              >
                <Maximize2 className="h-4 w-4 mr-2" />
                Ver Completa
              </Button>
              <Button
                onClick={() => downloadImage(
                  allImages[currentImageIndex].url,
                  `${allImages[currentImageIndex].galleryName}-${currentImageIndex + 1}.jpg`
                )}
                variant="outline"
                className="backdrop-blur-md bg-black/20 hover:bg-black/30 text-white border-white/30"
                data-testid="button-download-current"
              >
                <Download className="h-4 w-4 mr-2" />
                Descargar
              </Button>
            </div>
          </div>

          {/* Controles de navegación */}
          <button
            onClick={goToPrevious}
            className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-3 rounded-full backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all duration-300 z-20"
            aria-label="Anterior"
            data-testid="button-prev-image"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button
            onClick={goToNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-3 rounded-full backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all duration-300 z-20"
            aria-label="Siguiente"
            data-testid="button-next-image"
          >
            <ChevronRight className="h-6 w-6" />
          </button>

          {/* Indicadores de posición */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-20">
            {allImages.map((_, index) => (
              <button
                key={index}
                onClick={() => {
                  setCurrentImageIndex(index);
                  setIsPaused(true);
                  setTimeout(() => setIsPaused(false), 10000);
                }}
                className={`h-2 rounded-full transition-all duration-300 ${
                  index === currentImageIndex
                    ? 'w-8 bg-white'
                    : 'w-2 bg-white/50 hover:bg-white/75'
                }`}
                aria-label={`Ir a imagen ${index + 1}`}
              />
            ))}
          </div>

          {/* Botón de administración para el dueño */}
          {isOwner && (
            <div className="absolute top-6 right-6 z-20">
              <Button
                onClick={() => setShowUploadDialog(true)}
                className="backdrop-blur-md bg-white/20 hover:bg-white/30 text-white border border-white/30"
                data-testid="button-upload-images"
              >
                <Plus className="h-4 w-4 mr-2" />
                Subir Imágenes
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Vista de tarjetas para gestión (solo visible para el dueño) */}
      {isOwner && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5" />
              <h3 className="text-xl font-bold">Gestionar Galerías</h3>
            </div>
          </div>

          {galleries.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                <ImageIcon className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No tienes galerías de imágenes aún.</p>
                <p className="text-sm mt-1">Haz clic en "Subir Imágenes" para crear tu primera galería.</p>
              </CardContent>
            </Card>
          ) : (
            galleries.map((gallery) => (
              <Card key={gallery.id} data-testid={`gallery-${gallery.id}`}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle>{gallery.singleName}</CardTitle>
                      <CardDescription>
                        {gallery.generatedImages.length} imágenes
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">
                        {new Date(gallery.createdAt).toLocaleDateString()}
                      </Badge>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => {
                          setSelectedGalleryToAddImages(gallery.id);
                          setShowAddToGalleryDialog(true);
                        }}
                        data-testid={`button-add-images-${gallery.id}`}
                        title="Agregar más imágenes"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="icon"
                        onClick={() => setGalleryToDelete(gallery.id)}
                        data-testid={`button-delete-gallery-${gallery.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
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
                          {isOwner && (
                            <Button
                              variant="destructive"
                              size="icon"
                              className="h-8 w-8"
                              onClick={(e) => {
                                e.stopPropagation();
                                setImageToDelete({ galleryId: gallery.id, imageId: image.id });
                              }}
                              data-testid={`button-delete-image-${index}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

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

      {/* Diálogo para agregar imágenes a galería existente */}
      <Dialog open={showAddToGalleryDialog} onOpenChange={setShowAddToGalleryDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Agregar Imágenes a la Galería</DialogTitle>
            <DialogDescription>
              {selectedGalleryToAddImages && 
                `Agrega más imágenes a "${galleries.find(g => g.id === selectedGalleryToAddImages)?.singleName}"`
              }
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Seleccionar Imágenes</Label>
              <div className="border-2 border-dashed rounded-lg p-6 text-center">
                <input
                  ref={additionalFilesInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleAdditionalFileSelect}
                  className="hidden"
                />
                <Upload className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm text-muted-foreground mb-3">
                  Arrastra imágenes aquí o haz clic para seleccionar
                </p>
                <Button
                  variant="outline"
                  onClick={() => additionalFilesInputRef.current?.click()}
                  type="button"
                >
                  Seleccionar Archivos
                </Button>
              </div>
            </div>

            {additionalFiles.length > 0 && (
              <div className="space-y-2">
                <Label>Imágenes seleccionadas ({additionalFiles.length})</Label>
                <div className="grid grid-cols-3 gap-3">
                  {additionalFiles.map((file, index) => (
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
                          onClick={() => {
                            setAdditionalFiles(additionalFiles.filter((_, i) => i !== index));
                          }}
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
                setShowAddToGalleryDialog(false);
                setAdditionalFiles([]);
                setSelectedGalleryToAddImages(null);
              }}
              disabled={isUploading}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleAddImagesToGallery}
              disabled={isUploading || additionalFiles.length === 0}
            >
              {isUploading ? 'Agregando...' : `Agregar ${additionalFiles.length} imagen${additionalFiles.length !== 1 ? 'es' : ''}`}
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

      {/* Diálogo de confirmación para eliminar galería */}
      <AlertDialog open={!!galleryToDelete} onOpenChange={() => setGalleryToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar galería?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente esta galería y todas sus imágenes.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteGallery}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Eliminando...' : 'Eliminar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Diálogo de confirmación para eliminar imagen individual */}
      <AlertDialog open={!!imageToDelete} onOpenChange={() => setImageToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar imagen?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. La imagen será eliminada de la galería.
              {imageToDelete && galleries.find(g => g.id === imageToDelete.galleryId)?.generatedImages.length === 1 && (
                <span className="block mt-2 font-semibold text-amber-600">
                  ⚠️ Esta es la última imagen de la galería. Al eliminarla, se eliminará toda la galería.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteImage}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isDeleting}
            >
              {isDeleting ? "Eliminando..." : "Eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
