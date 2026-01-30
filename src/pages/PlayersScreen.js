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
  Modal,
  Pressable,
} from "react-native";
import {
  Users,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  ChevronRight,
  X,
  User,
  Hash,
  Activity,
  Calendar,
  Phone,
  ShieldAlert,
} from "lucide-react-native";
// Ensure these paths match your project structure
import { fetchCoachAssignedPlayers, getToken, fetchTeacherAssignedStudents, getUser } from "../../api";

const PlayersScreen = ({ navigation }) => {
  const [assignedPlayers, setAssignedPlayers] = useState([]);
  const [isLoadingPlayers, setIsLoadingPlayers] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [accessDenied, setAccessDenied] = useState(false);

  // --- Detail Modal State ---
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

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

  // --- Fetch List of Players ---
  const loadPlayers = useCallback(
    async (isManual = false) => {
      try {
        setAccessDenied(false);
        if (!isRefreshing) setIsLoadingPlayers(true);

        const token = await getToken();

        if (!token) {
          showToast("No session found. Please login.", "error");
          navigation.replace("Login");
          return;
        }

        // Both coach and teacher roles use the same endpoint
        // The backend handles role-based filtering
        const response = await fetchCoachAssignedPlayers(token);
        setAssignedPlayers(response || []);

        if (isManual) {
          showToast("List updated successfully!", "success");
        }
      } catch (error) {
        console.error("Fetch Error:", error);
        const errorMsg = error.message || "";

        if (errorMsg.includes("Access denied") || errorMsg.includes("401")) {
          setAccessDenied(true);
          showToast("Session expired. Please login again.", "error");
          navigation.replace("Login");
        } else {
          showToast(errorMsg || "Failed to load players", "error");
        }
      } finally {
        setIsLoadingPlayers(false);
        setIsRefreshing(false);
      }
    },
    [isRefreshing, navigation],
  );

  useEffect(() => {
    loadPlayers();
  }, [loadPlayers]);

  const onRefresh = () => {
    setIsRefreshing(true);
    loadPlayers(true);
  };

  const handlePlayerPress = (player) => {
    setSelectedPlayer(player);
    setModalVisible(true);
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

      {/* --- PLAYER DETAIL MODAL --- */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setModalVisible(false)}
        >
          <View
            style={styles.modalContent}
            onStartShouldSetResponder={() => true}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>PLAYER PROFILE</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <X size={24} color="#64748b" />
              </TouchableOpacity>
            </View>

            {selectedPlayer && (
              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.modalBody}
              >
                {/* Large Avatar Wrapper */}
                <View style={styles.largeAvatar}>
                  <Text style={styles.largeAvatarText}>
                    {selectedPlayer.name
                      ? selectedPlayer.name[0].toUpperCase()
                      : "?"}
                  </Text>
                </View>

                <DetailItem
                  icon={<User size={22} color="#1A9CFF" />}
                  label="Full Name"
                  value={selectedPlayer.name}
                />
                <DetailItem
                  icon={<Hash size={22} color="#1A9CFF" />}
                  label="Player ID"
                  value={selectedPlayer.id}
                />
                <DetailItem
                  icon={<Calendar size={22} color="#1A9CFF" />}
                  label="Age"
                  value={selectedPlayer.age || "Not Set"}
                />
                <DetailItem
                  icon={<Phone size={22} color="#1A9CFF" />}
                  label="Phone"
                  value={selectedPlayer.phone || "Not Provided"}
                />

                <View style={styles.detailItem}>
                  <Activity size={22} color="#1A9CFF" />
                  <View style={styles.detailTextGroup}>
                    <Text style={styles.detailLabel}>Status</Text>
                    <Text
                      style={[
                        styles.detailValue,
                        {
                          color:
                            selectedPlayer.status === "Active"
                              ? "#10b981"
                              : "#ef4444",
                        },
                      ]}
                    >
                      {selectedPlayer.status || "Inactive"}
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={styles.closeButtonText}>Close Profile</Text>
                </TouchableOpacity>
              </ScrollView>
            )}
          </View>
        </Pressable>
      </Modal>

      {/* --- MAIN LIST CARD --- */}
      <View style={styles.card}>
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <View style={styles.titleLeft}>
              <Users size={20} color="#1f2937" style={styles.icon} />
              <Text style={styles.cardTitle}>Assigned Roster</Text>
              <View style={styles.countBadge}>
                <Text style={styles.playerCount}>{assignedPlayers.length}</Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={() => loadPlayers(true)}
              disabled={isLoadingPlayers}
            >
              <RefreshCw
                size={18}
                color={isLoadingPlayers ? "#9ca3af" : "#1A9CFF"}
              />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.content}>
          {isLoadingPlayers ? (
            <View style={styles.centerBox}>
              <ActivityIndicator size="small" color="#1A9CFF" />
              <Text style={styles.mutedText}>Loading your roster...</Text>
            </View>
          ) : accessDenied ? (
            <View style={styles.centerBox}>
              <ShieldAlert size={48} color="#ef4444" />
              <Text
                style={[
                  styles.mutedText,
                  { color: "#ef4444", fontWeight: "600" },
                ]}
              >
                Access Denied
              </Text>
              <Text style={styles.mutedText}>
                Only registered Coaches can view this list.
              </Text>
            </View>
          ) : assignedPlayers.length === 0 ? (
            <ScrollView
              contentContainerStyle={styles.centerBox}
              refreshControl={
                <RefreshControl
                  refreshing={isRefreshing}
                  onRefresh={onRefresh}
                />
              }
            >
              <AlertCircle size={40} color="#cbd5e1" />
              <Text style={styles.mutedText}>No players assigned yet.</Text>
            </ScrollView>
          ) : (
            <ScrollView
              showsVerticalScrollIndicator={false}
              refreshControl={
                <RefreshControl
                  refreshing={isRefreshing}
                  onRefresh={onRefresh}
                />
              }
            >
              {assignedPlayers.map((player) => (
                <TouchableOpacity
                  key={player.id}
                  style={styles.playerRow}
                  onPress={() => handlePlayerPress(player)}
                  activeOpacity={0.6}
                >
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
                    <ChevronRight size={18} color="#cbd5e1" />
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>
      </View>
    </View>
  );
};

// Helper component for modal rows
const DetailItem = ({ icon, label, value }) => (
  <View style={styles.detailItem}>
    {icon}
    <View style={styles.detailTextGroup}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{String(value)}</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#f3f4f6" },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
    maxHeight: "90%",
    elevation: 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#64748b",
    letterSpacing: 1,
  },
  modalBody: { alignItems: "center", paddingBottom: 30 },
  largeAvatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "#1A9CFF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  largeAvatarText: { color: "#fff", fontSize: 36, fontWeight: "bold" },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    backgroundColor: "#f8fafc",
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  detailTextGroup: { marginLeft: 16, flex: 1 },
  detailLabel: {
    fontSize: 10,
    color: "#64748b",
    textTransform: "uppercase",
    fontWeight: "700",
    marginBottom: 2,
  },
  detailValue: { fontSize: 15, color: "#1f2937", fontWeight: "600" },
  closeButton: {
    marginTop: 15,
    backgroundColor: "#1f2937",
    paddingVertical: 16,
    width: "100%",
    borderRadius: 16,
    alignItems: "center",
  },
  closeButtonText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  toastContainer: {
    position: "absolute",
    top: 50,
    left: 16,
    right: 16,
    padding: 14,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    zIndex: 9999,
    elevation: 10,
  },
  toastText: { color: "#fff", fontWeight: "600", marginLeft: 10, fontSize: 13 },
  card: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 20,
    overflow: "hidden",
    elevation: 3,
  },
  header: { padding: 18, borderBottomWidth: 1, borderBottomColor: "#f1f5f9" },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  titleLeft: { flexDirection: "row", alignItems: "center" },
  cardTitle: { fontSize: 16, fontWeight: "700", color: "#1f2937" },
  countBadge: {
    backgroundColor: "#e0f2fe",
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: 12,
    marginLeft: 10,
  },
  playerCount: { color: "#0369a1", fontSize: 13, fontWeight: "bold" },
  content: { flex: 1, padding: 12 },
  centerBox: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
  },
  mutedText: {
    fontSize: 14,
    color: "#94a3b8",
    marginTop: 12,
    textAlign: "center",
  },
  playerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 14,
    backgroundColor: "#fff",
    marginBottom: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  leftSection: { flexDirection: "row", alignItems: "center" },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#1A9CFF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  avatarText: { color: "#fff", fontWeight: "bold", fontSize: 18 },
  playerName: { fontWeight: "700", fontSize: 15, color: "#1f2937" },
  playerId: { fontSize: 13, color: "#94a3b8" },
  rightSection: { flexDirection: "row", alignItems: "center" },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    marginRight: 8,
  },
  badgeActive: { backgroundColor: "#dcfce7" },
  badgeSecondary: { backgroundColor: "#f1f5f9" },
  badgeText: {
    color: "#166534",
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  icon: { marginRight: 8 },
});

export default PlayersScreen;
