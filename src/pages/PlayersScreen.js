import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  Animated,
} from "react-native";
import {
  Users,
  RefreshCw,
  CheckCircle,
  AlertCircle,
} from "lucide-react-native";
import { fetchCoachAssignedPlayers, getToken } from "../../api";

const PlayersScreen = ({ navigation }) => {
  const [assignedPlayers, setAssignedPlayers] = useState([]);
  const [isLoadingPlayers, setIsLoadingPlayers] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // --- Toast State ---
  const [toastConfig, setToastConfig] = useState({
    visible: false,
    message: "",
    type: "success",
  });
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const showToast = (message, type = "success") => {
    setToastConfig({ visible: true, message, type });
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
    setTimeout(() => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => setToastConfig((prev) => ({ ...prev, visible: false })));
    }, 3000);
  };

  const loadPlayers = useCallback(
    async (isManual = false) => {
      try {
        if (!isRefreshing) setIsLoadingPlayers(true);
        const token = await getToken();

        if (!token) {
          showToast("No session found. Please login.", "error");
          navigation.replace('Login');
          setIsLoadingPlayers(false);
          return;
        }
        const players = await fetchCoachAssignedPlayers(token);
        setAssignedPlayers(players || []);

        if (isManual) {
          showToast("List updated successfully!", "success");
        }
      } catch (error) {
        console.error("Fetch Error:", error);
        showToast(error.message || "Failed to connect to server", "error");
        setAssignedPlayers([]);
      } finally {
        setIsLoadingPlayers(false);
        setIsRefreshing(false);
      }
    },
    [isRefreshing],
  );

  useEffect(() => {
    loadPlayers();
  }, []);

  const onRefresh = () => {
    setIsRefreshing(true);
    loadPlayers(true);
  };

  return (
    <View style={styles.container}>
      {/* --- TOAST UI --- */}
      {toastConfig.visible && (
        <Animated.View
          style={[
            styles.toastContainer,
            {
              opacity: fadeAnim,
              backgroundColor:
                toastConfig.type === "success" ? "#10b981" : "#ef4444",
            },
          ]}
        >
          {toastConfig.type === "success" ? (
            <CheckCircle size={16} color="#fff" />
          ) : (
            <AlertCircle size={16} color="#fff" />
          )}
          <Text style={styles.toastText}>{toastConfig.message}</Text>
        </Animated.View>
      )}

      <View style={styles.card}>
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <View style={styles.titleLeft}>
              <Users size={18} color="#1f2937" style={styles.icon} />
              <Text style={styles.cardTitle}>Assigned players</Text>
              <Text style={styles.playerCount}>({assignedPlayers.length})</Text>
            </View>
            <TouchableOpacity
              onPress={() => loadPlayers(true)}
              disabled={isLoadingPlayers}
            >
              <RefreshCw
                size={16}
                color={isLoadingPlayers ? "#9ca3af" : "#1A9CFF"}
              />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.content}>
          {isLoadingPlayers ? (
            <View style={styles.centerBox}>
              <ActivityIndicator size="small" color="#1A9CFF" />
              <Text style={styles.mutedText}>Checking authentication...</Text>
            </View>
          ) : assignedPlayers.length === 0 ? (
            <ScrollView
              contentContainerStyle={styles.centerBox}
              refreshControl={
                <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
              }
            >
              <AlertCircle size={32} color="#9ca3af" />
              <Text style={styles.mutedText}>
                No data available. Pull to refresh or login again.
              </Text>
            </ScrollView>
          ) : (
            <ScrollView
              showsVerticalScrollIndicator={false}
              refreshControl={
                <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
              }
            >
              {assignedPlayers.map((player) => (
                <View key={player.id} style={styles.playerRow}>
                  <View style={styles.leftSection}>
                    <View style={styles.avatar}>
                      <Text style={styles.avatarText}>
                        {player.name ? player.name[0].toUpperCase() : "?"}
                      </Text>
                    </View>
                    <View>
                      <Text style={styles.playerName}>{player.name}</Text>
                      <Text style={styles.playerId}>ID: {player.id}</Text>
                    </View>
                  </View>
                  <View style={styles.rightSection}>
                    <Text style={styles.attendanceValue}>
                      {player.attendance}%
                    </Text>
                    <View
                      style={[
                        styles.badge,
                        player.status === "Active"
                          ? styles.badgeActive
                          : styles.badgeSecondary,
                      ]}
                    >
                      <Text style={styles.badgeText}>{player.status}</Text>
                    </View>
                  </View>
                </View>
              ))}
            </ScrollView>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 12, backgroundColor: "#f9fafb" },
  toastContainer: {
    position: "absolute",
    top: 40,
    left: 20,
    right: 20,
    padding: 10,
    borderRadius: 6,
    flexDirection: "row",
    alignItems: "center",
    zIndex: 1000,
  },
  toastText: { color: "#fff", fontWeight: "600", marginLeft: 8, fontSize: 11 },
  card: { flex: 1, backgroundColor: "#fff", borderRadius: 10, elevation: 2 },
  header: { padding: 12, borderBottomWidth: 1, borderBottomColor: "#f1f5f9" },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  titleLeft: { flexDirection: "row", alignItems: "center" },
  cardTitle: { fontSize: 14, fontWeight: "bold", color: "#1f2937" },
  playerCount: { marginLeft: 6, color: "#1A9CFF", fontSize: 13, fontWeight: "600" },
  content: { flex: 1, padding: 8 },
  centerBox: { flex: 1, justifyContent: "center", alignItems: "center" },
  mutedText: { fontSize: 11, color: "#64748b", marginTop: 8, textAlign: "center" },
  playerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 10,
    backgroundColor: "#f8fafc",
    marginBottom: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  leftSection: { flexDirection: "row", alignItems: "center" },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#1A9CFF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  avatarText: { color: "#fff", fontWeight: "bold", fontSize: 12 },
  playerName: { fontWeight: "700", fontSize: 11, color: "#1f2937" },
  playerId: { fontSize: 10, color: "#94a3b8", marginTop: 1 },
  rightSection: { alignItems: "flex-end" },
  attendanceValue: { fontWeight: "700", fontSize: 11, color: "#1e293b" },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 2,
  },
  badgeActive: { backgroundColor: "#10b981" },
  badgeSecondary: { backgroundColor: "#94a3b8" },
  badgeText: { color: "#fff", fontSize: 9, fontWeight: "bold", textTransform: "uppercase" },
  icon: { marginRight: 6 },
});

export default PlayersScreen;