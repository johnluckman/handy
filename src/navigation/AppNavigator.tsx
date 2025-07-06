import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator, StackNavigationProp } from '@react-navigation/stack';
import { useAuth } from '../context/AuthContext';
import { View, StyleSheet } from 'react-native';
import LoadingScreen from '../components/LoadingScreen';

import DashboardScreen from '../screens/DashboardScreen';
import CashCounterScreen from '../screens/CashCounterScreen';
import LoginScreen from '../screens/LoginScreen';
import ProductSearchScreen from '../screens/ProductSearchScreen';
import ProductDetailScreen from '../screens/ProductDetailScreen';
import BarcodeScannerScreen from '../screens/BarcodeScannerScreen';
import AdminScreen from '../screens/AdminScreen';
import CashCheckScreen from '../screens/CashCheckScreen';
import CashCheckDetailScreen from '../screens/CashCheckDetailScreen';
import { Product } from '../types/Product';

export type RootStackParamList = {
  Dashboard: undefined;
  CashCounter: undefined;
  Login: undefined;
  ProductSearch: { initialQuery?: string };
  ProductDetail: { product: Product };
  BarcodeScanner: undefined;
  Admin: undefined;
  CashCheck: undefined;
  CashCheckDetail: { row: any };
};

export type NavigationProps = StackNavigationProp<RootStackParamList>;

const Stack = createStackNavigator<RootStackParamList>();

function AppStack() {
  return (
    <Stack.Navigator 
      initialRouteName="Dashboard"
      screenOptions={{
        headerShown: false,
        cardStyle: { flex: 1 },
      }}
    >
      <Stack.Screen name="Dashboard" component={DashboardScreen} />
      <Stack.Screen name="CashCounter" component={CashCounterScreen} />
      <Stack.Screen name="ProductSearch" component={ProductSearchScreen} />
      <Stack.Screen name="ProductDetail" component={ProductDetailScreen} />
      <Stack.Screen name="BarcodeScanner" component={BarcodeScannerScreen} />
      <Stack.Screen name="Admin" component={AdminScreen} />
      <Stack.Screen name="CashCheck" component={CashCheckScreen} />
      <Stack.Screen name="CashCheckDetail" component={CashCheckDetailScreen} />
    </Stack.Navigator>
  );
}

function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
    </Stack.Navigator>
  );
}

export default function AppNavigator(): React.ReactElement {
  const { user, isLoading } = useAuth();

  useEffect(() => {
    console.log('AppNavigator - Auth state:', { user: !!user, isLoading });
  }, [user, isLoading]);

  if (isLoading) {
    console.log('AppNavigator - Showing loading screen');
    return (
      <View style={styles.loadingContainer}>
        <LoadingScreen size={100} text="Loading..." />
      </View>
    );
  }

  console.log('AppNavigator - Rendering navigation, user:', !!user);
  return (
    <NavigationContainer>
      {user ? <AppStack /> : <AuthStack />}
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
}); 