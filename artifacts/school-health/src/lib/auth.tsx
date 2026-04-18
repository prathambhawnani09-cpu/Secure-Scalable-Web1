import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, UserRole } from "@workspace/api-client-react";

interface AuthContextType {
  token: string | null;
  userRole: UserRole | null;
  setAuth: (token: string, role: UserRole) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(localStorage.getItem("auth_token"));
  const [userRole, setUserRole] = useState<UserRole | null>(
    (localStorage.getItem("user_role") as UserRole) || null
  );

  const setAuth = (newToken: string, role: UserRole) => {
    localStorage.setItem("auth_token", newToken);
    localStorage.setItem("user_role", role);
    setToken(newToken);
    setUserRole(role);
  };

  const logout = () => {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("user_role");
    setToken(null);
    setUserRole(null);
  };

  return (
    <AuthContext.Provider value={{ token, userRole, setAuth, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
