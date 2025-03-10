import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { PremiumButton } from '@/components/ui/premium-button';
import { AnimatedCard } from '@/components/ui/animated-card';
import { 
  SlidersHorizontal, 
  VideoIcon,
  FastForward,
  AlignLeft,
  CheckCheck,
  Image,
  Film,
  Clock,
  Zap,
  RefreshCw,
  MoveHorizontal,
  Video,
  Sparkles
} from 'lucide-react';

// Definición de tipos para escenas
interface Scene {
  id: number;
  title: string;
  description: string;
  duration: number;
  shotType: string;
  imagePrompt?: string;
  status: 'pending' | 'generating' | 'completed' | 'failed';
  thumbnail?: string;
}

// Definición de tipo para estilos visuales
interface VisualStyle {
  id: string;
  name: string;
  description: string;
  isSelected: boolean;
}

// Datos de ejemplo para escenas
const initialScenes: Scene[] = [
  {
    id: 1,
    title: 'Introducción',
    description: 'Artista caminando por la ciudad de noche con luces de neón',
    duration: 5,
    shotType: 'Wide Shot',
    status: 'completed',
    thumbnail: 'https://images.unsplash.com/photo-1556139902-7367723b433e?auto=format&fit=crop&q=80&w=200&h=120',
    imagePrompt: 'Artista urbano caminando por ciudad futurista con luces de neón, estilo cinematográfico'
  },
  {
    id: 2,
    title: 'Verso 1',
    description: 'Primer plano del artista cantando con iluminación contrastada',
    duration: 12,
    shotType: 'Close Up',
    status: 'completed',
    thumbnail: 'https://images.unsplash.com/photo-1521337581100-8ca9a73a5f79?auto=format&fit=crop&q=80&w=200&h=120',
    imagePrompt: 'Close up de cantante con iluminación dramática de un solo lado, estilo profesional'
  },
  {
    id: 3,
    title: 'Pre-coro',
    description: 'Escena abstracta con formas líquidas que fluyen al ritmo',
    duration: 8,
    shotType: 'Abstract',
    status: 'generating',
    imagePrompt: 'Formas líquidas abstractas que fluyen en sincronía, colores vibrantes azul y púrpura'
  },
  {
    id: 4,
    title: 'Coro',
    description: 'Artista en escenario con efectos visuales y multitud',
    duration: 15,
    shotType: 'Medium Shot',
    status: 'pending',
    imagePrompt: 'Artista en escenario con efectos de luces, multitud borrosa en primer plano'
  },
  {
    id: 5,
    title: 'Verso 2',
    description: 'Secuencia de viaje a través de un túnel espacial',
    duration: 12,
    shotType: 'POV',
    status: 'pending',
    imagePrompt: 'Vista POV viajando a través de un túnel espacial con estrellas y nebulosas coloridas'
  }
];

// Estilos visuales predefinidos
const visualStyles: VisualStyle[] = [
  { id: 'cinematic', name: 'Cinematográfico', description: 'Estilo de película profesional con ratio de aspecto cinemático', isSelected: true },
  { id: 'retro', name: 'Retro', description: 'Estética ochentera con colores neón y efectos VHS', isSelected: false },
  { id: 'futuristic', name: 'Futurista', description: 'Ambiente cyberpunk con toques de neón y tecnología avanzada', isSelected: false },
  { id: 'minimal', name: 'Minimalista', description: 'Estética limpia con fondos sólidos y formas simples', isSelected: false },
  { id: 'surreal', name: 'Surrealista', description: 'Elementos oníricos y composiciones imposibles', isSelected: false }
];

export default function FuturisticVideoSettings() {
  const [scenes, setScenes] = useState<Scene[]>(initialScenes);
  const [styles, setStyles] = useState<VisualStyle[]>(visualStyles);
  const [selectedTab, setSelectedTab] = useState<'scenes' | 'style' | 'advanced'>('scenes');
  
  // Manejador para seleccionar un estilo visual
  const handleStyleSelect = (styleId: string) => {
    setStyles(styles.map(style => ({
      ...style,
      isSelected: style.id === styleId
    })));
  };
  
  // Manejador para actualizar el estado de una escena
  const handleSceneStatusUpdate = (sceneId: number, status: Scene['status']) => {
    setScenes(scenes.map(scene => 
      scene.id === sceneId ? { ...scene, status } : scene
    ));
  };
  
  // Manejador para regenerar una escena
  const handleRegenerateScene = (sceneId: number) => {
    setScenes(scenes.map(scene => 
      scene.id === sceneId ? { ...scene, status: 'generating' } : scene
    ));
    
    // Simulación de generación completada después de 2 segundos
    setTimeout(() => {
      handleSceneStatusUpdate(sceneId, 'completed');
    }, 2000);
  };
  
  // Contenedor de animación para las pestañas
  const tabVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { 
        type: "spring", 
        stiffness: 300, 
        damping: 30,
        duration: 0.4
      } 
    },
    exit: { 
      opacity: 0,
      y: -20,
      transition: { duration: 0.2 } 
    }
  };
  
  // Renderizar un indicador de estado para cada escena
  const renderStatusIndicator = (status: Scene['status']) => {
    switch (status) {
      case 'completed':
        return (
          <div className="flex items-center text-green-500">
            <CheckCheck className="w-4 h-4 mr-1" />
            <span className="text-xs">Completado</span>
          </div>
        );
      case 'generating':
        return (
          <div className="flex items-center text-orange-500">
            <RefreshCw className="w-4 h-4 mr-1 animate-spin" />
            <span className="text-xs">Generando</span>
          </div>
        );
      case 'failed':
        return (
          <div className="flex items-center text-red-500">
            <span className="text-xs">Error</span>
          </div>
        );
      default:
        return (
          <div className="flex items-center text-zinc-500">
            <Clock className="w-4 h-4 mr-1" />
            <span className="text-xs">Pendiente</span>
          </div>
        );
    }
  };
  
  return (
    <div className="bg-black text-white min-h-[80vh] rounded-xl overflow-hidden">
      {/* Tabs de navegación con efecto de luz de fondo */}
      <div className="relative border-b border-zinc-800">
        <div className="absolute inset-0 bg-gradient-to-r from-orange-600/10 to-transparent z-0"></div>
        <div className="container relative z-10 flex space-x-1 p-1">
          <button
            onClick={() => setSelectedTab('scenes')}
            className={`px-4 py-2 rounded-lg transition-all duration-200 ${
              selectedTab === 'scenes' 
                ? 'bg-gradient-to-r from-orange-600 to-amber-500 text-white' 
                : 'bg-zinc-900/50 text-zinc-400 hover:bg-zinc-800/70'
            }`}
          >
            <div className="flex items-center">
              <Film className="w-4 h-4 mr-2" />
              Escenas
            </div>
          </button>
          
          <button
            onClick={() => setSelectedTab('style')}
            className={`px-4 py-2 rounded-lg transition-all duration-200 ${
              selectedTab === 'style' 
                ? 'bg-gradient-to-r from-orange-600 to-amber-500 text-white' 
                : 'bg-zinc-900/50 text-zinc-400 hover:bg-zinc-800/70'
            }`}
          >
            <div className="flex items-center">
              <Image className="w-4 h-4 mr-2" />
              Estilo visual
            </div>
          </button>
          
          <button
            onClick={() => setSelectedTab('advanced')}
            className={`px-4 py-2 rounded-lg transition-all duration-200 ${
              selectedTab === 'advanced' 
                ? 'bg-gradient-to-r from-orange-600 to-amber-500 text-white' 
                : 'bg-zinc-900/50 text-zinc-400 hover:bg-zinc-800/70'
            }`}
          >
            <div className="flex items-center">
              <SlidersHorizontal className="w-4 h-4 mr-2" />
              Avanzado
            </div>
          </button>
        </div>
      </div>
      
      {/* Contenido principal */}
      <div className="container mx-auto py-6">
        {/* Tab de escenas */}
        {selectedTab === 'scenes' && (
          <motion.div
            variants={tabVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="space-y-6"
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">Secuencia de escenas</h3>
              <PremiumButton variant="action" size="sm">
                <Zap className="mr-2 h-4 w-4" />
                Generar todas
              </PremiumButton>
            </div>
            
            <div className="space-y-4">
              {scenes.map((scene) => (
                <AnimatedCard
                  key={scene.id}
                  variant={scene.status === 'completed' ? 'premium' : 'default'}
                  className={`border ${scene.status === 'completed' ? 'border-orange-800/20' : 'border-zinc-800'} p-4`}
                  hover="none"
                >
                  <div className="flex flex-col md:flex-row">
                    {/* Miniatura */}
                    <div className="w-full md:w-1/4 mb-4 md:mb-0 md:mr-4">
                      {scene.thumbnail ? (
                        <div className="relative rounded-lg overflow-hidden aspect-video bg-zinc-800 border border-zinc-700/50">
                          <img 
                            src={scene.thumbnail} 
                            alt={scene.title} 
                            className="w-full h-full object-cover"
                          />
                          {scene.status === 'generating' && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                              <RefreshCw className="w-8 h-8 text-orange-500 animate-spin" />
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="flex items-center justify-center aspect-video rounded-lg bg-zinc-900 border border-zinc-800">
                          <VideoIcon className="w-8 h-8 text-zinc-700" />
                        </div>
                      )}
                    </div>
                    
                    {/* Información de la escena */}
                    <div className="flex-1">
                      <div className="flex justify-between">
                        <div>
                          <h4 className="text-lg font-semibold mb-1">{scene.title}</h4>
                          <p className="text-sm text-zinc-400 mb-2">{scene.description}</p>
                        </div>
                        <div>
                          {renderStatusIndicator(scene.status)}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-3">
                        <div className="flex items-center text-xs text-zinc-500">
                          <Clock className="w-3 h-3 mr-1" />
                          <span>{scene.duration}s</span>
                        </div>
                        <div className="flex items-center text-xs text-zinc-500">
                          <Film className="w-3 h-3 mr-1" />
                          <span>{scene.shotType}</span>
                        </div>
                        <div className="flex items-center text-xs text-zinc-500">
                          <AlignLeft className="w-3 h-3 mr-1" />
                          <span>Prompt: {scene.imagePrompt ? 'Personalizado' : 'Auto'}</span>
                        </div>
                      </div>
                      
                      <div className="flex space-x-2 mt-2">
                        {scene.status === 'completed' && (
                          <PremiumButton variant="outline" size="sm" onClick={() => handleRegenerateScene(scene.id)}>
                            <RefreshCw className="w-3 h-3 mr-1" />
                            Regenerar
                          </PremiumButton>
                        )}
                        {scene.status === 'pending' && (
                          <PremiumButton size="sm" onClick={() => handleRegenerateScene(scene.id)}>
                            <Zap className="w-3 h-3 mr-1" />
                            Generar
                          </PremiumButton>
                        )}
                        <PremiumButton variant="subtle" size="sm">
                          <MoveHorizontal className="w-3 h-3 mr-1" />
                          Ajustar
                        </PremiumButton>
                      </div>
                    </div>
                  </div>
                </AnimatedCard>
              ))}
            </div>
            
            <div className="flex justify-center mt-8">
              <PremiumButton variant="outline">
                <FastForward className="mr-2 h-4 w-4" />
                Previsualizar
              </PremiumButton>
            </div>
          </motion.div>
        )}
        
        {/* Tab de estilo visual */}
        {selectedTab === 'style' && (
          <motion.div
            variants={tabVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="space-y-6"
          >
            <div className="mb-6">
              <h3 className="text-xl font-bold mb-2">Estilo visual</h3>
              <p className="text-zinc-400">
                Selecciona un estilo visual para todo el video. Esto afectará la paleta de colores, 
                composición y efectos visuales.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {styles.map((style) => (
                <div 
                  key={style.id}
                  onClick={() => handleStyleSelect(style.id)}
                  className={`p-4 rounded-lg cursor-pointer border transition-all duration-300 ${
                    style.isSelected 
                      ? 'bg-gradient-to-br from-zinc-900 to-black border-orange-600/30 shadow-lg shadow-orange-900/10' 
                      : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700'
                  }`}
                >
                  <div className="flex justify-between items-start mb-3">
                    <h4 className="text-lg font-semibold">{style.name}</h4>
                    <div className={`w-4 h-4 rounded-full ${
                      style.isSelected 
                        ? 'bg-orange-500' 
                        : 'bg-zinc-700'
                    }`}></div>
                  </div>
                  <p className="text-sm text-zinc-400 mb-4">
                    {style.description}
                  </p>
                  
                  <div className="h-20 bg-zinc-800 rounded overflow-hidden">
                    {/* Aquí iría una imagen de ejemplo del estilo visual */}
                  </div>
                </div>
              ))}
            </div>
            
            <div className="flex justify-center mt-8">
              <PremiumButton glow>
                <Sparkles className="mr-2 h-4 w-4" />
                Aplicar estilo
              </PremiumButton>
            </div>
          </motion.div>
        )}
        
        {/* Tab de configuración avanzada */}
        {selectedTab === 'advanced' && (
          <motion.div
            variants={tabVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="space-y-6"
          >
            <div className="mb-6">
              <h3 className="text-xl font-bold mb-2">Configuración avanzada</h3>
              <p className="text-zinc-400">
                Ajusta parámetros avanzados del video como resolución, framerate, 
                efectos visuales y transiciones.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <AnimatedCard variant="glass" padding="lg">
                <h4 className="text-lg font-semibold mb-4">Parámetros de renderizado</h4>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-zinc-400 mb-1">Resolución</label>
                    <select className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-white">
                      <option value="1080p">1080p (1920x1080) - Full HD</option>
                      <option value="720p">720p (1280x720) - HD</option>
                      <option value="4k">4K (3840x2160) - Ultra HD</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm text-zinc-400 mb-1">Framerate</label>
                    <select className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-white">
                      <option value="30">30 fps - Estándar</option>
                      <option value="24">24 fps - Cinematográfico</option>
                      <option value="60">60 fps - Alta fluidez</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm text-zinc-400 mb-1">Calidad de renderizado</label>
                    <div className="w-full bg-zinc-900 rounded-lg h-2 mb-1">
                      <div className="h-full bg-gradient-to-r from-orange-600 to-amber-500 rounded-lg w-3/4"></div>
                    </div>
                    <div className="flex justify-between text-xs text-zinc-500">
                      <span>Rápido</span>
                      <span>Alta calidad</span>
                    </div>
                  </div>
                </div>
              </AnimatedCard>
              
              <AnimatedCard variant="glass" padding="lg">
                <h4 className="text-lg font-semibold mb-4">Efectos y transiciones</h4>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-zinc-400 mb-1">Tipo de transición</label>
                    <select className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-white">
                      <option value="crossfade">Crossfade</option>
                      <option value="fade">Fade to black</option>
                      <option value="wipe">Wipe</option>
                      <option value="zoom">Zoom</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm text-zinc-400 mb-1">Duración de transición</label>
                    <div className="w-full bg-zinc-900 rounded-lg h-2 mb-1">
                      <div className="h-full bg-gradient-to-r from-orange-600 to-amber-500 rounded-lg w-1/2"></div>
                    </div>
                    <div className="flex justify-between text-xs text-zinc-500">
                      <span>0.5s</span>
                      <span>1.5s</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <label className="text-sm text-zinc-400">Sincronización con ritmo</label>
                    <div className="w-12 h-6 bg-zinc-800 rounded-full p-1 cursor-pointer flex items-center">
                      <div className="w-4 h-4 bg-orange-500 rounded-full transform translate-x-6"></div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <label className="text-sm text-zinc-400">Efectos de color avanzados</label>
                    <div className="w-12 h-6 bg-zinc-800 rounded-full p-1 cursor-pointer flex items-center">
                      <div className="w-4 h-4 bg-orange-500 rounded-full transform translate-x-6"></div>
                    </div>
                  </div>
                </div>
              </AnimatedCard>
            </div>
            
            <div className="flex justify-center mt-8">
              <PremiumButton glow>
                <Video className="mr-2 h-4 w-4" />
                Guardar configuración
              </PremiumButton>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}