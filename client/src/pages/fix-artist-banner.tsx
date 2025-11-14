import { useState } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { useToast } from "../hooks/use-toast";
import { Loader2, CheckCircle2 } from "lucide-react";

export default function FixArtistBannerPage() {
  const [artistUid, setArtistUid] = useState("BWTYGZZYcgT9WRyXAUAZm5PkpBA3");
  const [newBannerUrl, setNewBannerUrl] = useState("https://firebasestorage.googleapis.com/v0/b/artist-boost.firebasestorage.app/o/artist-references%2FBWTYGZZYcgT9WRyXAUAZm5PkpBA3%2F1763159128175_freepik__-id-10-escena-final-conjunto-frank-rey-chvez-descr__87841.png?alt=media&token=d4ad8932-f497-4519-8ef7-93eec98ce319");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const { toast } = useToast();

  const updateBanner = async () => {
    setLoading(true);
    setSuccess(false);

    try {
      const userDocRef = doc(db, "users", artistUid);
      await updateDoc(userDocRef, {
        bannerImage: newBannerUrl,
        updatedAt: new Date()
      });

      toast({
        title: "✅ Banner actualizado",
        description: "El banner se ha cambiado correctamente. Prueba el perfil en móvil ahora.",
      });
      setSuccess(true);
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
              Rey Chavez & Solo Franck
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-red-900/20 border border-red-500 p-4 rounded-lg">
              <p className="text-red-400 text-sm mb-2">
                <strong>Problema detectado:</strong>
              </p>
              <p className="text-gray-300 text-sm">
                El banner actual es un video MP4, lo cual causa que el perfil no cargue en móviles.
              </p>
            </div>

            <div className="bg-green-900/20 border border-green-500 p-4 rounded-lg">
              <p className="text-green-400 text-sm mb-2">
                <strong>Solución:</strong>
              </p>
              <p className="text-gray-300 text-sm">
                Cambiar el banner a tu referenceImage (que es PNG y funcionará perfectamente).
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm text-gray-400">UID del Artista:</label>
              <Input
                value={artistUid}
                onChange={(e) => setArtistUid(e.target.value)}
                className="bg-gray-800 text-white border-gray-700"
                disabled
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm text-gray-400">Nueva URL del Banner (debe ser imagen PNG/JPG):</label>
              <Input
                value={newBannerUrl}
                onChange={(e) => setNewBannerUrl(e.target.value)}
                className="bg-gray-800 text-white border-gray-700"
              />
            </div>

            <div className="pt-4">
              <Button
                onClick={updateBanner}
                disabled={loading || success}
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
                  "Actualizar Banner Ahora"
                )}
              </Button>
            </div>

            {success && (
              <div className="bg-blue-900/20 border border-blue-500 p-4 rounded-lg">
                <p className="text-blue-400 text-sm mb-2">
                  <strong>Siguiente paso:</strong>
                </p>
                <p className="text-gray-300 text-sm mb-3">
                  Prueba el perfil en tu móvil ahora:
                </p>
                <a
                  href="/artist/reychavezsolofranck"
                  target="_blank"
                  className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm"
                >
                  Abrir Perfil en Móvil
                </a>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
