import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
  ScrollView,
  LogBox,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { NavigationProps } from '../navigation/AppNavigator';
import { LinearGradient } from 'expo-linear-gradient';

// Suppress the specific warning about text strings
LogBox.ignoreLogs(['Text strings must be rendered within a <Text> component']);

interface RestockItem {
  id: string;
  sku: string;
  productName: string;
  instock: number;
  quantity: number;
  sold?: number;
  picked?: number;
  review?: number;
}

interface RestockData {
  items: RestockItem[];
  totalSold: number;
  totalPicked: number;
  totalReview: number;
}

export default function RestockerScreen(): React.ReactElement {
  const navigation = useNavigation<NavigationProps>();
  
  const [activeTab, setActiveTab] = useState<'restock' | 'online' | 'review' | 'settings'>('restock');
  const [restockItems, setRestockItems] = useState<RestockItem[]>([
    { id: '1', sku: 'JEL-BASS6BN', productName: 'Product Name 1', instock: 13, quantity: 2, sold: 13 },
    { id: '2', sku: '1FY-INC-1300', productName: 'Product Name 2', instock: 13, quantity: 1, sold: 0 },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [syncResults, setSyncResults] = useState<string[]>([]);

  const handleQuantityChange = (id: string, change: number) => {
    setRestockItems(prev => 
      prev.map(item => 
        item.id === id 
          ? { ...item, quantity: Math.max(0, item.quantity + change) }
          : item
      )
    );
  };

  const handleSync = async (type: string) => {
    setIsLoading(true);
    setSyncResults(prev => [...prev, `Starting ${type} sync...`]);
    
    // Simulate sync process
    setTimeout(() => {
      setSyncResults(prev => [...prev, `${type} sync completed successfully!`]);
      setIsLoading(false);
    }, 2000);
  };

  const renderRestockItem = ({ item }: { item: RestockItem }) => (
    <View style={styles.item}>
      {/* Left: Image placeholder */}
      <View style={styles.itemImageContainer}>
        <View style={styles.itemImagePlaceholder}>
          <Icon name="image" size={24} color="#999" />
        </View>
      </View>
      
      {/* Middle: Product details */}
      <View style={styles.itemDetails}>
        <Text style={styles.itemSku}>SKU</Text>
        <Text style={styles.itemName}>{item.sku}</Text>
        <Text style={styles.itemName}>Product Name</Text>
        <Text style={styles.itemName}>{item.productName}</Text>
        <Text style={styles.itemInstock}>Instock: {item.instock}</Text>
        {item.sold && item.sold > 0 && (
          <Text style={styles.itemSold}>Sold today: {item.sold}</Text>
        )}
      </View>
      
      {/* Right: Quantity and controls */}
      <View style={styles.itemQuantity}>
        <Text style={styles.quantityNumber}>{item.quantity}</Text>
        <View style={styles.quantityControls}>
          <TouchableOpacity 
            style={styles.quantityButton}
            onPress={() => handleQuantityChange(item.id, -1)}
          >
            <Icon name="minus" size={16} color="#333" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.quantityButton}
            onPress={() => handleQuantityChange(item.id, 1)}
          >
            <Icon name="plus" size={16} color="#333" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const renderOnlineTab = () => (
    <View style={styles.tabPlaceholder}>
      <Icon name="shopping" size={64} color="#999" />
      <Text style={styles.tabPlaceholderText}>Online Orders</Text>
      <Text style={styles.tabPlaceholderSubtext}>
        Manage online order picking and fulfillment
              </Text>
          </View>
  );

  const renderReviewTab = () => (
    <View style={styles.tabPlaceholder}>
      <Icon name="clipboard-check" size={64} color="#999" />
      <Text style={styles.tabPlaceholderText}>Review & Quality</Text>
      <Text style={styles.tabPlaceholderSubtext}>
        Review picked items and quality checks
          </Text>
      </View>
    );

  const renderSettingsTab = () => (
    <ScrollView style={styles.settingsContainer}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Data Synchronization</Text>
        
        <TouchableOpacity 
          style={styles.syncButton}
          onPress={() => handleSync('Sales Data')}
          disabled={isLoading}
        >
          <Icon name="sync" size={20} color="white" />
          <Text style={styles.syncButtonText}>Sync Sales Data</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.syncButton}
          onPress={() => handleSync('Stock Levels')}
          disabled={isLoading}
        >
          <Icon name="package-variant" size={20} color="white" />
          <Text style={styles.syncButtonText}>Sync Stock Levels</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.syncButton}
          onPress={() => handleSync('Product Data')}
          disabled={isLoading}
        >
          <Icon name="database" size={20} color="white" />
          <Text style={styles.syncButtonText}>Sync Product Data</Text>
        </TouchableOpacity>
      </View>

      {syncResults.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sync Results</Text>
          {syncResults.map((result, index) => (
            <Text key={index} style={styles.syncResult}>
              {result}
          </Text>
          ))}
        </View>
      )}
    </ScrollView>
  );

  const renderRestockTab = () => (
    <View style={styles.restockContainer}>
      <View style={styles.categoryHeader}>
        <Text style={styles.categoryTitle}>Hair Accessories</Text>
        </View>

      <FlatList
        data={restockItems}
        renderItem={renderRestockItem}
        keyExtractor={(item) => item.id}
        style={styles.list}
        showsVerticalScrollIndicator={false}
      />
        </View>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'restock':
        return renderRestockTab();
      case 'online':
        return renderOnlineTab();
      case 'review':
        return renderReviewTab();
      case 'settings':
        return renderSettingsTab();
      default:
        return renderRestockTab();
    }
  };

  return (
    <View style={styles.screen}>
      <LinearGradient
        colors={['#39b878', '#2E9A65']}
        style={styles.header}
      >
        <View style={styles.headerLeft}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Icon name="arrow-left" size={24} color="#ffffff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Restocker</Text>
        </View>
      </LinearGradient>

      <View style={styles.contentWrapper}>
        {/* Tab Content */}
        <View style={styles.content}>
          {renderTabContent()}
        </View>

        {/* Bottom Navigation */}
        <View style={styles.bottomNavigation}>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'restock' && styles.activeTabButton]}
            onPress={() => setActiveTab('restock')}
          >
            <Icon 
              name="package-variant" 
              size={24} 
              color={activeTab === 'restock' ? '#39b878' : '#999'} 
            />
            <Text style={[
              styles.tabText, 
              { color: activeTab === 'restock' ? '#39b878' : '#999' }
            ]}>
              Restock
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'online' && styles.activeTabButton]}
            onPress={() => setActiveTab('online')}
          >
            <Icon 
              name="shopping" 
              size={24} 
              color={activeTab === 'online' ? '#39b878' : '#999'} 
            />
            <Text style={[
              styles.tabText, 
              { color: activeTab === 'online' ? '#39b878' : '#999' }
            ]}>
              Online
          </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'review' && styles.activeTabButton]}
            onPress={() => setActiveTab('review')}
          >
            <Icon 
              name="clipboard-check" 
              size={24} 
              color={activeTab === 'review' ? '#39b878' : '#999'} 
            />
            <Text style={[
              styles.tabText, 
              { color: activeTab === 'review' ? '#39b878' : '#999' }
            ]}>
              Review
                    </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'settings' && styles.activeTabButton]}
            onPress={() => setActiveTab('settings')}
          >
            <Icon 
              name="cog" 
              size={24} 
              color={activeTab === 'settings' ? '#39b878' : '#999'} 
            />
            <Text style={[
              styles.tabText, 
              { color: activeTab === 'settings' ? '#39b878' : '#999' }
            ]}>
              Settings
          </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Loading Overlay */}
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#39b878" />
          <Text style={styles.loadingText}>Syncing...</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#39b878',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 40,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginRight: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#ffffff',
  },
  contentWrapper: {
    backgroundColor: '#f5f5f5',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 60,
    marginTop: -20,
    flex: 1,
  },
  content: {
    flex: 1,
  },
  bottomNavigation: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    backgroundColor: '#FFFFFF',
  },
  tabButton: {
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  activeTabButton: {
    backgroundColor: 'rgba(57, 184, 120, 0.1)',
  },
  tabText: {
    fontSize: 12,
    marginTop: 4,
    fontWeight: '500',
  },
  restockContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  categoryHeader: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  list: {
    flex: 1,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    backgroundColor: '#FFFFFF',
  },
  itemImageContainer: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  itemImagePlaceholder: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemDetails: {
    flex: 1,
    marginRight: 16,
  },
  itemSku: {
    fontSize: 12,
    fontWeight: '500',
    color: '#666',
    marginBottom: 4,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  itemInstock: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  itemSold: {
    fontSize: 12,
    color: '#666',
  },
  itemQuantity: {
    alignItems: 'center',
    minWidth: 80,
  },
  quantityNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  quantityButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: '#FFFFFF',
  },
  tabPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  tabPlaceholderText: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 16,
    textAlign: 'center',
  },
  tabPlaceholderSubtext: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
    color: '#666',
    lineHeight: 20,
  },
  settingsContainer: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    color: '#333',
  },
  syncButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    gap: 12,
    backgroundColor: '#39b878',
  },
  syncButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  syncResult: {
    fontSize: 14,
    marginBottom: 8,
    paddingLeft: 16,
    color: '#666',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
}); 
