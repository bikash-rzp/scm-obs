'use client';

import { useState, useMemo, Dispatch, SetStateAction } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Activity, AlertTriangle, MoreHorizontal, Package, Search, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, ArrowUpDown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { DeviceSummary } from '@/lib/types';
import Link from 'next/link';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

const ITEMS_PER_PAGE = 15;

// Define types for props
interface FiltersState {
    search: string;
    state: string;
    status: string;
    dateRange: { from: string; to: string };
    hidePurchaseOnly: boolean;
}

interface PaginationState {
    pageIndex: number;
    pageSize: number;
}

interface SortingState {
    id: string;
    desc: boolean;
}

interface DeviceTableProps {
  devices: DeviceSummary[];
  isLoading?: boolean;
  totalCount: number;
  pagination: PaginationState;
  setPagination: Dispatch<SetStateAction<PaginationState>>;
  filters: FiltersState;
  setFilters: Dispatch<SetStateAction<FiltersState>>;
  sorting: SortingState;
  setSorting: Dispatch<SetStateAction<SortingState>>;
}

export function DeviceTable({
    devices,
    isLoading = false,
    totalCount,
    pagination,
    setPagination,
    filters,
    setFilters,
    sorting,
    setSorting,
}: DeviceTableProps) {

  // Custom badge color mapping for device states
  const getStateBadgeClass = (state: string) => {
    switch (state) {
      case "PURCHASE_RECEIPT":
        return "bg-blue-100 text-blue-800 border border-blue-300";
      case "FSE_TO_HUB_INWARD":
        return "bg-orange-100 text-orange-800 border border-orange-300";
      case "HUB_TO_FSE_OUTWARD":
        return "bg-purple-100 text-purple-800 border border-purple-300";
      case "HUB_TO_FACTORY_OUTWARD":
        return "bg-red-100 text-red-800 border border-red-300";
      case "FACTORY_TO_HUB_INWARD":
        return "bg-teal-100 text-teal-800 border border-teal-300";
      case "CALL_CLOSED":
        return "bg-gray-200 text-gray-800 border border-gray-400";
      case "OUTWARD_MIS":
        return "bg-yellow-100 text-yellow-800 border border-yellow-300";
      case "MIS_INWARD":
        return "bg-cyan-100 text-cyan-800 border border-cyan-300";
      case "FACTORY_MASTER":
        return "bg-pink-100 text-pink-800 border border-pink-300";
      case "KIF_REPORT":
        return "bg-lime-100 text-lime-800 border border-lime-300";
      case "STOCK_REPORT":
        return "bg-indigo-100 text-indigo-800 border border-indigo-300";
      case "STOCK_TRANSFER":
        return "bg-green-100 text-green-800 border border-green-300";
      case "UNKNOWN":
        return "bg-gray-100 text-gray-600 border border-gray-300";
      default:
        return "bg-gray-100 text-gray-600 border border-gray-300";
    }
  };

  // Pagination calculations
  const totalPages = Math.ceil(totalCount / pagination.pageSize);

  const handlePageChange = (newPageIndex: number) => {
    setPagination(prev => ({ ...prev, pageIndex: newPageIndex }));
  };

  const handleSort = (columnId: string) => {
    setSorting(prev => ({
        id: columnId,
        desc: prev.id === columnId ? !prev.desc : true // Toggle direction or default to desc
    }));
    setPagination(prev => ({ ...prev, pageIndex: 0 })); // Reset to first page on sort
  };

  // Helper to format date string
  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return 'Invalid Date';
    }
  };

  // Get all unique states from ALL devices (might need API endpoint if too slow)
  // For now, assume `devices` prop might be used for initial state list
  // This part needs careful thought - ideally fetch states from API
  const allStates = useMemo(() => {
       // Ideally, fetch distinct states from API: GET /activity-types or similar
       // As a fallback, calculate from current page data (less accurate)
       const states = new Set(devices.map(d => d.current_state));
       return Array.from(states).sort();
  }, [devices]); // Re-calculate only if devices prop changes

  // Array for shimmer loading state
  const shimmerRows = Array.from({ length: 10 }, (_, i) => i);

  return (
    <div className="space-y-4">
      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-2 mb-2 p-4 border rounded-lg bg-card">
        {/* Search */}
        <div className="relative flex-grow sm:flex-grow-0">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search DSN..."
            value={filters.search}
            onChange={(e) => {
                setFilters(prev => ({ ...prev, search: e.target.value }));
                setPagination(prev => ({ ...prev, pageIndex: 0 })); // Reset page index on search
            }}
            className="pl-8 w-full sm:w-[200px]"
          />
        </div>
        {/* State Filter */}
        <Select value={filters.state} onValueChange={(value) => { setFilters(prev => ({ ...prev, state: value })); setPagination(prev => ({ ...prev, pageIndex: 0 })); }}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Filter by State" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All States</SelectItem>
            {allStates.map(state => (
              <SelectItem key={state} value={state}>{state}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {/* Status Filter */}
        <Select value={filters.status} onValueChange={(value) => { setFilters(prev => ({ ...prev, status: value })); setPagination(prev => ({ ...prev, pageIndex: 0 })); }}>
          <SelectTrigger className="w-full sm:w-[180px]">
             <SelectValue placeholder="Filter by Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Statuses</SelectItem>
            <SelectItem value="NORMAL">Normal</SelectItem>
            <SelectItem value="ANOMALY">Anomalies Detected</SelectItem>
          </SelectContent>
        </Select>
        {/* Date Range Filter */}
        <div className="flex items-center gap-1 flex-grow sm:flex-grow-0">
          <label className="text-xs text-muted-foreground whitespace-nowrap">Last Activity:</label>
          <Input
            type="date"
            value={filters.dateRange.from}
            onChange={e => { setFilters(prev => ({ ...prev, dateRange: { ...prev.dateRange, from: e.target.value } })); setPagination(prev => ({ ...prev, pageIndex: 0 }));}}
            className="w-full sm:w-[120px]"
            title="Start Date"
          />
          <span className="mx-1 text-xs">to</span>
          <Input
            type="date"
            value={filters.dateRange.to}
            onChange={e => { setFilters(prev => ({ ...prev, dateRange: { ...prev.dateRange, to: e.target.value } })); setPagination(prev => ({ ...prev, pageIndex: 0 }));}}
            className="w-full sm:w-[120px]"
            title="End Date"
          />
        </div>
         {/* Hide Purchase Only Toggle */}
         <div className="flex items-center space-x-2">
            <input 
                type="checkbox" 
                id="hide-purchase" 
                checked={filters.hidePurchaseOnly} 
                onChange={e => { setFilters(prev => ({ ...prev, hidePurchaseOnly: e.target.checked })); setPagination(prev => ({ ...prev, pageIndex: 0 }));}} 
            />
            <label htmlFor="hide-purchase" className="text-xs font-medium text-muted-foreground whitespace-nowrap">
                Hide Purchase Only
            </label>
        </div>
      </div>

      {/* Device Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead 
                 className="cursor-pointer hover:bg-muted" 
                 onClick={() => handleSort('dsn')}
              >
                 DSN {sorting.id === 'dsn' ? (sorting.desc ? '↓' : '↑') : <ArrowUpDown className="inline h-3 w-3 ml-1 opacity-50"/>}
              </TableHead>
              <TableHead>Current State</TableHead>
              <TableHead 
                 className="cursor-pointer hover:bg-muted" 
                 onClick={() => handleSort('last_activity_timestamp')}
              >
                 Last Activity {sorting.id === 'last_activity_timestamp' ? (sorting.desc ? '↓' : '↑') : <ArrowUpDown className="inline h-3 w-3 ml-1 opacity-50"/>}
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-muted text-center"
                onClick={() => handleSort('activity_count')}
              >
                Activities {sorting.id === 'activity_count' ? (sorting.desc ? '↓' : '↑') : <ArrowUpDown className="inline h-3 w-3 ml-1 opacity-50"/>}
              </TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              // Display shimmer loading placeholder instead of text
              shimmerRows.map((row) => (
                <TableRow key={row} className="animate-pulse">
                  <TableCell>
                    <div className="h-4 w-28 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:400%_100%] animate-shimmer rounded"></div>
                  </TableCell>
                  <TableCell>
                    <div className="h-6 w-24 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:400%_100%] animate-shimmer rounded-full"></div>
                  </TableCell>
                  <TableCell>
                    <div className="h-4 w-20 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:400%_100%] animate-shimmer rounded"></div>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="h-4 w-8 mx-auto bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:400%_100%] animate-shimmer rounded"></div>
                  </TableCell>
                  <TableCell>
                    <div className="h-5 w-16 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:400%_100%] animate-shimmer rounded"></div>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <div className="h-8 w-8 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:400%_100%] animate-shimmer rounded-full"></div>
                      <div className="h-8 w-8 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:400%_100%] animate-shimmer rounded-full"></div>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : devices.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="h-24 text-center">No devices match filters.</TableCell></TableRow>
            ) : (
              devices.map((device) => (
                <TableRow key={device.dsn}>
                  <TableCell className="font-medium font-mono text-xs">{device.dsn}</TableCell>
                  <TableCell>
                    <Badge className={cn("whitespace-nowrap", getStateBadgeClass(device.current_state))}>{device.display_state || device.current_state}</Badge>
                  </TableCell>
                  <TableCell className="text-xs">{formatDate(device.last_activity_timestamp)}</TableCell>
                  <TableCell className="text-xs text-center">{device.activity_count}</TableCell>
                  <TableCell>
                    {device.has_anomaly ? (
                      <Badge variant="destructive" className="text-xs whitespace-nowrap">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        Anomaly
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-xs whitespace-nowrap">Normal</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Link href={`/devices/${device.dsn}`} passHref>
                      <Button variant="ghost" size="sm" className="text-xs">
                        <Activity className="h-4 w-4 mr-1" />
                        Details
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Controls */}
      <div className="flex items-center justify-between pt-4">
        <div className="text-xs text-muted-foreground">
           Showing {devices.length === 0 ? 0 : pagination.pageIndex * pagination.pageSize + 1} to {Math.min((pagination.pageIndex + 1) * pagination.pageSize, totalCount)} of {totalCount} devices
        </div>
        <div className="flex items-center space-x-2">
            <span className="text-xs mr-2">Rows/page:</span>
            <Select 
                value={String(pagination.pageSize)}
                onValueChange={(value) => {
                    setPagination({ pageIndex: 0, pageSize: Number(value) });
                }}
            >
                <SelectTrigger className="w-[70px] h-8">
                    <SelectValue placeholder={String(pagination.pageSize)} />
                </SelectTrigger>
                <SelectContent>
                    {[10, 15, 25, 50, 100].map(size => (
                        <SelectItem key={size} value={String(size)}>{size}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
            <span className="text-sm text-muted-foreground mx-4">
                Page {pagination.pageIndex + 1} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => handlePageChange(0)}
              disabled={pagination.pageIndex === 0}
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => handlePageChange(pagination.pageIndex - 1)}
              disabled={pagination.pageIndex === 0}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => handlePageChange(pagination.pageIndex + 1)}
              disabled={pagination.pageIndex + 1 >= totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
             <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => handlePageChange(totalPages - 1)}
              disabled={pagination.pageIndex + 1 >= totalPages}
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
    </div>
  );
} 