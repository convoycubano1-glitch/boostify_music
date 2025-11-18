/**
 * Hook de autenticación para Replit Auth
 * Reemplaza Firebase Auth pero mantiene Firestore intacto
 */
import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";

// Tipo de usuario basado en el schema de la base de datos
interface User {
  id: number;
  replitId?: string | null;
  username?: string | null;
  email?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  profileImageUrl?: string | null;
  role: string;
  isAdmin?: boolean;
}

export function useAuth() {
  // Usar queryFn personalizado que retorna null en 401 en lugar de lanzar error
  const { data: user, isLoading } = useQuery<User | null>({
    queryKey: ["/api/auth/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    retry: false,
    staleTime: 1000 * 60 * 5, // 5 minutos
  });

  const logout = () => {
    window.location.href = "/api/logout";
  };

  const login = () => {
    window.location.href = "/api/login";
  };

  return {
    user: user ?? null,
    isLoading,
    loading: isLoading,
    isAuthenticated: !!user,
    logout,
    login,
  };
}
