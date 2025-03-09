import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, AlertTriangle, CheckCircle, Info, Loader2, Upload } from 'lucide-react';

interface TryOnResult {
  success: boolean;
  taskId?: string;
  status?: 'pending' | 'processing' | 'completed' | 'failed';
  errorMessage?: string;
  url?: string;
  progress?: number;
  imageSize?: string;
  originalFormat?: string;
  width?: number;
  height?: number;
}

interface ImageValidationResult {
  isValid: boolean;
  errorMessage?: string;
  width?: number;
  height?: number;
  originalFormat?: string;
  sizeInMB?: number;
  processedImage?: string;
}

// Servicio de cliente simplificado para Kling API
const klingService = {
  // Iniciar el proceso de Try-On
  startTryOn: async (modelImage: string, clothingImage: string): Promise<TryOnResult> => {
    try {
      // Estructura siguiendo el formato esperado por el API de Kling
      // Nota: "task_type" debe ser "ai_try_on" (verificado mediante pruebas directas)
      const response = await axios.post('/api/kling/try-on/start', {
        model: "kling",
        task_type: "ai_try_on", // Parámetro verificado con pruebas directas contra la API
        input: {
          model_input: modelImage,
          dress_input: clothingImage,
          batch_size: 1
        }
      });
      return response.data;
    } catch (error: any) {
      console.error('Error iniciando Try-On:', error);
      
      // Manejar específicamente el error de clave API con más detalle
      if (error.response?.status === 401 || 
          error.response?.data?.message === 'Invalid API key' || 
          error.response?.data?.error === 'Invalid API key') {
        console.error('❌ Error de autenticación con la API de Kling. Detalles:', error.response?.data);
        return {
          success: false,
          status: 'failed',
          errorMessage: 'Error de autenticación: La clave API no es válida o ha expirado. Por favor, contacte al administrador.'
        };
      }
      
      return {
        success: false,
        status: 'failed',
        errorMessage: error.response?.data?.error || error.message || 'Error desconocido al iniciar Try-On'
      };
    }
  },

  // Verificar el estado del proceso
  checkTryOnStatus: async (taskId: string): Promise<TryOnResult> => {
    try {
      // Cambiado de GET a POST para coincidir con la implementación del servidor
      const response = await axios.post('/api/kling/try-on/status', { taskId });
      
      // Asegurarnos que si hay un objeto de error en la respuesta, lo convertimos a string
      if (response.data.errorMessage && typeof response.data.errorMessage === 'object') {
        response.data.errorMessage = JSON.stringify(response.data.errorMessage);
      }
      
      return response.data;
    } catch (error: any) {
      console.error('Error verificando estado:', error);
      
      // Manejar específicamente el error de clave API con más detalle
      if (error.response?.status === 401 || 
          error.response?.data?.message === 'Invalid API key' || 
          error.response?.data?.error === 'Invalid API key') {
        console.error('❌ Error de autenticación con la API de Kling. Detalles:', error.response?.data);
        return {
          success: false,
          status: 'failed',
          errorMessage: 'Error de autenticación: La clave API no es válida o ha expirado. Por favor, contacte al administrador.'
        };
      }
      
      // Asegurarnos de que el mensaje de error es siempre un string
      let errorMessage = 'Error desconocido al verificar estado';
      
      if (error.response?.data?.error) {
        errorMessage = typeof error.response.data.error === 'object' 
          ? JSON.stringify(error.response.data.error) 
          : error.response.data.error;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      return {
        success: false,
        status: 'failed',
        errorMessage: errorMessage
      };
    }
  },

  // Verificar validez de una imagen para Kling API
  validateImage: async (imageDataUrl: string): Promise<ImageValidationResult> => {
    try {
      const response = await axios.post('/api/kling/validate-image', {
        imageDataUrl
      });
      return response.data;
    } catch (error: any) {
      console.error('Error validando imagen:', error);
      return {
        isValid: false,
        errorMessage: error.response?.data?.error || error.message || 'Error desconocido al validar imagen'
      };
    }
  }
};

export function SimpleTryOnComponent() {
  const [modelImage, setModelImage] = useState<string | null>(null);
  const [clothingImage, setClothingImage] = useState<string | null>(null);
  const [result, setResult] = useState<TryOnResult | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [modelValidation, setModelValidation] = useState<ImageValidationResult | null>(null);
  const [clothingValidation, setClothingValidation] = useState<ImageValidationResult | null>(null);
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null);
  const [activeTab, setActiveTab] = useState<string>('model');

  const modelInputRef = useRef<HTMLInputElement>(null);
  const clothingInputRef = useRef<HTMLInputElement>(null);

  // Limpia el intervalo de polling al desmontar el componente
  useEffect(() => {
    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }, [pollingInterval]);

  // Función para convertir archivo a base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  // Validar y establecer imagen de modelo
  const handleModelImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = e.target.files?.[0];
      if (!file) return;

      setErrorMessage(null);
      setSuccessMessage(null);
      setModelValidation(null);
      
      const imageDataUrl = await fileToBase64(file);
      
      setLoading(true);
      setModelImage(imageDataUrl);
      setActiveTab('clothing');
      
      // Validar imagen con el backend
      const validation = await klingService.validateImage(imageDataUrl);
      setModelValidation(validation);
      
      if (!validation.isValid) {
        setErrorMessage(`Error en imagen de modelo: ${validation.errorMessage}`);
      } else {
        setSuccessMessage('Imagen de modelo procesada correctamente');
        // Si existe una versión procesada, actualizar la imagen de modelo
        if (validation.processedImage) {
          setModelImage(validation.processedImage);
        }
      }
    } catch (error: any) {
      setErrorMessage(`Error al procesar imagen: ${error.message}`);
      console.error('Error al procesar imagen de modelo:', error);
    } finally {
      setLoading(false);
    }
  };

  // Validar y establecer imagen de ropa
  const handleClothingImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = e.target.files?.[0];
      if (!file) return;

      setErrorMessage(null);
      setSuccessMessage(null);
      setClothingValidation(null);
      
      const imageDataUrl = await fileToBase64(file);
      
      setLoading(true);
      setClothingImage(imageDataUrl);
      
      // Validar imagen con el backend
      const validation = await klingService.validateImage(imageDataUrl);
      setClothingValidation(validation);
      
      if (!validation.isValid) {
        setErrorMessage(`Error en imagen de ropa: ${validation.errorMessage}`);
      } else {
        setSuccessMessage('Imagen de ropa procesada correctamente');
        // Si existe una versión procesada, actualizar la imagen de ropa
        if (validation.processedImage) {
          setClothingImage(validation.processedImage);
        }
      }
    } catch (error: any) {
      setErrorMessage(`Error al procesar imagen: ${error.message}`);
      console.error('Error al procesar imagen de ropa:', error);
    } finally {
      setLoading(false);
    }
  };

  // Inicia el proceso de Try-On
  const handleStartTryOn = async () => {
    try {
      if (!modelImage || !clothingImage) {
        setErrorMessage('Se requieren ambas imágenes: modelo y ropa');
        return;
      }

      setLoading(true);
      setErrorMessage(null);
      setSuccessMessage(null);
      setResult(null);

      // Usamos el servicio para iniciar el proceso
      const startResult = await klingService.startTryOn(modelImage, clothingImage);
      
      if (!startResult.success) {
        setErrorMessage(`Error al iniciar Try-On: ${startResult.errorMessage}`);
        return;
      }

      setResult(startResult);
      setSuccessMessage('Proceso de Try-On iniciado correctamente');

      // Configurar polling para verificar el estado
      if (startResult.taskId) {
        const intervalId = setInterval(async () => {
          const statusResult = await klingService.checkTryOnStatus(startResult.taskId!);
          setResult(statusResult);

          // Si el proceso ha terminado (completado o fallido), detener polling
          if (statusResult.status === 'completed' || statusResult.status === 'failed') {
            clearInterval(intervalId);
            setPollingInterval(null);

            if (statusResult.status === 'completed') {
              setSuccessMessage('¡Try-On completado con éxito!');
            } else {
              setErrorMessage(`Try-On fallido: ${statusResult.errorMessage}`);
            }
          }
        }, 3000); // Verificar cada 3 segundos

        setPollingInterval(intervalId);
      }
    } catch (error: any) {
      setErrorMessage(`Error: ${error.message}`);
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Reinicia el componente
  const handleReset = () => {
    // Limpiar imágenes
    setModelImage(null);
    setClothingImage(null);
    
    // Limpiar validaciones
    setModelValidation(null);
    setClothingValidation(null);
    
    // Limpiar resultado
    setResult(null);
    
    // Limpiar mensajes
    setErrorMessage(null);
    setSuccessMessage(null);
    
    // Detener polling si está activo
    if (pollingInterval) {
      clearInterval(pollingInterval);
      setPollingInterval(null);
    }
    
    // Reiniciar inputs
    if (modelInputRef.current) modelInputRef.current.value = '';
    if (clothingInputRef.current) clothingInputRef.current.value = '';
    
    // Volver a la primera pestaña
    setActiveTab('model');
  };

  return (
    <div className="container mx-auto">
      {/* Mensajes de error y éxito */}
      {errorMessage && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}
      
      {successMessage && (
        <Alert variant="default" className="mb-4 bg-green-50 border-green-200">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertTitle className="text-green-700">Éxito</AlertTitle>
          <AlertDescription className="text-green-600">{successMessage}</AlertDescription>
        </Alert>
      )}

      {/* Tabs para cargar modelos y ropa */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="model">Modelo</TabsTrigger>
          <TabsTrigger value="clothing">Prenda</TabsTrigger>
        </TabsList>
        
        <TabsContent value="model">
          <Card>
            <CardHeader>
              <CardTitle>Imagen de Modelo</CardTitle>
              <CardDescription>Sube una foto de una persona para probar ropa virtualmente</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col space-y-4">
                <Input
                  ref={modelInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleModelImageChange}
                  disabled={loading}
                  className="mb-4"
                />
                
                {modelImage && (
                  <div className="rounded-md overflow-hidden border">
                    <img src={modelImage} alt="Modelo" className="w-full max-h-80 object-contain" />
                  </div>
                )}
                
                {modelValidation && modelValidation.isValid ? (
                  <Alert className="bg-blue-50 border-blue-200">
                    <Info className="h-4 w-4 text-blue-600" />
                    <AlertTitle className="text-blue-700">Información de imagen</AlertTitle>
                    <AlertDescription className="text-blue-600">
                      <ul className="list-disc list-inside">
                        <li>Formato: {modelValidation.originalFormat?.toUpperCase()}</li>
                        <li>Dimensiones: {modelValidation.width} x {modelValidation.height} px</li>
                        <li>Tamaño: {modelValidation.sizeInMB?.toFixed(2)} MB</li>
                      </ul>
                    </AlertDescription>
                  </Alert>
                ) : (
                  modelValidation && !modelValidation.isValid && (
                    <Alert variant="destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertTitle>Error de validación</AlertTitle>
                      <AlertDescription>{modelValidation.errorMessage}</AlertDescription>
                    </Alert>
                  )
                )}
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={handleReset}>Reiniciar</Button>
              <Button 
                onClick={() => setActiveTab('clothing')} 
                disabled={!modelImage || loading || (modelValidation && !modelValidation.isValid)}
              >
                Siguiente
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="clothing">
          <Card>
            <CardHeader>
              <CardTitle>Imagen de Prenda</CardTitle>
              <CardDescription>Sube una foto de la prenda que quieres probar virtualmente</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col space-y-4">
                <Input
                  ref={clothingInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleClothingImageChange}
                  disabled={loading}
                  className="mb-4"
                />
                
                {clothingImage && (
                  <div className="rounded-md overflow-hidden border">
                    <img src={clothingImage} alt="Prenda" className="w-full max-h-80 object-contain" />
                  </div>
                )}
                
                {clothingValidation && clothingValidation.isValid ? (
                  <Alert className="bg-blue-50 border-blue-200">
                    <Info className="h-4 w-4 text-blue-600" />
                    <AlertTitle className="text-blue-700">Información de imagen</AlertTitle>
                    <AlertDescription className="text-blue-600">
                      <ul className="list-disc list-inside">
                        <li>Formato: {clothingValidation.originalFormat?.toUpperCase()}</li>
                        <li>Dimensiones: {clothingValidation.width} x {clothingValidation.height} px</li>
                        <li>Tamaño: {clothingValidation.sizeInMB?.toFixed(2)} MB</li>
                      </ul>
                    </AlertDescription>
                  </Alert>
                ) : (
                  clothingValidation && !clothingValidation.isValid && (
                    <Alert variant="destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertTitle>Error de validación</AlertTitle>
                      <AlertDescription>{clothingValidation.errorMessage}</AlertDescription>
                    </Alert>
                  )
                )}
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={() => setActiveTab('model')}>Atrás</Button>
              <Button 
                onClick={handleStartTryOn} 
                disabled={!modelImage || !clothingImage || loading || 
                  (modelValidation && !modelValidation.isValid) || 
                  (clothingValidation && !clothingValidation.isValid)}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Procesando...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Iniciar Try-On
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Resultados del proceso */}
      {result && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Resultados</CardTitle>
            <CardDescription>
              Estado: {result.status === 'pending' ? 'Pendiente' : 
                      result.status === 'processing' ? 'Procesando' : 
                      result.status === 'completed' ? 'Completado' : 
                      result.status === 'failed' ? 'Fallido' : 'Desconocido'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {result.status === 'processing' && (
              <div className="mb-4">
                <Progress value={result.progress || 0} className="mb-2" />
                <p className="text-sm text-gray-500 text-center">{result.progress || 0}% completado</p>
              </div>
            )}
            
            {result.status === 'completed' && result.url && (
              <div className="rounded-md overflow-hidden border">
                <img src={result.url} alt="Resultado Try-On" className="w-full object-contain" />
              </div>
            )}
            
            {result.status === 'failed' && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Error en procesamiento</AlertTitle>
                <AlertDescription>{result.errorMessage || 'Ha ocurrido un error desconocido'}</AlertDescription>
              </Alert>
            )}
            
            <div className="mt-4">
              <h4 className="text-sm font-medium mb-2">Detalles del proceso:</h4>
              <ul className="list-disc list-inside text-sm">
                <li>ID de tarea: {result.taskId || 'No disponible'}</li>
                <li>Estado: {result.status || 'No disponible'}</li>
                {result.progress !== undefined && <li>Progreso: {result.progress}%</li>}
              </ul>
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="outline" onClick={handleReset} className="w-full">
              Comenzar de nuevo
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* Guía de uso para los usuarios */}
      <Card>
        <CardHeader>
          <CardTitle>Guía de Uso</CardTitle>
          <CardDescription>Consejos para obtener mejores resultados</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-medium mb-2">Imagen de Modelo</h3>
              <ul className="list-disc list-inside text-sm">
                <li>Pose frontal, mirando directamente a la cámara</li>
                <li>Fondo neutro y bien iluminado</li>
                <li>Ropa sencilla (preferiblemente camiseta/top básico)</li>
                <li>Formato JPEG recomendado</li>
                <li>Resolución mínima: 512px en el lado corto</li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium mb-2">Imagen de Prenda</h3>
              <ul className="list-disc list-inside text-sm">
                <li>Prenda sobre fondo blanco o neutro</li>
                <li>Sin maniquí o persona</li>
                <li>Buena iluminación y centrada</li>
                <li>Formato JPEG recomendado</li>
                <li>Resolución mínima: 512px en el lado corto</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}