import React from 'react';
import { View, Text, StyleSheet, ScrollView, Button, Alert } from 'react-native';
import DenominationInput from '../components/DenominationInput';
import { denominations, Denomination } from '../utils/denominations';
import { appendToSheet, testConnection } from '../services/googleSheets';

interface Counts {
  [key: string]: number;
}

/**
 * @returns {React.ReactElement} The Cash Counter screen component.
 */
export default function CashCounterScreen(): React.ReactElement {
  const [counts, setCounts] = React.useState<Counts>({});
  const [isLoading, setIsLoading] = React.useState(false);
  const [isTesting, setIsTesting] = React.useState(false);

  const handleCountChange = (denomination: string, count: number) => {
    setCounts((prevCounts) => ({
      ...prevCounts,
      [denomination]: count,
    }));
  };

  const calculateTotal = () => {
    return denominations.reduce((total, item) => {
      const count = counts[item.id] || 0;
      return total + count * item.value;
    }, 0);
  };

  const total = calculateTotal();

  const handleSubmit = async () => {
    console.warn('🎯 Submit button pressed');
    setIsLoading(true);
    const date = new Date().toLocaleDateString();
    const user = 'DefaultUser'; // This would be replaced with actual user session data

    const rowData = [
      date,
      user,
      total,
      ...denominations.map(d => counts[d.id] || 0)
    ];

    console.warn('📝 Prepared row data:', rowData);

    try {
      const result = await appendToSheet(rowData);
      console.warn('🎉 Submit result:', result);
      // Check for a successful response from the Apps Script
      if (result && result.data && result.data.success) {
        Alert.alert(
          'Success', 
          'Cash count successfully submitted to Google Sheets!',
          [
            { text: 'OK', onPress: () => setCounts({}) }
          ]
        );
      } else {
        // Handle cases where the script runs but returns a failure
        throw new Error(result.message || 'Submission failed. Please check the logs.');
      }
    } catch (error: any) {
      console.error('💥 Submit error:', error);
      Alert.alert('Error', error.message || 'There was an error submitting the count. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestConnection = async () => {
    console.warn('🧪 Test connection button pressed');
    setIsTesting(true);
    try {
      const success = await testConnection();
      console.warn('🧪 Test connection result:', success);
      Alert.alert(
        'Connection Test', 
        success ? '✅ Connection test successful!' : '❌ Connection test failed. Check console for details.'
      );
    } catch (error) {
      console.error('💥 Test connection error:', error);
      Alert.alert('Error', 'Connection test failed. Check console for details.');
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Cash Count</Text>
      
      {/* Implementation Status */}
      <View style={styles.statusContainer}>
        <Text style={styles.statusText}>
          🔗 Live Connection to Google Sheets
        </Text>
        <Text style={styles.statusSubtext}>
          Submissions will be added directly to your spreadsheet.
        </Text>
      </View>

      <View style={styles.list}>
        {denominations.map((item: Denomination) => (
          <DenominationInput
            key={item.id}
            denomination={item.id}
            value={item.value}
            imageUrl={item.imageUrl}
            onCountChange={handleCountChange}
          />
        ))}
      </View>
      <View style={styles.summaryContainer}>
        <Text style={styles.totalText}>Total:</Text>
        <Text style={styles.totalAmount}>{`$${total.toFixed(2)}`}</Text>
      </View>
      
      {/* Test Connection Button */}
      <View style={styles.buttonContainer}>
        <Button 
          title={isTesting ? 'Testing...' : 'Test Connection'} 
          onPress={handleTestConnection} 
          disabled={isTesting || isLoading}
          color="#666"
        />
      </View>
      
      <Button 
        title={isLoading ? 'Submitting...' : 'Submit Count'} 
        onPress={handleSubmit} 
        disabled={isLoading || isTesting} 
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
    textAlign: 'center',
    marginTop: 20,
  },
  statusContainer: {
    backgroundColor: '#e8f5e9',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#4caf50',
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2e7d32',
    marginBottom: 5,
  },
  statusSubtext: {
    fontSize: 14,
    color: '#424242',
  },
  list: {
    marginBottom: 20,
  },
  summaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
    backgroundColor: '#fff',
    borderRadius: 10,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  totalText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
  },
  totalAmount: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  buttonContainer: {
    marginBottom: 15,
  },
}); 