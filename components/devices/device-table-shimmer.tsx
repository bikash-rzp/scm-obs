import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ShimmerText } from "@/components/ui/shimmer";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

export function DeviceTableShimmer() {
  // Create an array for shimmer rows
  const shimmerRows = Array.from({ length: 10 }, (_, i) => i);

  return (
    <div className="space-y-4">
      {/* Filter Bar Shimmer */}
      <div className="flex flex-wrap items-center gap-2 mb-2 p-4 border rounded-lg bg-card">
        {/* Search Input Shimmer */}
        <div className="relative flex-grow sm:flex-grow-0">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground opacity-30" />
          <div className="w-full sm:w-[200px] h-10 animate-pulse bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:400%_100%] animate-shimmer rounded" />
        </div>
        
        {/* Filter Dropdown Shimmers */}
        <div className="w-full sm:w-[180px] h-10 animate-pulse bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:400%_100%] animate-shimmer rounded" />
        <div className="w-full sm:w-[180px] h-10 animate-pulse bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:400%_100%] animate-shimmer rounded" />
        
        {/* Date Range Shimmer */}
        <div className="flex items-center gap-1 flex-grow sm:flex-grow-0">
          <div className="w-[50px] h-4 animate-pulse bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:400%_100%] animate-shimmer rounded" />
          <div className="w-full sm:w-[120px] h-10 animate-pulse bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:400%_100%] animate-shimmer rounded" />
          <span className="mx-1 text-xs opacity-30">to</span>
          <div className="w-full sm:w-[120px] h-10 animate-pulse bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:400%_100%] animate-shimmer rounded" />
        </div>
        
        {/* Checkbox Shimmer */}
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 animate-pulse bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:400%_100%] animate-shimmer rounded" />
          <div className="w-[120px] h-4 animate-pulse bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:400%_100%] animate-shimmer rounded" />
        </div>
      </div>

      {/* Device Table Shimmer */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>DSN</TableHead>
              <TableHead>Current State</TableHead>
              <TableHead>Last Activity</TableHead>
              <TableHead className="text-center">Activities</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {shimmerRows.map((row) => (
              <TableRow key={row}>
                <TableCell>
                  <ShimmerText width="80%" className="h-4" />
                </TableCell>
                <TableCell>
                  <ShimmerText width="60%" className="h-6" />
                </TableCell>
                <TableCell>
                  <ShimmerText width="70%" className="h-4" />
                </TableCell>
                <TableCell className="text-center">
                  <ShimmerText width="40%" className="h-4 mx-auto" />
                </TableCell>
                <TableCell>
                  <ShimmerText width="50%" className="h-5" />
                </TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    <ShimmerText width="30px" className="h-8 rounded-full" />
                    <ShimmerText width="30px" className="h-8 rounded-full" />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      
      {/* Pagination Shimmer */}
      <div className="flex items-center justify-between pt-2">
        <ShimmerText width="120px" className="h-5" />
        <div className="flex items-center gap-1">
          {Array.from({ length: 4 }, (_, i) => (
            <ShimmerText key={i} width="35px" className="h-8 rounded" />
          ))}
        </div>
      </div>
    </div>
  );
} 