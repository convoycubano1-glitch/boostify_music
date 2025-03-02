import React, { useState, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, Upload, RefreshCw, Download, Loader2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { getAuthToken } from '@/lib/auth';

interface FaceSwapResult {
  id: string;
  url: string;
  status: 'completed' | 'processing' | 'failed';
  errorMessage?: string;
  progress?: number; // Porcentaje de progreso (0-100)
  rawResponse?: any; // Datos crudos de la respuesta para diagnóstico
}

/**
 * Componente de intercambio de rostros
 * Permite a los usuarios subir dos imágenes y realizar un intercambio de rostros entre ellas
 */
export default function FaceSwap() {
  const [sourceImage, setSourceImage] = useState<File | null>(null);
  const [targetImage, setTargetImage] = useState<File | null>(null);
  const [sourcePreview, setSourcePreview] = useState<string | null>(null);
  const [targetPreview, setTargetPreview] = useState<string | null>(null);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [taskId, setTaskId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('upload');
  const [progress, setProgress] = useState(0); // Progreso del procesamiento (0-100)
  const sourceInputRef = useRef<HTMLInputElement>(null);
  const targetInputRef = useRef<HTMLInputElement>(null);

  /**
   * Maneja la subida de imágenes y genera previsualizaciones usando data URLs
   * en lugar de blob URLs para compatibilidad con el servidor
   */
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>, type: 'source' | 'target') => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Verificar que sea una imagen
    if (!file.type.startsWith('image/')) {
      setError('Por favor, sube archivos de imagen válidos (JPG, PNG, etc.)');
      return;
    }

    // Verificar tamaño máximo (10MB)
    const MAX_SIZE = 10 * 1024 * 1024; // 10MB en bytes
    if (file.size > MAX_SIZE) {
      setError(`La imagen es demasiado grande. El tamaño máximo es de 10MB. Esta imagen tiene ${Math.round(file.size / (1024 * 1024))}MB.`);
      return;
    }

    console.log(`Cargando imagen (${type}) de tipo ${file.type} y tamaño ${file.size} bytes`);

    // Usamos FileReader para obtener una URL de datos (data URL)
    // en lugar de usar URL.createObjectURL que crea URLs de blob temporales
    const reader = new FileReader();
    
    reader.onload = () => {
      const dataUrl = reader.result as string;
      console.log(`Imagen convertida a data URL (${dataUrl.substring(0, 30)}...)`);
      
      if (type === 'source') {
        setSourceImage(file);
        setSourcePreview(dataUrl); // Guardamos la data URL directamente
      } else {
        setTargetImage(file);
        setTargetPreview(dataUrl); // Guardamos la data URL directamente
      }
    };
    
    reader.onerror = (error) => {
      console.error('Error al leer el archivo:', error);
      setError('Error al leer el archivo. Intenta con otra imagen.');
    };
    
    // Convertir el archivo a data URL
    reader.readAsDataURL(file);
    setError(null);
  };

  /**
   * Convierte el archivo a una URL de datos directamente
   * Necesario para que la API de PiAPI pueda acceder al contenido
   */
  const fileToDataUrl = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  /**
   * Realiza el swap de caras llamando a la API
   */
  const handleFaceSwap = async () => {
    if (!sourceImage || !targetImage) {
      setError('Por favor, sube ambas imágenes para continuar');
      return;
    }

    setIsLoading(true);
    setError(null);
    setResultImage(null);
    setTaskId(null);
    setProgress(0); // Reiniciar el progreso

    try {
      // Usar las previsualizaciones (que ya son URLs) directamente,
      // o convertir los archivos a URLs de datos
      const sourceImageUrl = sourcePreview || await fileToDataUrl(sourceImage);
      const targetImageUrl = targetPreview || await fileToDataUrl(targetImage);

      // Obtener token de autenticación
      const token = await getAuthToken();
      const headers: HeadersInit = {
        'Content-Type': 'application/json'
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      // Enviar solicitud a nuestro proxy de API con URLs en formato JSON
      console.log('Enviando imágenes al servidor...');
      
      const response = await fetch('/api/proxy/face-swap/start', {
        method: 'POST',
        body: JSON.stringify({
          swap_image: sourceImageUrl,  // Imagen con el rostro (fuente)
          target_image: targetImageUrl // Imagen donde colocar el rostro (destino)
        }),
        headers
      });
      
      console.log('Respuesta del servidor recibida...');

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${await response.text()}`);
      }

      const data = await response.json();
      
      if (data.success && data.taskId) {
        setTaskId(data.taskId);
        setActiveTab('result');
        
        // Comenzar a verificar el estado cada 2 segundos
        checkTaskStatus(data.taskId);
      } else if (data.error) {
        throw new Error(data.error);
      } else {
        throw new Error('Error desconocido al iniciar el proceso de face swap');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al procesar las imágenes';
      setError(errorMessage);
      setIsLoading(false);
    }
  };

  /**
   * Verifica el estado de la tarea de procesamiento
   */
  const checkTaskStatus = async (id: string) => {
    try {
      console.log(`Verificando estado de la tarea ${id}...`);
      
      const response = await fetch(`/api/proxy/face-swap/status?taskId=${id}`);
      
      if (!response.ok) {
        console.error(`Error ${response.status} al verificar estado:`, await response.text());
        throw new Error(`Error ${response.status}: ${await response.text()}`);
      }
      
      const result = await response.json();
      console.log('Respuesta de estado:', result);
      
      if (result.status === 'completed' && result.url) {
        console.log('Proceso completado con éxito. URL de resultado:', result.url);
        setProgress(100); // Establecer progreso al 100% al completar
        setResultImage(result.url);
        setIsLoading(false);
      } else if (result.status === 'failed') {
        console.error('El proceso falló:', result.errorMessage || 'Razón desconocida');
        
        // Crear un mensaje de error más detallado
        let detailedError = result.errorMessage || 'El procesamiento ha fallado';
        
        // Si hay información adicional, agregarla al mensaje
        if (result.rawResponse) {
          try {
            const errorDetails = typeof result.rawResponse === 'object' 
              ? JSON.stringify(result.rawResponse, null, 2)
              : result.rawResponse;
            console.log('Detalles adicionales del error:', errorDetails);
            // No añadimos los detalles crudos al mensaje de usuario, pero los registramos para depuración
          } catch (e) {
            console.error('Error al formatear detalles adicionales:', e);
          }
        }
        
        // Si el error está relacionado con rostros no detectados
        if (detailedError.toLowerCase().includes('face') && 
            (detailedError.toLowerCase().includes('not found') || 
             detailedError.toLowerCase().includes('not detect'))) {
          detailedError = 'No se pudo detectar un rostro en una o ambas imágenes. Por favor, asegúrate de que los rostros sean claramente visibles en las imágenes.';
        }
        
        setError(detailedError);
        setIsLoading(false);
      } else if (result.status === 'processing') {
        // Actualizar el progreso si está disponible
        if (typeof result.progress === 'number') {
          console.log('El proceso sigue en curso. Progreso:', result.progress);
          setProgress(result.progress);
        } else {
          console.log('El proceso sigue en curso. Progreso: desconocido');
          // Si no hay progreso específico, incrementamos gradualmente hasta máximo 90%
          setProgress(prev => Math.min(prev + 5, 90));
        }
        // Verificar de nuevo en 2 segundos
        setTimeout(() => checkTaskStatus(id), 2000);
      } else {
        console.warn('Estado desconocido:', result.status);
        // Estado desconocido, seguimos verificando
        setTimeout(() => checkTaskStatus(id), 3000); // Aumentamos el tiempo de espera para estados desconocidos
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al verificar el estado del procesamiento';
      console.error('Error en checkTaskStatus:', errorMessage);
      
      // Mensaje más amigable para el usuario
      let userMessage = 'Ha ocurrido un error al verificar el estado del procesamiento. ';
      
      // Si parece un error de red
      if (errorMessage.toLowerCase().includes('network') || 
          errorMessage.toLowerCase().includes('timeout') ||
          errorMessage.toLowerCase().includes('abort')) {
        userMessage += 'Por favor, verifica tu conexión a internet e intenta nuevamente.';
      } else {
        userMessage += 'Por favor, intenta nuevamente más tarde.';
      }
      
      setError(userMessage);
      setIsLoading(false);
    }
  };

  /**
   * Descarga la imagen resultante
   */
  const handleDownloadResult = () => {
    if (!resultImage) return;
    
    // Crear un elemento temporal para la descarga
    const link = document.createElement('a');
    link.href = resultImage;
    link.download = 'face-swap-result.jpg';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  /**
   * Reinicia el proceso
   */
  const handleReset = () => {
    // Limpiar todos los estados
    setSourceImage(null);
    setTargetImage(null);
    setSourcePreview(null);
    setTargetPreview(null);
    setResultImage(null);
    setIsLoading(false);
    setError(null);
    setTaskId(null);
    setProgress(0); // Reiniciar el progreso
    setActiveTab('upload');
    
    // Limpiar los inputs de archivos
    if (sourceInputRef.current) sourceInputRef.current.value = '';
    if (targetInputRef.current) targetInputRef.current.value = '';
  };

  return (
    <Card className="w-full">
      <CardContent className="p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="upload">Subir Imágenes</TabsTrigger>
            <TabsTrigger value="result" disabled={!taskId && !resultImage}>Resultado</TabsTrigger>
          </TabsList>
          
          <TabsContent value="upload" className="space-y-6">
            {/* Sección de carga de imágenes */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Imagen de origen (rostro a intercambiar) */}
              <div className="space-y-4">
                <Label htmlFor="source-image">Imagen con el rostro a utilizar</Label>
                <div className="flex flex-col items-center gap-4">
                  <div 
                    className="border-2 border-dashed rounded-lg w-full aspect-square flex flex-col items-center justify-center p-4 hover:bg-muted/30 transition-colors cursor-pointer"
                    onClick={() => sourceInputRef.current?.click()}
                  >
                    {sourcePreview ? (
                      <img 
                        src={sourcePreview} 
                        alt="Rostro a intercambiar" 
                        className="h-full w-full object-contain"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center text-center p-4">
                        <Upload className="h-10 w-10 mb-2 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">
                          Haz clic para seleccionar o arrastra una imagen
                        </p>
                      </div>
                    )}
                  </div>
                  <Input
                    ref={sourceInputRef}
                    id="source-image"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleImageUpload(e, 'source')}
                  />
                  <Button 
                    variant="outline" 
                    onClick={() => sourceInputRef.current?.click()}
                    className="w-full"
                  >
                    Seleccionar imagen
                  </Button>
                </div>
              </div>
              
              {/* Imagen destino (donde se colocará el rostro) */}
              <div className="space-y-4">
                <Label htmlFor="target-image">Imagen donde colocar el rostro</Label>
                <div className="flex flex-col items-center gap-4">
                  <div 
                    className="border-2 border-dashed rounded-lg w-full aspect-square flex flex-col items-center justify-center p-4 hover:bg-muted/30 transition-colors cursor-pointer"
                    onClick={() => targetInputRef.current?.click()}
                  >
                    {targetPreview ? (
                      <img 
                        src={targetPreview} 
                        alt="Imagen destino" 
                        className="h-full w-full object-contain"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center text-center p-4">
                        <Upload className="h-10 w-10 mb-2 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">
                          Haz clic para seleccionar o arrastra una imagen
                        </p>
                      </div>
                    )}
                  </div>
                  <Input
                    ref={targetInputRef}
                    id="target-image"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleImageUpload(e, 'target')}
                  />
                  <Button 
                    variant="outline" 
                    onClick={() => targetInputRef.current?.click()}
                    className="w-full"
                  >
                    Seleccionar imagen
                  </Button>
                </div>
              </div>
            </div>
            
            {/* Botones de acción */}
            <div className="flex flex-col sm:flex-row justify-end gap-2 pt-4">
              <Button 
                variant="outline" 
                onClick={handleReset} 
                disabled={isLoading || (!sourceImage && !targetImage)}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Reiniciar
              </Button>
              <Button 
                onClick={handleFaceSwap} 
                disabled={isLoading || !sourceImage || !targetImage}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Procesando...
                  </>
                ) : 'Intercambiar rostros'}
              </Button>
            </div>
          </TabsContent>
          
          <TabsContent value="result" className="space-y-6">
            {/* Sección de resultados */}
            <div className="flex flex-col items-center gap-6">
              <div className="w-full max-w-md border rounded-lg overflow-hidden">
                {isLoading ? (
                  <div className="aspect-square flex items-center justify-center bg-muted/20">
                    <div className="flex flex-col items-center gap-4 w-4/5">
                      <Loader2 className="h-10 w-10 animate-spin text-primary" />
                      <p className="text-sm text-muted-foreground">Procesando imágenes...</p>
                      
                      {/* Barra de progreso */}
                      <div className="w-full space-y-2">
                        <Progress value={progress} className="h-2" />
                        <p className="text-xs text-center text-muted-foreground">
                          {progress < 100 ? (
                            <span>{Math.round(progress)}% completado</span>
                          ) : (
                            <span className="animate-pulse">Finalizando...</span>
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : resultImage ? (
                  <img 
                    src={resultImage} 
                    alt="Resultado del intercambio de rostros" 
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="aspect-square flex items-center justify-center bg-muted/20">
                    <p className="text-sm text-muted-foreground">
                      No hay resultados disponibles
                    </p>
                  </div>
                )}
              </div>
              
              {resultImage && (
                <Button onClick={handleDownloadResult}>
                  <Download className="h-4 w-4 mr-2" />
                  Descargar resultado
                </Button>
              )}
              
              <Button variant="outline" onClick={handleReset}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Iniciar nuevo intercambio
              </Button>
            </div>
          </TabsContent>
        </Tabs>
        
        {/* Mensajes de error */}
        {error && (
          <Alert variant="destructive" className="mt-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}