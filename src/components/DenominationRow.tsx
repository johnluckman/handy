import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Image } from 'react-native';
import { Denomination } from '../utils/denominations';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

interface DenominationRowProps {
  denomination: Denomination;
  rowData: RowData;
  onRowDataChange: (id: string, newRowData: RowData) => void;
}

export interface RowData {
  actualCount: number;
  actualFloat: number;
  borrow: number;
  returned: number;
  owed: number;
}

export default function DenominationRow({ denomination, rowData, onRowDataChange }: DenominationRowProps): React.ReactElement {
  const { id, value, image, targetFloat } = denomination;
  
  // Field touch states
  const [borrowFieldTouched, setBorrowFieldTouched] = useState(false);
  const [floatFieldTouched, setFloatFieldTouched] = useState(false);
  const [countFieldTouched, setCountFieldTouched] = useState(false);
  const [returnedFieldTouched, setReturnedFieldTouched] = useState(false);

  // Extracted values for cleaner code
  const count = rowData.actualCount ?? 0;
  const actual = rowData.actualFloat ?? 0;
  const borrow = rowData.borrow ?? 0;
  const owed = rowData.owed ?? 0;
  const returned = rowData.returned ?? 0;

  // Calculated values
  const actualValue = count * value;
  const floatValue = actual * value;
  const surplus = Math.max(0, count - actual);
  const suggestedFloat = Math.min(count, targetFloat);
  const suggestedBorrow = Math.max(0, targetFloat - count);
  const returnedSuggestion = (owed > 0 && surplus > 0) ? Math.min(owed, surplus) : 0;
  const isFloatAndBorrowCorrect = Math.abs(actual + borrow - targetFloat) < 0.01;
  const showGreen = isFloatAndBorrowCorrect && borrowFieldTouched && (count > 0 || (count === 0 && borrow === targetFloat && countFieldTouched));

  // Helper functions
  const resetToUntouched = () => {
    return {
      actualCount: 0,
      actualFloat: 0,
      borrow: 0,
      returned: 0,
      owed: owed,
    };
  };

  const clearOtherFields = (newCount: number) => {
    return {
      actualCount: newCount,
      actualFloat: 0,
      borrow: 0,
      returned: 0,
      owed: owed,
    };
  };

  const handleInputChange = (field: keyof RowData, text: string) => {
    const newCount = parseInt(text, 10) || 0;
    let newRowData = { ...rowData, [field]: newCount };

    if (field === 'actualCount') {
      setFloatFieldTouched(false);
      if (!text) {
        newRowData = resetToUntouched();
      } else {
        newRowData = clearOtherFields(newCount);
        // If count is 0 and user has touched the field, set borrow to target float
        if (newCount === 0) {
          newRowData.borrow = targetFloat;
        }
      }
    }

    if (field === 'actualFloat') {
      const calculatedBorrow = count === 0 ? targetFloat : Math.max(0, targetFloat - newCount);
      newRowData.borrow = calculatedBorrow;
      setBorrowFieldTouched(false);
      
      if (!text || newCount === 0) {
        setFloatFieldTouched(false);
        setReturnedFieldTouched(false);
        newRowData.borrow = count === 0 ? targetFloat : 0;
        newRowData.returned = 0;
      } else {
        setFloatFieldTouched(true);
      }
    }

    if (field === 'returned') {
      if (!text || newCount === 0) {
        setReturnedFieldTouched(false);
      } else {
        setReturnedFieldTouched(true);
      }
    }

    onRowDataChange(id, newRowData);
  };

  const handleBorrowFocus = () => {
    if (!borrowFieldTouched) {
      setBorrowFieldTouched(true);
      const calculatedBorrow = (count === 0 && countFieldTouched) ? targetFloat : Math.max(0, targetFloat - actual);
      const newRowData = { ...rowData, borrow: calculatedBorrow };
      onRowDataChange(id, newRowData);
    }
  };

  const handleFloatFocus = () => {
    if (!floatFieldTouched) {
      setFloatFieldTouched(true);
      const newRowData = { ...rowData, actualFloat: suggestedFloat };
      onRowDataChange(id, newRowData);
    }
  };

  const handleReturnedFocus = () => {
    if (!returnedFieldTouched && returnedSuggestion > 0) {
      setReturnedFieldTouched(true);
      const newRowData = { ...rowData, returned: returnedSuggestion };
      onRowDataChange(id, newRowData);
    }
  };

  // Helper text logic
  const getHelperText = (): string => {
    // 0. Review float if actualFloat > target or actualFloat > count
    if (actual > targetFloat || actual > count) {
      return 'Review float amount — it looks too high.';
    }
    
    // 0.5. Check if returned amount exceeds owed amount
    if (returned > owed && owed > 0) {
      return "You've returned too much. You can't return more than what's owed.";
    }
    
    // 1. Return to safe (if owed and surplus)
    if (owed > 0 && surplus) {
      if (actual >= targetFloat) {
        if (returned > 0) {
          if (returned === owed) {
            const remainingSurplus = surplus - returned;
            if (remainingSurplus > 0) {
              return `✅ Returned ${returned}× $${value.toFixed(2)} to safe. Put remaining ${remainingSurplus}× $${value.toFixed(2)} into today's bag.`;
            } else {
              return `✅ Returned ${returned}× $${value.toFixed(2)} to safe.`;
            }
          } else if (returned === surplus) {
            return `✅ Returned ${surplus}× $${value.toFixed(2)} to safe.`;
          } else if (returned < Math.min(owed, surplus)) {
            return "Still more to return — Check the amount.";
          } else if (returned > surplus) {
            return "Returned amount is too high — Please check.";
          }
        } else {
          return `Return ${Math.min(owed, surplus)}× $${value.toFixed(2)} to safe. Enter returned amount.`;
        }
      } else {
        if (count < targetFloat) {
          return `Not enough for the float. Enter what you have (${count} × $${value.toFixed(0)}). Borrow the rest from the safe.`;
        } else {
          return `Put ${targetFloat} × $${value.toFixed(0)} back into till.`;
        }
      }
    }
    
    // 2. Borrow (if borrow > 0)
    if (borrow > 0) {
      return `✅ You've borrowed ${borrow}× $${value.toFixed(0)} to complete the float.`;
    }
    
    // 3. Check (if actualFloat + borrow === target AND count > 0)
    if ((actual + borrow) === targetFloat && count > 0) {
      if (count > actual) {
        return `✅ Put the remaining ${count - actual}× $${value.toFixed(0)} into today's bag.`;
      } else {
        return '✅ All done!';
      }
    }
    
    // 4. Count is 0 - need to borrow full target float
    if (count === 0) {
      if (borrow === targetFloat) {
        return `✅ Borrowed ${targetFloat}× $${value.toFixed(0)} from safe for float.`;
      } else {
        return `No ${value.toFixed(2)} notes in till. Borrow ${targetFloat}× $${value.toFixed(0)} from safe.`;
      }
    }
    
    // 5. Borrow needed (if float entered but less than target, and borrow is 0)
    if (count > 0 && actual < targetFloat && borrow === 0 && actual > 0) {
      return `You're short by ${targetFloat - actual}× $${value.toFixed(0)}. Borrow from the safe and enter amount below.`;
    }
    
    // 6. Float (if count > 0 and actualFloat < target)
    if (count > 0 && actual < targetFloat) {
      if (count < targetFloat) {
        return `Not enough for float. Put ${count}× $${value.toFixed(0)} back into the till. Borrow the rest from the safe.`;
      } else {
        return `Put ${targetFloat} × $${value.toFixed(0)} back into till.`;
      }
    }
    
    // 7. Count (if count is 0 or empty)
    return 'Count everything in the till to start.';
  };

  // Display values and placeholders
  const countDisplayValue = countFieldTouched ? count.toString() : '';
  const countPlaceholder = '-';
  
  const floatDisplayValue = floatFieldTouched ? actual.toString() : '';
  const floatPlaceholder = !floatFieldTouched ? suggestedFloat.toString() : '0';
  
  const borrowDisplayValue = borrowFieldTouched ? borrow.toString() : '';
  const borrowPlaceholder = !borrowFieldTouched && suggestedBorrow > 0 ? suggestedBorrow.toString() : '0';
  
  const returnedDisplayValue = returnedFieldTouched ? returned.toString() : '';
  const returnedPlaceholder = !returnedFieldTouched ? returnedSuggestion.toString() : '0';

  // Computed values
  const helperText = getHelperText();
  const isFinalStep = helperText.includes('✅') && (count > 0 || (count === 0 && countFieldTouched));
  const returnedError = returned > surplus || (returned > owed && owed > 0) || (returned > 0 && returned < Math.min(owed, surplus) && owed > 0);
  const isDisabled = denomination.value === 100;
  const isFloatMatch = denomination.targetFloat === actual;

  // Input styles
  const getCountInputStyle = () => [
    styles.input,
    !countFieldTouched && styles.suggestedBorrowInput,
    countFieldTouched && (count > 0 || (count === 0 && borrow === targetFloat && countFieldTouched)) && styles.greenInput,
  ];

  const getFloatInputStyle = () => {
    if (isDisabled || count === 0) {
      return [styles.input, styles.disabledInput];
    }
    
    return [
      styles.input,
      (actual > targetFloat || actual > count) && styles.redInput,
      !isDisabled && !floatFieldTouched && styles.suggestedBorrowInput,
      showGreen && styles.greenInput,
      isFloatMatch && styles.floatMatchInput,
    ].filter(Boolean);
  };

  const getBorrowInputStyle = () => {
    const shouldDisable = isDisabled || actual > targetFloat || actual > count || (count > 0 && !(actual > 0)) || (count === 0 && !countFieldTouched);
    
    if (shouldDisable) {
      return [styles.input, styles.disabledInput];
    }
    
    return [
      styles.input,
      !borrowFieldTouched && suggestedBorrow > 0 && styles.suggestedBorrowInput,
      showGreen && styles.greenInput,
      isFloatMatch && styles.disabledInput,
    ].filter(Boolean);
  };

  const getReturnedInputStyle = () => [
    styles.input,
    returnedError && styles.redInput,
    !returnedFieldTouched && returnedSuggestion > 0 && styles.suggestedBorrowInput,
    !isReturnedEditable && styles.disabledInput,
    !returnedError && ((returned === owed && owed > 0) || (returned === surplus && surplus > 0 && owed > 0)) && styles.greenInput,
  ];

  const isBorrowEditable = (count > 0 || (count === 0 && countFieldTouched)) && !(actual > targetFloat) && !isDisabled && !isFloatMatch && (count === 0 || actual > 0);
  const isReturnedEditable = surplus > 0 && !isDisabled && owed !== 0 && actual >= targetFloat;

  return (
    <View style={[
      styles.container,
      isFinalStep && styles.successContainer
    ]}>
      {/* Denomination Info */}
      <View style={styles.denominationInfo}>
        <Image source={image} style={styles.image} />
        <Text style={styles.denominationLabel}>{`$${value.toFixed(2)}`}</Text>
      </View>

      {/* Dynamic Helper Text */}
      {helperText ? (
        <Text style={styles.helperText}>{helperText}</Text>
      ) : null}

      {/* Input Fields */}
      <View style={styles.inputsContainer}>
        {/* Actual Count */}
        <View style={styles.inputGroup}>
          <View style={styles.labelContainer}>
            <Text style={styles.label}>Count</Text>
          </View>
          <TextInput
            style={getCountInputStyle()}
            keyboardType="number-pad"
            value={countDisplayValue}
            onChangeText={(text) => {
              if (!text || text === '0') {
                setCountFieldTouched(false);
              } else {
                setCountFieldTouched(true);
              }
              handleInputChange('actualCount', text);
            }}
            onFocus={() => setCountFieldTouched(true)}
            placeholder={countPlaceholder}
            selectTextOnFocus={true}
          />
          <Text style={styles.valueText}>{`$${actualValue.toFixed(2)}`}</Text>
        </View>

        {/* Actual Float */}
        <View style={styles.inputGroup}>
          <View style={styles.labelContainer}>
            <Text style={styles.label}>{`Float (${targetFloat})`}</Text>
          </View>
          <TextInput
            style={getFloatInputStyle()}
            keyboardType="number-pad"
            value={floatDisplayValue}
            onChangeText={(text) => handleInputChange('actualFloat', text)}
            onFocus={!isDisabled && count > 0 ? handleFloatFocus : undefined}
            placeholder={floatPlaceholder}
            editable={!isDisabled && count > 0}
            selectTextOnFocus={!isDisabled && count > 0}
          />
          <Text style={styles.valueText}>{`$${floatValue.toFixed(2)}`}</Text>
        </View>

        {/* Borrow */}
        <View style={styles.inputGroup}>
          <View style={styles.labelContainer}>
            <Icon name="safe" size={14} color="#666" style={styles.icon} />
            <Text style={styles.label}>Borrow</Text>
          </View>
          <TextInput
            style={getBorrowInputStyle()}
            keyboardType="number-pad"
            value={borrowDisplayValue}
            onChangeText={(text) => {
              if (!text || text === '0') {
                setBorrowFieldTouched(false);
              } else {
                setBorrowFieldTouched(true);
              }
              handleInputChange('borrow', text);
            }}
            onFocus={handleBorrowFocus}
            placeholder={borrowPlaceholder}
            editable={isBorrowEditable}
            selectTextOnFocus={true}
          />
        </View>

        {/* Owed */}
        <View style={styles.inputGroup}>
          <View style={styles.labelContainer}>
            <Icon name="safe" size={14} color="#666" style={styles.icon} />
            <Text style={styles.label}>Owed</Text>
          </View>
          <TextInput
            style={[
              styles.input,
              styles.disabledInput,
              (owed > 0) && styles.owedInput,
            ]}
            value={owed > 0 ? `-${owed}` : '0'}
            editable={false}
          />
        </View>

        {/* Returned */}
        <View style={styles.inputGroup}>
          <View style={styles.labelContainer}>
            <Icon name="safe" size={14} color="#666" style={styles.icon} />
            <Text style={styles.label}>Return</Text>
          </View>
          <TextInput
            style={getReturnedInputStyle()}
            keyboardType="number-pad"
            value={surplus > 0 ? returnedDisplayValue : '0'}
            onChangeText={(text) => handleInputChange('returned', text)}
            onFocus={handleReturnedFocus}
            placeholder={returnedPlaceholder}
            editable={isReturnedEditable}
            selectTextOnFocus={true}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
  },
  denominationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    paddingBottom: 10,
  },
  image: {
    width: 60,
    height: 30,
    resizeMode: 'contain',
    marginRight: 10,
  },
  denominationLabel: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  inputsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  inputGroup: {
    alignItems: 'center',
    minWidth: '18%',
    marginBottom: 5,
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 16,
    marginBottom: 4,
  },
  icon: {
    // Empty - icon styling handled by react-native-vector-icons
  },
  label: {
    fontSize: 12,
    color: '#666',
  },
  input: {
    borderWidth: 0.5,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 8,
    textAlign: 'center',
    fontSize: 16,
    width: '100%',
  },
  valueText: {
    fontSize: 12,
    color: '#007AFF',
    marginTop: 4,
  },
  helperText: {
    fontSize: 13,
    color: '#001D00',
    fontStyle: 'italic',
    marginBottom: 6,
    marginHorizontal: 2,
  },
  successContainer: {
    backgroundColor: '#d4edda',
  },
  
  // Input state styles
  disabledInput: {
    backgroundColor: '#d1d5db',
    color: '#888',
  },
  suggestedBorrowInput: {
    backgroundColor: '#f8f8f8',
    color: '#999',
    fontStyle: 'italic',
  },
  
  // Color-coded input styles
  redInput: {
    backgroundColor: '#ffcdd2',
    color: '#c62828',
    borderColor: '#c62828',
    fontWeight: 'bold',
  },
  greenInput: {
    backgroundColor: '#a8e6c7',
    color: '#1b5e20',
    borderColor: '#39b878',
    fontWeight: 'bold',
  },
  owedInput: {
    backgroundColor: '#ffcdd2',
    color: '#c62828',
    fontWeight: 'bold',
  },
  floatMatchInput: {
    backgroundColor: '#a8e6c7',
    borderColor: '#39b878',
  },
}); 