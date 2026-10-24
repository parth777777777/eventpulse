import { Suspense } from 'react'
import FullDiscoverPage from '@/components/discovery/FullDiscoverPage'
import { PageShell } from '@/components/eventpulse-pages'

export default function Page() {
  return (
    <PageShell title="Discover events" eyebrow="Browse">
      <Suspense fallback={<div className="empty-results">Loading…</div>}>
        <FullDiscoverPage withMap={true} />
      </Suspense>
    </PageShell>
  )
}
