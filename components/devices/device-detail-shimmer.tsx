import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ShimmerText } from "@/components/ui/shimmer";

export function DeviceDetailShimmer() {
  // Create an array for shimmer activity cards
  const shimmerActivities = Array.from({ length: 5 }, (_, i) => i);

  return (
    <div className="container mx-auto py-6">
      <Card>
        <CardHeader>
          <div className="h-7 w-40 animate-pulse bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:400%_100%] animate-shimmer rounded"></div>
          <div className="h-5 w-60 animate-pulse bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:400%_100%] animate-shimmer rounded"></div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="h-6 w-48 animate-pulse bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:400%_100%] animate-shimmer rounded"></div>
            <div className="space-y-4">
              {shimmerActivities.map((index) => (
                <Card key={index}>
                  <CardContent className="pt-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <ShimmerText width="80%" className="h-4 mb-2" />
                        <ShimmerText width="60%" className="h-5" />
                      </div>
                      <div>
                        <ShimmerText width="80%" className="h-4 mb-2" />
                        <ShimmerText width="70%" className="h-5" />
                      </div>
                      <div className="col-span-2">
                        <ShimmerText width="80%" className="h-4 mb-2" />
                        <ShimmerText width="90%" className="h-5" />
                      </div>
                      <div className="col-span-2">
                        <ShimmerText width="80%" className="h-4 mb-2" />
                        <ShimmerText width="100%" className="h-5" />
                      </div>
                      <div className="col-span-2">
                        <ShimmerText width="80%" className="h-4 mb-2" />
                        <ShimmerText width="85%" className="h-5" />
                      </div>
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