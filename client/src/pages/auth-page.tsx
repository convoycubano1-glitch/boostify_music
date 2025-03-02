import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { SiGoogle } from "react-icons/si";
import { Redirect } from "wouter";
import { useFirebaseAuth } from "@/hooks/use-firebase-auth";
import { useToast } from "@/hooks/use-toast";
import { useGoogleConnectionCheck } from "@/components/auth/google-connection-check";
import backgroundVideo from '../images/videos/Standard_Mode_Generated_Video.mp4';
import { Loader2, WifiOff } from "lucide-react";

export default function AuthPage() {
  const { user } = useAuth();
  const { signInWithGoogle } = useFirebaseAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const { isConnecting, canConnect, checkGoogleConnection } = useGoogleConnectionCheck();
  const [connectionErrorShown, setConnectionErrorShown] = useState(false);
  
  // Comprueba la conectividad con Google cuando el componente se monta
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    // Si no podemos conectar con Google después de la verificación inicial,
    // mostrar mensaje de error
    if (!isConnecting && !canConnect && !connectionErrorShown) {
      timeoutId = setTimeout(() => {
        toast({
          title: "Problema de conexión",
          description: "No podemos conectar con los servidores de Google. Por favor, verifica tu conexión a internet.",
          variant: "destructive",
        });
        setConnectionErrorShown(true);
      }, 1000);
    }
    
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [isConnecting, canConnect, connectionErrorShown, toast]);

  const handleGoogleSignIn = async () => {
    if (isLoading) return; // Prevenir múltiples clics
    
    setIsLoading(true);
    
    try {
      // Primero verificamos la conexión con Google
      toast({
        title: "Verificando conexión",
        description: "Comprobando conectividad con los servidores de Google...",
      });
      
      const canConnectNow = await checkGoogleConnection();
      
      if (!canConnectNow) {
        setIsLoading(false);
        toast({
          title: "Problema de conexión",
          description: "No podemos conectar con los servidores de Google. Por favor, verifica tu conexión a internet.",
          variant: "destructive",
        });
        return;
      }
      
      // Limpiar cualquier estado de error previo
      toast({
        title: "Preparando autenticación",
        description: "Conectando con Google...",
      });
      
      // Limpiamos cualquier dato de autenticación en el navegador
      // Esto es importante para evitar problemas con sesiones anteriores
      localStorage.removeItem('firebase:authUser');
      sessionStorage.removeItem('firebase:authUser');
      
      // Limpiamos cookies relacionadas con Firebase
      document.cookie.split(";").forEach(function(c) {
        if (c.trim().startsWith("firebaseAuth")) {
          document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
        }
      });
      
      console.log("Cachés y cookies limpiadas, iniciando autenticación");
      
      try {
        // Realizar la autenticación después de verificar la conexión
        await signInWithGoogle();
        
        // El éxito se maneja en el hook de auth, pero aseguramos que el loading se desactive
        // en caso de redirección exitosa pero lenta
        setTimeout(() => {
          setIsLoading(false);
        }, 3000);
      } catch (error: any) {
        console.log("Error detallado en página de autenticación:", error);
        
        // Intentamos mostrar un mensaje más específico según el tipo de error
        let errorMessage = "No se pudo iniciar sesión. Por favor, intenta nuevamente.";
        
        if (error.code === 'auth/network-request-failed') {
          errorMessage = "Error de red al conectar con Google. Verifica tu conexión a internet.";
        } else if (error.code === 'auth/popup-closed-by-user') {
          errorMessage = "Has cerrado la ventana de inicio de sesión antes de completar el proceso.";
        } else if (error.code === 'auth/popup-blocked') {
          errorMessage = "Tu navegador ha bloqueado la ventana emergente. Asegúrate de permitir ventanas emergentes para este sitio.";
        }
        
        toast({
          title: "Error de autenticación",
          description: errorMessage,
          variant: "destructive",
        });
        
        setIsLoading(false);
      }
    } catch (error: any) {
      console.error("Error crítico en manejo de autenticación:", error);
      setIsLoading(false);
      
      toast({
        title: "Error inesperado",
        description: "Ha ocurrido un problema con el sistema de autenticación. Por favor, refresca la página e intenta nuevamente.",
        variant: "destructive",
      });
    }
  };

  if (user) {
    return <Redirect to="/dashboard" />;
  }

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center">
      <video 
        autoPlay 
        loop 
        muted 
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
        src={backgroundVideo}
      />
      <div className="absolute inset-0 bg-black/60" />
      <div className="absolute inset-0 bg-gradient-to-b from-orange-500/10 via-background/40 to-background" />

      <div className="relative z-10 text-center space-y-6 max-w-md mx-auto px-4">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-white">Welcome </h1>
          <p className="text-lg text-gray-300">
            Sign in to access your dashboard and manage your music career
          </p>
        </div>

        {/* Indicador de estado de conexión */}
        {!isConnecting && !canConnect && (
          <div className="bg-red-500/20 border border-red-500 rounded-md p-3 text-white flex items-center gap-2 mb-2">
            <WifiOff className="h-5 w-5 text-red-400" />
            <span className="text-sm">
              Problema de conexión detectado. Verifica tu red o intenta de nuevo.
            </span>
          </div>
        )}

        <Button 
          variant="outline" 
          className="w-full gap-2 bg-gradient-to-r from-orange-500 via-red-500 to-orange-500 text-white border-none hover:from-orange-600 hover:via-red-600 hover:to-orange-600 transition-all duration-300"
          onClick={handleGoogleSignIn}
          disabled={isLoading || isConnecting || (!canConnect && !isConnecting)}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
              Conectando...
            </>
          ) : isConnecting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
              Verificando conexión...
            </>
          ) : !canConnect ? (
            <>
              <WifiOff className="w-5 h-5 mr-2" />
              Reintentar conexión
            </>
          ) : (
            <>
              <SiGoogle className="w-5 h-5" />
              Continuar con Google
            </>
          )}
        </Button>
        
        {isLoading && (
          <p className="text-sm text-gray-400 animate-pulse">
            Preparando conexión segura...
          </p>
        )}
        
        <div className="text-xs text-gray-400 mt-4">
          <p>
            ¿Experimentando problemas? Intenta refrescar la página o limpiar el caché del navegador.
          </p>
          <p className="mt-1">
            Estado de red: {isConnecting ? "Verificando..." : canConnect ? "Conectado" : "Sin conexión"}
          </p>
        </div>
      </div>
    </div>
  );
}