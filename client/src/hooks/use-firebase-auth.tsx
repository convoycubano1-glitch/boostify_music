import React, { useState, useEffect } from 'react';
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged,
  signOut,
  User,
  browserSessionPersistence,
  setPersistence,
  browserLocalPersistence
} from 'firebase/auth';
import { auth } from '@/firebase';
import { useToast } from '@/hooks/use-toast';

// Configure GoogleAuthProvider with more robust settings
const googleProvider = new GoogleAuthProvider();
// Set custom parameters for prompt
googleProvider.setCustomParameters({
  // Using a minimal set of parameters to avoid cookie issues
  prompt: 'select_account',
  // Adding login_hint helps with account selection
  login_hint: 'user@example.com'
});

export function useFirebaseAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
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
  }, []);



  const signInWithGoogle = async () => {
    try {
      console.log('Iniciando proceso de autenticación con Google...');
      
      // Limpiamos cualquier dato de autenticación previo que pueda estar causando conflictos
      try {
        await signOut(auth);
        console.log('Sesión anterior cerrada para comenzar autenticación limpia');
        
        // Limpiamos localStorage para evitar problemas con datos corruptos
        localStorage.removeItem('firebase:authUser');
        sessionStorage.removeItem('firebase:authUser');
        
        // Esperar un momento para asegurar que todo se limpió correctamente
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (logoutError) {
        console.log('No había sesión previa activa, continuando con la autenticación', logoutError);
      }
      
      // Configurar persistencia LOCAL que es más compatible en diferentes navegadores
      await setPersistence(auth, browserLocalPersistence);
      console.log('Persistencia establecida correctamente');
      
      // Modificamos la configuración del proveedor para cada intento
      // Esto evita problemas con datos almacenados en caché
      const newProvider = new GoogleAuthProvider();
      newProvider.setCustomParameters({
        prompt: 'select_account',
        // Evitando el uso de parámetros adicionales que pueden causar problemas
      });
      
      console.log('Intentando autenticación con proveedor optimizado...');
      const result = await signInWithPopup(auth, newProvider);
      
      console.log('Autenticación exitosa:', result.user.email);
      
      toast({
        title: "¡Bienvenido!",
        description: `Has iniciado sesión como ${result.user.email}`,
      });
      
      return result.user;
      
    } catch (error: any) {
      console.error('Error detallado en autenticación con Google:', error);
      
      // Manejo centralizado de errores con mensajes claros
      let errorMessage = "No se pudo iniciar sesión con Google. Por favor, intenta de nuevo.";
      let shouldRetry = false;

      // Manejar tipos de errores comunes con mensajes descriptivos
      if (error.code === 'auth/popup-blocked') {
        errorMessage = "El navegador bloqueó la ventana emergente. Por favor, permite las ventanas emergentes para este sitio.";
      } else if (error.code === 'auth/popup-closed-by-user') {
        errorMessage = "Proceso de inicio de sesión cancelado. Por favor, completa el proceso de autenticación.";
      } else if (error.code === 'auth/internal-error') {
        // Mensaje más específico y útil para el error interno
        errorMessage = "Error de autenticación con Google. Esto puede deberse a configuraciones del navegador. Asegúrate de tener cookies habilitadas y ventanas emergentes permitidas.";
        shouldRetry = true;
      } else if (error.code === 'auth/network-request-failed') {
        errorMessage = "Problema de red durante la autenticación. Por favor, verifica tu conexión a internet.";
      }

      // Para errores internos, podemos mostrar un mensaje que sugiera alternativas
      if (shouldRetry) {
        toast({
          title: "Error de inicio de sesión",
          description: errorMessage + " Intenta refrescar la página y probar nuevamente.",
          variant: "destructive",
        });
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

  const logout = async () => {
    try {
      await signOut(auth);
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
    logout
  };
}