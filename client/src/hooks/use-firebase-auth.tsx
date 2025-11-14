import React, { useState, useEffect } from 'react';
import { 
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import { auth } from '../firebase';
import { useToast } from './use-toast';
import { authService } from '../services/auth-service';

export function useFirebaseAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    console.log('🚀 [HOOK] useFirebaseAuth montado - CÓDIGO NUEVO CARGADO v2.0');
    
    // Verificar si hay resultados pendientes de redirección de autenticación
    // Esto es necesario para manejar el flujo completo de autenticación con redirección
    const checkForRedirectResult = async () => {
      try {
        console.log('🔍 [HOOK] Iniciando checkForRedirectResult()');
        const redirectUser = await authService.checkRedirectResult();
        if (redirectUser) {
          console.log('✅ [HOOK] Usuario autenticado mediante redirección:', redirectUser.email);
          toast({
            title: "¡Bienvenido!",
            description: `Has iniciado sesión como ${redirectUser.email}`,
          });
          
          // Navegar al dashboard después de autenticación exitosa
          const redirectPath = localStorage.getItem('auth_redirect_path') || '/dashboard';
          localStorage.removeItem('auth_redirect_path'); // Limpiar después de leer
          
          console.log('🔄 [HOOK] Navegando a:', redirectPath);
          
          // Usar setTimeout para dar tiempo a que Firebase persista el estado
          setTimeout(() => {
            window.location.href = redirectPath;
          }, 300);
        }
      } catch (redirectError) {
        console.error('❌ [HOOK] Error al procesar resultado de redirección:', redirectError);
      }
    };
    
    // Ejecutar la verificación una vez al montar el componente
    checkForRedirectResult();
    
    // Suscribirse a cambios en el estado de autenticación
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);

      if (user) {
        console.log('Firebase Auth: Usuario autenticado:', user.uid);
      } else {
        console.log('Firebase Auth: No hay usuario autenticado');
      }
    });

    return () => unsubscribe();
  }, [toast]);

  /**
   * Función para iniciar sesión con Google
   * Utiliza el servicio de autenticación que maneja múltiples estrategias
   * y gestiona errores comunes de autenticación
   */
  const signInWithGoogle = async () => {
    try {
      // Utilizamos el nuevo servicio de autenticación que maneja toda la lógica
      // de limpieza previa y estrategias múltiples de autenticación
      const user = await authService.signInWithGoogle();
      
      // Si llegamos aquí es que la autenticación fue exitosa usando popup
      if (user) {
        toast({
          title: "¡Bienvenido!",
          description: `Has iniciado sesión como ${user.email}`,
        });
        return user;
      }
      
      // Si no tenemos usuario pero no hubo error, es porque se inició un flujo
      // de redirección que será manejado por el useEffect
      return null;
    } catch (error: any) {
      console.error('Error en autenticación con Google:', error);
      
      // Manejo centralizado de errores con mensajes amigables
      let errorMessage = "No se pudo iniciar sesión con Google. Por favor, intenta de nuevo.";
      let shouldRetry = false;

      // Manejar tipos de errores comunes
      if (error.code === 'auth/popup-blocked') {
        errorMessage = "El navegador bloqueó la ventana emergente. Por favor, permite las ventanas emergentes para este sitio.";
      } else if (error.code === 'auth/popup-closed-by-user') {
        errorMessage = "Proceso de inicio de sesión cancelado. Por favor, completa el proceso de autenticación.";
      } else if (error.code === 'auth/internal-error') {
        errorMessage = "Error interno durante la autenticación. Estamos utilizando un método alternativo. Por favor, espera un momento...";
        shouldRetry = true;
      } else if (error.code === 'auth/network-request-failed') {
        errorMessage = "Problema de red durante la autenticación. Por favor, verifica tu conexión a internet.";
      } else if (error.code === 'auth/unauthorized-domain') {
        errorMessage = "Este dominio no está autorizado para la autenticación. Contacta al administrador.";
      }

      // Para errores que pueden solucionarse con un reintento, mostramos un mensaje diferente
      if (shouldRetry) {
        toast({
          title: "Reintentando autenticación",
          description: errorMessage,
        });
        
        // Para errores internos, no mostramos un mensaje de error sino más bien
        // un mensaje informativo de que estamos intentando un método alternativo
      } else {
        toast({
          title: "Error de inicio de sesión",
          description: errorMessage,
          variant: "destructive",
        });
      }
      
      // Re-throw para manejo en componentes superiores
      throw error;
    }
  };

  /**
   * Función para iniciar sesión anónima con email
   * Solicita un email al usuario y lo asocia con la cuenta anónima
   */
  const signInAnonymouslyWithEmail = async (email: string) => {
    try {
      // Utilizamos el servicio de autenticación para crear una sesión anónima
      const user = await authService.signInAnonymously();
      
      if (user) {
        // Almacenamos el email en localStorage para futuras referencias
        // En una implementación real, esto debería guardarse en Firestore
        localStorage.setItem('anonymous_user_email', email);
        
        toast({
          title: "¡Bienvenido!",
          description: "Has iniciado sesión en modo de acceso temporal",
        });
        return user;
      }
      
      return null;
    } catch (error: any) {
      console.error('Error en autenticación anónima:', error);
      
      toast({
        title: "Error de inicio de sesión",
        description: "No se pudo iniciar sesión anónima. Por favor, intenta de nuevo.",
        variant: "destructive",
      });
      
      throw error;
    }
  };

  /**
   * Función para cerrar sesión
   * Utiliza el servicio de autenticación para limpiar adecuadamente el estado
   */
  const logout = async () => {
    try {
      // Limpiar también el email anónimo si existe
      localStorage.removeItem('anonymous_user_email');
      
      await authService.signOut();
      toast({
        title: "Sesión cerrada",
        description: "Has cerrado sesión exitosamente",
      });
    } catch (error: any) {
      console.error('Error al cerrar sesión:', error);
      toast({
        title: "Error",
        description: "No se pudo cerrar sesión. Por favor, intenta de nuevo.",
        variant: "destructive",
      });
      throw error;
    }
  };

  return {
    user,
    loading,
    signInWithGoogle,
    signInAnonymouslyWithEmail,
    logout
  };
}