import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { appendToSheet } from '../services/googleSheets';

const DENOMS = [
  { id: '50', label: '$50' },
  { id: '20', label: '$20' },
  { id: '10', label: '$10' },
  { id: '5', label: '$5' },
  { id: '2', label: '$2' },
  { id: '1', label: '$1' },
  { id: '0.50', label: '50c' },
  { id: '0.20', label: '20c' },
  { id: '0.10', label: '10c' },
  { id: '0.05', label: '5c' },
];

const STORES = ['Newtown', 'Paddington'];

export default function TopUpSection() {
  const [store, setStore] = useState(STORES[0]);
  const [values, setValues] = useState<{ [id: string]: string }>({});
  const [loading, setLoading] = useState(false);

  const handleChange = (id: string, val: string) => {
    setValues(v => ({ ...v, [id]: val.replace(/[^0-9]/g, '') }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const now = new Date();
      const pad = (n: number) => n.toString().padStart(2, '0');
      const date = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
      const time = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
      const user = 'admin'; // Or get from context if available
      const row: any = {
        Date: date,
        Time: time,
        User: user,
        Store: store,
        Notes: '',
        Total: '',
      };
      DENOMS.forEach(d => {
        row[`${d.id}_Topup`] = parseInt(values[d.id] || '0', 10);
      });
      await appendToSheet([row]);
      setValues({});
      Alert.alert('Success', 'Top-up logged successfully!');
    } catch (e) {
      Alert.alert('Error', 'Failed to log top-up.');
    } finally {
      setLoading(false);
    }
  };

  // 2 rows of 5 columns
  const denomRows = [
    DENOMS.slice(0, 5),
    DENOMS.slice(5, 10),
  ];

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <Text style={styles.topUpLabel}>Top Up</Text>
      <View style={styles.storeRow}>
        {STORES.map(s => (
          <TouchableOpacity
            key={s}
            style={[styles.storeBtn, store === s && styles.storeBtnActive]}
            onPress={() => setStore(s)}
          >
            <Text style={[styles.storeBtnText, store === s && styles.storeBtnTextActive]}>{s}</Text>
          </TouchableOpacity>
        ))}
        </View>
      </View>
      {/* Denomination grid */}
      <View style={styles.denomGrid}>
        {denomRows.map((row, rowIdx) => (
          <View key={rowIdx} style={styles.denomGridRow}>
            {row.map(d => (
              <View key={d.id} style={styles.denomGridCell}>
                <Text style={styles.denomGridLabel}>{d.label}</Text>
                <TextInput
                  style={styles.denomGridInput}
                  value={values[d.id] || ''}
                  onChangeText={val => handleChange(d.id, val)}
                  keyboardType="number-pad"
                  placeholder="0"
                  maxLength={4}
                  returnKeyType="done"
                />
              </View>
            ))}
          </View>
        ))}
      </View>
      <TouchableOpacity
        style={[styles.submitBtn, loading && { backgroundColor: '#ccc' }]}
        onPress={handleSubmit}
        disabled={loading}
      >
        <Text style={styles.submitBtnText}>{loading ? 'Submitting...' : 'Submit Top Up'}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    gap: 16,
  },
  topUpLabel: {
    fontSize: 22,
    fontWeight: '700',
    color: '#222',
    marginRight: 18,
  },
  storeRow: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'center',
  },
  storeBtn: {
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: 8,
    backgroundColor: '#eee',
    marginHorizontal: 6,
  },
  storeBtnActive: {
    backgroundColor: '#007AFF',
  },
  storeBtnText: {
    color: '#333',
    fontWeight: '500',
  },
  storeBtnTextActive: {
    color: '#fff',
  },
  denomGrid: {
    width: '100%',
    maxWidth: 420,
    marginBottom: 16,
    alignItems: 'center',
    backgroundColor: '#fafbfc',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  denomGridRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 16,
  },
  denomGridCell: {
    flex: 1,
    alignItems: 'center',
    minWidth: 60,
    maxWidth: 70,
    marginHorizontal: 4,
  },
  denomGridLabel: {
    fontSize: 16,
    color: '#222',
    fontWeight: '600',
    marginBottom: 6,
  },
  denomGridInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 8,
    fontSize: 16,
    width: 60,
    textAlign: 'center',
    backgroundColor: '#f9f9f9',
  },
  submitBtn: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 32,
    marginTop: 8,
  },
  submitBtnText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '500',
  },
}); 