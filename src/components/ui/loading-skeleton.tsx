import { cn } from "@/lib/utils";

/**
 * Unified loading skeleton component
 * Provides consistent loading states across the app
 */

export const LoadingSkeleton = ({ 
  className 
}: { 
  className?: string 
}) => (
  <div className={cn("animate-pulse space-y-4", className)}>
    <div className="h-4 bg-muted rounded w-3/4" />
    <div className="h-4 bg-muted rounded w-1/2" />
    <div className="h-4 bg-muted rounded w-5/6" />
  </div>
);

export const LoadingCard = () => (
  <div className="animate-pulse space-y-4 p-6 border rounded-lg">
    <div className="h-6 bg-muted rounded w-1/3" />
    <div className="space-y-2">
      <div className="h-4 bg-muted rounded w-full" />
      <div className="h-4 bg-muted rounded w-5/6" />
      <div className="h-4 bg-muted rounded w-4/6" />
    </div>
  </div>
);

export const LoadingTable = ({ rows = 5 }: { rows?: number }) => (
  <div className="space-y-3">
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="animate-pulse flex items-center gap-4 p-4 border rounded-lg">
        <div className="h-10 w-10 bg-muted rounded-full" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-muted rounded w-1/4" />
          <div className="h-3 bg-muted rounded w-1/2" />
        </div>
        <div className="h-8 w-20 bg-muted rounded" />
      </div>
    ))}
  </div>
);

export const LoadingSpinner = ({ size = "default" }: { size?: "sm" | "default" | "lg" }) => {
  const sizeClasses = {
    sm: "h-4 w-4",
    default: "h-8 w-8",
    lg: "h-12 w-12"
  };

  return (
    <div className="flex items-center justify-center p-8">
      <div className={cn(
        "animate-spin rounded-full border-4 border-muted border-t-primary",
        sizeClasses[size]
      )} />
    </div>
  );
};
