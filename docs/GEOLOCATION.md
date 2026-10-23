# Geolocation

## Current implementation

The prototype displays `Mumbai, India` as static text. `EventItem.distance` is hardcoded, the radar uses CSS rings and hand-positioned markers in `components/eventpulse-pages.tsx`, and the location popover only changes visual state. No browser geolocation, geocoder, coordinate fields, map library, or geographic query exists. The radar page labels its coordinates as demo data.

## Target behavior

Store venue, address, and city separately. Store reliable coordinates as nullable latitude/longitude plus a PostGIS `geography(Point,4326)` value created as `ST_SetSRID(ST_MakePoint(longitude, latitude),4326)::geography`. Validate latitude `[-90,90]` and longitude `[-180,180]`. Online-only events have no physical point; hybrid events retain both online details and venue data. Unresolved locations remain nullable with `location_resolution_status = 'unresolved'`.

Offer explicit browser permission, manual city/address search, radius choices (5/10/25 km), and a demo default that is clearly labeled. Do not persist precise user coordinates unless a user opts into a saved home location; rounded cells or an in-memory session preference are safer defaults.

Organizer and importer flows send address data to a server-side geocoder. Save coordinates only when confidence is acceptable, cache normalized address lookups, respect provider limits, and preserve unresolved records for review. Hide provider credentials from the browser and keep the provider behind a replaceable interface.

## Nearby query

```sql
select e.*, st_distance(
  e.location,
  st_setsrid(st_makepoint(:longitude, :latitude), 4326)::geography
) / 1000 as distance_km
from events e
where e.status = 'published'
  and e.location is not null
  and st_dwithin(
    e.location,
    st_setsrid(st_makepoint(:longitude, :latitude), 4326)::geography,
    :radius_meters
  )
order by distance_km asc;
```

Combine this filter with category, date, cost, and source predicates in SQL. Unresolved physical events should be discoverable in a separate “location unavailable” result group, not included in distance sorting. Online-only events can appear under an online filter without a false physical distance.

## Radar

The current radar is illustrative CSS, not a real map: marker positions are fixed percentages and must not be described as precise geography. A production radar should use a map library or a documented coordinate projection from actual event points. Changing location, radius, or filters must change the queried marker set. The smallest safe MVP is a list with computed distances plus a clearly labeled demo radar; do not present arbitrary marker positions as real venues.

## Cache

Normalize a search cell (for example geohash/H3 or rounded coordinates), radius, date/category/cost/source filters, and schema version into the cache key. This improves reuse but reduces precision; never share a result across incompatible cells. Cache is disposable and invalidated after event upserts. PostgreSQL remains authoritative.
