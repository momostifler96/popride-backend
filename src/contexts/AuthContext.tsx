import { createContext, useContext, useState, ReactNode } from 'react';

interface AuthContextType {
  adminUser: { id: string; email: string } | null;
  setAdminUser: (user: { id: string; email: string } | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [adminUser, setAdminUser] = useState<{ id: string; email: string } | null>(null);

  return (
    <AuthContext.Provider value={{ adminUser, setAdminUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
