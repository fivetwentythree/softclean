-- Seed a booking for Harbor View Loft (idempotent)

INSERT INTO bookings (property_id, external_id, check_in_at, check_out_at, guest_count)
SELECT
  p.id,
  'manual-harbor-view-20260318',
  '2026-03-18T14:00:00+11:00',
  '2026-03-22T10:00:00+11:00',
  2
FROM properties p
WHERE p.name ILIKE 'Harbor View%'
ON CONFLICT (property_id, external_id) DO NOTHING;
