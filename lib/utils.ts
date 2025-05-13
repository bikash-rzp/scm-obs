import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Parse a timestamp string into a Date object
export function parseTimestamp(timestamp: string): Date {
  return new Date(timestamp)
}

// Format a date for display
export function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

// Format a datetime for display
export function formatDateTime(date: Date): string {
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
  })
}

// Calculate the days between two dates
export function daysBetween(start: Date, end: Date): number {
  const diffTime = Math.abs(end.getTime() - start.getTime())
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

// Get a formatted date string for n days ago
export function getDateNDaysAgo(days: number): string {
  const date = new Date()
  date.setDate(date.getDate() - days)
  return date.toISOString().split("T")[0]
}

// Add CSS variables for a tailwindcss animation
export const addAnimationToTailwindConfig = () => ({
  '@keyframes shimmer': {
    '0%': { backgroundPosition: '100% 0' },
    '100%': { backgroundPosition: '-100% 0' },
  },
  '.animate-shimmer': {
    animation: 'shimmer 2s infinite linear',
  },
})
