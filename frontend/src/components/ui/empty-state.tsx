import { type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
  variant?: "default" | "compact" | "chart" | "inline";
  className?: string;
}

const VARIANT_STYLES = {
  default: "py-12 px-4",
  compact: "py-8 px-4",
  chart: "flex items-center justify-center min-h-[300px] px-4",
  inline: "py-4 px-0",
};

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  variant = "default",
  className,
}: EmptyStateProps) {
  const isCentered = variant !== "inline";

  return (
    <div
      className={cn(
        "text-center",
        VARIANT_STYLES[variant],
        isCentered && "flex flex-col items-center justify-center",
        className
      )}
    >
      {Icon && (
        <div
          className={cn(
            "rounded-full bg-muted flex items-center justify-center text-muted-foreground mb-3",
            variant === "compact" || variant === "chart" ? "h-10 w-10" : "h-12 w-12"
          )}
        >
          <Icon
            className={variant === "inline" ? "h-4 w-4" : "h-6 w-6"}
            aria-hidden
          />
        </div>
      )}
      <p
        className={cn(
          "font-medium text-foreground",
          variant === "inline" ? "text-sm" : "text-base"
        )}
      >
        {title}
      </p>
      <p
        className={cn(
          "text-muted-foreground mt-1 max-w-sm",
          variant === "inline" ? "text-xs" : "text-sm"
        )}
      >
        {description}
      </p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
