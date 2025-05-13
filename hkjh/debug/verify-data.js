// Verify Data endpoint
// This endpoint checks if the device_activities.json file is accessible and returns basic stats

import { getCacheStatus, loadDeviceActivities } from '@/lib/local-data-provider';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';

const stat = promisify(fs.stat);
const exists = promisify(fs.exists);

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get file info for each potential path
    const cwd = process.cwd();
    const potentialPaths = [
      path.resolve(cwd, 'device_activities.json'),
      path.resolve(cwd, 'public', 'device_activities.json'),
      path.resolve(cwd, '..', 'device_activities.json'),
      path.resolve(cwd, 'ui', 'device_activities.json'),
      path.resolve(cwd, 'data', 'device_activities.json'),
    ];
    
    const pathInfo = await Promise.all(
      potentialPaths.map(async (p) => {
        try {
          if (await exists(p)) {
            const stats = await stat(p);
            return {
              path: p,
              exists: true,
              size: stats.size,
              isFile: stats.isFile(),
              created: stats.birthtime,
              modified: stats.mtime,
              readable: true
            };
          } else {
            return { path: p, exists: false };
          }
        } catch (err) {
          return { 
            path: p, 
            exists: false, 
            error: err.message 
          };
        }
      })
    );
    
    // Get cache status
    const cacheStatus = getCacheStatus();
    
    // Try to load device activities
    await loadDeviceActivities();
    const updatedCacheStatus = getCacheStatus();
    
    return res.status(200).json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      cwd,
      fileInfo: pathInfo,
      cacheStatus: updatedCacheStatus
    });
  } catch (error) {
    console.error('Error in verify-data API:', error);
    return res.status(500).json({ 
      error: error.message || 'Internal server error',
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
} 