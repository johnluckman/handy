import React from 'react';
import { View, Text, TextInput, StyleSheet, Image } from 'react-native';

interface DenominationInputProps {
  denomination: string;
  value: number;
  imageUrl: any; // Using 'any' for require statements
  onCountChange: (denomination: string, count: number) => void;
}

/**
 * A reusable component for a single denomination input row.
 * @param {DenominationInputProps} props - The props for the component.
 * @returns {React.ReactElement} The rendered component.
 */
export default function DenominationInput({
  denomination,
  value,
  imageUrl,
  onCountChange,
}: DenominationInputProps): React.ReactElement {
  const [count, setCount] = React.useState('');

  const handleCountChange = (text: string) => {
    const numericValue = parseInt(text, 10) || 0;
    setCount(text);
    onCountChange(denomination, numericValue);
  };

  const subtotal = (parseFloat(count) || 0) * value;

  return (
    <View style={styles.container}>
      <Image source={imageUrl} style={styles.image} />
      <Text style={styles.denominationText}>{`$${denomination}`}</Text>
      <TextInput
        style={styles.input}
        keyboardType="number-pad"
        value={count}
        onChangeText={handleCountChange}
        placeholder="Count"
        placeholderTextColor="#999"
      />
      <Text style={styles.subtotalText}>{`$${subtotal.toFixed(2)}`}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#eee',
  },
  image: {
    width: 60,
    height: 30,
    resizeMode: 'contain',
    marginRight: 16,
  },
  denominationText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    width: 60,
  },
  input: {
    flex: 1,
    height: 40,
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 12,
    fontSize: 16,
    textAlign: 'center',
    marginHorizontal: 16,
  },
  subtotalText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007AFF',
    width: 80,
    textAlign: 'right',
  },
}); 