import { useAuth } from "@/hooks/use-auth";
import { Loader2, ShieldAlert, CheckCircle } from "lucide-react";
import { Redirect, Route } from "wouter";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";

export function ProtectedRoute({
  path,
  component: Component,
}: {
  path: string;
  component: React.ComponentType<any>;
}) {
  const { user, isLoading, error } = useAuth();
  const [initialCheck, setInitialCheck] = useState(false);
  const [loginAttempted, setLoginAttempted] = useState(false);
  const { toast } = useToast();
  
  // Esta verificación adicional permite esperar un poco más para asegurarnos
  // de que se complete la autenticación antes de redirigir
  useEffect(() => {
    if (!isLoading) {
      // Si la autenticación ha terminado de cargar, marcar como verificado
      const timeoutId = setTimeout(() => setInitialCheck(true), 500);
      return () => clearTimeout(timeoutId);
    }
  }, [isLoading]);
  
  // Efectuar redireccionamiento solo una vez y mostrar feedback claro
  useEffect(() => {
    if (initialCheck && !user && !loginAttempted) {
      setLoginAttempted(true);
      
      // Guardamos la ruta actual para redirigir después del login
      sessionStorage.setItem('auth_redirect_path', path);
      
      // Notificar al usuario con un mensaje claro
      toast({
        title: (
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-orange-500" />
            <span>Acceso restringido</span>
          </div>
        ),
        description: "Necesitas iniciar sesión para acceder a esta área",
        duration: 3500,
      });
      
      console.log(`ProtectedRoute: Usuario no autenticado intentando acceder a ${path}`);
    }
    
    // Notificar cuando se accede correctamente a una ruta protegida
    if (initialCheck && user && !loginAttempted) {
      setLoginAttempted(true);
      console.log(`ProtectedRoute: Acceso verificado a ruta protegida ${path}`);
      
      toast({
        title: (
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <span>Acceso autorizado</span>
          </div>
        ),
        description: `Bienvenido a ${path.replace('/', '')}`,
        duration: 2000,
      });
    }
  }, [initialCheck, user, path, loginAttempted, toast]);

  // Mostrar el indicador de carga mientras estamos cargando o durante la verificación inicial
  if (isLoading || !initialCheck) {
    return (
      <Route path={path}>
        <div className="flex flex-col items-center justify-center min-h-screen">
          <Loader2 className="h-10 w-10 animate-spin text-orange-500 mb-4" />
          <p className="text-orange-500">Verificando autenticación...</p>
        </div>
      </Route>
    );
  }
  
  // Manejar errores de autenticación
  if (error) {
    console.error("Error en autenticación:", error);
    return (
      <Route path={path}>
        <div className="flex flex-col items-center justify-center min-h-screen">
          <ShieldAlert className="h-16 w-16 text-red-500 mb-4" />
          <h3 className="text-xl font-bold text-red-500 mb-2">Error de autenticación</h3>
          <p className="text-gray-600 mb-4">
            Se produjo un error al verificar tu sesión: {error.message}
          </p>
          <button 
            className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg"
            onClick={() => window.location.href = '/'}
          >
            Volver al inicio
          </button>
        </div>
      </Route>
    );
  }

  // Redirigir solo después de la verificación completa
  if (!user) {
    console.log("Usuario no autenticado, redirigiendo a inicio");
    return (
      <Route path={path}>
        <Redirect to="/" />
      </Route>
    );
  }

  return <Route path={path} component={Component} />
}