import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Switch,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Calendar } from 'react-native-calendars';
import { Users } from 'lucide-react-native';
import Toast from 'react-native-toast-message';
import { fetchCoachAssignedPlayers, getToken, getUser, recordAttendance } from '../../api';

const AttendancePage = () => {
  // Helper to get current date in YYYY-MM-DD format
  const getTodayDateString = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [selectedDate, setSelectedDate] = useState(getTodayDateString());
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await getUser();
        if (userData) {
          setUser(userData);
        }
      } catch (error) {
        console.error('Error loading user:', error);
      }
    };
    loadUser();
  }, []);

  useEffect(() => {
    if (user?.id) {
      loadPlayers();
    }
  }, [user]);

  const loadPlayers = async () => {
    try {
      setLoading(true);
      const token = await getToken();
      if (!token) {
        Toast.show({ type: 'error', text1: 'Error', text2: 'No auth token found' });
        return;
      }

      const playersData = await fetchCoachAssignedPlayers(token);
      const initializedPlayers = playersData.map(player => ({
        ...player,
        present: false,
      }));
      
      setPlayers(initializedPlayers);
    } catch (error) {
      Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to load players' });
    } finally {
      setLoading(false);
    }
  };

  const toggleAttendance = (id) => {
    setPlayers(prev => prev.map(p => 
      p.id === id ? { ...p, present: !p.present } : p
    ));
  };

  const handleSubmit = async () => {
    // 1. RE-FETCH ACTUAL DATE: Ensure we use "now" for the database entry
    const actualToday = getTodayDateString();
    
    const presentPlayers = players.filter(p => p.present);

    if (presentPlayers.length === 0) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Please mark at least one player present. ❌',
      });
      return;
    }

    setSubmitting(true);
    try {
      const token = await getToken();
      let successCount = 0;

      for (const player of presentPlayers) {
        const attendanceData = {
          playerId: player.id,
          attendanceDate: actualToday, // FIXED: Always uses current system date
          isPresent: true,
          coachId: user.id,
        };

        await recordAttendance(attendanceData, token);
        successCount++;
      }

      Toast.show({
        type: 'success',
        text1: 'Success!',
        text2: `Attendance saved for today (${actualToday}) ✅`,
      });
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Submission Failed',
        text2: error.message,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const renderPlayer = ({ item }) => (
    <View style={styles.playerRow}>
      <View style={styles.playerInfo}>
        <View style={styles.avatar}><Text style={styles.avatarText}>{item.name[0]}</Text></View>
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
          thumbColor={item.present ? '#fff' : '#999'}
        />
      </View>
    </View>
  );

  return (
    <>
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.card}>
            <View style={styles.headerRow}>
              <Users size={18} color="#000" />
              <Text style={styles.cardTitle}>Daily Attendance</Text>
            </View>
            <Text style={styles.subTitle}>Marking for today: {getTodayDateString()}</Text>
            
            {loading ? (
              <ActivityIndicator size="large" color="#3b82f6" />
            ) : (
              <FlatList
                data={players}
                renderItem={renderPlayer}
                keyExtractor={item => item.id.toString()}
                scrollEnabled={false}
              />
            )}

            <TouchableOpacity 
              style={[styles.submitButton, submitting && styles.disabledButton]} 
              onPress={handleSubmit}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitText}>Submit Attendance for Today</Text>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>History View</Text>
            <Calendar
              current={getTodayDateString()}
              onDayPress={day => setSelectedDate(day.dateString)}
              markedDates={{
                [selectedDate]: { selected: true, selectedColor: '#3b82f6' }
              }}
              maxDate={getTodayDateString()} // Prevent selecting future dates
            />
          </View>
        </ScrollView>
      </SafeAreaView>
      <Toast />
    </>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  scrollContent: { padding: 16 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 16, elevation: 2 },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  cardTitle: { fontSize: 16, fontWeight: '700', marginLeft: 8 },
  subTitle: { fontSize: 13, color: '#64748b', marginBottom: 16 },
  playerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#f1f5f9', padding: 10, borderRadius: 8, marginBottom: 8 },
  playerInfo: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#3b82f6', justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  avatarText: { color: '#fff', fontWeight: 'bold', fontSize: 12 },
  playerName: { fontSize: 14, fontWeight: '500' },
  statusContainer: { flexDirection: 'row', alignItems: 'center' },
  statusText: { fontSize: 13, fontWeight: '500', marginRight: 8 },
  submitButton: { backgroundColor: '#3b82f6', padding: 15, borderRadius: 8, alignItems: 'center', marginTop: 10 },
  disabledButton: { backgroundColor: '#94a3b8' },
  submitText: { color: '#fff', fontWeight: 'bold' },
});

export default AttendancePage;