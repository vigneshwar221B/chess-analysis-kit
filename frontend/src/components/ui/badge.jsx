import { cn } from "@/lib/utils";
import { cva } from "class-variance-authority";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-sm text-[11px] font-medium",
  {
    variants: {
      variant: {
        default: "bg-accent/10 text-accent",
        success: "bg-success/10 text-success",
        danger: "bg-danger/10 text-danger",
        muted: "bg-muted text-muted-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export function Badge({ className, variant, style, ...props }) {
  return (
    <span
      className={cn(badgeVariants({ variant }), className)}
      style={{ padding: "4px 10px", ...style }}
      {...props}
    />
  );
}
