'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';
import { getDeviceHistory, getDevices } from '@/lib/api';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { AnomaliesShimmer } from '@/components/anomalies/anomalies-shimmer';

interface Anomaly {
  deviceId: string;
  type: string;
  description: string;
  timestamp: string;
}

interface DeviceData {
  dsn: string;
  activities: Array<{
    activity_type: string;
    timestamp: string;
    metadata?: Record<string, any>;
  }>;
}

export default function AnomaliesPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // First, get the list of all devices
        const response = await getDevices();
        
        // Get the device data
        let devicesList: DeviceData[] = [];
        
        // Handle both possible response formats
        if (response && Array.isArray(response)) {
          // Direct array of devices
          devicesList = await Promise.all(
            response.map(async (device: any) => {
              try {
                const data = await getDeviceHistory(device.dsn);
                return data;
              } catch (error) {
                console.error(`Failed to fetch history for device ${device.dsn}:`, error);
                return { dsn: device.dsn, activities: [] };
              }
            })
          );
        } else if (response && response.devices && Array.isArray(response.devices)) {
          // Object with devices array
          devicesList = await Promise.all(
            response.devices.map(async (device: any) => {
              try {
                const data = await getDeviceHistory(device.dsn);
                return data;
              } catch (error) {
                console.error(`Failed to fetch history for device ${device.dsn}:`, error);
                return { dsn: device.dsn, activities: [] };
              }
            })
          );
        } else {
          throw new Error('Invalid data format received from API');
        }
        
        // Process devices to detect anomalies
        const detectedAnomalies: Anomaly[] = [];
        
        // Define valid state transitions based on CSV data
        const validTransitions: Record<string, string[]> = {
          // OEM -> Warehouse (Receiving)
          "PURCHASE_RECEIPT": ["MIS_INWARD", "OUTWARD_MIS", "KIF_REPORT"],
          
          // Hub -> Warehouse (Receiving)
          "MIS_INWARD": ["OUTWARD_MIS", "KIF_REPORT"],
          
          // Internal Repair Center -> Warehouse (Receiving)
          "IRC_TO_WH_INWARD": ["OUTWARD_MIS", "KIF_REPORT"],
          
          // Bank -> Warehouse (Receiving)
          "BANK_TO_WH_INWARD": ["OUTWARD_MIS", "KIF_REPORT"],
          
          // External Repair Center -> Warehouse (Receiving)
          "ERC_TO_WH_INWARD": ["OUTWARD_MIS", "KIF_REPORT"],
          
          // Factory -> Warehouse (Receiving)
          "FACTORY_TO_WH_INWARD": ["OUTWARD_MIS"],
          
          // Warehouse -> Hub (Dispatch)
          "OUTWARD_MIS": ["MIS_INWARD", "STOCK_TRANSFER", "CALL_CLOSED", "FACTORY_MASTER"],
          
          // Warehouse -> Merchant (Dispatch)
          "WH_TO_MERCHANT_DISPATCH": ["CALL_CLOSED"],
          
          // Warehouse -> External Repair Center (Dispatch)
          "WH_TO_ERC_DISPATCH": ["ERC_TO_WH_INWARD"],
          
          // Warehouse -> Sales Agent for Demo (Dispatch)
          "WH_TO_SD_DISPATCH": ["SD_TO_WH_INWARD"],
          
          // Warehouse -> Bank (Dispatch)
          "WH_TO_BANK_DISPATCH": ["BANK_TO_WH_INWARD"],
          
          // Warehouse -> Factory (Dispatch)
          "KIF_REPORT": ["FACTORY_MASTER"],
          
          // Factory -> Warehouse (Dispatch)
          "FACTORY_MASTER": ["IRC_TO_FACTORY_INWARD", "WH_TO_ERC_DISPATCH"],
          
          // Factory -> Internal Repair Center (Dispatch)
          "FACTORY_TO_IRC_DISPATCH": ["IRC_TO_FACTORY_INWARD", "IRC_TO_WH_INWARD"],
          
          // Hub -> Merchant (Dispatch)
          "STOCK_TRANSFER": ["CALL_CLOSED"],
          
          // Field Executive -> Merchant (Dispatch)
          "CALL_CLOSED": ["STOCK_TRANSFER", "MIS_INWARD"]
        };
        
        // Maximum allowable dwell time in days for each state
        const maxDwellTime: Record<string, number> = {
          "PURCHASE_RECEIPT": 7,   // OEM -> Warehouse
          "MIS_INWARD": 7,         // Hub -> Warehouse
          "KIF_REPORT": 10,        // Warehouse -> Factory
          "FACTORY_MASTER": 14,    // Factory processing time
          "OUTWARD_MIS": 3,        // Warehouse -> Hub
          "STOCK_TRANSFER": 5,     // Hub -> Field Executive/Merchant
          "CALL_CLOSED": 3,        // Field Executive -> Merchant
          "default": 7             // Default maximum dwell time
        };

        devicesList.forEach((device) => {
          if (!device || !device.activities || device.activities.length === 0) return;
          
          const sortedActivities = [...device.activities].sort((a, b) => 
            new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
          );

          // Check for invalid transitions
          for (let i = 1; i < sortedActivities.length; i++) {
            const fromState = sortedActivities[i-1].activity_type;
            const toState = sortedActivities[i].activity_type;
            
            // Skip if either state is unknown
            if (!fromState || !toState) continue;
            
            if (fromState in validTransitions && !validTransitions[fromState].includes(toState)) {
              detectedAnomalies.push({
                deviceId: device.dsn,
                type: 'Invalid State Transition',
                description: `Invalid transition from ${fromState} to ${toState}`,
                timestamp: sortedActivities[i].timestamp
              });
            }
          }

          // Check for excessive dwell time in a state
          for (let i = 0; i < sortedActivities.length - 1; i++) {
            const currentActivity = sortedActivities[i];
            const nextActivity = sortedActivities[i+1];
            const state = currentActivity.activity_type;
            
            if (!state) continue;
            
            // Calculate days between activities
            const start = new Date(currentActivity.timestamp);
            const end = new Date(nextActivity.timestamp);
            const dwellDays = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
            
            // Check if dwell time exceeds maximum allowed
            const maxDays = maxDwellTime[state] || maxDwellTime.default;
            if (dwellDays > maxDays) {
              detectedAnomalies.push({
                deviceId: device.dsn,
                type: 'Excessive Dwell Time',
                description: `Device stayed in ${state} state for ${Math.round(dwellDays)} days (max ${maxDays})`,
                timestamp: nextActivity.timestamp
              });
              break; // Only report first excessive dwell time to avoid overwhelming the user
            }
          }
          
          // Check for devices stuck in a state for too long (from last activity until now)
          if (sortedActivities.length > 0) {
            const lastActivity = sortedActivities[sortedActivities.length - 1];
            const lastState = lastActivity.activity_type;
            
            if (lastState) {
              const now = new Date();
              const lastActivityDate = new Date(lastActivity.timestamp);
              const daysSinceLastActivity = (now.getTime() - lastActivityDate.getTime()) / (1000 * 60 * 60 * 24);
              
              const maxDays = maxDwellTime[lastState] || maxDwellTime.default;
              if (daysSinceLastActivity > maxDays) {
                detectedAnomalies.push({
                  deviceId: device.dsn,
                  type: 'Stalled Device',
                  description: `Device stuck in ${lastState} state for ${Math.round(daysSinceLastActivity)} days`,
                  timestamp: lastActivity.timestamp
                });
              }
            }
          }
          
          // Check for devices that have been repaired multiple times
          const repairActivities = sortedActivities.filter(a => 
            a.activity_type === "WH_TO_ERC_DISPATCH" || 
            a.activity_type === "KIF_REPORT" || 
            a.activity_type === "FACTORY_TO_IRC_DISPATCH"
          );
          
          if (repairActivities.length >= 2) {
            detectedAnomalies.push({
              deviceId: device.dsn,
              type: 'Multiple Repairs',
              description: `Device has been sent for repair ${repairActivities.length} times`,
              timestamp: repairActivities[repairActivities.length - 1].timestamp
            });
          }
        });

        setAnomalies(detectedAnomalies);
        setError(null);
      } catch (err: any) {
        console.error('Error fetching data:', err);
        setError(err.message || 'Failed to fetch device data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return <AnomaliesShimmer />;
  }

  if (error) {
    return (
      <div className="p-4">
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle>Error</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Anomalies</h1>
        <div className="text-sm text-muted-foreground">
          {anomalies.length} anomalies detected
        </div>
      </div>

      <div className="grid gap-4">
        {anomalies.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-muted-foreground">No anomalies detected</p>
            </CardContent>
          </Card>
        ) : (
          anomalies.map((anomaly, index) => (
            <Card key={index} className="border-destructive">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-destructive" />
                      <h3 className="font-semibold">{anomaly.type}</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">{anomaly.description}</p>
                    <p className="text-xs text-muted-foreground">
                      Detected on {new Date(anomaly.timestamp).toLocaleString()}
                    </p>
                  </div>
                  <Link href={`/devices/${anomaly.deviceId}`}>
                    <Button variant="outline" size="sm">
                      View Device
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
} 