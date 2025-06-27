import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

// Screens
import HomeScreen from './screens/HomeScreen';
import ProductSearchScreen from './screens/ProductSearchScreen';
import ProductDetailScreen from './screens/ProductDetailScreen';
import BarcodeScannerScreen from './screens/BarcodeScannerScreen';
import SettingsScreen from './screens/SettingsScreen';

// Context
import { ProductProvider } from './context/ProductContext';
import { ThemeProvider } from './context/ThemeContext';

// Types
export type RootStackParamList = {
  Home: undefined;
  ProductSearch: { initialQuery?: string };
  ProductDetail: { productId: string };
  BarcodeScanner: undefined;
  Settings: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <ProductProvider>
            <NavigationContainer>
              <Stack.Navigator
                initialRouteName="Home"
                screenOptions={{
                  headerStyle: {
                    backgroundColor: '#1a1a1a',
                  },
                  headerTintColor: '#ffffff',
                  headerTitleStyle: {
                    fontWeight: '600',
                  },
                  cardStyle: { backgroundColor: '#000000' },
                }}
              >
                <Stack.Screen
                  name="Home"
                  component={HomeScreen}
                  options={{
                    title: 'Product View',
                    headerShown: false,
                  }}
                />
                <Stack.Screen
                  name="ProductSearch"
                  component={ProductSearchScreen}
                  options={{
                    title: 'Search Products',
                    headerBackTitle: 'Back',
                  }}
                />
                <Stack.Screen
                  name="ProductDetail"
                  component={ProductDetailScreen}
                  options={{
                    title: 'Product Details',
                    headerBackTitle: 'Back',
                  }}
                />
                <Stack.Screen
                  name="BarcodeScanner"
                  component={BarcodeScannerScreen}
                  options={{
                    title: 'Scan Barcode',
                    headerBackTitle: 'Back',
                  }}
                />
                <Stack.Screen
                  name="Settings"
                  component={SettingsScreen}
                  options={{
                    title: 'Settings',
                    headerBackTitle: 'Back',
                  }}
                />
              </Stack.Navigator>
            </NavigationContainer>
            <StatusBar style="light" />
          </ProductProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
} 