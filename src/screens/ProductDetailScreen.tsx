import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Product } from '../types/Product';
import { fetchStockByBarcode, StockUnit, fetchProductById, fetchStockByProductId } from '../services/cin7Api';

type RootStackParamList = {
  ProductDetail: { product: Product };
};

type ProductDetailScreenNavigationProp = StackNavigationProp<RootStackParamList, 'ProductDetail'>;
type ProductDetailScreenRouteProp = RouteProp<RootStackParamList, 'ProductDetail'>;

// If Product type is missing 'code', extend it here for this file:
type ProductWithCode = Product & { code?: string };

export default function ProductDetailScreen() {
  const navigation = useNavigation<ProductDetailScreenNavigationProp>();
  const route = useRoute<ProductDetailScreenRouteProp>();
  const product = route.params.product as ProductWithCode;
  const [stock, setStock] = useState<StockUnit[] | null>(null);
  const [stockLoading, setStockLoading] = useState(false);
  const [stockError, setStockError] = useState<string | null>(null);
  const [fullProduct, setFullProduct] = useState<any>(null);
  const [fullProductLoading, setFullProductLoading] = useState(false);
  const [fullProductError, setFullProductError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStock = async () => {
      if (!product.id) {
        setStockError('No product ID available for this product.');
        return;
      }
      setStockLoading(true);
      setStockError(null);
      try {
        console.log('Fetching stock for productId:', product.id);
        const stockData = await fetchStockByProductId(Number(product.id));
        console.log('Stock by productId:', stockData);
        if (stockData) {
          console.log('Branch names:', stockData.map(s => s.branchName));
        }
        setStock(stockData);
      } catch (err) {
        console.error('Error fetching stock:', err);
        setStockError(err.message || 'Failed to fetch stock');
      } finally {
        setStockLoading(false);
      }
    };
    fetchStock();
  }, [product.id]);

  useEffect(() => {
    const fetchFullProduct = async () => {
      setFullProductLoading(true);
      setFullProductError(null);
      try {
        const data = await fetchProductById(product.id);
        setFullProduct(data);
      } catch (err: any) {
        setFullProductError(err.message || 'Failed to fetch full product data');
      } finally {
        setFullProductLoading(false);
      }
    };
    fetchFullProduct();
  }, [product.id]);

  const formatPrice = (price?: number) => {
    if (!price) return 'N/A';
    return `$${price.toFixed(2)}`;
  };

  const formatStockLevel = (stockLevel?: number) => {
    if (stockLevel === undefined || stockLevel === null) return 'N/A';
    return stockLevel.toString();
  };

  const getStockStatus = (stockLevel?: number) => {
    if (stockLevel === undefined || stockLevel === null) return 'unknown';
    if (stockLevel <= 0) return 'out';
    if (stockLevel <= 5) return 'low';
    return 'in';
  };

  const getStockColor = (stockLevel?: number) => {
    const status = getStockStatus(stockLevel);
    switch (status) {
      case 'in':
        return '#4CAF50';
      case 'low':
        return '#FF9800';
      case 'out':
        return '#F44336';
      default:
        return '#9E9E9E';
    }
  };

  const getStockIcon = (stockLevel?: number) => {
    const status = getStockStatus(stockLevel);
    switch (status) {
      case 'in':
        return 'check-circle';
      case 'low':
        return 'alert-circle';
      case 'out':
        return 'close-circle';
      default:
        return 'help-circle';
    }
  };

  if (!product) {
    return (
      <View style={styles.errorContainer}>
        <Icon name="alert-circle" size={64} color="#f44336" />
        <Text style={styles.errorText}>
          {'Product not found'}
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-left" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Product Details</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Product Image */}
      <View style={styles.imageContainer}>
        {product.images && product.images.length > 0 ? (
          <Image
            source={{ uri: product.images[0] }}
            style={styles.image}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.placeholderImage}>
            <Icon name="package-variant" size={64} color="#ccc" />
          </View>
        )}
      </View>

      {/* Product Info */}
      <View style={styles.content}>
        <Text style={styles.name}>{product.name}</Text>
        
        <View style={styles.stockContainer}>
          <Icon
            name={getStockIcon(product.stockLevel)}
            size={20}
            color={getStockColor(product.stockLevel)}
          />
          <Text style={[styles.stockText, { color: getStockColor(product.stockLevel) }]}>
            Stock: {formatStockLevel(product.stockLevel)}
          </Text>
        </View>

        <View style={styles.priceContainer}>
          <Text style={styles.priceLabel}>Price:</Text>
          <Text style={styles.price}>{formatPrice(product.retailPrice)}</Text>
        </View>

        {/* Basic Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Information</Text>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Code:</Text>
            <Text style={styles.infoValue}>{product.code}</Text>
          </View>

          {product.barcode && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Barcode:</Text>
              <Text style={styles.infoValue}>{product.barcode}</Text>
            </View>
          )}

          {product.category && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Category:</Text>
              <Text style={styles.infoValue}>{product.category}</Text>
            </View>
          )}

          {product.brand && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Brand:</Text>
              <Text style={styles.infoValue}>{product.brand}</Text>
            </View>
          )}
        </View>

        {/* Description */}
        {product.description && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.description}>{product.description}</Text>
          </View>
        )}

        {/* Specifications */}
        {product.specifications && Object.keys(product.specifications).length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Specifications</Text>
            {Object.entries(product.specifications).map(([key, value]) => (
              <View key={key} style={styles.infoRow}>
                <Text style={styles.infoLabel}>{key.charAt(0).toUpperCase() + key.slice(1)}:</Text>
                <Text style={styles.infoValue}>{String(value)}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Additional Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Additional Information</Text>
          
          {product.cost && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Cost:</Text>
              <Text style={styles.infoValue}>{formatPrice(product.cost)}</Text>
            </View>
          )}

          {product.createdAt && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Created:</Text>
              <Text style={styles.infoValue}>
                {new Date(product.createdAt).toLocaleDateString()}
              </Text>
            </View>
          )}

          {product.updatedAt && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Updated:</Text>
              <Text style={styles.infoValue}>
                {new Date(product.updatedAt).toLocaleDateString()}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Per-branch stock section */}
      <View style={{ backgroundColor: '#fff', margin: 16, borderRadius: 8, padding: 12 }}>
        <Text style={{ fontWeight: 'bold', fontSize: 16, marginBottom: 8 }}>Stock by Location</Text>
        {stockLoading && <Text>Loading stock...</Text>}
        {stockError && <Text style={{ color: 'red' }}>{stockError}</Text>}
        {!stockLoading && !stockError && stock && (
          <>
            {['Newtown Store, NSW', 'Paddington Store, NSW'].map(branch => {
              // Sum available stock for all matching stock units for this branch
              const totalAvailable = stock
                .filter(s => s.branchName === branch)
                .reduce((sum, s) => sum + (s.available || 0), 0);
              return (
                <View key={branch} style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                  <Text>{branch}:</Text>
                  <Text style={{ fontWeight: 'bold' }}>{totalAvailable}</Text>
                </View>
              );
            })}
          </>
        )}
      </View>

      {/* Raw Data Debug Section */}
      <View style={{ backgroundColor: '#222', margin: 16, borderRadius: 8, padding: 12 }}>
        <Text style={{ color: '#fff', fontWeight: 'bold', marginBottom: 8 }}>Raw Product Data (Cin7 API):</Text>
        {fullProductLoading && <Text style={{ color: '#fff' }}>Loading full product data...</Text>}
        {fullProductError && <Text style={{ color: 'red' }}>{fullProductError}</Text>}
        {!fullProductLoading && !fullProductError && (
          <ScrollView horizontal style={{ maxHeight: 300 }}>
            <Text style={{ color: '#fff', fontSize: 12 }} selectable>
              {fullProduct ? JSON.stringify(fullProduct, null, 2) : 'No product data found.'}
            </Text>
          </ScrollView>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
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
  imageContainer: {
    backgroundColor: '#fff',
    padding: 16,
  },
  image: {
    width: '100%',
    height: 200,
    borderRadius: 8,
  },
  placeholderImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: 16,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  stockContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  stockText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  priceLabel: {
    fontSize: 16,
    color: '#666',
    marginRight: 8,
  },
  price: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  infoValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
    flex: 2,
    textAlign: 'right',
  },
  description: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
}); 