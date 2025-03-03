import React, { useState, useEffect, useCallback } from "react";
import { User } from "firebase/auth";
import { auth } from "../firebase";
import { useToast } from "@/hooks/use-toast";
import { authService } from "@/services/auth-service";
import { useLocation } from "wouter";
import { CheckCircle, AlertCircle, LogIn, UserCheck } from "lucide-react";

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  error: Error | null;
  login: (redirectPath?: string) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
};

export const AuthContext = React.createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [lastLoginTime, setLastLoginTime] = useState<Date | null>(null);
  const { toast } = useToast();
  const [_, setLocation] = useLocation();
  
  // Manejar redireccionamiento manual al dashboard para usuarios ya autenticados
  useEffect(() => {
    // Si el usuario está autenticado y hay un destino en sessionStorage, redirigir
    if (user && !loading) {
      const redirectPath = sessionStorage.getItem('auth_redirect_path');
      if (redirectPath) {
        console.log('Usuario autenticado con destino pendiente, redirigiendo a:', redirectPath);
        
        // Notificar del redireccionamiento con toast
        toast({
          title: (
            <div className="flex items-center gap-2">
              <UserCheck className="h-4 w-4 text-green-500" />
              <span>Acceso validado</span>
            </div>
          ),
          description: `Redirigiendo a ${redirectPath}...`,
          duration: 3000,
        });
        
        // Pequeño retraso para permitir que se muestre el toast
        setTimeout(() => {
          window.location.href = redirectPath;
          sessionStorage.removeItem('auth_redirect_path');
        }, 500);
      } else if (window.location.pathname === '/') {
        // Si no hay destino específico y estamos en la página principal,
        // redirigir automáticamente al dashboard si hay un usuario autenticado
        console.log('Usuario autenticado en página principal, redirigiendo al dashboard automáticamente');
        
        // Sólo mostrar toast si es una sesión recién iniciada
        if (lastLoginTime && (new Date().getTime() - lastLoginTime.getTime() < 5000)) {
          toast({
            title: (
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Sesión iniciada</span>
              </div>
            ),
            description: "Bienvenido a tu dashboard",
            duration: 3000,
          });
        }
        
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 300);
      }
    }
  }, [user, loading, toast, lastLoginTime]);

  // Iniciar sesión con Google
  const login = useCallback(async (redirectPath: string = '/dashboard') => {
    try {
      setLoading(true);
      setError(null);
      
      // Notificar inicio del proceso de login
      toast({
        title: (
          <div className="flex items-center gap-2">
            <LogIn className="h-4 w-4 text-orange-500 animate-pulse" />
            <span>Iniciando sesión</span>
          </div>
        ),
        description: "Conectando con Google...",
        duration: 2000,
      });
      
      await authService.signInWithGoogle(redirectPath);
      setLastLoginTime(new Date());
    } catch (err) {
      console.error('Login error:', err);
      setError(err as Error);
      toast({
        title: (
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-red-500" />
            <span>Error de inicio de sesión</span>
          </div>
        ),
        description: `${(err as Error)?.message || "Error al iniciar sesión. Por favor, inténtalo de nuevo."}`,
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Cerrar sesión
  const logout = useCallback(async () => {
    try {
      setLoading(true);
      
      // Limpiar datos de sesión adicionales
      sessionStorage.removeItem('auth_redirect_path');
      localStorage.removeItem('last_login_time');
      
      await authService.signOut();
      
      // Feedback al usuario
      toast({
        title: "Sesión cerrada",
        description: "Has cerrado sesión correctamente",
        duration: 3000,
      });
      
      // Redireccionar a la página principal
      setLocation('/');
    } catch (err) {
      console.error('Logout error:', err);
      setError(err as Error);
      toast({
        title: (
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-red-500" />
            <span>Error al cerrar sesión</span>
          </div>
        ),
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
        console.log("AuthService: Verificando resultado de redirección");
        const redirectUser = await authService.checkRedirectResult();
        if (redirectUser) {
          setUser(redirectUser);
          setLastLoginTime(new Date());
          console.log("AuthService: Redireccionamiento exitoso, usuario autenticado:", redirectUser.displayName || redirectUser.email);
          
          // Guardar tiempo de login en localStorage para persistencia
          localStorage.setItem('last_login_time', new Date().toISOString());
        } else {
          console.log("AuthService: No hay redirección en progreso");
          
          // Recuperar último tiempo de login si existe
          const storedLoginTime = localStorage.getItem('last_login_time');
          if (storedLoginTime) {
            setLastLoginTime(new Date(storedLoginTime));
          }
        }
      } catch (err) {
        console.error('Redirect result error:', err);
        // No mostramos toast aquí para evitar mostrar errores en la carga inicial
        setError(err as Error);
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
      
      console.log("Authentication persistence enabled");

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
            title: (
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-red-500" />
                <span>Error de autenticación</span>
              </div>
            ),
            description: "Hubo un problema con la autenticación. Algunas funciones pueden estar limitadas.",
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
        logout,
        isAuthenticated: !!user
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  try {
    const context = React.useContext(AuthContext);
    if (!context) {
      console.error("useAuth debe usarse dentro de un AuthProvider");
      // Proporcionar un valor por defecto para evitar errores catastróficos
      return {
        user: null,
        isLoading: false,
        error: new Error("AuthProvider not found"),
        login: async () => { console.error("Auth Provider not available"); },
        logout: async () => { console.error("Auth Provider not available"); },
        isAuthenticated: false
      };
    }
    return context;
  } catch (error) {
    console.error("Error al usar hook de autenticación:", error);
    // Proporcionar un valor por defecto para evitar errores catastróficos
    return {
      user: null,
      isLoading: false,
      error: error instanceof Error ? error : new Error("Unknown auth error"),
      login: async () => { console.error("Auth Provider error"); },
      logout: async () => { console.error("Auth Provider error"); },
      isAuthenticated: false
    };
  }
}