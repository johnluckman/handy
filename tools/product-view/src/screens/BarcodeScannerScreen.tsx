import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { useTheme } from '../context/ThemeContext';
import { useProduct } from '../context/ProductContext';
import { RootStackParamList } from '../App';

type BarcodeScannerScreenNavigationProp = StackNavigationProp<RootStackParamList, 'BarcodeScanner'>;

const BarcodeScannerScreen: React.FC = () => {
  const navigation = useNavigation<BarcodeScannerScreenNavigationProp>();
  const { colors } = useTheme();
  const { scanBarcode } = useProduct();

  const [scanning, setScanning] = useState(false);
  const [processing, setProcessing] = useState(false);

  const handleScan = async (barcode: string) => {
    setProcessing(true);
    
    try {
      const result = await scanBarcode(barcode);
      
      if (result.error) {
        Alert.alert(
          'Product Not Found',
          `No product found for barcode: ${barcode}`,
          [{ text: 'OK' }]
        );
      } else if (result.product) {
        navigation.navigate('ProductDetail', { productId: result.product.id });
      }
    } catch (error) {
      Alert.alert(
        'Scan Error',
        'Failed to process barcode. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setProcessing(false);
    }
  };

  const startScanning = () => {
    setScanning(true);
    // Simulate scan after delay
    setTimeout(() => {
      const mockBarcode = '1234567890123';
      handleScan(mockBarcode);
      setScanning(false);
    }, 2000);
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 32,
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 16,
    },
    button: {
      backgroundColor: colors.primary,
      paddingVertical: 16,
      paddingHorizontal: 32,
      borderRadius: 12,
      alignItems: 'center',
      flexDirection: 'row',
      marginBottom: 16,
    },
    buttonText: {
      color: '#FFFFFF',
      fontSize: 18,
      fontWeight: '600',
      marginLeft: 8,
    },
  });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Barcode Scanner</Text>
        <TouchableOpacity style={styles.button} onPress={startScanning}>
          <Icon name="qr-code-scanner" size={24} color="#FFFFFF" />
          <Text style={styles.buttonText}>Start Scanning</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default BarcodeScannerScreen; 