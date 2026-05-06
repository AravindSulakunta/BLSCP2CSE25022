const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

// Authentication token
const TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJNYXBDbGFpbXMiOnsiYXVkIjoiaHR0cDovLzIwLjI0NC41Ni4xNDQvZXZhbHVhdGlvbi1zZXJ2aWNlIiwiZW1haWwiOiJibC5zYy5wMmNzZTI1MDIyQGJsLnN0dWRlbnRzLmFtcml0YS5lZHUiLCJleHAiOjE3NzgwNjI3OTUsImlhdCI6MTc3ODA2MTg5NSwiaXNzIjoiQWZmb3JkIE1lZGljYWwgVGVjaG5vbG9naWVzIFByaXZhdGUgTGltaXRlZCIsImp0aSI6IjEyODdlNTNmLThjNzUtNGMwOS1hMjVlLTNhYzg2ZWNlOTQzMiIsImxvY2FsZSI6ImVuLUlOIiwibmFtZSI6ImFyYXZpbmRzdWxha3VudGEiLCJzdWIiOiI4ZDM4MGUwMi0zZTllLTRkYmEtYWY0NC00Yjg4ZTNmZjg0YmEifSwiZW1haWwiOiJibC5zYy5wMmNzZTI1MDIyQGJsLnN0dWRlbnRzLmFtcml0YS5lZHUiLCJuYW1lIjoiYXJhdmluZHN1bGFrdW50YSIsInJvbGxObyI6ImJsLnNjLnAyY3NlMjUwMjIiLCJhY2Nlc3NDb2RlIjoiUFRCTW1RIiwiY2xpZW50SUQiOiI4ZDM4MGUwMi0zZTllLTRkYmEtYWY0NC00Yjg4ZTNmZjg0YmEiLCJjbGllbnRTZWNyZXQiOiJnRmJBdHdidlRndmhVTXZ2In0.oZHGU9sDMoDuXCwaVPw6bXPMVfcWBu4PPriS7A1ENsQ";

// Priority weights
const PRIORITY_WEIGHTS = {
  'Placement': 3,
  'Result': 2,
  'Event': 1
};

// Calculate priority score
function calculatePriorityScore(notification, currentTime) {
  const type = notification.Type;
  const weight = PRIORITY_WEIGHTS[type] || 0;
  
  // Parse timestamp
  const notificationTime = new Date(notification.timestamp).getTime();
  const timeDiff = currentTime - notificationTime;
  
  // Recency factor: newer notifications get higher scores (decay over hours)
  // Max 24 hours = 86400000 ms
  const maxTimeMs = 24 * 60 * 60 * 1000;
  const recencyFactor = Math.max(0, 1 - (timeDiff / maxTimeMs));
  
  // Combined score: weight (0-3) + recency (0-1)
  const score = weight + recencyFactor;
  
  return score;
}

// Fetch and sort notifications
async function getTopNotifications(limit = 10) {
  try {
    const response = await axios.get('http://20.207.122.201/evaluation-service/notifications', {
      headers: {
        Authorization: `Bearer ${TOKEN}`
      }
    });
    const notifications = response.data;
    const currentTime = new Date().getTime();
    
    // Add priority scores
    const notificationsWithScores = notifications.map(notif => ({
      ...notif,
      priorityScore: calculatePriorityScore(notif, currentTime)
    }));
    
    // Sort by priority score (descending) and get top N
    const topNotifications = notificationsWithScores
      .sort((a, b) => b.priorityScore - a.priorityScore)
      .slice(0, limit);
    
    return topNotifications;
  } catch (error) {
    console.error('Error fetching notifications:', error.message);
    throw error;
  }
}

// API endpoint
app.get('/api/priority-inbox', async (req, res) => {
  try {
    const limit = req.query.limit || 10;
    const topNotifications = await getTopNotifications(parseInt(limit));
    res.json({
      success: true,
      count: topNotifications.length,
      notifications: topNotifications
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'Backend is running' });
});

app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});
