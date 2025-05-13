// API endpoint to check the status of data caches

import { getCacheStatus, getLoadErrors } from '../../lib/local-data-provider';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    // Get current cache status
    const cacheStatus = getCacheStatus();
    const loadErrors = getLoadErrors();
    
    return res.status(200).json({
      cache_status: cacheStatus,
      load_errors: loadErrors,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error in cache-status API:', error);
    return res.status(500).json({ 
      error: error.message || 'Internal server error' 
    });
  }
} 