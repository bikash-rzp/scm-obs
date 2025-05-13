// Devices API Endpoint
// Returns a list of devices with pagination and filtering

import { loadDeviceActivities } from '@/lib/local-data-provider';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Parse query parameters
    const skip = parseInt(req.query.skip) || 0;
    const limit = parseInt(req.query.limit) || 15;
    const search = req.query.search || '';
    const state = req.query.state || '';
    const status = req.query.status || '';
    const sortBy = req.query.sort_by || 'last_activity_timestamp';
    const sortDir = req.query.sort_dir || 'desc';

    // Load device activities
    const deviceActivities = await loadDeviceActivities();
    console.log("🚀 ~ handler ~ deviceActivities:", deviceActivities)
    if (!deviceActivities) {
      return res.status(200).json({
        devices: [],
        total_count: 0
      });
    }

    // Convert activities to device objects with required properties
    let devices = Object.entries(deviceActivities).map(([dsn, activities]) => {
      const lastActivity = activities.length > 0 ?
        activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0] : null;

      const currentState = lastActivity ? lastActivity.state || 'UNKNOWN' : 'UNKNOWN';
      const lastActivityTimestamp = lastActivity ? lastActivity.timestamp : null;

      return {
        dsn,
        current_state: currentState,
        last_activity_timestamp: lastActivityTimestamp,
        activities_count: activities.length,
        first_seen: activities.length > 0 ?
          activities.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))[0].timestamp : null,
        status: activities.length > 0 ? 'ACTIVE' : 'INACTIVE'
      };
    });

    // Apply filtering
    if (search) {
      const searchLower = search.toLowerCase();
      devices = devices.filter(device =>
        device.dsn.toLowerCase().includes(searchLower) ||
        device.current_state.toLowerCase().includes(searchLower)
      );
    }

    if (state && state !== 'ALL') {
      devices = devices.filter(device => device.current_state === state);
    }

    if (status && status !== 'ALL') {
      devices = devices.filter(device => device.status === status);
    }

    // Get total count before pagination
    const totalCount = devices.length;

    // Apply sorting
    devices.sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];

      // Handle null values
      if (aValue === null && bValue === null) return 0;
      if (aValue === null) return 1;
      if (bValue === null) return -1;

      // Compare based on type
      if (typeof aValue === 'string') {
        const comparison = aValue.localeCompare(bValue);
        return sortDir === 'asc' ? comparison : -comparison;
      } else {
        const comparison = aValue - bValue;
        return sortDir === 'asc' ? comparison : -comparison;
      }
    });

    // Apply pagination
    devices = devices.slice(skip, skip + limit);

    // Return the devices with pagination info
    return res.status(200).json({
      devices,
      total_count: totalCount
    });
  } catch (error) {
    console.error('Error in devices API:', error);
    return res.status(500).json({
      error: error.message || 'Internal server error',
      devices: [],
      total_count: 0
    });
  }
}