import * as React from "react"

import { cn } from "@/lib/utils"

const Badge = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    variant?: "default" | "secondary" | "destructive" | "outline"
  }
>(({ className, variant = "default", ...props }, ref) => (
  <div
    ref={ref}
    role="status"
    className={cn(
      "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
      variant === "default"
        ? "bg-primary/10 text-primary ring-offset-background"
        : variant === "secondary"
        ? "bg-secondary/10 text-secondary ring-offset-background"
        : variant === "destructive"
        ? "bg-destructive/10 text-destructive ring-offset-background"
        : variant === "outline" && "border border-input bg-background text-foreground",
      className
    )}
    {...props}
  />
))
Badge.displayName = "Badge"

export { Badge }
