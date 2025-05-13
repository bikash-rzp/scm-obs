// This endpoint provides journey funnel data for the analytics dashboard
// It processes real data from device_activities.json

import { loadDeviceActivities } from '@/lib/local-data-provider';

// Cache the result to improve performance
let cachedJourneyData = null;
let cacheTimestamp = null;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Define the expected stages in order
const EXPECTED_STAGES = [
  "PURCHASE_RECEIPT", // 01A
  "MIS_INWARD",      // 01B
  "KIF_REPORT",      // 02
  "FACTORY_MASTER",  // 03
  "OUTWARD_MIS",     // 04
  "CALL_CLOSED",     // 08
];

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
    if (cachedJourneyData && cacheTimestamp && (now - cacheTimestamp) < CACHE_TTL) {
      return res.status(200).json(cachedJourneyData);
    }
    
    console.log('Calculating journey funnel data...');
    
    // Load device activities
    const deviceActivities = await loadDeviceActivities();
    if (!deviceActivities) {
      return res.status(404).json({ error: 'No device activities data available' });
    }
    
    // Initialize counts for each stage
    const stageCounts = EXPECTED_STAGES.reduce((acc, stage) => {
      acc[stage] = 0;
      return acc;
    }, {});
    
    // Count devices at each stage
    const deviceStates = new Map();
    let totalDevices = 0;
    
    // Process all device activities
    Object.entries(deviceActivities).forEach(([dsn, activities]) => {
      if (!Array.isArray(activities) || activities.length === 0) return;
      
      totalDevices++;
      
      // Get the states for this device from its activities
      const deviceStages = new Set();
      
      activities.forEach(activity => {
        if (!activity || !activity.activity_type) return;
        
        // Normalize the state
        const rawState = activity.activity_type;
        const normalizedState = STATE_MAPPING[rawState] || rawState;
        
        // Only track states that are in our expected stages
        if (EXPECTED_STAGES.includes(normalizedState)) {
          deviceStages.add(normalizedState);
        }
      });
      
      // Update the highest stage this device reached
      deviceStates.set(dsn, Array.from(deviceStages));
  
      // Count this device for each stage it has reached
      deviceStages.forEach(stage => {
        stageCounts[stage] = (stageCounts[stage] || 0) + 1;
      });
    });
  
    // Calculate percentages and create result
    const result = EXPECTED_STAGES.map(stage => {
      const count = stageCounts[stage] || 0;
      const percentage = totalDevices > 0 ? (count / totalDevices) * 100 : 0;
      
      return {
        name: stage.replace(/_/g, ' ')
          .split(' ')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
          .join(' '), // Format for display
        count,
        percentage: parseFloat(percentage.toFixed(1))
      };
    });
    
    console.log(`Generated journey funnel data for ${totalDevices} devices`);
      
    // Cache the result
    cachedJourneyData = result;
    cacheTimestamp = now;
    
    return res.status(200).json(result);
  } catch (error) {
    console.error('Error in journey funnel API:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
} 