import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useAuth } from '../context/AuthContext';
import { STORES, USERS } from '../config/auth';
import { LinearGradient } from 'expo-linear-gradient';

export default function LoginScreen() {
  const [store, setStore] = useState<string>(STORES[0]);
  const [user, setUser] = useState<string>(USERS[0]);
  const { login } = useAuth();

  const handleLogin = () => {
    login(user, store);
  };

  return (
    <LinearGradient colors={['#39b878', '#2E9A65']} style={styles.container}>
      <Text style={styles.title}>Welcome</Text>
      <Text style={styles.subtitle}>Select your store and name to begin</Text>

      <View style={styles.pickerContainer}>
        <Text style={styles.label}>Store</Text>
        <Picker
          selectedValue={store}
          onValueChange={(itemValue: string) => setStore(itemValue)}
          style={styles.picker}
        >
          {STORES.map((s) => <Picker.Item key={s} label={s} value={s} />)}
        </Picker>
      </View>

      <View style={styles.pickerContainer}>
        <Text style={styles.label}>User</Text>
        <Picker
          selectedValue={user}
          onValueChange={(itemValue: string) => setUser(itemValue)}
          style={styles.picker}
        >
          {USERS.map((u) => <Picker.Item key={u} label={u} value={u} />)}
        </Picker>
      </View>

      <TouchableOpacity style={styles.button} onPress={handleLogin}>
        <Text style={styles.buttonText}>Login</Text>
      </TouchableOpacity>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 40,
    fontFamily: 'Inter-Bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    fontFamily: 'Inter-Regular',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 40,
  },
  pickerContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 10,
    marginBottom: 20,
  },
  label: {
    color: '#fff',
    fontFamily: 'Inter-SemiBold',
    paddingLeft: 15,
    paddingTop: 10,
    fontSize: 16,
  },
  picker: {
    color: '#fff',
  },
  button: {
    backgroundColor: '#fff',
    borderRadius: 50,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  buttonText: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    color: '#2E9A65',
  },
}); 