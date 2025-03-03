import { useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useLocation } from 'wouter';
import { useToast } from '@/hooks/use-toast';

/**
 * Componente para manejar la redirección automática después de la autenticación
 * - Verifica si hay un usuario autenticado y redirecciona como corresponda
 * - Muestra mensajes apropiados durante el proceso
 * - Maneja estados de carga y errores
 */
export const AuthRedirect = () => {
  const { user, isLoading } = useAuth();
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  
  useEffect(() => {
    let redirectTimer: number | null = null;

    // Solo iniciar verificación después de cargar el estado de auth
    if (!isLoading) {
      if (user) {
        // Si estamos en la página principal y hay un usuario autenticado
        if (location === '/') {
          // Mostrar mensaje de redirección
          toast({
            title: "Sesión detectada",
            description: "Redirigiendo al dashboard...",
            duration: 2000,
          });
          
          // Programar redirección con un pequeño retraso para UX fluida
          redirectTimer = window.setTimeout(() => {
            console.log('AuthRedirect: Redirigiendo usuario autenticado al dashboard');
            setLocation('/dashboard');
          }, 300);
        }
      } else {
        // Si no hay usuario autenticado y estamos en una ruta protegida
        const isProtectedRoute = 
          location.startsWith('/dashboard') || 
          location.startsWith('/profile') || 
          location.startsWith('/ai-') ||
          location.startsWith('/manager-');
          
        if (isProtectedRoute) {
          // Guardar la ubicación actual para redireccionar después del login
          sessionStorage.setItem('auth_redirect_after_login', location);
          
          // Notificar al usuario
          toast({
            title: "Acceso denegado",
            description: "Debes iniciar sesión para acceder a esta página",
            variant: "destructive",
            duration: 3000,
          });
          
          // Redireccionar a página principal
          console.log('AuthRedirect: Redirigiendo a usuario no autenticado a home desde ruta protegida:', location);
          setLocation('/');
        }
      }
    }
    
    return () => {
      if (redirectTimer) window.clearTimeout(redirectTimer);
    };
  }, [user, isLoading, location, setLocation, toast]);
  
  // Este componente no renderiza nada visualmente
  return null;
};

export default AuthRedirect;