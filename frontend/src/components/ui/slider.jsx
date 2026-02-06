import { cn } from "@/lib/utils";

export function Slider({ className, min, max, value, onChange, ...props }) {
  return (
    <input
      type="range"
      min={min}
      max={max}
      value={value}
      onChange={onChange}
      className={cn(
        "w-full h-1.5 rounded-full appearance-none cursor-pointer",
        "bg-border accent-accent",
        "[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-accent",
        className
      )}
      {...props}
    />
  );
}
