import { ReactNode } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { LucideIcon } from "lucide-react";
import DOMPurify from "dompurify";

interface MarketingMessageProps {
  icon: LucideIcon;
  title?: string;
  message: string | ReactNode;
  variant?: "default" | "success" | "info" | "warning" | "primary";
  className?: string;
}

// Using semantic tokens instead of hardcoded colors
const variantStyles = {
  default: "bg-muted border-muted-foreground/20",
  success: "bg-primary/5 border-primary/30 [&>svg]:text-primary",
  info: "bg-accent/10 border-accent/30 [&>svg]:text-accent",
  warning: "bg-destructive/10 border-destructive/30 [&>svg]:text-destructive",
  primary: "bg-primary/10 border-primary [&>svg]:text-primary",
};

const titleStyles = {
  default: "text-foreground",
  success: "text-primary",
  info: "text-accent",
  warning: "text-destructive",
  primary: "text-primary",
};

const descriptionStyles = {
  default: "text-muted-foreground",
  success: "text-foreground/90",
  info: "text-foreground/90",
  warning: "text-foreground/90",
  primary: "text-foreground/90",
};

export function MarketingMessage({
  icon: Icon,
  title,
  message,
  variant = "default",
  className = "",
}: MarketingMessageProps) {
  return (
    <Alert className={`${variantStyles[variant]} ${className}`}>
      <Icon className="h-4 w-4" />
      {title && (
        <AlertTitle className={titleStyles[variant]}>{title}</AlertTitle>
      )}
      <AlertDescription className={descriptionStyles[variant]}>
        {typeof message === "string" ? (
          <span dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(message) }} />
        ) : (
          message
        )}
      </AlertDescription>
    </Alert>
  );
}

// Predefined variants for common cases
export function SuccessMessage({ icon, title, message, className }: Omit<MarketingMessageProps, "variant">) {
  return <MarketingMessage icon={icon} title={title} message={message} variant="success" className={className} />;
}

export function InfoMessage({ icon, title, message, className }: Omit<MarketingMessageProps, "variant">) {
  return <MarketingMessage icon={icon} title={title} message={message} variant="info" className={className} />;
}

export function WarningMessage({ icon, title, message, className }: Omit<MarketingMessageProps, "variant">) {
  return <MarketingMessage icon={icon} title={title} message={message} variant="warning" className={className} />;
}

export function PrimaryMessage({ icon, title, message, className }: Omit<MarketingMessageProps, "variant">) {
  return <MarketingMessage icon={icon} title={title} message={message} variant="primary" className={className} />;
}
