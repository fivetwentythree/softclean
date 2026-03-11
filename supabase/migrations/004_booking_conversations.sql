-- Booking-specific conversations and access policies

ALTER TABLE conversations
  ADD COLUMN IF NOT EXISTS booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL;

ALTER TABLE conversations
  ADD CONSTRAINT unique_conversations_booking_id UNIQUE (booking_id);

CREATE OR REPLACE FUNCTION public.sync_conversation_from_booking()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  topic_text TEXT;
BEGIN
  IF TG_OP = 'DELETE' THEN
    DELETE FROM conversations WHERE booking_id = OLD.id;
    RETURN OLD;
  END IF;

  topic_text := 'Booking ' || to_char(NEW.check_in_at AT TIME ZONE 'UTC', 'YYYY/MM/DD') || ' → ' || to_char(NEW.check_out_at AT TIME ZONE 'UTC', 'YYYY/MM/DD');

  INSERT INTO conversations (property_id, booking_id, topic, status)
  VALUES (NEW.property_id, NEW.id, topic_text, 'open')
  ON CONFLICT (booking_id) DO UPDATE
    SET property_id = EXCLUDED.property_id,
        topic = EXCLUDED.topic,
        updated_at = NOW();

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_conversation_from_booking ON bookings;
CREATE TRIGGER trg_sync_conversation_from_booking
AFTER INSERT OR UPDATE OF property_id, check_in_at, check_out_at ON bookings
FOR EACH ROW EXECUTE FUNCTION public.sync_conversation_from_booking();

DROP TRIGGER IF EXISTS trg_delete_conversation_from_booking ON bookings;
CREATE TRIGGER trg_delete_conversation_from_booking
AFTER DELETE ON bookings
FOR EACH ROW EXECUTE FUNCTION public.sync_conversation_from_booking();

-- Backfill conversations for existing bookings
INSERT INTO conversations (property_id, booking_id, topic, status)
SELECT b.property_id,
       b.id,
       'Booking ' || to_char(b.check_in_at AT TIME ZONE 'UTC', 'YYYY/MM/DD') || ' → ' || to_char(b.check_out_at AT TIME ZONE 'UTC', 'YYYY/MM/DD'),
       'open'
FROM bookings b
WHERE NOT EXISTS (
  SELECT 1 FROM conversations c WHERE c.booking_id = b.id
);

-- Allow cleaners to read booking conversations for properties they work on
CREATE POLICY "Cleaners can read property conversations"
  ON conversations FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM cleaning_tasks
      WHERE cleaning_tasks.property_id = conversations.property_id
        AND cleaning_tasks.cleaner_id = auth.uid()
    )
  );

-- Allow cleaners to read messages in those conversations
CREATE POLICY "Cleaners can read property messages"
  ON messages FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM conversations c
      JOIN cleaning_tasks t ON t.property_id = c.property_id
      WHERE c.id = messages.conversation_id
        AND t.cleaner_id = auth.uid()
    )
  );

-- Allow cleaners to send messages in those conversations
CREATE POLICY "Cleaners can send property messages"
  ON messages FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM conversations c
      JOIN cleaning_tasks t ON t.property_id = c.property_id
      WHERE c.id = messages.conversation_id
        AND t.cleaner_id = auth.uid()
    )
  );
