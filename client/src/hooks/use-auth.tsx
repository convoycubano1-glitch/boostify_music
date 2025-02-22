import React, { useState, useEffect } from "react";
import { User } from "firebase/auth";
import { firebaseAuth } from "../firebase";
import { useToast } from "@/hooks/use-toast";

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  error: Error | null;
};

export const AuthContext = React.createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    try {
      if (!firebaseAuth) {
        console.warn('Firebase Auth not initialized');
        setLoading(false);
        return;
      }

      unsubscribe = firebaseAuth.onAuthStateChanged(
        (user) => {
          setUser(user);
          setLoading(false);
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