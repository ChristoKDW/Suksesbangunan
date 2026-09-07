import * as React from "react"
import { cn } from "@/lib/utils"

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "destructive" | "outline" | "success" | "warning"
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
        {
          "border-transparent bg-[var(--color-primary)] text-white": variant === "default",
          "border-transparent bg-[var(--bg-surface-raised)] text-[var(--text-primary)]": variant === "secondary",
          "border-transparent bg-[var(--color-danger)] text-white": variant === "destructive",
          "border-[var(--border-default)] text-[var(--text-primary)]": variant === "outline",
          "border-transparent bg-[var(--bg-success-subtle)] text-[var(--text-success)]": variant === "success",
          "border-transparent bg-[var(--bg-warning-subtle)] text-[var(--text-warning)]": variant === "warning",
        },
        className
      )}
      {...props}
    />
  )
}

export { Badge }
