// Local data provider for SCM Analytics
// This module loads device activity data from the device_activities.json file

import fs from 'fs';
import path from 'path';
import { promisify } from 'util';

const readFile = promisify(fs.readFile);
const exists = promisify(fs.exists);
const readdir = promisify(fs.readdir);

// Cache for device activities data
let deviceActivitiesCache = null;
let cacheTimestamp = null;
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

// Errors that occurred during data loading
let loadErrors = [];

// Debug helper to find files
async function findFile(filename, startPath = process.cwd()) {
  console.log(`Searching for ${filename} starting from ${startPath}`);
  
  async function searchDir(dir, depth = 0, maxDepth = 3) {
    if (depth > maxDepth) return null;
    
    try {
      console.log(`Checking directory: ${dir} (depth: ${depth})`);
      const files = await readdir(dir, { withFileTypes: true });
      
      for (const file of files) {
        const fullPath = path.join(dir, file.name);
        
        // Skip node_modules and hidden dirs
        if (file.isDirectory() && 
            !file.name.startsWith('.') && 
            file.name !== 'node_modules' &&
            depth < maxDepth) {
          const result = await searchDir(fullPath, depth + 1, maxDepth);
          if (result) return result;
        } else if (file.name === filename) {
          console.log(`Found ${filename} at: ${fullPath}`);
          return fullPath;
        }
      }
    } catch (err) {
      console.log(`Error searching dir ${dir}: ${err.message}`);
    }
    
    return null;
  }
  
  return searchDir(startPath);
}

// Get possible paths for device_activities.json
function getPossiblePaths() {
  const cwd = process.cwd();
  
  return [
    path.resolve(cwd, 'device_activities.json'),
    path.resolve(cwd, '..', 'device_activities.json'),
    path.resolve(cwd, 'ui', 'device_activities.json'),
    path.resolve(cwd, 'data', 'device_activities.json'),
  ];
}

/**
 * Load device activities from the device_activities.json file
 */
export const loadDeviceActivities = async () => {
  // Return cached data if available and not expired
  const now = Date.now();
  if (deviceActivitiesCache && cacheTimestamp && (now - cacheTimestamp) < CACHE_TTL) {
    console.log(`Using cached device activities data (${Object.keys(deviceActivitiesCache).length} devices)`);
    return deviceActivitiesCache;
  }

  loadErrors = [];
  console.log(`Current working directory: ${process.cwd()}`);
  
  try {
    // Try multiple possible file locations
    const possiblePaths = getPossiblePaths();
    let filePath = null;
    
    for (const path of possiblePaths) {
      console.log(`Checking if device_activities.json exists at: ${path}`);
      if (await exists(path)) {
        filePath = path;
        console.log(`Found device_activities.json at: ${filePath}`);
        break;
      }
    }
    
    // If file not found in known locations, search for it
    if (!filePath) {
      console.log(`File not found in known locations, searching...`);
      filePath = await findFile('device_activities.json');
    }
    
    if (!filePath) {
      const error = `Could not find device_activities.json file`;
      loadErrors.push(error);
      console.error(error);
      return null;
    }

    console.log(`Loading device activities from: ${filePath}`);
    
    // Read and parse the JSON file
    const data = await readFile(filePath, 'utf8');
    console.log(`Read ${data.length} bytes from file`);
    
    // Parse the JSON data
    const rawData = JSON.parse(data);
    console.log(`Parsed JSON data with structure: ${Array.isArray(rawData) ? 'array' : typeof rawData}`);
    
    // Check if it's already correctly structured as a map
    if (rawData && typeof rawData === 'object' && !Array.isArray(rawData)) {
      // Map is already DSN -> activities array
      const deviceCount = Object.keys(rawData).length;
      console.log(`Data already in correct format with ${deviceCount} devices`);
      deviceActivitiesCache = rawData;
      cacheTimestamp = now;
      return rawData;
    }
    
    // If it's an array, organize by DSN
    if (Array.isArray(rawData)) {
      console.log(`Organizing ${rawData.length} activities by DSN`);
      const organized = {};
      
      // Group activities by DSN
      for (const activity of rawData) {
        if (activity && activity.dsn) {
          if (!organized[activity.dsn]) {
            organized[activity.dsn] = [];
          }
          organized[activity.dsn].push(activity);
        }
      }
      
      const deviceCount = Object.keys(organized).length;
      console.log(`Organized into ${deviceCount} devices`);
      
      deviceActivitiesCache = organized;
      cacheTimestamp = now;
      return organized;
    }
    
    // Couldn't parse into a usable format
    throw new Error('Invalid data structure in device_activities.json');
  } catch (error) {
    const errorMessage = `Error loading device activities: ${error.message}`;
    loadErrors.push(errorMessage);
    console.error(errorMessage);
    return null;
  }
};

/**
 * Reset the device activities cache
 */
export const resetCache = () => {
  deviceActivitiesCache = null;
  cacheTimestamp = null;
  loadErrors = [];
  console.log('Device activities cache has been reset');
};

/**
 * Get errors that occurred during data loading
 */
export const getLoadErrors = () => {
  return [...loadErrors];
};

/**
 * Get cache status information
 */
export const getCacheStatus = () => {
  return {
    isCached: !!deviceActivitiesCache,
    timestamp: cacheTimestamp,
    deviceCount: deviceActivitiesCache ? Object.keys(deviceActivitiesCache).length : 0,
    errors: getLoadErrors(),
    cwd: process.cwd(),
    possiblePaths: getPossiblePaths()
  };
}; 