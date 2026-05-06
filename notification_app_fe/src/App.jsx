import { useEffect, useState } from "react";

const TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJNYXBDbGFpbXMiOnsiYXVkIjoiaHR0cDovLzIwLjI0NC41Ni4xNDQvZXZhbHVhdGlvbi1zZXJ2aWNlIiwiZW1haWwiOiJibC5zYy5wMmNzZTI1MDIyQGJsLnN0dWRlbnRzLmFtcml0YS5lZHUiLCJleHAiOjE3NzgwNjI3OTUsImlhdCI6MTc3ODA2MTg5NSwiaXNzIjoiQWZmb3JkIE1lZGljYWwgVGVjaG5vbG9naWVzIFByaXZhdGUgTGltaXRlZCIsImp0aSI6IjEyODdlNTNmLThjNzUtNGMwOS1hMjVlLTNhYzg2ZWNlOTQzMiIsImxvY2FsZSI6ImVuLUlOIiwibmFtZSI6ImFyYXZpbmRzdWxha3VudGEiLCJzdWIiOiI4ZDM4MGUwMi0zZTllLTRkYmEtYWY0NC00Yjg4ZTNmZjg0YmEifSwiZW1haWwiOiJibC5zYy5wMmNzZTI1MDIyQGJsLnN0dWRlbnRzLmFtcml0YS5lZHUiLCJuYW1lIjoiYXJhdmluZHN1bGFrdW50YSIsInJvbGxObyI6ImJsLnNjLnAyY3NlMjUwMjIiLCJhY2Nlc3NDb2RlIjoiUFRCTW1RIiwiY2xpZW50SUQiOiI4ZDM4MGUwMi0zZTllLTRkYmEtYWY0NC00Yjg4ZTNmZjg0YmEiLCJjbGllbnRTZWNyZXQiOiJnRmJBdHdidlRndmhVTXZ2In0.oZHGU9sDMoDuXCwaVPw6bXPMVfcWBu4PPriS7A1ENsQ";

const PRIORITY_WEIGHTS = {
  'Placement': 3,
  'Result': 2,
  'Event': 1
};

function App() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Get type color
  const getTypeColor = (type) => {
    switch (type) {
      case "Placement":
        return "#d4a574";
      case "Result":
        return "#a8d4f5";
      case "Event":
        return "#c1e1a6";
      default:
        return "#f0f0f0";
    }
  };

  // Calculate priority score
  const calculatePriorityScore = (notification, currentTime) => {
    const type = notification.Type;
    const weight = PRIORITY_WEIGHTS[type] || 0;
    
    // Parse timestamp - handle both 'timestamp' and 'Timestamp' field names
    const timestampStr = notification.timestamp || notification.Timestamp;
    if (!timestampStr) {
      return weight; // Return just weight if no timestamp
    }
    
    const notificationTime = new Date(timestampStr).getTime();
    
    // Check if date parsing failed
    if (isNaN(notificationTime)) {
      return weight;
    }
    
    const timeDiff = currentTime - notificationTime;
    
    // Recency factor: newer notifications get higher scores (decay over 24 hours)
    const maxTimeMs = 24 * 60 * 60 * 1000;
    const recencyFactor = Math.max(0, 1 - (timeDiff / maxTimeMs));
    
    // Combined score: weight (0-3) + recency (0-1)
    return weight + recencyFactor;
  };

  // Fetch notifications from API
  const loadNotifications = async () => {
    try {
      setLoading(true);
      const response = await fetch("http://20.207.122.201/evaluation-service/notifications", {
        headers: {
          Authorization: `Bearer ${TOKEN}`
        }
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const rawData = await response.json();
      
      // Handle different response structures
      const data = Array.isArray(rawData) ? rawData : (rawData.notifications || rawData.data || []);
      
      if (!Array.isArray(data)) {
        throw new Error("Invalid response format");
      }

      const currentTime = new Date().getTime();

      // Calculate priority scores and sort
      const notificationsWithScores = data.map(notif => ({
        ...notif,
        priorityScore: calculatePriorityScore(notif, currentTime)
      }));

      // Sort by priority score and get top 10
      const topNotifications = notificationsWithScores
        .sort((a, b) => b.priorityScore - a.priorityScore)
        .slice(0, 10);

      setNotifications(topNotifications);
      setError(null);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      setError(error.message);
      setLoading(false);
    }
  };

  // Load on mount
  useEffect(() => {
    loadNotifications();
    // Refresh every 30 seconds
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ padding: "20px", fontFamily: "Arial", maxWidth: "900px", margin: "0 auto" }}>
      <h1>🔔 Priority Inbox</h1>
      <p style={{ color: "#666", marginBottom: "20px" }}>
        Top 10 notifications sorted by priority and recency
      </p>

      {/* Refresh Button */}
      <button
        onClick={loadNotifications}
        style={{
          padding: "10px 20px",
          marginBottom: "20px",
          backgroundColor: "#007bff",
          color: "white",
          border: "none",
          borderRadius: "5px",
          cursor: "pointer",
          fontSize: "14px",
        }}
      >
        ↻ Refresh
      </button>

      {/* Error Display */}
      {error && (
        <div style={{ color: "red", marginBottom: "20px", padding: "10px", backgroundColor: "#ffe6e6", borderRadius: "5px" }}>
          Error: {error}
        </div>
      )}

      {/* Loading */}
      {loading ? (
        <p>Loading notifications...</p>
      ) : notifications.length === 0 ? (
        <p>No notifications available.</p>
      ) : (
        <div>
          <p style={{ color: "#666", fontSize: "14px", marginBottom: "15px" }}>
            Showing {notifications.length} notifications
          </p>
          {notifications.map((item, index) => (
            <div
              key={item.ID}
              style={{
                border: `3px solid ${getTypeColor(item.Type)}`,
                borderRadius: "8px",
                padding: "15px",
                marginBottom: "15px",
                backgroundColor: "#f9f9f9",
                boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "start",
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                  <span style={{ fontWeight: "bold", fontSize: "16px" }}>#{index + 1}</span>
                  <span
                    style={{
                      padding: "4px 12px",
                      borderRadius: "4px",
                      backgroundColor: getTypeColor(item.Type),
                      fontWeight: "bold",
                      fontSize: "12px",
                      color: "#000",
                    }}
                  >
                    {item.Type}
                  </span>
                </div>
                <p style={{ margin: "8px 0", fontSize: "15px" }}>{item.Message}</p>
                <small style={{ color: "#999" }}>📅 {item.timestamp}</small>
              </div>
              <div
                style={{
                  backgroundColor: "#e8f4f8",
                  padding: "10px 15px",
                  borderRadius: "6px",
                  textAlign: "center",
                  marginLeft: "15px",
                  minWidth: "80px",
                }}
              >
                <small style={{ color: "#666", display: "block", marginBottom: "4px" }}>Priority</small>
                <strong style={{ fontSize: "18px", color: "#007bff" }}>
                  {item.priorityScore.toFixed(2)}
                </strong>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default App;