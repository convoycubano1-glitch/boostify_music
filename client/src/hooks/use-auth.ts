/**
 * Hook de autenticación para Replit Auth
 * Reemplaza Firebase Auth pero mantiene Firestore intacto
 */
import { useQuery } from "@tanstack/react-query";

export function useAuth() {
  const { data: user, isLoading } = useQuery({
    queryKey: ["/api/auth/user"],
    retry: false,
  });

  const logout = () => {
    window.location.href = "/api/logout";
  };

  const login = () => {
    window.location.href = "/api/login";
  };

  return {
    user,
    isLoading,
    loading: isLoading,
    isAuthenticated: !!user,
    logout,
    login,
  };
}
