import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NavigationProps } from '../navigation/AppNavigator';
import { useAuth } from '../context/AuthContext';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const tools = [
  { id: '1', name: 'Cash Counter', icon: 'cash-register' },
  { id: '2', name: 'Product Search', icon: 'magnify' },
  { id: '3', name: 'Restocker', icon: 'package-variant' },
  { id: '4', name: 'Stocktaker', icon: 'clipboard-list' },
  { id: '5', name: 'Training Quiz', icon: 'school' },
  { id: '6', name: 'Brand Info', icon: 'information' },
];

/**
 * @returns {React.ReactElement} The main dashboard screen component.
 */
export default function DashboardScreen(): React.ReactElement {
  const navigation = useNavigation<NavigationProps>();
  const { user, store, logout } = useAuth();

  const handlePress = (toolName: string) => {
    if (toolName === 'Cash Counter') {
      navigation.navigate('CashCounter');
    } else if (toolName === 'Product Search') {
      navigation.navigate('ProductSearch', {});
    }
    // Add navigation for other tools here
  };

  const renderTool = ({ item }: { item: { id: string; name: string; icon: string } }) => (
    <TouchableOpacity style={styles.toolButton} onPress={() => handlePress(item.name)}>
      <Icon name={item.icon} size={32} color="#007AFF" style={styles.toolIcon} />
      <Text style={styles.toolText}>{item.name}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerItem} onPress={logout}>
          <Icon name="account-outline" size={24} color="#555" />
          <Text style={styles.headerText}>{user}</Text>
        </TouchableOpacity>
        <View style={styles.headerItem}>
          <Icon name="storefront-outline" size={24} color="#555" />
          <Text style={styles.headerText}>{store}</Text>
        </View>
      </View>
      <Text style={styles.title}>Handy</Text>
      <FlatList
        data={tools}
        renderItem={renderTool}
        keyExtractor={(item) => item.id}
        numColumns={2}
        style={styles.list}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 20,
  },
  headerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.05)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  headerText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
    textAlign: 'center',
  },
  list: {
    width: '100%',
  },
  toolButton: {
    backgroundColor: '#fff',
    padding: 20,
    margin: 10,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  toolIcon: {
    marginBottom: 8,
  },
  toolText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
}); 