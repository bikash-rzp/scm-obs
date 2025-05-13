// Device Details API Endpoint
// Returns details for a specific device by DSN

import { loadDeviceActivities } from '@/lib/local-data-provider';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  const { dsn } = req.query;
  
  if (!dsn) {
    return res.status(400).json({ 
      error: 'Missing device DSN parameter'
    });
  }
  
  try {
    const deviceActivities = await loadDeviceActivities();
    if (!deviceActivities || !deviceActivities[dsn]) {
      return res.status(404).json({ 
        error: `Device with DSN ${dsn} not found` 
      });
    }
    
    const activities = deviceActivities[dsn];
    const deviceDetails = {
      dsn,
      activities: activities.map(activity => ({
        ...activity,
        timestamp: activity.timestamp || null,
        state: activity.state || 'UNKNOWN',
        source: activity.source || 'system',
        activity_type: activity.activity_type || 'unknown'
      })).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    };
    
    return res.status(200).json(deviceDetails);
  } catch (error) {
    console.error(`Error fetching device details for ${dsn}:`, error);
    return res.status(500).json({ 
      error: error.message || 'Internal server error'
    });
  }
} 