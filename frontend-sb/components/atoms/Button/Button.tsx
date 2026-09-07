import * as React from "react"
import { cn } from "@/lib/utils"

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
  size?: "default" | "sm" | "lg" | "icon"
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
          {
            "bg-[var(--color-primary)] text-[var(--color-primary-foreground)] hover:bg-[var(--color-primary-hover)]": variant === "default",
            "bg-[var(--color-danger)] text-white hover:bg-[var(--color-danger)]/90": variant === "destructive",
            "border border-[var(--border-default)] bg-transparent hover:bg-[var(--bg-surface-raised)] text-[var(--text-primary)]": variant === "outline",
            "bg-[var(--bg-surface-raised)] text-[var(--text-primary)] hover:bg-[var(--border-default)]": variant === "secondary",
            "hover:bg-[var(--bg-surface-raised)] hover:text-[var(--text-primary)]": variant === "ghost",
            "text-[var(--color-primary)] underline-offset-4 hover:underline": variant === "link",
            "h-10 px-4 py-2": size === "default",
            "h-9 rounded-md px-3": size === "sm",
            "h-11 rounded-md px-8": size === "lg",
            "h-10 w-10": size === "icon",
          },
          className
        )}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button }
