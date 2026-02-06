import { cn } from "@/lib/utils";

export function Card({ className, ...props }) {
  return (
    <div
      className={cn(
        "rounded border border-border bg-card",
        className
      )}
      {...props}
    />
  );
}

export function CardHeader({ className, style, ...props }) {
  return (
    <div
      className={cn("flex items-center border-b border-border", className)}
      style={{ padding: "16px 24px 12px 24px", ...style }}
      {...props}
    />
  );
}

export function CardTitle({ className, ...props }) {
  return (
    <h3
      className={cn("text-[13px] font-semibold tracking-wide uppercase text-muted-foreground", className)}
      {...props}
    />
  );
}

export function CardContent({ className, style, ...props }) {
  return (
    <div
      className={cn("", className)}
      style={{ padding: "16px 24px 20px 24px", ...style }}
      {...props}
    />
  );
}
