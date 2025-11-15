import { useState, useEffect } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Loader2, ExternalLink, AlertCircle } from "lucide-react";

interface Artist {
  id: string;
  name: string;
  slug: string;
  uid: string;
  bannerImage?: string;
  profileImage?: string;
}

export default function ArtistsListPage() {
  const [artists, setArtists] = useState<Artist[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAllArtists();
  }, []);

  const loadAllArtists = async () => {
    try {
      setIsLoading(true);
      const usersRef = collection(db, "users");
      const querySnapshot = await getDocs(usersRef);

      const loadedArtists: Artist[] = querySnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.name || data.displayName || "Sin nombre",
          slug: data.slug || "sin-slug",
          uid: data.uid || doc.id,
          bannerImage: data.bannerImage,
          profileImage: data.profileImage || data.photoURL,
        };
      });

      setArtists(loadedArtists);
      setError(null);
    } catch (err: any) {
      console.error("Error loading artists:", err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const checkBannerType = (url?: string) => {
    if (!url) return "❌ Sin banner";
    const urlWithoutQuery = url.split('?')[0];
    if (/\.(mp4|mov|avi|webm)$/i.test(urlWithoutQuery)) {
      return "🎬 VIDEO (puede fallar en móvil)";
    }
    if (/\.(jpg|jpeg|png|gif|webp)$/i.test(urlWithoutQuery)) {
      return "✅ IMAGEN";
    }
    return "⚠️ Tipo desconocido";
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-orange-500 mx-auto mb-4" />
          <p className="text-white">Cargando todos los artistas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-orange-500 mb-2">
            Diagnóstico de Artistas
          </h1>
          <p className="text-gray-400">
            Total de artistas: {artists.length}
          </p>
        </div>

        {error && (
          <Card className="bg-red-900/20 border-red-500 mb-6">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-red-500" />
                <p className="text-red-400">{error}</p>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {artists.map((artist) => (
            <Card
              key={artist.id}
              className="bg-gray-900 border-gray-800 hover:border-orange-500 transition-all"
            >
              <CardHeader>
                <div className="flex items-start gap-3">
                  {artist.profileImage && (
                    <img
                      src={artist.profileImage}
                      alt={artist.name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  )}
                  <div className="flex-1">
                    <CardTitle className="text-white text-lg">
                      {artist.name}
                    </CardTitle>
                    <p className="text-xs text-gray-500 mt-1">ID: {artist.id}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="bg-gray-800 p-3 rounded space-y-2">
                  <div>
                    <p className="text-xs text-gray-400">Slug:</p>
                    <p className="text-sm text-orange-500 font-mono break-all">
                      {artist.slug}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">UID:</p>
                    <p className="text-xs text-gray-300 font-mono break-all">
                      {artist.uid}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Banner:</p>
                    <p className="text-xs text-white">
                      {checkBannerType(artist.bannerImage)}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Button
                    onClick={() => window.open(`/artist/${artist.slug}`, "_blank")}
                    className="w-full bg-orange-500 hover:bg-orange-600"
                    size="sm"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Abrir Perfil
                  </Button>
                  <Button
                    onClick={() => {
                      const url = `${window.location.origin}/artist/${artist.slug}`;
                      navigator.clipboard.writeText(url);
                      alert("Enlace copiado: " + url);
                    }}
                    className="w-full bg-gray-700 hover:bg-gray-600"
                    size="sm"
                    variant="outline"
                  >
                    Copiar URL
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
