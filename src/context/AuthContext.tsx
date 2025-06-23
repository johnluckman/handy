import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AuthContextData {
  user: string | null;
  store: string | null;
  isLoading: boolean;
  login: (user: string, store: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<string | null>(null);
  const [store, setStore] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setIsLoading(false);
  }, []);

  const login = async (selectedUser: string, selectedStore: string) => {
    setIsLoading(true);
    setUser(selectedUser);
    setStore(selectedStore);
    setIsLoading(false);
  };

  const logout = async () => {
    setUser(null);
    setStore(null);
  };

  return (
    <AuthContext.Provider value={{ user, store, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  return context;
} 