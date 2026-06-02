import React from 'react'
import { Badge } from './Badge'
import { ArrowRight, MoreVertical } from 'lucide-react'
import clsx from 'clsx'

const INDEX_COLORS = [
  'bg-brand text-white',
  'bg-brand text-white',
  'bg-brand text-white',
  'bg-brand text-white',
  'bg-brand text-white',
  'bg-brand text-white',
  'bg-brand text-white',
  'bg-brand text-white',
]

export function DataCard({
  index,
  title,
  status,
  stats = [],
  startPoint,
  endPoint,
  onViewDetails,
  onMore,
  className,
}) {
  return (
    <div className={clsx(
      'bg-white rounded-xl shadow-card border border-slate-100 p-5 hover:shadow-card-md transition-shadow',
      className
    )}>
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2.5">
          {index != null && (
            <div className="w-6 h-6 rounded-full bg-brand text-white flex items-center justify-center text-xs font-semibold shrink-0">
              {index}
            </div>
          )}
          <h3 className="text-sm font-semibold text-slate-900 leading-tight">{title}</h3>
        </div>
        {onMore && (
          <button
            onClick={(e) => { e.stopPropagation(); onMore() }}
            className="p-1 hover:bg-slate-100 rounded-md transition-colors"
          >
            <MoreVertical size={14} className="text-slate-400" />
          </button>
        )}
      </div>

      {/* Status badge */}
      <div className="mb-3">
        <Badge status={status} />
      </div>

      {/* Stats row */}
      {stats.length > 0 && (
        <p className="text-xs text-slate-500 mb-3">
          {stats.join(' · ')}
        </p>
      )}

      {/* Start / End points */}
      {(startPoint || endPoint) && (
        <div className="space-y-1.5 mb-4">
          {startPoint && (
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500 shrink-0" />
              <span className="text-xs text-slate-600">{startPoint}</span>
            </div>
          )}
          {endPoint && (
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
              <span className="text-xs text-slate-600">{endPoint}</span>
            </div>
          )}
        </div>
      )}

      {/* View Details */}
      {onViewDetails && (
        <button
          onClick={onViewDetails}
          className="flex items-center gap-1 text-xs text-brand font-medium hover:underline"
        >
          View Details
          <ArrowRight size={12} />
        </button>
      )}
    </div>
  )
}
