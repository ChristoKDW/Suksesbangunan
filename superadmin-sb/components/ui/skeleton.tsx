import { cn } from "@/lib/utils"

export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-xl bg-gray-200/80 dark:bg-gray-800/80",
        className
      )}
      {...props}
    />
  )
}

export function SkeletonCard() {
  return (
    <div className="p-5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-default)] shadow-sm space-y-3">
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-8 w-8 rounded-xl" />
      </div>
      <Skeleton className="h-7 w-40" />
      <Skeleton className="h-3 w-48" />
    </div>
  )
}

export function SkeletonTable({ rows = 4 }: { rows?: number }) {
  return (
    <div className="border border-[var(--border-default)] rounded-xl overflow-hidden p-4 space-y-3">
      <div className="flex justify-between items-center pb-3 border-b border-[var(--border-default)]">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-4 w-20" />
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center justify-between gap-4 py-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-6 w-20 rounded-full" />
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-4 w-12" />
        </div>
      ))}
    </div>
  )
}
