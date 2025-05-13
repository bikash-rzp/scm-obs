// This endpoint provides cohort statistics for the analytics dashboard
// It returns dummy data for now to ensure the shimmer effect works properly 

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('Loading cohort statistics data...');
    
    // Generate cohort data
    const cohorts = [
      { name: 'Model X', devices: 85420, avgDwell: 17.4, anomalyRate: 0.04 },
      { name: 'Model Y', devices: 73640, avgDwell: 15.2, anomalyRate: 0.03 },
      { name: 'Model Z', devices: 56340, avgDwell: 19.8, anomalyRate: 0.06 },
      { name: 'Classic', devices: 34280, avgDwell: 22.1, anomalyRate: 0.09 },
      { name: 'Premium', devices: 28950, avgDwell: 14.3, anomalyRate: 0.02 }
    ];
    
    console.log('Returning cohort statistics with data for', cohorts.length, 'cohorts');
    
    return res.status(200).json({ 
      data: cohorts,
      cohort_field: 'Model',
      total_devices: cohorts.reduce((sum, cohort) => sum + cohort.devices, 0)
    });
  } catch (error) {
    console.error('Error generating cohort statistics:', error);
    return res.status(500).json({ error: 'Failed to generate cohort statistics' });
  }
} 