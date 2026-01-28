import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  Alert,
  ActivityIndicator
} from "react-native";
import { useNavigation } from '@react-navigation/native';
import { loginUser, saveToken, saveUser } from "../../api";
const { width } = Dimensions.get("window");

const theme = {
  colors: {
    background: "#1A9CFF",
    surface: "#FFFFFF",
    text: "#2D3436",
    textSecondary: "#636E72",
    primary: "#1A9CFF",
    border: "#E0E6ED",
    inputBg: "#F9FAFB",
    white: "#FFFFFF",
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 20,
    xl: 32,
  },
  radius: {
    soft: 12,
    round: 25,
  },
};

export default function LoginScreen() {
  const navigation = useNavigation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedRole, setSelectedRole] = useState("Coach");
  const [loading, setLoading] = useState(false);
  const roles = [{ label: "Coach", icon: "👤" }];


  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await loginUser({
        email,
        password,
        role: selectedRole,
      });

      if (error) {
        Alert.alert("Login Failed", error);
        setLoading(false);
        return;
      }
      if (data?.token) {
        await saveToken(data.token);
        console.log("✅ Token saved successfully!");
      }
      if (data?.user) {
        await saveUser(data.user);
      }

      setLoading(false);
      console.log("✅ Login successful!");
      navigation.replace("Home");
    } catch (err) {
      console.error("Login error:", err);
      Alert.alert("Error", "An unexpected error occurred");
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Top Branding */}
          <View style={styles.header}>
            <Text style={styles.appTitle}>Admin Management System</Text>
            <Text style={styles.madeBy}>
              Made In India With ❤️ By ComData Innovation
            </Text>
          </View>

          {/* Login Card */}
          <View style={styles.card}>
            <View style={styles.iconCircle}>
              <Text style={styles.loginIcon}>➔]</Text>
            </View>

            <Text style={styles.welcomeTitle}>Welcome Back</Text>
            <Text style={styles.welcomeSubtitle}>
              Sign in to your account to continue
            </Text>

            {/* Role Picker */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Select Your Role</Text>
              <TouchableOpacity
                activeOpacity={0.8}
                style={[
                  styles.inputRounded,
                  showDropdown && styles.inputActive,
                ]}
                onPress={() => setShowDropdown(!showDropdown)}
              >
                <View style={styles.row}>
                  <Text style={styles.roleIcon}>
                    {roles.find((r) => r.label === selectedRole)?.icon}
                  </Text>
                  <Text style={styles.inputText}>{selectedRole}</Text>
                </View>
                <Text style={styles.arrowIcon}>{showDropdown ? "▲" : "▼"}</Text>
              </TouchableOpacity>

              {showDropdown && (
                <View style={styles.dropdownList}>
                  {roles.map((item) => (
                    <TouchableOpacity
                      key={item.label}
                      style={[
                        styles.roleItem,
                        selectedRole === item.label && styles.roleItemSelected,
                      ]}
                      onPress={() => {
                        setSelectedRole(item.label);
                        setShowDropdown(false);
                      }}
                    >
                      <View style={styles.row}>
                        {selectedRole === item.label && (
                          <Text style={styles.checkMark}>✓</Text>
                        )}
                        <Text style={styles.roleIconSmall}>{item.icon}</Text>
                        <Text
                          style={[
                            styles.roleItemText,
                            selectedRole === item.label &&
                              styles.roleTextActive,
                          ]}
                        >
                          {item.label}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            {/* Email Input */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Email Address</Text>
              <TextInput
                style={styles.inputRounded}
                placeholder="email@example.com"
                placeholderTextColor="#A0A0A0"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            {/* Password Input */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Password</Text>
              <View style={[styles.inputRounded, styles.passwordRow]}>
                <TextInput
                  style={styles.flexInput}
                  placeholder="Enter password"
                  placeholderTextColor="#A0A0A0"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!isPasswordVisible}
                />
                <TouchableOpacity
                  onPress={() => setIsPasswordVisible(!isPasswordVisible)}
                >
                  <Text style={styles.eyeIcon}>
                    {isPasswordVisible ? "🙈" : "👁️"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Sign In Button */}
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                activeOpacity={0.9}
                style={[styles.smallButton, loading && styles.buttonDisabled]}
                onPress={handleLogin}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={styles.buttonText}>Sign In</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* Footer */}
          <Text style={styles.footerText}>
            © 2026 Admin Portal. All Rights Reserved.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  header: {
    alignItems: "center",
    marginBottom: theme.spacing.xl,
  },
  appTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: theme.colors.white,
    letterSpacing: 0.5,
  },
  madeBy: {
    fontSize: 11,
    color: theme.colors.white,
    opacity: 0.85,
    marginTop: 6,
  },
  card: {
    width: width * 0.86,
    backgroundColor: theme.colors.surface,
    borderRadius: 24,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  iconCircle: {
    width: 50,
    height: 50,
    backgroundColor: "#F0F7FF",
    borderRadius: 25,
    alignSelf: "center",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  loginIcon: { fontSize: 22, color: theme.colors.primary },
  welcomeTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: theme.colors.text,
    textAlign: "center",
  },
  welcomeSubtitle: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    textAlign: "center",
    marginBottom: 24,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
    fontWeight: "700",
    color: theme.colors.text,
    marginBottom: 6,
    marginLeft: 4,
  },
  inputRounded: {
    height: 46,
    backgroundColor: theme.colors.inputBg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.round,
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  inputActive: {
    borderColor: theme.colors.primary,
    backgroundColor: "#FFFFFF",
  },
  flexInput: {
    flex: 1,
    height: "100%",
    fontSize: 14,
    color: theme.colors.text,
  },
  passwordRow: {
    justifyContent: "flex-start",
  },
  row: { flexDirection: "row", alignItems: "center" },
  roleIcon: { fontSize: 16, marginRight: 10 },
  inputText: { fontSize: 14, color: theme.colors.text },
  arrowIcon: { fontSize: 10, color: theme.colors.textSecondary },

  dropdownList: {
    backgroundColor: "#FFF",
    borderRadius: 15,
    marginTop: 6,
    borderWidth: 1,
    borderColor: theme.colors.border,
    overflow: "hidden",
    elevation: 5,
    zIndex: 1000,
  },
  roleItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F1F1",
  },
  roleItemSelected: { backgroundColor: "#EAF6FF" },
  checkMark: {
    color: theme.colors.primary,
    marginRight: 8,
    fontWeight: "bold",
  },
  roleIconSmall: { fontSize: 14, marginRight: 10 },
  roleItemText: { fontSize: 14, color: theme.colors.textSecondary },
  roleTextActive: { color: theme.colors.primary, fontWeight: "700" },

  eyeIcon: { fontSize: 16, paddingLeft: 10 },

  buttonContainer: {
    alignItems: "center",
    marginTop: 10,
  },
  smallButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: theme.radius.round,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
    minWidth: 150,
    justifyContent: 'center',
    alignItems: 'center'
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: "#FFF",
    fontSize: 15,
    fontWeight: "bold",
  },
  footerText: {
    marginTop: 30,
    fontSize: 11,
    color: "#FFF",
    opacity: 0.7,
    textAlign: 'center'
  },
});