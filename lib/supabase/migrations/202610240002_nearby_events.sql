
create or replace function public.nearby_published_events(
  p_lat double precision default null,
  p_lng double precision default null,
  p_radius_km double precision default 25,
  p_category text default null,
  p_from timestamptz default null,
  p_to timestamptz default null,
  p_limit integer default 50
)
returns table (
  id uuid,
  title text,
  description text,
  category text,
  starts_at timestamptz,
  ends_at timestamptz,
  timezone text,
  format text,
  venue_name text,
  address text,
  city text,
  latitude double precision,
  longitude double precision,
  registration_url text,
  fee_amount numeric,
  currency text,
  source_attribution text,
  verification_status text,
  distance_km double precision
)
language sql
stable
security invoker
set search_path = ''
as $$
  select
    e.id,
    e.title,
    e.description,
    e.category,
    e.starts_at,
    e.ends_at,
    e.timezone,
    e.format,
    e.venue_name,
    e.address,
    e.city,
    e.latitude,
    e.longitude,
    e.registration_url,
    e.fee_amount,
    e.currency,
    e.source_attribution,
    e.verification_status,
    case
      when p_lat is not null and p_lng is not null
        and e.location is not null
      then extensions.st_distance(
        e.location,
        extensions.st_setsrid(
          extensions.st_makepoint(p_lng, p_lat),
          4326
        )::extensions.geography
      ) / 1000.0
      else null
    end as distance_km
  from public.events e
  where e.status = 'published'
    and (p_category is null or e.category = p_category)
    and (p_from is null or e.starts_at >= p_from)
    and (p_to is null or e.starts_at <= p_to)
    and (
      p_lat is null
      or p_lng is null
      or (
        e.location is not null
        and extensions.st_dwithin(
          e.location,
          extensions.st_setsrid(
            extensions.st_makepoint(p_lng, p_lat),
            4326
          )::extensions.geography,
          p_radius_km * 1000.0
        )
      )
    )
  order by
    distance_km asc nulls last,
    e.starts_at asc
  limit least(greatest(coalesce(p_limit, 50), 1), 100);
$$;

revoke all on function public.nearby_published_events(
  double precision, double precision, double precision,
  text, timestamptz, timestamptz, integer
) from public;

grant execute on function public.nearby_published_events(
  double precision, double precision, double precision,
  text, timestamptz, timestamptz, integer
) to anon, authenticated;
