import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { useTheme } from '../context/ThemeContext';
import { useProduct } from '../context/ProductContext';
import { RootStackParamList } from '../App';
import SearchBar from '../components/SearchBar';
import ProductCard from '../components/ProductCard';

type ProductSearchScreenNavigationProp = StackNavigationProp<RootStackParamList, 'ProductSearch'>;
type ProductSearchScreenRouteProp = RouteProp<RootStackParamList, 'ProductSearch'>;

const ProductSearchScreen: React.FC = () => {
  const navigation = useNavigation<ProductSearchScreenNavigationProp>();
  const route = useRoute<ProductSearchScreenRouteProp>();
  const { colors } = useTheme();
  const {
    searchQuery,
    setSearchQuery,
    searchResults,
    searchLoading,
    searchError,
    searchProducts,
  } = useProduct();

  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    if (route.params?.initialQuery) {
      setSearchQuery(route.params.initialQuery);
    }
  }, [route.params?.initialQuery, setSearchQuery]);

  useEffect(() => {
    if (searchQuery.trim()) {
      searchProducts();
    }
  }, [searchQuery, searchProducts]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleProductPress = (productId: string) => {
    navigation.navigate('ProductDetail', { productId });
  };

  const renderProduct = ({ item }: { item: any }) => (
    <ProductCard
      product={item}
      onPress={() => handleProductPress(item.id)}
      variant="compact"
    />
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Icon name="search" size={64} color={colors.textSecondary} />
      <Text style={styles.emptyStateTitle}>
        {searchQuery ? 'No products found' : 'Search for products'}
      </Text>
      <Text style={styles.emptyStateSubtitle}>
        {searchQuery
          ? `No products match "${searchQuery}"`
          : 'Enter a product name, SKU, or brand to get started'}
      </Text>
    </View>
  );

  const renderError = () => (
    <View style={styles.errorState}>
      <Icon name="error" size={64} color={colors.error} />
      <Text style={styles.errorTitle}>Search Error</Text>
      <Text style={styles.errorMessage}>{searchError}</Text>
    </View>
  );

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      padding: 16,
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    searchBar: {
      flex: 1,
    },
    filterButton: {
      backgroundColor: colors.primary,
      padding: 12,
      borderRadius: 8,
    },
    filterIcon: {
      color: '#FFFFFF',
    },
    content: {
      flex: 1,
    },
    resultsHeader: {
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    resultsText: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    productList: {
      paddingHorizontal: 16,
    },
    emptyState: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 32,
    },
    emptyStateTitle: {
      fontSize: 20,
      fontWeight: '600',
      color: colors.text,
      marginTop: 16,
      marginBottom: 8,
      textAlign: 'center',
    },
    emptyStateSubtitle: {
      fontSize: 16,
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 24,
    },
    errorState: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 32,
    },
    errorTitle: {
      fontSize: 20,
      fontWeight: '600',
      color: colors.error,
      marginTop: 16,
      marginBottom: 8,
    },
    errorMessage: {
      fontSize: 16,
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 24,
    },
    loadingContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <SearchBar
              placeholder="Search products, SKU, or brand..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSearch={handleSearch}
            />
          </View>
          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => setShowFilters(!showFilters)}
          >
            <Icon name="tune" size={20} style={styles.filterIcon} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.content}>
        {searchLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.emptyStateSubtitle}>Searching...</Text>
          </View>
        ) : searchError ? (
          renderError()
        ) : (
          <>
            {searchResults.length > 0 && (
              <View style={styles.resultsHeader}>
                <Text style={styles.resultsText}>
                  {searchResults.length} product{searchResults.length !== 1 ? 's' : ''} found
                </Text>
              </View>
            )}
            
            <FlatList
              data={searchResults}
              renderItem={renderProduct}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.productList}
              ListEmptyComponent={renderEmptyState}
              showsVerticalScrollIndicator={false}
            />
          </>
        )}
      </View>
    </SafeAreaView>
  );
};

export default ProductSearchScreen; 