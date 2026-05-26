import React from 'react'
import { X, Play, Eye, TrendingUp, Monitor, ExternalLink } from 'lucide-react'
import { Tabs } from './Tabs'
import { Badge } from './Badge'
import clsx from 'clsx'

export function AnalyticsPanel({ media, onClose, activeTab, onTabChange }) {
  if (!media) return null

  const stats = [
    { icon: Play, label: 'Total Plays', value: media.totalPlays || '12,450', bg: 'bg-blue-50', color: 'text-blue-500' },
    { icon: Eye, label: 'Total Impressions', value: media.totalImpressions || '15,230', bg: 'bg-purple-50', color: 'text-purple-500' },
    { icon: TrendingUp, label: 'Avg. Completion Rate', value: media.completionRate || '90.2%', bg: 'bg-green-50', color: 'text-green-500' },
    { icon: Monitor, label: 'Unique Devices', value: media.uniqueDevices || '18', bg: 'bg-slate-50', color: 'text-slate-500' },
  ]

  const devices = [
    { name: 'Android TV', pct: 55.6, count: 10, color: 'bg-brand' },
    { name: 'Xoogo Player', pct: 27.8, count: 5, color: 'bg-green-500' },
    { name: 'Firestick', pct: 11.1, count: 2, color: 'bg-amber-500' },
    { name: 'Other', pct: 5.6, count: 1, color: 'bg-slate-400' },
  ]

  const playStatus = [
    { name: 'Completed', value: '9,820 (78.9%)', color: 'bg-green-500' },
    { name: 'Partially Played', value: '2,120 (17.0%)', color: 'bg-amber-500' },
    { name: 'Skipped', value: '510 (4.1%)', color: 'bg-red-500' },
  ]

  return (
    <div className="bg-white rounded-xl shadow-card border border-slate-100 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-slate-100">
        <div className="flex items-start justify-between mb-3">
          <div className="flex gap-3">
            {/* Preview thumbnail */}
            <div className="w-24 h-16 rounded-lg bg-gradient-to-br from-slate-800 to-slate-900 overflow-hidden shrink-0">
              {media.thumbnail ? (
                <img src={media.thumbnail} alt={media.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Play size={16} className="text-slate-500" />
                </div>
              )}
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-1.5">
                {media.title}
                <button className="text-slate-400 hover:text-slate-600">
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M8.5 1.5l2 2M1 11l.5-2L9 1.5l2 2L3.5 11 1 11z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </button>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {media.type === 'video' ? 'Video' : 'Image'} · {media.duration} · {media.resolution || '1920x1080'}
                <Badge status={media.status} />
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {media.category && <span className="mr-2">☐ {media.category}</span>}
                Uploaded on {media.uploadDate || 'Apr 20, 2026'} · By {media.author || 'Akhil Pavithran'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 transition-colors">
            <X size={16} />
          </button>
        </div>

        <Tabs
          variant="underline"
          tabs={[
            { value: 'overview', label: 'Overview' },
            { value: 'analytics', label: 'Analytics' },
            { value: 'devices', label: 'Playback Devices' },
            { value: 'details', label: 'Details' },
          ]}
          active={activeTab || 'analytics'}
          onChange={onTabChange}
        />
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-4 gap-3 p-4 border-b border-slate-100">
        {stats.map(s => (
          <div key={s.label} className="text-center">
            <p className="text-[11px] text-slate-400 mb-1">{s.label}</p>
            <p className="text-lg font-semibold text-slate-900">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Plays Over Time chart placeholder */}
      <div className="p-4 border-b border-slate-100">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-xs font-semibold text-slate-700">Plays Over Time</h4>
          <select className="text-xs text-slate-500 border border-slate-200 rounded-md px-2 py-1 bg-white">
            <option>Last 7 Days</option>
            <option>Last 30 Days</option>
          </select>
        </div>
        <div className="h-32 bg-slate-50 rounded-lg flex items-center justify-center">
          {/* Chart placeholder - connect charting library */}
          <div className="flex flex-col items-center gap-1">
            <svg width="120" height="60" viewBox="0 0 120 60" className="text-brand">
              <polyline
                points="0,50 20,45 40,48 60,30 80,35 100,15 120,20"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {[
                [0,50],[20,45],[40,48],[60,30],[80,35],[100,15],[120,20]
              ].map(([x,y], i) => (
                <circle key={i} cx={x} cy={y} r="3" fill="currentColor" />
              ))}
            </svg>
            <p className="text-[10px] text-slate-400">Chart data</p>
          </div>
        </div>
      </div>

      {/* Bottom: Devices + Play Status */}
      <div className="grid grid-cols-2 gap-0 divide-x divide-slate-100">
        {/* Top Devices */}
        <div className="p-4">
          <h4 className="text-xs font-semibold text-slate-700 mb-3">Top Devices</h4>
          <div className="flex items-center gap-3 mb-3">
            {/* Donut placeholder */}
            <div className="w-16 h-16 rounded-full border-4 border-brand flex items-center justify-center shrink-0">
              <div className="text-center">
                <p className="text-sm font-semibold text-slate-900">{media.deviceCount || 18}</p>
                <p className="text-[9px] text-slate-400">Devices</p>
              </div>
            </div>
            <div className="space-y-1.5 flex-1">
              {devices.map(d => (
                <div key={d.name} className="flex items-center gap-1.5">
                  <span className={clsx('w-2 h-2 rounded-full shrink-0', d.color)} />
                  <span className="text-[11px] text-slate-600 flex-1">{d.name}</span>
                  <span className="text-[11px] text-slate-400">{d.pct}% ({d.count})</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Plays by Status */}
        <div className="p-4">
          <h4 className="text-xs font-semibold text-slate-700 mb-3">Plays by Status</h4>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-16 h-16 rounded-full border-4 border-green-500 flex items-center justify-center shrink-0">
              <div className="text-center">
                <p className="text-sm font-semibold text-slate-900">12,450</p>
                <p className="text-[9px] text-slate-400">Total Plays</p>
              </div>
            </div>
            <div className="space-y-1.5 flex-1">
              {playStatus.map(p => (
                <div key={p.name} className="flex items-center gap-1.5">
                  <span className={clsx('w-2 h-2 rounded-full shrink-0', p.color)} />
                  <span className="text-[11px] text-slate-600 flex-1">{p.name}</span>
                  <span className="text-[11px] text-slate-400">{p.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 py-3 bg-blue-50/50 border-t border-slate-100 flex items-center justify-between">
        <p className="text-xs text-slate-500 flex items-center gap-1.5">
          <span className="w-4 h-4 rounded-full bg-blue-100 flex items-center justify-center">
            <svg width="8" height="8" viewBox="0 0 8 8" className="text-blue-500"><circle cx="4" cy="4" r="3" fill="currentColor"/></svg>
          </span>
          This media is used in {media.playlistCount || 12} playlists and playing on {media.screenCount || 18} screens.
        </p>
        <button className="text-xs text-brand font-medium hover:underline flex items-center gap-1">
          View Playlists & Screens
          <ExternalLink size={11} />
        </button>
      </div>
    </div>
  )
}
