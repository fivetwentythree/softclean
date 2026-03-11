-- Seed a same-day turnover booking for Beach House (idempotent)

INSERT INTO bookings (property_id, external_id, check_in_at, check_out_at, guest_count)
SELECT
  p.id,
  'manual-beach-house-20260308',
  '2026-03-08T14:00:00+11:00',
  '2026-03-18T10:00:00+11:00',
  3
FROM properties p
WHERE p.name ILIKE 'Beach House'
ON CONFLICT (property_id, external_id) DO NOTHING;
