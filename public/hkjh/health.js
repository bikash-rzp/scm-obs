// API Health Check Endpoint
// This provides a simple endpoint to verify the API is running

export default function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    // Return a simple health status
    return res.status(200).json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      message: 'API server is running'
    });
  } catch (error) {
    console.error('Error in health API:', error);
    return res.status(500).json({ 
      error: error.message || 'Internal server error' 
    });
  }
} 