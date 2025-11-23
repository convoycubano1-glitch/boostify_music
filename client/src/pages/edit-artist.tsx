import { useParams, useLocation } from "wouter";
import { useState, useEffect } from "react";
import { useAuth } from "../hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "../lib/queryClient";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { useToast } from "../hooks/use-toast";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Loader2, Save, X } from "lucide-react";
import { Head } from "../components/ui/head";

interface Artist {
  id: number;
  name: string;
  artistName: string;
  slug: string;
  biography?: string;
  profileImage?: string;
  coverImage?: string;
  genres?: string[];
  country?: string;
  location?: string;
  instagram?: string;
  twitter?: string;
  youtube?: string;
  spotify?: string;
}

export default function EditArtistPage() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();

  const [formData, setFormData] = useState<Partial<Artist>>({
    artistName: "",
    biography: "",
    genres: [],
    location: "",
    instagram: "",
    twitter: "",
    youtube: "",
    spotify: "",
  });

  const [isSaving, setIsSaving] = useState(false);

  // Obtener datos del artista
  const { data: artistData, isLoading } = useQuery<{ artist: Artist }>({
    queryKey: [`/api/artist/${id}`],
    enabled: !!id && !!user,
  });

  useEffect(() => {
    if (artistData?.artist) {
      setFormData({
        artistName: artistData.artist.artistName || "",
        biography: artistData.artist.biography || "",
        genres: artistData.artist.genres || [],
        location: artistData.artist.location || "",
        instagram: artistData.artist.instagram || "",
        twitter: artistData.artist.twitter || "",
        youtube: artistData.artist.youtube || "",
        spotify: artistData.artist.spotify || "",
      });
    }
  }, [artistData]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await apiRequest({
        url: `/api/artist/${id}`,
        method: "PUT",
        data: formData,
      });

      toast({
        title: "Artista actualizado",
        description: "Los cambios han sido guardados correctamente",
      });

      queryClient.invalidateQueries({ queryKey: [`/api/artist/${id}`] });
      setLocation("/my-artists");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo actualizar el artista",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <p className="text-white">Debes iniciar sesión para editar artistas</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-orange-500" />
      </div>
    );
  }

  const artist = artistData?.artist;

  return (
    <>
      <Head
        title={`Editar ${artist?.artistName || "Artista"} | Boostify Music`}
        description="Edita los detalles de tu perfil de artista"
        url={window.location.href}
      />
      <div className="min-h-screen bg-black text-white py-8">
        <div className="container mx-auto px-4 max-w-2xl">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold">Editar Artista</h1>
            <Button
              variant="outline"
              onClick={() => setLocation("/my-artists")}
              data-testid="button-cancel-edit"
            >
              <X className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
          </div>

          <Card className="bg-gray-900 border-gray-800 p-6">
            <div className="space-y-6">
              {/* Nombre del Artista */}
              <div className="space-y-2">
                <Label htmlFor="artistName">Nombre del Artista</Label>
                <Input
                  id="artistName"
                  value={formData.artistName || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, artistName: e.target.value })
                  }
                  className="bg-gray-800 border-gray-700"
                  data-testid="input-artist-name"
                />
              </div>

              {/* Biografía */}
              <div className="space-y-2">
                <Label htmlFor="biography">Biografía</Label>
                <Textarea
                  id="biography"
                  rows={5}
                  value={formData.biography || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, biography: e.target.value })
                  }
                  className="bg-gray-800 border-gray-700"
                  data-testid="textarea-biography"
                />
              </div>

              {/* Géneros */}
              <div className="space-y-2">
                <Label htmlFor="genres">Géneros (separados por coma)</Label>
                <Input
                  id="genres"
                  value={(formData.genres || []).join(", ")}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      genres: e.target.value.split(",").map((g) => g.trim()),
                    })
                  }
                  className="bg-gray-800 border-gray-700"
                  placeholder="Pop, Rock, Jazz"
                  data-testid="input-genres"
                />
              </div>

              {/* Ubicación */}
              <div className="space-y-2">
                <Label htmlFor="location">Ubicación</Label>
                <Input
                  id="location"
                  value={formData.location || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, location: e.target.value })
                  }
                  className="bg-gray-800 border-gray-700"
                  placeholder="Ciudad, País"
                  data-testid="input-location"
                />
              </div>

              {/* Redes Sociales */}
              <div className="space-y-4 border-t border-gray-700 pt-6">
                <h3 className="font-semibold">Redes Sociales</h3>

                <div className="space-y-2">
                  <Label htmlFor="instagram">Instagram</Label>
                  <Input
                    id="instagram"
                    value={formData.instagram || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, instagram: e.target.value })
                    }
                    className="bg-gray-800 border-gray-700"
                    placeholder="@usuario"
                    data-testid="input-instagram"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="twitter">Twitter</Label>
                  <Input
                    id="twitter"
                    value={formData.twitter || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, twitter: e.target.value })
                    }
                    className="bg-gray-800 border-gray-700"
                    placeholder="@usuario"
                    data-testid="input-twitter"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="youtube">YouTube</Label>
                  <Input
                    id="youtube"
                    value={formData.youtube || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, youtube: e.target.value })
                    }
                    className="bg-gray-800 border-gray-700"
                    placeholder="URL del canal"
                    data-testid="input-youtube"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="spotify">Spotify</Label>
                  <Input
                    id="spotify"
                    value={formData.spotify || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, spotify: e.target.value })
                    }
                    className="bg-gray-800 border-gray-700"
                    placeholder="URL del artista"
                    data-testid="input-spotify"
                  />
                </div>
              </div>

              {/* Botones */}
              <div className="flex gap-3 border-t border-gray-700 pt-6">
                <Button
                  variant="outline"
                  onClick={() => setLocation("/my-artists")}
                  className="flex-1"
                  disabled={isSaving}
                  data-testid="button-cancel"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex-1 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"
                  data-testid="button-save"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Guardar Cambios
                    </>
                  )}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}
