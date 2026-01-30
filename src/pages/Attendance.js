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
  Modal,
  Pressable,
} from 'react-native';
import { Calendar } from 'react-native-calendars';
import { Users, Calendar as CalendarIcon, X } from 'lucide-react-native';
import Toast from 'react-native-toast-message';
import { fetchCoachAssignedPlayers, getToken, getUser, recordAttendance } from '../../api';

const AttendancePage = () => {
  const getTodayDateString = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  // State
  const [selectedDate, setSelectedDate] = useState(getTodayDateString());
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [user, setUser] = useState(null);
  
  // Modal State for History
  const [historyVisible, setHistoryVisible] = useState(false);
  const [historyData, setHistoryData] = useState([]);
  const [fetchingHistory, setFetchingHistory] = useState(false);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await getUser();
        if (userData) setUser(userData);
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

  // --- History Logic ---
  const handleDayPress = async (day) => {
    setSelectedDate(day.dateString);
    setHistoryVisible(true);
    setFetchingHistory(true);
    
    try {
      const token = await getToken();
      const mockHistory = players.map(p => ({
        ...p,
        status: Math.random() > 0.3 ? 'Present' : 'Absent'
      }));
      
      setHistoryData(mockHistory);
    } catch (error) {
      Toast.show({ type: 'error', text1: 'Error', text2: 'Could not fetch history' });
    } finally {
      setFetchingHistory(false);
    }
  };

  const toggleAttendance = (id) => {
    setPlayers(prev => prev.map(p => 
      p.id === id ? { ...p, present: !p.present } : p
    ));
  };

  const handleSubmit = async () => {
    const actualToday = getTodayDateString();
    const presentPlayers = players.filter(p => p.present);

    if (presentPlayers.length === 0) {
      Toast.show({ type: 'error', text1: 'Error', text2: 'Please mark at least one player present.' });
      return;
    }

    setSubmitting(true);
    try {
      const token = await getToken();
      for (const player of presentPlayers) {
        await recordAttendance({
          playerId: player.id,
          attendanceDate: actualToday,
          isPresent: true,
          coachId: user.id,
        }, token);
      }
      Toast.show({ type: 'success', text1: 'Success!', text2: 'Attendance saved ✅' });
    } catch (error) {
      Toast.show({ type: 'error', text1: 'Failed', text2: error.message });
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
          thumbColor={item.present ? '#fff' : '#f4f4f4'}
        />
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.card}>
          <View style={styles.headerRow}>
            <Users size={18} color="#000" />
            <Text style={styles.cardTitle}>Daily Attendance</Text>
          </View>
          <Text style={styles.subTitle}>Marking for: {getTodayDateString()}</Text>
          
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

          <View style={styles.centerWrapper}>
  <TouchableOpacity 
    style={[styles.submitButton, submitting && styles.disabledButton]} 
    onPress={handleSubmit}
    disabled={submitting}
  >
    {submitting ? (
      <ActivityIndicator color="#fff" />
    ) : (
      <Text style={styles.submitText}>Submit Attendance</Text>
    )}
  </TouchableOpacity>
</View>
        </View>

        {/* History Card */}
        <View style={styles.card}>
          <View style={styles.headerRow}>
            <CalendarIcon size={18} color="#000" />
            <Text style={styles.cardTitle}>Attendance History</Text>
          </View>
          <Text style={styles.subTitle}>Click a date to view records</Text>
          <Calendar
            current={getTodayDateString()}
            onDayPress={handleDayPress}
            markedDates={{
              [selectedDate]: { selected: true, selectedColor: '#3b82f6' },
              [getTodayDateString()]: { marked: true, dotColor: '#3b82f6' }
            }}
            maxDate={getTodayDateString()}
            theme={{
              todayTextColor: '#3b82f6',
              selectedDayBackgroundColor: '#3b82f6',
              arrowColor: '#3b82f6',
            }}
          />
        </View>
      </ScrollView>

      {/* History Popup Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={historyVisible}
        onRequestClose={() => setHistoryVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>History: {selectedDate}</Text>
              <TouchableOpacity onPress={() => setHistoryVisible(false)}>
                <X size={20} color="#64748b" />
              </TouchableOpacity>
            </View>

            {fetchingHistory ? (
              <ActivityIndicator style={{ margin: 20 }} color="#3b82f6" />
            ) : (
              <ScrollView style={styles.historyList}>
                {historyData.map((item, index) => (
                  <View key={index} style={styles.historyRow}>
                    <Text style={styles.historyName}>{item.name}</Text>
                    <View style={[styles.badge, { backgroundColor: item.status === 'Present' ? '#dcfce7' : '#fee2e2' }]}>
                      <Text style={[styles.badgeText, { color: item.status === 'Present' ? '#166534' : '#991b1b' }]}>
                        {item.status}
                      </Text>
                    </View>
                  </View>
                ))}
              </ScrollView>
            )}
            
            <TouchableOpacity 
              style={styles.closeButton} 
              onPress={() => setHistoryVisible(false)}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Toast />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  scrollContent: { padding: 16 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 16, elevation: 3, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4 },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  cardTitle: { fontSize: 16, fontWeight: '700', marginLeft: 8, color: '#1e293b' },
  subTitle: { fontSize: 13, color: '#64748b', marginBottom: 16 },
  
  // Player List
  playerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#f8fafc', padding: 10, borderRadius: 8, marginBottom: 8, borderWidth: 1, borderColor: '#e2e8f0' },
  playerInfo: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 30, height: 30, borderRadius: 15, backgroundColor: '#3b82f6', justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  avatarText: { color: '#fff', fontWeight: 'bold', fontSize: 12 },
  playerName: { fontSize: 14, fontWeight: '500', color: '#334155' },
  statusContainer: { flexDirection: 'row', alignItems: 'center' },
  statusText: { fontSize: 11, fontWeight: '600', marginRight: 8 }, // Fixed font size 11
  
  // Buttons
  submitButton: { backgroundColor: '#3b82f6', padding: 14, borderRadius: 10, alignItems: 'center', marginTop: 10 },
  disabledButton: { backgroundColor: '#94a3b8' },
  submitText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },

  // Modal Styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { backgroundColor: '#fff', width: '100%', borderRadius: 16, padding: 20, maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, borderBottomWidth: 1, borderBottomColor: '#f1f5f9', pb: 10 },
  modalTitle: { fontSize: 16, fontWeight: 'bold', color: '#1e293b' },
  historyList: { marginBottom: 20 },
  historyRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f8fafc' },
  historyName: { fontSize: 11, color: '#334155', fontWeight: '500' }, // Fixed font size 11
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  badgeText: { fontSize: 10, fontWeight: 'bold' }, // Badge slightly smaller for design
  closeButton: { backgroundColor: '#f1f5f9', padding: 12, borderRadius: 10, alignItems: 'center' },
  closeButtonText: { color: '#475569', fontWeight: '700', fontSize: 14 }
  
});

export default AttendancePage;