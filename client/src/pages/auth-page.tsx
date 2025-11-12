import { useState, useEffect } from "react";
import { useAuth } from "../hooks/use-auth";
import { Button } from "../components/ui/button";
import { SiGoogle } from "react-icons/si";
import { Redirect } from "wouter";
import { useFirebaseAuth } from "../hooks/use-firebase-auth";
import { useToast } from "../hooks/use-toast";
import { useGoogleConnectionCheck } from "../components/auth/google-connection-check";
import { authService } from "../services/auth-service";
import backgroundVideo from '../images/videos/Standard_Mode_Generated_Video.mp4';
import { Loader2, WifiOff, ShieldCheck, Info, User, UserMinus, AlertTriangle } from "lucide-react";
import { Input } from "../components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../components/ui/dialog";

export default function AuthPage() {
  const { user } = useAuth();
  const { signInWithGoogle, signInAnonymouslyWithEmail } = useFirebaseAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isAnonLoading, setIsAnonLoading] = useState(false);
  const { isConnecting, canConnect, checkGoogleConnection } = useGoogleConnectionCheck();
  const [connectionErrorShown, setConnectionErrorShown] = useState(false);
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [email, setEmail] = useState("");
  
  // Log de diagnóstico para iOS
  useEffect(() => {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
    
    console.log('🔐 [AUTH PAGE] Diagnóstico de inicio:');
    console.log('  - Es móvil:', isMobile);
    console.log('  - Es iOS:', isIOS);
    console.log('  - User Agent:', navigator.userAgent);
    console.log('  - localStorage disponible:', typeof localStorage !== 'undefined');
    console.log('  - sessionStorage disponible:', typeof sessionStorage !== 'undefined');
    
    // Verificar si hay flags de redirección pendientes
    if (localStorage.getItem('auth_redirect_attempt')) {
      console.log('🔐 [AUTH PAGE] ⚠️ Hay un intento de redirección pendiente!');
      console.log('  - Timestamp:', localStorage.getItem('auth_redirect_timestamp'));
      console.log('  - Redirect path:', localStorage.getItem('auth_redirect_path'));
    }
  }, []);
  
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

  // Función para validar el email
  const validateEmail = (email: string): boolean => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  // Manejar el inicio de sesión anónimo
  const handleAnonymousSignIn = async () => {
    setShowEmailDialog(true);
  };

  // Manejar el envío del formulario de email
  const handleEmailSubmit = async () => {
    if (!validateEmail(email)) {
      toast({
        title: "Email inválido",
        description: "Por favor ingresa un email válido",
        variant: "destructive",
      });
      return;
    }

    setIsAnonLoading(true);
    
    try {
      await signInAnonymouslyWithEmail(email);
      setShowEmailDialog(false);
      setIsAnonLoading(false);
      
      toast({
        title: "Acceso temporal concedido",
        description: "Has iniciado sesión en modo de vista previa. Ten en cuenta que todas las funciones están en desarrollo.",
      });
    } catch (error) {
      console.error("Error en autenticación anónima:", error);
      setIsAnonLoading(false);
      
      toast({
        title: "Error de inicio de sesión",
        description: "No se pudo iniciar sesión. Por favor, intenta de nuevo.",
        variant: "destructive",
      });
    }
  };

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
      
      // Mostramos un mensaje informativo durante el proceso
      toast({
        title: "Preparando autenticación",
        description: "Conectando con Google...",
      });
      
      try {
        // Usamos nuestro nuevo servicio de autenticación con estrategias múltiples
        // en lugar del método directo anterior
        await authService.signInWithGoogle();
        
        // El servicio manejará la notificación de éxito, pero establecemos un temporizador
        // para asegurar que el estado de carga se desactive eventualmente
        setTimeout(() => {
          setIsLoading(false);
        }, 3000);
      } catch (error: any) {
        console.log("Error detallado en página de autenticación:", error);
        
        // Manejar específicamente el error interno
        if (error.code === 'auth/internal-error') {
          toast({
            title: "Método alternativo",
            description: "Estamos utilizando un método alternativo de autenticación. Por favor, espera un momento o intenta refrescar la página.",
          });
          
          // Opcional: intentar método de redirección como último recurso
          try {
            console.log("Intentando autenticación con método de respaldo...");
            await authService.clearAuthState();
            
            // Retrasamos un momento antes de intentar la autenticación directa como último recurso
            setTimeout(async () => {
              try {
                // Aquí usamos el signInWithGoogle original como último recurso
                await signInWithGoogle();
              } catch (lastError) {
                console.error("Error en método final de respaldo:", lastError);
                setIsLoading(false);
              }
            }, 1000);
            
            return; // Salimos para evitar mostrar el error ya que estamos usando un método alternativo
          } catch (backupError) {
            console.error("Error en método de respaldo:", backupError);
          }
        }
        
        // Para otros errores, mostramos mensajes específicos
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
        
        {/* Indicador de seguridad mejorada */}
        <div className="bg-green-500/10 border border-green-500/30 rounded-md p-3 text-white flex items-center gap-2 mb-2">
          <ShieldCheck className="h-5 w-5 text-green-400" />
          <span className="text-sm text-left">
            Seguridad mejorada: Este sistema ahora utiliza métodos avanzados para resolver problemas comunes de autenticación.
          </span>
        </div>

        {/* Aviso de funciones en desarrollo */}
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-md p-3 text-white flex items-center gap-2 mb-4">
          <AlertTriangle className="h-5 w-5 text-yellow-400 flex-shrink-0" />
          <span className="text-sm text-left">
            <strong>Nota importante:</strong> Esta plataforma está en fase de desarrollo. Todas las funcionalidades están siendo implementadas y optimizadas.
          </span>
        </div>

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

        <div className="relative my-4 flex items-center">
          <div className="flex-grow border-t border-gray-600"></div>
          <span className="flex-shrink-0 px-4 text-gray-400 text-sm">o</span>
          <div className="flex-grow border-t border-gray-600"></div>
        </div>

        <Button 
          variant="outline"
          className="w-full gap-2 bg-[#121212] hover:bg-[#202020] text-white border-none"
          onClick={handleAnonymousSignIn}
          disabled={isAnonLoading}
        >
          {isAnonLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
              Processing...
            </>
          ) : (
            <>
              <UserMinus className="w-5 h-5" />
              Temporary Access (No Account)
            </>
          )}
        </Button>
        
        {(isLoading || isAnonLoading) && (
          <p className="text-sm text-gray-400 animate-pulse">
            Preparing secure connection...
          </p>
        )}
        
        <div className="text-xs text-gray-400 mt-4">
          <p>
            Experiencing problems? Try refreshing the page or clearing your browser cache.
          </p>
          <p className="mt-1">
            Network status: {isConnecting ? "Checking..." : canConnect ? "Connected" : "Disconnected"}
          </p>
          <p className="mt-1">
            Authentication system: v2.0 (with error recovery)
          </p>
        </div>

        {/* Diálogo para ingresar email */}
        <Dialog open={showEmailDialog} onOpenChange={setShowEmailDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Enter your email to continue</DialogTitle>
              <DialogDescription>
                For temporary access, we need a valid email where we can contact you.
                All platform features are currently in development.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-md p-3 flex items-start gap-2">
                <Info className="h-5 w-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                <span className="text-sm">
                  Temporary access allows you to explore the platform in preview mode. Please note that
                  all features are in development phase and may have limitations.
                </span>
              </div>
              
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium">
                  Email
                </label>
                <Input
                  id="email"
                  placeholder="your@email.com"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full"
                  autoComplete="email"
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setShowEmailDialog(false)}
                disabled={isAnonLoading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleEmailSubmit}
                disabled={isAnonLoading || !email}
                className="bg-[#121212] hover:bg-[#202020] text-white"
              >
                {isAnonLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Processing...
                  </>
                ) : (
                  "Continue"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}