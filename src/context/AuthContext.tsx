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
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadUser() {
      const storedUser = await AsyncStorage.getItem('user');
      const storedStore = await AsyncStorage.getItem('store');
      if (storedUser && storedStore) {
        setUser(storedUser);
        setStore(storedStore);
      }
      setIsLoading(false);
    }
    loadUser();
  }, []);

  const login = async (selectedUser: string, selectedStore: string) => {
    setUser(selectedUser);
    setStore(selectedStore);
    await AsyncStorage.setItem('user', selectedUser);
    await AsyncStorage.setItem('store', selectedStore);
  };

  const logout = async () => {
    setUser(null);
    setStore(null);
    await AsyncStorage.removeItem('user');
    await AsyncStorage.removeItem('store');
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