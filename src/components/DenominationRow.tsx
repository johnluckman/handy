import React from 'react';
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
  targetFloat: number;
  borrow: number;
  returned: number;
  owed: number;
}

export default function DenominationRow({ denomination, rowData, onRowDataChange }: DenominationRowProps): React.ReactElement {
  const { id, value, imageUrl } = denomination;

  const handleInputChange = (field: keyof RowData, text: string) => {
    const newCount = parseInt(text, 10) || 0;
    const newRowData = { ...rowData, [field]: newCount };

    // Auto-calculate borrow amount ONLY if the user is not currently editing it.
    // This allows the user to override the calculation.
    if (field !== 'borrow') {
        const target = field === 'targetFloat' ? newCount : newRowData.targetFloat;
        const actual = field === 'actualCount' ? newCount : newRowData.actualCount;
        newRowData.borrow = Math.max(0, target - actual);
    }

    onRowDataChange(id, newRowData);
  };

  const actualValue = rowData.actualCount * value;
  const targetValue = rowData.targetFloat * value;

  return (
    <View style={styles.container}>
      {/* Denomination Info */}
      <View style={styles.denominationInfo}>
        <Image source={imageUrl} style={styles.image} />
        <Text style={styles.denominationLabel}>{`$${value.toFixed(2)}`}</Text>
      </View>

      {/* Input Fields */}
      <View style={styles.inputsContainer}>
        {/* Actual Count */}
        <View style={styles.inputGroup}>
          <View style={styles.labelContainer}>
            <Text style={styles.label}>Count</Text>
          </View>
          <TextInput
            style={styles.input}
            keyboardType="number-pad"
            value={rowData.actualCount.toString()}
            onChangeText={(text) => handleInputChange('actualCount', text)}
            placeholder="0"
            selectTextOnFocus={true}
          />
          <Text style={styles.valueText}>{`$${actualValue.toFixed(2)}`}</Text>
        </View>

        {/* Target Float */}
        <View style={styles.inputGroup}>
          <View style={styles.labelContainer}>
            <Text style={styles.label}>{`Float (${denomination.targetCount})`}</Text>
          </View>
          <TextInput
            style={[styles.input, denomination.value === 100 && styles.disabledInput]}
            keyboardType="number-pad"
            value={rowData.targetFloat.toString()}
            onChangeText={(text) => handleInputChange('targetFloat', text)}
            placeholder="0"
            editable={denomination.value !== 100}
            selectTextOnFocus={true}
          />
          <Text style={styles.valueText}>{`$${targetValue.toFixed(2)}`}</Text>
        </View>

        {/* Borrow */}
        <View style={styles.inputGroup}>
          <View style={styles.labelContainer}>
            <Icon name="safe" size={14} color="#666" style={styles.icon} />
            <Text style={styles.label}>Borrow</Text>
          </View>
          <TextInput
            style={[styles.input, denomination.value === 100 && styles.disabledInput]}
            keyboardType="number-pad"
            value={rowData.borrow.toString()}
            onChangeText={(text) => handleInputChange('borrow', text)}
            placeholder="0"
            editable={denomination.value !== 100}
            selectTextOnFocus={true}
          />
        </View>

        {/* Still Owed */}
        <View style={styles.inputGroup}>
          <View style={styles.labelContainer}>
            <Icon name="safe" size={14} color="#666" style={styles.icon} />
            <Text style={styles.label}>Owed</Text>
          </View>
          <TextInput
            style={[
              styles.input,
              styles.readOnlyInput,
              rowData.owed > 0 && styles.owedInput,
            ]}
            value={rowData.owed > 0 ? `-${rowData.owed}` : '0'}
            editable={false}
          />
        </View>

        {/* Returned */}
        <View style={styles.inputGroup}>
          <View style={styles.labelContainer}>
            <Icon name="safe" size={14} color="#666" style={styles.icon} />
            <Text style={styles.label}>Returned</Text>
          </View>
          <TextInput
            style={[styles.input, denomination.value === 100 && styles.disabledInput]}
            keyboardType="number-pad"
            value={rowData.returned.toString()}
            onChangeText={(text) => handleInputChange('returned', text)}
            placeholder="0"
            editable={denomination.value !== 100}
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
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  denominationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
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
    backgroundColor: '#f0f0f0',
    color: '#aaa',
  },
  owedInput: {
    backgroundColor: '#ffcdd2', // A light red background
    color: '#c62828', // A dark red text color
    fontWeight: 'bold',
  },
  disabledInput: {
    backgroundColor: '#f0f0f0',
    color: '#aaa',
  },
  valueText: {
    fontSize: 12,
    color: '#007AFF',
    marginTop: 4,
  },
}); 