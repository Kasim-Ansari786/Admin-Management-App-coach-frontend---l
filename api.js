import axios from "axios";
import AsyncStorage from '@react-native-async-storage/async-storage';

// Ensure this matches your ACTUAL machine IP
//const YOUR_COMPUTER_IP = "https://coneadminbackend.comdata.in";
const YOUR_COMPUTER_IP = "192.168.0.107"; 
const API_URL = `http://${YOUR_COMPUTER_IP}:3000`;

const API = axios.create({
  baseURL: `${API_URL}/api`, 
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000, 
});

const getAuthHeaders = (token) => {
    return {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    };
};

// 🔒 Token Storage Functions
export const saveToken = async (token) => {
  try {
    await AsyncStorage.setItem("userToken", token);
    console.log("✅ Token saved");
  } catch (error) {
    console.error("❌ Error saving token:", error);
  }
};

export const getToken = async () => {
  try {
    const token = await AsyncStorage.getItem("userToken");
    return token;
  } catch (error) {
    console.error("❌ Error retrieving token:", error);
    return null;
  }
};

export const clearToken = async () => {
  try {
    await AsyncStorage.removeItem("userToken");
    console.log("✅ Token cleared");
  } catch (error) {
    console.error("❌ Error clearing token:", error);
  }
};

export const saveUser = async (user) => {
  try {
    await AsyncStorage.setItem("userData", JSON.stringify(user));
    console.log("✅ User data saved");
  } catch (error) {
    console.error("❌ Error saving user:", error);
  }
};

export const getUser = async () => {
  try {
    const userData = await AsyncStorage.getItem("userData");
    return userData ? JSON.parse(userData) : null;
  } catch (error) {
    console.error("❌ Error retrieving user:", error);
    return null;
  }
};

export const clearUser = async () => {
  try {
    await AsyncStorage.removeItem("userData");
    console.log("✅ User data cleared");
  } catch (error) {
    console.error("❌ Error clearing user:", error);
  }
};


API.interceptors.request.use(
  async (config) => {
    const token = await getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);



///login user code & API call
export const signupUser = async ({ name, email, password, role }) => {
  try {
    const response = await fetch(`${API_URL}/api/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password, role }), 
    });

    const data = await response.json();

    if (!response.ok) {
      return { data: null, error: data.error || "Signup failed." };
    }

    return { data, error: null };
  } catch (err) {
    console.error("API Error (Signup):", err);
    return {
      data: null,
      error: "Could not connect to the server. Make sure backend is running.",
    };
  }
};

// Login user and get JWT token
export const loginUser = async ({ email, password, role }) => {
  try {
    const response = await fetch(`${API_URL}/api/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, role }), 
    });

    const data = await response.json();

    if (!response.ok) {
      return { data: null, error: data.error || "Login failed." };
    }

    return { data, error: null };
  } catch (err) {
    console.error("API Error (Login):", err);
    return {
      data: null,
      error: "Could not connect to the server. Make sure backend is running.",
    };
  }
};


//show the players list for this coach
export const fetchCoachAssignedPlayers = async (token) => {
  if (!token) {
    console.error(
      "Missing token for player fetch. This should be handled by the client."
    ); 
    throw new Error("Access Denied: No Token Provided");
  }

  try {
    const response = await fetch(`${API_URL}/api/coach-data`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      let errorData = {};
      try {
        errorData = await response.json();
      } catch (e) {}
      throw new Error(
        errorData.error || `Failed to fetch players: ${response.status}`
      );
    }

    const result = await response.json();

    if (!result || !Array.isArray(result.players)) {
      console.warn(
        "Players response is missing the 'players' array. Returning empty list.",
        result
      );
      return [];
    } 

    return result.players.map((player) => ({
      id: player.id || player.player_id,
      name: player.name,
      age: player.age,
      position: player.category,
      status: player.status,
      attendance: parseFloat(player.attendance || 0),
    }));
  } catch (err) {
    console.error("Error fetching coach players:", err);
    throw err;
  }
};

// show the meeting schedule add the new meeting API code 
export const addScheduleEvent = async (eventData, token) => {
    try {
        const response = await axios.post(`${API_URL}/api/schedule-addevents`, eventData, {
            headers: getAuthHeaders(token),
            withCredentials: true,
        });
        return response.data.data; 

    } catch (error) {
        console.error("Error adding schedule event:", error); 
        const errorMessage = error.response?.data?.error || error.response?.data?.message || error.message;
        throw new Error(errorMessage);
    }
};


// Fetch schedule events for the logged-in user
export const GetScheduleRecords = async (tenantId, coachId) => {
  if (!tenantId || !coachId) {
    throw new Error("GetScheduleRecords: Both tenantId and coachId are required");
  }

  try {
    const token = await getToken();
    const response = await axios.get(`${API_URL}/api/events-fetch/${tenantId}/${coachId}`, {
      headers: getAuthHeaders(token),
      withCredentials: true,
    });
    return response.data.data; 
    
  } catch (error) {
    const errorDetail = error.response
      ? error.response.data?.message || error.response.data || error.response.statusText
      : error.message;

    console.error("Error fetching schedule records:", errorDetail);
    throw new Error(`Failed to fetch schedule records: ${errorDetail}`);
  }
};

//Attendance API code can be added here similarly
export const recordAttendance = async (attendanceData, token) => {
  const endpoint = `${API_URL}/api/attendance`;

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`, 
      },
      body: JSON.stringify(attendanceData),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(result.error || `Error ${response.status}: Failed to save record.`);
    }
    
    return result;
  } catch (error) {
    console.error("API call failed:", error.message);
    throw error;
  }
};

// Fetch attendance records for a coach
export const GetAttendanceRecords = async (coachId, token) => {
  const endpoint = `${API_URL}/api/attendance-records/${coachId}`;

  try {
    const response = await fetch(endpoint, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(result.error || result.message || `Error ${response.status}: Failed to fetch attendance records.`);
    }
    
    return Array.isArray(result) ? result : result.data || [];
  } catch (error) {
    console.error("API call failed:", error.message);
    throw error;
  }
};

//sesssion management API can be added here
export const fetchSessionData = async (coachId, token) => {
  try {
    if (!coachId) {
      console.warn("fetchSessionData: Missing coachId");
      return [];
    }
    if (!token) {
      token = readTokenFromStorage();
      if (!token) {
        const refreshed = await tryRefreshToken();
        if (refreshed) {
          token = readTokenFromStorage();
        }
      }
    }

    if (!token) {
      console.error("fetchSessionData: Authentication token is missing.");
      return [];
    }

    const response = await axios.get(`${API_URL}/api/sessions-data/${encodeURIComponent(coachId)}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      withCredentials: true,
    });

    const sessions = response.data;
    console.log("Fetched session data:", sessions);
    if (!Array.isArray(sessions)) {
      console.warn("Data is not an array:", sessions);
      return [];
    }

    return sessions;
  } catch (error) {
    console.error("Error fetching session data:", error);
    if (axios.isAxiosError && axios.isAxiosError(error)) {
      console.error("Axios Status:", error.response?.status);
      console.error("Axios Data:", error.response?.data);
    }
    return [];
  }
};