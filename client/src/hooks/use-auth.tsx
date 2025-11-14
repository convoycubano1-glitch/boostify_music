import { useState, useEffect, createContext, useContext } from 'react';
import { onAuthStateChanged, signOut as firebaseSignOut, getRedirectResult } from 'firebase/auth';
import { auth } from '../lib/firebase';

export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  logout: async () => {},
  isAuthenticated: false,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('🚀 [AUTH PROVIDER] Inicializando - v3.0 MÓVIL FIX');
    
    // PRIMERO: Verificar si hay un redirect result pendiente (para móviles)
    const checkRedirectAuth = async () => {
      try {
        // Pequeño delay para asegurar que Firebase esté listo
        await new Promise(resolve => setTimeout(resolve, 100));
        
        console.log('🔍 [REDIRECT] Verificando resultado de redirección...');
        const result = await getRedirectResult(auth);
        
        if (result && result.user) {
          console.log('✅ [REDIRECT] Usuario autenticado exitosamente:', result.user.email);
          
          // Navegar al dashboard
          const redirectPath = localStorage.getItem('auth_redirect_path') || '/dashboard';
          localStorage.removeItem('auth_redirect_path');
          
          console.log('🔄 [REDIRECT] Navegando a:', redirectPath);
          setTimeout(() => {
            window.location.href = redirectPath;
          }, 500);
        } else {
          console.log('ℹ️ [REDIRECT] No hay resultado de redirección pendiente');
        }
      } catch (error: any) {
        console.error('❌ [REDIRECT] Error:', error);
        if (error.code === 'auth/unauthorized-domain') {
          console.error('❌ Dominio no autorizado:', window.location.hostname);
        }
      }
    };
    
    // Ejecutar verificación de redirect
    checkRedirectAuth();
    
    // SEGUNDO: Suscribirse a cambios de auth
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log('🔐 [AUTH STATE] Estado cambió:', user ? user.email : 'No autenticado');
      if (user) {
        const { uid, email, displayName, photoURL } = user;
        setUser({ uid, email, displayName, photoURL });
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const logout = async () => {
    try {
      await firebaseSignOut(auth);
      setUser(null);
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  const value = {
    user,
    loading,
    logout,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  return useContext(AuthContext);
}