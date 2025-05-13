'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LineChart, Line, PieChart, Pie, Cell, Legend, Area, AreaChart,
  Treemap, Sankey, Scatter, ScatterChart, LabelList
} from 'recharts';

// Loading component to show when data is being fetched
const LoadingStatus = ({ message = "Loading..." }: { message?: string }) => (
  <div className="flex flex-col items-center justify-center h-64">
    <div className="relative w-16 h-16 mb-4">
      <div className="absolute inset-0 rounded-full bg-gradient-to-r from-primary-300 to-primary-600 animate-pulse"></div>
      <div className="absolute inset-1 rounded-full bg-white"></div>
      <div className="absolute inset-3 rounded-full bg-gradient-to-r from-primary-400 to-primary-700 animate-pulse"></div>
    </div>
          <p className="text-sm text-muted-foreground">{message}</p>
    
    {/* Loading shimmer for chart data */}
    <div className="w-full max-w-md mt-8">
      <div className="h-3 w-1/2 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 animate-pulse rounded mb-2"></div>
      <div className="h-3 w-1/3 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 animate-pulse rounded mb-4"></div>
      <div className="h-32 w-full bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 animate-pulse rounded"></div>
          </div>
    </div>
  );

// Loading shimmer for stats cards
const StatsCardSkeleton = () => (
      <Card className="col-span-3">
        <CardHeader>
      <div className="h-6 w-1/4 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 animate-pulse rounded mb-2"></div>
      <div className="h-4 w-2/5 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 animate-pulse rounded"></div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        <div className="flex flex-col p-4 border rounded-lg">
          <div className="h-3 w-3/4 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 animate-pulse rounded mb-3"></div>
          <div className="h-6 w-1/2 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 animate-pulse rounded"></div>
                </div>
        <div className="flex flex-col p-4 border rounded-lg">
          <div className="h-3 w-3/4 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 animate-pulse rounded mb-3"></div>
          <div className="h-6 w-1/2 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 animate-pulse rounded"></div>
              </div>
        <div className="flex flex-col p-4 border rounded-lg">
          <div className="h-3 w-3/4 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 animate-pulse rounded mb-3"></div>
          <div className="h-6 w-1/2 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 animate-pulse rounded"></div>
        </div>
          </div>
        </CardContent>
      </Card>
    );

// Loading shimmer for chart cards
const ChartSkeleton = () => (
  <Card>
    <CardHeader>
      <div className="h-6 w-1/3 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 animate-pulse rounded mb-2"></div>
      <div className="h-4 w-2/5 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 animate-pulse rounded"></div>
    </CardHeader>
    <CardContent>
      <div className="h-[300px] bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 animate-pulse rounded"></div>
    </CardContent>
  </Card>
);

// Device summary statistics card
const StatsCard = ({ data, loading }: { data: any, loading: boolean }) => {
  if (loading) return <StatsCardSkeleton />;
  
  if (!data) {
    return (
      <Card className="col-span-3">
        <CardHeader>
          <CardTitle>Summary</CardTitle>
          <CardDescription>No data available</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Summary data could not be loaded</p>
        </CardContent>
      </Card>
    );
  }

  // Map the data to the expected format
  const totalDevices = data.total_devices !== undefined ? data.total_devices : data.totalDevices;
  const totalActivities = data.total_activities !== undefined ? data.total_activities : data.totalActivities;
  
  // Calculate avg activities per device if not provided in the response
  let avgActivitiesPerDevice = data.avg_activities_per_device !== undefined 
    ? data.avg_activities_per_device 
    : data.avgActivitiesPerDevice;
    
  // If still undefined, calculate it ourselves if we have the necessary data
  if (avgActivitiesPerDevice === undefined && totalDevices && totalActivities) {
    avgActivitiesPerDevice = totalActivities / totalDevices;
  }
  
  return (
    <Card className="col-span-3">
      <CardHeader>
        <CardTitle>Summary</CardTitle>
        <CardDescription>Key metrics and statistics</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          <div className="flex flex-col p-4 border rounded-lg">
            <span className="text-sm text-muted-foreground">Total Devices</span>
            <span className="text-2xl font-semibold">{totalDevices?.toLocaleString() || 0}</span>
          </div>
          
          <div className="flex flex-col p-4 border rounded-lg">
            <span className="text-sm text-muted-foreground">Total Activities</span>
            <span className="text-2xl font-semibold">{totalActivities?.toLocaleString() || 0}</span>
          </div>
          
          <div className="flex flex-col p-4 border rounded-lg">
            <span className="text-sm text-muted-foreground">Average Activities per Device</span>
            <span className="text-2xl font-semibold">{avgActivitiesPerDevice?.toFixed(1) || 0}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Activity Distribution chart (bar chart)
const ActivityDistributionChart = ({ data, loading }: { data: any[], loading: boolean }) => {
  if (loading) return <ChartSkeleton />;
  
  // Map the data to the expected format - handle both API and frontend naming
  const chartData = data ? data.map(item => ({
    name: item.type || item.name || '',
    value: item.count || item.value || 0
  })) : [];
  
  console.log("Activity distribution chart data:", chartData);
  
  const COLORS = ['#8884d8'];
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Activity Distribution</CardTitle>
        <CardDescription>Distribution of different activity types</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 20, right: 30, left: 20, bottom: 80 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  angle={-45} 
                  textAnchor="end" 
                  height={70} 
                  interval={0} 
                  tick={{ fontSize: 12 }}
                />
                <YAxis />
                <Tooltip formatter={(value) => [Number(value).toLocaleString(), 'Count']} />
                <Bar 
                  dataKey="value" 
                  fill="#8884d8"
                  minPointSize={5}  // Ensure minimum bar height
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                  <LabelList 
                    dataKey="value" 
                    position="top" 
                    formatter={(value: number) => value > 0 ? value.toLocaleString() : ''}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex justify-center items-center h-full">
              <p className="text-muted-foreground">No activity distribution data available</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

// Device state distribution chart
const StateDistributionChart = ({ data, loading }: { data: any[], loading: boolean }) => {
  if (loading) return <ChartSkeleton />;

  // Define a better color palette with more distinct colors
  const COLORS = [
    '#2196F3', // Blue
    '#4CAF50', // Green
    '#FF9800', // Orange
    '#F44336', // Red
    '#9C27B0', // Purple
    '#3F51B5', // Indigo
    '#00BCD4', // Cyan
    '#009688', // Teal
    '#FFC107', // Amber
    '#795548'  // Brown
  ];
  
  // Make sure we have data in the right format for the pie chart
  const chartData = data ? data.map(item => ({
    name: item.name || item.state || 'Unknown',
    value: typeof item.value === 'number' ? item.value : 
           typeof item.count === 'number' ? item.count : 0
  })).filter(item => item.value > 0) : [];
  
  console.log("State distribution chart data:", chartData);

  // Sort data by value descending for better visualization
  chartData.sort((a, b) => b.value - a.value);
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Device State Distribution</CardTitle>
        <CardDescription>Current state of all devices</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  innerRadius={0}
                  fill="#8884d8"
                  dataKey="value"
                  nameKey="name"
                  labelLine={true}
                  label={({name, percent}) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  paddingAngle={2}  // Add space between segments
                >
                  {chartData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={COLORS[index % COLORS.length]} 
                      stroke="#fff"  // White borders between segments
                      strokeWidth={1}
                    />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value, name) => [`${Number(value).toLocaleString()} devices`, name]} 
                  labelFormatter={(label) => null} 
                />
                <Legend 
                  layout="horizontal" 
                  verticalAlign="bottom"
                  align="center"
                  iconSize={10}
                  iconType="circle"
                  wrapperStyle={{ fontSize: '12px', paddingTop: '15px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex justify-center items-center h-full">
              <p className="text-muted-foreground">No distribution data available</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

// State transitions chart
const StateTransitionsChart = ({ data, loading }: { data: any[], loading: boolean }) => {
  if (loading) return <ChartSkeleton />;
  
  console.log("Raw transitions data received:", data);
  
  // Process data to handle both frontend format and API format
  const chartData = data ? data.map(item => {
    // Handle API format with transition field (most common)
    if (item.transition && typeof item.count === 'number') {
      // The transition field might contain a Unicode arrow character (→)
      return {
        name: item.transition,
        value: item.count,
        highlighted: item.highlighted || false
      };
    }
    // Handle older format with from/to fields
    else if (item.from && item.to && typeof item.count === 'number') {
      const fromName = item.fromName || item.from;
      const toName = item.toName || item.to;
      return {
        name: `${fromName} → ${toName}`,
        value: item.count,
        highlighted: item.highlighted || false
      };
    }
    // Handle frontend format with name/value
    else {
      return {
        name: item.name || 'Unknown',
        value: item.value || 0,
        highlighted: item.highlighted || false
      };
    }
  }) : [];
  
  console.log("State transitions chart processed data:", chartData);

  // Custom tick component for slanted Y-axis labels with better angle
  const renderCustomYAxisTick = (props: any) => {
    const { x, y, payload } = props;
    
    // Split label into parts if it contains an arrow for better display
    // The → symbol causes issues with rotation sometimes
    const label = payload.value;
    const parts = label.split(' → ');
    
    if (parts.length === 2) {
      // If it contains an arrow, display as two lines for better readability
      return (
        <g transform={`translate(${x},${y})`}>
          <text
            x={-10}
            y={-5}
            dy={0}
            textAnchor="end"
            fill="#666"
            fontSize={11}
            transform="rotate(-25)"
          >
            {parts[0]} →
          </text>
          <text
            x={-10}
            y={10}
            dy={0}
            textAnchor="end"
            fill="#666"
            fontSize={11}
            transform="rotate(-25)"
          >
            {parts[1]}
          </text>
        </g>
      );
    }
    
    // Default single line case
    return (
      <g transform={`translate(${x},${y})`}>
        <text
          x={-5}
          y={0}
          dy={4}
          textAnchor="end"
          fill="#666"
          fontSize={11}
          transform="rotate(-35)"
        >
          {payload.value}
        </text>
      </g>
    );
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>State Transitions</CardTitle>
        <CardDescription>Most common state transitions</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[400px]">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 150, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                <XAxis type="number" />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  width={150}
                  tick={renderCustomYAxisTick}
                />
                <Tooltip 
                  formatter={(value) => [Number(value).toLocaleString(), 'Count']}
                  labelFormatter={(label) => `Transition: ${label}`}
                />
                <Bar dataKey="value" fill="#4CAF50">
                  {chartData.map((entry: any) => {
                    // If there's a highlighted transition, use a different color
                    if (entry.highlighted) {
                      return <Cell key={entry.name} fill="#9E9E9E" />;
                    }
                    return <Cell key={entry.name} fill="#4CAF50" />;
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex justify-center items-center h-full">
              <p className="text-muted-foreground">No transition data available</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

// Activity Timeline chart
const ActivityTimelineChart = ({ data, loading }: { data: any[], loading: boolean }) => {
  if (loading) return <ChartSkeleton />;
  
  // Normalize API data to expected format
  const chartData = data ? data.map(item => ({
    date: item.date,
    count: typeof item.count !== 'undefined' ? item.count : 0
  })) : [];
  
  console.log("Activity timeline chart data:", chartData);
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Activity Timeline</CardTitle>
        <CardDescription>Activity frequency over time</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={chartData}
                margin={{ top: 20, right: 30, left: 20, bottom: 30 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis 
                  dataKey="date" 
                  angle={-20} 
                  textAnchor="end" 
                  height={60} 
                  tick={{ fontSize: 10 }}
                  interval="preserveStartEnd"
                />
                <YAxis />
                <Tooltip formatter={(value) => [Number(value).toLocaleString(), 'Count']} />
                <Line 
                  type="monotone" 
                  dataKey="count" 
                  stroke="#6C5CE7" 
                  dot={{ fill: '#6C5CE7', r: 3 }}
                  activeDot={{ r: 5 }} 
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex justify-center items-center h-full">
              <p className="text-muted-foreground">No activity timeline data available</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

// State Duration chart
const StateDurationChart = ({ data, loading }: { data: any[], loading: boolean }) => {
  if (loading) return <ChartSkeleton />;
  
  // Map the data to the expected format - handle both API formats
  const chartData = data ? data.map(item => ({
    name: item.state || item.name || '',
    value: item.duration || item.average_days || 0
  })) : [];
  
  console.log("State duration chart data:", chartData);
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>State Duration</CardTitle>
        <CardDescription>Average time spent in each state (days)</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 20, right: 30, left: 20, bottom: 80 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  angle={-45} 
                  textAnchor="end" 
                  height={80} 
                  interval={0} 
                  tick={{ fontSize: 12 }}
                />
                <YAxis label={{ value: 'Days', angle: -90, position: 'insideLeft' }} />
                <Tooltip formatter={(value) => [Number(value).toFixed(1), 'Days']} />
                <Bar 
                  dataKey="value" 
                  fill="#FF9800"
                  minPointSize={5}  // Ensure minimum bar height
                >
                  <LabelList 
                    dataKey="value" 
                    position="top" 
                    formatter={(value: number) => value > 0 ? value.toFixed(1) : ''}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex justify-center items-center h-full">
              <p className="text-muted-foreground">No state duration data available</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

// Activity Frequency by State chart
const ActivityFrequencyByStateChart = ({ data, loading }: { data: any[], loading: boolean }) => {
  if (loading) return <ChartSkeleton />;
  
  // Map the data to the expected format
  const chartData = data ? data.map(item => ({
    name: item.state || item.name || '',
    value: item.count || item.value || 0
  })) : [];
  
  console.log("Activity frequency chart data:", chartData);
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Activity Frequency by State</CardTitle>
        <CardDescription>Number of activities per state</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 20, right: 30, left: 20, bottom: 80 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  angle={-45} 
                  textAnchor="end" 
                  height={80} 
                  interval={0} 
                  tick={{ fontSize: 12 }}
                />
                <YAxis />
                <Tooltip formatter={(value) => [Number(value).toLocaleString(), 'Count']} />
                <Bar 
                  dataKey="value" 
                  fill="#FF5252"
                  minPointSize={5}  // Ensure minimum bar height
                >
                  <LabelList 
                    dataKey="value" 
                    position="top" 
                    formatter={(value: number) => value > 0 ? value.toLocaleString() : ''}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex justify-center items-center h-full">
              <p className="text-muted-foreground">No activity frequency data available</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

// Anomaly stats skeleton
const AnomalyStatsSkeleton = () => (
      <Card>
        <CardHeader>
      <div className="h-6 w-1/3 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 animate-pulse rounded mb-2"></div>
      <div className="h-4 w-2/5 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 animate-pulse rounded"></div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="flex flex-col p-3 border rounded-lg">
          <div className="h-3 w-3/4 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 animate-pulse rounded mb-3"></div>
          <div className="h-6 w-1/2 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 animate-pulse rounded"></div>
                </div>
        <div className="flex flex-col p-3 border rounded-lg">
          <div className="h-3 w-3/4 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 animate-pulse rounded mb-3"></div>
          <div className="h-6 w-1/2 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 animate-pulse rounded"></div>
              </div>
        <div className="flex flex-col p-3 border rounded-lg">
          <div className="h-3 w-3/4 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 animate-pulse rounded mb-3"></div>
          <div className="h-6 w-1/2 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 animate-pulse rounded"></div>
        </div>
          </div>
    </CardContent>
  </Card>
);

// Anomaly statistics card
const AnomalyStats = ({ data, loading }: { data: any, loading: boolean }) => {
  if (loading) return <AnomalyStatsSkeleton />;
  
  if (!data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Anomaly Summary</CardTitle>
          <CardDescription>No data available</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Anomaly data could not be loaded</p>
        </CardContent>
      </Card>
    );
  }
  
  // Log the data to help debug
  console.log("AnomalyStats received data:", data);
  
  // Extract anomaly data with support for both frontend naming and API naming conventions
  const totalAnomalousDevices = data.total_anomalous_devices ?? data.outlierDevices ?? 0;
  const anomalyCountsByType = data.anomaly_counts_by_type || {};
  
  const loopDetected = anomalyCountsByType.LOOP_DETECTED ?? data.loopDetected ?? 0;
  const excessiveDwell = anomalyCountsByType.EXCESSIVE_DWELL ?? data.stuckDevices ?? 0; 
  const invalidTransitions = anomalyCountsByType.INVALID_TRANSITION ?? data.invalidTransitions ?? 0;
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Anomaly Summary</CardTitle>
        <CardDescription>Overview of detected anomalies</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="flex flex-col p-3 border rounded-lg bg-amber-50">
            <span className="text-sm text-muted-foreground">Stuck Devices</span>
            <span className="text-2xl font-semibold">{excessiveDwell?.toLocaleString() || 0}</span>
          </div>
          
          <div className="flex flex-col p-3 border rounded-lg bg-blue-50">
            <span className="text-sm text-muted-foreground">Loop Detected</span>
            <span className="text-2xl font-semibold">{loopDetected?.toLocaleString() || 0}</span>
          </div>
          
          <div className="flex flex-col p-3 border rounded-lg bg-red-50">
            <span className="text-sm text-muted-foreground">Invalid Transitions</span>
            <span className="text-2xl font-semibold">{invalidTransitions?.toLocaleString() || 0}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Advanced Metrics card
const AdvancedMetricsCard = ({ data, loading }: { data: any, loading: boolean }) => {
  if (loading) return <LoadingStatus message="Loading advanced metrics data..." />;
  
  if (!data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Advanced Metrics</CardTitle>
          <CardDescription>No data available</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Advanced metrics could not be loaded</p>
        </CardContent>
      </Card>
    );
  }
  
  const { uniqueDevicesPerState = {}, avgTransitions = 0 } = data;
  
  return (
    <Card className="col-span-full">
      <CardHeader>
        <CardTitle>Advanced Metrics</CardTitle>
        <CardDescription>Additional device and state insights</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="border rounded-lg p-4">
            <h3 className="text-lg font-medium mb-4">Unique Devices per State</h3>
            <div className="space-y-2">
              {Object.entries(uniqueDevicesPerState).map(([state, count]: [string, any]) => (
                <div key={state} className="flex justify-between">
                  <span>{state}:</span>
                  <span className="font-medium">{count?.toLocaleString() || 0}</span>
                </div>
              ))}
            </div>
          </div>
          
          <div className="border rounded-lg p-4 flex flex-col justify-center items-center">
            <h3 className="text-lg font-medium mb-4">Avg Transitions / Device</h3>
            <span className="text-4xl font-bold">{avgTransitions.toFixed(1)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// First and Last State cards
const FirstLastStateCard = ({ title, data, loading }: { title: string, data?: string, loading: boolean }) => {
  if (loading) return <LoadingStatus message={`Loading ${title.toLowerCase()} data...`} />;
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {data ? (
          <p className="text-lg">{data}</p>
        ) : (
          <p className="text-muted-foreground">No data available</p>
        )}
      </CardContent>
    </Card>
  );
};

// Top Devices card (by activity or longest state)
const TopDevicesCard = ({ title, subtitle, data, loading }: { 
  title: string, 
  subtitle: string,
  data?: Array<{device: string, value: number | string}>, 
  loading: boolean 
}) => {
  if (loading) return <LoadingStatus message={`Loading ${title.toLowerCase()} data...`} />;
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{subtitle}</CardDescription>
      </CardHeader>
      <CardContent>
        {data && data.length > 0 ? (
          <div className="space-y-2">
            {data.map((item, index) => (
              <div key={index} className="flex justify-between items-center">
                <span>{item.device}:</span>
                <span className="font-medium">{typeof item.value === 'number' ? item.value : item.value}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground">No device data available</p>
        )}
      </CardContent>
    </Card>
  );
};

// State transitions heatmap - fallback to bar chart instead of Sankey
const TransitionsHeatmap = ({ data, loading }: { data: any, loading: boolean }) => {
  if (loading) return <LoadingStatus message="Loading transitions data..." />;

  // Create simplified chart data from the links
  let chartData: Array<{name: string, value: number}> = [];
  
  if (data && data.links && Array.isArray(data.links)) {
    // Convert Sankey links to bar chart data
    chartData = data.links
      .slice(0, 10) // Take top 10 transitions
      .map((link: {source: string, target: string, value: number}) => ({
        name: `${link.source} → ${link.target}`,
        value: link.value
      }))
      .sort((a: {value: number}, b: {value: number}) => b.value - a.value); // Sort by value descending
  }
  
  // If no valid data, show message
  if (!chartData || chartData.length === 0) {
    return (
      <div className="flex justify-center items-center h-[400px]">
        <p className="text-muted-foreground">No transition data available</p>
      </div>
    );
  }
  
  return (
    <div className="h-[400px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
          <XAxis type="number" />
          <YAxis 
            dataKey="name" 
            type="category" 
            width={100} 
            tick={{ fontSize: 11 }}
          />
          <Tooltip formatter={(value) => [Number(value).toLocaleString(), 'Count']} />
          <Bar dataKey="value" fill="#4CAF50" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

// Device Anomalies List component
const DeviceAnomaliesList = ({ data, loading }: { data: any[], loading: boolean }) => {
  if (loading) return <LoadingStatus message="Loading device anomalies data..." />;
  
  const anomalies = data || [];
  
  return (
    <Card className="col-span-full">
      <CardHeader>
        <CardTitle>Device Anomalies Summary</CardTitle>
        <CardDescription>Sample of devices with potential issues</CardDescription>
      </CardHeader>
      <CardContent>
        {anomalies.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border">
              <thead>
                <tr>
                  <th className="py-3 px-4 text-left text-sm font-medium">DSN</th>
                  <th className="py-3 px-4 text-left text-sm font-medium">Type</th>
                  <th className="py-3 px-4 text-left text-sm font-medium">Description</th>
                  <th className="py-3 px-4 text-left text-sm font-medium">Severity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {anomalies.map((anomaly, index) => (
                  <tr key={index}>
                    <td className="py-2 px-4 text-sm">{anomaly.dsn}</td>
                    <td className="py-2 px-4 text-sm">
                      <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200">
                        {anomaly.type}
                      </Badge>
                    </td>
                    <td className="py-2 px-4 text-sm">{anomaly.description}</td>
                    <td className="py-2 px-4 text-sm">{anomaly.severity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-center py-4">No device anomalies detected</p>
        )}
      </CardContent>
    </Card>
  );
};

// Daily activity chart
const DailyActivityChart = ({ data, loading }: { data: any[], loading: boolean }) => {
  if (loading) return <LoadingStatus message="Loading daily activity data..." />;
  
  const chartData = data || [];
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Daily Activities</CardTitle>
        <CardDescription>Device activity count over time</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={chartData}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Area type="monotone" dataKey="count" fill="#8884d8" stroke="#8884d8" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex justify-center items-center h-full">
              <p className="text-muted-foreground">No activity data available</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

// State Transition Heatmap component
const StateTransitionHeatmap = ({ data, loading }: { data: any, loading: boolean }) => {
  if (loading) return <LoadingStatus message="Loading transition heatmap data..." />;

  if (!data) {
    return (
      <Card className="col-span-full">
        <CardHeader>
          <CardTitle>State Transition Heatmap</CardTitle>
          <CardDescription>No data available</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Transition heatmap data could not be loaded</p>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className="col-span-full">
      <CardHeader>
        <CardTitle>State Transition Heatmap</CardTitle>
        <CardDescription>Frequency of transitions between states</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="min-w-full border">
            <thead>
              <tr>
                <th className="py-3 px-4 text-left text-sm font-medium border bg-muted">From ↓ | To →</th>
                {data.headers?.map((header: string, index: number) => (
                  <th key={index} className="py-3 px-4 text-left text-sm font-medium border bg-muted">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.rows?.map((row: any, rowIndex: number) => (
                <tr key={rowIndex}>
                  <th className="py-2 px-4 text-left text-sm font-medium border bg-muted">
                    {row.name}
                  </th>
                  {row.values?.map((cell: any, cellIndex: number) => {
                    // Set cell styling based on value
                    let bgColor = 'bg-white';
                    if (cell > 0) {
                      if (cell > 10000) bgColor = 'bg-red-100';
                      else if (cell > 1000) bgColor = 'bg-red-50';
                      else if (cell > 100) bgColor = 'bg-blue-50';
                    }
                    return (
                      <td key={cellIndex} className={`py-2 px-4 text-sm text-center border ${bgColor}`}>
                        {cell > 0 ? cell.toLocaleString() : ''}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};

// Device Cohort Analysis component
const DeviceCohortAnalysis = ({ 
  data, 
  loading, 
  cohortField 
}: { 
  data: any[], 
  loading: boolean,
  cohortField: string
}) => {
  if (loading) return <LoadingStatus message="Loading cohort analysis data..." />;
  
  const cohortData = data || [];
  
  return (
    <Card className="col-span-full">
      <CardHeader>
        <CardTitle>Device Cohort Analysis</CardTitle>
        <CardDescription>Compare journey stats by cohort</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <p className="text-sm mb-2">Cohort Field: <span className="font-medium">{cohortField}</span></p>
        </div>
        
        {cohortData.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border">
              <thead>
                <tr>
                  <th className="py-3 px-4 text-left text-sm font-medium">Cohort ({cohortField})</th>
                  <th className="py-3 px-4 text-left text-sm font-medium">Devices</th>
                  <th className="py-3 px-4 text-left text-sm font-medium">Avg Dwell (days)</th>
                  <th className="py-3 px-4 text-left text-sm font-medium">Anomaly Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {cohortData.map((cohort, index) => (
                  <tr key={index}>
                    <td className="py-2 px-4 text-sm">{cohort.name || "Unknown"}</td>
                    <td className="py-2 px-4 text-sm">{cohort.devices?.toLocaleString()}</td>
                    <td className="py-2 px-4 text-sm">{cohort.avgDwell?.toFixed(1)}</td>
                    <td className="py-2 px-4 text-sm">{(cohort.anomalyRate * 100)?.toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-center py-4">No cohort data available</p>
        )}
      </CardContent>
    </Card>
  );
};

// Bottleneck & Throughput Analysis component
const BottleneckAnalysis = ({ data, loading }: { data: any, loading: boolean }) => {
  if (loading) return <LoadingStatus message="Loading bottleneck analysis data..." />;
  
  if (!data) {
    return (
      <Card className="col-span-full">
        <CardHeader>
          <CardTitle>Bottleneck & Throughput</CardTitle>
          <CardDescription>No data available</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Bottleneck analysis could not be loaded</p>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className="col-span-full">
      <CardHeader>
        <CardTitle>Bottleneck & Throughput</CardTitle>
        <CardDescription>Stage with highest dwell time and device flow over time</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="p-6 flex flex-col justify-center items-center h-full">
          <p className="text-lg font-medium mb-4">Potential Bottleneck Stage: </p>
          <p className="text-xl font-bold">
            {data.stage || data.state || "Unknown"} 
            (Avg {data.avgDays || data.duration || 0} days)
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

// Journey funnel chart
const JourneyFunnel = ({ data, loading }: { data: any, loading: boolean }) => {
  if (loading) return <ChartSkeleton />;
  
  // Define interface for journey funnel items
  interface JourneyItem {
    name: string;
    value: number;
    count?: number;
    stage?: string;
    percentage?: number;
  }
  
  console.log("JourneyFunnel received data:", data);
  
  // Make sure we have data in the right format
  let chartData: JourneyItem[] = [];
  
  // Handle the case where data is directly an array
  if (Array.isArray(data)) {
    chartData = data.map((item: any) => ({
      name: item.name || item.stage || '',
      value: item.value || item.count || 0
    }));
  }
  // Handle the case where data is wrapped in a data property
  else if (data && data.data && Array.isArray(data.data)) {
    chartData = data.data.map((item: any) => ({
      name: item.name || item.stage || '',
      value: item.value || item.count || 0
    }));
  }
  // Handle other unexpected formats
  else {
    console.error("Unexpected journey funnel data format:", data);
    chartData = [];
  }
  
  // Defensive check
  if (chartData.length === 0) {
    return (
      <div className="flex justify-center items-center h-[300px]">
        <p className="text-muted-foreground">No journey funnel data available</p>
      </div>
    );
  }
  
  // Don't filter out zero values - we want to see all stages
  const validData = chartData.filter(item => 
    item && typeof item === 'object' && item.name
  );
  
  if (validData.length === 0) {
    return (
      <div className="flex justify-center items-center h-[300px]">
        <p className="text-muted-foreground">Invalid journey funnel data format</p>
      </div>
    );
  }
  
  console.log("JourneyFunnel processed data:", validData);
  
  return (
    <div className="h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={validData}
          layout="horizontal"
          margin={{ top: 20, right: 50, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="name" 
            tick={{ fontSize: 12 }}
            interval={0}
            angle={-45}
            textAnchor="end"
            height={80}
          />
          <YAxis />
          <Tooltip formatter={(value) => [Number(value).toLocaleString(), 'Devices']} />
          <Bar 
            dataKey="value" 
            fill="#6C5CE7"
            minPointSize={5} // Ensure all bars have at least minimal visibility
            label={({x, y, width, height, value}: {x: number, y: number, width: number, height: number, value: number}) => (
              <text 
                x={x + width / 2} 
                y={value > 0 ? y + height / 2 : y - 5}  // Position above the bar if value is 0
                fill={value > 0 ? "#fff" : "#666"}      // Dark text for zero values
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={11}
              >
                {value.toLocaleString()}
              </text>
            )}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

// Export all components
export {
  LoadingStatus,
  StatsCard,
  ActivityDistributionChart,
  StateDistributionChart,
  StateTransitionsChart,
  ActivityTimelineChart,
  StateDurationChart,
  ActivityFrequencyByStateChart,
  AnomalyStats,
  AdvancedMetricsCard,
  FirstLastStateCard,
  TopDevicesCard,
  TransitionsHeatmap,
  DeviceAnomaliesList,
  DailyActivityChart,
  StateTransitionHeatmap,
  DeviceCohortAnalysis,
  BottleneckAnalysis,
  JourneyFunnel
}; 