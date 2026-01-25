import React from 'react';
import { StyleSheet, Text, View, FlatList, TextInput, TouchableOpacity, SafeAreaView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons'; 

const DATA = [
  { id: '1', player: 'Sagar Patil', date: 'Jan 20, 2026', status: 'Present', markedBy: 'Noor', time: '21:33:42' },
  { id: '2', player: 'Sagar Patil', date: 'Jan 20, 2026', status: 'Present', markedBy: 'Noor', time: '21:32:58' },
  { id: '3', player: 'Sagar Patil', date: 'Jan 20, 2026', status: 'Present', markedBy: 'Noor', time: '20:48:51' },
];

const AttendancePage = () => {
  const renderItem = ({ item }) => (
    <View style={styles.row}>
      <Text style={[styles.cell, { flex: 2 }]}>{item.player}</Text>
      <Text style={[styles.cell, { flex: 1.5 }]}>{item.date}</Text>
      <View style={[styles.cell, { flex: 1.5 }]}>
        <View style={styles.statusBadge}>
          <Text style={styles.statusText}>{item.status}</Text>
        </View>
      </View>
      <Text style={[styles.cell, { flex: 1 }]}>{item.time}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Attendance Records</Text>
        <Text style={styles.subtitle}>View and manage attendance history</Text>
      </View>
      <View style={styles.filterContainer}>
        <TextInput 
          style={styles.searchInput} 
          placeholder="Search players..." 
        />
        <TouchableOpacity style={styles.exportButton}>
          <MaterialCommunityIcons name="download" size={16} color="#007AFF" />
          <Text style={styles.exportText}>Export</Text>
        </TouchableOpacity>
      </View>

      {/* Table Header */}
      <View style={styles.tableHeader}>
        <Text style={[styles.headerLabel, { flex: 2 }]}>Player</Text>
        <Text style={[styles.headerLabel, { flex: 1.5 }]}>Date</Text>
        <Text style={[styles.headerLabel, { flex: 1.5 }]}>Status</Text>
        <Text style={[styles.headerLabel, { flex: 1 }]}>Time</Text>
      </View>

      <FlatList
        data={DATA}
        renderItem={renderItem}
        keyExtractor={item => item.id}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA', padding: 16 },
  header: { marginBottom: 20 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#333' },
  subtitle: { fontSize: 14, color: '#666' },
  filterContainer: { flexDirection: 'row', marginBottom: 15, alignItems: 'center' },
  searchInput: { 
    flex: 1, 
    height: 40, 
    backgroundColor: '#FFF', 
    borderRadius: 8, 
    paddingHorizontal: 12, 
    borderWidth: 1, 
    borderColor: '#DDD' 
  },
  exportButton: { 
    flexDirection: 'row', 
    marginLeft: 10, 
    padding: 10, 
    borderRadius: 8, 
    borderWidth: 1, 
    borderColor: '#007AFF', 
    alignItems: 'center' 
  },
  exportText: { color: '#007AFF', marginLeft: 5, fontWeight: '600' },
  tableHeader: { 
    flexDirection: 'row', 
    paddingVertical: 12, 
    borderBottomWidth: 1, 
    borderBottomColor: '#EEE', 
    backgroundColor: '#FFF' 
  },
  headerLabel: { fontWeight: '600', color: '#888', fontSize: 12 },
  row: { 
    flexDirection: 'row', 
    paddingVertical: 15, 
    borderBottomWidth: 1, 
    borderBottomColor: '#F0F0F0', 
    alignItems: 'center' 
  },
  cell: { fontSize: 13, color: '#444' },
  statusBadge: { 
    backgroundColor: '#E6F7EF', 
    paddingHorizontal: 8, 
    paddingVertical: 4, 
    borderRadius: 12, 
    alignSelf: 'flex-start' 
  },
  statusText: { color: '#28A745', fontSize: 11, fontWeight: 'bold' }
});

export default AttendancePage;