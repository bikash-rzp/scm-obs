// This endpoint provides bottleneck analysis for the analytics dashboard
// It returns dummy data for now to ensure the shimmer effect works properly 

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('Loading bottleneck analysis data...');
    
    // Generate bottleneck data - identify the stage with highest dwell time
    const bottleneckData = {
      stage: 'FACTORY_MASTER',
      avgDays: 19.6,
      deviceCount: 167900,
      throughputData: [
        { date: '2023-01', count: 4250 },
        { date: '2023-02', count: 3980 },
        { date: '2023-03', count: 5120 },
        { date: '2023-04', count: 4760 },
        { date: '2023-05', count: 5340 },
        { date: '2023-06', count: 4890 }
      ]
    };
    
    console.log('Returning bottleneck analysis data');
    
    return res.status(200).json(bottleneckData);
  } catch (error) {
    console.error('Error generating bottleneck analysis:', error);
    return res.status(500).json({ error: 'Failed to generate bottleneck analysis' });
  }
} 