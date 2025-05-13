import { Loader2, AlertCircle, Server } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "./ui/alert"
import { Button } from "./ui/button"

interface FallbackStateProps {
  isLoading: boolean
  hasError: boolean
  errorMessage?: string
  isEmpty?: boolean
  emptyMessage?: string
  onRetry?: () => void
  children: React.ReactNode
}

export function FallbackState({
  isLoading,
  hasError,
  errorMessage = "An error occurred while loading data.",
  isEmpty = false,
  emptyMessage = "No data available.",
  onRetry,
  children
}: FallbackStateProps) {
  // First check for loading state
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-48 space-y-4 text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin" />
        <p>Loading data, please wait...</p>
      </div>
    )
  }
  
  // Next check for error state
  if (hasError) {
    return (
      <Alert variant="destructive" className="mb-4">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription className="flex flex-col gap-2">
          <p>{errorMessage}</p>
          {onRetry && (
            <Button 
              variant="outline" 
              className="w-fit mt-2 border-destructive hover:bg-destructive/10" 
              size="sm"
              onClick={onRetry}
            >
              Try Again
            </Button>
          )}
        </AlertDescription>
      </Alert>
    )
  }
  
  // Check for empty state
  if (isEmpty) {
    return (
      <div className="flex flex-col items-center justify-center h-48 space-y-4 text-muted-foreground border rounded-lg p-4">
        <Server className="h-8 w-8" />
        <p>{emptyMessage}</p>
        {onRetry && (
          <Button 
            variant="outline" 
            size="sm"
            onClick={onRetry}
          >
            Refresh Data
          </Button>
        )}
      </div>
    )
  }
  
  // Default case: render children
  return <>{children}</>
} 