import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  ScrollView,
  Button,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { useTheme } from '../../../../src/context/ThemeContext';
import { useProduct } from '../context/ProductContext';
import { RootStackParamList } from '../App';
import { syncCin7ToSupabase } from '../services/cin7Sync';

const SettingsScreen: React.FC = () => {
  const { colors, theme, toggleTheme } = useTheme();
  const [syncing, setSyncing] = useState(false);

  const handleSync = async () => {
    setSyncing(true);
    try {
      await syncCin7ToSupabase();
      Alert.alert('Sync Complete', 'Cin7 data has been synced to Supabase.');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred.';
      Alert.alert('Sync Failed', errorMessage);
    } finally {
      setSyncing(false);
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      flex: 1,
    },
    section: {
      marginBottom: 24,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 12,
      paddingHorizontal: 20,
    },
    settingItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 16,
      paddingHorizontal: 20,
      backgroundColor: colors.card,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    settingInfo: {
      flex: 1,
    },
    settingTitle: {
      fontSize: 16,
      color: colors.text,
      marginBottom: 4,
    },
    settingSubtitle: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    settingIcon: {
      color: colors.textSecondary,
      marginRight: 12,
    },
    version: {
      textAlign: 'center',
      color: colors.textSecondary,
      fontSize: 14,
      marginTop: 32,
      marginBottom: 20,
    },
    syncButton: {
      margin: 20,
      backgroundColor: '#39b878',
      borderRadius: 8,
      paddingVertical: 16,
      alignItems: 'center',
    },
    syncButtonText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: 'bold',
    },
  });

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content}>
        {/* Appearance */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Appearance</Text>
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Dark Mode</Text>
              <Text style={styles.settingSubtitle}>
                Use dark theme for better visibility
              </Text>
            </View>
            <Switch
              value={theme === 'dark'}
              onValueChange={toggleTheme}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={colors.card}
            />
          </View>
        </View>

        {/* Search Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Search</Text>
          <TouchableOpacity style={styles.settingItem}>
            <Icon name="search" size={20} style={styles.settingIcon} />
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Search History</Text>
              <Text style={styles.settingSubtitle}>
                Manage your recent searches
              </Text>
            </View>
            <Icon name="chevron-right" size={20} style={styles.settingIcon} />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.settingItem}>
            <Icon name="favorite" size={20} style={styles.settingIcon} />
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Favorites</Text>
              <Text style={styles.settingSubtitle}>
                View your favorite products
              </Text>
            </View>
            <Icon name="chevron-right" size={20} style={styles.settingIcon} />
          </TouchableOpacity>
        </View>

        {/* Notifications */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notifications</Text>
          <View style={styles.settingItem}>
            <Icon name="notifications" size={20} style={styles.settingIcon} />
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Low Stock Alerts</Text>
              <Text style={styles.settingSubtitle}>
                Get notified when products are running low
              </Text>
            </View>
            <Switch
              value={true}
              onValueChange={() => {}}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={colors.card}
            />
          </View>
          
          <View style={styles.settingItem}>
            <Icon name="price-change" size={20} style={styles.settingIcon} />
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Price Changes</Text>
              <Text style={styles.settingSubtitle}>
                Notify when product prices change
              </Text>
            </View>
            <Switch
              value={false}
              onValueChange={() => {}}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={colors.card}
            />
          </View>
        </View>

        {/* Data & Sync */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data & Sync</Text>
          <TouchableOpacity style={styles.settingItem}>
            <Icon name="sync" size={20} style={styles.settingIcon} />
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Sync Status</Text>
              <Text style={styles.settingSubtitle}>
                Last sync: 2 hours ago
              </Text>
            </View>
            <Icon name="chevron-right" size={20} style={styles.settingIcon} />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.settingItem}>
            <Icon name="storage" size={20} style={styles.settingIcon} />
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Clear Cache</Text>
              <Text style={styles.settingSubtitle}>
                Free up storage space
              </Text>
            </View>
            <Icon name="chevron-right" size={20} style={styles.settingIcon} />
          </TouchableOpacity>
        </View>

        {/* About */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <TouchableOpacity style={styles.settingItem}>
            <Icon name="info" size={20} style={styles.settingIcon} />
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>About Product View</Text>
              <Text style={styles.settingSubtitle}>
                Version 1.0.0
              </Text>
            </View>
            <Icon name="chevron-right" size={20} style={styles.settingIcon} />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.settingItem}>
            <Icon name="help" size={20} style={styles.settingIcon} />
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Help & Support</Text>
              <Text style={styles.settingSubtitle}>
                Get help and contact support
              </Text>
            </View>
            <Icon name="chevron-right" size={20} style={styles.settingIcon} />
          </TouchableOpacity>
        </View>

        <Text style={styles.version}>Product View v1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
};

export default SettingsScreen; 