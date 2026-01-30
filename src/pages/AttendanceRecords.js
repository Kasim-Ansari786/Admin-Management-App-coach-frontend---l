import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";
import * as XLSX from "xlsx";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";

import { GetAttendanceRecords, getToken, getUser } from "../../api";

const AttendancePage = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredData, setFilteredData] = useState([]);
  const [user, setUser] = useState(null);
  const [exporting, setExporting] = useState(false);

  // --- New State for Popup ---
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await getUser();
        if (userData) {
          setUser(userData);
        }
      } catch (error) {
        console.error("Error loading user:", error);
      }
    };
    loadUser();
  }, []);

  useEffect(() => {
    if (user?.id) {
      fetchRecords();
    }
  }, [user]);

  const fetchRecords = async () => {
    try {
      setLoading(true);
      const token = await getToken();
      if (!token || !user?.id) {
        setLoading(false);
        return;
      }

      const records = await GetAttendanceRecords(user.id, token);

      const formattedRecords = Array.isArray(records)
        ? records.map((record, index) => ({
            id: record.player_id
              ? `${record.player_id}-${record.attendance_date}-${index}`
              : `record-${index}`,
            player: record.name || "Unknown",
            date: record.attendance_date
              ? record.attendance_date.split("T")[0]
              : "N/A",
            status: record.attendance_status || record.status || "N/A",
            markedBy: record.coach_name || "N/A",
            time: record.created_time || record.time || "N/A",
            // Keep extra details for the popup
            playerId: record.player_id || "N/A",
            // notes: record.remarks || record.notes || "No additional notes",
          }))
        : [];

      setData(formattedRecords);
      setFilteredData(formattedRecords);
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Fetch Failed",
        text2: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (text) => {
    setSearchQuery(text);
    const filtered = data.filter((item) =>
      item.player.toLowerCase().includes(text.toLowerCase())
    );
    setFilteredData(filtered);
  };

  const openPlayerDetails = (player) => {
    setSelectedPlayer(player);
    setModalVisible(true);
  };

  // --- EXPORT LOGIC ---
  const exportToExcel = async () => {
    if (filteredData.length === 0) {
      Toast.show({
        type: "info",
        text1: "No Data",
        text2: "No attendance records to export",
        position: "top",
      });
      return;
    }

    setExporting(true);
    try {
      const excelData = filteredData.map((item) => ({
        "Player Name": item.player,
        Date: item.date,
        Status: item.status,
        "Check-in Time": item.time,
        "Marked By": item.markedBy,
      }));

      const ws = XLSX.utils.json_to_sheet(excelData);
      ws["!cols"] = [{ wch: 20 }, { wch: 15 }, { wch: 12 }, { wch: 15 }, { wch: 15 }];
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Attendance Records");

      const wbout = XLSX.write(wb, { type: "base64", bookType: "xlsx" });
      const timestamp = new Date().toISOString().slice(0, 10);
      const fileName = `Attendance_${timestamp}.xlsx`;
      const fileUri = FileSystem.documentDirectory + fileName;

      await FileSystem.writeAsStringAsync(fileUri, wbout, { encoding: "base64" });

      await Sharing.shareAsync(fileUri, {
        mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        dialogTitle: "Share Attendance Report",
        UTI: "com.microsoft.excel.xlsx",
      });

      Toast.show({
        type: "success",
        text1: "✅ Export Successful!",
        text2: `Records exported to ${fileName}`,
      });
    } catch (error) {
      console.error("❌ Export error:", error);
      Toast.show({
        type: "error",
        text1: "❌ Export Failed",
        text2: error.message || "Failed to export",
      });
    } finally {
      setExporting(false);
    }
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.row} 
      onPress={() => openPlayerDetails(item)}
      activeOpacity={0.7}
    >
      <Text style={[styles.cell, { flex: 2, fontWeight: '500' }]}>{item.player}</Text>
      <Text style={[styles.cell, { flex: 1.5 }]}>{item.date}</Text>
      <View style={[styles.cell, { flex: 1.5 }]}>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: item.status === "Present" ? "#E6F7EF" : "#FFEBEB" },
          ]}
        >
          <Text
            style={[
              styles.statusText,
              { color: item.status === "Present" ? "#28A745" : "#DC3545" },
            ]}
          >
            {item.status}
          </Text>
        </View>
      </View>
      <Text style={[styles.cell, { flex: 1 }]}>{item.time}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Attendance Records</Text>
        <Text style={styles.subtitle}>View and export history</Text>
      </View>

      <View style={styles.filterContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search players..."
          value={searchQuery}
          onChangeText={handleSearch}
        />
        <TouchableOpacity
          style={[styles.exportButton, exporting && styles.exportButtonDisabled]}
          onPress={exportToExcel}
          disabled={exporting}
        >
          {exporting ? (
            <ActivityIndicator color="#1D6F42" size="small" />
          ) : (
            <>
              <MaterialCommunityIcons name="file-excel" size={18} color="#1D6F42" />
              <Text style={styles.exportText}>Export</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.tableHeader}>
        <Text style={[styles.headerLabel, { flex: 2 }]}>Player</Text>
        <Text style={[styles.headerLabel, { flex: 1.5 }]}>Date</Text>
        <Text style={[styles.headerLabel, { flex: 1.5 }]}>Status</Text>
        <Text style={[styles.headerLabel, { flex: 1 }]}>Time</Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#007AFF" style={{ marginTop: 20 }} />
      ) : (
        <FlatList
          data={filteredData}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={<Text style={styles.emptyText}>No records found.</Text>}
        />
      )}

      {/* --- PLAYER DETAILS POPUP --- */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable 
          style={styles.modalOverlay} 
          onPress={() => setModalVisible(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Player Details</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <MaterialCommunityIcons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            {selectedPlayer && (
              <ScrollView style={styles.modalBody}>
                <DetailRow label="Player Name" value={selectedPlayer.player} icon="account" />
                <DetailRow label="Player ID" value={selectedPlayer.playerId} icon="id-card" />
                <DetailRow label="Date" value={selectedPlayer.date} icon="calendar" />
                <DetailRow label="Status" value={selectedPlayer.status} icon="check-circle" isStatus status={selectedPlayer.status} />
                <DetailRow label="Check-in Time" value={selectedPlayer.time} icon="clock-outline" />
                <DetailRow label="Marked By" value={selectedPlayer.markedBy} icon="account-tie" />
                {/* <DetailRow label="Notes" value={selectedPlayer.notes} icon="note-text-outline" /> */}
              </ScrollView>
            )}

            <TouchableOpacity 
              style={styles.closeButton} 
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>

      <Toast />
    </SafeAreaView>
  );
};

// Helper Component for Modal Rows
const DetailRow = ({ label, value, icon, isStatus, status }) => (
  <View style={styles.detailRow}>
    <MaterialCommunityIcons name={icon} size={20} color="#666" style={styles.detailIcon} />
    <View>
      <Text style={styles.detailLabel}>{label}</Text>
      {isStatus ? (
        <Text style={[styles.detailValue, { color: status === "Present" ? "#28A745" : "#DC3545", fontWeight: '700' }]}>
          {value}
        </Text>
      ) : (
        <Text style={styles.detailValue}>{value}</Text>
      )}
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8F9FA", padding: 16 },
  header: { marginBottom: 20, marginTop: 10 },
  title: { fontSize: 24, fontWeight: "bold", color: "#1A1A1A" },
  subtitle: { fontSize: 14, color: "#666" },
  filterContainer: { flexDirection: "row", marginBottom: 15, alignItems: "center" },
  searchInput: {
    flex: 1, height: 45, backgroundColor: "#FFF", borderRadius: 10,
    paddingHorizontal: 15, borderWidth: 1, borderColor: "#E0E0E0", elevation: 2,
  },
  exportButton: {
    flexDirection: "row", marginLeft: 10, paddingVertical: 10, paddingHorizontal: 15,
    borderRadius: 10, backgroundColor: "#EBF5EE", borderWidth: 1, borderColor: "#1D6F42", alignItems: "center",
  },
  exportButtonDisabled: { backgroundColor: "#D4E8E0", opacity: 0.6 },
  exportText: { color: "#1D6F42", marginLeft: 5, fontWeight: "700" },
  tableHeader: {
    flexDirection: "row", paddingVertical: 12, backgroundColor: "#F1F3F5",
    borderRadius: 8, paddingHorizontal: 10, marginBottom: 5,
  },
  headerLabel: { fontWeight: "700", color: "#495057", fontSize: 13 },
  row: {
    flexDirection: "row", paddingVertical: 15, borderBottomWidth: 1,
    borderBottomColor: "#EEE", alignItems: "center", paddingHorizontal: 10,
  },
  cell: { fontSize: 11, color: "#333" },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusText: { fontSize: 11, fontWeight: "700" },
  emptyText: { textAlign: "center", marginTop: 40, color: "#ADB5BD", fontSize: 16 },
  
  // Modal Styles
  modalOverlay: {
    flex: 1, backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center", alignItems: "center", padding: 20,
  },
  modalContent: {
    width: "100%", backgroundColor: "white", borderRadius: 20,
    padding: 20, maxHeight: "80%", elevation: 5,
  },
  modalHeader: {
    flexDirection: "row", justifyContent: "space-between",
    alignItems: "center", marginBottom: 20, borderBottomWidth: 1, borderBottomColor: '#EEE', paddingBottom: 10
  },
  modalTitle: { fontSize: 13, fontWeight: "bold", color: "#333" },
  modalBody: { marginBottom: 20 },
  detailRow: { flexDirection: "row", marginBottom: 15, alignItems: "center" },
  detailIcon: { marginRight: 15, width: 25 },
  detailLabel: { fontSize: 11, color: "#888", textTransform: "uppercase" },
  detailValue: { fontSize: 11, color: "#333", marginTop: 2 },
  closeButton: {
    backgroundColor: "#007AFF", paddingVertical: 12, borderRadius: 10, alignItems: "center",
  },
  closeButtonText: { color: "white", fontWeight: "bold", fontSize: 16 },
});

export default AttendancePage;