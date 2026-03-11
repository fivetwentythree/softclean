-- Fix any booking topics that were mistakenly stored with backreference text

UPDATE conversations c
SET topic = 'Booking ' ||
  to_char(b.check_in_at AT TIME ZONE 'UTC', 'YYYY/MM/DD') ||
  ' → ' ||
  to_char(b.check_out_at AT TIME ZONE 'UTC', 'YYYY/MM/DD')
FROM bookings b
WHERE c.booking_id = b.id
  AND c.topic LIKE '%\\1%';
