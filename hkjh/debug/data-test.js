import fs from 'fs';
import path from 'path';
import { loadDeviceActivities, getLoadErrors, resetCache } from '../../../lib/local-data-provider';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Reset cache if requested
    const { reset } = req.query;
    if (reset === 'true') {
      resetCache();
    }
    
    console.log('Starting data test at:', new Date().toISOString());
    
    // 1. Check possible file locations
    const possiblePaths = [
      path.join(process.cwd(), 'public', 'sample_data', 'devices.json'),
      path.join(process.cwd(), '..', 'device_activities.json'),
      path.join(process.cwd(), 'device_activities.json'),
      '/Users/mishra.saurabh/Dev/rzp/scm/device_activities.json',
      path.join(process.cwd(), 'ui', 'public', 'sample_data', 'devices.json')
    ];
    
    const fileChecks = [];
    
    for (const filePath of possiblePaths) {
      const fileCheck = { path: filePath };
      
      if (fs.existsSync(filePath)) {
        const stats = fs.statSync(filePath);
        fileCheck.exists = true;
        fileCheck.size = stats.size;
        fileCheck.sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
        
        try {
          // Read the first 2000 bytes to check if it's a JSON object
          const buffer = Buffer.alloc(2000);
          const fd = fs.openSync(filePath, 'r');
          fs.readSync(fd, buffer, 0, 2000, 0);
          fs.closeSync(fd);
          
          const fileStart = buffer.toString().trim();
          fileCheck.startsWithBrace = fileStart.startsWith('{');
          fileCheck.firstFewChars = fileStart.substring(0, 40) + '...';
          
          // Try to read the keys directly for large files
          if (stats.size < 100 * 1024 * 1024) { // < 100MB
            console.log(`Reading data file: ${filePath}`);
            const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
            fileCheck.deviceCount = Object.keys(data).length;
            fileCheck.validJson = true;
            fileCheck.sampleDevice = Object.keys(data)[0];
            fileCheck.sampleActivities = Array.isArray(data[fileCheck.sampleDevice]) ? 
              data[fileCheck.sampleDevice].length : undefined;
          } else {
            fileCheck.tooLargeForDirectRead = true;
          }
        } catch (error) {
          fileCheck.error = error.message;
        }
      } else {
        fileCheck.exists = false;
      }
      
      fileChecks.push(fileCheck);
    }
    
    // 2. Try to load using the provider
    console.log('Attempting to load through data provider...');
    let deviceData = null;
    let deviceCount = 0;
    let loadError = null;
    
    try {
      deviceData = await loadDeviceActivities();
      if (deviceData) {
        deviceCount = Object.keys(deviceData).length;
      }
    } catch (error) {
      loadError = error.message;
    }
    
    // 3. Get latest load errors
    const loadErrors = getLoadErrors();
    
    return res.status(200).json({
      timestamp: new Date().toISOString(),
      cwd: process.cwd(),
      fileChecks,
      dataProviderResults: {
        dataLoaded: !!deviceData,
        deviceCount,
        error: loadError,
        sampleDeviceId: deviceData ? Object.keys(deviceData)[0] : null,
      },
      loadErrors
    });
  } catch (error) {
    console.error('Error in data test:', error);
    return res.status(500).json({ 
      error: 'Test failed',
      message: error.message,
      stack: error.stack 
    });
  }
} 