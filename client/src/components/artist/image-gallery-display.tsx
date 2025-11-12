import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { Skeleton } from "../ui/skeleton";
import { Badge } from "../ui/badge";
import { db } from "../../firebase";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { Image as ImageIcon, Download, Trash2, RotateCw } from "lucide-react";
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
  const { toast } = useToast();

  useEffect(() => {
    loadGalleries();
  }, [artistId]);

  const loadGalleries = async () => {
    try {
      setIsLoading(true);
      const galleriesRef = collection(db, "image_galleries");
      const q = query(
        galleriesRef,
        where("userId", "==", artistId),
        orderBy("createdAt", "desc")
      );
      
      const querySnapshot = await getDocs(q);
      const galleriesData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as ImageGallery[];
      
      setGalleries(galleriesData);
    } catch (error) {
      console.error("Error loading galleries:", error);
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

  if (galleries.length === 0) {
    return null; // No mostrar nada si no hay galerías
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <ImageIcon className="h-5 w-5" />
        <h2 className="text-2xl font-bold">Galerías de Imágenes</h2>
      </div>

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
