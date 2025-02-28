import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  ImageIcon,
  Music2Icon,
  User2Icon,
  PaletteIcon,
  HashIcon,
  KeyIcon,
  AtSignIcon,
  PhoneIcon,
  Calendar,
  DownloadIcon,
  CopyIcon,
  Loader2,
  RefreshCwIcon,
  SparklesIcon,
  SquareUserIcon,
  UserCircle2Icon,
  Share2Icon
} from "lucide-react";

interface ArtistData {
  id: string;
  name: string;
  biography: string;
  album: {
    id: string;
    name: string;
    release_date: string;
    songs: {
      title: string;
      duration: string;
      composers: string[];
      explicit: boolean;
    }[];
    single: {
      title: string;
      duration: string;
    };
  };
  look: {
    description: string;
    color_scheme: string;
  };
  music_genres: string[];
  image_prompts: {
    artist_look: string;
    album_cover: string;
    promotional: string;
  };
  social_media: {
    twitter: { handle: string; url: string; };
    instagram: { handle: string; url: string; };
    tiktok: { handle: string; url: string; };
    youtube: { handle: string; url: string; };
    spotify: { handle: string; url: string; };
  };
  password: {
    value: string;
    last_updated: string;
  };
  management: {
    email: string;
    phone: string;
  };
  firestoreId?: string;
}

export default function ArtistGeneratorPage() {
  const { toast } = useToast();
  const [currentArtist, setCurrentArtist] = useState<ArtistData | null>(null);
  const [savedArtists, setSavedArtists] = useState<ArtistData[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Mutación para generar un artista aleatorio
  const generateArtistMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest({
        url: "/api/generate-artist",
        method: "POST",
        data: {}
      });
      return response;
    },
    onSuccess: (data) => {
      const newArtist = data.data;
      setCurrentArtist(newArtist);
      // Guardar el artista en el arreglo de artistas guardados
      setSavedArtists(prev => [...prev, newArtist]);
      toast({
        title: "Artista generado con éxito",
        description: `${newArtist.name} ha sido creado y guardado en Firestore.`
      });
    },
    onError: (error) => {
      console.error("Error al generar artista:", error);
      toast({
        title: "Error",
        description: "No se pudo generar el artista aleatorio.",
        variant: "destructive"
      });
    }
  });

  const handleGenerateArtist = () => {
    setIsLoading(true);
    generateArtistMutation.mutate();
  };

  const handleCopyToClipboard = (text: string, description: string) => {
    navigator.clipboard.writeText(text)
      .then(() => {
        toast({
          title: "Copiado al portapapeles",
          description: description
        });
      })
      .catch(err => {
        toast({
          title: "Error",
          description: "No se pudo copiar al portapapeles",
          variant: "destructive"
        });
      });
  };

  // Función para descargar los datos del artista como un archivo JSON
  const handleDownloadJson = () => {
    if (!currentArtist) return;

    const dataStr = JSON.stringify(currentArtist, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', `${currentArtist.name.replace(/\s+/g, '_')}_metadata.json`);
    document.body.appendChild(linkElement);
    linkElement.click();
    document.body.removeChild(linkElement);

    toast({
      title: "Archivo descargado",
      description: `Metadatos de ${currentArtist.name} guardados como JSON`
    });
  };

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="container mx-auto">
          <div className="text-center mb-10">
            <h1 className="text-4xl font-bold mb-3 bg-clip-text text-transparent bg-gradient-to-r from-orange-500 to-red-500">
              Generador de Artistas
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Genera perfiles de artistas aleatorios completos con datos de álbum, imagen, redes sociales y más para usar en tus proyectos musicales.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
            <div className="lg:col-span-3 flex justify-center">
              <Button 
                size="lg"
                onClick={handleGenerateArtist}
                className="bg-gradient-to-r from-orange-500 to-red-500 hover:to-red-600 transition-all duration-300 hover:shadow-xl group"
                disabled={generateArtistMutation.isPending}
              >
                {generateArtistMutation.isPending ? (
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                ) : (
                  <SparklesIcon className="h-5 w-5 mr-2 group-hover:rotate-45 transition-transform" />
                )}
                Generar Artista Aleatorio
              </Button>
            </div>
          </div>

          {currentArtist && (
            <Tabs defaultValue="profile" className="w-full">
              <TabsList className="grid grid-cols-4 w-full max-w-2xl mx-auto mb-8">
                <TabsTrigger value="profile">Perfil</TabsTrigger>
                <TabsTrigger value="music">Música</TabsTrigger>
                <TabsTrigger value="image">Imagen</TabsTrigger>
                <TabsTrigger value="social">Social</TabsTrigger>
              </TabsList>

              {/* PERFIL */}
              <TabsContent value="profile" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                  {/* Información general */}
                  <Card className="md:col-span-3">
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <UserCircle2Icon className="mr-2 h-5 w-5 text-orange-500" />
                        Información General
                      </CardTitle>
                      <CardDescription>
                        Datos básicos del artista generado
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <Avatar className="h-20 w-20 rounded-md bg-orange-100 p-2">
                            <User2Icon className="h-10 w-10 text-orange-500" />
                          </Avatar>
                          <div>
                            <h3 className="text-2xl font-bold">{currentArtist.name}</h3>
                            <div className="flex flex-wrap gap-2 mt-2">
                              {currentArtist.music_genres.map((genre, i) => (
                                <Badge key={i} variant="outline" className="bg-orange-100/50">
                                  {genre}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-shrink-0"
                            onClick={() => handleCopyToClipboard(currentArtist.name, "Nombre copiado")}
                          >
                            <CopyIcon className="h-4 w-4 mr-2" />
                            Copiar nombre
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-shrink-0"
                            onClick={handleDownloadJson}
                          >
                            <DownloadIcon className="h-4 w-4 mr-2" />
                            Descargar JSON
                          </Button>
                        </div>
                      </div>

                      <div className="mt-6">
                        <h4 className="text-sm font-medium text-muted-foreground mb-2">Biografía:</h4>
                        <p className="text-sm">{currentArtist.biography}</p>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="mt-2"
                          onClick={() => handleCopyToClipboard(currentArtist.biography, "Biografía copiada")}
                        >
                          <CopyIcon className="h-3 w-3 mr-1" />
                          Copiar
                        </Button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
                        <div>
                          <h4 className="text-sm font-medium text-muted-foreground mb-2">
                            <AtSignIcon className="h-4 w-4 inline mr-1" /> Contacto:
                          </h4>
                          <p className="text-sm flex items-center">
                            {currentArtist.management.email}
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0 ml-1"
                              onClick={() => handleCopyToClipboard(currentArtist.management.email, "Email copiado")}
                            >
                              <CopyIcon className="h-3 w-3" />
                            </Button>
                          </p>
                          <p className="text-sm flex items-center">
                            {currentArtist.management.phone}
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0 ml-1"
                              onClick={() => handleCopyToClipboard(currentArtist.management.phone, "Teléfono copiado")}
                            >
                              <CopyIcon className="h-3 w-3" />
                            </Button>
                          </p>
                        </div>
                        
                        <div>
                          <h4 className="text-sm font-medium text-muted-foreground mb-2">
                            <KeyIcon className="h-4 w-4 inline mr-1" /> Credenciales:
                          </h4>
                          <p className="text-sm flex items-center">
                            <span className="font-mono bg-gray-100 dark:bg-gray-800 p-1 rounded">
                              {currentArtist.password.value}
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0 ml-1"
                              onClick={() => handleCopyToClipboard(currentArtist.password.value, "Contraseña copiada")}
                            >
                              <CopyIcon className="h-3 w-3" />
                            </Button>
                          </p>
                          <p className="text-sm mt-1">
                            Actualizada: {currentArtist.password.last_updated}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Estilos y Colores */}
                  <Card className="md:col-span-2">
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <PaletteIcon className="mr-2 h-5 w-5 text-orange-500" />
                        Estilo Visual
                      </CardTitle>
                      <CardDescription>
                        Descripción estética y paleta de colores
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground mb-2">Descripción del Look:</h4>
                        <p className="text-sm">{currentArtist.look.description}</p>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="mt-1"
                          onClick={() => handleCopyToClipboard(currentArtist.look.description, "Descripción copiada")}
                        >
                          <CopyIcon className="h-3 w-3 mr-1" />
                          Copiar
                        </Button>
                      </div>

                      <div className="mt-4">
                        <h4 className="text-sm font-medium text-muted-foreground mb-2">Paleta de Colores:</h4>
                        <div className="text-sm">
                          {currentArtist.look.color_scheme}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="mt-1"
                          onClick={() => handleCopyToClipboard(currentArtist.look.color_scheme, "Paleta copiada")}
                        >
                          <CopyIcon className="h-3 w-3 mr-1" />
                          Copiar
                        </Button>
                      </div>

                      <div className="mt-4">
                        <h4 className="text-sm font-medium text-muted-foreground mb-2">ID del Artista:</h4>
                        <p className="text-sm font-mono">{currentArtist.id}</p>
                        <p className="text-xs text-muted-foreground mt-1">Firestore ID: {currentArtist.firestoreId || "N/A"}</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* MÚSICA */}
              <TabsContent value="music" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Music2Icon className="mr-2 h-5 w-5 text-orange-500" />
                      Álbum: {currentArtist.album.name}
                    </CardTitle>
                    <CardDescription className="flex items-center">
                      <Calendar className="h-4 w-4 mr-1 text-muted-foreground" />
                      Fecha de lanzamiento: {currentArtist.album.release_date}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-lg font-medium mb-2">Single Principal</h3>
                        <div className="bg-orange-100/30 p-4 rounded-md">
                          <div className="flex justify-between items-center">
                            <div>
                              <h4 className="font-semibold">{currentArtist.album.single.title}</h4>
                              <p className="text-sm text-muted-foreground">Duración: {currentArtist.album.single.duration}</p>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleCopyToClipboard(currentArtist.album.single.title, "Título de single copiado")}
                            >
                              <CopyIcon className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h3 className="text-lg font-medium mb-2">Canciones del Álbum</h3>
                        <div className="space-y-2">
                          {currentArtist.album.songs.map((song, index) => (
                            <div 
                              key={index}
                              className="flex justify-between items-center p-3 rounded-md hover:bg-muted/50 transition-colors"
                            >
                              <div>
                                <div className="flex items-center">
                                  <span className="text-muted-foreground mr-3 w-6 text-center">{index + 1}</span>
                                  <span className="font-medium">
                                    {song.title}
                                    {song.explicit && (
                                      <span className="ml-2 px-1.5 py-0.5 text-xs bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300 rounded">
                                        E
                                      </span>
                                    )}
                                  </span>
                                </div>
                                <div className="flex text-xs text-muted-foreground ml-9 mt-0.5">
                                  {song.composers.join(", ")} • {song.duration}
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleCopyToClipboard(song.title, "Título de canción copiado")}
                              >
                                <CopyIcon className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* IMAGEN */}
              <TabsContent value="image" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <ImageIcon className="mr-2 h-5 w-5 text-orange-500" />
                      Prompts de Imagen
                    </CardTitle>
                    <CardDescription>
                      Prompts detallados para generar imágenes del artista
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <h3 className="text-sm font-medium mb-2 flex items-center">
                        <SquareUserIcon className="h-4 w-4 mr-2 text-orange-500" />
                        Look del Artista
                      </h3>
                      <div className="relative bg-muted p-4 rounded-md">
                        <p className="text-sm">{currentArtist.image_prompts.artist_look}</p>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="absolute top-2 right-2"
                          onClick={() => handleCopyToClipboard(currentArtist.image_prompts.artist_look, "Prompt de artista copiado")}
                        >
                          <CopyIcon className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium mb-2 flex items-center">
                        <Music2Icon className="h-4 w-4 mr-2 text-orange-500" />
                        Portada del Álbum
                      </h3>
                      <div className="relative bg-muted p-4 rounded-md">
                        <p className="text-sm">{currentArtist.image_prompts.album_cover}</p>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="absolute top-2 right-2"
                          onClick={() => handleCopyToClipboard(currentArtist.image_prompts.album_cover, "Prompt de portada copiado")}
                        >
                          <CopyIcon className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium mb-2 flex items-center">
                        <Share2Icon className="h-4 w-4 mr-2 text-orange-500" />
                        Foto Promocional
                      </h3>
                      <div className="relative bg-muted p-4 rounded-md">
                        <p className="text-sm">{currentArtist.image_prompts.promotional}</p>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="absolute top-2 right-2"
                          onClick={() => handleCopyToClipboard(currentArtist.image_prompts.promotional, "Prompt promocional copiado")}
                        >
                          <CopyIcon className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* SOCIAL */}
              <TabsContent value="social" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <HashIcon className="mr-2 h-5 w-5 text-orange-500" />
                      Redes Sociales
                    </CardTitle>
                    <CardDescription>
                      Perfiles y enlaces para plataformas sociales
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {Object.entries(currentArtist.social_media).map(([platform, data]) => (
                          <div key={platform} className="flex items-center justify-between p-3 bg-muted/40 rounded-md">
                            <div>
                              <div className="font-medium capitalize mb-1">{platform}</div>
                              <div className="text-sm text-muted-foreground">{data.handle}</div>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleCopyToClipboard(data.handle, `@${data.handle} copiado`)}
                              >
                                <CopyIcon className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleCopyToClipboard(data.url, "URL copiada")}
                              >
                                URL
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          )}

          {savedArtists.length > 0 && (
            <div className="mt-12">
              <h2 className="text-2xl font-bold mb-6">Artistas Generados ({savedArtists.length})</h2>
              <ScrollArea className="h-[300px] rounded-md border p-4">
                <div className="space-y-6">
                  {savedArtists.map((artist, index) => (
                    <div key={index} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-3 mb-3 sm:mb-0">
                        <Avatar className="h-10 w-10 rounded-md bg-orange-100 p-1">
                          <User2Icon className="h-6 w-6 text-orange-500" />
                        </Avatar>
                        <div>
                          <h3 className="font-medium">{artist.name}</h3>
                          <div className="text-sm text-muted-foreground flex flex-wrap gap-1 mt-1">
                            {artist.music_genres.map((genre, i) => (
                              <span key={i} className="inline-block">
                                {genre}{i < artist.music_genres.length - 1 ? "," : ""}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentArtist(artist)}
                        >
                          Ver detalles
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const dataStr = JSON.stringify(artist, null, 2);
                            const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
                            const linkElement = document.createElement('a');
                            linkElement.setAttribute('href', dataUri);
                            linkElement.setAttribute('download', `${artist.name.replace(/\s+/g, '_')}_metadata.json`);
                            document.body.appendChild(linkElement);
                            linkElement.click();
                            document.body.removeChild(linkElement);
                          }}
                        >
                          <DownloadIcon className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}