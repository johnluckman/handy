import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useProduct } from '../context/ProductContext';
import SearchBar from '../components/SearchBar';
import ProductCard from '../components/ProductCard';
import { Product } from '../types/Product';
import { RootStackParamList } from '../navigation/AppNavigator';
import { LinearGradient } from 'expo-linear-gradient';
import { checkCin7Api } from '../services/cin7Api';

type ProductSearchScreenNavigationProp = StackNavigationProp<RootStackParamList, 'ProductSearch'>;
type ProductSearchScreenRouteProp = RouteProp<RootStackParamList, 'ProductSearch'>;

export default function ProductSearchScreen() {
  console.log('ProductSearchScreen rendered');
  const navigation = useNavigation<ProductSearchScreenNavigationProp>();
  const route = useRoute<ProductSearchScreenRouteProp>();
  const { searchProducts, products, loading, error } = useProduct();
  const [searchQuery, setSearchQuery] = useState(route.params?.initialQuery || '');
  const [searchHistory, setSearchHistory] = useState<string[]>([]);

  // Sync handler: call API endpoint to sync Cin7 to Supabase, then reload products
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    if (route.params?.initialQuery) {
      handleSearch(route.params.initialQuery);
    }
  }, [route.params?.initialQuery]);

  const handleSearch = async (query: string) => {
    console.log('Fetch button pressed, query:', query);
    setSearchQuery(query);
    await searchProducts(query);
    // Add to search history
    if (!searchHistory.includes(query)) {
      setSearchHistory(prev => [query, ...prev.slice(0, 9)]);
    }
  };

  const handleProductPress = (product: Product) => {
    navigation.navigate('ProductDetail', { product });
  };

  const handleBarcodeScan = () => {
    navigation.navigate('BarcodeScanner');
  };

  // Sync handler: call API endpoint to sync Cin7 stock to Supabase, then reload products
  const handleSyncStock = async () => {
    setSyncing(true);
    try {
      // Call the API server to trigger the stock sync script
      const response = await fetch('http://localhost:3001/api/syncStock', { 
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      const result = await response.json();
      
      if (result.success) {
        // After sync, reload products from Supabase
        await handleSearch(searchQuery);
        Alert.alert('Stock Sync Complete', 'Cin7 stock data has been synced to Supabase.');
      } else {
        throw new Error(result.message || 'Stock sync failed');
      }
    } catch (err) {
      Alert.alert('Stock Sync Failed', err instanceof Error ? err.message : 'Failed to sync Cin7 stock data.');
    } finally {
      setSyncing(false);
    }
  };

  const renderProduct = ({ item }: { item: Product }) => (
    <ProductCard product={item} onPress={() => handleProductPress(item)} />
  );

  const renderSearchHistoryItem = (query: string) => (
    <TouchableOpacity
      key={query}
      style={styles.historyItem}
      onPress={() => handleSearch(query)}
    >
      <Icon name="history" size={20} color="#666" />
      <Text style={styles.historyText}>{query}</Text>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Icon name="magnify" size={64} color="#ccc" />
      <Text style={styles.emptyStateText}>
        {loading ? 'Searching...' : 'No products found'}
      </Text>
      {!loading && searchQuery && (
        <Text style={styles.emptyStateSubtext}>
          Try adjusting your search terms
        </Text>
      )}
    </View>
  );

  // Add this log before rendering the FlatList
  console.log('ProductSearchScreen products:', products);

  console.log('useProduct hook:', { searchProducts, products, loading, error });

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#39b878', '#2E9A65']}
        style={styles.headerGradient}
      >
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Product Search</Text>
          <View style={styles.headerActions}>
            <SearchBar
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={() => handleSearch(searchQuery)}
              placeholder="Search products..."
            />
            <TouchableOpacity style={styles.scanButton} onPress={handleBarcodeScan}>
              <Icon name="barcode-scan" size={24} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.syncStockButton} onPress={handleSyncStock} disabled={syncing}>
              <Icon name="database-sync" size={24} color="#fff" />
            </TouchableOpacity>
            {syncing && (
              <ActivityIndicator size="small" color="#fff" style={{ marginLeft: 8 }} />
            )}
          </View>
        </View>
      </LinearGradient>

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {!searchQuery && searchHistory.length > 0 && (
        <View style={styles.historyContainer}>
          <Text style={styles.historyTitle}>Recent Searches</Text>
          {searchHistory.map(renderSearchHistoryItem)}
        </View>
      )}

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Searching products...</Text>
        </View>
      ) : (
        <FlatList
          data={products}
          renderItem={renderProduct}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={renderEmptyState}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  headerGradient: {
    paddingTop: 50,
    paddingBottom: 24,
    paddingHorizontal: 16,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerContent: {
    width: '100%',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    marginBottom: 12,
    textAlign: 'left',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scanButton: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    marginLeft: 12,
  },
  syncStockButton: {
    backgroundColor: '#FF9800',
    padding: 12,
    borderRadius: 8,
    marginLeft: 8,
  },
  errorContainer: {
    backgroundColor: '#ffebee',
    padding: 16,
    margin: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#f44336',
  },
  errorText: {
    color: '#c62828',
    fontSize: 14,
  },
  historyContainer: {
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 8,
  },
  historyTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333',
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    marginBottom: 8,
  },
  historyText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#333',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  listContainer: {
    padding: 16,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyStateText: {
    fontSize: 18,
    color: '#666',
    marginTop: 16,
    textAlign: 'center',
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
  },
}); 