import { cn } from "@/lib/utils";
import { cva } from "class-variance-authority";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-1.5 rounded text-[13px] font-medium transition-colors duration-150 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-40 cursor-pointer",
  {
    variants: {
      variant: {
        default: "bg-accent text-white hover:bg-accent/80",
        secondary: "bg-muted text-foreground/80 hover:text-foreground hover:bg-border border border-border",
        ghost: "text-muted-foreground hover:text-foreground hover:bg-muted",
        success: "bg-success/15 text-success border border-success/20 hover:bg-success/25",
      },
      size: {
        default: "h-8 px-3",
        sm: "h-7 px-2.5 text-xs",
        icon: "h-8 w-8",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export function Button({ className, variant, size, ...props }) {
  return (
    <button
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}
