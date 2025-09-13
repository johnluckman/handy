import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { createRestockService, RestockItem, RestockData } from '../services/restockService';
import { supabase } from '../services/supabase';

// Suppress React Native warning
import { LogBox } from 'react-native';
LogBox.ignoreLogs(['Text strings must be rendered within a <Text> component']);

interface RestockerScreenProps {
  route: {
    params: {
      location: 'newtown' | 'paddington';
    };
  };
}

export default function RestockerScreen({ route }: RestockerScreenProps) {
  const { location = 'newtown' } = route.params || {};
  const [activeTab, setActiveTab] = useState('restock');
  const [restockData, setRestockData] = useState<RestockData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updatingItem, setUpdatingItem] = useState<string | null>(null);

  const restockService = useMemo(() => createRestockService(location), [location]);

  const loadRestockData = useCallback(async () => {
    try {
      setLoading(true);
      // Only fetch items that need restocking (sold > 0)
      const items = await restockService.fetchItemsNeedingRestock();
      
      // Calculate totals for summary stats
      const totalSold = items.reduce((sum: number, item: RestockItem) => sum + (item.sold || 0), 0);
      const totalPicked = items.reduce((sum: number, item: RestockItem) => sum + (item.picked || 0), 0);
      const totalReview = items.reduce((sum: number, item: RestockItem) => sum + (item.review || 0), 0);
      const totalMissing = items.reduce((sum: number, item: RestockItem) => sum + (item.missing || 0), 0);
      
      const data = {
        items,
        totalSold,
        totalPicked,
        totalReview,
        totalMissing
      };
      
      console.log(`📊 Loaded ${items.length} items that need restocking`);
      setRestockData(data);
    } catch (error) {
      console.error('Error loading restock data:', error);
      Alert.alert('Error', 'Failed to load restock data');
    } finally {
      setLoading(false);
    }
  }, [restockService]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadRestockData();
    setRefreshing(false);
  }, [loadRestockData]);

  useEffect(() => {
    loadRestockData();
  }, [loadRestockData]);

  const handleIncrementPicked = async (itemId: string) => {
    try {
      setUpdatingItem(itemId);
      await restockService.incrementPicked(itemId);
      await loadRestockData(); // Refresh data
      Alert.alert('Success', 'Picked count updated');
    } catch (error) {
      console.error('Error incrementing picked:', error);
      Alert.alert('Error', 'Failed to update picked count');
    } finally {
      setUpdatingItem(null);
    }
  };

  const handleMarkAsReviewed = async (itemId: string) => {
    try {
      setUpdatingItem(itemId);
      await restockService.markAsReviewed(itemId);
      await loadRestockData(); // Refresh data
      Alert.alert('Success', 'Item marked as reviewed');
    } catch (error) {
      console.error('Error marking as reviewed:', error);
      Alert.alert('Error', 'Failed to mark item as reviewed');
    } finally {
      setUpdatingItem(null);
    }
  };

  const handleMarkAsStoreroomEmpty = async (itemId: string) => {
    try {
      setUpdatingItem(itemId);
      await restockService.markAsStoreroomEmpty(itemId);
      await loadRestockData(); // Refresh data
      Alert.alert('Success', 'Item marked as storeroom empty');
    } catch (error) {
      console.error('Error marking as storeroom empty:', error);
      Alert.alert('Error', 'Failed to mark item as storeroom empty');
    } finally {
      setUpdatingItem(null);
    }
  };

  const handleMarkAsMissing = async (itemId: string) => {
    try {
      setUpdatingItem(itemId);
      await restockService.markAsMissing(itemId);
      await loadRestockData(); // Refresh data
      Alert.alert('Success', 'Item marked as missing');
    } catch (error) {
      console.error('Error marking as missing:', error);
      Alert.alert('Error', 'Failed to mark item as missing');
    } finally {
      setUpdatingItem(null);
    }
  };

  const handleSyncSales = async () => {
    try {
      Alert.alert(
        'Restock Sales Sync',
        `This will sync today's sales from Cin7 and update restock quantities for ${location}. Continue?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Show Command', 
            style: 'default',
            onPress: async () => {
              console.log(`🚀 Starting restock sales sync for ${location}...`);
              console.log(`📦 Command to run: node scripts/restockSalesSync.js --location=${location}`);
              console.log(`📊 This will:`);
              console.log(`   - Sync today's sales from Cin7 to Supabase`);
              console.log(`   - Filter sales by location (${location === 'newtown' ? '279' : '255c'})`);
              console.log(`   - Update sold quantities in restock_${location} table`);
              console.log(`   - Process only location-specific sales data`);
              console.log(`✅ Sales sync command logged to terminal`);
              
              Alert.alert(
                'Sales Sync Command', 
                `Sales sync command logged to terminal.\n\nTo run the actual sync:\n\nnode scripts/restockSalesSync.js --location=${location}\n\nThis will sync today's sales and update restock quantities for ${location} only.`
              );
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error syncing sales:', error);
      Alert.alert('Error', 'Failed to sync sales data');
    }
  };

  const handleClearRestockTable = async () => {
    try {
      Alert.alert(
        'Reset Restock Quantities',
        `This will reset all sold, picked, returned, review, storeroom_empty, and missing quantities to 0 for ${location}. Product records will remain intact. Continue?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Reset', 
            style: 'default',
            onPress: async () => {
              try {
                // Reset all quantity fields to 0 but keep product records
                const { error } = await supabase
                  .from(`restock_${location}`)
                  .update({
                    sold: 0,
                    returned: 0,
                    picked: 0,
                    review: 0,
                    storeroom_empty: 0,
                    missing: 0,
                    last_updated: new Date().toISOString()
                  })
                  .gte('id', 0);
                
                if (error) throw error;
                
                Alert.alert('Success', `Restock quantities reset successfully for ${location}`);
                await loadRestockData(); // Refresh data
              } catch (error) {
                console.error('Error resetting restock quantities:', error);
                Alert.alert('Error', 'Failed to reset restock quantities');
              }
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error resetting restock quantities:', error);
      Alert.alert('Error', 'Failed to reset restock quantities');
    }
  };

  const handleClearSalesData = async () => {
    try {
      Alert.alert(
        'Clear Sales Data',
        'This will clear all data from the sales and sale_items tables. This action cannot be undone. Continue?',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Clear', 
            style: 'destructive',
            onPress: async () => {
              try {
                // Clear sale_items first (due to foreign key constraints)
                const { error: itemsError } = await supabase
                  .from('sale_items')
                  .delete()
                  .gte('id', 0);
                
                if (itemsError) throw itemsError;
                
                // Then clear sales
                const { error: salesError } = await supabase
                  .from('sales')
                  .delete()
                  .gte('id', 0);
                
                if (salesError) throw salesError;
                
                Alert.alert('Success', 'Sales data cleared successfully');
              } catch (error) {
                console.error('Error clearing sales data:', error);
                Alert.alert('Error', 'Failed to clear sales data');
              }
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error clearing sales data:', error);
      Alert.alert('Error', 'Failed to clear sales data');
    }
  };

  const handleRestockProductSync = async () => {
    try {
      Alert.alert(
        'Sync Product Data',
        `This will sync product data from the products database to the restock_${location} table. This will overwrite existing product data. Continue?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Sync', 
            style: 'default',
            onPress: async () => {
              try {
                console.log(`🚀 Starting product sync for ${location}...`);
                console.log(`📦 Command to run: node scripts/restockProductSync.js --location=${location}`);
                console.log(`📊 This will populate the restock_${location} table with product data`);
                console.log(`🔄 The script will:`);
                console.log(`   - Fetch products from the products database`);
                console.log(`   - Create restock records in restock_${location}`);
                console.log(`   - Map: id, product_id, option_product_id, productOptionCode, name, option1, option2, option3`);
                console.log(`   - Initialize all quantity fields to 0`);
                console.log(`   - Set last_updated timestamp`);
                console.log(`✅ Product sync information logged to terminal`);
                
                // Show progress alert
                Alert.alert(
                  'Product Sync Info', 
                  `Product sync details logged to terminal.\n\nTo run the actual sync:\n\nnode scripts/restockProductSync.js --location=${location}`
                );
                
              } catch (error) {
                console.error('Error syncing products:', error);
                Alert.alert('Error', 'Failed to sync product data');
              }
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error syncing products:', error);
      Alert.alert('Error', 'Failed to sync product data');
    }
  };

  const renderRestockItem = ({ item }: { item: RestockItem }) => {
    const needsRestock = item.sold > item.picked;
    const isInReview = item.review === 1;
    const isStoreroomEmpty = item.storeroom_empty === 1;
    const isMissing = item.missing === 1;

    return (
      <View style={styles.itemCard}>
        <View style={styles.itemHeader}>
          <Text style={styles.itemName} numberOfLines={2}>
            {item.name}
          </Text>
          <Text style={styles.itemSku}>{item.productOptionCode}</Text>
        </View>

        <View style={styles.itemDetails}>
          <View style={styles.quantityRow}>
            <Text style={styles.quantityLabel}>Sold:</Text>
            <Text style={[styles.quantityValue, styles.soldQuantity]}>{item.sold}</Text>
          </View>
          
          <View style={styles.quantityRow}>
            <Text style={styles.quantityLabel}>Picked:</Text>
            <Text style={[styles.quantityValue, styles.pickedQuantity]}>{item.picked}</Text>
            {needsRestock && (
              <TouchableOpacity
                style={styles.incrementButton}
                onPress={() => handleIncrementPicked(item.id)}
                disabled={updatingItem === item.id}
              >
                {updatingItem === item.id ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Ionicons name="add" size={16} color="#fff" />
                )}
              </TouchableOpacity>
            )}
          </View>

          {item.option1 && (
            <Text style={styles.itemOption}>Option: {item.option1}</Text>
          )}
        </View>

        <View style={styles.statusRow}>
          {isInReview && (
            <View style={[styles.statusBadge, styles.reviewBadge]}>
              <Text style={styles.statusText}>Review</Text>
            </View>
          )}
          {isStoreroomEmpty && (
            <View style={[styles.statusBadge, styles.storeroomBadge]}>
              <Text style={styles.statusText}>Storeroom Empty</Text>
            </View>
          )}
          {isMissing && (
            <View style={[styles.statusBadge, styles.missingBadge]}>
              <Text style={styles.statusText}>Missing</Text>
            </View>
          )}
        </View>

        <View style={styles.actionRow}>
          {!isInReview && !isStoreroomEmpty && !isMissing && (
            <TouchableOpacity
              style={[styles.actionButton, styles.reviewButton]}
              onPress={() => handleMarkAsReviewed(item.id)}
              disabled={updatingItem === item.id}
            >
              <Text style={styles.actionButtonText}>Mark Review</Text>
            </TouchableOpacity>
          )}
          
          {!isStoreroomEmpty && (
            <TouchableOpacity
              style={[styles.actionButton, styles.storeroomButton]}
              onPress={() => handleMarkAsStoreroomEmpty(item.id)}
              disabled={updatingItem === item.id}
            >
              <Text style={styles.actionButtonText}>Storeroom Empty</Text>
            </TouchableOpacity>
          )}
          
          {!isMissing && (
            <TouchableOpacity
              style={[styles.actionButton, styles.missingButton]}
              onPress={() => handleMarkAsMissing(item.id)}
              disabled={updatingItem === item.id}
            >
              <Text style={styles.actionButtonText}>Mark Missing</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'restock':
        if (loading) {
          return (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#007AFF" />
              <Text style={styles.loadingText}>Loading restock data...</Text>
            </View>
          );
        }

        if (!restockData || restockData.items.length === 0) {
          return (
            <View style={styles.emptyContainer}>
              <Ionicons name="cube-outline" size={64} color="#8E8E93" />
              <Text style={styles.emptyText}>No items need restocking</Text>
              <Text style={styles.emptySubtext}>All items are up to date</Text>
            </View>
          );
        }

        return (
          <FlatList
            data={restockData.items}
            renderItem={renderRestockItem}
            keyExtractor={(item) => item.id}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            contentContainerStyle={styles.listContainer}
          />
        );

      case 'online':
        return (
          <View style={styles.tabContent}>
            <Text style={styles.tabText}>Online Orders</Text>
            <Text style={styles.comingSoon}>Coming Soon</Text>
          </View>
        );

      case 'review':
        if (!restockData) return null;
        
        const reviewItems = restockData.items.filter(item => item.review === 1);
        
        return (
          <View style={styles.tabContent}>
            <Text style={styles.tabText}>Items Under Review</Text>
            {reviewItems.length === 0 ? (
              <Text style={styles.noItemsText}>No items under review</Text>
            ) : (
              <FlatList
                data={reviewItems}
                renderItem={renderRestockItem}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContainer}
              />
            )}
          </View>
        );

      case 'settings':
        return (
          <View style={styles.tabContent}>
            <Text style={styles.tabText}>Settings</Text>
            <TouchableOpacity style={styles.syncButton} onPress={onRefresh}>
              <Ionicons name="refresh" size={20} color="#007AFF" />
              <Text style={styles.syncButtonText}>Sync Stock Data</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.syncButton} onPress={handleSyncSales}>
              <Ionicons name="sync" size={20} color="#34C759" />
              <Text style={styles.syncButtonText}>Restock Sales Sync</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.syncButton} onPress={handleRestockProductSync}>
              <Ionicons name="cube" size={20} color="#AF52DE" />
              <Text style={styles.syncButtonText}>Sync Product Data</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.syncButton} onPress={handleClearRestockTable}>
              <Ionicons name="refresh-circle" size={20} color="#FF3B30" />
              <Text style={styles.syncButtonText}>Reset Restock Quantities</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.syncButton} onPress={handleClearSalesData}>
              <Ionicons name="trash-outline" size={20} color="#FF9500" />
              <Text style={styles.syncButtonText}>Clear Sales Data</Text>
            </TouchableOpacity>
          </View>
        );

      default:
        return null;
    }
  };

  if (!restockData && !loading) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={64} color="#FF3B30" />
        <Text style={styles.errorText}>Failed to load restock data</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadRestockData}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={['#007AFF', '#0056CC']}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>Restocker</Text>
        <Text style={styles.headerSubtitle}>{location.charAt(0).toUpperCase() + location.slice(1)}</Text>
      </LinearGradient>

      {/* Summary Stats */}
      {restockData && (
        <View style={styles.summaryContainer}>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryNumber}>{restockData.totalSold}</Text>
              <Text style={styles.summaryLabel}>Sold</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryNumber}>{restockData.totalPicked}</Text>
              <Text style={styles.summaryLabel}>Picked</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryNumber}>{restockData.totalReview}</Text>
              <Text style={styles.summaryLabel}>Review</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryNumber}>{restockData.totalMissing}</Text>
              <Text style={styles.summaryLabel}>Missing</Text>
            </View>
          </View>
        </View>
      )}

      {/* Tabs */}
      <View style={styles.tabContainer}>
        {['restock', 'online', 'review', 'settings'].map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.activeTab]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Tab Content */}
      {renderTabContent()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 18,
    color: '#FFFFFF',
    textAlign: 'center',
    marginTop: 5,
    opacity: 0.9,
  },
  summaryContainer: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 4,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: '#007AFF',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8E8E93',
  },
  activeTabText: {
    color: '#FFFFFF',
  },
  tabContent: {
    flex: 1,
    padding: 16,
  },
  listContainer: {
    paddingBottom: 20,
  },
  itemCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  itemHeader: {
    marginBottom: 12,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
  },
  itemSku: {
    fontSize: 14,
    color: '#8E8E93',
    fontFamily: 'monospace',
  },
  itemDetails: {
    marginBottom: 12,
  },
  quantityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  quantityLabel: {
    fontSize: 14,
    color: '#8E8E93',
    width: 60,
  },
  quantityValue: {
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },
  soldQuantity: {
    color: '#FF3B30',
  },
  pickedQuantity: {
    color: '#34C759',
  },
  incrementButton: {
    backgroundColor: '#34C759',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemOption: {
    fontSize: 12,
    color: '#8E8E93',
    fontStyle: 'italic',
  },
  statusRow: {
    flexDirection: 'row',
    marginBottom: 12,
    flexWrap: 'wrap',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
    marginBottom: 4,
  },
  reviewBadge: {
    backgroundColor: '#FF9500',
  },
  storeroomBadge: {
    backgroundColor: '#007AFF',
  },
  missingBadge: {
    backgroundColor: '#FF3B30',
  },
  statusText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  actionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  reviewButton: {
    backgroundColor: '#FF9500',
    borderColor: '#FF9500',
  },
  storeroomButton: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  missingButton: {
    backgroundColor: '#FF3B30',
    borderColor: '#FF3B30',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#8E8E93',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#8E8E93',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 8,
  },
  comingSoon: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    marginTop: 20,
  },
  noItemsText: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    marginTop: 20,
  },
  syncButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
  },
  syncButtonText: {
    marginLeft: 12,
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FF3B30',
    marginTop: 16,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
}); 
