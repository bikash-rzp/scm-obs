'use client';

import React from 'react';
import { cn } from '@/lib/utils';

// Reusable shimmer skeleton component for loading states
export const ShimmerSkeleton = ({ 
  className = "",
  style = {},
  children
}: { 
  className?: string,
  style?: React.CSSProperties,
  children?: React.ReactNode
}) => {
  return (
    <div 
      className={`animate-pulse bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 
      bg-[length:400%_100%] rounded ${className}`}
      style={{ 
        animation: "shimmer 1.5s infinite", 
        ...style
      }}
    >
      {children}
    </div>
  );
};

// Circle shimmer component for avatars and round elements
export const CircleShimmer = ({
  size = 40,
  className = ""
}: {
  size?: number,
  className?: string
}) => {
  return (
    <ShimmerSkeleton 
      className={`rounded-full ${className}`}
      style={{ width: size, height: size }}
    />
  );
};

// Text line shimmer for text placeholders
export const TextLineShimmer = ({
  width = "100%",
  height = 16,
  className = ""
}: {
  width?: string | number,
  height?: number,
  className?: string
}) => {
  const widthValue = typeof width === 'number' ? `${width}px` : width;
  
  return (
    <ShimmerSkeleton 
      className={`rounded ${className}`}
      style={{ width: widthValue, height }}
    />
  );
};

// Card content shimmer for card-like elements
export const CardShimmer = ({
  height = 100,
  className = ""
}: {
  height?: number,
  className?: string
}) => {
  return (
    <ShimmerSkeleton 
      className={`rounded-lg ${className}`}
      style={{ height }}
    />
  );
}; 

interface ShimmerProps {
  className?: string;
  width?: string | number;
  height?: string | number;
}

export function Shimmer({ className, width, height }: ShimmerProps) {
  return (
    <div 
      className={cn(
        "animate-pulse bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:400%_100%] animate-shimmer rounded",
        className
      )}
      style={{ 
        width: width || '100%', 
        height: height || '100%' 
      }}
    />
  );
}

export function ShimmerText({ className, width }: ShimmerProps) {
  return (
    <div 
      className={cn(
        "animate-pulse bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:400%_100%] animate-shimmer rounded h-4",
        className
      )}
      style={{ width: width || '100%' }}
    />
  );
}

export function ShimmerCard({ className }: { className?: string }) {
  return (
    <div className={cn("p-4 space-y-3", className)}>
      <ShimmerText width="40%" />
      <ShimmerText width="60%" className="h-3" />
      <div className="h-4" />
      <div className="space-y-2">
        <Shimmer height={200} />
      </div>
    </div>
  );
}

export function ShimmerStat() {
  return (
    <div className="flex flex-col p-4 border rounded-lg space-y-2">
      <ShimmerText width="60%" className="h-3" />
      <ShimmerText width="40%" className="h-6 mt-1" />
    </div>
  );
} 