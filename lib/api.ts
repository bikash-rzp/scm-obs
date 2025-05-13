import axios, { CancelToken } from 'axios';
import { PaginatedDevicesResponse } from './types'; // Import the response type
import { useEffect, useState } from 'react';

// Point to the Python backend server instead of Next.js API routes
// Always use port 8000 for the FastAPI server
export const API_URL = 'http://localhost:8000';

// Cache for analytics data
const analyticsCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes (increased from 5 minutes)

// Load persistent cache from localStorage if available
if (typeof window !== 'undefined') {
  try {
    const savedCache = localStorage.getItem('analyticsCache');
    if (savedCache) {
      const parsed = JSON.parse(savedCache);
      Object.entries(parsed).forEach(([key, value]: [string, any]) => {
        analyticsCache.set(key, value);
      });
      console.log('Loaded analytics cache from localStorage');
    }
  } catch (e) {
    console.error('Error loading analytics cache from localStorage:', e);
    // Clear potentially corrupt cache
    if (typeof window !== 'undefined') {
      localStorage.removeItem('analyticsCache');
    }
  }
}

// Save cache to localStorage periodically
const saveAnalyticsCache = () => {
  if (typeof window !== 'undefined' && analyticsCache.size > 0) {
    const cacheObj: Record<string, any> = {};
    analyticsCache.forEach((value, key) => {
      cacheObj[key] = value;
    });
    localStorage.setItem('analyticsCache', JSON.stringify(cacheObj));
  }
};

// Cache for device data to prevent repeated loading
const deviceCache = new Map<string, { data: any; timestamp: number }>();
const DEVICE_CACHE_DURATION = 10 * 60 * 1000; // 10 minutes (increased from 2 minutes)

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 second default timeout (increased from 15)
  withCredentials: false,
});

// Helper function to handle API errors more gracefully
const handleApiError = (error: any) => {
  if (axios.isCancel(error)) {
    console.log('Request cancelled:', error.message);
    return null;
  }
  
  if (error.code === 'ECONNABORTED') {
    console.error('Request timeout:', error);
    throw new Error('Connection to the server timed out. Please try again later.');
  } else if (error.response) {
    // The server responded with a status other than 2xx
    console.error('API error response:', error.response.data || {});
    
    // Extract error message safely, with fallbacks for different formats
    const errorMessage = 
      (error.response.data && typeof error.response.data === 'object' && error.response.data.detail) || 
      (error.response.data && typeof error.response.data === 'string' && error.response.data) ||
      `Status code: ${error.response.status}`;
      
    throw new Error(`Server error: ${errorMessage}`);
  } else if (error.request) {
    // The request was made but no response was received
    console.error('No response received:', error.request);
    throw new Error('No response from server. Please check if the API is running.');
  } else {
    // Something else happened in setting up the request
    console.error('Error setting up request:', error.message);
    throw error;
  }
};

// Retry function for failed requests with exponential backoff
const retryRequest = async (fn: () => Promise<any>, retries = 3, delay = 1000) => {
  try {
    return await fn();
  } catch (error) {
    if (retries === 0) throw error;
    await new Promise(resolve => setTimeout(resolve, delay));
    return retryRequest(fn, retries - 1, delay * 2);
  }
};

// Check API health
export const checkApiHealth = async () => {
  return retryRequest(async () => {
    const response = await api.get('/health');
    return response.data;
  });
};

// Device-related API calls
// Update getDevices to accept pagination/filter/sort parameters
export const getDevices = async (
    params: {
        skip?: number;
        limit?: number;
        search?: string;
        state?: string;
        status?: string;
        sort_by?: string;
        sort_dir?: string;
    } = {},
    cancelToken?: CancelToken
): Promise<PaginatedDevicesResponse | any[] | null> => {
    // Build query string from params
    const queryParams = new URLSearchParams();
    if (params.skip !== undefined) queryParams.append('skip', String(params.skip));
    if (params.limit !== undefined) queryParams.append('limit', String(params.limit));
    if (params.search) queryParams.append('search', params.search);
    if (params.state && params.state !== 'ALL') queryParams.append('state', params.state);
    if (params.status && params.status !== 'ALL') queryParams.append('status', params.status);
    if (params.sort_by) queryParams.append('sort_by', params.sort_by);
    if (params.sort_dir) queryParams.append('sort_dir', params.sort_dir);

    const queryString = queryParams.toString();
    
    // Implement retry with exponential backoff for device list
    return retryRequest(async () => {
        try {
            const response = await api.get(
                `/devices${queryString ? '?' + queryString : ''}`,
                { 
                  cancelToken,
                  timeout: 30000 // 30 second timeout for device list
                }
            );
            
            if (response.status === 503) {
                throw new Error('Server is still initializing. Please try again in a few seconds.');
            }
            
            // Handle different response formats - either an object with devices or a direct array
            if (response.data) {
                if (Array.isArray(response.data)) {
                    // Direct array of devices
                    console.log('Received array response from /devices endpoint');
                    return response.data;
                } else if (response.data && typeof response.data === 'object') {
                    if (Array.isArray(response.data.devices) && typeof response.data.total_count === 'number') {
                        // Expected format with devices array and total_count
                        return response.data as PaginatedDevicesResponse;
                    } else {
                        // Try to extract from unexpected format
                        console.error("Unexpected response structure from /devices:", response.data);
                        // Check if there's any array property that might contain devices
                        const arrayProps = Object.entries(response.data)
                            .find(([_, value]) => Array.isArray(value));
                        
                        if (arrayProps) {
                            const [key, value] = arrayProps as [string, any[]];
                            console.log(`Using ${key} as devices array from response`);
                            return {
                                devices: value,
                                total_count: value.length
                            };
                        } else {
                            throw new Error("Received invalid data structure from device list API.");
                        }
                    }
                }
            }
            
            throw new Error("Received invalid data structure from device list API.");
        } catch (error: unknown) {
            if (axios.isCancel(error)) {
                console.log('Request cancelled:', error.message);
                return null;
            }
            
            if (axios.isAxiosError(error)) {
                if (error.response?.status === 503) {
                    throw new Error('Server is still initializing. Please try again in a few seconds.');
                }
                
                if (error.code === 'ECONNABORTED') {
                    console.error('Device list request timed out:', error);
                    throw new Error('Loading devices is taking longer than expected. Retrying with increased timeout...');
                }
            }
            
            console.error('Error fetching devices:', error);
            throw error; // Re-throw to allow component-level error handling
        }
    }, 3, 2000); // 3 retries with 2s starting delay
};

export const getDeviceHistory = async (dsn: string) => {
  try {
    if (dsn) {
      const response = await api.get(`/devices/${dsn}`);
      return response.data;
    } else {
      const response = await api.get('/devices');
      const devices = response.data;
      const deviceHistories = await Promise.all(
        devices.map(async (dsn: string) => {
          try {
            const deviceResponse = await api.get(`/devices/${dsn}`);
            return deviceResponse.data;
          } catch (error) {
            console.error(`Failed to fetch history for device ${dsn}:`, error);
            return { dsn, activities: [] };
          }
        })
      );
      return deviceHistories;
    }
  } catch (error) {
    console.error(`Error fetching device history for ${dsn}:`, error);
    throw error; // Re-throw to allow component-level error handling
  }
};

// Activity-related API calls
export const getActivities = async (
  activityType?: string,
  startDate?: string,
  endDate?: string
) => {
  const params = new URLSearchParams();
  if (activityType) params.append('activity_type', activityType);
  if (startDate) params.append('start_date', startDate);
  if (endDate) params.append('end_date', endDate);

  try {
    const response = await api.get(`/activities?${params.toString()}`);
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
};

export const addActivity = async (activityData: {
  dsn: string;
  activity_type: string;
  timestamp?: string;
  source: string;
  metadata: Record<string, any>;
}) => {
  try {
    const response = await api.post('/activities', activityData);
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
};

export const getActivityTypes = async () => {
  try {
    const response = await api.get('/activity-types');
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
};

// Anomaly-related API calls
export const getAnomalies = async (anomalyType?: string, severity?: string) => {
  const params = new URLSearchParams();
  if (anomalyType) params.append('anomaly_type', anomalyType);
  if (severity) params.append('severity', severity);

  try {
    const response = await api.get(`/anomalies?${params.toString()}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching anomalies:', error);
    throw error; // Re-throw to allow component-level error handling
  }
};

// File upload and processing
export const uploadExcelFile = async (file: File) => {
  const formData = new FormData();
  formData.append('file', file);

  try {
    const response = await api.post('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
};

// Analytics API calls with optimized caching and cancellation
export const getAnalyticsData = async (endpoint: string, params: any = {}, cancelToken?: CancelToken) => {
  const cacheKey = `${endpoint}?${new URLSearchParams(params).toString()}`;
  const cached = analyticsCache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    console.log(`Using cached data for ${endpoint}`);
    return cached.data;
  }

  // Check preprocessing status first
  const status = await checkPreprocessingStatus();
  if (status?.status === 'PROCESSING') {
    throw new Error('Analytics data is still being processed. Please try again in a few seconds.');
  }
  
  return retryRequest(async () => {
    try {
      console.log(`Fetching fresh data for ${endpoint}`);
      const response = await api.get(`/analytics/${endpoint}`, { 
        params,
        cancelToken,
        timeout: 60000 // 60 second timeout for analytics (increased from 15 seconds)
      });
      
      if (response.status === 503) {
        throw new Error('Server is still initializing. Please try again in a few seconds.');
      }
      
      // Update the cache with the new data
      analyticsCache.set(cacheKey, { data: response.data, timestamp: Date.now() });
      // Save cache after update
      saveAnalyticsCache();
      return response.data;
    } catch (error: unknown) {
      if (axios.isCancel(error)) {
        console.log('Request cancelled:', error.message);
        return null;
      }
      
      console.error(`Failed to fetch analytics data for ${endpoint}:`, error);
      throw error; // Re-throw to allow component-level error handling
    }
  }, 5, 3000); // Increased to 5 retries with 3s starting delay
};

// Export individual analytics endpoints with optimized parameters and cancellation support
export const getAnalyticsSummary = async (cancelToken?: CancelToken) => {
  try {
    return await api.get('/analytics/summary', { cancelToken });
  } catch (error) {
    console.error('Error fetching analytics summary:', error);
    throw error;
  }
};

export const getActivityDistribution = async (cancelToken?: CancelToken) => {
  try {
    return await api.get('/analytics/activity-distribution', { cancelToken });
  } catch (error) {
    console.error('Error fetching activity distribution:', error);
    throw error;
  }
};

export const getStateDistribution = async (cancelToken?: CancelToken) => {
  try {
    return await api.get('/analytics/state-distribution', { cancelToken });
  } catch (error) {
    console.error('Error fetching state distribution:', error);
    throw error;
  }
};

export const getStateTransitions = async (limit: number = 10, cancelToken?: CancelToken) => {
  try {
    return await api.get('/analytics/state-transitions', { 
      params: { limit },
      cancelToken 
    });
  } catch (error) {
    console.error('Error fetching state transitions:', error);
    throw error;
  }
};

export const getActivityTimeline = async (cancelToken?: CancelToken) => {
  try {
    return await api.get('/analytics/activity-timeline', { cancelToken });
  } catch (error) {
    console.error('Error fetching activity timeline:', error);
    throw error;
  }
};

export const getStateDuration = async (cancelToken?: CancelToken) => {
  try {
    return await api.get('/analytics/state-duration', { cancelToken });
  } catch (error) {
    console.error('Error fetching state duration:', error);
    throw error;
  }
};

export const getFrequencyByState = (cancelToken?: CancelToken) => {
  return api.get('/analytics/frequency-by-state', { cancelToken });
};

export const getAdvancedMetrics = (cancelToken?: CancelToken) => {
  return api.get('/analytics/advanced-metrics', { cancelToken });
};

export const getJourneyFunnel = async (cancelToken?: CancelToken) => {
  try {
    return await api.get('/analytics/journey-funnel', { cancelToken });
  } catch (error) {
    console.error('Error fetching journey funnel:', error);
    throw error;
  }
};

export const getDeviceAnomaliesSummary = async (limit: number = 50, cancelToken?: CancelToken) => {
  try {
    return await api.get('/analytics/device-anomalies-summary', { 
      params: { limit },
      cancelToken 
    });
  } catch (error) {
    console.error('Error fetching device anomalies summary:', error);
    throw error;
  }
};

export const getTransitionHeatmap = async (cancelToken?: CancelToken) => {
  try {
    return await api.get('/analytics/transition-heatmap', { cancelToken });
  } catch (error) {
    console.error('Error fetching transition heatmap:', error);
    throw error;
  }
};

export const getCohortStats = (field: string = 'Vendor', cancelToken?: CancelToken) => {
  return api.get('/analytics/cohort-stats', { 
    params: { field },
    cancelToken 
  });
};

export const getBottleneck = (cancelToken?: CancelToken) => {
  return api.get('/analytics/bottleneck', { cancelToken });
};

export const getLoopDevices = (limit: number = 50, cancelToken?: CancelToken) => {
  return api.get('/analytics/loop-devices', { 
    params: { limit },
    cancelToken 
  });
};

export const getDwellTrend = (cancelToken?: CancelToken) => {
  return api.get('/analytics/dwell-trend', { cancelToken });
};

export const getOutliers = (dwell_threshold: number = 30, limit: number = 50, cancelToken?: CancelToken) => {
  return api.get('/analytics/outliers', { 
    params: { dwell_threshold, limit },
    cancelToken 
  });
};

export const getUtilization = (idle_state_keyword: string = 'idle', cancelToken?: CancelToken) => {
  return api.get('/analytics/utilization', { 
    params: { idle_state_keyword },
    cancelToken 
  });
};

export const getAlerts = (dwell_threshold: number = 14, limit: number = 50, cancelToken?: CancelToken) => {
  return api.get('/analytics/alerts', { 
    params: { dwell_threshold, limit },
    cancelToken 
  });
};

// Add preprocessing status check
export const checkPreprocessingStatus = async (retries = 3): Promise<any> => {
  try {
    const response = await api.get('/status');
    return response.data;
  } catch (error) {
    // Return complete status as fallback
    return { status: "complete", error: null };
  }
};

// Add a default export for the axios instance
export default api; 