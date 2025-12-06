import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";

const statCardVariants = cva(
  "relative overflow-hidden border-2 transition-all duration-300 hover-lift",
  {
    variants: {
      variant: {
        default: "bg-card border-border",
        success: "bg-success/10 border-success/20",
        warning: "bg-warning/10 border-warning/20",
        danger: "bg-destructive/10 border-destructive/20",
        info: "bg-info/10 border-info/20",
        primary: "bg-primary/10 border-primary/20",
        accent: "bg-accent/10 border-accent/20",
      },
      size: {
        sm: "p-3",
        md: "p-4",
        lg: "p-6",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  }
);

const trendColors = {
  up: "text-success",
  down: "text-destructive",
  neutral: "text-muted-foreground",
};

const TrendIcon = ({ trend }: { trend: "up" | "down" | "neutral" }) => {
  const icons = {
    up: TrendingUp,
    down: TrendingDown,
    neutral: Minus,
  };
  const Icon = icons[trend];
  return <Icon className={cn("w-4 h-4", trendColors[trend])} />;
};

interface StatCardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof statCardVariants> {
  value: string | number;
  label: string;
  change?: string;
  trend?: "up" | "down" | "neutral";
  icon?: React.ReactNode;
  description?: string;
}

const StatCard = React.forwardRef<HTMLDivElement, StatCardProps>(
  (
    {
      className,
      variant,
      size,
      value,
      label,
      change,
      trend,
      icon,
      description,
      ...props
    },
    ref
  ) => {
    return (
      <Card
        ref={ref}
        className={cn(statCardVariants({ variant, size, className }))}
        {...props}
      >
        <div className="flex items-start justify-between">
          <div className="space-y-1 flex-1">
            <p className="text-sm font-medium text-muted-foreground">{label}</p>
            <h3 className="text-2xl font-bold tracking-tight">{value}</h3>
            {(change || description) && (
              <div className="flex items-center gap-1.5 text-sm">
                {trend && <TrendIcon trend={trend} />}
                {change && (
                  <span className={cn(trend && trendColors[trend])}>
                    {change}
                  </span>
                )}
                {description && (
                  <span className="text-muted-foreground">{description}</span>
                )}
              </div>
            )}
          </div>
          {icon && (
            <div className="p-2.5 rounded-lg bg-background/50 border border-border/50">
              {icon}
            </div>
          )}
        </div>
      </Card>
    );
  }
);
StatCard.displayName = "StatCard";

export { StatCard, statCardVariants };
