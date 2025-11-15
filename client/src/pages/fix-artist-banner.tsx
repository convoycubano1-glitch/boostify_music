import { useState } from "react";
import { collection, query, where, getDocs, doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { useToast } from "../hooks/use-toast";
import { Loader2, CheckCircle2 } from "lucide-react";

export default function FixArtistBannerPage() {
  const [artistSlug, setArtistSlug] = useState("");
  const [newBannerUrl, setNewBannerUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [currentBanner, setCurrentBanner] = useState<string | null>(null);
  const [artistName, setArtistName] = useState<string>("");
  const { toast } = useToast();

  const checkArtist = async () => {
    if (!artistSlug.trim()) {
      toast({
        title: "Error",
        description: "Ingresa un slug de artista",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("slug", "==", artistSlug));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        toast({
          title: "Error",
          description: `No se encontró el artista con slug: ${artistSlug}`,
          variant: "destructive",
        });
        setCurrentBanner(null);
        setArtistName("");
      } else {
        const data = querySnapshot.docs[0].data();
        setCurrentBanner(data.bannerImage || null);
        setArtistName(data.name || data.displayName || "Sin nombre");
        
        // Auto-sugerir la profileImage como nuevo banner si tiene video
        const urlWithoutQuery = data.bannerImage?.split('?')[0] || '';
        const isVideo = /\.(mp4|mov|avi|webm)$/i.test(urlWithoutQuery);
        
        if (isVideo && data.profileImage) {
          setNewBannerUrl(data.profileImage);
          toast({
            title: "Video detectado",
            description: "Se sugiere usar la imagen de perfil como banner",
          });
        } else if (isVideo) {
          toast({
            title: "Video detectado",
            description: "Necesitas proporcionar una imagen PNG/JPG como nuevo banner",
            variant: "destructive",
          });
        }
      }
    } catch (error: any) {
      console.error("Error checking artist:", error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateBanner = async () => {
    if (!newBannerUrl.trim()) {
      toast({
        title: "Error",
        description: "Ingresa la URL del nuevo banner",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setSuccess(false);

    try {
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("slug", "==", artistSlug));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        toast({
          title: "Error",
          description: `No se encontró el artista con slug: ${artistSlug}`,
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      const artistDoc = querySnapshot.docs[0];
      const userDocRef = doc(db, "users", artistDoc.id);
      
      await updateDoc(userDocRef, {
        bannerImage: newBannerUrl,
        updatedAt: new Date()
      });

      toast({
        title: "✅ Banner actualizado",
        description: "El banner se ha cambiado correctamente. Prueba el perfil en móvil ahora.",
      });
      setSuccess(true);
      setCurrentBanner(newBannerUrl);
    } catch (error: any) {
      console.error("Error updating banner:", error);
      toast({
        title: "Error",
        description: error.message || "No se pudo actualizar el banner",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-4 md:p-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-bold mb-8 text-orange-500">
          Arreglar Banner de Artista
        </h1>

        <Card className="bg-gray-900 border-gray-800 mb-6">
          <CardHeader>
            <CardTitle className="text-orange-500">
              Arreglar Banner de Artista
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm text-gray-400">Paso 1: Ingresa el Slug del Artista</label>
              <div className="flex gap-2">
                <Input
                  value={artistSlug}
                  onChange={(e) => setArtistSlug(e.target.value)}
                  className="bg-gray-800 text-white border-gray-700 flex-1"
                  placeholder="ejemplo: reyfranck"
                />
                <Button
                  onClick={checkArtist}
                  disabled={loading}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Verificar
                </Button>
              </div>
            </div>

            {artistName && (
              <div className="bg-blue-900/20 border border-blue-500 p-4 rounded-lg">
                <p className="text-blue-400 text-sm mb-2">
                  <strong>Artista encontrado:</strong> {artistName}
                </p>
                {currentBanner && (
                  <div className="mt-2">
                    <p className="text-xs text-gray-400">Banner actual:</p>
                    <p className="text-xs text-gray-300 break-all font-mono mt-1">
                      {currentBanner.substring(0, 80)}...
                    </p>
                    <p className="text-xs mt-2">
                      {/\.(mp4|mov|avi|webm)$/i.test(currentBanner.split('?')[0]) ? (
                        <span className="text-red-400">🎬 VIDEO (causa problemas en móvil)</span>
                      ) : (
                        <span className="text-green-400">✅ IMAGEN</span>
                      )}
                    </p>
                  </div>
                )}
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm text-gray-400">Paso 2: Nueva URL del Banner (PNG/JPG)</label>
              <Input
                value={newBannerUrl}
                onChange={(e) => setNewBannerUrl(e.target.value)}
                className="bg-gray-800 text-white border-gray-700"
                placeholder="https://..."
              />
              <p className="text-xs text-gray-500">
                Tip: Puedes usar la profileImage del artista o cualquier imagen PNG/JPG
              </p>
            </div>

            <div className="pt-4">
              <Button
                onClick={updateBanner}
                disabled={loading || success || !artistName}
                className={`w-full ${success ? 'bg-green-600 hover:bg-green-700' : 'bg-orange-500 hover:bg-orange-600'}`}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Actualizando...
                  </>
                ) : success ? (
                  <>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    ¡Banner Actualizado!
                  </>
                ) : (
                  "Actualizar Banner"
                )}
              </Button>
            </div>

            {success && artistSlug && (
              <div className="bg-green-900/20 border border-green-500 p-4 rounded-lg">
                <p className="text-green-400 text-sm mb-2">
                  <strong>✅ Listo!</strong>
                </p>
                <p className="text-gray-300 text-sm mb-3">
                  Prueba el perfil en tu iPhone ahora:
                </p>
                <a
                  href={`/artist/${artistSlug}`}
                  target="_blank"
                  className="inline-block bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm"
                >
                  Abrir /artist/{artistSlug}
                </a>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
