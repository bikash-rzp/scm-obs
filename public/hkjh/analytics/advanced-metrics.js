// This endpoint provides advanced metrics data for the analytics dashboard
// It returns dummy data to ensure the shimmer effect works correctly

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('Loading advanced metrics data...');
    
    // Generate dummy data for advanced metrics
    const data = {
      uniqueDevicesPerState: {
        'PURCHASE_RECEIPT': 240815,
        'MIS_INWARD': 211270,
        'KIF_REPORT': 195840,
        'FACTORY_MASTER': 167900,
        'OUTWARD_MIS': 134810,
        'STOCK_TRANSFER': 78500,
        'CALL_CLOSED': 45300
      },
      avgTransitions: 4.3,
      medianCycleTime: 37.2,
      anomalyRate: 0.076,
      topIssues: [
        { type: 'EXCESSIVE_DWELL', count: 8420 },
        { type: 'INVALID_TRANSITION', count: 5130 },
        { type: 'OUT_OF_SEQUENCE', count: 2780 }
      ]
    };
    
    console.log('Returning advanced metrics data');
    
    return res.status(200).json(data);
  } catch (error) {
    console.error('Error generating advanced metrics:', error);
    return res.status(500).json({ error: 'Failed to generate advanced metrics' });
  }
} 