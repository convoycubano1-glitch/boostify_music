// Este hook es un wrapper alrededor de nuestros hooks de autenticación existentes
// para proporcionar una interfaz más sencilla y consistente

import { useAuth } from "@/hooks/use-auth";
import { useFirebaseAuth } from "@/hooks/use-firebase-auth";

export function useUser() {
  const { user } = useAuth();
  const { logout } = useFirebaseAuth();
  
  return {
    user,
    logout
  };
}