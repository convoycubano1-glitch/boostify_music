import React, { useState, useEffect, useCallback } from "react";
import { User } from "firebase/auth";
import { auth } from "../firebase";
import { useToast } from "@/hooks/use-toast";
import { authService } from "@/services/auth-service";
import { useLocation } from "wouter";

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  error: Error | null;
  login: (redirectPath?: string) => Promise<void>;
  logout: () => Promise<void>;
};

export const AuthContext = React.createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { toast } = useToast();
  const [_, setLocation] = useLocation();

  // Iniciar sesión con Google
  const login = useCallback(async (redirectPath: string = '/dashboard') => {
    try {
      setLoading(true);
      await authService.signInWithGoogle(redirectPath);
    } catch (err) {
      console.error('Login error:', err);
      setError(err as Error);
      toast({
        title: "Login Error",
        description: "Error al iniciar sesión. Por favor, inténtalo de nuevo.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Cerrar sesión
  const logout = useCallback(async () => {
    try {
      setLoading(true);
      await authService.signOut();
      setLocation('/');
    } catch (err) {
      console.error('Logout error:', err);
      setError(err as Error);
      toast({
        title: "Logout Error",
        description: "Error al cerrar sesión. Por favor, inténtalo de nuevo.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [toast, setLocation]);

  // Verificar resultados de redirección al cargar
  useEffect(() => {
    async function checkRedirect() {
      try {
        const redirectUser = await authService.checkRedirectResult();
        if (redirectUser) {
          setUser(redirectUser);
        }
      } catch (err) {
        console.error('Redirect result error:', err);
        // No mostramos toast aquí para evitar mostrar errores en la carga inicial
      }
    }

    checkRedirect();
  }, []);

  // Monitorear cambios en el estado de autenticación
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    try {
      if (!auth) {
        console.warn('Firebase Auth not initialized');
        setLoading(false);
        return;
      }

      unsubscribe = auth.onAuthStateChanged(
        (user) => {
          setUser(user);
          setLoading(false);
          
          if (user) {
            console.log('User authenticated:', user.displayName || user.email);
          }
        },
        (error) => {
          console.error('Auth state change error:', error);
          setError(error as Error);
          setLoading(false);
          toast({
            title: "Authentication Error",
            description: "There was an error with authentication. Some features may be limited.",
            variant: "destructive"
          });
        }
      );
    } catch (err) {
      console.error('Error setting up auth listener:', err);
      setError(err as Error);
      setLoading(false);
    }

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [toast]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading: loading,
        error,
        login,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}