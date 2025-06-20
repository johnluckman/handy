import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator, StackNavigationProp } from '@react-navigation/stack';

import DashboardScreen from '../screens/DashboardScreen';
import CashCounterScreen from '../screens/CashCounterScreen';

export type RootStackParamList = {
  Dashboard: undefined;
  CashCounter: undefined;
};

export type NavigationProps = StackNavigationProp<RootStackParamList>;

const Stack = createStackNavigator<RootStackParamList>();

/**
 * @returns {React.ReactElement} The main application navigator component.
 */
export default function AppNavigator(): React.ReactElement {
  return (
    <NavigationContainer>
      <Stack.Navigator 
        initialRouteName="Dashboard"
        screenOptions={{
          headerShown: false,
          cardStyle: { flex: 1 },
        }}
      >
        <Stack.Screen 
          name="Dashboard" 
          component={DashboardScreen}
        />
        <Stack.Screen 
          name="CashCounter" 
          component={CashCounterScreen} 
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
} 