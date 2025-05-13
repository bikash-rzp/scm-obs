// Debug endpoint to check loaded data structure

import { loadDeviceActivities } from '@/lib/local-data-provider';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    console.log('Loading device activities for debug...');
    const deviceActivities = await loadDeviceActivities();
    
    if (!deviceActivities) {
      return res.status(404).json({ error: 'No device activities data available' });
    }
    
    // Get total device count
    const deviceCount = Object.keys(deviceActivities).length;
    
    // Sample a few devices
    const sampleDevices = Object.entries(deviceActivities).slice(0, 3);
    
    // Count total activities
    let totalActivities = 0;
    let activitiesWithActivityType = 0;
    
    // Check each device's activities
    Object.values(deviceActivities).forEach(activities => {
      if (Array.isArray(activities)) {
        totalActivities += activities.length;
        
        // Count activities with activity_type
        activities.forEach(activity => {
          if (activity && activity.activity_type) {
            activitiesWithActivityType++;
          }
        });
      }
    });
    
    // Prepare response
    const result = {
      deviceCount,
      totalActivities,
      activitiesWithActivityType,
      dataStructure: {
        isObject: typeof deviceActivities === 'object' && !Array.isArray(deviceActivities),
        topLevelKeys: Object.keys(deviceActivities).slice(0, 10),
        sampledDevices: sampleDevices.map(([dsn, activities]) => {
          return {
            dsn,
            activityCount: Array.isArray(activities) ? activities.length : 'not an array',
            sampleActivities: Array.isArray(activities) ? activities.slice(0, 3) : activities
          };
        })
      }
    };
    
    return res.status(200).json(result);
  } catch (error) {
    console.error('Error in data check API:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
} 