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
  const { id, value, image } = denomination;
  const [borrowFieldTouched, setBorrowFieldTouched] = useState(false);
  const [floatFieldTouched, setFloatFieldTouched] = useState(false);
  const [countFieldTouched, setCountFieldTouched] = useState(false);
  const [returnedFieldTouched, setReturnedFieldTouched] = useState(false);

  const handleInputChange = (field: keyof RowData, text: string) => {
    const newCount = parseInt(text, 10) || 0;
    let newRowData = { ...rowData, [field]: newCount };

    if (field === 'actualCount') {
      setFloatFieldTouched(false); // Reset float suggestion if count changes
      // If count is cleared, clear all other fields
      if (!text || newCount === 0) {
        newRowData = {
          actualCount: 0,
          actualFloat: 0,
          borrow: 0,
          returned: 0,
          owed: 0,
        };
      } else {
        // If count is edited (not just cleared), clear float, borrow, and returned
        newRowData = {
          actualCount: newCount,
          actualFloat: 0,
          borrow: 0,
          returned: 0,
          owed: rowData.owed ?? 0,
        };
      }
    }

    if (field === 'actualFloat') {
      const target = denomination.targetFloat;
      const actual = newCount;
      newRowData.borrow = Math.max(0, target - actual);
      setBorrowFieldTouched(false); // Always reset to suggestion mode
      if (!text || newCount === 0) {
        setFloatFieldTouched(false); // Revert to suggestion mode if cleared
        newRowData.borrow = 0; // Also clear borrow if float is cleared
      } else {
        setFloatFieldTouched(true); // Mark float as touched
      }
    }

    if (field === 'returned') {
      if (!text || newCount === 0) {
        setReturnedFieldTouched(false); // Revert to suggestion mode if cleared
      } else {
        setReturnedFieldTouched(true); // Mark returned as touched
      }
    }

    onRowDataChange(id, newRowData);
  };

  const handleBorrowFocus = () => {
    if (!borrowFieldTouched) {
      setBorrowFieldTouched(true);
      // Fill the field with the current calculated value when first touched
      const target = denomination.targetFloat;
      const actual = rowData.actualFloat ?? 0;
      const calculatedBorrow = Math.max(0, target - actual);
      const newRowData = { ...rowData, borrow: calculatedBorrow };
      onRowDataChange(id, newRowData);
    }
  };

  const handleFloatFocus = () => {
    if (!floatFieldTouched) {
      setFloatFieldTouched(true);
      // Fill the field with the current suggested value when first touched
      const suggested = Math.min(rowData.actualCount ?? 0, denomination.targetFloat);
      const newRowData = { ...rowData, actualFloat: suggested };
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

  const actualValue = rowData.actualCount * value;
  const floatValue = (rowData.actualFloat ?? 0) * value;

  // Calculate the suggested borrow amount
  const target = denomination.targetFloat;
  const actual = rowData.actualFloat ?? 0;
  const borrow = rowData.borrow ?? 0;
  const count = rowData.actualCount ?? 0;
  const suggestedFloat = Math.min(count, target);
  const suggestedBorrow = Math.max(0, target - count);

  // Determine if float + borrow matches target
  const isFloatAndBorrowCorrect = Math.abs(actual + borrow - target) < 0.01;

  // Float suggestion logic (subtract suggestedBorrow)
  const floatDisplayValue = floatFieldTouched ? (rowData.actualFloat ?? 0).toString() : '';
  const floatPlaceholder = !floatFieldTouched ? suggestedFloat.toString() : '0';

  // Determine what to show in the borrow field
  const borrowDisplayValue = borrowFieldTouched ? (rowData.borrow ?? 0).toString() : '';
  const borrowPlaceholder = !borrowFieldTouched && suggestedBorrow > 0 ? suggestedBorrow.toString() : '0';

  // Only apply green if sum matches AND borrow field is not in suggestion mode
  const showGreen = isFloatAndBorrowCorrect && borrowFieldTouched;

  // Helper text logic (fully retroactive and robust)
  let helperText = '';
  const surplus = Math.max(0, count - actual);
  const owed = rowData.owed ?? 0;
  // 0. Review float if actualFloat > target or actualFloat > count
  if (actual > target || actual > count) {
    helperText = 'Review float amount';
  }
  // 1. Return to safe (if owed and surplus)
  else if (owed > 0 && surplus) {
    helperText = `Return ${owed} × $${value.toFixed(0)} to safe. Enter returned amount. Place the rest in today's takings bag ✅`;
  }
  // 1. Borrow (if borrow > 0)
  else if (borrow > 0) {
    helperText = `Take ${borrow} × $${value.toFixed(0)} from safe. Enter borrowed amount.`;
  }
  // 2. Check (if actualFloat + borrow === target)
  else if ((actual + borrow) === target) {
    if (count > actual) {
      helperText = `✅ Put remaining ${count - actual}× $${value.toFixed(0)} into today's bag.`;
    } else {
      helperText = '✅';
    }
  }
  // 3. Float (if count > 0 and actualFloat < target)
  else if (count > 0 && actual < target) {
    helperText = `Put ${target} × $${value.toFixed(0)} back into till. If you don't have enough, enter what you have.`;
  }
  // 4. Count (if count is 0 or empty)
  else {
    helperText = 'Count everything in the till';
  }

  // Count suggestion logic
  const countDisplayValue = countFieldTouched ? (rowData.actualCount ?? 0).toString() : '';
  const countPlaceholder = '0';

  // Returned suggestion logic
  const returnedSuggestion = (rowData.owed > 0 && surplus > 0) ? Math.min(rowData.owed, surplus) : 0;
  const returnedDisplayValue = returnedFieldTouched ? (rowData.returned ?? 0).toString() : '';
  const returnedPlaceholder = !returnedFieldTouched ? returnedSuggestion.toString() : '0';

  // Returned error logic
  const returnedError = rowData.returned > surplus && surplus > 0;

  return (
    <View style={styles.container}>
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
            style={[
              styles.input,
              !countFieldTouched && styles.suggestedBorrowInput,
            ]}
            keyboardType="number-pad"
            value={countDisplayValue}
            onChangeText={(text) => { setCountFieldTouched(true); handleInputChange('actualCount', text); }}
            onFocus={() => setCountFieldTouched(true)}
            placeholder={countPlaceholder}
            selectTextOnFocus={true}
          />
          <Text style={styles.valueText}>{`$${actualValue.toFixed(2)}`}</Text>
        </View>

        {/* Actual Float */}
        <View style={styles.inputGroup}>
          <View style={styles.labelContainer}>
            <Text style={styles.label}>{`Float (${denomination.targetFloat})`}</Text>
          </View>
          <TextInput
            style={
              (denomination.value === 100 || count === 0)
                ? [styles.input, styles.disabledInput]
                : [
                    styles.input,
                    (actual > target || actual > count) && styles.redInput,
                    denomination.value !== 100 && !floatFieldTouched && styles.suggestedBorrowInput,
                    showGreen && styles.greenInput,
                    (denomination.targetFloat === rowData.actualFloat) && styles.floatMatchInput,
                  ].filter(Boolean)
            }
            keyboardType="number-pad"
            value={floatDisplayValue}
            onChangeText={(text) => handleInputChange('actualFloat', text)}
            onFocus={denomination.value !== 100 && count > 0 ? handleFloatFocus : undefined}
            placeholder={floatPlaceholder}
            editable={denomination.value !== 100 && count > 0 ? true : false}
            selectTextOnFocus={denomination.value !== 100 && count > 0}
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
            style={
              (count === 0 || denomination.value === 100 || actual > target || actual > count)
                ? [styles.input, styles.disabledInput]
                : [
                    styles.input,
                    !borrowFieldTouched && suggestedBorrow > 0 && styles.suggestedBorrowInput,
                    showGreen && styles.greenInput,
                    (denomination.targetFloat === rowData.actualFloat) && styles.borrowDisabledInput,
                  ].filter(Boolean)
            }
            keyboardType="number-pad"
            value={borrowDisplayValue}
            onChangeText={(text) => handleInputChange('borrow', text)}
            onFocus={handleBorrowFocus}
            placeholder={borrowPlaceholder}
            editable={count > 0 && !(actual > target) && denomination.value !== 100 && denomination.targetFloat !== rowData.actualFloat}
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
              styles.readOnlyInput,
              (rowData.owed > 0) && styles.owedInput,
            ]}
            value={(rowData.owed ?? 0) > 0 ? `-${rowData.owed}` : '0'}
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
            style={[
              styles.input,
              returnedError && styles.redInput,
              !returnedFieldTouched && returnedSuggestion > 0 && styles.suggestedBorrowInput,
              denomination.value === 100 && styles.disabledInput,
              (rowData.owed === 0 || surplus <= 0) && styles.returnedDisabledInput,
              (rowData.returned === rowData.owed && rowData.owed > 0) && styles.greenInput,
            ]}
            keyboardType="number-pad"
            value={surplus > 0 ? returnedDisplayValue : '0'}
            onChangeText={(text) => handleInputChange('returned', text)}
            onFocus={handleReturnedFocus}
            placeholder={returnedPlaceholder}
            editable={surplus > 0 && denomination.value !== 100 && rowData.owed !== 0}
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
    height: 16, // Ensures consistent alignment
    marginBottom: 4,
  },
  icon: {
    // marginRight: 4, // Removed to bring icon and text closer
  },
  label: {
    fontSize: 12,
    color: '#666',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 8,
    textAlign: 'center',
    fontSize: 16,
    width: '100%',
  },
  readOnlyInput: {
    backgroundColor: '#d1d5db', // darker grey
    color: '#888', // darker text
  },
  owedInput: {
    backgroundColor: '#ffcdd2', // light red background
    color: '#c62828', // dark red text
    fontWeight: 'bold',
  },
  disabledInput: {
    backgroundColor: '#d1d5db', // darker grey
    color: '#888', // darker text
  },
  valueText: {
    fontSize: 12,
    color: '#007AFF',
    marginTop: 4,
  },
  floatMatchInput: {
    backgroundColor: '#a8e6c7', // lighter brand green
    borderColor: '#39b878', // brand green
  },
  borrowDisabledInput: {
    backgroundColor: '#d1d5db', // darker grey
    color: '#888',
  },
  returnedDisabledInput: {
    backgroundColor: '#d1d5db', // darker grey
    color: '#888',
  },
  suggestedBorrowInput: {
    backgroundColor: '#f8f8f8',
    color: '#999',
    fontStyle: 'italic',
    // Do NOT override fontSize, padding, borderRadius, etc.
  },
  greenInput: {
    backgroundColor: '#a8e6c7', // light green
    color: '#1b5e20', // dark green text
    borderColor: '#39b878',
    fontWeight: 'bold',
  },
  helperText: {
    fontSize: 13,
    color: '#007AFF',
    fontStyle: 'italic',
    marginBottom: 6,
    marginLeft: 2,
    marginRight: 2,
  },
  redInput: {
    backgroundColor: '#ffcdd2', // light red
    color: '#c62828', // dark red text
    borderColor: '#c62828',
    fontWeight: 'bold',
  },
}); 