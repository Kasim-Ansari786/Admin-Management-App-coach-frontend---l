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
} from "lucide-react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";

const { width } = Dimensions.get("window");

/* ---------------- HOME CONTENT ---------------- */
const HomeContent = () => {
  const navigation = useNavigation();

  // Show "Login Successful" when the page opens
  useEffect(() => {
    Toast.show({
      type: "success",
      text1: "Login Successful",
      text2: "Welcome back to your dashboard! 👋",
      position: "top",
      visibilityTime: 4000,
    });
  }, []);

  const handleLogout = () => {
    Toast.show({
      type: "info",
      text1: "Signed Out",
      text2: "You have been logged out successfully.",
    });
    
    // Reset navigation to Login screen
    navigation.reset({
      index: 0,
      routes: [{ name: "Login" }],
    });
  };

  const handleNotificationPress = () => {
    Toast.show({
      type: "error",
      text1: "No New Notifications",
      text2: "Check back later for team updates.",
    });
  };

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}
    >
      {/* HEADER */}
      <View style={styles.headerContainer}>
        <View style={styles.headerTopRow}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.canGoBack() && navigation.goBack()}
          >
          </TouchableOpacity>

          <View style={styles.headerRightActions}>
            <TouchableOpacity
              style={[styles.iconButton, { marginRight: 12 }]}
              onPress={handleNotificationPress}
            >
              <Bell color="#1f2937" size={22} />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.iconButton, styles.logoutButton]} 
              onPress={handleLogout}
            >
              <LogOut color="#FF4B4B" size={22} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.titleSection}>
          <Text style={styles.greeting}>Team Dashboard</Text>
          <Text style={styles.subtitle}>Friday, January 23</Text>
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

      {/* OVERVIEW */}
      <Text style={styles.sectionTitle}>Overview</Text>
      <View style={styles.gridContainer}>
        <View style={styles.gridItem}>
          <Text style={styles.gridNumber}>24</Text>
          <Text style={styles.gridLabel}>Players</Text>
        </View>
        <View style={styles.gridItem}>
          <Text style={styles.gridNumber}>92%</Text>
          <Text style={styles.gridLabel}>Attendance</Text>
        </View>
      </View>

      {/* RECORDS */}
      <Text style={styles.sectionTitle}>Recent Records</Text>
      {[1, 2, 3].map((item) => (
        <TouchableOpacity key={item} style={styles.listItem}>
          <View style={styles.listIconBox}>
            <FileText size={20} color="#1A9CFF" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.listTitle}>
              Performance Report #{item + 100}
            </Text>
            <Text style={styles.listSub}>Updated by Coach</Text>
          </View>
          <ChevronRight size={18} color="#9ca3af" />
        </TouchableOpacity>
      ))}
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
        {activeTab === "Home" ? (
          <HomeContent />
        ) : (
          <View style={styles.centered}>
            <Text style={styles.placeholderText}>
              {activeTab} Page Coming Soon
            </Text>
          </View>
        )}
      </View>

      {/* BOTTOM TAB BAR */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => setActiveTab("Home")}
        >
          <Home
            size={24}
            color={activeTab === "Home" ? "#1A9CFF" : "#9ca3af"}
          />
          <Text
            style={[
              styles.tabLabel,
              { color: activeTab === "Home" ? "#1A9CFF" : "#9ca3af" },
            ]}
          >
            Home
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => navigation.navigate("Players")}
        >
          <Users size={24} color="#9ca3af" />
          <Text style={styles.tabLabel}>Players</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => navigation.navigate("Schedule")}
        >
          <Calendar size={24} color="#9ca3af" />
          <Text style={styles.tabLabel}>Schedule</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => navigation.navigate("Attendance")}
        >
          <ClipboardCheck size={24} color="#9ca3af" />
          <Text style={styles.tabLabel}>Attendance</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => navigation.navigate("AttendanceRecords")}
        >
          <FileText size={24} color="#9ca3af" />
          <Text style={styles.tabLabel}>Records</Text>
        </TouchableOpacity>
      </View>
      <Toast />
    </SafeAreaView>
  );
}

/* ---------------- STYLES ---------------- */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9fafb",
    paddingTop: Platform.OS === "android" ? 40 : 0,
  },
  mainContent: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 20,
  },
  headerContainer: {
    marginBottom: 20,
  },
  headerTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerRightActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  titleSection: {
    marginTop: 15,
  },
  backButton: {
    padding: 5,
    marginLeft: -10,
  },
  greeting: {
    fontSize: 28,
    fontWeight: "800",
    color: "#111827",
  },
  subtitle: {
    fontSize: 16,
    color: "#6b7280",
    marginTop: 4,
  },
  iconButton: {
    backgroundColor: "#fff",
    padding: 10,
    borderRadius: 14,
    // Shadow for iOS
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    // Elevation for Android
    elevation: 3,
  },
  logoutButton: {
    backgroundColor: "#fff", // Keep white or change to "#fff1f1" for a red tint
  },
  featuredCard: {
    backgroundColor: "#1A9CFF",
    borderRadius: 24,
    padding: 25,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 30,
  },
  cardTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },
  cardStats: {
    color: "#c7d2fe",
    marginTop: 5,
  },
  cardButton: {
    backgroundColor: "#fff",
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 12,
  },
  cardButtonText: {
    color: "#1A9CFF",
    fontWeight: "700",
    fontSize: 13,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 15,
  },
  gridContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 30,
  },
  gridItem: {
    width: (width - 55) / 2,
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 20,
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  gridNumber: {
    fontSize: 24,
    fontWeight: "800",
    color: "#1A9CFF",
  },
  gridLabel: {
    color: "#6b7280",
    marginTop: 5,
  },
  listItem: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 18,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    elevation: 1,
  },
  listIconBox: {
    width: 45,
    height: 45,
    backgroundColor: "#eef2ff",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  listTitle: {
    fontWeight: "600",
    color: "#1f2937",
  },
  listSub: {
    fontSize: 12,
    color: "#9ca3af",
  },
  tabBar: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#f3f4f6",
    paddingBottom: Platform.OS === "ios" ? 25 : 15,
    paddingTop: 12,
    height: Platform.OS === "ios" ? 90 : 70,
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  tabLabel: {
    fontSize: 10,
    marginTop: 4,
    fontWeight: "600",
    color: "#9ca3af",
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  placeholderText: {
    color: "#9ca3af",
    fontSize: 16,
  },
});