-- Remove the test cleaning task for Harbor View Loft on 2026-03-12

DELETE FROM cleaning_tasks
WHERE property_id IN (
  SELECT id FROM properties WHERE name ILIKE 'Harbor View%'
)
AND scheduled_date = '2026-03-12'
AND notes = 'Test task for Cleaned toggle';
