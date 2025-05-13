'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { getDeviceHistory } from '@/lib/api';
import { DeviceDetailShimmer } from '@/components/devices/device-detail-shimmer';

export default function DeviceDetail() {
  const params = useParams();
  const dsn = params?.dsn as string;
  const [deviceData, setDeviceData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDeviceData = async () => {
      try {
        setLoading(true);
        const data = await getDeviceHistory(dsn);
        setDeviceData(data);
        setError(null);
      } catch (err: any) {
        console.error('Failed to fetch device data:', err);
        setError(err.message || 'Failed to fetch device data');
      } finally {
        setLoading(false);
      }
    };

    if (dsn) {
      fetchDeviceData();
    }
  }, [dsn]);

  if (loading) {
    return <DeviceDetailShimmer />;
  }

  if (error) {
    return (
      <div className="py-6">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!deviceData) {
    return (
      <div className="py-6">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Device Not Found</AlertTitle>
          <AlertDescription>No data found for device {dsn}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <Card>
        <CardHeader>
          <CardTitle>Device Details</CardTitle>
          <CardDescription>DSN: {deviceData.dsn}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Activity History</h3>
            <div className="space-y-2">
              {deviceData.activities?.map((activity: any, index: number) => (
                <Card key={activity.id || index}>
                  <CardContent className="pt-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Activity Type</p>
                        <p className="text-sm">{activity.activity_type}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Timestamp</p>
                        <p className="text-sm">{new Date(activity.timestamp).toLocaleString()}</p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-sm font-medium text-muted-foreground">Source</p>
                        <p className="text-sm">{activity.source}</p>
                      </div>
                      {Object.entries(activity.metadata || {}).map(([key, value]) => (
                        <div key={key} className="col-span-2">
                          <p className="text-sm font-medium text-muted-foreground">{key}</p>
                          <p className="text-sm">{String(value)}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 