"use client"

import { X, ArrowRight, ShieldCheck, History } from "lucide-react"

interface DiffViewerModalProps {
  isOpen: boolean
  onClose: () => void
  item: {
    idAudit: number
    action: string
    entityName: string
    entityId?: string
    namaUser?: string
    role: string
    createdAt: string
    ipAddress: string
    dataBefore?: Record<string, unknown> | null
    dataAfter?: Record<string, unknown> | null
  } | null
}

export function DiffViewerModal({ isOpen, onClose, item }: DiffViewerModalProps) {
  if (!isOpen || !item) return null

  const keys = Array.from(
    new Set([
      ...Object.keys(item.dataBefore || {}),
      ...Object.keys(item.dataAfter || {}),
    ])
  )

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-2xl bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-5 border-b border-[var(--border-default)] flex items-center justify-between bg-[var(--bg-surface-raised)]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-red-100 dark:bg-red-950/40 text-red-600 flex items-center justify-center">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[var(--text-primary)]">
                Inspeksi Forensik Mutasi #{item.idAudit}
              </h3>
              <p className="text-xs text-[var(--text-secondary)]">
                {item.action} pada {item.entityName} {item.entityId ? `(#${item.entityId})` : ""}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Metadata Banner */}
        <div className="px-5 py-3 bg-[var(--bg-page)] border-b border-[var(--border-default)] flex flex-wrap items-center gap-4 text-xs">
          <div>
            <span className="text-[var(--text-muted)]">Pelaku: </span>
            <span className="font-semibold text-[var(--text-primary)]">{item.namaUser || "Sistem"} ({item.role})</span>
          </div>
          <div>
            <span className="text-[var(--text-muted)]">IP Address: </span>
            <span className="font-mono text-gray-600 dark:text-gray-400">{item.ipAddress}</span>
          </div>
          <div>
            <span className="text-[var(--text-muted)]">Waktu (WITA): </span>
            <span className="font-medium text-[var(--text-primary)]">{item.createdAt}</span>
          </div>
        </div>

        {/* Diff Comparison Table */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          <div className="grid grid-cols-2 gap-3 text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
            <div className="p-2 bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 rounded-lg">
              State Sebelum (Before)
            </div>
            <div className="p-2 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 rounded-lg">
              State Sesudah (After)
            </div>
          </div>

          <div className="border border-[var(--border-default)] rounded-xl divide-y divide-[var(--border-default)] text-xs">
            {keys.length === 0 ? (
              <p className="p-4 text-center text-gray-400 italic">Tidak ada payload detail mutasi</p>
            ) : (
              keys.map((k) => {
                const valBefore = item.dataBefore ? String(item.dataBefore[k] ?? "-") : "-"
                const valAfter = item.dataAfter ? String(item.dataAfter[k] ?? "-") : "-"
                const isChanged = valBefore !== valAfter

                return (
                  <div key={k} className={`grid grid-cols-2 p-3 gap-3 transition ${isChanged ? "bg-amber-50/40 dark:bg-amber-950/10" : ""}`}>
                    <div>
                      <span className="font-mono font-bold text-[11px] text-[var(--text-secondary)] block mb-0.5">{k}:</span>
                      <span className={`font-mono ${isChanged ? "text-red-600 line-through" : "text-gray-500"}`}>
                        {valBefore}
                      </span>
                    </div>
                    <div>
                      <span className="font-mono font-bold text-[11px] text-[var(--text-secondary)] block mb-0.5">{k}:</span>
                      <span className={`font-mono font-bold ${isChanged ? "text-emerald-600" : "text-gray-700 dark:text-gray-300"}`}>
                        {valAfter}
                      </span>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[var(--border-default)] flex justify-end bg-[var(--bg-surface-raised)]">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 text-xs font-bold text-[var(--text-secondary)]"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  )
}
