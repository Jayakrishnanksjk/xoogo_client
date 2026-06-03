import Skeleton, { SkeletonTheme } from 'react-loading-skeleton'
import 'react-loading-skeleton/dist/skeleton.css'

// ─── Shared theme wrapper ──────────────────────────────────────────────────
export function AppSkeletonTheme({ children }) {
  return (
    <SkeletonTheme baseColor="#f1f5f9" highlightColor="#e2e8f0">
      {children}
    </SkeletonTheme>
  )
}

// ─── Stat Card Skeleton ────────────────────────────────────────────────────
export function StatCardSkeleton() {
  return (
    <AppSkeletonTheme>
      <div className="relative overflow-hidden rounded-2xl border border-slate-100 bg-white p-5 flex flex-col gap-3 shadow-[0_1px_4px_0_rgba(0,0,0,0.06)]">
        {/* Icon */}
        <div className="flex items-start justify-between">
          <Skeleton width={40} height={40} borderRadius={12} />
        </div>
        {/* Text block */}
        <div className="flex flex-col gap-2">
          <Skeleton width={72} height={10} borderRadius={6} />
          <Skeleton width={56} height={26} borderRadius={8} />
          <Skeleton width={100} height={10} borderRadius={6} />
        </div>
      </div>
    </AppSkeletonTheme>
  )
}

// ─── Dashboard Map Skeleton ────────────────────────────────────────────────
export function MapSkeleton() {
  return (
    <AppSkeletonTheme>
      <div className="flex-1 rounded-xl overflow-hidden border border-slate-100 min-h-[320px]">
        <Skeleton height="100%" width="100%" borderRadius={12} style={{ minHeight: 320, display: 'block' }} />
      </div>
    </AppSkeletonTheme>
  )
}

// ─── Alerts Panel Skeleton ─────────────────────────────────────────────────
export function AlertsPanelSkeleton() {
  return (
    <AppSkeletonTheme>
      <div className="flex flex-col gap-3 h-full">
        {/* Header */}
        <div className="flex items-center justify-between mb-1">
          <Skeleton width={100} height={14} borderRadius={6} />
          <Skeleton width={60} height={10} borderRadius={6} />
        </div>
        {/* Alert rows */}
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-start gap-3 p-3 rounded-xl border border-slate-100 bg-slate-50/50">
            <Skeleton circle width={32} height={32} />
            <div className="flex-1 flex flex-col gap-1.5">
              <Skeleton width="60%" height={11} borderRadius={6} />
              <Skeleton width="85%" height={10} borderRadius={6} />
              <Skeleton width="40%" height={9} borderRadius={6} />
            </div>
          </div>
        ))}
      </div>
    </AppSkeletonTheme>
  )
}

// ─── Group Card Skeleton ───────────────────────────────────────────────────
export function GroupCardSkeleton() {
  return (
    <AppSkeletonTheme>
      <div className="bg-white rounded-2xl border border-slate-100 p-5 flex flex-col gap-4 shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
        {/* Image area */}
        <Skeleton height={128} borderRadius={12} />
        {/* Text */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <Skeleton width={120} height={13} borderRadius={6} />
            <Skeleton width={44} height={16} borderRadius={20} />
          </div>
          <Skeleton width={80} height={10} borderRadius={6} />
          <div className="flex items-center gap-3 mt-1">
            <Skeleton width={60} height={10} borderRadius={6} />
            <Skeleton width={60} height={10} borderRadius={6} />
          </div>
        </div>
        {/* Buttons */}
        <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
          <Skeleton height={32} borderRadius={8} containerClassName="flex-1" />
          <Skeleton height={32} borderRadius={8} containerClassName="flex-1" />
        </div>
      </div>
    </AppSkeletonTheme>
  )
}

// ─── Route / DataCard Skeleton ─────────────────────────────────────────────
export function DataCardSkeleton() {
  return (
    <AppSkeletonTheme>
      <div className="bg-white rounded-2xl border border-slate-100 p-5 flex flex-col gap-3 shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
        <div className="flex items-center justify-between">
          <Skeleton width={100} height={13} borderRadius={6} />
          <Skeleton width={44} height={16} borderRadius={20} />
        </div>
        <Skeleton width="80%" height={10} borderRadius={6} />
        <div className="flex gap-2 mt-1">
          <Skeleton width={64} height={10} borderRadius={6} />
          <Skeleton width={64} height={10} borderRadius={6} />
        </div>
        <div className="pt-3 border-t border-slate-100">
          <Skeleton height={32} borderRadius={8} />
        </div>
      </div>
    </AppSkeletonTheme>
  )
}

// ─── Table Row Skeleton ────────────────────────────────────────────────────
export function TableRowSkeleton({ cols = 8 }) {
  return (
    <AppSkeletonTheme>
      <tr>
        {Array.from({ length: cols }).map((_, i) => (
          <td key={i} className="px-5 py-3.5">
            <Skeleton height={13} borderRadius={6} width={i === cols - 1 ? 60 : undefined} />
          </td>
        ))}
      </tr>
    </AppSkeletonTheme>
  )
}

// ─── Buses Stats Bar Skeleton ──────────────────────────────────────────────
export function BusesStatBarSkeleton() {
  return (
    <AppSkeletonTheme>
      <div className="grid grid-cols-3 gap-4 mb-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-white rounded-xl shadow-card border border-slate-100 p-4 flex items-center gap-4">
            <Skeleton width={40} height={40} borderRadius={12} />
            <div className="flex flex-col gap-1.5">
              <Skeleton width={72} height={10} borderRadius={6} />
              <Skeleton width={40} height={22} borderRadius={6} />
            </div>
          </div>
        ))}
      </div>
    </AppSkeletonTheme>
  )
}
