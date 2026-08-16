import { API_URL } from '../config.js';
import React, { createContext, useContext, useState, useEffect } from 'react';

// For the architectural prototype, we simulate a Cloud Auth Provider (like Supabase/Firebase)
// In production, this would use: import { createClient } from '@supabase/supabase-js'

export interface User {
  id: string;
  email: string;
  role: string;
  hasProLicense: boolean;
  assistantName?: string;
  assistantAvatar?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  requestOtp: (email: string) => Promise<void>;
  verifyOtp: (email: string, code: string) => Promise<void>;
  logout: () => void;
  updateAssistant: (name: string, avatar: string) => Promise<void>;
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

  const requestOtp = async (email: string) => {
    try {
      const response = await fetch(API_URL + '/api/auth/request-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to request code');
      }
    } catch (error) {
      throw error;
    }
  };

  const verifyOtp = async (email: string, code: string) => {
    try {
      const response = await fetch(API_URL + '/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Invalid code');
      }

      const data = await response.json();
      
      setUser(data.user);
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

  const updateAssistant = async (name: string, avatar: string) => {
    if (!user) return;
    try {
      const response = await fetch(API_URL + '/api/auth/assistant', {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('saas_token')}`
        },
        body: JSON.stringify({ assistantName: name, assistantAvatar: avatar })
      });

      if (!response.ok) throw new Error('Failed to update assistant');

      const data = await response.json();
      const updatedUser = { ...user, assistantName: data.assistantName, assistantAvatar: data.assistantAvatar };
      setUser(updatedUser);
      localStorage.setItem('saas_session', JSON.stringify(updatedUser));
    } catch (error) {
      console.error(error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, requestOtp, verifyOtp, logout, updateAssistant }}>
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
