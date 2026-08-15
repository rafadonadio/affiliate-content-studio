import React, { createContext, useContext, useState, useEffect } from 'react';

// For the architectural prototype, we simulate a Cloud Auth Provider (like Supabase/Firebase)
// In production, this would use: import { createClient } from '@supabase/supabase-js'

export interface User {
  id: string;
  email: string;
  role: string;
  hasProLicense: boolean;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check local storage for session to simulate persistent login
    const session = localStorage.getItem('saas_session');
    if (session) {
      setUser(JSON.parse(session));
    }
    setLoading(false);
  }, []);

  const login = async (email: string, pass: string) => {
    // REAL BACKEND AUTH
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: pass })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Invalid credentials');
      }

      const data = await response.json();
      
      setUser(data.user);
      // Store token and user session
      localStorage.setItem('saas_token', data.token);
      localStorage.setItem('saas_session', JSON.stringify(data.user));
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('saas_session');
    localStorage.removeItem('saas_token');
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
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
