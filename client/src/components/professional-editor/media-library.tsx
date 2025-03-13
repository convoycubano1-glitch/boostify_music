import React, { useState, useRef, useCallback } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { ScrollArea } from '../../components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Badge } from '../../components/ui/badge';
import {
  Search,
  Upload,
  Video,
  Image as ImageIcon,
  Music,
  FileText,
  Filter,
  Plus,
  Check,
  X,
  MoreVertical,
  Star,
  StarOff,
  Trash,
  Music2
} from 'lucide-react';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '../../components/ui/dropdown-menu';

// Tipos de medios
export type MediaType = 'audio' | 'video' | 'image' | 'text';

// Interfaz para elementos de la biblioteca de medios
export interface MediaItem {
  id: string;
  type: MediaType;
  name: string;
  url: string;
  thumbnailUrl?: string;
  duration?: number;
  description?: string;
  tags?: string[];
  favorite?: boolean;
  createdAt: Date;
  updatedAt?: Date;
}

// Props para el componente MediaLibrary
export interface MediaLibraryProps {
  items: MediaItem[];
  onSelect?: (item: MediaItem) => void;
  onUpload?: (files: FileList) => void;
  onDelete?: (id: string) => void;
  onToggleFavorite?: (id: string, favorite: boolean) => void;
  selectedItemId?: string;
  allowMultipleSelection?: boolean;
}

// Component implementation with both default and named exports
export default function MediaLibraryComponent({
  items = [],
  onSelect,
  onUpload,
  onDelete,
  onToggleFavorite,
  selectedItemId,
  allowMultipleSelection = false
}: MediaLibraryProps) {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [activeTab, setActiveTab] = useState<string>('all');
  const [selectedItems, setSelectedItems] = useState<string[]>(selectedItemId ? [selectedItemId] : []);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Filtrar los elementos basados en la búsqueda y el tipo de medio
  const filteredItems = items.filter(item => {
    // Filtro por búsqueda
    const matchesSearch = !searchTerm || 
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.tags && item.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())));
    
    // Filtro por tipo de medio
    const matchesType = activeTab === 'all' || item.type === activeTab;
    
    // Filtro por favoritos
    const matchesFavorite = activeTab !== 'favorites' || item.favorite;
    
    return matchesSearch && matchesType && matchesFavorite;
  });
  
  // Función para manejar la selección de un elemento
  const handleSelect = useCallback((item: MediaItem) => {
    if (allowMultipleSelection) {
      setSelectedItems(prev => {
        if (prev.includes(item.id)) {
          return prev.filter(id => id !== item.id);
        } else {
          return [...prev, item.id];
        }
      });
    } else {
      setSelectedItems([item.id]);
    }
    
    if (onSelect) {
      onSelect(item);
    }
  }, [allowMultipleSelection, onSelect]);
  
  // Función para manejar la carga de archivos
  const handleUploadClick = useCallback(() => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, []);
  
  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0 && onUpload) {
      onUpload(e.target.files);
      // Limpiar el input después de la carga
      e.target.value = '';
    }
  }, [onUpload]);
  
  // Función para manejar la eliminación de elementos
  const handleDelete = useCallback((id: string) => {
    if (onDelete) {
      onDelete(id);
    }
  }, [onDelete]);
  
  // Función para manejar la marcación de favoritos
  const handleToggleFavorite = useCallback((id: string, favorite: boolean) => {
    if (onToggleFavorite) {
      onToggleFavorite(id, favorite);
    }
  }, [onToggleFavorite]);
  
  // Función para renderizar el ícono según el tipo de medio
  const renderMediaIcon = (type: MediaType) => {
    switch (type) {
      case 'video':
        return <Video className="h-4 w-4" />;
      case 'audio':
        return <Music className="h-4 w-4" />;
      case 'image':
        return <ImageIcon className="h-4 w-4" />;
      case 'text':
        return <FileText className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };
  
  // Función para formatear la duración
  const formatDuration = (seconds: number | undefined) => {
    if (!seconds) return '--:--';
    
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex justify-between items-center">
          <span>Biblioteca de medios</span>
          <Button
            size="sm"
            variant="ghost"
            className="h-8 w-8 p-0"
            onClick={handleUploadClick}
          >
            <Plus size={16} />
          </Button>
        </CardTitle>
        <CardDescription>
          <div className="flex items-center space-x-2">
            <Search className="h-4 w-4 opacity-50" />
            <Input
              placeholder="Buscar medios..."
              className="h-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardDescription>
      </CardHeader>
      
      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
        <div className="pl-6 pr-2">
          <TabsList className="w-full mb-2">
            <TabsTrigger value="all" className="flex-1">Todos</TabsTrigger>
            <TabsTrigger value="video" className="flex-1">Videos</TabsTrigger>
            <TabsTrigger value="audio" className="flex-1">Audio</TabsTrigger>
            <TabsTrigger value="image" className="flex-1">Imágenes</TabsTrigger>
            <TabsTrigger value="favorites" className="flex-1">Favoritos</TabsTrigger>
          </TabsList>
        </div>

        <CardContent className="p-0">
          <ScrollArea className="h-[300px] px-6 pt-2">
            {filteredItems.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 pb-6">
                {filteredItems.map((item) => (
                  <Card 
                    key={item.id}
                    className={`overflow-hidden cursor-pointer transition-colors border ${
                      selectedItems.includes(item.id) 
                        ? 'border-primary bg-primary/5' 
                        : 'hover:border-primary/50'
                    }`}
                    onClick={() => handleSelect(item)}
                  >
                    <div className="relative aspect-video w-full">
                      {item.type === 'video' && item.thumbnailUrl ? (
                        <div className="relative w-full h-full bg-black">
                          <img 
                            src={item.thumbnailUrl} 
                            alt={item.name}
                            className="absolute inset-0 w-full h-full object-contain mix-blend-normal opacity-90"
                          />
                          <div className="absolute inset-0 flex items-center justify-center">
                            <Video className="h-10 w-10 text-white opacity-70" />
                          </div>
                          {item.duration && (
                            <div className="absolute bottom-1 right-1 bg-black/70 text-white text-xs px-1 rounded">
                              {formatDuration(item.duration)}
                            </div>
                          )}
                        </div>
                      ) : item.type === 'image' && item.url ? (
                        <img 
                          src={item.url} 
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      ) : item.type === 'audio' ? (
                        <div className="w-full h-full bg-primary/10 flex items-center justify-center">
                          <Music2 className="h-10 w-10 text-primary/70" />
                          {item.duration && (
                            <div className="absolute bottom-1 right-1 bg-black/70 text-white text-xs px-1 rounded">
                              {formatDuration(item.duration)}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="w-full h-full bg-muted flex items-center justify-center">
                          {renderMediaIcon(item.type)}
                        </div>
                      )}
                      
                      {/* Acciones sobre el ítem */}
                      <div className="absolute top-1 right-1 flex gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6 bg-background/50 hover:bg-background/80 rounded-full"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleFavorite(item.id, !item.favorite);
                          }}
                        >
                          {item.favorite ? (
                            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                          ) : (
                            <StarOff className="h-3 w-3" />
                          )}
                        </Button>
                        
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-6 w-6 bg-background/50 hover:bg-background/80 rounded-full"
                            >
                              <MoreVertical className="h-3 w-3" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(item.id);
                            }}>
                              <Trash className="h-4 w-4 mr-2" />
                              Eliminar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      
                      {/* Indicador de selección */}
                      {selectedItems.includes(item.id) && (
                        <div className="absolute top-1 left-1">
                          <div className="h-5 w-5 bg-primary text-primary-foreground rounded-full flex items-center justify-center">
                            <Check className="h-3 w-3" />
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <CardFooter className="px-2 py-1 flex justify-between items-center">
                      <div className="truncate text-xs font-medium">
                        {item.name}
                      </div>
                      <Badge variant="outline" className="text-[0.65rem]">
                        {renderMediaIcon(item.type)}
                        <span className="ml-1">{item.type}</span>
                      </Badge>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-[200px] text-muted-foreground">
                <div className="mb-2">No se encontraron resultados</div>
                <Button variant="outline" size="sm" onClick={handleUploadClick}>
                  <Upload className="h-4 w-4 mr-2" />
                  Subir nuevo
                </Button>
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Tabs>
      
      {/* Input oculto para la carga de archivos */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        style={{ display: 'none' }}
        multiple={allowMultipleSelection}
        accept=".mp4,.mov,.mp3,.wav,.jpg,.jpeg,.png,.gif"
      />
    </Card>
  );
}