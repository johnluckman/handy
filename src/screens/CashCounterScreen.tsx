import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, Button, Alert, TextInput, Platform, TouchableWithoutFeedback, Keyboard, TouchableOpacity, Modal, FlatList, Dimensions, Image, Pressable } from 'react-native';
import NetInfo, { useNetInfo } from '@react-native-community/netinfo';
import { LinearGradient } from 'expo-linear-gradient';
import DenominationRow, { RowData } from '../components/DenominationRow';
import { denominations, Denomination } from '../utils/denominations';
import { appendToSheet, fetchOwedData } from '../services/googleSheets';
import { addToQueue } from '../services/queueService';
import { useQueue } from '../context/QueueContext';
import { useAuth } from '../context/AuthContext';
import LoadingScreen from '../components/LoadingScreen';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';

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
      actualFloat: 0,
      borrow: 0,
      returned: 0,
      owed: 0, // Initialize 'owed' to 0
    };
  });
  return initialState;
};

// --- Instructions Data ---
// TODO: Replace placeholders with actual images.
const instructions = [
  {
    id: 1,
    title: 'Count Everything',
    description: 'Count all the cash in the till, including notes and coins.',
    image: require('../assets/instructions/cash-count-1.png'),
  },
  {
    id: 2,
    title: 'Enter Float Amounts',
    description: 'Enter how much of each denomination should stay in the till.',
    image: require('../assets/instructions/cash-count-2.png'),
  },
  {
    id: 3,
    title: 'Calculate Borrow/Return',
    description: 'The app will calculate if you need to borrow from or return to the safe.',
    image: require('../assets/instructions/cash-count-3.png'),
  },
  {
    id: 4,
    title: 'Submit Results',
    description: 'Review your counts and submit the results to the system.',
    image: require('../assets/instructions/cash-count-4.png'),
  },
];
const { width } = Dimensions.get('window');
// Match the modal's inner width (90% of screen width - 20 padding on each side)
const modalSlideWidth = width * 0.9 - 40;
// -------------------------

/**
 * @returns {React.ReactElement} The Cash Counter screen component.
 */
export default function CashCounterScreen(): React.ReactElement {
  const { user: userName, store } = useAuth();
  const navigation = useNavigation();
  const netInfo = useNetInfo();
  const [data, setData] = useState<DenominationData>(initializeState());
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isInstructionsVisible, setInstructionsVisible] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const queueContext = useQueue();
  const flatListRef = useRef<FlatList<any>>(null);

  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: Array<any> }) => {
    if (viewableItems.length > 0) {
      setActiveIndex(viewableItems[0].index || 0);
    }
  }).current;

  const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  const loadInitialData = useCallback(async () => {
    setIsLoading(true);
    try {
      // Create a fresh state object, which also clears any user input
      const newState = initializeState();
      setNotes('');

      const owedData = await fetchOwedData(store || undefined);
      if (owedData) {
        // Populate the new state object with the fetched data
        for (const id in owedData) {
          if (newState[id]) {
            newState[id].owed = owedData[id];
          }
        }
      }
      setData(newState);
    } catch (error) {
      console.error('Error loading initial data:', error);
      // Set default state even if network request fails
      setData(initializeState());
    } finally {
      setIsLoading(false);
    }
  }, [store]);

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

  const { totalActualFloat, idealFloat, totalBorrowed, totalReturned } = useMemo(() => {
    const idealFloatCalc = denominations.reduce(
      (sum, deno) => sum + deno.targetFloat * deno.value,
      0
    );

    let actualFloat = 0;
    let borrowed = 0;
    let returned = 0;

    for (const id in data) {
      const denomination = denominations.find(d => d.id === id);
      if (denomination) {
        actualFloat += ((data[id]?.actualFloat ?? 0) * denomination.value);
        borrowed += (data[id].borrow || 0) * denomination.value;
        returned += (data[id].returned || 0) * denomination.value;
      }
    }

    return {
      totalActualFloat: actualFloat,
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
    // Format date as yyyy-MM-dd HH:mm:ss (local time)
    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    const date = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;

    const flatData = denominations.flatMap(d => {
      const row = data[d.id];
      return [row.actualCount, row.actualFloat, row.borrow, row.returned];
    });

    // The Apps Script expects specific keys ('count', 'float') for the denomination data.
    // We need to transform the 'data' state object to match this structure.
    const transformedDenominations = Object.keys(data).reduce((acc, key) => {
      const original = data[key];
      acc[key] = {
        count: original.actualCount,
        float: original.actualFloat,
        borrow: original.borrow,
        returned: original.returned,
      };
      return acc;
    }, {} as { [id: string]: { count: number; float: number; borrow: number; returned: number } });

    const submissionData = {
      date: date,
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
      const result = await queueContext.processQueue(async (queue) => {
        return await appendToSheet(queue);
      });
      
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
        <LoadingScreen 
          size={80} 
          text="Loading data..."
          backgroundColor="transparent"
        />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <Modal
        animationType="fade"
        transparent={true}
        visible={isInstructionsVisible}
        onRequestClose={() => setInstructionsVisible(false)}
      >
        <View style={styles.modalContainer}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setInstructionsVisible(false)}
          />
          <View style={styles.modalContent}>
            <TouchableOpacity
              style={styles.closeIcon}
              onPress={() => setInstructionsVisible(false)}
            >
              <Icon name="close" size={24} color="#999" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>How to Use</Text>
            <View style={styles.sliderArea}>
              <FlatList
                ref={flatListRef}
                data={instructions}
                renderItem={({ item }) => (
                  <View style={styles.slide}>
                    <View style={styles.instructionImagePlaceholder}>
                      <Image source={item.image} style={styles.instructionImage} />
                    </View>
                    <Text style={styles.instructionText}>{item.description}</Text>
                  </View>
                )}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                keyExtractor={item => item.id.toString()}
                style={{ width: modalSlideWidth }}
                onViewableItemsChanged={onViewableItemsChanged}
                viewabilityConfig={viewabilityConfig}
              />
              <View style={styles.pagination}>
                {instructions.map((_, index) => (
                  <Pressable
                    key={index}
                    onPress={() => {
                      flatListRef.current?.scrollToIndex({ index, animated: true });
                    }}
                    style={[
                      styles.dot,
                      { backgroundColor: index === activeIndex ? '#39b878' : '#e0e0e0' },
                    ]}
                  />
                ))}
              </View>
            </View>
          </View>
        </View>
      </Modal>

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
              onPress={() => navigation.goBack()}
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
            <View style={styles.instructionsRow}>
              <TouchableOpacity
                style={styles.instructionsButton}
                onPress={() => setInstructionsVisible(true)}
              >
                <Icon name="help-circle-outline" size={20} color="#39b878" />
                <Text style={styles.instructionsButtonText}>Instructions</Text>
              </TouchableOpacity>
              <View style={styles.userStoreInfo}>
                <Icon name="account-outline" size={16} color="#888" />
                <Text style={styles.userStoreText}>{userName}</Text>
                <Icon name="storefront-outline" size={16} color="#888" style={{ marginLeft: 10 }} />
                <Text style={styles.userStoreText}>{store}</Text>
              </View>
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

            <View style={styles.userInputsContainer}>
              <TextInput
                style={styles.textInput}
                placeholder="Add notes (e.g., End of Day Till 1)"
                value={notes}
                onChangeText={setNotes}
              />
            </View>

            <View style={styles.summaryContainer}>
              <View style={styles.summaryRow}>
                <Text style={styles.totalLabel}>Count Total:</Text>
                <Text style={styles.totalValue}>{`$${total.toFixed(2)}`}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={[
                  styles.summaryLabel,
                  Math.abs((totalActualFloat + totalBorrowed) - idealFloat) < 0.01 && styles.summaryLabelGreen
                ]}>
                  Float + Borrowed: {Math.abs((totalActualFloat + totalBorrowed) - idealFloat) < 0.01 ? '✅' : '❌'}
                </Text>
                <Text style={[
                  styles.summaryValue,
                  Math.abs((totalActualFloat + totalBorrowed) - idealFloat) < 0.01 && styles.summaryValueGreen
                ]}>{`$${(totalActualFloat + totalBorrowed).toFixed(2)}/$${idealFloat.toFixed(2)}`}</Text>
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
                    <LoadingScreen 
                      size={20} 
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
  instructionsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingVertical: 4,
    paddingHorizontal: 8,
    marginBottom: 8,
    backgroundColor: '#e8f5e9',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#c8e6c9'
  },
  instructionsButtonText: {
    marginLeft: 6,
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#388e3c',
  },
  // --- Modal Styles ---
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  modalContent: {
    width: '90%',
    maxWidth: 400,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  closeIcon: {
    position: 'absolute',
    top: 15,
    right: 15,
    zIndex: 1,
  },
  modalTitle: {
    fontSize: 22,
    fontFamily: 'Inter-Bold',
    marginBottom: 15,
    color: '#333',
  },
  slide: {
    width: modalSlideWidth,
    alignItems: 'center',
  },
  instructionImagePlaceholder: {
    width: '100%',
    aspectRatio: 16/9,
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    marginBottom: 15,
    justifyContent: 'center',
    alignItems: 'center'
  },
  instructionImage: {
    width: '100%',
    height: '100%',
    borderRadius: 10,
  },
  instructionText: {
    fontSize: 16,
    textAlign: 'center',
    fontFamily: 'Inter-Regular',
    minHeight: 50,
    color: '#555',
  },
  pagination: {
    flexDirection: 'row',
    marginVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    height: 10,
    width: 10,
    borderRadius: 5,
    marginHorizontal: 8,
  },
  slideIndicator: {
    fontSize: 14,
    color: '#aaa',
    fontFamily: 'Inter-Regular',
    marginTop: 10,
    marginBottom: 20,
  },
  closeButton: {
    backgroundColor: '#39b878',
    borderRadius: 50,
    paddingVertical: 12,
    paddingHorizontal: 30,
    elevation: 2,
  },
  closeButtonText: {
    color: 'white',
    fontFamily: 'Inter-Bold',
    fontSize: 16,
  },
  sliderArea: {
    alignItems: 'center',
    width: modalSlideWidth,
  },
  instructionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 8,
  },
  userStoreInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 10,
    marginTop: -3,
  },
  userStoreText: {
    fontSize: 13,
    color: '#888',
    fontFamily: 'Inter-SemiBold',
    marginLeft: 4,
  },
  summaryLabelGreen: {
    color: '#39b878',
  },
  summaryValueGreen: {
    color: '#39b878',
  },
}); 