import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Switch,
  SafeAreaView,
  Dimensions
} from 'react-native';
import { Calendar } from 'react-native-calendars';
import { Users } from 'lucide-react-native';
import Toast from 'react-native-toast-message'; // 1. Import Toast

const { width } = Dimensions.get('window');

const AttendancePage = () => {
  const [selectedDate, setSelectedDate] = useState('2026-01-23');
  const [players, setPlayers] = useState([
    { id: '1', name: 'Sagar', present: true },
    { id: '2', name: 'Sagar Patil', present: true },
  ]);

  const toggleAttendance = (id) => {
    setPlayers(prev => prev.map(p => 
      p.id === id ? { ...p, present: !p.present } : p
    ));
  };

  // 2. Logic for Toast Popups
  const handleSubmit = () => {
    const presentCount = players.filter(p => p.present).length;

    if (presentCount === 0) {
      Toast.show({
        type: 'error',
        text1: 'Submission Failed',
        text2: 'Please mark at least one player as present. ❌',
        position: 'top',
      });
    } else {
      Toast.show({
        type: 'success',
        text1: 'Success!',
        text2: `Attendance for ${presentCount} players saved for ${selectedDate} ✅`,
        position: 'top',
        visibilityTime: 4000,
      });
    }
  };

  const renderPlayer = ({ item }) => (
    <View style={styles.playerRow}>
      <View style={styles.playerInfo}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{item.name[0]}</Text>
        </View>
        <Text style={styles.playerName}>{item.name}</Text>
      </View>
      <View style={styles.statusContainer}>
        <Text style={[styles.statusText, { color: item.present ? '#22c55e' : '#ef4444' }]}>
          {item.present ? 'Present' : 'Absent'}
        </Text>
        <Switch
          value={item.present}
          onValueChange={() => toggleAttendance(item.id)}
          trackColor={{ false: '#cbd5e1', true: '#3b82f6' }}
          thumbColor="#fff"
        />
      </View>
    </View>
  );

  return (
    <>
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          
          {/* Attendance Card */}
          <View style={styles.card}>
            <View style={styles.headerRow}>
              <Users size={20} color="#000" />
              <Text style={styles.cardTitle}>Mark Attendance</Text>
            </View>
            <Text style={styles.subTitle}>Mark player's attendance for: {selectedDate}</Text>
            
            <View style={styles.listContainer}>
              <FlatList
                data={players}
                renderItem={renderPlayer}
                keyExtractor={item => item.id}
                showsVerticalScrollIndicator={true}
              />
            </View>

            <TouchableOpacity 
                style={styles.submitButton} 
                onPress={handleSubmit} // 3. Link the function
            >
              <Text style={styles.submitText}>Submit Attendance</Text>
            </TouchableOpacity>
          </View>

          {/* Calendar Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Calendar</Text>
            <Text style={styles.subTitle}>Select date to view/mark attendance</Text>
            
            <Calendar
              current={selectedDate}
              onDayPress={day => setSelectedDate(day.dateString)}
              markedDates={{
                [selectedDate]: { selected: true, selectedColor: '#3b82f6' }
              }}
              theme={{
                todayTextColor: '#3b82f6',
                arrowColor: '#3b82f6',
              }}
            />
          </View>
        </View>
      </SafeAreaView>
      
      {/* 4. MUST INCLUDE Toast component at the end of the JSX */}
      <Toast />
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  content: {
    padding: 16,
    gap: 20,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
  },
  subTitle: {
    fontSize: 13,
    color: '#64748b',
    marginBottom: 16,
  },
  listContainer: {
    maxHeight: 200,
    marginBottom: 16,
  },
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f1f5f9',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  playerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  playerName: {
    fontSize: 15,
    fontWeight: '500',
    color: '#334155',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
  },
  submitButton: {
    backgroundColor: '#3b82f6',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});

export default AttendancePage;