import { useState, useEffect } from "react";
import { collection, getDocs, query, orderBy, where, doc, setDoc } from "firebase/firestore";
import { db, auth } from "../firebase";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { useToast } from "../hooks/use-toast";
import { Copy, ExternalLink, User, Loader2, CheckCircle2, Edit, Plus } from "lucide-react";
import { Badge } from "../components/ui/badge";
import { onAuthStateChanged } from "firebase/auth";

interface Artist {
  id: string;
  uid: string;
  name: string;
  biography?: string;
  genre?: string;
  slug?: string;
  profileImage?: string;
  bannerImage?: string;
  spotify?: string;
  instagram?: string;
  createdAt?: any;
}

export default function MyArtistsPage() {
  const [artists, setArtists] = useState<Artist[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUserUid, setCurrentUserUid] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUserUid(user.uid);
        loadArtists(user.uid);
      } else {
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const loadArtists = async (userUid?: string) => {
    try {
      setIsLoading(true);
      const usersRef = collection(db, "users");
      
      let q;
      if (userUid) {
        q = query(usersRef, where("uid", "==", userUid));
      } else {
        q = query(usersRef);
      }
      
      const querySnapshot = await getDocs(q);

      const loadedArtists: Artist[] = querySnapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          uid: data.uid || docSnap.id,
          name: data.name || data.displayName || "Sin nombre",
          biography: data.biography,
          genre: data.genre,
          slug: data.slug,
          profileImage: data.profileImage,
          bannerImage: data.bannerImage,
          spotify: data.spotify,
          instagram: data.instagram,
          createdAt: data.createdAt,
        };
      });

      // Ordenar en el frontend para evitar necesitar índice compuesto
      loadedArtists.sort((a, b) => {
        const dateA = a.createdAt?.seconds || 0;
        const dateB = b.createdAt?.seconds || 0;
        return dateB - dateA;
      });

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

  const editArtist = (slug: string) => {
    window.location.href = `/artist/${slug}?edit=true`;
  };

  const createNewArtist = async () => {
    if (!currentUserUid) {
      toast({
        title: "Error",
        description: "Debes iniciar sesión para crear un artista",
        variant: "destructive",
      });
      return;
    }

    setIsCreating(true);
    try {
      const timestamp = Date.now();
      const newArtistId = `artist_${timestamp}`;
      const slug = `artista${timestamp}`;

      const newArtistRef = doc(db, "users", newArtistId);
      await setDoc(newArtistRef, {
        uid: currentUserUid,
        displayName: "Nuevo Artista",
        name: "Nuevo Artista",
        slug: slug,
        biography: "",
        genre: "",
        location: "",
        createdAt: new Date(),
        instagram: "",
        spotify: "",
        twitter: "",
        youtube: "",
      });

      toast({
        title: "Artista creado",
        description: "Redirigiendo al editor...",
      });

      setTimeout(() => {
        window.location.href = `/artist/${slug}?edit=true`;
      }, 500);
    } catch (error: any) {
      console.error("Error creating artist:", error);
      toast({
        title: "Error",
        description: "No se pudo crear el artista",
        variant: "destructive",
      });
      setIsCreating(false);
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
          <p className="text-white">Cargando tus artistas...</p>
        </div>
      </div>
    );
  }

  if (!currentUserUid) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Card className="bg-gray-900 border-gray-800 max-w-md">
          <CardContent className="p-8 text-center">
            <User className="h-16 w-16 mx-auto mb-4 text-orange-500" />
            <p className="text-white mb-4">
              Debes iniciar sesión para ver tus artistas
            </p>
            <Button
              onClick={() => window.location.href = '/login'}
              className="bg-orange-500 hover:bg-orange-600"
            >
              Iniciar Sesión
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-orange-500">
            Mis Artistas Generados
          </h1>
          <Button
            onClick={createNewArtist}
            disabled={isCreating}
            className="bg-orange-500 hover:bg-orange-600"
          >
            {isCreating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Creando...
              </>
            ) : (
              <>
                <Plus className="h-4 w-4 mr-2" />
                Crear Nuevo Artista
              </>
            )}
          </Button>
        </div>

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
                key={artist.id}
                className="bg-gray-900 border-gray-800 hover:border-orange-500 transition-all"
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-white text-lg mb-2">
                        {artist.name}
                      </CardTitle>
                      {artist.genre && (
                        <Badge
                          variant="outline"
                          className="text-xs border-orange-500 text-orange-500"
                        >
                          {artist.genre}
                        </Badge>
                      )}
                    </div>
                    {artist.profileImage && (
                      <img
                        src={artist.profileImage}
                        alt={artist.name}
                        className="w-12 h-12 rounded-full object-cover flex-shrink-0 ml-2"
                      />
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {artist.biography && (
                    <p className="text-gray-400 text-sm line-clamp-2">
                      {artist.biography}
                    </p>
                  )}

                  {artist.slug && (
                    <div className="bg-gray-800 p-2 rounded text-xs font-mono text-gray-300">
                      Slug: {artist.slug}
                    </div>
                  )}

                  <div className="space-y-2">
                    {artist.slug && (
                      <>
                        <Button
                          onClick={() => copyLink(artist.slug!)}
                          className="w-full bg-orange-500 hover:bg-orange-600"
                          size="sm"
                        >
                          <Copy className="h-4 w-4 mr-2" />
                          Copiar Enlace
                        </Button>
                        <div className="grid grid-cols-2 gap-2">
                          <Button
                            onClick={() =>
                              window.open(`/artist/${artist.slug}`, "_blank")
                            }
                            className="bg-gray-700 hover:bg-gray-600"
                            size="sm"
                            variant="outline"
                          >
                            <ExternalLink className="h-4 w-4 mr-2" />
                            Ver
                          </Button>
                          <Button
                            onClick={() => editArtist(artist.slug!)}
                            className="bg-blue-600 hover:bg-blue-700"
                            size="sm"
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Editar
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
