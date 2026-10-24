'use client'

import { useEffect, useRef } from 'react'
import type { DiscoveryEvent } from '@/lib/discovery/types'
import { isValidCoordinate } from '@/lib/discovery/geo'
import type { Map as LeafletMap, Marker as LeafletMarker } from 'leaflet'

/**
 * EventMap — renders a Leaflet map with event markers.
 *
 * Provider: Leaflet + OpenStreetMap tiles
 * Map tiles: © OpenStreetMap contributors (ODbL). Attribution rendered in map.
 * License: Leaflet is MIT. OSM tiles are free for light use with attribution.
 * Keys: None required.
 */

interface EventMapProps {
  events: DiscoveryEvent[]
  originLat: number | null
  originLng: number | null
  selectedId: string | null
  onSelectEvent: (id: string) => void
  className?: string
}

const FALLBACK_LAT = 20.5937
const FALLBACK_LNG = 78.9629
const FALLBACK_ZOOM = 5

export default function EventMap({
  events,
  originLat,
  originLng,
  selectedId,
  onSelectEvent,
  className,
}: EventMapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<LeafletMap | null>(null)
  const markersRef = useRef<Map<string, LeafletMarker>>(new Map())
  const mountedRef = useRef(false)

  // Initialize map once
  useEffect(() => {
    if (mountedRef.current || !containerRef.current) return
    mountedRef.current = true

    let destroyed = false

    async function init() {
      const leaflet = await import('leaflet')

      // Fix default icon paths broken by webpack
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (leaflet.Icon.Default.prototype as any)._getIconUrl
      leaflet.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      })

      if (destroyed || !containerRef.current) return

      const lat =
        originLat !== null && isValidCoordinate(originLat, originLng ?? 0)
          ? originLat
          : FALLBACK_LAT
      const lng =
        originLng !== null && isValidCoordinate(originLat ?? 0, originLng)
          ? originLng
          : FALLBACK_LNG
      const zoom = originLat !== null ? 11 : FALLBACK_ZOOM

      const map = leaflet.map(containerRef.current, { zoomControl: true }).setView([lat, lng], zoom)
      mapRef.current = map

      leaflet
        .tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution:
            '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          maxZoom: 19,
        })
        .addTo(map)

      // Origin marker
      if (
        originLat !== null &&
        originLng !== null &&
        isValidCoordinate(originLat, originLng)
      ) {
        const originIcon = leaflet.divIcon({
          html: '<div style="width:14px;height:14px;border-radius:50%;background:#36d6d2;border:2px solid #fff;box-shadow:0 0 10px #36d6d2;"></div>',
          className: '',
          iconSize: [14, 14],
          iconAnchor: [7, 7],
        })
        leaflet
          .marker([originLat, originLng], { icon: originIcon, zIndexOffset: 1000 })
          .bindPopup('Your search origin')
          .addTo(map)
      }
    }

    void init()

    return () => {
      destroyed = true
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
        markersRef.current.clear()
        mountedRef.current = false
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Only once on mount

  // Update markers when events change
  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    async function updateMarkers() {
      const leaflet = await import('leaflet')
      if (!mapRef.current) return

      const currentMap = mapRef.current
      const existing = markersRef.current

      // Remove markers no longer in results
      const newIds = new Set(events.map((e) => e.id))
      for (const [id, marker] of existing) {
        if (!newIds.has(id)) {
          marker.remove()
          existing.delete(id)
        }
      }

      // Add new markers
      for (const event of events) {
        if (event.latitude === null || event.longitude === null) continue
        if (!isValidCoordinate(event.latitude, event.longitude)) continue
        if (existing.has(event.id)) continue

        const marker = leaflet.marker([event.latitude, event.longitude])

        const fee =
          event.fee_amount === null || event.fee_amount === 0
            ? 'Free'
            : `₹${Number(event.fee_amount).toLocaleString('en-IN')}`

        marker.bindPopup(
          `<div style="min-width:160px">
            <strong style="font-size:13px;display:block;margin-bottom:4px">${escHtml(event.title)}</strong>
            <span style="font-size:11px;color:#666">${escHtml(event.category)}</span>
            <br><span style="font-size:11px">${fee}</span>
           </div>`,
        )

        marker.on('click', () => {
          onSelectEvent(event.id)
        })

        marker.addTo(currentMap)
        existing.set(event.id, marker)
      }

      // Fit bounds to visible markers if events exist and no origin
      if (existing.size > 0 && originLat === null) {
        const group = leaflet.featureGroup(Array.from(existing.values()))
        currentMap.fitBounds(group.getBounds().pad(0.1))
      }
    }

    void updateMarkers()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [events])

  // Highlight selected marker
  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    for (const [id, marker] of markersRef.current) {
      if (id === selectedId) {
        marker.openPopup()
        map.panTo(marker.getLatLng())
      }
    }
  }, [selectedId])

  return (
    <>
      {/* Leaflet CSS loaded inline to avoid SSR issues */}
      {/* eslint-disable-next-line @next/next/no-css-tags */}
      <link
        rel="stylesheet"
        href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
        crossOrigin=""
      />
      <div
        ref={containerRef}
        className={className}
        style={{ width: '100%', height: '100%', minHeight: 320, background: '#121322' }}
        aria-label="Event map"
      />
    </>
  )
}

function escHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
