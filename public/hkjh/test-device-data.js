import fs from 'fs';
import path from 'path';

export default async function handler(req, res) {
  try {
    console.log('Testing device activity data loading...');
    
    // Try multiple possible locations for the device_activities.json file
    const possiblePaths = [
      // Direct path in the root directory (when running from ui folder)
      path.join(process.cwd(), '..', 'device_activities.json'),
      // Direct path when running from project root
      path.join(process.cwd(), 'device_activities.json'),
      // Absolute path if known
      '/Users/mishra.saurabh/Dev/rzp/scm/device_activities.json',
    ];
    
    // Log all possible paths for debugging
    console.log('Checking these paths:');
    possiblePaths.forEach((p, i) => {
      try {
        const exists = fs.existsSync(p);
        const stats = exists ? fs.statSync(p) : null;
        const size = stats ? `${(stats.size / (1024 * 1024)).toFixed(2)} MB` : 'N/A';
        console.log(`  ${i+1}. ${p} - exists: ${exists}, size: ${size}`);
      } catch (e) {
        console.log(`  ${i+1}. ${p} - error checking: ${e.message}`);
      }
    });
    
    // Find first valid path
    let validPath = null;
    for (const p of possiblePaths) {
      if (fs.existsSync(p)) {
        validPath = p;
        break;
      }
    }
    
    if (!validPath) {
      return res.status(404).json({ 
        error: 'Data file not found', 
        checkedPaths: possiblePaths 
      });
    }
    
    // Get file stats
    const stats = fs.statSync(validPath);
    
    // Read just a sample (first few bytes) to verify file is readable
    const fd = fs.openSync(validPath, 'r');
    const buffer = Buffer.alloc(1000);
    fs.readSync(fd, buffer, 0, 1000, 0);
    fs.closeSync(fd);
    
    // Count number of devices without loading whole file
    console.log('Estimating device count from file...');
    let deviceCount = 0;
    let activityCount = 0;
    let uniqueDsns = new Set();
    
    // Read first 10MB of file to check format and estimate counts
    const sampleSize = Math.min(10 * 1024 * 1024, stats.size);
    const sampleBuffer = Buffer.alloc(sampleSize);
    const sampleFd = fs.openSync(validPath, 'r');
    fs.readSync(sampleFd, sampleBuffer, 0, sampleSize, 0);
    fs.closeSync(sampleFd);
    
    const sampleString = sampleBuffer.toString('utf8', 0, sampleSize);
    const isArray = sampleString.trim().startsWith('[');
    
    // Return info about the file
    return res.status(200).json({
      success: true,
      dataPath: validPath,
      fileSize: `${(stats.size / (1024 * 1024)).toFixed(2)} MB`,
      isAccessible: true,
      format: isArray ? 'array' : 'object',
      sample: sampleString.substring(0, 500) + '...'  // First 500 chars
    });
  } catch (error) {
    console.error('Error in test endpoint:', error);
    return res.status(500).json({ 
      error: error.message,
      stack: error.stack
    });
  }
} 