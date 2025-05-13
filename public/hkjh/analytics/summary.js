// This endpoint provides summary statistics for the analytics dashboard
// It processes real data from device_activities.json

import { loadDeviceActivities } from '@/lib/local-data-provider';

// Cache the result to improve performance
let cachedSummary = null;
let cacheTimestamp = null;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Map for normalizing state values from different sources
const STATE_MAPPING = {
  // Codes
  '01A': 'PURCHASE_RECEIPT',
  '01B': 'MIS_INWARD',
  '02': 'KIF_REPORT',
  '03': 'FACTORY_MASTER',
  '04': 'OUTWARD_MIS',
  '05': 'STOCK_TRANSFER',
  '08': 'CALL_CLOSED',
};

// Function to get the date n days ago
const getDateDaysAgo = (days) => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
};

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Return cached result if available and not expired
    const now = Date.now();
    if (cachedSummary && cacheTimestamp && (now - cacheTimestamp) < CACHE_TTL) {
      return res.status(200).json(cachedSummary);
    }
    
    console.log('Calculating summary statistics...');
    
    // Load device activities
    const deviceActivities = await loadDeviceActivities();
    if (!deviceActivities) {
      console.error('Failed to load device activities data');
      return res.status(500).json({ error: 'Failed to load device activities data' });
    }
    
    // Initialize counters
    const totalDevices = Object.keys(deviceActivities).length;
    let totalActivities = 0;
    const stateCountMap = new Map();
    const vendorCountMap = new Map();
    const dateActivitiesMap = new Map();
    const deviceStatesMap = new Map(); // Track unique states per device
    
    // Dates for recent activity calculation
    const last30Days = getDateDaysAgo(30);
    const last7Days = getDateDaysAgo(7);
    let activitiesLast30Days = 0;
    let activitiesLast7Days = 0;
    
    console.log(`Processing activities for ${totalDevices} devices`);
    
    // Process all device activities
    Object.entries(deviceActivities).forEach(([dsn, activities]) => {
      if (!Array.isArray(activities)) return;
    
      // Use Set to track unique states for this device
      const deviceStates = new Set();
      let latestActivity = null;
      
      activities.forEach(activity => {
        if (!activity) return;
        
        totalActivities++;
        
        // Count by state
        if (activity.activity_type) {
          const normalizedState = STATE_MAPPING[activity.activity_type] || activity.activity_type;
          
          // Add to state counts
          stateCountMap.set(normalizedState, (stateCountMap.get(normalizedState) || 0) + 1);
          
          // Add to device's unique states
          deviceStates.add(normalizedState);
        }
        
        // Count by vendor
        if (activity.vendor) {
          vendorCountMap.set(activity.vendor, (vendorCountMap.get(activity.vendor) || 0) + 1);
        }
        
        // Count by date
        if (activity.timestamp) {
          const datePart = activity.timestamp.split('T')[0];
          if (datePart) {
            dateActivitiesMap.set(datePart, (dateActivitiesMap.get(datePart) || 0) + 1);
          }
          
          // Recent activity counts
          const activityDate = new Date(activity.timestamp);
          
          if (activityDate >= last30Days) {
            activitiesLast30Days++;
          }
          
          if (activityDate >= last7Days) {
            activitiesLast7Days++;
          }
          
          // Track latest activity
          if (!latestActivity || activityDate > new Date(latestActivity.timestamp)) {
            latestActivity = activity;
          }
        }
      });
      
      // Store unique states for this device
      deviceStatesMap.set(dsn, deviceStates);
    });
    
    console.log(`Processed ${totalActivities} total activities`);
    
    // Calculate average states per device
    let totalStatesAcrossDevices = 0;
    deviceStatesMap.forEach(states => {
      totalStatesAcrossDevices += states.size;
    });
    const avgStatesPerDevice = totalDevices > 0 ? 
      parseFloat((totalStatesAcrossDevices / totalDevices).toFixed(1)) : 0;
    
    // Calculate daily activity averages
    const totalDays = dateActivitiesMap.size;
    const avgDailyActivities = totalDays > 0 ? 
      parseFloat((totalActivities / totalDays).toFixed(1)) : 0;
    
    // Top states
    const topStates = Array.from(stateCountMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([state, count]) => ({
        state,
        count,
        percentage: parseFloat(((count / totalActivities) * 100).toFixed(1))
      }));
    
    // Top vendors
    const topVendors = Array.from(vendorCountMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([vendor, count]) => ({
        vendor,
        count,
        percentage: parseFloat(((count / totalActivities) * 100).toFixed(1))
      }));
    
    // Daily trend (last 7 days)
    const sortedDates = Array.from(dateActivitiesMap.keys()).sort();
    const recentDates = sortedDates.slice(-7);
    
    const dailyTrend = recentDates.map(date => ({
      date,
      count: dateActivitiesMap.get(date) || 0
    }));
    
    // Create summary object
    const summary = {
      totalDevices,
      totalActivities,
      uniqueStates: stateCountMap.size,
      avgStatesPerDevice,
      avgDailyActivities,
      activitiesLast30Days,
      activitiesLast7Days,
      dailyAvgLast7: parseFloat((activitiesLast7Days / 7).toFixed(1)),
      topStates,
      topVendors,
      dailyTrend
    };
    
    console.log('Generated summary statistics');
    
    // Cache the result
    cachedSummary = summary;
    cacheTimestamp = now;
    
    return res.status(200).json(summary);
  } catch (error) {
    console.error('Error in summary API:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
} 