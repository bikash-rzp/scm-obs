import { getAnalyticsSummary } from '../../../lib/local-data-provider';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // First get the raw provider data
    console.log('Fetching summary data from provider...');
    const providerData = await getAnalyticsSummary();
    
    // Now fetch the data as it would be returned by the API
    console.log('Fetching data from API endpoint...');
    const apiResponse = await fetch(`http://localhost:3000/api/analytics/summary`);
    const apiData = await apiResponse.json();
    
    // Check if the data formats match what the components expect
    const uiReady = {
      // Format for StatsCard component
      statsCard: {
        total_devices: providerData.total_devices,
        totalDevices: providerData.total_devices, // Legacy format
        total_activities: providerData.total_activities,
        totalActivities: providerData.total_activities, // Legacy format
        avg_activities_per_device: providerData.avg_activities_per_device,
        avgActivitiesPerDevice: providerData.avg_activities_per_device // Legacy format
      },
      
      // Test with both snake_case and camelCase
      legacyTest: {
        totalDevices: providerData.total_devices,
        totalActivities: providerData.total_activities,
        avgActivitiesPerDevice: providerData.avg_activities_per_device
      },
      
      snakeCaseTest: {
        total_devices: providerData.total_devices,
        total_activities: providerData.total_activities,
        avg_activities_per_device: providerData.avg_activities_per_device
      }
    };
    
    // Return all data for comparison
    return res.status(200).json({
      timestamp: new Date().toISOString(),
      providerData,
      apiData,
      uiReady
    });
  } catch (error) {
    console.error('Error in UI test endpoint:', error);
    return res.status(500).json({ 
      error: 'Test failed',
      message: error.message,
      stack: error.stack 
    });
  }
} 