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
      item.player.toLowerCase().includes(text.toLowerCase()),
    );
    setFilteredData(filtered);
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
      // Prepare Excel data with formatting
      const excelData = filteredData.map((item) => ({
        "Player Name": item.player,
        "Date": item.date, 
        "Status": item.status,
        "Check-in Time": item.time,
        "Marked By": item.markedBy,
      }));

      console.log("📊 Preparing Excel sheet with", excelData.length, "records");

      // Create worksheet
      const ws = XLSX.utils.json_to_sheet(excelData);
      
      // Set column widths
      ws["!cols"] = [
        { wch: 20 }, // Player Name
        { wch: 15 }, // Date
        { wch: 12 }, // Status
        { wch: 15 }, // Check-in Time
        { wch: 15 }, // Marked By
      ];

      // Create workbook
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Attendance Records");

      // Generate base64 file
      const wbout = XLSX.write(wb, { type: "base64", bookType: "xlsx" });
      
      // Create file path with timestamp
      const timestamp = new Date().toISOString().slice(0, 10);
      const fileName = `Attendance_${timestamp}.xlsx`;
      const fileUri = FileSystem.documentDirectory + fileName;

      console.log("💾 Writing file to:", fileUri);

      // Write file to device
      // @ts-ignore - Suppress deprecation warning, using stable API
      await FileSystem.writeAsStringAsync(fileUri, wbout, {
        encoding: 'base64',
      });

      console.log("✅ File created successfully");

      // Share/download file
      const shareResult = await Sharing.shareAsync(fileUri, {
        mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        dialogTitle: "Share Attendance Report",
        UTI: "com.microsoft.excel.xlsx",
      });

      console.log("📤 Share result:", shareResult);

      // Handle share result with proper null checking
      if (shareResult && shareResult.action === Sharing.sharedAction) {
        Toast.show({
          type: "success",
          text1: "✅ Export Successful!",
          text2: `Exported ${filteredData.length} attendance records to ${fileName}`,
          position: "top",
          visibilityTime: 4000,
        });
        console.log("✅ File shared successfully");
      } else if (shareResult && shareResult.action === Sharing.dismissedAction) {
        Toast.show({
          type: "info",
          text1: "Export Cancelled",
          text2: "File saved but not shared",
          position: "top",
        });
      } else {
        // File was shared successfully or handled by system
        Toast.show({
          type: "success",
          text1: "✅ Export Successful!",
          text2: `Exported ${filteredData.length} attendance records to ${fileName}`,
          position: "top",
          visibilityTime: 4000,
        });
        console.log("✅ File saved and ready to use");
      }
    } catch (error) {
      console.error("❌ Export error:", error);
      Toast.show({
        type: "error",
        text1: "❌ Export Failed",
        text2: error.message || "Failed to export attendance records",
        position: "top",
        visibilityTime: 4000,
      });
    } finally {
      setExporting(false);
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.row}>
      <Text style={[styles.cell, { flex: 2 }]}>{item.player}</Text>
      <Text style={[styles.cell, { flex: 1.5 }]}>{item.date}</Text>
      <View style={[styles.cell, { flex: 1.5 }]}>
        <View
          style={[
            styles.statusBadge,
            {
              backgroundColor:
                item.status === "Present" ? "#E6F7EF" : "#FFEBEB",
            },
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
    </View>
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
            <>
              <ActivityIndicator color="#1D6F42" size="small" />
              <Text style={styles.exportText}>Exporting...</Text>
            </>
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
        <ActivityIndicator
          size="large"
          color="#007AFF"
          style={{ marginTop: 20 }}
        />
      ) : (
        <FlatList
          data={filteredData}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No records found.</Text>
          }
        />
      )}
      <Toast />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8F9FA", padding: 16 },
  header: { marginBottom: 20, marginTop: 10 },
  title: { fontSize: 24, fontWeight: "bold", color: "#1A1A1A" },
  subtitle: { fontSize: 14, color: "#666" },
  filterContainer: {
    flexDirection: "row",
    marginBottom: 15,
    alignItems: "center",
  },
  searchInput: {
    flex: 1,
    height: 45,
    backgroundColor: "#FFF",
    borderRadius: 10,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    elevation: 2,
  },
  exportButton: {
    flexDirection: "row",
    marginLeft: 10,
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 10,
    backgroundColor: "#EBF5EE",
    borderWidth: 1,
    borderColor: "#1D6F42",
    alignItems: "center",
  },
  exportButtonDisabled: {
    backgroundColor: "#D4E8E0",
    borderColor: "#9CB9AC",
    opacity: 0.6,
  },
  exportText: { color: "#1D6F42", marginLeft: 5, fontWeight: "700" },
  tableHeader: {
    flexDirection: "row",
    paddingVertical: 12,
    backgroundColor: "#F1F3F5",
    borderRadius: 8,
    paddingHorizontal: 10,
    marginBottom: 5,
  },
  headerLabel: { fontWeight: "700", color: "#495057", fontSize: 13 },
  row: {
    flexDirection: "row",
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#EEE",
    alignItems: "center",
    paddingHorizontal: 10,
  },
  cell: { fontSize: 14, color: "#333" },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusText: { fontSize: 12, fontWeight: "700" },
  emptyText: {
    textAlign: "center",
    marginTop: 40,
    color: "#ADB5BD",
    fontSize: 16,
  },
});

export default AttendancePage;
