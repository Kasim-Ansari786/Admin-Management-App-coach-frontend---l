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
  Dimensions,
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
  MapPin,
  Users,
  X
} from "lucide-react-native";

// --- THEME CONFIG ---
const THEME = {
  primary: "#1A9CFF",
  background: "#F8FAFC",
  card: "#FFFFFF",
  border: "#E2E8F0",
  textMain: "#1E293B",
  textMuted: "#64748B",
};

// --- SCREEN DIMENSIONS ---
const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get("window");

const eventTypeColors = {
  training: "#1A9CFF",
  match: "#10B981",
  meeting: "#F59E0B",
  tournament: "#A855F7",
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
        type: (event.event_type || event.type || "training").toLowerCase(),
        date: (event.event_date || event.date || "").split("T")[0],
        time: event.event_time || event.time || "10:00",
        title: event.title || "Untitled Event",
        id: event.id?.toString() || Math.random().toString(),
      }));
      setEvents(mappedData);
    } catch (error) {
      console.error("❌ Error loading schedule:", error.message);
      Toast.show({ type: "error", text1: "Error", text2: "Failed to load schedule" });
    } finally {
      setIsLoadingSchedule(false);
    }
  };

  useEffect(() => {
    if (user?.tenant_id && user?.id) fetchSchedule();
  }, [user]);

  const handleAddEvent = async () => {
    if (!formData.title) {
      Toast.show({ type: "error", text1: "Error", text2: "Please enter a title" });
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
        Toast.show({ type: "success", text1: "Success", text2: "Event created!" });
      }
    } catch (error) {
      Toast.show({ type: "error", text1: "Failed", text2: error.message });
    } finally {
      setLoading(false);
    }
  };

  const renderCalendar = () => {
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const daysInThisMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    // Build array of days
    const allDays = [];

    // Previous month days
    for (let i = firstDayOfMonth - 1; i >= 0; i--) {
      allDays.push({
        day: daysInPrevMonth - i,
        isCurrentMonth: false,
      });
    }

    // Current month days
    for (let i = 1; i <= daysInThisMonth; i++) {
      allDays.push({
        day: i,
        isCurrentMonth: true,
      });
    }

    // Next month days to complete grid
    const remaining = 42 - allDays.length;
    for (let i = 1; i <= remaining; i++) {
      allDays.push({
        day: i,
        isCurrentMonth: false,
      });
    }

    // Get today's date
    const today = new Date();
    const isCurrentMonthYear =
      today.getFullYear() === year && today.getMonth() === month;
    const todayDate = isCurrentMonthYear ? today.getDate() : null;

    // Get days with events
    const daysWithEvents = new Set(
      events
        .filter(
          (event) =>
            event.date &&
            event.date.startsWith(`${year}-${String(month + 1).padStart(2, "0")}`)
        )
        .map((event) => parseInt(event.date.split("-")[2], 10))
    );

    return (
      <View style={styles.calendarContainer}>
        {/* Days of Week Header */}
        <View style={styles.weekHeaderRow}>
          {daysOfWeek.map((day) => (
            <Text key={day} style={styles.weekHeaderDay}>
              {day}
            </Text>
          ))}
        </View>

        {/* Calendar Grid */}
        <View style={styles.calendarGrid}>
          {allDays.map((dayObj, index) => {
            const isSelected =
              dayObj.day === todayDate && dayObj.isCurrentMonth;
            const hasEvent =
              dayObj.isCurrentMonth && daysWithEvents.has(dayObj.day);
            const opacity = dayObj.isCurrentMonth ? 1 : 0.4;

            return (
              <TouchableOpacity
                key={`day-${index}`}
                style={[
                  styles.dayCell,
                  isSelected && styles.selectedDayCell,
                ]}
                onPress={() => {
                  // Handle day selection if needed
                }}
              >
                {isSelected && <View style={styles.selectionBg} />}

                <Text
                  style={[
                    styles.dayNumber,
                    { opacity },
                    isSelected && styles.selectedDayText,
                  ]}
                >
                  {dayObj.day}
                </Text>

                {hasEvent && (
                  <View
                    style={[
                      styles.eventDot,
                      isSelected && styles.eventDotSelected,
                    ]}
                  />
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  };

  const renderItem = ({ item }) => (
    <View style={[styles.eventCard, { borderLeftColor: eventTypeColors[item.type] || THEME.primary }]}>
      <View style={styles.titleRow}>
        <Text style={styles.eventTitle} numberOfLines={1}>{item.title || "Untitled"}</Text>
        <View style={[styles.typeBadge, { backgroundColor: (eventTypeColors[item.type] || THEME.primary) + '20' }]}>
          <Text style={[styles.typeBadgeText, { color: eventTypeColors[item.type] || THEME.primary }]}>{(item.type || "training").toUpperCase()}</Text>
        </View>
      </View>
      <View style={styles.metaRow}>
        <Clock size={12} color={THEME.textMuted} />
        <Text style={styles.metaText}>{item.date} • {item.time}</Text>
      </View>
      <View style={styles.footerRow}>
        {item.location && (
          <View style={styles.metaRow}>
            <MapPin size={12} color={THEME.textMuted} />
            <Text style={styles.metaText}>{item.location}</Text>
          </View>
        )}
        {item.team && (
          <View style={[styles.metaRow, { marginLeft: 15 }]}>
            <Users size={12} color={THEME.textMuted} />
            <Text style={styles.metaText}>{item.team}</Text>
          </View>
        )}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Schedule</Text>
          <Text style={styles.headerSub}>Manage your upcoming sessions</Text>
        </View>
        <TouchableOpacity style={styles.addButton} onPress={() => setIsAddModalOpen(true)}>
          <Plus color="#fff" size={22} />
        </TouchableOpacity>
      </View>

      {/* Switcher */}
      <View style={styles.toggleContainer}>
        <TouchableOpacity style={[styles.toggleBtn, viewMode === "calendar" && styles.toggleBtnActive]} onPress={() => setViewMode("calendar")}>
          <CalendarIcon size={16} color={viewMode === "calendar" ? "#fff" : THEME.textMuted} />
          <Text style={[styles.toggleText, viewMode === "calendar" && styles.toggleTextActive]}>Calendar</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.toggleBtn, viewMode === "list" && styles.toggleBtnActive]} onPress={() => setViewMode("list")}>
          <List size={16} color={viewMode === "list" ? "#fff" : THEME.textMuted} />
          <Text style={[styles.toggleText, viewMode === "list" && styles.toggleTextActive]}>List View</Text>
        </TouchableOpacity>
      </View>

      {viewMode === "calendar" ? (
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.monthPicker}>
            <TouchableOpacity onPress={prevMonth} style={styles.navBtn}><ChevronLeft size={24} color={THEME.textMain} /></TouchableOpacity>
            <Text style={styles.monthTitle}>{months[month]} {year}</Text>
            <TouchableOpacity onPress={nextMonth} style={styles.navBtn}><ChevronRight size={24} color={THEME.textMain} /></TouchableOpacity>
          </View>
          {isLoadingSchedule ? (
            <ActivityIndicator size="large" color={THEME.primary} style={{ marginTop: 50 }} />
          ) : (
            <View style={styles.calendarWrapper}>{renderCalendar()}</View>
          )}
        </ScrollView>
      ) : (
        <FlatList
          data={events}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <CalendarDays size={60} color="#cbd5e1" />
              <Text style={styles.emptyText}>No events scheduled yet</Text>
            </View>
          }
        />
      )}

      {/* ADD EVENT MODAL */}
    <Modal visible={isAddModalOpen} animationType="fade" transparent={true}>
      <View style={styles.overlay}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === "ios" ? "padding" : "height"} 
          style={styles.keyboardView}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              {/* Header */}
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>New Event</Text>
                <TouchableOpacity onPress={() => setIsAddModalOpen(false)} hitSlop={10}>
                  <X size={22} color={THEME.textMain} />
                </TouchableOpacity>
              </View>

              {/* Scrollable Form */}
              <ScrollView 
                showsVerticalScrollIndicator={true} 
                contentContainerStyle={styles.scrollPadding}
              >
                <Text style={styles.label}>EVENT TITLE *</Text>
                <TextInput 
                  style={styles.stylishInput} 
                  placeholder="e.g. Morning Drill" 
                  value={formData.title} 
                  onChangeText={(txt) => setFormData({ ...formData, title: txt })} 
                />
                
                <View style={styles.row}>
                  <View style={{ flex: 1, marginRight: 10 }}>
                    <Text style={styles.label}>TYPE</Text>
                    <View style={styles.pickerWrapper}>
                      <Picker 
                        selectedValue={formData.type} 
                        onValueChange={(v) => setFormData({ ...formData, type: v })} 
                        style={styles.picker}
                        dropdownIconColor={THEME.primary}
                      >
                        <Picker.Item label="Training" value="training" />
                        <Picker.Item label="Match" value="match" />
                        <Picker.Item label="Meeting" value="meeting" />
                        <Picker.Item label="Tournament" value="tournament" />
                      </Picker>
                    </View>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.label}>TEAM</Text>
                    <View style={styles.pickerWrapper}>
                      <Picker 
                        selectedValue={formData.team} 
                        onValueChange={(v) => setFormData({ ...formData, team: v })} 
                        style={styles.picker}
                        dropdownIconColor={THEME.primary}
                      >
                        <Picker.Item label="Team Alpha" value="Team Alpha" />
                        <Picker.Item label="Team Beta" value="Team Beta" />
                        <Picker.Item label="All Teams" value="All Teams" />
                      </Picker>
                    </View>
                  </View>
                </View>

                <Text style={styles.label}>DATE</Text>
                <TouchableOpacity style={styles.dateSelector} onPress={() => setShowDatePicker(true)}>
                  <Text style={styles.dateText}>
                    {formData.date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </Text>
                  <CalendarIcon size={16} color={THEME.primary} />
                </TouchableOpacity>

                {showDatePicker && (
                  <DateTimePicker 
                    value={formData.date} 
                    mode="date" 
                    display="calendar" 
                    onChange={onDateChange} 
                  />
                )}

                <View style={styles.row}>
                  <View style={{ flex: 1, marginRight: 10 }}>
                    <Text style={styles.label}>TIME</Text>
                    <TextInput 
                      style={styles.stylishInput} 
                      placeholder="10:00 AM" 
                      value={formData.time} 
                      onChangeText={(txt) => setFormData({ ...formData, time: txt })} 
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.label}>DURATION</Text>
                    <TextInput 
                      style={styles.stylishInput} 
                      placeholder="2h" 
                      value={formData.duration} 
                      onChangeText={(txt) => setFormData({ ...formData, duration: txt })} 
                    />
                  </View>
                </View>

                <Text style={styles.label}>LOCATION</Text>
                <TextInput 
                  style={styles.stylishInput} 
                  placeholder="Stadium or Gym name" 
                  value={formData.location} 
                  onChangeText={(txt) => setFormData({ ...formData, location: txt })} 
                />

              <View style={styles.buttonContainer}>
  <TouchableOpacity 
    style={[styles.submitBtn, loading && { opacity: 0.7 }]} 
    onPress={handleAddEvent} 
    disabled={loading}
  >
    {loading ? (
      <ActivityIndicator color="#fff" />
    ) : (
      <Text style={styles.submitBtnText}>Create Event</Text>
    )}
  </TouchableOpacity>
</View>
              </ScrollView>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
      <Toast />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: THEME.background },
  header: { flexDirection: "row", justifyContent: "space-between", padding: 20, alignItems: "center" },
  headerTitle: { fontSize: 24, fontWeight: "800", color: THEME.textMain },
  headerSub: { color: THEME.textMuted, fontSize: 13, marginTop: 2 },
  addButton: { backgroundColor: THEME.primary, width: 44, height: 44, borderRadius: 14, justifyContent: "center", alignItems: "center", elevation: 4, shadowColor: THEME.primary, shadowOpacity: 0.3, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } },
  
  toggleContainer: { flexDirection: "row", backgroundColor: "#E2E8F0", marginHorizontal: 20, borderRadius: 14, padding: 4, marginBottom: 15 },
  toggleBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 10, borderRadius: 10, gap: 8 },
  toggleBtnActive: { backgroundColor: THEME.primary },
  toggleText: { color: THEME.textMuted, fontWeight: "600", fontSize: 13 },
  toggleTextActive: { color: "#fff" },

  monthPicker: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingVertical: 10 },
  monthTitle: { fontSize: 18, fontWeight: "700", color: THEME.textMain },
  navBtn: { padding: 8, backgroundColor: "#fff", borderRadius: 10, borderWidth: 1, borderColor: THEME.border },

  calendarContainer: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    backgroundColor: THEME.card,
    borderRadius: 12,
    marginVertical: 10,
  },
  weekHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: THEME.border,
  },
  weekHeaderDay: {
    fontSize: 11,
    fontWeight: "700",
    color: THEME.textMain,
    width: "14.28%",
    textAlign: "center",
    letterSpacing: 0.5,
  },
  calendarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-around",
  },
  dayCell: {
    width: "14.28%",
    aspectRatio: 1,
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 8,
    position: "relative",
  },
  selectedDayCell: {
    position: "relative",
  },
  selectionBg: {
    position: "absolute",
    width: 48,
    height: 48,
    backgroundColor: "#ffffff",
    borderRadius: 8,
    zIndex: 0,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  dayNumber: {
    fontSize: 11,
    fontWeight: "600",
    color: THEME.textMain,
    zIndex: 1,
  },
  selectedDayText: {
    color: THEME.primary,
    fontWeight: "700",
  },
  eventDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: THEME.primary,
    marginTop: 4,
    zIndex: 1,
  },

  keyboardView: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  eventDotSelected: {
    backgroundColor: THEME.primary,
  },

  listContent: { padding: 20, paddingBottom: 100 },
  eventCard: { backgroundColor: "#fff", padding: 16, marginBottom: 12, borderRadius: 16, borderLeftWidth: 5, elevation: 3, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 10 },
  titleRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  eventTitle: { fontSize: 11, fontWeight: "bold", color: THEME.textMain, flex: 1, marginRight: 10 },
  typeBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  typeBadgeText: { fontSize: 11, fontWeight: "800" },
  metaRow: { flexDirection: "row", alignItems: "center", marginTop: 4 },
  footerRow: { flexDirection: "row", marginTop: 8, borderTopWidth: 1, borderTopColor: "#F1F5F9", paddingTop: 8 },
  metaText: { color: THEME.textMuted, fontSize: 12, marginLeft: 6 },

 overlay: {
    flex: 1,
    backgroundColor: THEME.background,
    justifyContent: 'center', // Centers the modal vertically
    alignItems: 'center',     // Centers the modal horizontally
  },
modalContainer: {
    width: '90%',
    maxWidth: 400,
    maxHeight: SCREEN_HEIGHT * 0.8, // Prevents the modal from going off-screen
    backgroundColor: THEME.card,
    borderRadius: 20,
    overflow: 'hidden', // Ensures scroll content stays within rounded corners
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  modalContent: { backgroundColor: "#fff", borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 24, maxHeight: "90%" },
modalContent: {
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: THEME.textMain,
  },
  scrollPadding: {
    paddingBottom: 20, // Extra space at the bottom of the scroll
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: THEME.textSub,
    marginBottom: 8,
    marginTop: 10,
  },
  stylishInput: {
    borderWidth: 1,
    borderColor: THEME.border,
    borderRadius: 10,
    padding: 12,
    fontSize: 12,
    color: THEME.textMain,
    backgroundColor: '#f8fafc',
  },
  row: {
    flexDirection: 'row',
    marginTop: 5,
  },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: THEME.border,
    borderRadius: 10,
    backgroundColor: '#f8fafc',
    overflow: 'hidden',
  },
  picker: {
    height: 50,
    width: '100%',
  },
  dateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: THEME.border,
    borderRadius: 10,
    padding: 12,
    backgroundColor: '#f8fafc',
  },
  dateText: {
    fontSize: 12,
    color: THEME.textMain,
  },
 buttonContainer: {
    width: '100%',
    alignItems: 'flex-end', // This pushes the button to the right
    paddingVertical: 10,
  },
  submitBtn: {
    backgroundColor: '#007AFF', // Example color
    paddingVertical: 10,
    paddingHorizontal: 20,    // Horizontal padding makes it "small" and wrap the text
    borderRadius: 8,
    minWidth: 100,            // Ensures it doesn't get too tiny
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  
  emptyContainer: { alignItems: "center", marginTop: 100 },
  emptyText: { color: THEME.textMuted, fontSize: 15, marginTop: 15, fontWeight: "500" },
});