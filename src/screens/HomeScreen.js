import React, { useState, useEffect } from "react";
import { useNavigation } from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
  Platform,
  ActivityIndicator,
} from "react-native";
import {
  Home,
  LogOut,
  Users,
  Calendar,
  ClipboardCheck,
  FileText,
  Bell,
  ChevronRight,
  Clock,
} from "lucide-react-native";
import Toast from "react-native-toast-message";
import { 
  getUser, 
  getToken, 
  fetchCoachAssignedPlayers, 
  fetchSessionData, 
  clearToken, 
  clearUser 
} from "../../api";

const { width } = Dimensions.get("window");

/* ---------------- HOME CONTENT ---------------- */
const HomeContent = () => {
  const navigation = useNavigation();
  const [user, setUser] = useState(null);
  const [playersCount, setPlayersCount] = useState(0);
  const [sessions, setSessions] = useState([]); // Stores all recent sessions
  const [loading, setLoading] = useState(true);
  const [todayDate, setTodayDate] = useState("");

  // Get today's date formatted
  useEffect(() => {
    const today = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    setTodayDate(today.toLocaleDateString('en-US', options));
  }, []);

  // Load user, sessions, and players data
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const userData = await getUser();
        if (userData) {
          setUser(userData);

          const token = await getToken();
          if (token && userData) {
            // Derive coachId from multiple possible user fields
            const coachId = userData.coach_id || userData.coachId || userData.id;
            
            console.log('[HomeScreen] Loading data for coachId:', coachId);

            // 1. Fetch sessions using the coach ID
            const sessionsData = await fetchSessionData(coachId, token);
            if (sessionsData) {
              setSessions(sessionsData); 
              console.log('✅ Sessions loaded:', sessionsData.length);
            }

            // 2. Fetch players count
            const playersData = await fetchCoachAssignedPlayers(token);
            setPlayersCount(playersData.length || 0);
          }
        }
      } catch (error) {
        console.error('Error loading data:', error);
        Toast.show({ type: "error", text1: "Error", text2: "Failed to load dashboard data." });
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  useEffect(() => {
    if (user?.name) {
      Toast.show({
        type: "success",
        text1: "Login Successful",
        text2: `Welcome back, ${user.name}! 👋`,
        position: "top",
        visibilityTime: 4000,
      });
    }
  }, [user]);

  const handleLogout = async () => {
    try {
      await clearToken();
      await clearUser();      
      navigation.reset({ index: 0, routes: [{ name: "Login" }] });
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <ScrollView 
      showsVerticalScrollIndicator={false} 
      contentContainerStyle={styles.scrollContent}
    >
      {/* HEADER */}
      <View style={styles.headerContainer}>
        <View style={styles.headerTopRow}>
          <View>
            <Text style={styles.greeting}>Hello, {user?.name || 'Coach'}</Text>
            <Text style={styles.subtitle}>{todayDate}</Text>
          </View>
          <View style={styles.headerRightActions}>
            <TouchableOpacity style={[styles.iconButton, { marginRight: 12 }]}>
              <Bell color="#1f2937" size={22} />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.iconButton, styles.logoutButton]} onPress={handleLogout}>
              <LogOut color="#FF4B4B" size={22} />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* FEATURED CARD */}
      <View style={styles.featuredCard}>
        <View>
          <Text style={styles.cardTitle}>Next Training</Text>
          <Text style={styles.cardStats}>Today @ 4:00 PM</Text>
        </View>
        <TouchableOpacity style={styles.cardButton}>
          <Text style={styles.cardButtonText}>View Pitch</Text>
        </TouchableOpacity>
      </View>

      {/* OVERVIEW SECTION */}
      <Text style={styles.sectionTitle}>Team Overview</Text>
      {loading ? (
        <ActivityIndicator size="small" color="#1A9CFF" style={{ marginVertical: 20 }} />
      ) : (
        <View style={styles.gridContainer}>
          <View style={styles.gridItem}>
            <Text style={styles.gridNumber}>{playersCount}</Text>
            <Text style={styles.gridLabel}>Total List</Text>
          </View>
          <View style={styles.gridItem}>
            <Text style={styles.gridNumber}>92%</Text>
            <Text style={styles.gridLabel}>Avg Attendance</Text>
          </View>
        </View>
      )}
    
      {/* RECENT RECORDS (DYNAMIC) */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Recent Sessions</Text>
        <TouchableOpacity onPress={() => navigation.navigate("AttendanceRecords")}>
          <Text style={styles.viewAllText}>View All</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1A9CFF" />
        </View>
      ) : sessions.length > 0 ? (
        sessions.slice(0, 5).map((session, index) => (
          <TouchableOpacity 
            key={session.id || index} 
            style={styles.listItem}
            onPress={() => navigation.navigate("AttendanceRecords", { sessionId: session.id })}
          >
            <View style={styles.listIconBox}>
              <Calendar size={20} color="#1A9CFF" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.listTitle}>
                {session.session_name || `Session #${session.id}`}
              </Text>
              <Text style={styles.listSub}>
                {session.date ? new Date(session.date).toLocaleDateString() : 'N/A'} • {session.session_type || 'General'}
              </Text>
            </View>
            <ChevronRight size={18} color="#9ca3af" />
          </TouchableOpacity>
        ))
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.placeholderText}>No recent records found</Text>
        </View>
      )}
    </ScrollView>
  );
};

/* ---------------- MAIN SCREEN ---------------- */
export default function HomeScreen() {
  const [activeTab, setActiveTab] = useState("Home");
  const navigation = useNavigation();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.mainContent}>
        {activeTab === "Home" ? <HomeContent /> : (
          <View style={styles.centered}>
            <Text style={styles.placeholderText}>{activeTab} Page Coming Soon</Text>
          </View>
        )}
      </View>

      <View style={styles.tabBar}>
        <TouchableOpacity style={styles.tabItem} onPress={() => setActiveTab("Home")}>
          <Home size={24} color={activeTab === "Home" ? "#1A9CFF" : "#9ca3af"} />
          <Text style={[styles.tabLabel, { color: activeTab === "Home" ? "#1A9CFF" : "#9ca3af" }]}>Home</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.tabItem} onPress={() => navigation.navigate("Players")}>
          <Users size={24} color="#9ca3af" />
          <Text style={styles.tabLabel}>List</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.tabItem} onPress={() => navigation.navigate("Schedule")}>
          <Calendar size={24} color="#9ca3af" />
          <Text style={styles.tabLabel}>Schedule</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.tabItem} onPress={() => navigation.navigate("Attendance")}>
          <ClipboardCheck size={24} color="#9ca3af" />
          <Text style={styles.tabLabel}>Attendance</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.tabItem} onPress={() => navigation.navigate("AttendanceRecords")}>
          <FileText size={24} color="#9ca3af" />
          <Text style={styles.tabLabel}>Records</Text>
        </TouchableOpacity>
      </View>
      <Toast />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb", paddingTop: Platform.OS === "android" ? 40 : 0 },
  mainContent: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 40 },
  headerContainer: { marginBottom: 25 },
  headerTopRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  headerRightActions: { flexDirection: "row", alignItems: "center" },
  greeting: { fontSize: 26, fontWeight: "800", color: "#111827" },
  subtitle: { fontSize: 14, color: "#6b7280", marginTop: 2 },
  iconButton: { backgroundColor: "#fff", padding: 10, borderRadius: 14, elevation: 3, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 4 },
  logoutButton: { backgroundColor: "#fff" },
  featuredCard: { backgroundColor: "#1A9CFF", borderRadius: 24, padding: 25, flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 30 },
  cardTitle: { color: "#fff", fontSize: 18, fontWeight: "700" },
  cardStats: { color: "#e0f2fe", marginTop: 5, fontSize: 13 },
  cardButton: { backgroundColor: "#fff", paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12 },
  cardButtonText: { color: "#1A9CFF", fontWeight: "700", fontSize: 13 },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 15 },
  sectionTitle: { fontSize: 18, fontWeight: "700", color: "#111827" },
  viewAllText: { color: "#1A9CFF", fontWeight: "600", fontSize: 13 },
  gridContainer: { flexDirection: "row", justifyContent: "space-between", marginBottom: 30 },
  gridItem: { width: (width - 55) / 2, backgroundColor: "#fff", padding: 20, borderRadius: 20, alignItems: "center", elevation: 2 },
  gridNumber: { fontSize: 24, fontWeight: "800", color: "#1A9CFF" },
  gridLabel: { color: "#6b7280", marginTop: 5, fontSize: 11, fontWeight: "500" },
  listItem: { backgroundColor: "#fff", padding: 15, borderRadius: 18, flexDirection: "row", alignItems: "center", marginBottom: 12, elevation: 1 },
  listIconBox: { width: 45, height: 45, backgroundColor: "#eef2ff", borderRadius: 12, justifyContent: "center", alignItems: "center", marginRight: 15 },
  listTitle: { fontWeight: "600", color: "#1f2937", fontSize: 15 },
  listSub: { fontSize: 11, color: "#9ca3af" },
  tabBar: { flexDirection: "row", backgroundColor: "#fff", borderTopWidth: 1, borderTopColor: "#f3f4f6", paddingBottom: Platform.OS === "ios" ? 25 : 15, paddingTop: 12, height: Platform.OS === "ios" ? 95 : 75 },
  tabItem: { flex: 1, alignItems: "center", justifyContent: "center" },
  tabLabel: { fontSize: 10, marginTop: 4, fontWeight: "600", color: "#9ca3af" },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  placeholderText: { color: "#9ca3af", fontSize: 16 },
  loadingContainer: { alignItems: "center", justifyContent: "center", paddingVertical: 40 },
  emptyContainer: { alignItems: "center", paddingVertical: 20 },
});