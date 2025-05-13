import axios from 'axios';
import { PaginatedDevicesResponse } from './types';

// Use the backend API URL from environment variables, with a fallback
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Create axios instance with base URL
const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

// Device-related API calls
const api = {
  getDevices: async (params: {
    skip?: number;
    limit?: number;
    search?: string;
    state?: string;
    status?: string;
    sort_by?: string;
    sort_dir?: string;
  }): Promise<PaginatedDevicesResponse | null> => {
    // Build query parameters
    const queryParams = new URLSearchParams();
    if (params.skip !== undefined) queryParams.append('skip', String(params.skip));
    if (params.limit !== undefined) queryParams.append('limit', String(params.limit));
    if (params.search) queryParams.append('search', params.search);
    if (params.state && params.state !== 'ALL') queryParams.append('state', params.state);
    if (params.status && params.status !== 'ALL') queryParams.append('status', params.status);
    if (params.sort_by) queryParams.append('sort_by', params.sort_by);
    if (params.sort_dir) queryParams.append('sort_dir', params.sort_dir);

    try {
      const response = await axiosInstance.get(`/devices?${queryParams.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching devices:', error);
      return null;
    }
  },

  // Device details API call
  getDeviceDetails: async (dsn: string) => {
    try {
      const response = await axiosInstance.get(`/devices/${dsn}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching device details:', error);
      return null;
    }
  },

  // Analytics API calls
  getAnalyticsSummary: async () => {
    try {
      const response = await axiosInstance.get('/analytics/summary');
      return response.data;
    } catch (error) {
      console.error('Error fetching analytics summary:', error);
      return null;
    }
  },

  getStateDistribution: async () => {
    try {
      const response = await axiosInstance.get('/analytics/state-distribution');
      return response.data;
    } catch (error) {
      console.error('Error fetching state distribution:', error);
      return null;
    }
  },

  getStateTransitions: async (limit = 10) => {
    try {
      const response = await axiosInstance.get(`/analytics/state-transitions?limit=${limit}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching state transitions:', error);
      return null;
    }
  },

  getJourneyFunnel: async () => {
    try {
      const response = await axiosInstance.get('/analytics/journey-funnel');
      return response.data;
    } catch (error) {
      console.error('Error fetching journey funnel:', error);
      return null;
    }
  },

  // Added additional analytics endpoints
  getActivityTimeline: async () => {
    try {
      const response = await axiosInstance.get('/analytics/activity-timeline');
      return response.data;
    } catch (error) {
      console.error('Error fetching activity timeline:', error);
      return null;
    }
  },

  getStateDuration: async () => {
    try {
      const response = await axiosInstance.get('/analytics/state-duration');
      return response.data;
    } catch (error) {
      console.error('Error fetching state duration:', error);
      return null;
    }
  },

  getDeviceAnomalies: async () => {
    try {
      const response = await axiosInstance.get('/analytics/device-anomalies-summary');
      return response.data;
    } catch (error) {
      console.error('Error fetching device anomalies:', error);
      return null;
    }
  },
  
  // Health check to verify backend connectivity
  checkHealth: async () => {
    try {
      const response = await axiosInstance.get('/health');
      return response.data;
    } catch (error: any) {
      console.error('Error checking API health:', error);
      return { status: 'error', error: error.message || 'Unknown error' };
    }
  }
};

export default api; 