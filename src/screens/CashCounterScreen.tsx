import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Button, Alert, TextInput, ActivityIndicator, Platform, TouchableWithoutFeedback, Keyboard } from 'react-native';
import NetInfo, { useNetInfo } from '@react-native-community/netinfo';
import { LinearGradient } from 'expo-linear-gradient';
import DenominationRow, { RowData } from '../components/DenominationRow';
import { denominations, Denomination } from '../utils/denominations';
import { appendToSheet, testConnection, getInitialOwedData } from '../services/googleSheets';
import { addToQueue } from '../services/queueService';
import { useQueue } from '../context/QueueContext'; // Corrected import path

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
  const netInfo = useNetInfo();
  const queueContext = useQueue();

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
    setData(prevData => {
      const clearedData = { ...prevData };
      // Loop through each denomination in the state
      for (const id in clearedData) {
        // Keep the existing server-driven data ('owed' and 'targetFloat')
        // and only reset the user-input fields.
        clearedData[id] = {
          ...clearedData[id],
          actualCount: 0,
          returned: 0,
          // Automatically recalculate the borrow amount based on the cleared count
          borrow: Math.max(0, clearedData[id].targetFloat - 0),
        };
      }
      return clearedData;
    });
    // Also clear the general text inputs
    setUserName('');
    setNotes('');
  }

  const handleSubmit = async () => {
    setIsLoading(true);
    const date = new Date().toISOString();

    const flatData = denominations.flatMap(d => {
      const row = data[d.id];
      return [row.actualCount, row.targetFloat, row.borrow, row.returned];
    });

    const rowData = [ date, userName, notes, total, ...flatData ];

    try {
      // 1. Add to storage
      await addToQueue(rowData);
      
      // 2. Trigger the sync and get the result
      const syncResult = await queueContext.syncQueue();
      
      // 3. Update the UI with the new "Owed" data if the sync was successful
      if (syncResult.success && syncResult.owedData) {
        setData(prevData => {
            const updatedData = { ...prevData };
            for (const id in syncResult.owedData) {
                if (updatedData[id]) {
                    updatedData[id] = { ...updatedData[id], owed: syncResult.owedData[id] };
                }
            }
            return updatedData;
        });
        Alert.alert('Success', 'Submission synced successfully!');
      } else {
        Alert.alert('Submission Saved', 'Your count has been saved and will sync next time you are online.');
      }

      // 4. Clear the user-input parts of the form
      handleClearForm();

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

  const queueSize = queueContext.queue.length;

  if (isLoading && !isTesting) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text>Loading from Sheet...</Text>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <LinearGradient
        colors={['#39b878', '#2E9A65']} // Your specified color fading to a darker shade
        style={styles.header}
      >
        <View style={styles.headerLeft}>
          <View style={styles.logoPlaceholder} />
          <Text style={styles.headerTitle}>Cash Counter</Text>
        </View>
        <View style={styles.headerRight}>
          <Text style={styles.statusText}>
            <Text style={{ color: netInfo.isConnected ? '#dcedc8' : '#ffcdd2' }}>● </Text>
            {netInfo.isConnected ? 'Online' : 'Offline'}
          </Text>
          {queueSize > 0 && (
            <Text style={styles.queueText}>
              {queueSize} pending
            </Text>
          )}
        </View>
      </LinearGradient>

      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.contentContainer}
          keyboardShouldPersistTaps="handled"
        >
          {/* <Text style={styles.title}>Cash Count</Text> */}

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

          <Button
            title={isLoading ? 'Submitting...' : 'Submit Count'}
            onPress={handleSubmit}
            disabled={isLoading || isTesting}
          />
        </ScrollView>
      </TouchableWithoutFeedback>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#f5f5f5', // The main background is now the card color
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between', // Pushes left and right sides apart
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerRight: {
    alignItems: 'flex-end', // Aligns status text to the right
  },
  logoPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginRight: 15,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  container: {
    flex: 1,
    // The container no longer needs a background color, as the screen provides it
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 60,
  },
  statusText: {
    fontWeight: 'bold',
    fontSize: 14,
    color: '#ffffff', // White text for better contrast on the gradient
  },
  queueText: {
    color: '#e0e0e0', // A slightly dimmer white for the sub-text
    fontSize: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
    textAlign: 'center',
    marginTop: 10,
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