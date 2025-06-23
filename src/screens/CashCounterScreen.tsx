import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Button, Alert, TextInput, Platform, TouchableWithoutFeedback, Keyboard, TouchableOpacity } from 'react-native';
import NetInfo, { useNetInfo } from '@react-native-community/netinfo';
import { LinearGradient } from 'expo-linear-gradient';
import DenominationRow, { RowData } from '../components/DenominationRow';
import { denominations, Denomination } from '../utils/denominations';
import { appendToSheet, fetchOwedData } from '../services/googleSheets';
import { addToQueue } from '../services/queueService';
import { useQueue } from '../context/QueueContext'; // Corrected import path
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { NavigationProps } from '../navigation/AppNavigator';
import { useAuth } from '../context/AuthContext'; // Import useAuth
import WavingHandLoader from '../components/WavingHandLoader';

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
  const { user: userName, store } = useAuth();
  const navigation = useNavigation<NavigationProps>();
  const netInfo = useNetInfo();
  const [data, setData] = useState<DenominationData>(initializeState());
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const queueContext = useQueue();

  const loadInitialData = useCallback(async () => {
    setIsLoading(true);
    // Create a fresh state object, which also clears any user input
    const newState = initializeState();
    setNotes('');

    const owedData = await fetchOwedData();
    if (owedData) {
      // Populate the new state object with the fetched data
      for (const id in owedData) {
        if (newState[id]) {
          newState[id].owed = owedData[id];
        }
      }
    }
    setData(newState);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

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

  const handleClearForm = () => {
    setData(initializeState());
    setNotes('');
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    const date = new Date().toISOString();

    const flatData = denominations.flatMap(d => {
      const row = data[d.id];
      return [row.actualCount, row.targetFloat, row.borrow, row.returned];
    });

    // The Apps Script expects specific keys ('count', 'float') for the denomination data.
    // We need to transform the 'data' state object to match this structure.
    const transformedDenominations = Object.keys(data).reduce((acc, key) => {
      const original = data[key];
      acc[key] = {
        count: original.actualCount,
        float: original.targetFloat,
        borrow: original.borrow,
        returned: original.returned,
      };
      return acc;
    }, {} as { [id: string]: { count: number; float: number; borrow: number; returned: number } });

    const submissionData = {
      date: new Date().toISOString(),
      user: userName,
      store: store,
      notes: notes,
      total: total,
      denominations: transformedDenominations,
    };

    try {
      // 1. Add to storage
      await addToQueue(submissionData);
      
      // 2. Trigger the sync and get the result
      const result = await queueContext.processQueue();
      
      // 3. Handle the result
      if (result.success) {
        Alert.alert('Success', `Successfully submitted ${result.batchSize > 1 ? `${result.batchSize} records` : '1 record'}.`);
        await loadInitialData(); // Reload data instead of just clearing the form
      } else {
        // The item is already in the queue, so we just notify the user.
        Alert.alert('Offline', `Your data is saved offline and will be submitted later. ${result.message}`);
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred while trying to submit your data.');
      console.error('Submission failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const queueSize = queueContext.queue.length;

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <WavingHandLoader 
          size={80} 
          color="#39b878" 
          text="Loading data..."
          textColor="#ffffff"
          backgroundColor="transparent"
        />
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
                style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
                onPress={handleSubmit}
                disabled={isLoading}
              >
                {isLoading ? (
                  <View style={styles.submitButtonContent}>
                    <WavingHandLoader 
                      size={20} 
                      color="#ffffff" 
                      compact={true}
                    />
                    <Text style={styles.submitButtonText}>Submitting...</Text>
                  </View>
                ) : (
                  <Text style={styles.submitButtonText}>Submit Count</Text>
                )}
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
  submitButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#ffffff',
    marginTop: 20,
  },
}); 