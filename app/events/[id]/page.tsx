import { EventDetailPageServer } from '@/components/discovery/EventDetailPage'

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <EventDetailPageServer id={id} />
}
