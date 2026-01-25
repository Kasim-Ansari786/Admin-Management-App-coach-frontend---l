import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
  SafeAreaView,
} from "react-native";
import { Calendar } from "react-native-calendars";
import { 
  Plus, 
  Clock, 
  MapPin, 
  Edit, 
  Trash2,
  X
} from "lucide-react-native";
// Import the Toast library
import Toast from 'react-native-toast-message';

const eventColors = {
  training: "#1A9CFF",
  match: "#10b981",
  meeting: "#f59e0b",
  tournament: "#a855f7",
  default: "#6b7280"
};

export default function Schedule() {
  // Default user object (no useAuth available)
  const user = { tenant_id: 1, id: 'coach_default' };
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);

  const [formData, setFormData] = useState({
    title: "",
    type: "training",
    date: "",
    time: "",
    duration: "1h",
    location: "",
    team: "All Teams",
    description: "",
  });

  useEffect(() => {
    fetchSchedule();
  }, []);

  const fetchSchedule = async () => {
    if (!user?.tenant_id) return;
    try {
      setIsLoading(true);
      const data = await GetScheduleRecords(user.tenant_id, user.id);
      const mappedData = (Array.isArray(data) ? data : []).map((event) => ({
        ...event,
        type: event.event_type || 'training',
        date: (event.event_date || "").split("T")[0],
        time: event.event_time,
      }));
      setEvents(mappedData);
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Load Failed',
        text2: 'Could not retrieve your schedule. 🛑'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveEvent = async () => {
    if (!formData.title || !formData.date || !formData.time) {
      Toast.show({
        type: 'error',
        text1: 'Missing Information',
        text2: 'Please fill in title, date, and time.'
      });
      return;
    }

    try {
      const payload = {
        ...formData,
        event_type: formData.type,
        event_date: formData.date,
        event_time: formData.time,
        tenant_id: user?.tenant_id || 1,
      };

      if (editingEvent) {
        await updateScheduleEvent(editingEvent.id, payload);
        Toast.show({
          type: 'success',
          text1: 'Event Updated',
          text2: 'Your changes have been saved. ✅'
        });
      } else {
        await addScheduleEvent(payload);
        Toast.show({
          type: 'success',
          text1: 'Event Created',
          text2: 'The new event was added to your schedule. 🎉'
        });
      }
      
      setIsModalOpen(false);
      setEditingEvent(null);
      fetchSchedule();
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to save event. Please try again.'
      });
    }
  };

  const handleDelete = (event) => {
    Alert.alert("Delete Event", `Are you sure you want to delete ${event.title}?`, [
      { text: "Cancel", style: "cancel" },
      { 
        text: "Delete", 
        style: "destructive", 
        onPress: async () => {
          try {
            await deleteScheduleEvent(event.id, user?.tenant_id || 1);
            Toast.show({
              type: 'info',
              text1: 'Event Deleted',
              text2: 'The event was removed.'
            });
            fetchSchedule();
          } catch (e) {
            Toast.show({ type: 'error', text1: 'Delete failed' });
          }
        } 
      },
    ]);
  };

  const markedDates = useMemo(() => {
    const marks = {};
    events.forEach(event => {
      marks[event.date] = {
        marked: true,
        dotColor: eventColors[event.type] || eventColors.default
      };
    });
    if (selectedDate) {
      marks[selectedDate] = { 
        ...marks[selectedDate], 
        selected: true, 
        selectedColor: '#1A9CFF' 
      };
    }
    return marks;
  }, [events, selectedDate]);

  const filteredEvents = events.filter(e => e.date === selectedDate);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Schedule</Text>
            <Text style={styles.subtitle}>Manage training and matches</Text>
          </View>
          <TouchableOpacity 
            style={styles.addButton}
            onPress={() => {
              setEditingEvent(null);
              setFormData({ 
                title: "", 
                type: "training", 
                date: selectedDate, 
                time: "", 
                duration: "1h", 
                location: "" 
              });
              setIsModalOpen(true);
            }}
          >
            <Plus color="#fff" size={20} />
          </TouchableOpacity>
        </View>

        {/* Calendar View */}
        <View style={styles.calendarCard}>
          <Calendar
            onDayPress={(day) => setSelectedDate(day.dateString)}
            markedDates={markedDates}
            theme={{
              todayTextColor: '#1A9CFF',
              arrowColor: '#1A9CFF',
              indicatorColor: '#1A9CFF',
              selectedDayBackgroundColor: '#1A9CFF',
            }}
          />
        </View>

        {/* Events List */}
        <View style={styles.eventListHeader}>
          <Text style={styles.sectionTitle}>Events for {selectedDate}</Text>
        </View>

        {isLoading ? (
          <ActivityIndicator color="#1A9CFF" style={{ marginTop: 20 }} />
        ) : filteredEvents.length > 0 ? (
          filteredEvents.map((event) => (
            <View key={event.id} style={[styles.eventCard, { borderLeftColor: eventColors[event.type] }]}>
              <View style={styles.eventInfo}>
                <Text style={styles.eventTitle}>{event.title}</Text>
                <View style={styles.metaRow}>
                  <Clock size={12} color="#666" />
                  <Text style={styles.metaText}>{event.time} ({event.duration})</Text>
                </View>
                <View style={styles.metaRow}>
                  <MapPin size={12} color="#666" />
                  <Text style={styles.metaText}>{event.location}</Text>
                </View>
              </View>
              <View style={styles.actionButtons}>
                <TouchableOpacity onPress={() => {
                  setEditingEvent(event);
                  setFormData(event);
                  setIsModalOpen(true);
                }}>
                  <Edit size={20} color="#1A9CFF" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDelete(event)} style={{ marginLeft: 15 }}>
                  <Trash2 size={20} color="#ef4444" />
                </TouchableOpacity>
              </View>
            </View>
          ))
        ) : (
          <Text style={styles.emptyText}>No events scheduled for this day.</Text>
        )}
      </ScrollView>

      {/* Modal */}
      <Modal visible={isModalOpen} animationType="slide">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{editingEvent ? "Edit Event" : "Add Event"}</Text>
            <TouchableOpacity onPress={() => setIsModalOpen(false)}>
              <X color="#000" size={24} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalForm}>
            <Text style={styles.label}>Event Title *</Text>
            <TextInput 
              style={styles.input} 
              placeholder="e.g., Morning Practice" 
              value={formData.title} 
              onChangeText={(val) => setFormData({...formData, title: val})}
            />

            <Text style={styles.label}>Date (YYYY-MM-DD) *</Text>
            <TextInput 
              style={styles.input} 
              placeholder="2024-10-25" 
              value={formData.date} 
              onChangeText={(val) => setFormData({...formData, date: val})}
            />

            <View style={styles.row}>
              <View style={{ flex: 1, marginRight: 10 }}>
                <Text style={styles.label}>Time *</Text>
                <TextInput 
                  style={styles.input} 
                  placeholder="14:00" 
                  value={formData.time} 
                  onChangeText={(val) => setFormData({...formData, time: val})}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Duration</Text>
                <TextInput 
                  style={styles.input} 
                  placeholder="1h" 
                  value={formData.duration} 
                  onChangeText={(val) => setFormData({...formData, duration: val})}
                />
              </View>
            </View>

            <Text style={styles.label}>Location</Text>
            <TextInput 
              style={styles.input} 
              placeholder="Main Stadium" 
              value={formData.location} 
              onChangeText={(val) => setFormData({...formData, location: val})}
            />

            <TouchableOpacity style={styles.saveButton} onPress={handleSaveEvent}>
              <Text style={styles.saveButtonText}>Save Event</Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* RENDER THE TOAST COMPONENT AT THE BOTTOM OF THE HIERARCHY */}
      <Toast />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8f9fa" },
  scrollContent: { padding: 20 },
  header: { 
    flexDirection: "row", 
    justifyContent: "space-between", 
    alignItems: "center", 
    marginBottom: 20 
  },
  title: { fontSize: 28, fontWeight: "bold", color: "#111" },
  subtitle: { color: "#666", marginTop: 4 },
  addButton: { 
    backgroundColor: "#1A9CFF", 
    padding: 12, 
    borderRadius: 12,
  },
  calendarCard: { 
    backgroundColor: "#fff", 
    borderRadius: 16, 
    overflow: "hidden", 
    elevation: 3, 
    marginBottom: 20 
  },
  sectionTitle: { fontSize: 18, fontWeight: "600", color: "#333" },
  eventListHeader: { marginBottom: 15 },
  eventCard: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    borderLeftWidth: 5,
    elevation: 2
  },
  eventInfo: { flex: 1 },
  eventTitle: { fontSize: 16, fontWeight: "bold", marginBottom: 4 },
  metaRow: { flexDirection: "row", alignItems: "center", marginTop: 2 },
  metaText: { fontSize: 13, color: "#666", marginLeft: 6 },
  actionButtons: { flexDirection: "row", alignItems: "center" },
  emptyText: { textAlign: "center", color: "#999", marginTop: 20 },
  modalContainer: { flex: 1, backgroundColor: "#fff" },
  modalHeader: { 
    flexDirection: "row", 
    justifyContent: "space-between", 
    padding: 20, 
    borderBottomWidth: 1, 
    borderColor: "#eee" 
  },
  modalTitle: { fontSize: 20, fontWeight: "bold" },
  modalForm: { padding: 20 },
  label: { fontSize: 14, fontWeight: "600", color: "#444", marginBottom: 8, marginTop: 15 },
  input: { 
    borderWidth: 1, 
    borderColor: "#ddd", 
    borderRadius: 8, 
    padding: 12, 
    fontSize: 16,
    backgroundColor: "#fdfdfd"
  },
  row: { flexDirection: "row" },
  saveButton: { 
    backgroundColor: "#1A9CFF", 
    padding: 16, 
    borderRadius: 12, 
    alignItems: "center", 
    marginTop: 30,
    marginBottom: 50
  },
  saveButtonText: { color: "#fff", fontSize: 16, fontWeight: "bold" }
});