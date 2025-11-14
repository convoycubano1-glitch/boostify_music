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
    console.log('🚀 [AUTH PROVIDER] v5.0 - FIX MÓVIL SIN LOCALSTORAGE');
    
    let hasRedirected = false;
    
    // Suscribirse a cambios de auth - ESTE ES EL MÉTODO PRINCIPAL
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log('🔐 [AUTH STATE] Estado cambió:', firebaseUser ? firebaseUser.email : 'No autenticado');
      
      if (firebaseUser) {
        const { uid, email, displayName, photoURL } = firebaseUser;
        setUser({ uid, email, displayName, photoURL });
        
        // SOLUCIÓN: Si estás autenticado Y estás en home ("/"), redirigir SIEMPRE al dashboard
        // Esto funciona porque los usuarios autenticados no deberían estar en home
        if (!hasRedirected && window.location.pathname === '/') {
          console.log('✅ [MÓVIL] Usuario autenticado en home, redirigiendo a dashboard');
          hasRedirected = true;
          
          setTimeout(() => {
            window.location.href = '/dashboard';
          }, 300);
        }
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