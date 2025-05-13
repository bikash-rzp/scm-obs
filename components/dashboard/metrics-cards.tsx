import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DashboardMetrics } from '@/lib/types';
import { Package, AlertTriangle, Activity, TrendingUp } from 'lucide-react';

interface MetricsCardsProps {
  metrics: DashboardMetrics;
}

export function MetricsCards({ metrics }: MetricsCardsProps) {
  const { device_metrics, anomaly_metrics, activity_metrics } = metrics;
  
  const cards = [
    {
      title: 'Total Devices',
      value: device_metrics.total_devices,
      description: `${device_metrics.new_devices_last_30_days} new in last 30 days`,
      icon: Package,
      color: 'text-blue-500',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'Total Activities',
      value: activity_metrics.total_activities,
      description: `${activity_metrics.activities_last_30_days} in last 30 days`,
      icon: Activity,
      color: 'text-green-500',
      bgColor: 'bg-green-50'
    },
    {
      title: 'Active Devices',
      value: device_metrics.active_devices_last_30_days,
      description: `Devices with activity in last 30 days`,
      icon: TrendingUp,
      color: 'text-purple-500',
      bgColor: 'bg-purple-50'
    },
    {
      title: 'Anomalies',
      value: anomaly_metrics.total_anomalies,
      description: `${anomaly_metrics.high_severity} high severity`,
      icon: AlertTriangle,
      color: 'text-red-500',
      bgColor: 'bg-red-50'
    }
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card, index) => {
        const Icon = card.icon;
        return (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
              <div className={`${card.bgColor} p-2 rounded-full`}>
                <Icon className={`h-4 w-4 ${card.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground pt-1">
                {card.description}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
} 