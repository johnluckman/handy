import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import CashTopUpScreen from './CashTopUpScreen';

export default function AdminScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Top Up</Text>
      <CashTopUpScreen />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
    textAlign: 'center',
  },
}); 