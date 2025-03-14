import { useState, useEffect } from 'react';

// Tipo básico para el usuario
interface User {
  id?: string;
  email?: string;
  displayName?: string;
  photoURL?: string;
}

// Hook de autenticación simplificado
export function useAuth() {
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

  return {
    user,
    loading,
    login,
    logout,
  };
}