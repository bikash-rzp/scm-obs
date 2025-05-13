// This endpoint provides state distribution data for the analytics dashboard
// It processes real data from device_activities.json

import { loadDeviceActivities } from '@/lib/local-data-provider';

// Cache the result to improve performance
let cachedDistribution = null;
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

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Return cached result if available and not expired
    const now = Date.now();
    if (cachedDistribution && cacheTimestamp && (now - cacheTimestamp) < CACHE_TTL) {
      return res.status(200).json(cachedDistribution);
    }
    
    console.log('Calculating state distribution...');
    
    // Load device activities
    const deviceActivities = await loadDeviceActivities();
    if (!deviceActivities) {
      return res.status(404).json({ error: 'No device activities data available' });
    }
    
    // Keep track of the last state for each device
    const deviceLastStates = new Map();
    let totalDevices = 0;
    
    // Process all device activities
    Object.entries(deviceActivities).forEach(([dsn, activities]) => {
      if (!Array.isArray(activities) || activities.length === 0) return;
      
      totalDevices++;
      
      // Sort activities by timestamp (newest first)
      const sortedActivities = [...activities].sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
    
      // Find the most recent valid activity with a state
      for (const activity of sortedActivities) {
        if (activity && activity.activity_type) {
          // Get normalized state value
          const rawState = activity.activity_type;
          const state = STATE_MAPPING[rawState] || rawState;
          
          // Store this device's last state
          deviceLastStates.set(dsn, state);
          break;
        }
      }
    });
    
    // Count occurrences of each state
    const stateCounts = new Map();
    deviceLastStates.forEach((state) => {
      stateCounts.set(state, (stateCounts.get(state) || 0) + 1);
    });
    
    // Convert to array format for the chart
    const distribution = Array.from(stateCounts.entries())
      .map(([state, count]) => {
        const percentage = totalDevices > 0 ? (count / totalDevices) * 100 : 0;
        
        return {
          state,
          name: state.replace(/_/g, ' ')
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' '), // Format for display
          count,
          percentage: parseFloat(percentage.toFixed(1))
        };
      })
      // Sort by count in descending order
      .sort((a, b) => b.count - a.count);
    
    console.log(`Generated distribution data with ${distribution.length} distinct states`);
    
    // Cache the result
    cachedDistribution = distribution;
    cacheTimestamp = now;
    
    return res.status(200).json(distribution);
  } catch (error) {
    console.error('Error in state distribution API:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
} 