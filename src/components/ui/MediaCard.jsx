import React from 'react'
import { MoreVertical, Play, Image, Film } from 'lucide-react'
import clsx from 'clsx'

const TYPE_ICONS = {
  video: Film,
  image: Image,
}

export function MediaCard({
  thumbnail,
  title,
  type = 'video',
  duration,
  size: mediaSize,
  status = 'active',
  selected = false,
  onSelect,
  onMore,
  className,
}) {
  const statusColors = {
    active: 'bg-green-500',
    inactive: 'bg-slate-400',
    expired: 'bg-red-500',
  }

  const TypeIcon = TYPE_ICONS[type] || Film

  return (
    <div
      onClick={onSelect}
      className={clsx(
        'bg-white rounded-xl shadow-card border border-slate-100 overflow-hidden cursor-pointer group transition-all hover:shadow-card-md',
        selected && 'ring-2 ring-brand',
        className
      )}
    >
      {/* Thumbnail */}
      <div className="relative h-36 bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center overflow-hidden">
        {thumbnail ? (
          <img src={thumbnail} alt={title} className="w-full h-full object-cover" />
        ) : (
          <div className="flex flex-col items-center gap-1 text-slate-500">
            <TypeIcon size={28} />
          </div>
        )}
        {/* Duration badge */}
        {duration && (
          <div className="absolute bottom-2 right-2 bg-black/70 text-white text-[10px] font-medium px-1.5 py-0.5 rounded">
            {duration}
          </div>
        )}
        {/* Play overlay for videos */}
        {type === 'video' && (
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20">
            <div className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center">
              <Play size={16} className="text-slate-800 ml-0.5" fill="currentColor" />
            </div>
          </div>
        )}
        {/* More button */}
        {onMore && (
          <button
            onClick={(e) => { e.stopPropagation(); onMore() }}
            className="absolute top-2 right-2 p-1 bg-black/40 hover:bg-black/60 rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <MoreVertical size={13} className="text-white" />
          </button>
        )}
      </div>

      {/* Info */}
      <div className="p-3">
        <h4 className="text-xs font-semibold text-slate-900 truncate mb-1">{title}</h4>
        <p className="text-[11px] text-slate-400 mb-1.5">
          {type === 'video' ? 'Video' : 'Image'} · {mediaSize || duration}
        </p>
        <div className="flex items-center gap-1.5">
          <span className={clsx('w-1.5 h-1.5 rounded-full', statusColors[status])} />
          <span className="text-[11px] text-slate-500 capitalize">{status}</span>
        </div>
      </div>
    </div>
  )
}
