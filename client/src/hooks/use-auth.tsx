import React from "react";
import { User } from "firebase/auth";
import { auth } from "../lib/firebase";
import { useFirebaseAuth } from "./use-firebase-auth";

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  error: Error | null;
};

export const AuthContext = React.createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { user, loading: isLoading, error } = useFirebaseAuth();

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
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