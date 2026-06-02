import { useState } from 'react'
import AppLayout from '@/components/layout/AppLayout'
import { Button, Select, MediaCard, AnalyticsPanel, Pagination, SearchInput } from '@/components/ui'
import { Upload, FolderPlus, LayoutGrid, List, SlidersHorizontal } from 'lucide-react'
import clsx from 'clsx'

const MOCK_MEDIA = [
  { id: 1, title: 'Lulu Big Sale Offer', type: 'video', duration: '20s', size: '20s', status: 'active', category: 'Offers', resolution: '1920x1080', uploadDate: 'Apr 20, 2026', author: 'Akhil Pavithran', totalPlays: '12,450', totalImpressions: '15,230', completionRate: '90.2%', uniqueDevices: '18', playlistCount: 12, screenCount: 18, deviceCount: 18 },
  { id: 2, title: 'Beauty Cream Ad', type: 'video', duration: '20s', size: '20s', status: 'active', category: 'Ads' },
  { id: 3, title: 'Visit Kannur', type: 'image', duration: '15s', size: '15s', status: 'active', category: 'Tourism' },
  { id: 4, title: 'Local Store Promo', type: 'video', duration: '20s', size: '20s', status: 'active', category: 'Local' },
  { id: 5, title: 'Mobile Offer', type: 'image', duration: '11s', size: '11s', status: 'active', category: 'Offers' },
  { id: 6, title: 'Travel Kerala', type: 'image', duration: '10s', size: '10s', status: 'expired', category: 'Tourism' },
  { id: 7, title: 'Onam Offer', type: 'video', duration: '25s', size: '25s', status: 'active', category: 'Offers' },
  { id: 8, title: 'Safety First', type: 'image', duration: '11s', size: '11s', status: 'active', category: 'PSA' },
  { id: 9, title: 'Ice Cream Ad', type: 'video', duration: '20s', size: '20s', status: 'active', category: 'Ads' },
]

export default function MediaLibraryPage() {
  const [selectedMedia, setSelectedMedia] = useState(null)
  const [viewMode, setViewMode] = useState('grid')
  const [currentPage, setCurrentPage] = useState(1)
  const [detailTab, setDetailTab] = useState('analytics')
  const [typeFilter, setTypeFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  const filteredMedia = MOCK_MEDIA.filter(m => {
    if (typeFilter && m.type !== typeFilter) return false
    if (statusFilter && m.status !== statusFilter) return false
    return true
  })

  return (
    <AppLayout title="Media Library" subtitle="Upload, manage and analyze your media files">
      <div className="p-6 max-w-screen-2xl">
        {/* Top action bar */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Button startIcon={Upload} label="Upload Media" />
            <Button variant="secondary" startIcon={FolderPlus} label="New Folder" />
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode('grid')}
              className={clsx(
                'p-2 rounded-lg border transition-colors',
                viewMode === 'grid'
                  ? 'bg-brand text-white border-brand'
                  : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
              )}
            >
              <LayoutGrid size={14} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={clsx(
                'p-2 rounded-lg border transition-colors',
                viewMode === 'list'
                  ? 'bg-brand text-white border-brand'
                  : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
              )}
            >
              <List size={14} />
            </button>
          </div>
        </div>

        {/* Filters row */}
        <div className="flex items-center gap-2 mb-4">
          <Select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
            className="w-32 py-1.5 text-xs"
          >
            <option value="">All Types</option>
            <option value="video">Video</option>
            <option value="image">Image</option>
          </Select>
          <Select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="w-32 py-1.5 text-xs"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="expired">Expired</option>
          </Select>
          <Select className="w-32 py-1.5 text-xs">
            <option value="">All Folders</option>
          </Select>
          <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-600 border border-slate-200 rounded-lg bg-white hover:bg-slate-50 transition-colors">
            <SlidersHorizontal size={12} />
            Filters
          </button>
        </div>

        {/* Total count */}
        <p className="text-xs text-slate-500 mb-4">Total {filteredMedia.length} media files</p>

        {/* Main content: Grid + Detail Panel */}
        <div className="flex gap-5">
          {/* Media grid */}
          <div className={clsx('transition-all', selectedMedia ? 'w-1/2' : 'w-full')}>
            <div className={clsx(
              'grid gap-4',
              selectedMedia ? 'grid-cols-2' : 'grid-cols-2 md:grid-cols-3 xl:grid-cols-4'
            )}>
              {filteredMedia.map(media => (
                <MediaCard
                  key={media.id}
                  title={media.title}
                  type={media.type}
                  duration={media.duration}
                  mediaSize={media.size}
                  status={media.status}
                  selected={selectedMedia?.id === media.id}
                  onSelect={() => setSelectedMedia(media)}
                  onMore={() => {}}
                />
              ))}
            </div>

            {/* Pagination */}
            <div className="mt-6">
              <Pagination
                currentPage={currentPage}
                totalPages={3}
                onPageChange={setCurrentPage}
                totalItems={24}
                itemsPerPage={9}
              />
            </div>
          </div>

          {/* Detail / Analytics panel */}
          {selectedMedia && (
            <div className="w-1/2">
              <AnalyticsPanel
                media={selectedMedia}
                onClose={() => setSelectedMedia(null)}
                activeTab={detailTab}
                onTabChange={setDetailTab}
              />
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  )
}
