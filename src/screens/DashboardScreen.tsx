import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';

const tools = [
  { id: '1', name: 'Cash Counter' },
  { id: '2', name: 'Restocker' },
  { id: '3', name: 'Stocktaker' },
  { id: '4', name: 'Training Quiz' },
  { id: '5', name: 'Brand Info' },
];

export default function DashboardScreen() {
  const renderTool = ({ item }: { item: { id: string; name: string } }) => (
    <TouchableOpacity style={styles.toolButton}>
      <Text style={styles.toolText}>{item.name}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Handy Toolkit</Text>
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
    alignItems: 'center',
    paddingTop: 80,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 40,
    color: '#333',
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
  toolText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
}); 