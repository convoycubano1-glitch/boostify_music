import React, { useState } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { storage } from "@/firebase"; 
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { Loader2, Upload, Film } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { getAuthToken } from "@/lib/auth";

interface VideoUploadProps {
  isOpen: boolean;
  onClose: () => void;
}

export function VideoUpload({ isOpen, onClose }: VideoUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<string>("featured");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Mutation para guardar los metadatos del video en la base de datos
  const saveVideoMutation = useMutation({
    mutationFn: async (videoData: {
      title: string;
      description: string;
      category: string;
      filePath: string;
      fileName: string;
    }) => {
      // Obtener el token de autenticación
      const token = await getAuthToken();
      
      // Usando fetch con autenticación
      const response = await fetch('/api/videos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(videoData),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || 'Error al guardar el video');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Video subido con éxito",
        description: "El video ha sido subido y está disponible en Boostify TV",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/files/videos/tv'] });
      resetForm();
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Error al guardar el video",
        description: `No se pudo guardar la información del video: ${error.message}`,
        variant: "destructive",
      });
      setIsUploading(false);
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      
      // Validar que sea un archivo de video
      if (!selectedFile.type.startsWith("video/")) {
        toast({
          title: "Formato no válido",
          description: "Por favor, selecciona un archivo de video (mp4, webm, etc.)",
          variant: "destructive",
        });
        return;
      }
      
      setFile(selectedFile);
    }
  };

  const resetForm = () => {
    setFile(null);
    setTitle("");
    setDescription("");
    setCategory("featured");
    setUploadProgress(0);
    setIsUploading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!file) {
      toast({
        title: "Archivo requerido",
        description: "Por favor, selecciona un archivo de video para subir",
        variant: "destructive",
      });
      return;
    }

    if (!title.trim()) {
      toast({
        title: "Título requerido",
        description: "Por favor, agrega un título para el video",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);

    try {
      // Crear una referencia única para el archivo en Firebase Storage
      const timestamp = new Date().getTime();
      const fileExtension = file.name.split('.').pop();
      const safeFileName = title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
      const fileName = `${safeFileName}_${timestamp}.${fileExtension}`;
      const storageRef = ref(storage, `videos/tv/${fileName}`);

      // Iniciar el proceso de carga
      const uploadTask = uploadBytesResumable(storageRef, file);

      // Escuchar el progreso de la carga
      uploadTask.on(
        "state_changed",
        (snapshot) => {
          const progress = Math.round(
            (snapshot.bytesTransferred / snapshot.totalBytes) * 100
          );
          setUploadProgress(progress);
        },
        (error) => {
          // Manejar errores
          console.error("Error uploading file:", error);
          toast({
            title: "Error al subir el video",
            description: `No se pudo subir el video: ${error.message}`,
            variant: "destructive",
          });
          setIsUploading(false);
        },
        async () => {
          // Subida completada, obtener URL de descarga
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);

          // Guardar los metadatos del video en la base de datos
          saveVideoMutation.mutate({
            title,
            description,
            category,
            filePath: downloadURL,
            fileName: fileName,
          });
        }
      );
    } catch (error) {
      console.error("Error during upload:", error);
      toast({
        title: "Error al subir el video",
        description: "Ocurrió un error inesperado durante la carga del video",
        variant: "destructive",
      });
      setIsUploading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Subir nuevo video</DialogTitle>
          <DialogDescription>
            Sube videos para mostrar en Boostify TV. Se admiten formatos MP4, WebM y otros formatos de video comunes.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Título del video</Label>
              <Input
                id="title"
                placeholder="Ingresa el título del video"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={isUploading}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                placeholder="Agrega una descripción para el video"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={isUploading}
                className="resize-none"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Categoría</Label>
              <Select 
                value={category} 
                onValueChange={setCategory}
                disabled={isUploading}
              >
                <SelectTrigger id="category">
                  <SelectValue placeholder="Selecciona una categoría" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="featured">Destacados</SelectItem>
                  <SelectItem value="videos">Videos generales</SelectItem>
                  <SelectItem value="live">Transmisiones en vivo</SelectItem>
                  <SelectItem value="music">Música</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="video">Archivo de video</Label>
              <div className="flex items-center gap-4">
                <Label
                  htmlFor="video"
                  className={`relative flex h-24 w-full cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 px-5 py-5 text-center transition-all hover:bg-gray-50 ${
                    file ? "border-green-500 bg-green-50" : ""
                  }`}
                >
                  {file ? (
                    <div className="flex flex-col items-center">
                      <Film className="h-8 w-8 text-green-500" />
                      <span className="mt-2 block truncate text-sm text-gray-500">
                        {file.name}
                      </span>
                      <span className="mt-1 block text-xs text-gray-500">
                        {(file.size / (1024 * 1024)).toFixed(2)} MB
                      </span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center">
                      <Upload className="h-8 w-8 text-gray-500" />
                      <span className="mt-2 block text-sm font-medium">
                        Selecciona un archivo de video
                      </span>
                      <span className="mt-1 block text-xs text-gray-500">
                        MP4, WebM, hasta 200MB
                      </span>
                    </div>
                  )}
                </Label>
                <Input
                  id="video"
                  type="file"
                  accept="video/*"
                  onChange={handleFileChange}
                  disabled={isUploading}
                  className="sr-only"
                />
              </div>
            </div>
          </div>

          {isUploading && (
            <div className="rounded-lg bg-gray-100 p-4">
              <div className="mb-2 flex justify-between text-sm font-medium">
                <span>Subiendo video...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="h-2 w-full rounded-full bg-gray-200">
                <div
                  className="h-2 rounded-full bg-orange-500 transition-all"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isUploading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isUploading || !file}>
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Subiendo...
                </>
              ) : (
                "Subir video"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}