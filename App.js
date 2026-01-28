import React from "react";
import { StatusBar } from "expo-status-bar";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

// 1. Double-check your folder names: 'screens' vs 'pages'
import LoginScreen from "./src/screens/LoginScreen";
import HomeScreen from "./src/screens/HomeScreen";
import PlayersScreen from "./src/pages/PlayersScreen";
import Schedule from "./src/pages/Schedule";
import Attendance from "./src/pages/Attendance" // Ensure the file is actually Attendance.js
import AttendanceRecords from "./src/pages/AttendanceRecords";

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login">
        
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{ title: "Login", headerShown: false }}
        />

        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{ title: "Home" }}
        />

        <Stack.Screen
          name="Players"
          component={PlayersScreen}
          options={{ title: "Players" }}
        />

        <Stack.Screen
          name="Schedule"
          component={Schedule}
          options={{ title: "Schedule" }}
        />

        <Stack.Screen
          name="Attendance"
          component={Attendance}
          options={{ title: "Attendance" }}
        />

        <Stack.Screen
          name="AttendanceRecords"
          component={AttendanceRecords}
          options={{ title: "Attendance Records" }}
        />

      </Stack.Navigator>

      <StatusBar style="auto" />
    </NavigationContainer>
  );
}