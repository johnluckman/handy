import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Button, Alert, TextInput, ActivityIndicator, Platform, TouchableWithoutFeedback, Keyboard, TouchableOpacity } from 'react-native';
import NetInfo, { useNetInfo } from '@react-native-community/netinfo';
import { LinearGradient } from 'expo-linear-gradient';
import DenominationRow, { RowData } from '../components/DenominationRow';
import { denominations, Denomination } from '../utils/denominations';
import { appendToSheet, testConnection, getInitialOwedData } from '../services/googleSheets';
import { addToQueue } from '../services/queueService';
import { useQueue } from '../context/QueueContext'; // Corrected import path
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { NavigationProps } from '../navigation/AppNavigator';

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
  const navigation = useNavigation<NavigationProps>();
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
  
  const total = useMemo(() => {
    return calculateTotal();
  }, [data, calculateTotal]);

  const { totalTargetFloat, idealFloat, totalBorrowed, totalReturned } = useMemo(() => {
    const idealFloatCalc = denominations.reduce(
      (sum, deno) => sum + deno.targetCount * deno.value,
      0
    );

    let targetFloat = 0;
    let borrowed = 0;
    let returned = 0;

    for (const id in data) {
      const denomination = denominations.find(d => d.id === id);
      if (denomination) {
        targetFloat += (data[id].targetFloat || 0) * denomination.value;
        borrowed += (data[id].borrow || 0) * denomination.value;
        returned += (data[id].returned || 0) * denomination.value;
      }
    }

    return {
      totalTargetFloat: targetFloat,
      idealFloat: idealFloatCalc,
      totalBorrowed: borrowed,
      totalReturned: returned,
    };
  }, [data]);

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
        Alert.alert('Success', 'You cash count has been submitted!');
      } else {
        Alert.alert('Count Saved', 'Your count has been saved and will sync next time you are online.');
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
        <Text>Loading data...</Text>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <ScrollView
        style={{ flex: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        <LinearGradient
          colors={['#39b878', '#2E9A65']} // Your specified color fading to a darker shade
          style={styles.header}
        >
          <View style={styles.headerLeft}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => navigation.navigate('Dashboard')}
            >
              <Icon name="arrow-left" size={24} color="#ffffff" />
            </TouchableOpacity>
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
          <View style={styles.contentWrapper}>
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
                placeholder="Add comments"
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
              <View style={styles.summaryRow}>
                <Text style={styles.totalLabel}>Count Total:</Text>
                <Text style={styles.totalValue}>{`$${total.toFixed(2)}`}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>
                  Float total: {totalTargetFloat === idealFloat ? '✅' : '❌'}
                </Text>
                <Text style={styles.summaryValue}>{`$${totalTargetFloat.toFixed(2)} / $${idealFloat.toFixed(2)}`}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Borrowed Total:</Text>
                <Text style={styles.summaryValue}>{`$${totalBorrowed.toFixed(2)}`}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Returned Total:</Text>
                <Text style={styles.summaryValue}>{`$${totalReturned.toFixed(2)}`}</Text>
              </View>
            </View>

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.submitButton, (isLoading || isTesting) && styles.submitButtonDisabled]}
                onPress={handleSubmit}
                disabled={isLoading || isTesting}
              >
                <Text style={styles.submitButtonText}>
                  {isLoading ? 'Submitting...' : 'Submit Count'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#39b878',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 40,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginRight: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#ffffff',
  },
  contentWrapper: {
    backgroundColor: '#f5f5f5',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 60,
    marginTop: -20,
  },
  statusText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: '#ffffff',
  },
  queueText: {
    color: '#e0e0e0',
    fontSize: 12,
    fontFamily: 'Inter-Regular',
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
    fontFamily: 'Inter-Regular',
  },
  list: {
    marginBottom: 20,
  },
  summaryContainer: {
    paddingVertical: 15,
    paddingHorizontal: 20,
    marginBottom: 20,
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  totalLabel: {
    fontSize: 20,
    fontFamily: 'Inter-SemiBold',
    color: '#333',
  },
  totalValue: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#333',
  },
  summaryLabel: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#333',
  },
  summaryValue: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#333',
  },
  buttonContainer: {
    marginTop: 10,
  },
  submitButton: {
    backgroundColor: '#39b878',
    borderRadius: 50,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#a5d6a7',
  },
  submitButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    color: '#fff',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
}); 