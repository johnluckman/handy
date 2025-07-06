import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NavigationProps } from '../navigation/AppNavigator';
import { fetchLogSheet } from '../services/googleSheets';
import { calculateTotalDeposit } from '../utils/denominations';

const TABS = ['Newtown', 'Paddington'];

function formatDate(dateString: string | undefined) {
  if (!dateString) return '-';
  const d = new Date(dateString);
  if (!isNaN(d.getTime())) {
    return d.toLocaleDateString('en-AU', { day: 'numeric', month: 'short' });
  }
  // fallback: try to extract YYYY-MM-DD and format
  const match = dateString.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (match) {
    const [_, year, month, day] = match;
    const dt = new Date(`${year}-${month}-${day}`);
    return dt.toLocaleDateString('en-AU', { day: 'numeric', month: 'short' });
  }
  return dateString;
}

function formatDay(dateString: string | undefined) {
  if (!dateString) return '-';
  const d = new Date(dateString);
  if (!isNaN(d.getTime())) {
    return d.toLocaleDateString('en-AU', { weekday: 'short' });
  }
  // fallback: try to extract YYYY-MM-DD and format
  const match = dateString.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (match) {
    const [_, year, month, day] = match;
    const dt = new Date(`${year}-${month}-${day}`);
    return dt.toLocaleDateString('en-AU', { weekday: 'short' });
  }
  return '';
}

export default function CashCheckScreen() {
  const navigation = useNavigation<NavigationProps>();
  const [selectedStore, setSelectedStore] = useState<'Newtown' | 'Paddington'>('Newtown');
  const [logRows, setLogRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);
    fetchLogSheet(selectedStore)
      .then(rows => {
        if (isMounted) setLogRows(rows);
      })
      .catch(err => {
        if (isMounted) setError('Failed to load data');
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });
    return () => { isMounted = false; };
  }, [selectedStore]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Cash Check</Text>
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, selectedStore === 'Newtown' && styles.tabSelected]}
          onPress={() => setSelectedStore('Newtown')}
        >
          <Text style={selectedStore === 'Newtown' ? styles.tabTextSelected : styles.tabText}>Newtown</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, selectedStore === 'Paddington' && styles.tabSelected]}
          onPress={() => setSelectedStore('Paddington')}
        >
          <Text style={selectedStore === 'Paddington' ? styles.tabTextSelected : styles.tabText}>Paddington</Text>
        </TouchableOpacity>
      </View>
      {loading ? (
        <Text style={styles.loadingText}>Loading...</Text>
      ) : error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : (
        <ScrollView style={styles.scrollView}>
          {logRows.map((row, idx) => {
            const checked = Number(row['Total Checked'] || row.totalChecked || 0);
            const totalDeposit = calculateTotalDeposit(row);
            const discrepancy = checked - totalDeposit;
            let discrepancyColor = '#888';
            if (discrepancy > 0) discrepancyColor = '#2e7d32';
            else if (discrepancy < 0) discrepancyColor = '#c62828';
            return (
              <TouchableOpacity
                key={row.id || idx}
                style={styles.cardRow}
                onPress={() => navigation.navigate('CashCheckDetail', { row })}
              >
                <View style={styles.cardLeft}>
                  <Text style={styles.cardDate}>{formatDate(row.Date || row.date)}</Text>
                  <Text style={styles.cardDay}>{formatDay(row.Date || row.date)}</Text>
                </View>
                <View style={styles.cardCenter}>
                  <Text style={styles.cardCheckedDeposited}>{`[$${checked.toFixed(2)} / $${totalDeposit.toFixed(2)}]`}</Text>
                </View>
                <View style={styles.cardRight}>
                  <Text style={[styles.cardDiscrepancy, { color: discrepancyColor }]}> 
                    {discrepancy > 0 ? `+${discrepancy}` : discrepancy < 0 ? `${discrepancy}` : '0'}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
    textAlign: 'center',
  },
  tabContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
  },
  loadingText: {
    textAlign: 'center',
    marginTop: 24,
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
    marginTop: 24,
    fontSize: 16,
  },
  scrollView: {
    flex: 1,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 18,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  cardLeft: {
    flex: 1.2,
    alignItems: 'flex-start',
  },
  cardDate: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  cardDay: {
    fontSize: 14,
    color: '#888',
    marginTop: 2,
  },
  cardCenter: {
    flex: 1.5,
    alignItems: 'center',
  },
  cardCheckedDeposited: {
    fontSize: 18,
    fontWeight: '500',
    color: '#222',
  },
  cardRight: {
    flex: 1,
    alignItems: 'flex-end',
  },
  cardDiscrepancy: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 24,
    borderRadius: 8,
    backgroundColor: '#eee',
    marginHorizontal: 4,
  },
  tabSelected: {
    backgroundColor: '#007AFF',
  },
  tabText: {
    color: '#333',
    fontWeight: '500',
    fontSize: 16,
  },
  tabTextSelected: {
    color: '#fff',
  },
}); 