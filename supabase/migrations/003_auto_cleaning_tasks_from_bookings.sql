-- Auto-create/update cleaning tasks from bookings

-- Ensure 1:1 relationship between booking and cleaning task
ALTER TABLE cleaning_tasks
  ADD CONSTRAINT unique_cleaning_tasks_booking_id UNIQUE (booking_id);

CREATE OR REPLACE FUNCTION public.sync_cleaning_task_from_booking()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    DELETE FROM cleaning_tasks WHERE booking_id = OLD.id;
    RETURN OLD;
  END IF;

  INSERT INTO cleaning_tasks (property_id, booking_id, scheduled_date, status)
  VALUES (NEW.property_id, NEW.id, (NEW.check_out_at AT TIME ZONE 'UTC')::date, 'unassigned')
  ON CONFLICT (booking_id) DO UPDATE
    SET property_id = EXCLUDED.property_id,
        scheduled_date = EXCLUDED.scheduled_date,
        updated_at = NOW();

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_cleaning_task_from_booking ON bookings;
CREATE TRIGGER trg_sync_cleaning_task_from_booking
AFTER INSERT OR UPDATE OF property_id, check_out_at ON bookings
FOR EACH ROW EXECUTE FUNCTION public.sync_cleaning_task_from_booking();

DROP TRIGGER IF EXISTS trg_delete_cleaning_task_from_booking ON bookings;
CREATE TRIGGER trg_delete_cleaning_task_from_booking
AFTER DELETE ON bookings
FOR EACH ROW EXECUTE FUNCTION public.sync_cleaning_task_from_booking();

-- Backfill tasks for existing bookings
INSERT INTO cleaning_tasks (property_id, booking_id, scheduled_date, status)
SELECT b.property_id, b.id, (b.check_out_at AT TIME ZONE 'UTC')::date, 'unassigned'
FROM bookings b
WHERE NOT EXISTS (
  SELECT 1 FROM cleaning_tasks t WHERE t.booking_id = b.id
);
