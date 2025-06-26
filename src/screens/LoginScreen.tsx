import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import DropDownPicker from 'react-native-dropdown-picker';
import { STORES, USERS } from '../config/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LoadingScreen from '../components/LoadingScreen';

export default function LoginScreen() {
  const { login } = useAuth();

  const [storeOpen, setStoreOpen] = useState(false);
  const [storeValue, setStoreValue] = useState(STORES[0]);
  const [storeItems, setStoreItems] = useState(
    STORES.map((s) => ({ label: s, value: s }))
  );

  const [userOpen, setUserOpen] = useState(false);
  const [userValue, setUserValue] = useState<string | null>(null);
  const [userItems, setUserItems] = useState(
    USERS.map((u) => ({ label: u, value: u }))
  );

  const [isLoading, setIsLoading] = useState(true);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loadLastSelection = async () => {
      try {
      const lastStore = await AsyncStorage.getItem('lastStore');
      const lastUser = await AsyncStorage.getItem('lastUser');
        
      if (lastStore) {
        setStoreValue(lastStore);
      } else {
        setStoreValue(STORES[0]);
      }
        
      if (lastUser) {
        setUserValue(lastUser);
      } else {
        setUserValue(USERS[0]);
      }
      } catch (error) {
        console.error('Error loading last selection:', error);
        // Fallback to defaults
        setStoreValue(STORES[0]);
        setUserValue(USERS[0]);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadLastSelection();
  }, []);

  useEffect(() => {
    if (!isLoading) {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
    }
  }, [isLoading, fadeAnim]);

  const handleLogin = async () => {
    if (storeValue && userValue) {
      try {
      await AsyncStorage.setItem('lastStore', storeValue);
      await AsyncStorage.setItem('lastUser', userValue);
        await login(userValue, storeValue);
      } catch (error) {
        console.error('Error during login:', error);
      }
    }
  };

  const onStoreOpen = () => {
    setUserOpen(false);
  };

  const onUserOpen = () => {
    setStoreOpen(false);
  };

  if (isLoading) {
    return <LoadingScreen size={120} text="Loading..." />;
  }

  if (!storeValue || !userValue) {
    return <LoadingScreen size={120} text="Initializing..." />;
  }

  return (
    <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
      <LinearGradient colors={['#f2f2f2', '#39b878']} style={styles.gradient}>
        <View style={styles.header}>
          <Text style={styles.subtitle}>Select your store and name to begin</Text>
        </View>

        <View style={styles.inputContainer}>
          <DropDownPicker
            open={storeOpen}
            value={storeValue}
            items={storeItems}
            setOpen={setStoreOpen}
            setValue={setStoreValue}
            setItems={setStoreItems}
            onOpen={onStoreOpen}
            placeholder="Select a store"
            style={styles.dropdown}
            placeholderStyle={styles.placeholder}
            dropDownContainerStyle={styles.dropdownContainer}
            textStyle={styles.dropdownText}
            arrowIconStyle={styles.arrowIcon}
            tickIconStyle={styles.tickIcon}
            TickIconComponent={() => <Icon name="check" size={20} color="#2E9A65" />}
            ArrowDownIconComponent={({style}) => <Icon name="chevron-down" size={20} color="#555" style={style} />}
            ArrowUpIconComponent={({style}) => <Icon name="chevron-up" size={20} color="#555" style={style} />}
            zIndex={2000}
            zIndexInverse={1000}
          />

          <View style={{ height: 20 }} />

          <DropDownPicker
            open={userOpen}
            value={userValue}
            items={userItems}
            setOpen={setUserOpen}
            setValue={setUserValue}
            setItems={setUserItems}
            onOpen={onUserOpen}
            placeholder="Select a user"
            style={styles.dropdown}
            placeholderStyle={styles.placeholder}
            dropDownContainerStyle={styles.dropdownContainer}
            textStyle={styles.dropdownText}
            arrowIconStyle={styles.arrowIcon}
            tickIconStyle={styles.tickIcon}
            TickIconComponent={() => <Icon name="check" size={20} color="#2E9A65" />}
            ArrowDownIconComponent={({style}) => <Icon name="chevron-down" size={20} color="#555" style={style} />}
            ArrowUpIconComponent={({style}) => <Icon name="chevron-up" size={20} color="#555" style={style} />}
            zIndex={1000}
            zIndexInverse={2000}
          />
        </View>

        <TouchableOpacity style={styles.button} onPress={handleLogin}>
          <Text style={styles.buttonText}>Login</Text>
          <Icon name="arrow-right" style={styles.buttonIcon} />
        </TouchableOpacity>
      </LinearGradient>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
    justifyContent: 'center',
    padding: 30,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  subtitle: {
    fontSize: 18,
    fontFamily: 'Inter-Regular',
    color: '#555',
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: 30,
    zIndex: 1,
  },
  dropdown: {
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderWidth: 0,
    height: 55,
    borderRadius: 4,
    paddingLeft: 18,
  },
  placeholder: {
    color: '#aaa',
    fontFamily: 'Inter-SemiBold',
  },
  dropdownContainer: {
    backgroundColor: '#fff',
    borderWidth: 0,
    borderRadius: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 10,
    paddingLeft: 8,
  },
  dropdownText: {
    color: '#222',
    fontFamily: 'Inter-SemiBold',
  },
  arrowIcon: {
    // This style is passed to the icon component, but size and color are set directly
  },
  tickIcon: {
    width: 20,
    height: 20,
  },
  button: {
    flexDirection: 'row',
    backgroundColor: '#000',
    borderRadius: 50,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 8,
  },
  buttonText: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#fff',
    marginRight: 10,
  },
  buttonIcon: {
    fontSize: 20,
    color: '#fff',
  },
}); 