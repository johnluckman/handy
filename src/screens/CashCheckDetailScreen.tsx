import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, Image } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NavigationProps } from '../navigation/AppNavigator';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { calculateTotalDeposit } from '../utils/denominations';
import { updateCheckedFields } from '../services/googleSheets';

interface CashCheckDetailRouteParams {
  row: any;
}

const denominationImages: { [key: string]: any } = {
  '100': require('../assets/denominations/100.png'),
  '50': require('../assets/denominations/50.png'),
  '20': require('../assets/denominations/20.png'),
  '10': require('../assets/denominations/10.png'),
  '5': require('../assets/denominations/5.png'),
  '2': require('../assets/denominations/2.png'),
  '1': require('../assets/denominations/1.png'),
  '0.50': require('../assets/denominations/0.50.png'),
  '0.20': require('../assets/denominations/0.20.png'),
  '0.10': require('../assets/denominations/0.10.png'),
  '0.05': require('../assets/denominations/0.05.png'),
};

export default function CashCheckDetailScreen() {
  const navigation = useNavigation<NavigationProps>();
  const route = useRoute();
  const { row } = route.params as CashCheckDetailRouteParams;

  const totalDeposit = calculateTotalDeposit(row);
  const [loading, setLoading] = useState(false);

  const denominations = [
    { key: '100', label: '$100', depositKey: '100_Deposited', checkedKey: '100_Checked' },
    { key: '50', label: '$50', depositKey: '50_Deposited', checkedKey: '50_Checked' },
    { key: '20', label: '$20', depositKey: '20_Deposited', checkedKey: '20_Checked' },
    { key: '10', label: '$10', depositKey: '10_Deposited', checkedKey: '10_Checked' },
    { key: '5', label: '$5', depositKey: '5_Deposited', checkedKey: '5_Checked' },
    { key: '2', label: '$2', depositKey: '2_Deposited', checkedKey: '2_Checked' },
    { key: '1', label: '$1', depositKey: '1_Deposited', checkedKey: '1_Checked' },
    { key: '0.50', label: '50¢', depositKey: '0.50_Deposited', checkedKey: '0.50_Checked' },
    { key: '0.20', label: '20¢', depositKey: '0.20_Deposited', checkedKey: '0.20_Checked' },
    { key: '0.10', label: '10¢', depositKey: '0.10_Deposited', checkedKey: '0.10_Checked' },
    { key: '0.05', label: '5¢', depositKey: '0.05_Deposited', checkedKey: '0.05_Checked' },
  ];

  // Local state for checked values
  const [checked, setChecked] = useState<{ [key: string]: string }>(() => {
    const initial: { [key: string]: string } = {};
    denominations.forEach(d => {
      initial[d.key] = row[d.checkedKey] ? String(row[d.checkedKey]) : '';
    });
    return initial;
  });

  const handleCheckedChange = (key: string, value: string) => {
    setChecked(prev => ({ ...prev, [key]: value.replace(/[^0-9]/g, '') }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      // Calculate checked fields and totals
      const checkedFields: { [key: string]: number } = {};
      let totalChecked = 0;
      const denominationDefs = [
        { key: '100', value: 100 },
        { key: '50', value: 50 },
        { key: '20', value: 20 },
        { key: '10', value: 10 },
        { key: '5', value: 5 },
        { key: '2', value: 2 },
        { key: '1', value: 1 },
        { key: '0.50', value: 0.5 },
        { key: '0.20', value: 0.2 },
        { key: '0.10', value: 0.1 },
        { key: '0.05', value: 0.05 },
      ];
      denominationDefs.forEach(denom => {
        const val = Number(checked[denom.key] || 0);
        checkedFields[`${denom.key}_Checked`] = val;
        totalChecked += val * denom.value;
      });
      const discrepancy = totalChecked - totalDeposit;
      const updatedFields = {
        'Total Checked': totalChecked,
        'Discrepancy': discrepancy,
        ...checkedFields,
      };
      // Short log: only show time and updated field keys
      console.log('Submitting updateChecked:', row.Time, Object.keys(updatedFields));
      await updateCheckedFields(row.Time, updatedFields);
      Alert.alert('Success', 'Checked values updated!');
      navigation.goBack();
    } catch (e) {
      Alert.alert('Error', 'Failed to update checked values.');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: any) => {
    if (value === null || value === undefined || value === '') return '-';
    const num = parseFloat(value);
    return isNaN(num) ? '-' : `$${num.toFixed(2)}`;
  };

  const formatNumber = (value: any) => {
    if (value === null || value === undefined || value === '') return '-';
    const num = parseFloat(value);
    return isNaN(num) ? '-' : num.toString();
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-left" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Cash Check Detail</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content}>
        {/* Summary Section */}
        <View style={styles.summarySection}>
          <Text style={styles.sectionTitle}>Summary</Text>
          <View style={styles.summaryGrid}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Date</Text>
              <Text style={styles.summaryValue}>{row.Date || row.date || '-'}</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Time</Text>
              <Text style={styles.summaryValue}>{row.Time || row.time || '-'}</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>User</Text>
              <Text style={styles.summaryValue}>{row.User || row.user || '-'}</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Store</Text>
              <Text style={styles.summaryValue}>{row.Store || row.store || '-'}</Text>
            </View>
          </View>
        </View>

        {/* Totals Section */}
        <View style={styles.totalsSection}>
          <Text style={styles.sectionTitle}>Totals</Text>
          <View style={styles.totalsGrid}>
            <View style={styles.totalItem}>
              <Text style={styles.totalLabel}>Total Counted</Text>
              <Text style={styles.totalValue}>{formatCurrency(row.Total || row.total)}</Text>
            </View>
            <View style={styles.totalItem}>
              <Text style={styles.totalLabel}>Total Deposit</Text>
              <Text style={styles.totalValue}>{formatCurrency(totalDeposit)}</Text>
            </View>
            <View style={styles.totalItem}>
              <Text style={styles.totalLabel}>Total Checked</Text>
              <Text style={styles.totalValue}>{formatCurrency(row['Total Checked'] || row.totalChecked)}</Text>
            </View>
            <View style={styles.totalItem}>
              <Text style={[styles.totalLabel, styles.discrepancyLabel]}>Discrepancy</Text>
              <Text style={[styles.totalValue, styles.discrepancyValue]}>{formatCurrency(row.Discrepancy || row.discrepancy)}</Text>
            </View>
          </View>
        </View>

        {/* Denominations Section */}
        <View style={styles.denominationsSection}>
          <Text style={styles.sectionTitle}>Denomination Breakdown</Text>
          <View style={styles.denominationHeader}>
            <Text style={styles.denomHeaderLabelImg}></Text>
            <Text style={styles.denomHeaderLabel}>Denomination</Text>
            <Text style={styles.denomHeaderLabel}>Deposit</Text>
            <Text style={styles.denomHeaderLabel}>Checked</Text>
          </View>
          {denominations.map((denom) => (
            <View key={denom.key} style={styles.denominationRow}>
              <Image source={denominationImages[denom.key]} style={styles.denomImage} resizeMode="contain" />
              <Text style={styles.denomLabel}>{denom.label}</Text>
              <Text style={styles.denomValue}>{formatNumber(row[denom.depositKey])}</Text>
              <TextInput
                style={styles.checkedInput}
                value={checked[denom.key]}
                onChangeText={val => handleCheckedChange(denom.key, val)}
                keyboardType="numeric"
                placeholder="0"
                maxLength={4}
              />
            </View>
          ))}
        </View>

        {/* Notes Section */}
        {row.Notes && (
          <View style={styles.notesSection}>
            <Text style={styles.sectionTitle}>Notes</Text>
            <Text style={styles.notesText}>{row.Notes}</Text>
          </View>
        )}
        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit} disabled={loading}>
          <Text style={styles.submitButtonText}>{loading ? 'Submitting...' : 'Submit Checked Values'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  summarySection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  summaryItem: {
    width: '48%',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  totalsSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  totalsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  totalItem: {
    width: '48%',
    marginBottom: 16,
  },
  totalLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  discrepancyLabel: {
    color: '#d32f2f',
  },
  discrepancyValue: {
    color: '#d32f2f',
  },
  denominationsSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  denominationHeader: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    marginBottom: 8,
    alignItems: 'center',
  },
  denomHeaderLabelImg: {
    width: 36,
  },
  denomHeaderLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    textAlign: 'center',
  },
  denominationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#eee',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  denomImage: {
    width: 36,
    height: 36,
    marginRight: 8,
    resizeMode: 'contain',
  },
  denomLabel: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
    fontFamily: 'Inter-SemiBold',
  },
  denomValue: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
    fontFamily: 'Inter-Regular',
  },
  checkedInput: {
    flex: 1,
    fontSize: 16,
    color: '#007AFF',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    textAlign: 'center',
    backgroundColor: '#f9f9f9',
    marginHorizontal: 4,
    height: 36,
  },
  notesSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  notesText: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
  },
  submitButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 32,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
}); 