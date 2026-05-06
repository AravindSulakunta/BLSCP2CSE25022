# Stage 1: Priority Inbox System Design

## Overview

A notification priority system designed to address information overload in the Campus Notification platform. With high volumes of notifications regarding Placements, Results, and Events, users lose track of important updates. The Priority Inbox displays the top 10 most important unread notifications first, determined by a weighted priority algorithm.

## Problem Statement

Users receive notifications across three categories:
- **Placement** - Job opportunities and hiring announcements
- **Result** - Academic performance updates  
- **Event** - Campus activities and events

Without prioritization, notifications are overwhelming and important updates get lost. The solution provides an intelligent inbox that ranks notifications by importance (weight) and recency.

## Solution Architecture

### Priority Calculation Algorithm

**Priority Score = Weight + Recency Factor**

Where:
- **Weight** (0-3 points):
  - Placement: 3 points (highest priority)
  - Result: 2 points (medium priority)
  - Event: 1 point (lower priority)

- **Recency Factor** (0-1 points):
  - Calculated as: `1 - (time_difference / 24_hours)`
  - Newer notifications get higher recency scores
  - Scores decay to 0 after 24 hours
  - Ensures recent notifications bubble up even if lower weight

### Implementation Details

#### Frontend (React + Vite)

**File**: `src/App.jsx`

```javascript
// Priority weights mapping
const PRIORITY_WEIGHTS = {
  'Placement': 3,
  'Result': 2,
  'Event': 1
};

// Calculate priority score with weight + recency
const calculatePriorityScore = (notification, currentTime) => {
  const type = notification.Type;
  const weight = PRIORITY_WEIGHTS[type] || 0;
  
  // Parse timestamp - handle both 'timestamp' and 'Timestamp' field names
  const timestampStr = notification.timestamp || notification.Timestamp;
  if (!timestampStr) return weight;
  
  const notificationTime = new Date(timestampStr).getTime();
  if (isNaN(notificationTime)) return weight;
  
  const timeDiff = currentTime - notificationTime;
  const maxTimeMs = 24 * 60 * 60 * 1000;
  const recencyFactor = Math.max(0, 1 - (timeDiff / maxTimeMs));
  
  return weight + recencyFactor;
};
```

#### Backend (Node.js + Express)

**File**: `notification_app_be/server.js`

```javascript
// Express server running on port 5000
// Provides /api/priority-inbox endpoint for fetching top 10 notifications
```

#### Data Flow

1. **Fetch**: React component fetches all notifications from evaluation API
2. **Calculate**: Priority score calculated for each notification (O(n) time)
3. **Sort**: Notifications sorted by priority score in descending order (O(n log n) time)
4. **Slice**: Top 10 notifications extracted
5. **Display**: Rendered in UI with color-coded type badges and priority scores
6. **Auto-refresh**: Updates every 30 seconds

### Key Features

✅ **Efficient In-Memory Processing**: No database queries needed - API provides raw data
✅ **Dual-Factor Prioritization**: Weight (type) + Recency (freshness) 
✅ **Real-Time Updates**: Auto-refreshes every 30 seconds
✅ **Visual Hierarchy**: Color-coded notification types and priority badges
✅ **Handles Edge Cases**: Missing timestamps, invalid dates gracefully handled

## Performance Analysis

### Time Complexity
- **Fetching**: O(1) - Single API call
- **Priority Calculation**: O(n) - Single pass through notifications
- **Sorting**: O(n log n) - Quick sort for top 10
- **Overall**: O(n log n) where n = total notifications

### Space Complexity
- O(n) - Storing notifications in memory

### Scalability
- Current: Handles hundreds of notifications efficiently
- Future: For thousands+ notifications, implement pagination or sliding window approach

## UI/UX Design

### Visual Design
- **Header**: "🔔 Priority Inbox" with description
- **Refresh Button**: Manual refresh capability
- **Notification Card**:
  - Rank (#1-10)
  - Type badge (color-coded: Placement=Gold, Result=Blue, Event=Green)
  - Message content
  - Timestamp
  - Priority score display (right sidebar)

### Color Scheme
- **Placement** (#d4a574): Golden brown - indicates job opportunities
- **Result** (#a8d4f5): Sky blue - indicates academic updates  
- **Event** (#c1e1a6): Light green - indicates campus events

## Testing Results

### Test Case: Priority Inbox Display
- **Input**: Mixed notifications (10+ from each category)
- **Expected**: Top 10 sorted by priority score
- **Actual**: ✅ Correctly displays Placement notifications first, followed by Results

### Test Case: Recency Factor
- **Input**: Placement notifications with different timestamps
- **Expected**: Newer ones rank higher
- **Actual**: ✅ Verified by score comparison

### Test Case: Edge Cases
- **Missing timestamps**: ✅ Gracefully defaults to weight only
- **Invalid date formats**: ✅ Caught and handled
- **Empty response**: ✅ Shows "No notifications" message
- **API errors**: ✅ Displays error message to user

## API Integration

**Endpoint**: `http://20.207.122.201/evaluation-service/notifications`
**Method**: GET
**Authentication**: Bearer token (JWT)
**Response**: Array of notification objects with fields:
- `ID`: Unique identifier
- `Type`: "Placement", "Result", or "Event"
- `Message`: Notification content
- `timestamp`: ISO 8601 formatted timestamp

## Deployment

### Frontend
- **Framework**: React 18 with Vite
- **Port**: 5175 (dev server)
- **Build**: `npm run dev` for development

### Backend  
- **Framework**: Express.js
- **Port**: 5000
- **Start**: `node server.js`
- **Dependencies**: express, axios, cors

### Running Locally

```bash
# Terminal 1 - Backend
cd notification_app_be
npm install
node server.js

# Terminal 2 - Frontend  
cd notification_app_fe
npm install
npm run dev
```

## Screenshots

### Priority Inbox Output
The system successfully displays top 10 notifications sorted by:
1. Type weight (Placement > Result > Event)
2. Recency factor (newer = higher score)

All Placement notifications appear at the top with scores ranging from 3.40 to 3.00, demonstrating proper prioritization of employment opportunities over academic results.

## Future Enhancements

1. **User Preferences**: Allow users to customize weights for each notification type
2. **Filtering**: Add category filters to view specific notification types
3. **Persistence**: Store read/unread state in database
4. **Notifications**: Browser push notifications for high-priority items
5. **Analytics**: Track which notifications users engage with most
6. **AI Ranking**: Machine learning model to predict user interest beyond simple weights
7. **Pagination**: Handle large notification sets with pagination
8. **Caching**: Implement Redis caching for frequently accessed data

## Conclusion

The Priority Inbox system successfully solves the notification overload problem by intelligently ranking notifications based on type importance and recency. The algorithm is efficient, scalable, and provides users with the most relevant updates at a glance.
