// This endpoint provides top devices data for the analytics dashboard
// It returns dummy data to ensure the shimmer effect works correctly

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('Loading top devices data...');
    
    // Generate dummy data for top devices
    const data = {
      mostActive: [
        { device: "DSN-42391A", value: 276 },
        { device: "DSN-98472B", value: 245 },
        { device: "DSN-23873C", value: 231 },
        { device: "DSN-76452D", value: 209 },
        { device: "DSN-31984E", value: 198 }
      ],
      longestDwell: [
        { device: "DSN-87439F", value: "86 days" },
        { device: "DSN-45832G", value: "74 days" },
        { device: "DSN-94317H", value: "67 days" },
        { device: "DSN-23498I", value: "61 days" },
        { device: "DSN-76354J", value: "58 days" }
      ],
      anomalous: [
        { device: "DSN-34765K", value: "Loop" },
        { device: "DSN-98217L", value: "Stuck" },
        { device: "DSN-23876M", value: "Stuck" },
        { device: "DSN-65483N", value: "Loop" },
        { device: "DSN-43987O", value: "Cycles" }
      ]
    };
    
    console.log('Returning top devices data');
    
    return res.status(200).json(data);
  } catch (error) {
    console.error('Error generating top devices data:', error);
    return res.status(500).json({ error: 'Failed to generate top devices data' });
  }
} 