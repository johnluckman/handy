import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Product } from '../types/Product';

interface ProductCardProps {
  product: Product;
  onPress: () => void;
}

export default function ProductCard({ product, onPress }: ProductCardProps) {
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

  const stockStatus = getStockStatus(product.stockLevel);

  const getStockColor = () => {
    switch (stockStatus) {
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

  const getStockIcon = () => {
    switch (stockStatus) {
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

  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <View style={styles.imageContainer}>
        {product.images && product.images.length > 0 && product.images[0].link ? (
          <Image
            source={{ uri: product.images[0].link }}
            style={styles.image}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.placeholderImage}>
            <Icon name="package-variant" size={32} color="#ccc" />
          </View>
        )}
        <View style={[styles.stockBadge, { backgroundColor: getStockColor() }]}>
          <Icon name={getStockIcon()} size={12} color="#fff" />
        </View>
      </View>

      <View style={styles.content}>
        <Text style={styles.name} numberOfLines={2}>
          {product.name}
        </Text>
        
        <Text style={styles.sku} numberOfLines={1}>
          SKU: {product.sku}
        </Text>

        {product.barcode && (
          <Text style={styles.barcode} numberOfLines={1}>
            Barcode: {product.barcode}
          </Text>
        )}

        <View style={styles.details}>
          <View style={styles.priceContainer}>
            <Text style={styles.priceLabel}>Price:</Text>
            <Text style={styles.price}>{formatPrice(product.price)}</Text>
          </View>

          <View style={styles.stockContainer}>
            <Text style={styles.stockLabel}>Stock:</Text>
            <Text style={[styles.stock, { color: getStockColor() }]}>
              {formatStockLevel(product.stockLevel)}
            </Text>
          </View>
        </View>

        {product.category && (
          <Text style={styles.category} numberOfLines={1}>
            {product.category}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  imageContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  image: {
    width: '100%',
    height: 120,
    borderRadius: 8,
  },
  placeholderImage: {
    width: '100%',
    height: 120,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stockBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
    lineHeight: 20,
  },
  sku: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  barcode: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  details: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  priceLabel: {
    fontSize: 12,
    color: '#666',
    marginRight: 4,
  },
  price: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  stockContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stockLabel: {
    fontSize: 12,
    color: '#666',
    marginRight: 4,
  },
  stock: {
    fontSize: 14,
    fontWeight: '600',
  },
  category: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
  },
}); 