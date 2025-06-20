import React from 'react';
import { View, Text, TextInput, StyleSheet, Image } from 'react-native';
import { Denomination } from '../utils/denominations';

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
}

export default function DenominationRow({ denomination, rowData, onRowDataChange }: DenominationRowProps): React.ReactElement {
  const { id, value, imageUrl } = denomination;

  const handleInputChange = (field: keyof RowData, text: string) => {
    const newCount = parseInt(text, 10) || 0;
    const newRowData: RowData = { ...rowData, [field]: newCount };
    
    // Auto-calculate borrow amount
    if (field === 'actualCount' || field === 'targetFloat') {
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
          <Text style={styles.label}>Actual</Text>
          <TextInput
            style={styles.input}
            keyboardType="number-pad"
            value={rowData.actualCount.toString()}
            onChangeText={(text) => handleInputChange('actualCount', text)}
            placeholder="0"
          />
          <Text style={styles.valueText}>{`$${actualValue.toFixed(2)}`}</Text>
        </View>

        {/* Target Float */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>{`Target (${denomination.targetCount})`}</Text>
          <TextInput
            style={styles.input}
            keyboardType="number-pad"
            value={rowData.targetFloat.toString()}
            onChangeText={(text) => handleInputChange('targetFloat', text)}
            placeholder="0"
          />
          <Text style={styles.valueText}>{`$${targetValue.toFixed(2)}`}</Text>
        </View>

        {/* Borrow */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Borrow</Text>
          <TextInput
            style={[styles.input, styles.readOnlyInput]}
            keyboardType="number-pad"
            value={rowData.borrow.toString()}
            editable={false} // This is auto-calculated
          />
        </View>

        {/* Returned */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Returned</Text>
          <TextInput
            style={styles.input}
            keyboardType="number-pad"
            value={rowData.returned.toString()}
            onChangeText={(text) => handleInputChange('returned', text)}
            placeholder="0"
          />
        </View>

        {/* Still Owed */}
         <View style={styles.inputGroup}>
          <Text style={styles.label}>Owed</Text>
          <TextInput
            style={[styles.input, styles.readOnlyInput]}
            value={"0"} // Placeholder for future logic
            editable={false}
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
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
  label: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
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
    color: '#333',
  },
  valueText: {
    fontSize: 12,
    color: '#007AFF',
    marginTop: 4,
  },
}); 