import React, { useState, useEffect } from 'react';
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged,
  signOut,
  User
} from 'firebase/auth';
import { auth } from '@/firebase';
import { useToast } from '@/hooks/use-toast';

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

  // Método alternativo para autenticación sin popup (Temporal)
  const signInWithEmailTemporary = async () => {
    try {
      // Simulación de autenticación de un usuario (NO USAR EN PRODUCCIÓN)
      // Esta es una solución temporal para evitar problemas con los popups bloqueados
      console.log('Iniciando proceso de autenticación temporal...');
      
      // Simular usuario autenticado
      const mockUser = {
        uid: "temp-user-12345",
        email: "demo@example.com",
        displayName: "Demo User",
        photoURL: null
      };
      
      // No hacemos autenticación real en Firebase, solo simulamos el usuario para el propósito de demo
      setUser(mockUser as unknown as User);
      
      toast({
        title: "¡Bienvenido!",
        description: `Has iniciado sesión como ${mockUser.email}`,
      });
      
      return mockUser;
    } catch (error: any) {
      console.error('Error en autenticación temporal:', error);
      toast({
        title: "Error de inicio de sesión",
        description: "No se pudo iniciar sesión. Por favor, intenta de nuevo.",
        variant: "destructive",
      });
      throw error;
    }
  };

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
    signInWithEmailTemporary,
    logout
  };
}