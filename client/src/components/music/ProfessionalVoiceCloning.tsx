/**
 * Componente de Clonación Profesional de Voz
 * 
 * Este componente proporciona una interfaz de usuario avanzada para:
 * 1. Crear modelos de voz personalizados usando Revocalize
 * 2. Convertir audio entre diferentes voces
 * 3. Aplicar efectos profesionales usando KITS AI
 * 4. Visualizar y compartir el historial de conversiones
 */

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle 
} from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Mic, Upload, Wand2, Music2, BarChart3, History, 
  Settings, Plus, Server, Info, HelpCircle 
} from 'lucide-react';
import { VoiceConversionStudio } from './VoiceConversionStudio';
import { VoiceModelCreator } from './voice-model-creator';
import { voiceModelService } from '../../lib/services/voice-model-service';
import { toast } from '@/hooks/use-toast';

interface ProfessionalVoiceModelingProps {
  className?: string;
}

export function ProfessionalVoiceCloning({ className }: ProfessionalVoiceModelingProps) {
  const [activeTab, setActiveTab] = useState<string>('studio');
  
  // Verificar el estado de las APIs
  const { data: apiStatus, isLoading: isLoadingApiStatus } = useQuery({
    queryKey: ['api-status'],
    queryFn: async () => {
      // Verificar si las claves API están configuradas
      const isConfigured = voiceModelService.isApiKeyConfigured();
      
      // Obtener los modelos disponibles para comprobar la conexión
      try {
        const models = await voiceModelService.getAvailableModels();
        return { 
          isConfigured, 
          isConnected: true, 
          modelsCount: models.length 
        };
      } catch (error) {
        console.error('Error verificando estado de API:', error);
        return { 
          isConfigured, 
          isConnected: false, 
          error: error instanceof Error ? error.message : 'Error desconocido'
        };
      }
    },
    refetchOnWindowFocus: false
  });
  
  return (
    <div className={className}>
      <Card className="w-full">
        <CardHeader className="bg-muted/40">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-2xl">
                <Mic className="h-6 w-6 text-primary" />
                Voice AI Studio
              </CardTitle>
              <CardDescription>
                Plataforma profesional de clonación y procesamiento de voz con IA
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {apiStatus ? (
                apiStatus.isConfigured ? (
                  <div className="text-xs bg-green-500/10 text-green-600 py-1 px-2 rounded-md flex items-center gap-1">
                    <div className="h-2 w-2 rounded-full bg-green-500"></div>
                    APIs conectadas ({apiStatus.modelsCount || 0} modelos)
                  </div>
                ) : (
                  <div className="text-xs bg-amber-500/10 text-amber-600 py-1 px-2 rounded-md flex items-center gap-1">
                    <div className="h-2 w-2 rounded-full bg-amber-500"></div>
                    API keys no configuradas
                  </div>
                )
              ) : isLoadingApiStatus ? (
                <div className="text-xs bg-blue-500/10 text-blue-600 py-1 px-2 rounded-md flex items-center gap-1">
                  <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse"></div>
                  Verificando APIs...
                </div>
              ) : (
                <div className="text-xs bg-red-500/10 text-red-600 py-1 px-2 rounded-md flex items-center gap-1">
                  <div className="h-2 w-2 rounded-full bg-red-500"></div>
                  Error de conexión
                </div>
              )}
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  toast({
                    title: 'Sobre las APIs de voz',
                    description: 'Este componente integra Revocalize para clonación de voz y KITS AI para efectos profesionales de audio.',
                  });
                }}
              >
                <Info className="h-4 w-4 mr-1" />
                Acerca de
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <Tabs defaultValue="studio" onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-3 mb-8">
              <TabsTrigger value="studio" className="flex items-center gap-2">
                <Music2 className="h-4 w-4" />
                <span>Estudio de Voz</span>
              </TabsTrigger>
              <TabsTrigger value="models" className="flex items-center gap-2">
                <Wand2 className="h-4 w-4" />
                <span>Creación de Modelos</span>
              </TabsTrigger>
              <TabsTrigger value="config" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                <span>Configuración</span>
              </TabsTrigger>
            </TabsList>
            
            {/* Estudio de conversión de voz */}
            <TabsContent value="studio" className="space-y-4">
              <VoiceConversionStudio />
            </TabsContent>
            
            {/* Creación de modelos de voz */}
            <TabsContent value="models" className="space-y-4">
              <VoiceModelCreator />
            </TabsContent>
            
            {/* Configuración y ajustes */}
            <TabsContent value="config" className="space-y-4">
              <div className="bg-muted/30 rounded-xl p-6">
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <Server className="h-5 w-5 text-primary" />
                  Configuración de APIs
                </h2>
                
                <div className="space-y-6">
                  {/* Configuración de Revocalize */}
                  <div>
                    <h3 className="text-md font-medium mb-2">Revocalize API</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Esta API se utiliza para crear modelos personalizados de voz y realizar conversiones de voz.
                    </p>
                    <div className="flex items-center gap-3">
                      <Input
                        type="password"
                        placeholder="Ingresa tu API key de Revocalize"
                        className="max-w-md"
                      />
                      <Button variant="secondary" size="sm">
                        Guardar
                      </Button>
                    </div>
                  </div>
                  
                  {/* Configuración de KITS */}
                  <div>
                    <h3 className="text-md font-medium mb-2">KITS Audio API</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Esta API proporciona efectos avanzados de audio y post-procesamiento.
                    </p>
                    <div className="flex items-center gap-3">
                      <Input
                        type="password"
                        placeholder="Ingresa tu API key de KITS Audio"
                        className="max-w-md"
                      />
                      <Button variant="secondary" size="sm">
                        Guardar
                      </Button>
                    </div>
                  </div>
                  
                  {/* Opciones avanzadas */}
                  <div className="pt-4 border-t">
                    <h3 className="text-md font-medium mb-2">Opciones Avanzadas</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Configura opciones avanzadas para el procesamiento de voz y modelos.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Button variant="outline" className="justify-start">
                        <HelpCircle className="h-4 w-4 mr-2" />
                        Documentación de APIs
                      </Button>
                      <Button variant="outline" className="justify-start">
                        <BarChart3 className="h-4 w-4 mr-2" />
                        Ver uso de la API
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter className="bg-muted/30 flex justify-between">
          <div className="text-sm text-muted-foreground">
            Integración con Revocalize y KITS AI
          </div>
          <div>
            <Button variant="link" size="sm" className="text-xs text-muted-foreground">
              Términos de uso
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}