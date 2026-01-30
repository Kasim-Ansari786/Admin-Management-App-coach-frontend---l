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


export const getUserRole = async () => {
  return axios.get("/user/role");
};


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
      
      const serverMsg = errorData.error || errorData.message || "";
      console.error('fetchCoachAssignedPlayers error response:', response.status, serverMsg);
      throw new Error(
        serverMsg || `Failed to fetch players: ${response.status}`
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

    console.log(`[fetchCoachAssignedPlayers] Fetched ${result.players.length} players`);
    return result.players.map((player) => ({
      id: player.id || player.player_id,
      name: player.name,
      age: player.age,
      position: player.category,
      status: player.status,
      attendance: parseFloat(player.attendance || player.attendance_percentage || 0),
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

    // Read response as text first so malformed JSON won't crash parsing
    const text = await response.text();
    let result;
    try {
      result = text ? JSON.parse(text) : {};
    } catch (e) {
      // if JSON parsing fails, keep raw text
      result = text || {};
    }

    // If backend returned a 404 with a 'No data' message, treat as empty list
    const serverMessage = (result && (result.error || result.message)) || (typeof result === 'string' ? result : null);
    if (!response.ok) {
      if (response.status === 404 && serverMessage && /no data/i.test(serverMessage)) {
        console.warn('No attendance records found for coach:', coachId);
        return [];
      }

      // If backend forbids access to non-coach roles, return empty array instead of throwing
      if (response.status === 403 || (serverMessage && /only coaches/i.test(serverMessage))) {
        console.warn('GetAttendanceRecords: access denied for coachId', coachId, serverMessage);
        return [];
      }

      throw new Error(serverMessage || `Error ${response.status}: Failed to fetch attendance records.`);
    }

    // Successful response: normalize result into an array
    if (Array.isArray(result)) return result;
    if (result && Array.isArray(result.data)) return result.data;
    if (result && Array.isArray(result.records)) return result.records;
    if (serverMessage && /no data/i.test(serverMessage)) return [];

    // If it's a single record object, wrap in array; otherwise return empty array
    if (result && typeof result === 'object' && Object.keys(result).length > 0) {
      return result.data || result.records || [result];
    }

    return [];
  } catch (error) {
    console.error("API call failed:", error && error.message ? error.message : error);
    throw error;
  }
};

//sesssion management API can be added here
// export const fetchSessionData = async (coachId, token) => {
//   try {
//     if (!coachId) {
//       console.warn("fetchSessionData: Missing coachId");
//       return [];
//     }
//     if (!token) {
//       token = readTokenFromStorage();
//       if (!token) {
//         const refreshed = await tryRefreshToken();
//         if (refreshed) {
//           token = readTokenFromStorage();
//         }
//       }
//     }

//     if (!token) {
//       console.error("fetchSessionData: Authentication token is missing.");
//       return [];
//     }

//     const response = await axios.get(`${API_URL}/api/sessions-data/${encodeURIComponent(coachId)}`, {
//       headers: {
//         Authorization: `Bearer ${token}`,
//         "Content-Type": "application/json",
//       },
//       withCredentials: true,
//     });

//     const sessions = response.data;
//     console.log("Fetched session data:", sessions);
//     if (!Array.isArray(sessions)) {
//       console.warn("Data is not an array:", sessions);
//       return [];
//     }

//     return sessions;
//   } catch (error) {
//     console.error("Error fetching session data:", error);
//     if (axios.isAxiosError && axios.isAxiosError(error)) {
//       console.error("Axios Status:", error.response?.status);
//       console.error("Axios Data:", error.response?.data);
//     }
//     return [];
//   }
// };

//show the all players details
export const getPlayerDetailsByGuardianEmail = async (email, maybePlayerIdOrToken, maybeToken) => {
  let playerId = null;
  let token = null;

  if (maybeToken !== undefined) {
    playerId = maybePlayerIdOrToken;
    token = maybeToken;
  } else {
    token = maybePlayerIdOrToken;
  }

  if (!email || !token) {
    throw new Error("Missing required credentials (email or token).");
  }

  try {
    const url = playerId 
      ? `${API_URL}/api/player-details/${encodeURIComponent(email)}/${playerId}`
      : `${API_URL}/api/player-details-by-guardian/${encodeURIComponent(email)}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`API Error ${response.status}: Failed to fetch.`);
    }
    const data = await response.json();
    const mapPlayerData = (child) => ({
      player_id: child.player_id,
      name: child.name,
      age: child.age,
      center: child.center,
      coach: child.coach,
      position: child.position,
      phone_no: child.phone_no,
      player_email: child.player_email,
      attendance_percentage: parseFloat(child.attendance_percentage) || 0,
      recent_activities: child.recent_activities_json || [], 
    });

    return Array.isArray(data) ? data.map(mapPlayerData) : [mapPlayerData(data)];

  } catch (err) {
    console.error("Error fetching player details:", err);
    throw err;
  }
};

// Fetch single player details by player ID
export const GetPlayerDetails = async (token, playerId) => {
  if (!token || !playerId) {
    throw new Error("Missing required parameters: token and playerId");
  }

  try {
    const response = await fetch(`${API_URL}/api/player/${encodeURIComponent(playerId)}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`API Error ${response.status}: Failed to fetch player details.`);
    }

    const data = await response.json();
    
    // Map the response to include all relevant player details
    return {
      id: data.id || data.player_id,
      name: data.name,
      age: data.age,
      position: data.category || data.position,
      status: data.status,
      attendance: parseFloat(data.attendance || 0),
      center: data.center,
      coach: data.coach,
      phone_no: data.phone_no,
      player_email: data.player_email,
      attendance_percentage: parseFloat(data.attendance_percentage || 0),
      recent_activities: data.recent_activities_json || [],
    };
  } catch (err) {
    console.error("Error fetching player details:", err);
    throw err;
  }
};


//fetch coach session summary
export const fetchSessionData = async (coachId, token) => {
  try {
    if (!coachId) {
      console.warn("fetchSessionData: Missing coachId");
      return [];
    }

    let activeToken = token;
    if (!activeToken) {
      activeToken = typeof readTokenFromStorage === 'function' ? readTokenFromStorage() : null;
      
      if (!activeToken && typeof tryRefreshToken === 'function') {
        const refreshed = await tryRefreshToken();
        if (refreshed) {
          activeToken = readTokenFromStorage();
        }
      }
    }

    if (!activeToken) {
      console.error("fetchSessionData: Authentication token is missing.");
      return [];
    }

    const response = await axios.get(
      `${API_URL}/api/sessions-data/${encodeURIComponent(coachId)}`, 
      {
        headers: {
          Authorization: `Bearer ${activeToken}`,
          "Content-Type": "application/json",
        },
        withCredentials: true,
      }
    );

    // Normalize various possible response shapes from backend
    // possible shapes: [] OR { data: [] } OR { sessions: [] } OR { payload: { data: [] } }
    const resp = response.data;
    let sessions = [];

    if (Array.isArray(resp)) {
      sessions = resp;
    } else if (resp && Array.isArray(resp.data)) {
      sessions = resp.data;
    } else if (resp && Array.isArray(resp.sessions)) {
      sessions = resp.sessions;
    } else if (resp && resp.payload && Array.isArray(resp.payload.data)) {
      sessions = resp.payload.data;
    } else if (resp && resp.payload && Array.isArray(resp.payload.sessions)) {
      sessions = resp.payload.sessions;
    } else {
      console.warn("fetchSessionData: unexpected response shape", resp);
      sessions = [];
    }

    console.log(`Successfully fetched ${sessions.length} sessions for coach ${coachId}.`);
    return sessions;

  } catch (error) {
    console.error("Error fetching session data:");
    
    if (axios.isAxiosError(error)) {
      console.error("Status:", error.response?.status);
      console.error("Message:", error.response?.data?.error || error.message);
    } else {
      console.error("Unexpected Error:", error);
    }
    
    return [];
  }
};

///techaer assigned players fetch API
export const fetchTeacherAssignedStudents = async (token) => {
  if (!token) {
    console.error("Missing token for fetch. This should be handled by the client.");
    throw new Error("Access Denied: No Token Provided");
  }

  const commonHeaders = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };

  const mapPlayer = (player) => ({
    id: player.id || player.player_id,
    name: player.name,
    age: player.age,
    position: player.category || player.position,
    status: player.status,
    phone: player.guardian_contact_number || player.phone_no,
    attendance: parseFloat(player.attendance || player.attendance_percentage || 0),
  });

  try {
    // Get stored user info for teacher dashboard call
    const storedUser = await getUser();
    const teacherEmail = storedUser?.email;
    const role = storedUser?.role && String(storedUser.role).toLowerCase();

    console.log(`[fetchTeacherAssignedStudents] role=${role}, email=${teacherEmail}`);

    // 1. Primary Attempt: Teacher Dashboard with email query param
    if (teacherEmail) {
      const url = `${API_URL}/api/teacher/dashboard?email=${encodeURIComponent(teacherEmail)}`;
      console.log(`[fetchTeacherAssignedStudents] Calling: ${url}`);
      
      try {
        const response = await fetch(url, {
          method: "GET",
          headers: commonHeaders,
        });

        if (response.ok) {
          const result = await response.json();
          console.log(`[fetchTeacherAssignedStudents] Success, response:`, result);
          // Normalize response: accept { data: [] }, { success: true, data: [] }, { players: [] }, or plain array
          const rows = Array.isArray(result) ? result : (result.data || result.players || result.rows || []);
          return Array.isArray(rows) ? rows.map(mapPlayer) : [];
        }

        // Log error details
        const errorData = await response.json().catch(() => ({}));
        const serverMsg = errorData.error || errorData.message || "";
        console.warn(`[fetchTeacherAssignedStudents] Primary endpoint failed (${response.status}): ${serverMsg}`);

        // Treat 404 as endpoint not found, continue to fallbacks
        if (response.status === 404) {
          console.warn('[fetchTeacherAssignedStudents] Endpoint not found (404), trying fallbacks...');
        }
        // If not a permission error or 404, throw; otherwise continue to fallbacks
        else if (!(response.status === 403 || /only coaches/i.test(serverMsg))) {
          throw new Error(serverMsg || `Failed to fetch: ${response.status}`);
        }
      } catch (primaryErr) {
        console.warn(`[fetchTeacherAssignedStudents] Primary endpoint error (likely 404):`, primaryErr.message);
      }
    }

    // 2. Fallback Logic: Try /api/coach-data with stored coach mapping
    console.log(`[fetchTeacherAssignedStudents] Attempting fallbacks...`);
    const coachId = storedUser?.coach_id || storedUser?.coachId;
    const coachName = storedUser?.coach_name || storedUser?.coachName;

    if (role === "teacher" || role === "coach") {
      const fallbacks = [];
      if (coachId) fallbacks.push(`${API_URL}/api/coach-data?coachId=${encodeURIComponent(coachId)}`);
      if (coachName) fallbacks.push(`${API_URL}/api/coach-data?coachName=${encodeURIComponent(coachName)}`);

      for (const url of fallbacks) {
        try {
          console.log(`[fetchTeacherAssignedStudents] Trying fallback: ${url}`);
          const altResp = await fetch(url, { method: "GET", headers: commonHeaders });
          if (altResp.ok) {
            const altResult = await altResp.json();
            const rows = Array.isArray(altResult) ? altResult : (altResult.data || altResult.players || altResult.rows || []);
            if (Array.isArray(rows) && rows.length > 0) {
              console.log(`[fetchTeacherAssignedStudents] Fallback succeeded with ${rows.length} players`);
              return rows.map(mapPlayer);
            }
          }
        } catch (e) {
          console.warn(`[fetchTeacherAssignedStudents] Fallback failed for ${url}:`, e.message);
        }
      }
    }

    console.warn(`[fetchTeacherAssignedStudents] All attempts exhausted, returning empty array`);
    return [];

  } catch (err) {
    console.error("[fetchTeacherAssignedStudents] Caught error:", err);
    throw err;
  }
};