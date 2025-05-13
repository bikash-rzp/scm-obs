'use client';

import { useEffect, useState, useCallback } from 'react';
import { DeviceTable } from '@/components/devices/device-table';
import { getDevices } from '@/lib/api';
import { DeviceSummary, PaginatedDevicesResponse } from '@/lib/types';
import { AlertTriangle, Loader2, RefreshCw } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button'; 
import ProcessingIndicator from '@/components/processing-indicator';
import axios from 'axios';
import { FallbackState } from '@/components/fallback-state';
import { DeviceTableShimmer } from '@/components/devices/device-table-shimmer';

const ITEMS_PER_PAGE = 15;

// Define a proper interface for the cached device data structure
interface DevicesTableData {
  devices: any[];
  total_count: number;
}

// Updated data state interface
interface TableData {
  rows: any[];
  pageCount: number;
}

export default function DevicesPage() {
  // Updated state to match our new interface
  const [data, setData] = useState<TableData | null>(null);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  // State for filters, sorting, and pagination controlled by the table
  const [filters, setFilters] = useState({
    search: '',
    state: 'ALL',
    status: 'ALL',
    dateRange: { from: '', to: '' },
    hidePurchaseOnly: true,
  });
  const [sorting, setSorting] = useState({ id: 'last_activity_timestamp', desc: true });
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: ITEMS_PER_PAGE });

  // Fetch data when filters, sorting, or pagination change
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    // Create a cache key based on the current filters and pagination
    const cacheKey = `devices_${pagination.pageIndex}_${pagination.pageSize}_${JSON.stringify(filters)}_${sorting.id}_${sorting.desc}`;
    
    // Check browser cache for recent results
    const cachedData = localStorage.getItem(cacheKey);
    if (cachedData) {
      try {
        const { data: cachedDevices, timestamp } = JSON.parse(cachedData);
        const cacheAge = Date.now() - timestamp;
        
        // Use cache if it's less than 5 minutes old
        if (cacheAge < 5 * 60 * 1000) {
          setData({
            rows: cachedDevices,
            pageCount: Math.ceil(totalCount / pagination.pageSize),
          });
          setLoading(false);
          
          // Still fetch in background to update cache
          getDevices({
            skip: pagination.pageIndex * pagination.pageSize,
            limit: pagination.pageSize,
            search: filters.search || undefined,
            state: filters.state === 'ALL' ? undefined : filters.state,
            status: filters.status === 'ALL' ? undefined : filters.status,
            sort_by: sorting.id,
            sort_dir: sorting.desc ? 'desc' : 'asc',
          }, axios.CancelToken.source().token)
            .then(freshData => {
              if (freshData) {
                setData({
                  rows: freshData.devices || [],
                  pageCount: Math.ceil(freshData.total_count / pagination.pageSize),
                });
                setTotalCount(freshData.total_count || 0);
                
                // Update cache
                localStorage.setItem(cacheKey, JSON.stringify({
                  data: freshData.devices,
                  timestamp: Date.now(),
                }));
              }
            })
            .catch(() => { /* Silently fail background update */ });
          
          return;
        }
      } catch (e) {
        console.error('Error parsing cached data:', e);
        // Continue with fetching fresh data
      }
    }
    
    try {
      const fetchedData = await getDevices({
        skip: pagination.pageIndex * pagination.pageSize,
        limit: pagination.pageSize,
        search: filters.search || undefined,
        state: filters.state === 'ALL' ? undefined : filters.state,
        status: filters.status === 'ALL' ? undefined : filters.status,
        sort_by: sorting.id,
        sort_dir: sorting.desc ? 'desc' : 'asc',
      }, axios.CancelToken.source().token);
      
      if (!fetchedData) {
        throw new Error("Failed to fetch device data");
      }
      
      // Cache the results
      localStorage.setItem(cacheKey, JSON.stringify({
        data: fetchedData.devices,
        timestamp: Date.now(),
      }));
      
      setData({
        rows: fetchedData.devices || [],
        pageCount: Math.ceil(fetchedData.total_count / pagination.pageSize),
      });
      setTotalCount(fetchedData.total_count || 0);
    } catch (e: any) {
      console.error('Error fetching devices:', e);
      setError(e.message || "Failed to load devices");
      
      // Try to use cached data even if it's older than 5 minutes
      if (cachedData) {
        try {
          const { data: cachedDevices } = JSON.parse(cachedData);
          setData({
            rows: cachedDevices,
            pageCount: Math.ceil(totalCount / pagination.pageSize),
          });
          // Don't clear the error - we'll show both cached data and error notification
        } catch (cacheError) {
          console.error('Error using fallback cache:', cacheError);
        }
      }
    } finally {
      setLoading(false);
    }
  }, [pagination.pageIndex, pagination.pageSize, filters, sorting, totalCount]);

  // Handle manual retry
  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
  };

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Devices</h1>
        <p className="text-muted-foreground">View and manage all devices in the supply chain.</p>
      </div>

      <div className="h-6">
        <ProcessingIndicator /> 
      </div>

      {loading && !data ? (
        <DeviceTableShimmer />
      ) : (
        <FallbackState
          isLoading={false}
          hasError={!!error && (!data || data.rows.length === 0)}
          errorMessage={error || "Failed to load devices"}
          isEmpty={!!(data && data.rows.length === 0 && !loading && !error)}
          emptyMessage="No devices found matching your criteria."
          onRetry={handleRetry}
        >
          <DeviceTable 
            devices={data?.rows || []} 
            isLoading={loading} 
            totalCount={totalCount}
            pagination={pagination}
            setPagination={setPagination}
            filters={filters}
            setFilters={setFilters}
            sorting={sorting}
            setSorting={setSorting}
          />
        </FallbackState>
      )}
    </div>
  );
} 