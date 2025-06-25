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
    const loadAuthState = async () => {
      try {
        // Add a timeout to prevent infinite loading
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Auth loading timeout')), 10000)
        );
        
        const loadPromise = Promise.all([
          AsyncStorage.getItem('user'),
          AsyncStorage.getItem('store')
        ]);
        
        const [savedUser, savedStore] = await Promise.race([loadPromise, timeoutPromise]) as [string | null, string | null];
        
        if (savedUser && savedStore) {
          setUser(savedUser);
          setStore(savedStore);
        }
      } catch (error) {
        console.error('Error loading auth state:', error);
        // Clear potentially corrupted data
        try {
          await AsyncStorage.multiRemove(['user', 'store']);
        } catch (clearError) {
          console.error('Error clearing auth data:', clearError);
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadAuthState();
  }, []);

  const login = async (selectedUser: string, selectedStore: string) => {
    try {
      setIsLoading(true);
      setUser(selectedUser);
      setStore(selectedStore);
      
      await AsyncStorage.multiSet([
        ['user', selectedUser],
        ['store', selectedStore]
      ]);
    } catch (error) {
      console.error('Error during login:', error);
      // Revert state on error
      setUser(null);
      setStore(null);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      setUser(null);
      setStore(null);
      
      await AsyncStorage.multiRemove(['user', 'store']);
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, store, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 