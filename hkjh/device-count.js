// Device Count API Endpoint
// Returns the number of devices currently being tracked in the system

import { loadDeviceActivities } from '@/lib/local-data-provider';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Load device activities and count them
    const deviceActivities = await loadDeviceActivities();
    console.log("🚀 ~ handler ~ deviceActivities:", deviceActivities)
    const deviceCount = deviceActivities ? Object.keys(deviceActivities).length : 0;

    // Return the count
    return res.status(200).json({
      count: deviceCount,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error in device-count API:', error);
    // Still return a count of 0 to avoid frontend errors
    return res.status(200).json({
      count: 0,
      error: error.message || 'Internal server error',
      timestamp: new Date().toISOString()
    });
  }
}