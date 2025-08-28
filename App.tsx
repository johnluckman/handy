import 'react-native-gesture-handler';
import React, { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';

import { AuthProvider } from './src/context/AuthContext';
import { QueueProvider } from './src/context/QueueContext';
import { ProductProvider } from './src/context/ProductContext';
import { ThemeProvider } from './src/context/ThemeContext';
import AppNavigator from './src/navigation/AppNavigator';
import LoadingScreen from './src/components/LoadingScreen';
import ErrorBoundary from './src/components/ErrorBoundary';

SplashScreen.preventAutoHideAsync();

function AppContent() {
  const [fontsLoaded, fontError] = useFonts({
    'Inter-Regular': require('./src/assets/fonts/Inter-Regular.ttf'),
    'Inter-SemiBold': require('./src/assets/fonts/Inter-SemiBold.ttf'),
    'Inter-Bold': require('./src/assets/fonts/Inter-Bold.ttf'),
  });

  const [fontTimeout, setFontTimeout] = useState(false);

  useEffect(() => {
    // Add a timeout to prevent infinite loading
    const timeout = setTimeout(() => {
      console.warn('Font loading timeout - proceeding without fonts');
      setFontTimeout(true);
    }, 15000); // 15 second timeout

    return () => clearTimeout(timeout);
  }, []);

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded || fontError || fontTimeout) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError, fontTimeout]);

  // Show loading screen while fonts are loading, but with timeout fallback
  if (!fontsLoaded && !fontError && !fontTimeout) {
    return <LoadingScreen size={120} text="Loading fonts..." />;
  }

  return (
    <View style={{ flex: 1 }} onLayout={onLayoutRootView}>
      <AppNavigator />
    </View>
  );
}

export default function App(): React.ReactElement {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <QueueProvider>
            <ProductProvider>
              <AppContent />
            </ProductProvider>
          </QueueProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
