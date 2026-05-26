import AppLayout from '@/components/layout/AppLayout'
import { EmptyState, Button } from '@/components/ui'
import { ListMusic, Plus } from 'lucide-react'

export default function PlaylistsPage() {
  return (
    <AppLayout title="Playlists" subtitle="Create and manage your media playlists">
      <div className="p-6 max-w-screen-xl">
        <div className="flex items-center justify-between mb-6">
          <div />
          <Button startIcon={Plus} label="Create Playlist" />
        </div>

        <EmptyState
          icon={ListMusic}
          title="No playlists yet"
          description="Create your first playlist to organize media content for your bus screens."
        />
      </div>
    </AppLayout>
  )
}
