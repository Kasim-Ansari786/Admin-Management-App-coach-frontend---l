import React from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  ActivityIndicator 
} from 'react-native';
import { Users } from 'lucide-react-native';

const PlayersScreen = ({ isLoadingPlayers, assignedPlayers = [] }) => {
  return (
    <View style={styles.container}>
      <View style={styles.card}>
        {/* Card Header */}
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <Users size={20} color="#1f2937" style={styles.icon} />
            <Text style={styles.cardTitle}>Assigned players</Text>
          </View>
          <Text style={styles.cardDescription}>
            Manage your assigned players and track their progress
          </Text>
        </View>

        {/* Card Content */}
        <View style={styles.content}>
          {isLoadingPlayers ? (
            <View style={styles.centerBox}>
              <ActivityIndicator color="#1A9CFF" />
              <Text style={styles.mutedText}>Loading players...</Text>
            </View>
          ) : assignedPlayers.length === 0 ? (
            <View style={styles.centerBox}>
              <Text style={styles.mutedText}>No players assigned.</Text>
            </View>
          ) : (
            <ScrollView showsVerticalScrollIndicator={false}>
              {assignedPlayers.map((player) => (
                <View key={player.id} style={styles.playerRow}>
                  {/* Left Side: Avatar and Name */}
                  <View style={styles.leftSection}>
                    <View style={styles.avatar}>
                      <Text style={styles.avatarText}>
                        {player.name ? player.name.charAt(0).toUpperCase() : "?"}
                      </Text>
                    </View>
                    <View>
                      <Text style={styles.playerName}>{player.name || "Unnamed Player"}</Text>
                      <Text style={styles.playerId}>ID: {player.id || "—"}</Text>
                    </View>
                  </View>

                  {/* Right Side: Stats and Status */}
                  <View style={styles.rightSection}>
                    <View style={styles.attendanceBox}>
                      <Text style={styles.attendanceValue}>{player.attendance || 0}%</Text>
                      <Text style={styles.attendanceLabel}>Attendance</Text>
                    </View>
                    
                    <View style={[
                      styles.badge, 
                      player.status === "Active" ? styles.badgeActive : styles.badgeSecondary
                    ]}>
                      <Text style={[
                        styles.badgeText, 
                        player.status === "Active" ? styles.textWhite : styles.textDark
                      ]}>
                        {player.status || "Unknown"}
                      </Text>
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
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f9fafb',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  icon: {
    marginRight: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  cardDescription: {
    fontSize: 13,
    color: '#6b7280',
    lineHeight: 18,
  },
  content: {
    padding: 16,
  },
  centerBox: {
    padding: 40,
    alignItems: 'center',
  },
  mutedText: {
    color: '#9ca3af',
    marginTop: 8,
  },
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 10,
    marginBottom: 10,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1A9CFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  playerName: {
    fontWeight: '600',
    fontSize: 14,
    color: '#1f2937',
  },
  playerId: {
    fontSize: 11,
    color: '#6b7280',
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  attendanceBox: {
    alignItems: 'flex-end',
    marginRight: 12,
  },
  attendanceValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1f2937',
  },
  attendanceLabel: {
    fontSize: 10,
    color: '#6b7280',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    minWidth: 60,
    alignItems: 'center',
  },
  badgeActive: {
    backgroundColor: '#1A9CFF',
  },
  badgeSecondary: {
    backgroundColor: '#e5e7eb',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  textWhite: {
    color: '#ffffff',
  },
  textDark: {
    color: '#374151',
  },
});

export default PlayersScreen;