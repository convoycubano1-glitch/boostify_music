import React, { useState, useEffect } from "react";
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
import { storage, auth } from "@/lib/firebase"; 
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { Loader2, Upload, Film, AlertCircle } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { getAuthToken } from "@/lib/auth";
import { Alert, AlertDescription } from "@/components/ui/alert";

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
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Verificar si el usuario está autenticado
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Simplemente verificar si hay un usuario actual
        const user = auth.currentUser;
        setIsAuthenticated(!!user);
        
        if (!user) {
          setError("Debes iniciar sesión para subir videos");
          console.warn("No user authenticated for video upload");
        }
      } catch (err) {
        console.error("Error checking authentication:", err);
        setError("Error al verificar la autenticación");
      }
    };
    
    checkAuth();
  }, [isOpen]);

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
      
      if (!token) {
        console.error("No se pudo obtener token de autenticación");
        throw new Error("Error de autenticación. Por favor, vuelve a iniciar sesión.");
      }
      
      console.log("Enviando metadatos de video al servidor", {
        title: videoData.title,
        category: videoData.category,
        fileName: videoData.fileName,
        hasToken: !!token,
      });
      
      // Usando fetch con autenticación
      const response = await fetch('/api/videos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(videoData),
      });
      
      // Intentar obtener la respuesta como JSON incluso en caso de error
      const responseData = await response.json().catch(err => {
        console.error("Error al parsear respuesta:", err);
        return { success: false, message: "Error al procesar la respuesta del servidor" };
      });
      
      if (!response.ok) {
        console.error("Error en respuesta del servidor:", responseData);
        throw new Error(responseData?.message || responseData?.error || 'Error al guardar el video');
      }
      
      return responseData;
    },
    onSuccess: (data) => {
      console.log("Video guardado exitosamente:", data);
      toast({
        title: "Video subido con éxito",
        description: "El video ha sido subido y está disponible en Boostify TV",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/files/videos/tv'] });
      resetForm();
      onClose();
    },
    onError: (error: Error) => {
      console.error("Error en la mutación de guardar video:", error);
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
    
    // Verificar si el usuario está autenticado
    if (!isAuthenticated) {
      setError("Debes iniciar sesión para subir videos");
      toast({
        title: "Autenticación requerida",
        description: "Por favor, inicia sesión para subir videos",
        variant: "destructive",
      });
      return;
    }
    
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
    
    // Verificar el tamaño del archivo (máximo 200MB)
    const maxSizeInBytes = 200 * 1024 * 1024; // 200MB
    if (file.size > maxSizeInBytes) {
      toast({
        title: "Archivo demasiado grande",
        description: `El archivo es demasiado grande (${(file.size / (1024 * 1024)).toFixed(2)}MB). El tamaño máximo permitido es 200MB.`,
        variant: "destructive",
      });
      return;
    }

    // Todo en orden, comenzar la carga
    setIsUploading(true);
    setError(null);

    try {
      // Obtener el usuario actual para metadatos
      const user = auth.currentUser;
      if (!user || !user.uid) {
        throw new Error("Error de autenticación. Por favor, vuelve a iniciar sesión.");
      }
      
      // Crear una referencia única para el archivo en Firebase Storage
      const timestamp = new Date().getTime();
      const fileExtension = file.name.split('.').pop();
      const safeFileName = title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
      const fileName = `${safeFileName}_${timestamp}.${fileExtension}`;
      
      // Incluir el ID del usuario en la ruta para mejorar la organización
      const storageRef = ref(storage, `videos/${category}/${fileName}`);

      // Iniciar el proceso de carga con metadatos adicionales
      const uploadTask = uploadBytesResumable(storageRef, file, {
        contentType: file.type,
        customMetadata: {
          userId: user.uid,
          category: category,
          title: title
        }
      });

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
          // Manejar errores comunes de Firebase Storage
          setIsUploading(false);
          console.error("Error al subir archivo:", error);
          
          let errorMessage = "Error al subir el archivo.";
          if (error.code === "storage/unauthorized") {
            errorMessage = "No tienes permisos para realizar esta acción.";
          } else if (error.code === "storage/canceled") {
            errorMessage = "La carga fue cancelada.";
          } else if (error.code === "storage/unknown") {
            errorMessage = "Error desconocido al subir el archivo.";
          }
          
          toast({
            title: "Error al subir el video",
            description: errorMessage,
            variant: "destructive",
          });
          
          setError(errorMessage);
        },
        async () => {
          // Carga completa, obtener URL de descarga
          try {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            console.log("Archivo subido exitosamente. URL:", downloadURL);
            
            // Guardar los metadatos del video en la base de datos
            const videoData = {
              title: title,
              description: description,
              category: category,
              filePath: `videos/${category}/${fileName}`,
              fileName: fileName,
              userId: user.uid,
              fileType: file.type,
              fileSize: file.size,
              downloadURL: downloadURL,
              uploadedAt: new Date().toISOString(),
            };
            
            // Usar la mutación para guardar los metadatos
            saveVideoMutation.mutate({
              title: title,
              description: description,
              category: category,
              filePath: `videos/${category}/${fileName}`,
              fileName: fileName,
            });
            
          } catch (error) {
            console.error("Error al obtener URL de descarga:", error);
            setIsUploading(false);
            setError("Error al procesar el video. Por favor, intenta nuevamente.");
            
            toast({
              title: "Error al procesar el video",
              description: "No se pudo completar el procesamiento del video.",
              variant: "destructive",
            });
          }
        }
      );
    } catch (error) {
      console.error("Error al iniciar la carga:", error);
      setIsUploading(false);
      setError("Error al iniciar la carga del video.");
      
      toast({
        title: "Error",
        description: "No se pudo iniciar la carga del video.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Film className="h-5 w-5" />
            Subir Video Promocional
          </DialogTitle>
          <DialogDescription>
            Sube y comparte videos para promocionar productos como afiliado
          </DialogDescription>
        </DialogHeader>
        
        {error && (
          <Alert variant="destructive" className="my-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <div>
                <Label htmlFor="title" className="mb-2 block">Título del video</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Añade un título descriptivo"
                  disabled={isUploading}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="description" className="mb-2 block">Descripción (opcional)</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe el contenido del video"
                  rows={3}
                  disabled={isUploading}
                />
              </div>
              
              <div>
                <Label htmlFor="category" className="mb-2 block">Categoría</Label>
                <Select
                  value={category}
                  onValueChange={setCategory}
                  disabled={isUploading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona una categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="featured">Destacado</SelectItem>
                    <SelectItem value="tutorial">Tutorial</SelectItem>
                    <SelectItem value="review">Análisis de producto</SelectItem>
                    <SelectItem value="testimonial">Testimonio</SelectItem>
                    <SelectItem value="promo">Promocional</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="video" className="mb-2 block">Archivo de video</Label>
                <div className={`border-2 border-dashed rounded-md p-6 ${isUploading ? 'bg-muted/50' : 'hover:bg-muted/10'} text-center transition-colors relative ${file ? 'border-primary' : 'border-muted-foreground/50'}`}>
                  <Input
                    id="video"
                    type="file"
                    accept="video/*"
                    onChange={handleFileChange}
                    className="sr-only"
                    disabled={isUploading}
                  />
                  {!file ? (
                    <label htmlFor="video" className="flex flex-col items-center gap-2 cursor-pointer">
                      <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                      <span className="text-sm font-medium">Haz clic para seleccionar video</span>
                      <span className="text-xs text-muted-foreground">MP4, WebM o MOV (max. 200MB)</span>
                    </label>
                  ) : (
                    <div className="flex flex-col items-center">
                      <Film className="h-8 w-8 text-primary mb-2" />
                      <span className="text-sm font-medium">{file.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {(file.size / (1024 * 1024)).toFixed(2)} MB - {file.type}
                      </span>
                      {!isUploading && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="mt-2"
                          onClick={() => setFile(null)}
                        >
                          Cambiar archivo
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          {isUploading && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm mb-1">
                <span>Subiendo video...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-300 ease-in-out"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
              <p className="text-xs text-muted-foreground">
                Por favor no cierres esta ventana hasta que la carga se complete
              </p>
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
            <Button
              type="submit"
              disabled={!file || isUploading}
            >
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Subiendo...
                </>
              ) : (
                "Subir Video"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}