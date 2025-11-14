import { useState, useEffect } from "react";
import { collection, getDocs, query, orderBy, doc, setDoc } from "firebase/firestore";
import { db } from "../firebase";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { useToast } from "../hooks/use-toast";
import { Copy, ExternalLink, User, Loader2, CheckCircle2 } from "lucide-react";
import { Badge } from "../components/ui/badge";

interface Artist {
  id: string;
  firestoreId?: string;
  name: string;
  biography?: string;
  music_genres?: string[];
  hasProfile?: boolean;
  slug?: string;
}

export default function MyArtistsPage() {
  const [artists, setArtists] = useState<Artist[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [creatingProfiles, setCreatingProfiles] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  useEffect(() => {
    loadArtists();
  }, []);

  const loadArtists = async () => {
    try {
      setIsLoading(true);
      const artistsRef = collection(db, "generated_artists");
      const q = query(artistsRef, orderBy("createdAt", "desc"));
      const querySnapshot = await getDocs(q);

      const loadedArtists: Artist[] = [];
      
      for (const docSnap of querySnapshot.docs) {
        const data = docSnap.data();
        const artist: Artist = {
          id: data.id || docSnap.id,
          firestoreId: docSnap.id,
          name: data.name || "Sin nombre",
          biography: data.biography,
          music_genres: data.music_genres || [],
        };

        // Verificar si ya tiene perfil en users
        const slug = generateSlug(artist.name);
        const usersRef = collection(db, "users");
        const userQuery = query(usersRef);
        const userSnapshot = await getDocs(userQuery);
        
        const hasProfile = userSnapshot.docs.some(doc => doc.data().slug === slug);
        artist.hasProfile = hasProfile;
        artist.slug = slug;

        loadedArtists.push(artist);
      }

      setArtists(loadedArtists);
    } catch (error) {
      console.error("Error loading artists:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los artistas",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const generateSlug = (name: string): string => {
    return name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "")
      .trim();
  };

  const createPublicProfile = async (artist: Artist) => {
    if (!artist.firestoreId) return;

    setCreatingProfiles(prev => new Set(prev).add(artist.firestoreId!));

    try {
      const slug = generateSlug(artist.name);
      
      // Crear documento en users
      const userDocRef = doc(db, "users", artist.firestoreId);
      await setDoc(userDocRef, {
        uid: artist.firestoreId,
        displayName: artist.name,
        name: artist.name,
        slug: slug,
        biography: artist.biography || "",
        genre: artist.music_genres?.[0] || "",
        createdAt: new Date(),
        isGeneratedArtist: true,
      });

      toast({
        title: "Perfil creado",
        description: `Perfil público creado para ${artist.name}`,
      });

      // Recargar artistas
      await loadArtists();
    } catch (error) {
      console.error("Error creating profile:", error);
      toast({
        title: "Error",
        description: "No se pudo crear el perfil público",
        variant: "destructive",
      });
    } finally {
      setCreatingProfiles(prev => {
        const newSet = new Set(prev);
        newSet.delete(artist.firestoreId!);
        return newSet;
      });
    }
  };

  const copyLink = (slug: string) => {
    const url = `${window.location.origin}/artist/${slug}`;
    navigator.clipboard.writeText(url);
    toast({
      title: "Enlace copiado",
      description: "El enlace del perfil se copió al portapapeles",
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-orange-500 mx-auto mb-4" />
          <p className="text-white">Cargando artistas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-bold mb-8 text-orange-500">
          Mis Artistas Generados
        </h1>

        {artists.length === 0 ? (
          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="p-8 text-center">
              <User className="h-16 w-16 mx-auto mb-4 text-gray-600" />
              <p className="text-gray-400 mb-4">
                No has creado ningún artista todavía
              </p>
              <Button
                onClick={() => window.location.href = '/artist-generator'}
                className="bg-orange-500 hover:bg-orange-600"
              >
                Generar Artista
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {artists.map((artist) => (
              <Card
                key={artist.firestoreId}
                className="bg-gray-900 border-gray-800 hover:border-orange-500 transition-all"
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-white text-lg mb-2">
                        {artist.name}
                      </CardTitle>
                      {artist.music_genres && artist.music_genres.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-2">
                          {artist.music_genres.slice(0, 2).map((genre, idx) => (
                            <Badge
                              key={idx}
                              variant="outline"
                              className="text-xs border-orange-500 text-orange-500"
                            >
                              {genre}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                    {artist.hasProfile && (
                      <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {artist.biography && (
                    <p className="text-gray-400 text-sm line-clamp-2">
                      {artist.biography}
                    </p>
                  )}

                  <div className="bg-gray-800 p-2 rounded text-xs font-mono text-gray-300">
                    Slug: {artist.slug}
                  </div>

                  {artist.hasProfile ? (
                    <div className="space-y-2">
                      <Button
                        onClick={() => copyLink(artist.slug!)}
                        className="w-full bg-orange-500 hover:bg-orange-600"
                        size="sm"
                      >
                        <Copy className="h-4 w-4 mr-2" />
                        Copiar Enlace
                      </Button>
                      <Button
                        onClick={() =>
                          window.open(`/artist/${artist.slug}`, "_blank")
                        }
                        className="w-full bg-gray-700 hover:bg-gray-600"
                        size="sm"
                        variant="outline"
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Ver Perfil
                      </Button>
                    </div>
                  ) : (
                    <Button
                      onClick={() => createPublicProfile(artist)}
                      disabled={creatingProfiles.has(artist.firestoreId!)}
                      className="w-full bg-green-600 hover:bg-green-700"
                      size="sm"
                    >
                      {creatingProfiles.has(artist.firestoreId!) ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Creando...
                        </>
                      ) : (
                        <>
                          <User className="h-4 w-4 mr-2" />
                          Crear Perfil Público
                        </>
                      )}
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
