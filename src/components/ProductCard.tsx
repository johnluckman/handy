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

  // Stock values
  const stockOnHand = product.stockOnHand ?? 0;
  const incoming = product.incoming ?? 0;
  // TODO: Replace 0 with real value if you want to sum other branches
  const otherStore = 0;

  const price = product.retailPrice || product.price;
  const sku = product.code || product.sku;

  return (
    <TouchableOpacity style={styles.cardRow} onPress={onPress}>
      {/* Image */}
      <View style={styles.cardImageWrap}>
        {product.images && product.images.length > 0 ? (
          (() => {
            const firstImage = product.images[0];
            const imageUrl = typeof firstImage === 'string' ? firstImage : (firstImage as any)?.link;
            return imageUrl ? (
              <Image
                source={{ uri: imageUrl }}
                style={styles.cardImage}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.cardImagePlaceholder}>
                <Icon name="package-variant" size={32} color="#ccc" />
              </View>
            );
          })()
        ) : (
          <View style={styles.cardImagePlaceholder}>
            <Icon name="package-variant" size={32} color="#ccc" />
          </View>
        )}
      </View>

      {/* Details */}
      <View style={styles.cardDetails}>
        <Text style={styles.cardName} numberOfLines={2}>{product.name}</Text>
        <Text style={styles.cardSku}>{sku}</Text>
        <Text style={styles.cardPrice}>{formatPrice(price)}</Text>
      </View>

      {/* Stock summary */}
      <View style={styles.cardStockSummary}>
        <Text style={styles.stockLabel}>IN STOCK</Text>
        <Text style={styles.stockMain}>{stockOnHand}</Text>
        <View style={styles.stockRow}>
          <Text style={styles.stockSubLabel}>Other store</Text>
          <Text style={styles.stockOther}>{otherStore}</Text>
        </View>
        <View style={styles.stockRow}>
          <Text style={styles.stockSubLabel}>Incoming</Text>
          <Text style={styles.stockIncoming}>{incoming}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fafafa',
    borderRadius: 14,
    padding: 12,
    marginBottom: 12,
  },
  cardImageWrap: {
    width: 80,
    height: 80,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#fff',
    marginRight: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
  },
  cardImagePlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardDetails: {
    flex: 1,
    justifyContent: 'center',
    minWidth: 0,
  },
  cardName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111',
    marginBottom: 2,
  },
  cardSku: {
    fontSize: 14,
    color: '#888',
    marginBottom: 6,
  },
  cardPrice: {
    fontSize: 20,
    color: '#888',
    fontWeight: '400',
    marginBottom: 2,
  },
  cardStockSummary: {
    minWidth: 90,
    alignItems: 'center',
    borderLeftWidth: 1,
    borderLeftColor: '#e0e0e0',
    paddingLeft: 16,
  },
  stockLabel: {
    fontSize: 14,
    color: '#888',
    marginBottom: 2,
    fontWeight: '500',
  },
  stockMain: {
    fontSize: 36,
    color: '#39b878',
    fontWeight: '700',
    marginBottom: 2,
  },
  stockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  stockSubLabel: {
    fontSize: 14,
    color: '#888',
    marginRight: 4,
  },
  stockOther: {
    fontSize: 16,
    color: '#2196F3',
    fontWeight: '500',
  },
  stockIncoming: {
    fontSize: 16,
    color: '#888',
    fontWeight: '500',
  },
}); 