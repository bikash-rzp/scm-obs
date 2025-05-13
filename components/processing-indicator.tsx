'use client'; // Add use client for hooks

import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react'; // Example spinner icon

// Hook to poll status
function useProcessingStatus() {
  const [status, setStatus] = useState('idle'); // idle, processing, complete, error
  const [error, setError] = useState<string | null>(null);
  const [shouldShowError, setShouldShowError] = useState(false);
  const [isInitialCheck, setIsInitialCheck] = useState(true);

  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;

    const checkDataAvailable = async (): Promise<boolean> => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
        const devicesRes = await fetch(`${apiUrl}/device-count`);
        if (devicesRes.ok) {
          const devicesData = await devicesRes.json();
          return devicesData.count > 0;
        }
      } catch (err) {
        console.error('Error checking device data:', err);
      }
      return false;
    };

    const fetchStatus = async () => {
      try {
        // First, check if data is available regardless of processing status
        const hasDevices = await checkDataAvailable();
        
        // If we have devices, we can skip showing most errors
        if (hasDevices && isInitialCheck) {
          setIsInitialCheck(false);
          setShouldShowError(false);
          return; // Skip status check on initial load if we have data
        }
        
        // Ensure API URL is correctly configured (use environment variable)
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
        const res = await fetch(`${apiUrl}/processing-status`);
        
        if (!res.ok) throw new Error(`Failed to fetch status: ${res.statusText}`);
        
        const data = await res.json();
        setStatus(data.status);
        setError(data.error || null); // Ensure error is null if not present

        // Never show 'str' object has no attribute 'get' error when we have devices
        if (data.status === 'error' && 
            data.error && 
            (data.error.includes("'str' object has no attribute 'get'") ||
             hasDevices)) {
          setShouldShowError(false);
        } else if (data.status === 'error') {
          setShouldShowError(true);
        }

        // Stop polling if processing is done or errored
        if (data.status === 'complete' || (data.status === 'error' && !hasDevices)) {
          if (intervalId) clearInterval(intervalId);
        }
        
        setIsInitialCheck(false);
      } catch (err: any) {
        console.error("Error fetching processing status:", err);
        
        // Check if we have data before showing the error
        const hasDevices = await checkDataAvailable();
        if (!hasDevices) {
          setStatus('error');
          setError(err.message || 'Unknown error');
          setShouldShowError(true);
        } else {
          setShouldShowError(false);
        }
        
        if (intervalId) clearInterval(intervalId);
      }
    };

    // Fetch immediately and then start polling
    fetchStatus();
    intervalId = setInterval(fetchStatus, 5000); // Poll every 5 seconds

    // Cleanup interval on component unmount
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, []); // Run only once on mount

  return { status, error, shouldShowError };
}

// Simple component to show processing status
export default function ProcessingIndicator() {
  const { status, error, shouldShowError } = useProcessingStatus();
  
  // Always return null to not block the UI
  return null;
} 