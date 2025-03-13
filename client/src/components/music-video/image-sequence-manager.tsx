import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  ChevronLeft, 
  ChevronRight, 
  ImageIcon, 
  Trash2, 
  PlusCircle, 
  MoveHorizontal,
  ZoomIn,
  Layers,
  Music,
  AlertCircle
} from "lucide-react";
import { ShotType, CameraMovementPattern } from "@/lib/professional-editor-types";

// Tipo para cada elemento de imagen en la secuencia
interface ImageSequenceItem {
  id: string;
  url: string;
  shotType: ShotType;
  duration: number; // duración en segundos
  transitionType?: string;
  transitionDuration?: number;
  metadata?: {
    movementApplied?: boolean;
    movementPattern?: CameraMovementPattern;
    movementIntensity?: number;
    shotType?: ShotType;
  };
}

// Props del componente
interface ImageSequenceManagerProps {
  images: ImageSequenceItem[];
  onUpdate: (images: ImageSequenceItem[]) => void;
  onGenerateSequence?: () => void;
  onSyncToBeats?: () => void;
  onAddToTimeline?: (images: ImageSequenceItem[]) => void;
  className?: string;
  showControls?: boolean;
}

/**
 * Componente para gestionar secuencias de imágenes en el editor de video musical
 * 
 * Este componente proporciona una interfaz profesional para organizar
 * y gestionar secuencias de imágenes que serán usadas en un video musical,
 * con sincronización de beats y movimientos de cámara.
 */
export function ImageSequenceManager({
  images,
  onUpdate,
  onGenerateSequence,
  onSyncToBeats,
  onAddToTimeline,
  className = "",
  showControls = true
}: ImageSequenceManagerProps) {
  const [selectedImageIndex, setSelectedImageIndex] = useState<number>(-1);
  const [reordering, setReordering] = useState(false);
  
  // Función para cambiar el tipo de plano de una imagen
  const changeShotType = (index: number, shotType: ShotType) => {
    const updatedImages = [...images];
    updatedImages[index] = {
      ...updatedImages[index],
      shotType,
      metadata: {
        ...updatedImages[index].metadata,
        shotType
      }
    };
    onUpdate(updatedImages);
  };
  
  // Función para cambiar el tipo de transición
  const changeTransitionType = (index: number, transitionType: string) => {
    const updatedImages = [...images];
    updatedImages[index] = {
      ...updatedImages[index],
      transitionType
    };
    onUpdate(updatedImages);
  };
  
  // Función para aplicar movimiento a una imagen
  const applyMovement = (index: number, movementPattern: CameraMovementPattern) => {
    const updatedImages = [...images];
    updatedImages[index] = {
      ...updatedImages[index],
      metadata: {
        ...updatedImages[index].metadata,
        movementApplied: true,
        movementPattern,
        movementIntensity: 0.5
      }
    };
    onUpdate(updatedImages);
  };
  
  // Función para remover una imagen de la secuencia
  const removeImage = (index: number) => {
    const updatedImages = images.filter((_, i) => i !== index);
    onUpdate(updatedImages);
    if (selectedImageIndex === index) {
      setSelectedImageIndex(-1);
    } else if (selectedImageIndex > index) {
      setSelectedImageIndex(selectedImageIndex - 1);
    }
  };
  
  // Función para mover una imagen en la secuencia
  const moveImage = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= images.length) return;
    
    const updatedImages = [...images];
    const [movedImage] = updatedImages.splice(fromIndex, 1);
    updatedImages.splice(toIndex, 0, movedImage);
    
    onUpdate(updatedImages);
    setSelectedImageIndex(toIndex);
  };
  
  // Obtener el color de borde según el tipo de plano
  const getShotTypeColor = (shotType: ShotType): string => {
    switch (shotType) {
      case "close-up": return "border-indigo-500";
      case "medium": return "border-green-500";
      case "wide": return "border-amber-500";
      case "transition": return "border-pink-500";
      default: return "border-blue-500";
    }
  };
  
  // Obtener el ícono para el tipo de transición
  const getTransitionIcon = (transitionType: string) => {
    switch (transitionType) {
      case "crossfade": return <Layers className="w-4 h-4" />;
      case "slide": return <MoveHorizontal className="w-4 h-4" />;
      case "zoom": return <ZoomIn className="w-4 h-4" />;
      default: return null;
    }
  };
  
  // Renderizar la miniatura de una imagen con sus controles
  const renderThumbnail = (image: ImageSequenceItem, index: number) => {
    const isSelected = selectedImageIndex === index;
    
    return (
      <div 
        key={image.id}
        className={`
          relative group border-2 rounded-md overflow-hidden cursor-pointer transition-all
          ${isSelected ? 'ring-2 ring-primary scale-105 z-10' : 'hover:scale-105'}
          ${getShotTypeColor(image.shotType)}
        `}
        onClick={() => setSelectedImageIndex(isSelected ? -1 : index)}
      >
        <div className="relative aspect-video w-32 sm:w-40 bg-muted">
          {/* Imagen principal */}
          <img
            src={image.url}
            alt={`Secuencia ${index + 1}`}
            className="w-full h-full object-cover"
          />
          
          {/* Overlay con información */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="absolute bottom-1 left-1 right-1 text-white text-xs flex justify-between items-center">
              <span>{image.shotType}</span>
              <span>{image.duration}s</span>
            </div>
          </div>
          
          {/* Índice de la imagen */}
          <div className="absolute top-1 left-1 bg-black/70 text-white text-xs px-1.5 py-0.5 rounded-sm">
            {index + 1}
          </div>
          
          {/* Indicadores de propiedades */}
          <div className="absolute top-1 right-1 flex gap-1">
            {image.metadata?.movementApplied && (
              <div className="bg-orange-500 rounded-full p-0.5" title={`Movimiento: ${image.metadata.movementPattern}`}>
                <MoveHorizontal className="w-3 h-3 text-white" />
              </div>
            )}
            {image.transitionType && (
              <div className="bg-pink-500 rounded-full p-0.5" title={`Transición: ${image.transitionType}`}>
                {getTransitionIcon(image.transitionType)}
              </div>
            )}
          </div>
          
          {/* Controles solo visibles cuando está seleccionada o hover */}
          {(isSelected || true) && (
            <div className="absolute -bottom-10 group-hover:bottom-0 left-0 right-0 bg-black/80 p-1 flex justify-center gap-1 transition-all">
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-6 w-6 text-white hover:text-red-500"
                onClick={(e) => {
                  e.stopPropagation();
                  removeImage(index);
                }}
              >
                <Trash2 className="w-3 h-3" />
              </Button>
              
              <Button 
                variant="ghost" 
                size="icon"
                className="h-6 w-6 text-white hover:text-blue-500"
                onClick={(e) => {
                  e.stopPropagation();
                  moveImage(index, index - 1);
                }}
                disabled={index === 0}
              >
                <ChevronLeft className="w-3 h-3" />
              </Button>
              
              <Button 
                variant="ghost" 
                size="icon"
                className="h-6 w-6 text-white hover:text-blue-500"
                onClick={(e) => {
                  e.stopPropagation();
                  moveImage(index, index + 1);
                }}
                disabled={index === images.length - 1}
              >
                <ChevronRight className="w-3 h-3" />
              </Button>
            </div>
          )}
        </div>
        
        {/* Panel de edición extendido cuando está seleccionada */}
        {isSelected && (
          <div className="absolute left-full top-0 ml-2 w-48 bg-card border rounded-md shadow-lg z-20">
            <div className="p-2 space-y-2">
              <h3 className="font-medium text-sm">Ajustes de imagen</h3>
              
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Tipo de plano</label>
                <div className="flex flex-wrap gap-1">
                  <Button 
                    variant={image.shotType === "close-up" ? "default" : "outline"} 
                    size="sm" 
                    className="text-xs py-0 h-6"
                    onClick={() => changeShotType(index, "close-up")}
                  >
                    Primer plano
                  </Button>
                  <Button 
                    variant={image.shotType === "medium" ? "default" : "outline"} 
                    size="sm" 
                    className="text-xs py-0 h-6"
                    onClick={() => changeShotType(index, "medium")}
                  >
                    Medio
                  </Button>
                  <Button 
                    variant={image.shotType === "wide" ? "default" : "outline"} 
                    size="sm" 
                    className="text-xs py-0 h-6"
                    onClick={() => changeShotType(index, "wide")}
                  >
                    General
                  </Button>
                </div>
              </div>
              
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Transición</label>
                <div className="flex flex-wrap gap-1">
                  <Button 
                    variant={image.transitionType === "crossfade" ? "default" : "outline"} 
                    size="sm" 
                    className="text-xs py-0 h-6"
                    onClick={() => changeTransitionType(index, "crossfade")}
                  >
                    <Layers className="w-3 h-3 mr-1" />
                    Fundido
                  </Button>
                  <Button 
                    variant={image.transitionType === "slide" ? "default" : "outline"} 
                    size="sm" 
                    className="text-xs py-0 h-6"
                    onClick={() => changeTransitionType(index, "slide")}
                  >
                    <MoveHorizontal className="w-3 h-3 mr-1" />
                    Deslizar
                  </Button>
                  <Button 
                    variant={image.transitionType === "zoom" ? "default" : "outline"} 
                    size="sm" 
                    className="text-xs py-0 h-6"
                    onClick={() => changeTransitionType(index, "zoom")}
                  >
                    <ZoomIn className="w-3 h-3 mr-1" />
                    Zoom
                  </Button>
                </div>
              </div>
              
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Movimiento</label>
                <div className="flex flex-wrap gap-1">
                  <Button 
                    variant={image.metadata?.movementPattern === "pan-left" ? "default" : "outline"} 
                    size="sm" 
                    className="text-xs py-0 h-6"
                    onClick={() => applyMovement(index, "pan-left")}
                  >
                    Pan Izq
                  </Button>
                  <Button 
                    variant={image.metadata?.movementPattern === "pan-right" ? "default" : "outline"} 
                    size="sm" 
                    className="text-xs py-0 h-6"
                    onClick={() => applyMovement(index, "pan-right")}
                  >
                    Pan Der
                  </Button>
                  <Button 
                    variant={image.metadata?.movementPattern === "zoom-in" ? "default" : "outline"} 
                    size="sm" 
                    className="text-xs py-0 h-6"
                    onClick={() => applyMovement(index, "zoom-in")}
                  >
                    Zoom In
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <Card className={`border shadow-sm ${className}`}>
      <CardHeader className="py-3">
        <CardTitle className="text-lg flex items-center justify-between">
          <div className="flex items-center">
            <ImageIcon className="w-5 h-5 mr-2 text-blue-500" />
            Secuencia de Imágenes
            <Badge variant="outline" className="ml-2">
              {images.length} imágenes
            </Badge>
          </div>
          
          {showControls && (
            <div className="flex gap-1">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={onGenerateSequence}
                className="h-7 text-xs"
              >
                <PlusCircle className="w-3.5 h-3.5 mr-1" />
                Generar
              </Button>
              
              <Button 
                variant="outline" 
                size="sm" 
                onClick={onSyncToBeats}
                className="h-7 text-xs"
                disabled={images.length === 0}
              >
                <Music className="w-3.5 h-3.5 mr-1" />
                Sincronizar con Beats
              </Button>
            </div>
          )}
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        {images.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
            <AlertCircle className="w-10 h-10 mb-2 opacity-20" />
            <p className="text-sm">No hay imágenes en la secuencia.</p>
            <p className="text-xs mt-1">Genera o agrega imágenes para crear una secuencia para tu video musical.</p>
          </div>
        ) : (
          <div className="overflow-x-auto pb-2">
            <div className="flex gap-2 min-w-min">
              {images.map((image, index) => renderThumbnail(image, index))}
            </div>
          </div>
        )}
      </CardContent>
      
      {showControls && (
        <CardFooter className="flex justify-between py-3 border-t bg-muted/50">
          <div className="text-xs text-muted-foreground">
            {images.length > 0
              ? `Duración total: ${images.reduce((acc, img) => acc + img.duration, 0).toFixed(1)}s`
              : "Agrega imágenes para comenzar"}
          </div>
          
          <Button
            variant="default"
            size="sm"
            onClick={() => onAddToTimeline?.(images)}
            disabled={images.length === 0}
            className="h-8"
          >
            Agregar a Timeline
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}