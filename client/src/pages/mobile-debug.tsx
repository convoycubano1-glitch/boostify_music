import { useState, useEffect } from "react";
import { useParams } from "wouter";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../firebase";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";

export default function MobileDebugPage() {
  const { slug } = useParams<{ slug: string }>();
  const [logs, setLogs] = useState<string[]>([]);
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [artistData, setArtistData] = useState<any>(null);

  const addLog = (message: string, type: "info" | "success" | "error" = "info") => {
    const timestamp = new Date().toLocaleTimeString();
    const emoji = type === "success" ? "✅" : type === "error" ? "❌" : "🔍";
    setLogs(prev => [...prev, `[${timestamp}] ${emoji} ${message}`]);
  };

  useEffect(() => {
    const testArtistLoad = async () => {
      try {
        addLog(`Iniciando diagnóstico para slug: ${slug || 'no-slug'}`);
        addLog(`User Agent: ${navigator.userAgent}`);
        addLog(`Ancho de pantalla: ${window.innerWidth}px`);
        addLog(`Es móvil: ${/iPhone|iPad|iPod|Android/i.test(navigator.userAgent) ? 'SÍ' : 'NO'}`);

        if (!slug) {
          addLog("ERROR: No hay slug en la URL", "error");
          setStatus("error");
          return;
        }

        addLog("Conectando a Firestore...");
        const usersRef = collection(db, "users");
        const q = query(usersRef, where("slug", "==", slug));
        
        addLog("Ejecutando query...");
        const querySnapshot = await getDocs(q);
        
        addLog(`Query completada. Resultados: ${querySnapshot.size}`, querySnapshot.size > 0 ? "success" : "error");

        if (!querySnapshot.empty) {
          const userData = querySnapshot.docs[0].data();
          setArtistData(userData);
          
          addLog(`✅ Artista encontrado: ${userData.name || userData.displayName}`, "success");
          addLog(`UID: ${userData.uid}`);
          addLog(`Slug: ${userData.slug}`);
          addLog(`Banner: ${userData.bannerImage ? 'SÍ' : 'NO'}`);
          
          if (userData.bannerImage) {
            const urlWithoutQuery = userData.bannerImage.split('?')[0];
            const isVideo = /\.(mp4|mov|avi|webm)$/i.test(urlWithoutQuery);
            addLog(`Tipo de banner: ${isVideo ? '🎬 VIDEO' : '🖼️ IMAGEN'}`, isVideo ? "error" : "success");
            
            if (isVideo) {
              addLog("⚠️ PROBLEMA: El banner es un video. Esto falla en móviles.", "error");
              addLog("💡 SOLUCIÓN: Usa /fix-artist-banner para cambiar a imagen PNG/JPG", "info");
            }
          }
          
          setStatus("success");
        } else {
          addLog(`❌ NO se encontró artista con slug: ${slug}`, "error");
          addLog("Posibles causas:", "info");
          addLog("1. El slug está mal escrito", "info");
          addLog("2. El artista no se guardó en Firestore", "info");
          addLog("3. El artista no tiene campo 'slug'", "info");
          setStatus("error");
        }
      } catch (error: any) {
        addLog(`❌ ERROR: ${error.message}`, "error");
        addLog(`Código: ${error.code || 'N/A'}`, "error");
        addLog(`Nombre: ${error.name || 'N/A'}`, "error");
        setStatus("error");
      }
    };

    testArtistLoad();
  }, [slug]);

  return (
    <div className="min-h-screen bg-black text-white p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl md:text-3xl font-bold mb-6 text-orange-500">
          Diagnóstico Móvil
        </h1>

        <Card className="bg-gray-900 border-gray-800 mb-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {status === "loading" && <Loader2 className="h-5 w-5 animate-spin text-blue-500" />}
              {status === "success" && <CheckCircle2 className="h-5 w-5 text-green-500" />}
              {status === "error" && <AlertCircle className="h-5 w-5 text-red-500" />}
              <span>
                {status === "loading" && "Cargando..."}
                {status === "success" && "¡Artista encontrado!"}
                {status === "error" && "Error al cargar artista"}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-black p-4 rounded-lg font-mono text-xs overflow-auto max-h-96">
              {logs.map((log, idx) => (
                <div key={idx} className="mb-1 text-gray-300">
                  {log}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {artistData && (
          <Card className="bg-gray-900 border-gray-800 mb-4">
            <CardHeader>
              <CardTitle className="text-green-500">Datos del Artista</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <p><strong>Nombre:</strong> {artistData.name || artistData.displayName}</p>
                <p><strong>Slug:</strong> {artistData.slug}</p>
                <p><strong>UID:</strong> {artistData.uid}</p>
                <p><strong>Género:</strong> {artistData.genre || 'N/A'}</p>
                <p><strong>Ubicación:</strong> {artistData.location || 'N/A'}</p>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="space-y-2">
          <Button
            onClick={() => window.location.href = `/artist/${slug}`}
            className="w-full bg-orange-500 hover:bg-orange-600"
            disabled={status !== "success"}
          >
            Intentar Abrir Perfil
          </Button>
          <Button
            onClick={() => window.location.href = "/artists-list"}
            className="w-full bg-gray-700 hover:bg-gray-600"
            variant="outline"
          >
            Ver Todos Los Artistas
          </Button>
        </div>
      </div>
    </div>
  );
}
