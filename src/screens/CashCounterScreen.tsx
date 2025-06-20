import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Button, Alert, TextInput, ActivityIndicator } from 'react-native';
import NetInfo, { useNetInfo } from '@react-native-community/netinfo';
import DenominationRow, { RowData } from '../components/DenominationRow';
import { denominations, Denomination } from '../utils/denominations';
import { appendToSheet, testConnection, getInitialOwedData } from '../services/googleSheets';
import { addToQueue, getQueue, QueuedSubmission } from '../services/queueService';

// Defines the structure for our state, mapping each denomination ID to its RowData
interface DenominationData {
  [id: string]: RowData;
}

// Function to initialize the state from our denominations config
const initializeState = (): DenominationData => {
  const initialState: DenominationData = {};
  denominations.forEach(d => {
    initialState[d.id] = {
      actualCount: 0,
      targetFloat: d.targetCount,
      borrow: d.targetCount,
      returned: 0,
      owed: 0, // Initialize 'owed' to 0
    };
  });
  return initialState;
};

/**
 * @returns {React.ReactElement} The Cash Counter screen component.
 */
export default function CashCounterScreen(): React.ReactElement {
  const [data, setData] = React.useState<DenominationData>(initializeState);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isTesting, setIsTesting] = React.useState(false);
  const [userName, setUserName] = React.useState('');
  const [notes, setNotes] = React.useState('');
  const [queueSize, setQueueSize] = React.useState(0);
  const netInfo = useNetInfo();

  // Periodically check the queue size to update the UI
  useEffect(() => {
    const updateQueueSize = async () => {
      const queue = await getQueue();
      setQueueSize(queue.length);
    };
    
    updateQueueSize(); // Initial check
    const interval = setInterval(updateQueueSize, 3000); // Check every 3 seconds

    return () => clearInterval(interval);
  }, []);

  const handleRowDataChange = (id: string, newRowData: RowData) => {
    setData(prevData => ({
      ...prevData,
      [id]: newRowData,
    }));
  };

  const calculateTotal = () => {
    return denominations.reduce((total, item) => {
      const row = data[item.id];
      return total + (row.actualCount * item.value);
    }, 0);
  };
  
  const total = calculateTotal();

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

  const handleClearForm = () => {
    setData(initializeState());
    setUserName('');
    setNotes('');
  }

  const handleSubmit = async () => {
    setIsLoading(true);
    const date = new Date().toISOString();

    const flatData = denominations.flatMap(d => {
      const row = data[d.id];
      // We no longer send 'owed' from the app, the sheet calculates it.
      return [row.actualCount, row.targetFloat, row.borrow, row.returned]; 
    });

    const rowData = [ date, userName, notes, total, ...flatData ];

    try {
      await addToQueue(rowData);
      Alert.alert('Submission Saved', 'Your cash count has been saved and will be uploaded automatically when you are online.');
      handleClearForm(); // Reset the form after saving
    } catch (error: any) {
      Alert.alert('Error', 'There was an error saving your submission. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch initial owed data when the component mounts
  useEffect(() => {
    const fetchInitialData = async () => {
      console.log("Attempting to fetch initial owed data...");
      setIsLoading(true);
      const result = await getInitialOwedData();
      if (result.success && result.owedData) {
        console.log("Successfully fetched initial owed data:", result.owedData);
        // MERGE the fetched owedData into the main data state
        setData(prevData => {
            const updatedData = { ...prevData };
            for (const id in result.owedData) {
                if (updatedData[id]) {
                    updatedData[id] = { ...updatedData[id], owed: result.owedData[id] };
                }
            }
            console.log("Updated data state with initial owed values:", updatedData);
            return updatedData;
        });
      } else {
        console.error("Failed to fetch or parse initial data:", result.message);
        Alert.alert("Error", "Could not load initial data from the sheet. Please check your connection and try again.");
      }
      setIsLoading(false);
    };

    fetchInitialData();
  }, []);

  if (isLoading && !isTesting) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text>Loading from Sheet...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.statusContainer}>
        <Text style={[styles.statusText, { color: netInfo.isConnected ? 'green' : 'red' }]}>
          {netInfo.isConnected ? '● Online' : '● Offline'}
        </Text>
        {queueSize > 0 && (
          <Text style={styles.queueText}>
            {queueSize} item(s) waiting to sync
          </Text>
        )}
      </View>

      <Text style={styles.title}>Cash Count</Text>
      
      <View style={styles.userInputsContainer}>
        <TextInput
          style={styles.textInput}
          placeholder="Your Name"
          value={userName}
          onChangeText={setUserName}
        />
        <TextInput
          style={styles.textInput}
          placeholder="Add notes (e.g., End of Day Till 1)"
          value={notes}
          onChangeText={setNotes}
        />
      </View>
      
      <View style={styles.list}>
        {denominations.map((item: Denomination) => (
          <DenominationRow
            key={item.id}
            denomination={item}
            rowData={data[item.id]}
            onRowDataChange={handleRowDataChange}
          />
        ))}
      </View>
      
      <View style={styles.summaryContainer}>
        <Text style={styles.totalText}>Count Total:</Text>
        <Text style={styles.totalAmount}>{`$${total.toFixed(2)}`}</Text>
      </View>
      
      <View style={styles.buttonContainer}>
        <Button 
          title={isTesting ? 'Testing...' : 'Test Connection'} 
          onPress={handleTestConnection} 
          disabled={isTesting || isLoading}
          color="#888"
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
  statusContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#eee',
  },
  statusText: {
    fontWeight: 'bold',
  },
  queueText: {
    color: '#666',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
    textAlign: 'center',
    marginTop: 20,
  },
  userInputsContainer: {
    marginBottom: 15,
  },
  textInput: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 10,
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
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
}); 