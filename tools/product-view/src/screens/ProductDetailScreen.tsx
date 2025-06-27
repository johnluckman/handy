import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Share,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { useTheme } from '../../../../src/context/ThemeContext';
import { useProduct } from '../context/ProductContext';
import { RootStackParamList } from '../App';
import { DatabaseProduct, DatabaseProductVariant, DatabaseStockLevel } from '../services/cin7Types';

type ProductDetailScreenNavigationProp = StackNavigationProp<RootStackParamList, 'ProductDetail'>;
type ProductDetailScreenRouteProp = RouteProp<RootStackParamList, 'ProductDetail'>;

const ProductDetailScreen: React.FC = () => {
  const navigation = useNavigation<ProductDetailScreenNavigationProp>();
  const route = useRoute<ProductDetailScreenRouteProp>();
  const { colors } = useTheme();
  const { getProductById } = useProduct();

  const [product, setProduct] = useState<DatabaseProduct | null>(null);
  const [variants, setVariants] = useState<DatabaseProductVariant[]>([]);
  const [stockLevels, setStockLevels] = useState<DatabaseStockLevel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadProductDetails();
  }, [route.params.productId]);

  const loadProductDetails = async () => {
    if (!route.params.productId) return;

    setLoading(true);
    setError(null);

    try {
      const result = await getProductById(route.params.productId);
      if (result) {
        setProduct(result);
        // Note: In a real implementation, variants and stock levels would be loaded separately
        // or included in the getProductById response
      } else {
        setError('Product not found');
      }
    } catch (err) {
      setError('Failed to load product details');
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price?: number) => {
    if (!price) return 'N/A';
    return `$${price.toFixed(2)}`;
  };

  const getStockStatus = (stockLevel: number) => {
    if (stockLevel > 10) return { status: 'inStock', color: colors.success, text: 'In Stock' };
    if (stockLevel > 0) return { status: 'lowStock', color: colors.warning, text: 'Low Stock' };
    return { status: 'outOfStock', color: colors.error, text: 'Out of Stock' };
  };

  const handleShare = () => {
    Alert.alert('Share', 'Share functionality would be implemented here');
  };

  const handleFavorite = () => {
    Alert.alert('Favorite', 'Favorite functionality would be implemented here');
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    imageContainer: {
      height: 300,
      backgroundColor: colors.card,
      alignItems: 'center',
      justifyContent: 'center',
    },
    placeholderIcon: {
      color: colors.textSecondary,
    },
    placeholderText: {
      color: colors.textSecondary,
      marginTop: 8,
    },
    content: {
      flex: 1,
    },
    productInfo: {
      padding: 20,
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 8,
    },
    sku: {
      fontSize: 14,
      color: colors.textSecondary,
      marginBottom: 12,
    },
    priceContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
    },
    price: {
      fontSize: 28,
      fontWeight: 'bold',
      color: colors.primary,
      marginRight: 16,
    },
    actionButtons: {
      flexDirection: 'row',
      gap: 12,
    },
    actionButton: {
      flex: 1,
      backgroundColor: colors.primary,
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 8,
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
    secondaryButton: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    secondaryButtonText: {
      color: colors.text,
    },
    section: {
      marginBottom: 24,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 12,
    },
    description: {
      fontSize: 16,
      color: colors.text,
      lineHeight: 24,
      marginBottom: 16,
    },
    infoRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: 8,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    infoLabel: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    infoValue: {
      fontSize: 14,
      color: colors.text,
      fontWeight: '500',
    },
    stockSection: {
      backgroundColor: colors.surface,
      padding: 16,
      marginHorizontal: 20,
      borderRadius: 12,
      marginBottom: 16,
    },
    stockTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 12,
    },
    stockItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 8,
    },
    stockLocation: {
      fontSize: 14,
      color: colors.text,
    },
    stockLevel: {
      fontSize: 14,
      fontWeight: '600',
    },
    loadingContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    errorContainer: {
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
  });

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.placeholderText}>Loading product details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !product) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Icon name="error" size={64} color={colors.error} />
          <Text style={styles.errorTitle}>Error Loading Product</Text>
          <Text style={styles.errorMessage}>
            {error || 'Unable to load product details. Please try again.'}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content}>
        {/* Product Image */}
        <View style={styles.header}>
          <View style={styles.imageContainer}>
            <Icon name="inventory" size={80} style={styles.placeholderIcon} />
            <Text style={styles.placeholderText}>Product Image</Text>
          </View>
        </View>

        {/* Product Information */}
        <View style={styles.productInfo}>
          <Text style={styles.title}>{product.name}</Text>
          <Text style={styles.sku}>SKU: {product.product_code}</Text>

          {/* Price and Actions */}
          <View style={styles.priceContainer}>
            <Text style={styles.price}>{formatPrice(product.price_retail)}</Text>
            <View style={styles.actionButtons}>
              <TouchableOpacity style={styles.actionButton} onPress={handleFavorite}>
                <Icon name="favorite-border" size={20} color="#FFFFFF" />
                <Text style={styles.actionButtonText}>Favorite</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.secondaryButton]}
                onPress={handleShare}
              >
                <Icon name="share" size={20} color={colors.text} />
                <Text style={[styles.actionButtonText, styles.secondaryButtonText]}>
                  Share
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Description */}
          {product.description && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Description</Text>
              <Text style={styles.description}>{product.description}</Text>
            </View>
          )}

          {/* Product Details */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Product Details</Text>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Brand</Text>
              <Text style={styles.infoValue}>{product.brand || 'N/A'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Category</Text>
              <Text style={styles.infoValue}>{product.category || 'N/A'}</Text>
            </View>
            {product.subcategory && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Subcategory</Text>
                <Text style={styles.infoValue}>{product.subcategory}</Text>
              </View>
            )}
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Wholesale Price</Text>
              <Text style={styles.infoValue}>{formatPrice(product.price_wholesale)}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Cost Price</Text>
              <Text style={styles.infoValue}>{formatPrice(product.price_cost)}</Text>
            </View>
          </View>

          {/* Stock Levels */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Stock Levels</Text>
            <View style={styles.stockSection}>
              {stockLevels.length > 0 ? (
                stockLevels.map((stock, index) => {
                  const stockStatus = getStockStatus(stock.stock_level);
                  return (
                    <View key={index} style={styles.stockItem}>
                      <Text style={styles.stockLocation}>{stock.branch_name}</Text>
                      <Text style={[styles.stockLevel, { color: stockStatus.color }]}>
                        {stock.stock_level} units
                      </Text>
                    </View>
                  );
                })
              ) : (
                <Text style={styles.placeholderText}>No stock information available</Text>
              )}
            </View>
          </View>

          {/* Specifications */}
          {product.specifications && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Specifications</Text>
              {Object.entries(product.specifications).map(([key, value]) => (
                <View key={key} style={styles.infoRow}>
                  <Text style={styles.infoLabel}>{key.charAt(0).toUpperCase() + key.slice(1)}</Text>
                  <Text style={styles.infoValue}>{String(value)}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default ProductDetailScreen; 