import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useTheme } from '../context/ThemeContext';
import { DatabaseProduct } from '../services/cin7Types';

interface ProductCardProps {
  product: DatabaseProduct;
  onPress: () => void;
  variant?: 'compact' | 'detailed';
}

const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onPress,
  variant = 'detailed',
}) => {
  const { colors } = useTheme();

  const styles = StyleSheet.create({
    container: {
      backgroundColor: colors.card,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      padding: 16,
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
    compactContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 12,
    },
    imageContainer: {
      width: 60,
      height: 60,
      borderRadius: 8,
      backgroundColor: colors.surface,
      marginRight: 12,
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
    },
    image: {
      width: '100%',
      height: '100%',
    },
    placeholderIcon: {
      color: colors.textSecondary,
    },
    content: {
      flex: 1,
    },
    title: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 4,
    },
    compactTitle: {
      fontSize: 14,
      fontWeight: '500',
      color: colors.text,
      marginBottom: 2,
    },
    sku: {
      fontSize: 12,
      color: colors.textSecondary,
      marginBottom: 4,
    },
    compactSku: {
      fontSize: 11,
      color: colors.textSecondary,
      marginBottom: 2,
    },
    price: {
      fontSize: 16,
      fontWeight: 'bold',
      color: colors.primary,
    },
    compactPrice: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.primary,
    },
    brand: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 4,
    },
    compactBrand: {
      fontSize: 11,
      color: colors.textSecondary,
      marginTop: 2,
    },
    stockInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 8,
    },
    compactStockInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 4,
    },
    stockText: {
      fontSize: 12,
      color: colors.textSecondary,
      marginLeft: 4,
    },
    compactStockText: {
      fontSize: 11,
      color: colors.textSecondary,
      marginLeft: 4,
    },
    stockIcon: {
      fontSize: 14,
    },
    stockSuccess: {
      color: colors.success,
    },
    stockWarning: {
      color: colors.warning,
    },
    stockError: {
      color: colors.error,
    },
    rightContent: {
      alignItems: 'flex-end',
      justifyContent: 'space-between',
      height: '100%',
    },
    arrowIcon: {
      color: colors.textSecondary,
      fontSize: 20,
    },
  });

  const formatPrice = (price?: number) => {
    if (!price) return 'N/A';
    return `$${price.toFixed(2)}`;
  };

  const getStockStatus = () => {
    // This would need to be calculated based on actual stock levels
    // For now, return a default status
    return {
      status: 'inStock' as const,
      text: 'In Stock',
      icon: 'check-circle',
      color: styles.stockSuccess,
    };
  };

  const stockStatus = getStockStatus();

  if (variant === 'compact') {
    return (
      <TouchableOpacity style={[styles.container, styles.compactContainer]} onPress={onPress}>
        <View style={styles.imageContainer}>
          {/* Placeholder for product image */}
          <Icon name="inventory" size={24} style={styles.placeholderIcon} />
        </View>
        
        <View style={styles.content}>
          <Text style={styles.compactTitle} numberOfLines={1}>
            {product.name}
          </Text>
          <Text style={styles.compactSku} numberOfLines={1}>
            {product.product_code}
          </Text>
          <Text style={styles.compactBrand} numberOfLines={1}>
            {product.brand || 'No Brand'}
          </Text>
        </View>
        
        <View style={styles.rightContent}>
          <Text style={styles.compactPrice}>
            {formatPrice(product.price_retail)}
          </Text>
          <View style={styles.compactStockInfo}>
            <Icon
              name={stockStatus.icon as any}
              size={12}
              style={[styles.stockIcon, stockStatus.color]}
            />
            <Text style={styles.compactStockText}>{stockStatus.text}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <View style={styles.imageContainer}>
        {/* Placeholder for product image */}
        <Icon name="inventory" size={32} style={styles.placeholderIcon} />
      </View>
      
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={2}>
          {product.name}
        </Text>
        <Text style={styles.sku} numberOfLines={1}>
          SKU: {product.product_code}
        </Text>
        <Text style={styles.brand} numberOfLines={1}>
          {product.brand || 'No Brand'}
        </Text>
        
        <View style={styles.stockInfo}>
          <Icon
            name={stockStatus.icon as any}
            size={16}
            style={[styles.stockIcon, stockStatus.color]}
          />
          <Text style={styles.stockText}>{stockStatus.text}</Text>
        </View>
      </View>
      
      <View style={styles.rightContent}>
        <Text style={styles.price}>
          {formatPrice(product.price_retail)}
        </Text>
        <Icon name="chevron-right" style={styles.arrowIcon} />
      </View>
    </TouchableOpacity>
  );
};

export default ProductCard; 