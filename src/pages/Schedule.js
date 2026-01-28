import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  FlatList,
  Modal,
  TextInput,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import DateTimePicker from "@react-native-community/datetimepicker";
import Toast from "react-native-toast-message";
import { addScheduleEvent, GetScheduleRecords, getToken, getUser } from "../../api";
import {
  Plus,
  ChevronLeft,
  ChevronRight,
  Clock,
  Calendar as CalendarIcon,
  List,
  CalendarDays,
} from "lucide-react-native";

// --- CONFIG ---
const eventTypeColors = {
  training: "#1A9CFF",
  match: "#10b981",
  meeting: "#f59e0b",
  tournament: "#a855f7",
};

const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const months = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export default function ScheduleApp() {
  const [events, setEvents] = useState([]);
  const [viewMode, setViewMode] = useState("calendar");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [focusedInput, setFocusedInput] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isLoadingSchedule, setIsLoadingSchedule] = useState(false);
  const [user, setUser] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    title: "",
    type: "training",
    team: "Team Alpha",
    date: new Date(),
    time: "10:00",
    location: "",
    duration: "",
    description: "",
  });

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const onDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) setFormData({ ...formData, date: selectedDate });
  };

  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await getUser();
        if (userData) setUser(userData);
      } catch (error) {
        console.error("Error loading user:", error);
      }
    };
    loadUser();
  }, []);

  const fetchSchedule = async () => {
    if (!user?.tenant_id || !user?.id) return;
    try {
      setIsLoadingSchedule(true);
      const data = await GetScheduleRecords(user.tenant_id, user.id);
      const mappedData = (Array.isArray(data) ? data : []).map((event) => ({
        ...event,
        type: event.event_type || "training",
        date: (event.event_date || "").split("T")[0],
        time: event.event_time,
        id: event.id?.toString() || Math.random().toString(),
      }));
      setEvents(mappedData);
    } catch (error) {
      console.error("❌ Error loading schedule:", error.message);
    } finally {
      setIsLoadingSchedule(false);
    }
  };

  useEffect(() => {
    if (user?.tenant_id && user?.id) fetchSchedule();
  }, [user]);

  const handleAddEvent = async () => {
    if (!formData.title) {
      Toast.show({ type: "error", text1: "Error", text2: "Enter a title", position: "bottom" });
      return;
    }
    setLoading(true);
    try {
      const token = await getToken();
      const payload = {
        tenant_id: user.tenant_id,
        title: formData.title,
        event_type: formData.type,
        event_date: formData.date.toISOString().split("T")[0],
        event_time: formData.time,
        duration: formData.duration,
        location: formData.location,
        team: formData.team,
        description: formData.description,
      };
      const response = await addScheduleEvent(payload, token);
      if (response) {
        setEvents([{ ...payload, id: Math.random().toString(), date: payload.event_date }, ...events]);
        setIsAddModalOpen(false);
        setFormData({ title: "", type: "training", team: "Team Alpha", date: new Date(), time: "10:00", location: "", duration: "", description: "" });
        Toast.show({ type: "success", text1: "Success", text2: "Event added!", position: "bottom" });
      }
    } catch (error) {
      Toast.show({ type: "error", text1: "Failed", text2: error.message, position: "bottom" });
    } finally {
      setLoading(false);
    }
  };

  const renderCalendar = () => {
    const days = [];
    for (let i = 0; i < firstDayOfMonth; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(i);

    return (
      <View style={styles.calendarGrid}>
        {daysOfWeek.map((d) => (
          <View key={d} style={styles.dayHeader}><Text style={styles.dayHeaderText}>{d}</Text></View>
        ))}
        {days.map((day, idx) => {
          const dateString = `${year}-${(month + 1).toString().padStart(2, '0')}-${day?.toString().padStart(2, '0')}`;
          const dayEvents = events.filter(e => e.date === dateString);

          return (
            <View key={idx} style={[styles.dayCell, !day && styles.emptyCell]}>
              {day && (
                <>
                  <Text style={styles.dayNumber}>{day}</Text>
                  <View style={styles.dotContainer}>
                    {dayEvents.slice(0, 3).map((e, i) => (
                      <View key={i} style={[styles.eventDot, { backgroundColor: eventTypeColors[e.type] || "#cbd5e1" }]} />
                    ))}
                  </View>
                </>
              )}
            </View>
          );
        })}
      </View>
    );
  };

  const renderItem = ({ item }) => (
    <View style={[styles.eventCard, { borderLeftColor: eventTypeColors[item.type] }]}>
      <View style={styles.titleRow}>
        <Text style={styles.eventTitle}>{item.title}</Text>
        <View style={[styles.typeBadge, { backgroundColor: eventTypeColors[item.type] }]}>
          <Text style={styles.typeBadgeText}>{item.type}</Text>
        </View>
      </View>
      <View style={styles.metaRow}>
        <Clock size={12} color="#64748b" />
        <Text style={styles.metaText}>{item.date} at {item.time}</Text>
      </View>
      {item.location && <View style={styles.metaRow}><Text style={styles.metaIcon}>📍</Text><Text style={styles.metaText}>{item.location}</Text></View>}
      {item.team && <View style={styles.metaRow}><Text style={styles.metaIcon}>👥</Text><Text style={styles.metaText}>{item.team}</Text></View>}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Schedule</Text>
          <Text style={styles.headerSub}>Manage sessions</Text>
        </View>
        <TouchableOpacity style={styles.addButton} onPress={() => setIsAddModalOpen(true)}>
          <Plus color="#fff" size={18} />
        </TouchableOpacity>
      </View>

      <View style={styles.toggleContainer}>
        <TouchableOpacity style={[styles.toggleBtn, viewMode === "calendar" && styles.toggleBtnActive]} onPress={() => setViewMode("calendar")}>
          <CalendarIcon size={14} color={viewMode === "calendar" ? "#fff" : "#64748b"} />
          <Text style={[styles.toggleText, viewMode === "calendar" && styles.toggleTextActive]}>Calendar</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.toggleBtn, viewMode === "list" && styles.toggleBtnActive]} onPress={() => setViewMode("list")}>
          <List size={14} color={viewMode === "list" ? "#fff" : "#64748b"} />
          <Text style={[styles.toggleText, viewMode === "list" && styles.toggleTextActive]}>List</Text>
        </TouchableOpacity>
      </View>

      {viewMode === "calendar" ? (
        <ScrollView>
          <View style={styles.monthPicker}>
            <TouchableOpacity onPress={prevMonth}><ChevronLeft size={20} color="#1e293b" /></TouchableOpacity>
            <Text style={styles.monthTitle}>{months[month]} {year}</Text>
            <TouchableOpacity onPress={nextMonth}><ChevronRight size={20} color="#1e293b" /></TouchableOpacity>
          </View>
          {isLoadingSchedule ? <ActivityIndicator size="small" color="#1A9CFF" /> : renderCalendar()}
        </ScrollView>
      ) : (
        <FlatList
          data={events}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <CalendarDays size={48} color="#cbd5e1" />
              <Text style={styles.emptyText}>No events scheduled</Text>
            </View>
          }
        />
      )}

      {/* MODAL */}
      <Modal visible={isAddModalOpen} animationType="slide" transparent={true}>
        <View style={styles.overlay}>
          <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.title}>New Event</Text>
                <TouchableOpacity onPress={() => setIsAddModalOpen(false)}><Text style={styles.closeIcon}>✕</Text></TouchableOpacity>
              </View>
              <ScrollView showsVerticalScrollIndicator={false}>
                <Text style={styles.label}>Event Title *</Text>
                <TextInput style={[styles.stylishInput, focusedInput === "title" && styles.inputFocused]} onFocus={() => setFocusedInput("title")} onBlur={() => setFocusedInput(null)} placeholder="Enter title" value={formData.title} onChangeText={(txt) => setFormData({ ...formData, title: txt })} />
                
                <View style={styles.row}>
                  <View style={{ flex: 1, marginRight: 8 }}>
                    <Text style={styles.label}>Type *</Text>
                    <View style={styles.pickerWrapper}>
                      <Picker selectedValue={formData.type} onValueChange={(v) => setFormData({ ...formData, type: v })} style={styles.picker}>
                        <Picker.Item label="Training" value="training" style={{ fontSize: 11 }} />
                        <Picker.Item label="Match" value="match" style={{ fontSize: 11 }} />
                        <Picker.Item label="Meeting" value="meeting" style={{ fontSize: 11 }} />
                      </Picker>
                    </View>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.label}>Team</Text>
                    <View style={styles.pickerWrapper}>
                      <Picker selectedValue={formData.team} onValueChange={(v) => setFormData({ ...formData, team: v })} style={styles.picker}>
                        <Picker.Item label="Team Alpha" value="Team Alpha" style={{ fontSize: 11 }} />
                        <Picker.Item label="Team Beta" value="Team Beta" style={{ fontSize: 11 }} />
                      </Picker>
                    </View>
                  </View>
                </View>

                <Text style={styles.label}>Date *</Text>
                <TouchableOpacity style={styles.stylishInput} onPress={() => setShowDatePicker(true)}>
                  <Text style={{ fontSize: 11 }}>{formData.date.toLocaleDateString()}</Text>
                  <CalendarIcon size={14} color="#1A9CFF" />
                </TouchableOpacity>

                {showDatePicker && <DateTimePicker value={formData.date} mode="date" display="default" onChange={onDateChange} />}

                <View style={styles.row}>
                  <View style={{ flex: 1, marginRight: 8 }}>
                    <Text style={styles.label}>Time</Text>
                    <TextInput style={styles.stylishInput} placeholder="10:00 AM" value={formData.time} onChangeText={(txt) => setFormData({ ...formData, time: txt })} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.label}>Duration</Text>
                    <TextInput style={styles.stylishInput} placeholder="2h" value={formData.duration} onChangeText={(txt) => setFormData({ ...formData, duration: txt })} />
                  </View>
                </View>

                <Text style={styles.label}>Location</Text>
                <TextInput style={styles.stylishInput} placeholder="Location" value={formData.location} onChangeText={(txt) => setFormData({ ...formData, location: txt })} />

                <TouchableOpacity style={styles.primaryAddBtn} onPress={handleAddEvent}>
                  {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.addBtnText}>Create Event</Text>}
                </TouchableOpacity>
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
      <Toast />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  header: { flexDirection: "row", justifyContent: "space-between", padding: 20, alignItems: "center" },
  headerTitle: { fontSize: 18, fontWeight: "bold", color: "#1e293b" },
  headerSub: { color: "#64748b", fontSize: 11 },
  addButton: { backgroundColor: "#1A9CFF", padding: 10, borderRadius: 12 },
  toggleContainer: { flexDirection: "row", backgroundColor: "#e2e8f0", marginHorizontal: 20, borderRadius: 25, padding: 4, marginBottom: 10 },
  toggleBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 8, borderRadius: 20, gap: 6 },
  toggleBtnActive: { backgroundColor: "#1A9CFF" },
  toggleText: { color: "#64748b", fontWeight: "600", fontSize: 11 },
  toggleTextActive: { color: "#fff" },
  calendarGrid: { flexDirection: "row", flexWrap: "wrap", paddingHorizontal: 10 },
  dayHeader: { width: "14.28%", alignItems: "center", paddingBottom: 10 },
  dayHeaderText: { color: "#94a3b8", fontWeight: "bold", fontSize: 10 },
  dayCell: { width: "14.28%", height: 60, borderWidth: 0.5, borderColor: "#e2e8f0", padding: 4, backgroundColor: "#fff" },
  dayNumber: { fontSize: 10, fontWeight: "600" },
  emptyCell: { backgroundColor: "#f1f5f9" },
  dotContainer: { flexDirection: "row", marginTop: 4, flexWrap: "wrap", gap: 2 },
  eventDot: { width: 4, height: 4, borderRadius: 2 },
  monthPicker: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 15 },
  monthTitle: { fontSize: 14, fontWeight: "700" },
  listContent: { paddingHorizontal: 20, paddingBottom: 100 },
  eventCard: { backgroundColor: "#fff", padding: 12, marginBottom: 10, borderRadius: 12, borderLeftWidth: 4, elevation: 2 },
  titleRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
  eventTitle: { fontSize: 13, fontWeight: "bold", color: "#1e293b", flex: 1 },
  typeBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  typeBadgeText: { color: "#fff", fontSize: 9, fontWeight: "700" },
  metaRow: { flexDirection: "row", alignItems: "center", marginTop: 4 },
  metaText: { color: "#64748b", fontSize: 11, marginLeft: 5 },
  metaIcon: { fontSize: 11 },
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", padding: 20 },
  modalContainer: { width: "100%" },
  modalContent: { backgroundColor: "#fff", borderRadius: 20, padding: 20, maxHeight: "90%" },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 10 },
  title: { fontSize: 16, fontWeight: "bold" },
  label: { fontSize: 11, fontWeight: "700", color: "#64748b", marginBottom: 4, marginTop: 10 },
  stylishInput: { backgroundColor: "#f8fafc", borderWidth: 1, borderColor: "#e2e8f0", borderRadius: 10, paddingHorizontal: 12, height: 40, fontSize: 11, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  pickerWrapper: { backgroundColor: "#f8fafc", borderWidth: 1, borderColor: "#e2e8f0", borderRadius: 10, overflow: "hidden" },
  picker: { height: 40, width: "100%" },
  row: { flexDirection: "row" },
  primaryAddBtn: { backgroundColor: "#1A9CFF", borderRadius: 10, paddingVertical: 12, alignItems: "center", marginTop: 20 },
  addBtnText: { color: "#fff", fontWeight: "bold", fontSize: 11 },
  emptyContainer: { alignItems: "center", marginTop: 50 },
  emptyText: { color: "#94a3b8", fontSize: 11, marginTop: 10 },
});