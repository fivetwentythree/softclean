-- Seed a cleaning task for today to test the Cleaned flow (idempotent)

INSERT INTO cleaning_tasks (property_id, scheduled_date, status, notes)
SELECT
  p.id,
  '2026-03-12',
  'assigned',
  'Test task for Cleaned toggle'
FROM properties p
WHERE p.name ILIKE 'Harbor View%'
  AND NOT EXISTS (
    SELECT 1
    FROM cleaning_tasks t
    WHERE t.property_id = p.id
      AND t.scheduled_date = '2026-03-12'
  );
