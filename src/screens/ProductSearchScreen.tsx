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

type ProductSearchScreenNavigationProp = StackNavigationProp<RootStackParamList, 'ProductSearch'>;
type ProductSearchScreenRouteProp = RouteProp<RootStackParamList, 'ProductSearch'>;

export default function ProductSearchScreen() {
  const navigation = useNavigation<ProductSearchScreenNavigationProp>();
  const route = useRoute<ProductSearchScreenRouteProp>();
  const { searchProducts, products, loading, error } = useProduct();
  const [searchQuery, setSearchQuery] = useState(route.params?.initialQuery || '');
  const [searchHistory, setSearchHistory] = useState<string[]>([]);

  useEffect(() => {
    if (route.params?.initialQuery) {
      handleSearch(route.params.initialQuery);
    }
  }, [route.params?.initialQuery]);

  const handleSearch = async (query: string) => {
    if (!query.trim()) return;
    
    setSearchQuery(query);
    await searchProducts(query);
    
    // Add to search history
    if (!searchHistory.includes(query)) {
      setSearchHistory(prev => [query, ...prev.slice(0, 9)]);
    }
  };

  const handleProductPress = (product: Product) => {
    navigation.navigate('ProductDetail', { productId: product.id });
  };

  const handleBarcodeScan = () => {
    navigation.navigate('BarcodeScanner');
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

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={() => handleSearch(searchQuery)}
          placeholder="Search products..."
        />
        <TouchableOpacity style={styles.scanButton} onPress={handleBarcodeScan}>
          <Icon name="barcode-scan" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  scanButton: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    marginLeft: 12,
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