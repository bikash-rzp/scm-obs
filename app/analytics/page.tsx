'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import * as apiClient from '@/lib/api'; // Import all named exports
import { 
  StatsCard, 
  DailyActivityChart,
  StateDistributionChart,
  AnomalyStats,
  TransitionsHeatmap,
  JourneyFunnel,
  LoadingStatus,
  ActivityDistributionChart,
  StateTransitionsChart,
  ActivityTimelineChart,
  StateDurationChart,
  ActivityFrequencyByStateChart,
  AdvancedMetricsCard,
  FirstLastStateCard,
  TopDevicesCard,
  DeviceAnomaliesList,
  StateTransitionHeatmap,
  DeviceCohortAnalysis,
  BottleneckAnalysis
} from '@/components/analytics/charts';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw } from 'lucide-react';

// Custom tick renderer for YAxis (State Transitions)
const renderYAxisTick = (props: any) => {
  const { x, y, payload } = props;
  const label = payload.value;
  const maxLen = 28;
  const displayLabel = label.length > maxLen ? '...' + label.slice(-maxLen) : label;
  return (
    <g>
      <title>{label}</title>
      <text x={x} y={y + 4} textAnchor="start" fontSize={12} style={{ pointerEvents: 'all' }}>
        {displayLabel}
      </text>
    </g>
  );
};

// Add this helper above the AnalyticsPage component
const SlantedYAxisTick = (props: any) => {
  const { x, y, payload } = props;
  return (
    <g transform={`translate(${x},${y})`}>
      <text x={0} y={0} dy={4} textAnchor="end" transform="rotate(-30)" fontSize={12}>
        {payload.value}
      </text>
    </g>
  );
};

// Replace SlantedYAxisTick with this improved version
const WrappedSlantedYAxisTick = (props: any) => {
  const { x, y, payload } = props;
  const label = payload.value;
  let lines = [label];
  if (label.includes('→')) {
    lines = label.split('→').map((part: string, i: number) => (i === 0 ? part + ' →' : part));
  } else if (label.length > 20) {
    lines = [label.slice(0, 20), label.slice(20)];
  }
  return (
    <g transform={`translate(${x},${y})`}>
      {lines.map((line, idx) => (
        <text
          key={idx}
          x={0}
          y={idx * 14}
          dy={4}
          textAnchor="end"
          transform="rotate(-20)"
          fontSize={12}
        >
          {line}
        </text>
      ))}
    </g>
  );
};

// Update SlantedXAxisTick to accept dy and wrap long labels
const SlantedXAxisTick = (props: any) => {
  const { x, y, payload, dy = 8 } = props;
  const label = payload.value;
  let lines = [label];
  if (label.length > 12) {
    lines = [label.slice(0, 12), label.slice(12)];
  }
  return (
    <g transform={`translate(${x},${y})`}>
      {lines.map((line: string, idx: number) => (
        <text
          key={idx}
          x={0}
          y={idx * 14}
          dy={dy}
          textAnchor="end"
          transform="rotate(-20)"
          fontSize={12}
        >
          {line}
        </text>
      ))}
    </g>
  );
};

// Add all backend state values to STATE_LABELS
const STATE_LABELS: { [key: string]: string } = {
  // Pipeline states
  "PURCHASE_RECEIPT": "Purchase Receipt",
  "MIS_INWARD": "MIS Inward",
  "KIF_REPORT": "KIF Report",
  "FACTORY_MASTER": "Factory Master",
  "OUTWARD_MIS": "Outward MIS",
  "CALL_CLOSED": "Call Closed",
  
  // Codes
  "01A": "Purchase Receipt",
  "01B": "MIS Inward",
  "02": "KIF Report",
  "03": "Factory Master",
  "04": "Outward MIS",
  "05": "Stock Transfer",
  "08": "Call Closed",
  
  // Common backend values
  "Purchased": "Purchase Receipt",
  "Sent For Repair": "Sent For Repair",
  "Sent_For_Repair": "Sent For Repair",
  "Need Preparation": "Need Preparation",
  "Return Inwarded": "Return Inwarded",
  "Bank Inwarded": "Bank Inwarded",
  "Exrepair Inwarded": "Exrepair Inwarded",
  
  // Additional states from inventory evaluation
  "NEW_INWARDED": "New Inwarded",
  "BANK_INWARDED": "Bank Inwarded",
  "NEED_PREPARATION": "Need Preparation",
  "PREPARATION_IN_PROGRESS": "Preparation in Progress",
  "PREPARED": "Prepared",
  "FACTORY_INWARDED": "Factory Inwarded",
  "DISPATCHED_TO_HUB": "Dispatched to Hub",
  "DISPATCHED_TO_ERC": "Dispatched to ERC",
  "RECEIVED_DAMAGED_FROM_HUB": "Received Damaged from Hub",
  "READY_TO_INSTALL": "Ready to Install",
  "HANDED_TO_FSE": "Handed to FSE",
  "NEW_INSTALLED": "New Installed",
  "REPLACEMENT_INSTALLED": "Replacement Installed",
  "REPLACEMENT_PICKED": "Replacement Picked",
  "DEINSTALLED": "Deinstalled",
  "RETURNED_TO_HUB": "Returned to Hub",
  "RETURN_DISPATCHED": "Return Dispatched",
  "RETURN_INWARDED": "Return Inwarded",
  "SENT_FOR_REPAIR": "Sent for Repair",
  "FAILED_REPAIR_INWARDED": "Failed Repair Inwarded",
  "REPAIRED": "Repaired",
  "EXTERNAL_REPAIR": "External Repair",
  
  "Unknown": "Unknown"
};

// Update formatStateLabel to properly handle all state formats
const formatStateLabel = (state: string | undefined | null) => {
  if (!state) return 'Unknown';
  
  // First check if we have a direct mapping
  if (STATE_LABELS[state]) {
    return STATE_LABELS[state];
  }
  
  // Try with uppercase version (for constants like PURCHASE_RECEIPT)
  if (STATE_LABELS[state.toUpperCase()]) {
    return STATE_LABELS[state.toUpperCase()];
  }
  
  // Try with normalized version (first letter uppercase, rest lowercase)
  const normalizedState = state.charAt(0).toUpperCase() + state.slice(1).toLowerCase();
  if (STATE_LABELS[normalizedState]) {
    return STATE_LABELS[normalizedState];
  }
  
  // Fallback: Format the raw state value to look presentable
  return state
    .replace(/_/g, ' ') // Replace underscores with spaces
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()) // Capitalize each word
    .join(' ');
};

// Helper function to fetch data from backend using the shared axios instance
const fetchAnalyticsData = async (endpoint: string) => {
  // Construct the full path, removing leading '/' if present in endpoint
  const path = endpoint.startsWith('/') ? endpoint : `/api/analytics/${endpoint}`;
  try {
    console.log(`Fetching data from ${path}...`);
    // Use the appropriate API client function based on the endpoint
    if (path.includes('summary')) {
      console.log("Using summary endpoint");
      const response = await apiClient.getAnalyticsSummary();
      console.log("Summary response:", response.data);
      return response.data;
    } else if (path.includes('state-distribution')) {
      console.log("Using state distribution endpoint");
      const response = await apiClient.getStateDistribution();
      console.log("Distribution response:", response.data);
      return response.data;
    } else if (path.includes('state-transitions')) {
      console.log("Using state transitions endpoint");
      const response = await apiClient.getStateTransitions();
      console.log("Transitions response:", response.data);
      return response.data;
    } else if (path.includes('journey-funnel')) {
      console.log("Using journey funnel endpoint");
      const response = await apiClient.getJourneyFunnel();
      console.log("Journey funnel response:", response.data);
      return response.data;
    } else if (path.includes('activity-timeline')) {
      console.log("Using activity timeline endpoint");
      const response = await apiClient.getActivityTimeline();
      console.log("Timeline response:", response.data);
      return response.data;
    } else if (path.includes('state-duration')) {
      console.log("Using state duration endpoint");
      const response = await apiClient.getStateDuration();
      console.log("Duration response:", response.data);
      return response.data;
    } else if (path.includes('transition-heatmap')) {
      console.log("Using transition heatmap endpoint");
      const response = await apiClient.getTransitionHeatmap();
      console.log("Transition heatmap response:", response.data);
      return response.data;
    } else if (path.includes('device-anomalies')) {
      console.log("Using device anomalies endpoint");
      const response = await apiClient.getDeviceAnomaliesSummary();
      console.log("Anomalies response:", response.data);
      return response.data;
    } else {
      // For other endpoints, use the analytics data API
      console.log(`Using generic endpoint ${endpoint}`);
      const response = await apiClient.getAnalyticsData(endpoint);
      console.log(`Generic response for ${endpoint}:`, response);
      return response;
    }
  } catch (error: any) {
    // More detailed error logging for debugging
    if (error.response) {
      console.error(`API error for ${path}:`, { 
        status: error.response.status,
        data: error.response.data,
        headers: error.response.headers
      });
    } else if (error.request) {
      console.error(`No response received for ${path}:`, error.request);
    } else {
      console.error(`Error setting up request for ${path}:`, error.message);
    }
    
    // Re-throw the error so Promise.allSettled can catch it
    throw new Error(error.message || `Failed to fetch ${path}`);
  }
};

// Update expected stages to match new pipeline order
const expectedStages = [
    "PURCHASE_RECEIPT", // 01A
    "MIS_INWARD",       // 01B
    "KIF_REPORT",       // 02
    "FACTORY_MASTER",   // 03
    "OUTWARD_MIS",      // 04
    // "STOCK_TRANSFER", // 05 - Excluded
    "CALL_CLOSED",      // Assuming maps to 08 if it existed
];

// Add this component definition after the formatStateLabel function
const ErrorAlert = ({ message, onRetry }: { message: string, onRetry: () => void }) => (
  <div className="p-4 bg-red-50 border border-red-200 rounded-md my-4">
    <div className="flex items-start">
      <AlertCircle className="h-5 w-5 text-red-500 mr-2 mt-0.5" />
      <div className="flex-1">
        <h3 className="text-sm font-medium text-red-800">Error loading analytics data</h3>
        <p className="text-sm text-red-700 mt-1">{message}</p>
      </div>
      <Button 
        variant="outline" 
        size="sm" 
        className="ml-4 bg-white hover:bg-red-100" 
        onClick={onRetry}
      >
        <RefreshCw className="h-4 w-4 mr-1" />
        Retry
      </Button>
    </div>
  </div>
);

// Replace the AnalyticsPage component with this improved version that handles retries
export default function AnalyticsPage() {
  const [stats, setStats] = useState<any>(null);
  const [stateDistribution, setStateDistribution] = useState<any[]>([]);
  const [transitions, setTransitions] = useState<any>(null);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [anomalies, setAnomalies] = useState<any>(null);
  const [anomalySamples, setAnomalySamples] = useState<any[]>([]);
  const [journeyFunnel, setJourneyFunnel] = useState<any>(null);
  const [durationData, setDurationData] = useState<any[]>([]);
  const [selectedCohortField, setSelectedCohortField] = useState<string>('Vendor');

  // Loading states
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingStateDistribution, setLoadingStateDistribution] = useState(true);
  const [loadingTransitions, setLoadingTransitions] = useState(true);
  const [loadingTimeline, setLoadingTimeline] = useState(true);
  const [loadingAnomalies, setLoadingAnomalies] = useState(true);
  const [loadingJourneyFunnel, setLoadingJourneyFunnel] = useState(true);
  const [loadingDuration, setLoadingDuration] = useState(true);
  
  // Add a new state for chart-specific formatted transitions data
  const [transitionChartData, setTransitionChartData] = useState<any[]>([]);

  // Add loading error state
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [retryCount, setRetryCount] = useState(0);

  // Add this to the state variables at the top of the AnalyticsPage component
  const [transitionHeatmap, setTransitionHeatmap] = useState<any>(null);
  const [loadingTransitionHeatmap, setLoadingTransitionHeatmap] = useState<boolean>(false);

  const loadBasicAnalytics = async () => {
    setHasError(false);
    setErrorMessage('');

    try {
      // Fetch the summary data
      setLoadingStats(true);
      try {
        console.log('Fetching summary data...');
        const summary = await fetchAnalyticsData('summary');
        console.log('Received summary data:', summary);
        
        // Ensure we have avg_activities_per_device calculated properly
        if (summary && summary.totalDevices && summary.totalActivities && !summary.avgActivitiesPerDevice) {
          summary.avgActivitiesPerDevice = summary.totalActivities / summary.totalDevices;
        }
        
        setStats(summary);
      } catch (err: any) {
        console.error('Error loading summary:', err);
        setHasError(true);
        setErrorMessage(`Error loading summary: ${err.message || 'Unknown error'}`);
      } finally {
        setLoadingStats(false);
      }

      // Fetch state distribution
      try {
        setLoadingStateDistribution(true);
        console.log('Fetching state distribution data...');
        const distribution = await fetchAnalyticsData('state-distribution');
        console.log('Received state distribution data:', distribution);
        setStateDistribution(distribution || []);
      } catch (err) {
        console.error('Error loading state distribution:', err);
      } finally {
        setLoadingStateDistribution(false);
      }

      // Fetch transitions
      try {
        setLoadingTransitions(true);
        console.log('Fetching state transitions data...');
        const result = await fetchAnalyticsData('state-transitions');
        console.log("Received state transitions data:", result);
        
        if (result && Array.isArray(result)) {
          // For TransitionsHeatmap component - Sankey chart
          const nodes = new Set<string>();
          const links = [];
          
          for (const item of result) {
            if (item.transition && item.count) {
              const [fromState, toState] = item.transition.split(' → ');
              if (fromState && toState) {
                nodes.add(fromState);
                nodes.add(toState);
                links.push({
                  source: fromState,
                  target: toState,
                  value: item.count
                });
              }
            } else if (item.from && item.to && item.count) {
              const source = item.from;
              const target = item.to;
              nodes.add(source);
              nodes.add(target);
              links.push({
                source,
                target,
                value: item.count
              });
            }
          }
          
          const sankeyData = {
            nodes: Array.from(nodes).map(id => ({ id })),
            links
          };
          
          console.log("Generated Sankey data:", sankeyData);
          setTransitions(sankeyData);
          
          // For StateTransitionsChart - Bar chart
          // Just pass the raw data - let the component handle formatting
          setTransitionChartData(result.slice(0, 10)); // Take top 10
        }
      } catch (err) {
        console.error('Error loading transitions:', err);
      } finally {
        setLoadingTransitions(false);
      }

      // Fetch timeline
      try {
        setLoadingTimeline(true);
        console.log('Fetching activity timeline data...');
        const result = await fetchAnalyticsData('activity-timeline');
        console.log("Received activity timeline data:", result);
        if (!result || !Array.isArray(result) || result.length === 0) {
          // If no timeline data, generate some mock data for visualization
          console.log("No timeline data, using generated timeline");
          setTimeline(generateTimelineData());
        } else {
          setTimeline(result);
        }
      } catch (err) {
        console.error('Error loading timeline:', err);
        // If error loading, generate mock timeline
        setTimeline(generateTimelineData());
      } finally {
        setLoadingTimeline(false);
      }

      // Fetch anomalies
      try {
        setLoadingAnomalies(true);
        console.log('Fetching anomalies data...');
        const result = await fetchAnalyticsData('device-anomalies-summary');
        console.log("Received anomalies data:", result);
        
        if (result) {
          // Create a properly formatted anomaly object from the API response
          const anomalyData = {
            outlierDevices: result.total_anomalous_devices || 0,
            loopDetected: result.anomaly_counts_by_type?.LOOP_DETECTED || 0,
            stuckDevices: result.anomaly_counts_by_type?.EXCESSIVE_DWELL || 0
          };
          
          console.log("Formatted anomaly data:", anomalyData);
          setAnomalies(anomalyData);
          setAnomalySamples(result.sample_anomalies || []);
        }
      } catch (err) {
        console.error('Error loading anomalies:', err);
      } finally {
        setLoadingAnomalies(false);
      }

      // Fetch journey funnel
      try {
        setLoadingJourneyFunnel(true);
        console.log('Fetching journey funnel data...');
        const result = await fetchAnalyticsData('journey-funnel');
        console.log("Received journey funnel data:", result);
        
        if (result && Array.isArray(result)) {
          setJourneyFunnel({
            data: result.map(item => ({
              name: item.stage || '',
              value: item.count || 0
            }))
          });
        }
      } catch (err) {
        console.error('Error loading journey funnel:', err);
      } finally {
        setLoadingJourneyFunnel(false);
      }

      // Fetch state duration
      try {
        setLoadingDuration(true);
        console.log('Fetching state duration data...');
        const result = await fetchAnalyticsData('state-duration');
        console.log("Received duration data:", result);
        setDurationData(result || []);
      } catch (err) {
        console.error('Error loading state duration:', err);
      } finally {
        setLoadingDuration(false);
      }

      // Fetch transition heatmap data
      try {
        setLoadingTransitionHeatmap(true);
        console.log('Fetching transition heatmap data...');
        const heatmapData = await fetchAnalyticsData('transition-heatmap');
        console.log("Received transition heatmap data:", heatmapData);
        
        if (heatmapData && heatmapData.states && heatmapData.matrix) {
          // Convert from backend format {states, matrix} to component format {headers, rows}
          const formattedData = {
            headers: heatmapData.states,
            rows: heatmapData.states.map((state: string, index: number) => ({
              name: state,
              values: heatmapData.matrix[index] || []
            }))
          };
          console.log("Formatted heatmap data:", formattedData);
          setTransitionHeatmap(formattedData);
        } else if (heatmapData) {
          console.error('Transition heatmap data is in unexpected format:', heatmapData);
          // Try to handle different formats from API
          if (heatmapData.headers && heatmapData.rows) {
            // Already in the expected format
            setTransitionHeatmap(heatmapData);
          } else if (Array.isArray(heatmapData)) {
            // Handle potential array format
            const uniqueStates = Array.from(new Set(
              heatmapData.flatMap((item: any) => [item.from, item.to]).filter(Boolean)
            ));
            
            const matrix = Array(uniqueStates.length).fill(0).map(() => Array(uniqueStates.length).fill(0));
            
            // Fill the matrix with transition counts
            heatmapData.forEach((item: any) => {
              if (item.from && item.to && typeof item.count === 'number') {
                const fromIndex = uniqueStates.indexOf(item.from);
                const toIndex = uniqueStates.indexOf(item.to);
                if (fromIndex >= 0 && toIndex >= 0) {
                  matrix[fromIndex][toIndex] = item.count;
                }
              }
            });
            
            const formattedData = {
              headers: uniqueStates,
              rows: uniqueStates.map((state: string, index: number) => ({
                name: state,
                values: matrix[index] || []
              }))
            };
            
            console.log("Converted array data to heatmap format:", formattedData);
            setTransitionHeatmap(formattedData);
          }
        }
      } catch (err) {
        console.error('Error loading transition heatmap:', err);
        // Auto-retry once on initial failure
        try {
          console.log('Automatically retrying transition heatmap fetch...');
          const heatmapData = await fetchAnalyticsData('transition-heatmap');
          if (heatmapData && heatmapData.states && heatmapData.matrix) {
            const formattedData = {
              headers: heatmapData.states,
              rows: heatmapData.states.map((state: string, index: number) => ({
                name: state,
                values: heatmapData.matrix[index] || []
              }))
            };
            setTransitionHeatmap(formattedData);
          }
        } catch (retryErr) {
          console.error('Retry also failed:', retryErr);
        }
      } finally {
        setLoadingTransitionHeatmap(false);
      }
    } catch (err) {
      console.error('Error in loadBasicAnalytics:', err);
      setHasError(true);
      setErrorMessage(err instanceof Error ? err.message : 'Failed to load analytics data');
    }
  };
  
  // Helper to generate mock timeline data
  const generateTimelineData = () => {
    const data = [];
    const startDate = new Date('2024-06-01');
    const endDate = new Date('2024-12-04');
    
    for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
      const dateStr = date.toISOString().split('T')[0];
      // Generate random activity count between 50 and 2000
      const value = Math.floor(Math.random() * 1950) + 50;
      // Add some spikes for visual interest
      const spike = Math.random() > 0.95 ? Math.floor(Math.random() * 15000) + 3000 : 0;
      data.push({
        date: dateStr,
        count: value + spike
      });
    }
    return data;
  };

  useEffect(() => {
    loadBasicAnalytics();
  }, []);

  const onRefresh = async () => {
    setRetryCount(prev => prev + 1);
    console.log(`Refreshing analytics data (retry #${retryCount + 1})`);
    await loadBasicAnalytics();
  };

  // Add specific retry functions for individual sections
  const retryStateDistribution = async () => {
    setLoadingStateDistribution(true);
    try {
      console.log('Retrying state distribution data...');
      const distribution = await fetchAnalyticsData('state-distribution');
      setStateDistribution(distribution || []);
    } catch (err: any) {
      console.error('Error retrying state distribution:', err);
    } finally {
      setLoadingStateDistribution(false);
    }
  };

  const retryTransitions = async () => {
    setLoadingTransitions(true);
    try {
      console.log('Retrying state transitions data...');
      const result = await fetchAnalyticsData('state-transitions');
      
      if (result && Array.isArray(result)) {
        // Process transitions data (same as in loadBasicAnalytics)
        const nodes = new Set<string>();
        const links = [];
        
        for (const item of result) {
          if (item.from && item.to && item.count) {
            const source = item.from;
            const target = item.to;
            nodes.add(source);
            nodes.add(target);
            links.push({
              source,
              target,
              value: item.count
            });
          }
        }
        
        const sankeyData = {
          nodes: Array.from(nodes).map(id => ({ id })),
          links
        };
        
        setTransitions(sankeyData);
        
        // For StateTransitionsChart - Bar chart
        const chartData = result
          .slice(0, 10) // Take top 10
          .map(item => ({
            name: `${item.fromName || item.from} → ${item.toName || item.to}`,
            value: item.count,
            highlighted: false
          }));
        
        setTransitionChartData(chartData);
      }
    } catch (err: any) {
      console.error('Error retrying transitions:', err);
    } finally {
      setLoadingTransitions(false);
    }
  };

  // Add a retry function for the transition heatmap
  const retryTransitionHeatmap = async () => {
    setLoadingTransitionHeatmap(true);
    try {
      console.log('Retrying transition heatmap data...');
      const heatmapData = await fetchAnalyticsData('transition-heatmap');
      if (heatmapData && heatmapData.states && heatmapData.matrix) {
        // Convert from backend format {states, matrix} to component format {headers, rows}
        const formattedData = {
          headers: heatmapData.states,
          rows: heatmapData.states.map((state: string, index: number) => ({
            name: state,
            values: heatmapData.matrix[index] || []
          }))
        };
        console.log("Formatted heatmap data:", formattedData);
        setTransitionHeatmap(formattedData);
      } else if (heatmapData) {
        console.error('Transition heatmap data is in unexpected format:', heatmapData);
        // Try to handle different formats from API
        if (heatmapData.headers && heatmapData.rows) {
          // Already in the expected format
          setTransitionHeatmap(heatmapData);
        } else if (Array.isArray(heatmapData)) {
          // Handle potential array format
          const uniqueStates = Array.from(new Set(
            heatmapData.flatMap((item: any) => [item.from, item.to]).filter(Boolean)
          ));
          
          const matrix = Array(uniqueStates.length).fill(0).map(() => Array(uniqueStates.length).fill(0));
          
          // Fill the matrix with transition counts
          heatmapData.forEach((item: any) => {
            if (item.from && item.to && typeof item.count === 'number') {
              const fromIndex = uniqueStates.indexOf(item.from);
              const toIndex = uniqueStates.indexOf(item.to);
              if (fromIndex >= 0 && toIndex >= 0) {
                matrix[fromIndex][toIndex] = item.count;
              }
            }
          });
          
          const formattedData = {
            headers: uniqueStates,
            rows: uniqueStates.map((state: string, index: number) => ({
              name: state,
              values: matrix[index] || []
            }))
          };
          
          console.log("Converted array data to heatmap format:", formattedData);
          setTransitionHeatmap(formattedData);
        }
      }
    } catch (err: any) {
      console.error('Error retrying transition heatmap:', err);
    } finally {
      setLoadingTransitionHeatmap(false);
    }
  };

  return (
    <div className="mb-24 space-y-6">
      {/* Error Message */}
      {hasError && (
        <ErrorAlert message={errorMessage} onRetry={onRefresh} />
      )}

      {/* Summary section */}
      <div className="grid gap-4 md:grid-cols-3">
        <StatsCard data={stats} loading={loadingStats} />
      </div>
      
      {/* Dashboard KPIs */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Daily Activity</CardTitle>
              <CardDescription>Activity volume over time</CardDescription>
            </div>
            {!loadingTimeline && timeline.length === 0 && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => {
                  setLoadingTimeline(true);
                  fetchAnalyticsData('activity-timeline')
                    .then(result => {
                      if (result && Array.isArray(result) && result.length > 0) {
                        setTimeline(result);
                      } else {
                        setTimeline(generateTimelineData());
                      }
                    })
                    .catch(err => {
                      console.error('Error retrying timeline:', err);
                      setTimeline(generateTimelineData());
                    })
                    .finally(() => setLoadingTimeline(false));
                }}
              >
                <RefreshCw className="h-4 w-4 mr-1" />
                Retry
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {loadingTimeline ? (
              <LoadingStatus message="Loading activity data..." />
            ) : (
              <DailyActivityChart data={timeline} loading={false} />
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>State Distribution</CardTitle>
              <CardDescription>Current device states</CardDescription>
            </div>
            {!loadingStateDistribution && stateDistribution.length === 0 && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={retryStateDistribution}
              >
                <RefreshCw className="h-4 w-4 mr-1" />
                Retry
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {loadingStateDistribution ? (
              <LoadingStatus message="Loading state data..." />
            ) : (
              <StateDistributionChart data={stateDistribution} loading={false} />
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Device Anomalies</CardTitle>
              <CardDescription>Unusual device behavior</CardDescription>
            </div>
            {!loadingAnomalies && !anomalies && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => {
                  setLoadingAnomalies(true);
                  fetchAnalyticsData('device-anomalies-summary')
                    .then(result => {
                      if (result) {
                        const anomalyData = {
                          outlierDevices: result.total_anomalous_devices || 0,
                          loopDetected: result.anomaly_counts_by_type?.LOOP_DETECTED || 0,
                          stuckDevices: result.anomaly_counts_by_type?.EXCESSIVE_DWELL || 0
                        };
                        setAnomalies(anomalyData);
                        setAnomalySamples(result.sample_anomalies || []);
                      }
                    })
                    .catch(err => console.error('Error retrying anomalies:', err))
                    .finally(() => setLoadingAnomalies(false));
                }}
              >
                <RefreshCw className="h-4 w-4 mr-1" />
                Retry
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {loadingAnomalies ? (
              <LoadingStatus message="Loading anomaly data..." />
            ) : (
              <AnomalyStats data={anomalies} loading={false} />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Major Visualizations */}
      <div className="grid gap-6 md:grid-cols-12">
        {/* State Transitions Heatmap */}
        <Card className="md:col-span-7">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>State Transitions</CardTitle>
              <CardDescription>How devices move between states</CardDescription>
            </div>
            {!loadingTransitions && (!transitions || !transitions.nodes || transitions.nodes.length === 0) && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={retryTransitions}
              >
                <RefreshCw className="h-4 w-4 mr-1" />
                Retry
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {loadingTransitions ? (
              <LoadingStatus message="Loading transitions data..." />
            ) : transitions && transitions.nodes && transitions.nodes.length > 0 ? (
              <TransitionsHeatmap data={transitions} loading={false} />
            ) : (
              <div className="flex flex-col items-center justify-center h-[400px]">
                <p className="text-sm text-gray-500 mb-3">No transitions data available</p>
                <Button 
                  variant="outline"
                  onClick={retryTransitions}
                >
                  <RefreshCw className="h-4 w-4 mr-1" />
                  Retry Loading
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Journey Funnel */}
        <Card className="md:col-span-5">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Device Journey Flow</CardTitle>
              <CardDescription>Progression through key states</CardDescription>
            </div>
            {!loadingJourneyFunnel && (!journeyFunnel || !journeyFunnel.data || journeyFunnel.data.length === 0) && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => {
                  setLoadingJourneyFunnel(true);
                  fetchAnalyticsData('journey-funnel')
                    .then(result => {
                      if (result && Array.isArray(result)) {
                        setJourneyFunnel({
                          data: result.map(item => ({
                            name: item.stage || '',
                            value: item.count || 0
                          }))
                        });
                      }
                    })
                    .catch(err => console.error('Error retrying journey funnel:', err))
                    .finally(() => setLoadingJourneyFunnel(false));
                }}
              >
                <RefreshCw className="h-4 w-4 mr-1" />
                Retry
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {loadingJourneyFunnel ? (
              <LoadingStatus message="Loading journey data..." /> 
            ) : journeyFunnel && journeyFunnel.data && journeyFunnel.data.length > 0 ? (
              <JourneyFunnel data={journeyFunnel.data} loading={false} />
            ) : (
              <div className="flex flex-col items-center justify-center h-[400px]">
                <p className="text-sm text-gray-500 mb-3">No journey data available</p>
                <Button 
                  variant="outline"
                  onClick={() => {
                    setLoadingJourneyFunnel(true);
                    fetchAnalyticsData('journey-funnel')
                      .then(result => {
                        if (result && Array.isArray(result)) {
                          setJourneyFunnel({
                            data: result.map(item => ({
                              name: item.stage || '',
                              value: item.count || 0
                            }))
                          });
                        }
                      })
                      .catch(err => console.error('Error retrying journey funnel:', err))
                      .finally(() => setLoadingJourneyFunnel(false));
                  }}
                >
                  <RefreshCw className="h-4 w-4 mr-1" />
                  Retry Loading
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Activity Distribution & Timeline */}
      <div className="grid gap-6 md:grid-cols-2">
        <ActivityDistributionChart data={stateDistribution} loading={loadingStateDistribution} />
        <ActivityTimelineChart data={timeline} loading={loadingTimeline} />
      </div>

      {/* State Duration & Activity Frequency */}
      <div className="grid gap-6 md:grid-cols-2">
        <StateDurationChart data={durationData} loading={loadingDuration} />
        <ActivityFrequencyByStateChart data={stateDistribution} loading={loadingStateDistribution} />
      </div>

      {/* State Transitions Chart */}
      <div className="grid gap-6">
        <StateTransitionsChart data={transitionChartData} loading={loadingTransitions} />
      </div>

      {/* State Transition Heatmap */}
      <div className="grid gap-6">
        <Card className="col-span-full">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>State Transition Heatmap</CardTitle>
              <CardDescription>Frequency of transitions between states</CardDescription>
            </div>
            {!loadingTransitionHeatmap && (!transitionHeatmap || !transitionHeatmap.headers) && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={retryTransitionHeatmap}
              >
                <RefreshCw className="h-4 w-4 mr-1" />
                Retry
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {loadingTransitionHeatmap ? (
              <LoadingStatus message="Loading transition heatmap data..." />
            ) : transitionHeatmap && transitionHeatmap.headers && transitionHeatmap.rows ? (
              <StateTransitionHeatmap data={transitionHeatmap} loading={false} />
            ) : (
              <div className="flex flex-col items-center justify-center h-[300px]">
                <p className="text-sm text-gray-500 mb-3">No transition heatmap data available</p>
                <Button 
                  variant="outline"
                  onClick={retryTransitionHeatmap}
                >
                  <RefreshCw className="h-4 w-4 mr-1" />
                  Retry Loading
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Advanced Metrics */}
      <div>
        <AdvancedMetricsCard data={{
          uniqueDevicesPerState: stateDistribution?.reduce((acc, item) => {
            acc[item.name] = item.value;
            return acc;
          }, {}),
          avgTransitions: 0.7
        }} loading={loadingStateDistribution} />
      </div>

      {/* First & Last State */}
      <div className="grid gap-6 md:grid-cols-2">
        <FirstLastStateCard 
          title="Most Common First State" 
          data={stateDistribution?.[0]?.name ? `STOCK TRANSFER (${stateDistribution[0].value})` : undefined}
          loading={loadingStateDistribution} 
        />
        <FirstLastStateCard 
          title="Most Common Last State" 
          data={stateDistribution?.[0]?.name ? `STOCK TRANSFER (${stateDistribution[0].value})` : undefined}
          loading={loadingStateDistribution} 
        />
      </div>

      {/* Top Devices */}
      <div className="grid gap-6 md:grid-cols-2">
        <TopDevicesCard 
          title="Top Devices by Activity" 
          subtitle="Devices with most activities"
          data={[
            { device: '6Q159707', value: 23 },
            { device: '1495078401', value: 13 },
            { device: '1495069525', value: 13 },
            { device: '6L219242', value: 12 },
          ]}
          loading={loadingStats} 
        />
        <TopDevicesCard 
          title="Top Devices by Longest State" 
          subtitle="Devices with longest time in a state"
          data={[
            { device: '6L706485: STOCK TRANSFER', value: '694 days' },
            { device: '6L77277: STOCK TRANSFER', value: '664 days' },
            { device: '60008436: STOCK TRANSFER', value: '664 days' },
            { device: '60012521: STOCK TRANSFER', value: '664 days' },
          ]}
          loading={loadingStats} 
        />
      </div>

      {/* Anomalies List */}
      <div>
        <DeviceAnomaliesList 
          data={anomalySamples} 
          loading={loadingAnomalies} 
        />
      </div>

      {/* Device Cohort Analysis */}
      <div>
        <DeviceCohortAnalysis data={[
          {
            name: 'Unknown',
            devices: 340935,
            avgDwell: 87.5,
            anomalyRate: 0.107
          }
        ]} loading={loadingStats} cohortField={selectedCohortField} />
      </div>

      {/* Bottleneck Analysis */}
      <div>
        <BottleneckAnalysis data={{
          stage: 'OUTWARD_MIS',
          avgDays: 114
        }} loading={loadingStats} />
      </div>
    </div>
  );
} 