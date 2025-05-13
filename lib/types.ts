// Device and Activity Types
export interface Activity {
  id: string;
  dsn: string;
  activity_type: string;
  timestamp: string;
  source: string;
  metadata: Record<string, any>;
}

export interface DeviceHistory {
  dsn: string;
  activities: Activity[];
}

// Define all possible inventory states based on the evaluation document
export enum InventoryState {
  // Main pipeline states (from numbered files)
  PURCHASE_RECEIPT = "PURCHASE_RECEIPT",
  MIS_INWARD = "MIS_INWARD",
  KIF_REPORT = "KIF_REPORT",
  FACTORY_MASTER = "FACTORY_MASTER",
  OUTWARD_MIS = "OUTWARD_MIS",
  STOCK_TRANSFER = "STOCK_TRANSFER",
  CALL_CLOSED = "CALL_CLOSED",
  
  // Detailed inventory states from Inventory Logs Evaluation
  NEW_INWARDED = "NEW_INWARDED",
  BANK_INWARDED = "BANK_INWARDED",
  NEED_PREPARATION = "NEED_PREPARATION",
  PREPARATION_IN_PROGRESS = "PREPARATION_IN_PROGRESS",
  PREPARED = "PREPARED",
  FACTORY_INWARDED = "FACTORY_INWARDED",
  DISPATCHED_TO_HUB = "DISPATCHED_TO_HUB",
  DISPATCHED_TO_ERC = "DISPATCHED_TO_ERC",
  RECEIVED_DAMAGED_FROM_HUB = "RECEIVED_DAMAGED_FROM_HUB",
  READY_TO_INSTALL = "READY_TO_INSTALL",
  HANDED_TO_FSE = "HANDED_TO_FSE",
  NEW_INSTALLED = "NEW_INSTALLED",
  REPLACEMENT_INSTALLED = "REPLACEMENT_INSTALLED",
  REPLACEMENT_PICKED = "REPLACEMENT_PICKED",
  DEINSTALLED = "DEINSTALLED",
  RETURNED_TO_HUB = "RETURNED_TO_HUB",
  RETURN_DISPATCHED = "RETURN_DISPATCHED",
  RETURN_INWARDED = "RETURN_INWARDED",
  SENT_FOR_REPAIR = "SENT_FOR_REPAIR",
  FAILED_REPAIR_INWARDED = "FAILED_REPAIR_INWARDED",
  REPAIRED = "REPAIRED",
  EXTERNAL_REPAIR = "EXTERNAL_REPAIR",
  UNKNOWN = "UNKNOWN"
}

// Operation types based on Inventory Logs Evaluation
export enum OperationType {
  RECEIVING = "RECEIVING",
  DISPATCH = "DISPATCH",
  INSTALLATION = "INSTALLATION",
  REPAIR = "REPAIR"
}

// Define inventory status based on state
export enum InventoryStatus {
  AVAILABLE = "AVAILABLE",
  UNAVAILABLE = "UNAVAILABLE"
}

// Add DeviceSummary for the paginated list
export interface DeviceSummary {
  dsn: string;
  current_state: string;
  display_state?: string;
  first_activity_timestamp?: string | null;
  last_activity_timestamp: string | null;
  activity_count: number;
  has_anomaly?: boolean;
  activity_types?: Record<string, number>;
  inventory_status?: InventoryStatus;
  location?: string;
  last_operation?: OperationType;
  bank?: string;
  model?: string;
  vendor?: string;
}

// Type definition for the paginated device list response
export interface PaginatedDevicesResponse {
  devices: DeviceSummary[];
  total_count: number;
  available_states?: string[];
}

// Type definition for a device activity
export interface DeviceActivity {
  id: string;
  dsn: string;
  activity_type: string;
  timestamp: string;
  source: string;
  metadata: Record<string, any>;
}

// Type definition for the device details response
export interface DeviceDetailsResponse {
  dsn: string;
  current_state: string;
  activities: DeviceActivity[];
}

// Type definition for state distribution chart data
export interface ChartDataPoint {
  name: string;
  value: number;
}

// Type definition for journey funnel response
export interface JourneyFunnelResponse {
  data: ChartDataPoint[];
}

// Anomaly Types
export interface Anomaly {
  type: string;
  description: string;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  current_state?: string;
  from_state?: string;
  to_state?: string;
  timestamp?: string;
  repair_count?: number;
  last_repair_time?: string;
  last_activity_time?: string;
}

export type AnomalyMap = Record<string, Anomaly[]>;

// Dashboard Metrics
export interface DeviceMetrics {
  total_devices: number;
  new_devices_last_30_days: number;
  active_devices_last_30_days: number;
  state_distribution: Record<string, number>;
}

export interface AnomalyMetrics {
  total_anomalies: number;
  high_severity: number;
  medium_severity: number;
  low_severity: number;
  by_type: Record<string, number>;
}

export interface ActivityMetrics {
  total_activities: number;
  activities_last_30_days: number;
  by_type: Record<string, number>;
}

export interface DashboardMetrics {
  device_metrics: DeviceMetrics;
  anomaly_metrics: AnomalyMetrics;
  activity_metrics: ActivityMetrics;
}

// Upload Response
export interface UploadResponse {
  filename: string;
  activities_added: number;
  devices_affected: number;
  new_devices: number;
  anomalies_detected: number;
}

export interface StateTransition {
  from_state: string;
  to_state: string;
  count: number;
}

export interface TransitionHeatmapCell {
  from: string;
  to: string;
  value: number;
}

export interface DwellTimeData {
  state: string;
  average_days: number;
  median_days: number;
  min_days: number;
  max_days: number;
  count: number;
} 