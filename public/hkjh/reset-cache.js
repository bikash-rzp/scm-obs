// API endpoint to reset the data caches

import { resetCache, getCacheStatus } from '../../lib/local-data-provider';

export default async function handler(req, res) {
  // Check if method is POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    // Reset all caches
    console.log('Resetting data caches...');
    resetCache();
    
    // Get current cache status
    const cacheStatus = getCacheStatus();
    
    return res.status(200).json({
      success: true,
      message: 'All data caches have been reset.',
      cache_status: cacheStatus
    });
  } catch (error) {
    console.error('Error in reset-cache API:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error' 
    });
  }
} 