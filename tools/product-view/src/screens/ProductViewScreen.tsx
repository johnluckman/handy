import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  RefreshControl,
  FlatList,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { fetchProducts } from '../../../../src/services/supabase'; // Adjust path as needed

import { useTheme } from '../../../../src/context/ThemeContext';
import { useProduct } from '../context/ProductContext';
import { RootStackParamList } from '../App';
import ProductCard from '../components/ProductCard';
import SearchBar from '../../../../src/components/SearchBar';

type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Home'>;

const ProductViewScreen: React.FC = () => {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const { colors } = useTheme();
  const {
    recentProducts,
    popularProducts,
    lowStockProducts,
    loading: productLoading,
    loadRecentProducts,
    loadPopularProducts,
    loadLowStockProducts,
  } = useProduct();

  const [refreshing, setRefreshing] = React.useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      loadRecentProducts(),
      loadPopularProducts(),
      loadLowStockProducts(),
    ]);
    setRefreshing(false);
  }, [loadRecentProducts, loadPopularProducts, loadLowStockProducts]);

  const handleSearchPress = () => {
    navigation.navigate('ProductSearch', {});
  };

  const handleBarcodePress = () => {
    navigation.navigate('BarcodeScanner');
  };

  const handleProductPress = (productId: string) => {
    navigation.navigate('ProductDetail', { productId });
  };

  useEffect(() => {
    fetchProducts()
      .then(setProducts)
      .catch((err) => alert('Error fetching products: ' + err.message))
      .finally(() => setLoading(false));
  }, []);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      paddingHorizontal: 20,
      paddingVertical: 16,
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    title: {
      fontSize: 28,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 8,
    },
    subtitle: {
      fontSize: 16,
      color: colors.textSecondary,
    },
    content: {
      flex: 1,
    },
    searchSection: {
      padding: 20,
      backgroundColor: colors.surface,
      marginBottom: 16,
    },
    quickActions: {
      flexDirection: 'row',
      gap: 12,
      marginTop: 16,
    },
    actionButton: {
      flex: 1,
      backgroundColor: colors.primary,
      paddingVertical: 16,
      paddingHorizontal: 20,
      borderRadius: 12,
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'center',
    },
    actionButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '600',
      marginLeft: 8,
    },
    section: {
      marginBottom: 24,
    },
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      marginBottom: 12,
    },
    sectionTitle: {
      fontSize: 20,
      fontWeight: '600',
      color: colors.text,
    },
    seeAllButton: {
      color: colors.primary,
      fontSize: 16,
      fontWeight: '500',
    },
    productList: {
      paddingHorizontal: 20,
    },
    emptyState: {
      alignItems: 'center',
      paddingVertical: 40,
    },
    emptyStateText: {
      fontSize: 16,
      color: colors.textSecondary,
      textAlign: 'center',
      marginTop: 12,
    },
    loadingContainer: {
      paddingVertical: 20,
      alignItems: 'center',
    },
  });

  if (loading) return <Text>Loading...</Text>;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Product View</Text>
          <Text style={styles.subtitle}>Find products quickly and easily</Text>
        </View>

        {/* Search Section */}
        <View style={styles.searchSection}>
          <SearchBar
            placeholder="Search products..."
            onPress={handleSearchPress}
            editable={false}
            colors={{
              card: colors.card,
              border: colors.border,
              text: colors.text,
              textSecondary: colors.textSecondary,
            }}
          />
          
          <View style={styles.quickActions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleSearchPress}
            >
              <Icon name="search" size={20} color="#FFFFFF" />
              <Text style={styles.actionButtonText}>Search</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleBarcodePress}
            >
              <Icon name="qr-code-scanner" size={20} color="#FFFFFF" />
              <Text style={styles.actionButtonText}>Scan</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Recent Products */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Products</Text>
            <TouchableOpacity onPress={handleSearchPress}>
              <Text style={styles.seeAllButton}>See All</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.productList}>
            {productLoading.recent ? (
              <View style={styles.loadingContainer}>
                <Text style={styles.emptyStateText}>Loading...</Text>
              </View>
            ) : recentProducts.length > 0 ? (
              recentProducts.slice(0, 3).map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onPress={() => handleProductPress(product.id)}
                />
              ))
            ) : (
              <View style={styles.emptyState}>
                <Icon name="inventory" size={48} color={colors.textSecondary} />
                <Text style={styles.emptyStateText}>
                  No recent products found
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Popular Products */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Popular Products</Text>
            <TouchableOpacity onPress={handleSearchPress}>
              <Text style={styles.seeAllButton}>See All</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.productList}>
            {productLoading.popular ? (
              <View style={styles.loadingContainer}>
                <Text style={styles.emptyStateText}>Loading...</Text>
              </View>
            ) : popularProducts.length > 0 ? (
              popularProducts.slice(0, 3).map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onPress={() => handleProductPress(product.id)}
                />
              ))
            ) : (
              <View style={styles.emptyState}>
                <Icon name="trending-up" size={48} color={colors.textSecondary} />
                <Text style={styles.emptyStateText}>
                  No popular products found
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Low Stock Products */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Low Stock Alert</Text>
            <TouchableOpacity onPress={handleSearchPress}>
              <Text style={styles.seeAllButton}>See All</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.productList}>
            {productLoading.lowStock ? (
              <View style={styles.loadingContainer}>
                <Text style={styles.emptyStateText}>Loading...</Text>
              </View>
            ) : lowStockProducts.length > 0 ? (
              lowStockProducts.slice(0, 3).map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onPress={() => handleProductPress(product.id)}
                />
              ))
            ) : (
              <View style={styles.emptyState}>
                <Icon name="warning" size={48} color={colors.textSecondary} />
                <Text style={styles.emptyStateText}>
                  All products are well stocked
                </Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default ProductViewScreen; 