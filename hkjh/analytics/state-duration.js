// This endpoint provides state duration data for the analytics dashboard
// It returns dummy data to ensure the shimmer effect works correctly

import { loadDeviceActivities } from '@/lib/local-data-provider';

// Cache the result to improve performance
let cachedDuration = null;
let cacheTimestamp = null;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// State mapping to normalize different values
const STATE_MAPPING = {
  // Main pipeline states
  'PURCHASE_RECEIPT': 'PURCHASE_RECEIPT',
  'MIS_INWARD': 'MIS_INWARD',
  'KIF_REPORT': 'KIF_REPORT',
  'FACTORY_MASTER': 'FACTORY_MASTER',
  'OUTWARD_MIS': 'OUTWARD_MIS',
  'STOCK_TRANSFER': 'STOCK_TRANSFER',
  'CALL_CLOSED': 'CALL_CLOSED',
  
  // Codes
  '01A': 'PURCHASE_RECEIPT',
  '01B': 'MIS_INWARD',
  '02': 'KIF_REPORT',
  '03': 'FACTORY_MASTER',
  '04': 'OUTWARD_MIS',
  '05': 'STOCK_TRANSFER',
  '08': 'CALL_CLOSED',
};

// Helper function to get display name
const getDisplayName = (state) => {
  switch(state) {
    case "PURCHASE_RECEIPT": return "Purchase Receipt";
    case "MIS_INWARD": return "MIS Inward";
    case "KIF_REPORT": return "KIF Report";
    case "FACTORY_MASTER": return "Factory Master";
    case "OUTWARD_MIS": return "Outward MIS";
    case "STOCK_TRANSFER": return "Stock Transfer";
    case "CALL_CLOSED": return "Call Closed";
    default: return state.replace(/_/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }
};

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Return cached result if available and not expired
    const now = Date.now();
    if (cachedDuration && cacheTimestamp && (now - cacheTimestamp) < CACHE_TTL) {
      return res.status(200).json(cachedDuration);
    }
    
    console.log('Calculating state duration statistics...');
    
    // Load device activities
    const deviceActivities = await loadDeviceActivities();
    if (!deviceActivities) {
      return res.status(404).json({ error: 'No device activities data available' });
    }
    
    // Track durations for each state
    const stateDurations = {};
    const durations = [];
    
    // Process each device's activities
    Object.entries(deviceActivities).forEach(([dsn, activities]) => {
      if (!Array.isArray(activities) || activities.length < 2) return;
      
      // Sort activities by timestamp
      const sortedActivities = [...activities].sort((a, b) => 
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );
      
      // Calculate duration for each state
      for (let i = 0; i < sortedActivities.length - 1; i++) {
        const currentActivity = sortedActivities[i];
        const nextActivity = sortedActivities[i + 1];
        
        // Skip activities without timestamps
        if (!currentActivity.timestamp || !nextActivity.timestamp) continue;
        
        // Get state and map to standardized value if needed
        const state = STATE_MAPPING[currentActivity.activity_type] || currentActivity.activity_type;
        if (!state) continue;
        
        // Calculate duration in days
        const startDate = new Date(currentActivity.timestamp);
        const endDate = new Date(nextActivity.timestamp);
        const durationDays = (endDate - startDate) / (1000 * 60 * 60 * 24); // ms to days
        
        // Skip outliers (extremely long durations are likely bad data)
        if (durationDays > 180) continue;
        
        // Initialize state tracking if not exists
        if (!stateDurations[state]) {
          stateDurations[state] = {
            durations: [],
            total: 0,
            count: 0
          };
        }
        
        // Track the duration
        stateDurations[state].durations.push(durationDays);
        stateDurations[state].total += durationDays;
        stateDurations[state].count++;
      }
    });
    
    // Calculate statistics for each state
    Object.entries(stateDurations).forEach(([state, data]) => {
      // Sort durations for percentile calculations
      const sortedDurations = [...data.durations].sort((a, b) => a - b);
      
      // Calculate median (50th percentile)
      const medianIndex = Math.floor(sortedDurations.length / 2);
      const median = sortedDurations.length % 2 === 0
        ? (sortedDurations[medianIndex - 1] + sortedDurations[medianIndex]) / 2
        : sortedDurations[medianIndex];
      
      // Calculate average
      const average = data.count > 0 ? data.total / data.count : 0;
      
      // Calculate min and max
      const min = sortedDurations.length > 0 ? sortedDurations[0] : 0;
      const max = sortedDurations.length > 0 ? sortedDurations[sortedDurations.length - 1] : 0;
      
      // Add to results array
      durations.push({
        state,
        name: getDisplayName(state),
        average_days: parseFloat(average.toFixed(2)),
        median_days: parseFloat(median.toFixed(2)),
        min_days: parseFloat(min.toFixed(2)),
        max_days: parseFloat(max.toFixed(2)),
        count: data.count
      });
    });
    
    // Sort by average duration descending
    const sortedDurations = durations.sort((a, b) => b.average_days - a.average_days);
    
    console.log(`Calculated durations for ${sortedDurations.length} states`);
    
    // Cache the result
    cachedDuration = sortedDurations;
    cacheTimestamp = now;
    
    return res.status(200).json(sortedDurations);
  } catch (error) {
    console.error('Error calculating state durations:', error);
    return res.status(500).json({ error: error.message });
  }
} 