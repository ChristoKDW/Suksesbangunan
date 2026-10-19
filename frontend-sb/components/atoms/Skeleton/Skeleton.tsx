import * as React from "react"
import { cn } from "@/lib/utils"

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-slate-200 dark:bg-white/10",
        className
      )}
      {...props}
    />
  )
}

export function TableRowSkeleton({
  columns = 4,
  rows = 5,
  className = "",
}: {
  columns?: number
  rows?: number
  className?: string
}) {
  return (
    <>
      {Array.from({ length: rows }).map((_, rIdx) => (
        <tr
          key={rIdx}
          className="border-b border-[var(--border-default)] transition-colors"
        >
          {Array.from({ length: columns }).map((_, cIdx) => (
            <td key={cIdx} className={cn("px-4 py-3.5", className)}>
              <Skeleton
                className={cn(
                  "h-4",
                  cIdx === 0
                    ? "w-32 sm:w-44"
                    : cIdx === columns - 1
                    ? "w-16 ml-auto"
                    : "w-24 sm:w-28"
                )}
              />
            </td>
          ))}
        </tr>
      ))}
    </>
  )
}

export function StatCardSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className={cn("grid gap-4", count === 3 ? "grid-cols-1 sm:grid-cols-3" : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4")}>
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={idx}
          className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-5 shadow-xs space-y-3"
        >
          <div className="flex items-center justify-between">
            <Skeleton className="h-3.5 w-24" />
            <Skeleton className="h-8 w-8 rounded-lg" />
          </div>
          <Skeleton className="h-7 w-20" />
        </div>
      ))}
    </div>
  )
}
