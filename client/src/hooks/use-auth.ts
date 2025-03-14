import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';

// Tipo básico para el usuario
interface User {
  id?: string;
  email?: string;
  displayName?: string;
  photoURL?: string;
}

// Definir tipo para el contexto de autenticación
interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
}

// Crear contexto de autenticación
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Props para el proveedor de autenticación
interface AuthProviderProps {
  children: ReactNode;
}

// Proveedor de autenticación
export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // En un escenario real, aquí se conectaría con Firebase Auth o similar
    // Para esta demo, simplemente establecemos el estado después de un breve retraso
    const timeout = setTimeout(() => {
      setLoading(false);
      // No establecemos un usuario por defecto
      setUser(null);
    }, 1000);

    return () => clearTimeout(timeout);
  }, []);

  // Función simulada de login
  const login = async () => {
    // Implementación real conectaría con Firebase u otro proveedor
    setUser({
      id: '1',
      email: 'usuario@ejemplo.com',
      displayName: 'Usuario Demo',
    });
  };

  // Función simulada de logout
  const logout = async () => {
    setUser(null);
  };

  const value = {
    user,
    loading,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook para usar el contexto de autenticación
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
}