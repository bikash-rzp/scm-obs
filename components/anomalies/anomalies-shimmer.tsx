import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { ShimmerText } from "@/components/ui/shimmer";

export function AnomaliesShimmer() {
  // Create an array for shimmer anomaly cards
  const shimmerAnomalies = Array.from({ length: 5 }, (_, i) => i);

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="h-8 w-32 animate-pulse bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:400%_100%] animate-shimmer rounded"></div>
        <div className="h-5 w-36 animate-pulse bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:400%_100%] animate-shimmer rounded"></div>
      </div>

      <div className="grid gap-4">
        {shimmerAnomalies.map((index) => (
          <Card key={index}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="space-y-3 flex-grow">
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 rounded-full animate-pulse bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:400%_100%] animate-shimmer"></div>
                    <ShimmerText width="40%" className="h-5" />
                  </div>
                  <ShimmerText width="85%" className="h-4" />
                  <ShimmerText width="60%" className="h-3" />
                </div>
                <div className="h-9 w-24 ml-4 animate-pulse bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:400%_100%] animate-shimmer rounded-md"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
} 