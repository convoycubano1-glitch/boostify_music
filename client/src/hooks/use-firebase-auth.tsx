import { useState, useEffect } from 'react';
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged,
  signOut,
  User
} from 'firebase/auth';
import { app } from '../lib/firebase';
import { useToast } from '@/hooks/use-toast';

const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

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
      const result = await signInWithPopup(auth, googleProvider);
      console.log('Autenticación exitosa:', result.user.email);

      // Verificar que el usuario tenga un ID antes de continuar
      if (!result.user.uid) {
        throw new Error('No se pudo obtener el ID del usuario');
      }

      toast({
        title: "¡Bienvenido!",
        description: `Has iniciado sesión como ${result.user.email}`,
      });

      return result.user;
    } catch (error: any) {
      console.error('Error en autenticación con Google:', error);
      let errorMessage = "No se pudo iniciar sesión con Google. Por favor, intenta de nuevo.";

      if (error.code === 'auth/popup-blocked') {
        errorMessage = "El navegador bloqueó la ventana emergente. Por favor, permite las ventanas emergentes para este sitio.";
      } else if (error.code === 'auth/popup-closed-by-user') {
        errorMessage = "Proceso de inicio de sesión cancelado. Por favor, completa el proceso de autenticación.";
      }

      toast({
        title: "Error de inicio de sesión",
        description: errorMessage,
        variant: "destructive",
      });
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