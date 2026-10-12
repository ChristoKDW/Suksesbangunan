"use client"

import React from "react"
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react"

export interface PaginationProps {
  currentPage: number
  totalItems: number
  pageSize: number
  totalPages?: number
  onPageChange: (page: number) => void
  onPageSizeChange?: (pageSize: number) => void
  itemLabel?: string
  pageSizeOptions?: number[]
}

function getPageNumbers(current: number, total: number): (number | "...")[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1)
  }
  if (current <= 4) {
    return [1, 2, 3, 4, 5, "...", total]
  }
  if (current >= total - 3) {
    return [1, "...", total - 4, total - 3, total - 2, total - 1, total]
  }
  return [1, "...", current - 1, current, current + 1, "...", total]
}

export function Pagination({
  currentPage,
  totalItems,
  pageSize,
  totalPages: propTotalPages,
  onPageChange,
  onPageSizeChange,
  itemLabel = "data",
  pageSizeOptions = [10, 20, 50, 100],
}: PaginationProps) {
  const totalPages = propTotalPages ?? Math.max(1, Math.ceil(totalItems / pageSize))
  const startIndex = totalItems > 0 ? (currentPage - 1) * pageSize : 0
  const endIndex = Math.min(startIndex + pageSize, totalItems)

  return (
    <div className="flex flex-col gap-3 border-t border-[var(--border-default)] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
        <span>
          Menampilkan{" "}
          <strong className="text-[var(--text-primary)]">
            {totalItems > 0 ? startIndex + 1 : 0}
          </strong>
          {" - "}
          <strong className="text-[var(--text-primary)]">{endIndex}</strong> dari{" "}
          <strong className="text-[var(--text-primary)]">{totalItems}</strong> {itemLabel}
        </span>
        {onPageSizeChange && (
          <div className="flex items-center gap-1.5 ml-2">
            <span>Baris:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                onPageSizeChange(Number(e.target.value))
                onPageChange(1)
              }}
              className="rounded border border-[var(--border-default)] bg-[var(--bg-page)] px-2 py-1 text-xs text-[var(--text-primary)] outline-none focus:border-[var(--color-primary)] cursor-pointer"
            >
              {pageSizeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          title="Halaman Pertama"
          className="flex h-8 w-8 items-center justify-center rounded border border-[var(--border-default)] bg-[var(--bg-page)] text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-surface-raised)] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
        >
          <ChevronsLeft className="h-4 w-4" />
        </button>
        <button
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          title="Halaman Sebelumnya"
          className="flex h-8 w-8 items-center justify-center rounded border border-[var(--border-default)] bg-[var(--bg-page)] text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-surface-raised)] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-1 px-1">
          {getPageNumbers(currentPage, totalPages).map((p, idx) =>
            p === "..." ? (
              <span key={`dots-${idx}`} className="px-1 text-xs text-[var(--text-muted)]">
                ...
              </span>
            ) : (
              <button
                key={`page-${p}`}
                onClick={() => onPageChange(Number(p))}
                className={`flex h-8 min-w-[2rem] items-center justify-center rounded px-2 text-xs font-medium transition-colors cursor-pointer ${
                  currentPage === p
                    ? "bg-[var(--color-primary)] text-white shadow-sm"
                    : "border border-[var(--border-default)] bg-[var(--bg-page)] text-[var(--text-secondary)] hover:bg-[var(--bg-surface-raised)]"
                }`}
              >
                {p}
              </button>
            )
          )}
        </div>

        <button
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          title="Halaman Selanjutnya"
          className="flex h-8 w-8 items-center justify-center rounded border border-[var(--border-default)] bg-[var(--bg-page)] text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-surface-raised)] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
        <button
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
          title="Halaman Terakhir"
          className="flex h-8 w-8 items-center justify-center rounded border border-[var(--border-default)] bg-[var(--bg-page)] text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-surface-raised)] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
        >
          <ChevronsRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
