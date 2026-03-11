-- Seed another booking for Beach House starting 18 Mar 2026 (idempotent)

INSERT INTO bookings (property_id, external_id, check_in_at, check_out_at, guest_count)
SELECT
  p.id,
  'manual-beach-house-20260318',
  '2026-03-18T14:00:00+11:00',
  '2026-03-25T10:00:00+11:00',
  4
FROM properties p
WHERE p.name ILIKE 'Beach House'
ON CONFLICT (property_id, external_id) DO NOTHING;
