// This endpoint provides activity timeline data for the analytics dashboard
// It returns dummy data to ensure the shimmer effect works correctly

import { loadDeviceActivities } from '@/lib/local-data-provider';

// Cache the result to improve performance
let cachedTimeline = null;
let cacheTimestamp = null;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Return cached result if available and not expired
    const now = Date.now();
    if (cachedTimeline && cacheTimestamp && (now - cacheTimestamp) < CACHE_TTL) {
      return res.status(200).json(cachedTimeline);
    }
    
    console.log('Calculating activity timeline...');
    
    // Load device activities
    const deviceActivities = await loadDeviceActivities();
    if (!deviceActivities) {
      return res.status(404).json({ error: 'No device activities data available' });
    }
    
    // Track activity counts by date
    const dateActivityCounts = {};
    const dateStateCounts = {};
    
    // Process all activities to count by date
    Object.values(deviceActivities).forEach(activities => {
      if (!Array.isArray(activities)) return;
      
      activities.forEach(activity => {
        if (!activity || !activity.timestamp) return;
        
        // Extract just the date part (YYYY-MM-DD)
        const datePart = activity.timestamp.split('T')[0];
        if (!datePart) return;
        
        // Count total activities by date
        if (!dateActivityCounts[datePart]) {
          dateActivityCounts[datePart] = 0;
          dateStateCounts[datePart] = {};
        }
        dateActivityCounts[datePart] += 1;
        
        // Count activities by state for each date
        const state = activity.activity_type || 'UNKNOWN';
        dateStateCounts[datePart][state] = (dateStateCounts[datePart][state] || 0) + 1;
      });
    });
    
    // Convert to array format for timeline chart
    const timelineData = Object.keys(dateActivityCounts)
      .sort() // Sort dates chronologically
      .map(date => {
        // Find top states for this date
        const stateEntries = Object.entries(dateStateCounts[date] || {})
          .sort((a, b) => b[1] - a[1]);
        
        const topStates = stateEntries.slice(0, 3).map(([state, count]) => ({
          state,
          count
        }));
        
        return {
          date,
          count: dateActivityCounts[date],
          topStates
        };
      });
    
    // Add moving average for trend analysis (7-day window)
    if (timelineData.length > 0) {
      const windowSize = 7;
      
      for (let i = 0; i < timelineData.length; i++) {
        let sum = 0;
        let validPoints = 0;
        
        // Calculate sum of the window (limited by array bounds)
        for (let j = Math.max(0, i - windowSize + 1); j <= i; j++) {
          sum += timelineData[j].count;
          validPoints++;
        }
        
        // Calculate moving average
        timelineData[i].movingAvg = validPoints > 0 ? Math.round(sum / validPoints) : 0;
      }
    }
    
    console.log(`Generated timeline with ${timelineData.length} data points`);
    
    // Cache the result
    cachedTimeline = timelineData;
    cacheTimestamp = now;
    
    return res.status(200).json(timelineData);
  } catch (error) {
    console.error('Error in activity timeline API:', error);
    return res.status(500).json({ error: error.message });
  }
} 