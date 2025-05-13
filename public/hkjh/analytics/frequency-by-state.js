// This endpoint provides activity frequency by state data for the analytics dashboard
// It returns dummy data to ensure the shimmer effect works correctly

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('Loading frequency by state data...');
    
    // Generate dummy data for activity frequency by state
    const data = [
      { name: 'PURCHASE_RECEIPT', value: 17250 },
      { name: 'MIS_INWARD', value: 9320 },
      { name: 'KIF_REPORT', value: 12480 },
      { name: 'FACTORY_MASTER', value: 24650 },
      { name: 'OUTWARD_MIS', value: 18790 },
      { name: 'STOCK_TRANSFER', value: 7640 },
      { name: 'CALL_CLOSED', value: 3280 }
    ];
    
    console.log(`Returning frequency by state data with ${data.length} items`);
    
    return res.status(200).json(data);
  } catch (error) {
    console.error('Error generating frequency by state data:', error);
    return res.status(500).json({ error: 'Failed to generate frequency by state data' });
  }
} 