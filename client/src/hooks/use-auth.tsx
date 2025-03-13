import React, { useState, useCallback } from "react";
import { useToast } from "../hooks/use-toast";
import { useLocation } from "wouter";

// Definición de Usuario simplificada para desarrollo
interface SimplifiedUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

// Tipo para contexto de autenticación
type AuthContextType = {
  user: SimplifiedUser | null;
  isLoading: boolean;
  error: Error | null;
  login: (redirectPath?: string) => Promise<void>;
  logout: () => Promise<void>;
};

export const AuthContext = React.createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Usuario demo para desarrollo
  const demoUser: SimplifiedUser = {
    uid: "demo-user-123",
    email: "demo@example.com",
    displayName: "Usuario Demo",
    photoURL: null
  };

  const [user] = useState<SimplifiedUser | null>(demoUser);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { toast } = useToast();
  const [_, setLocation] = useLocation();

  // Función simulada de inicio de sesión para desarrollo
  const login = useCallback(async (redirectPath: string = '/dashboard') => {
    try {
      setLoading(true);
      console.log('Login simulado, redirigiendo a:', redirectPath);
      setTimeout(() => setLocation(redirectPath), 500);
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
  }, [toast, setLocation]);

  // Función simulada de cierre de sesión para desarrollo
  const logout = useCallback(async () => {
    try {
      setLoading(true);
      console.log('Logout simulado');
      setTimeout(() => setLocation('/'), 500);
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