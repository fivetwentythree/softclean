-- Allow managers to read/send messages without being explicit participants

DROP POLICY IF EXISTS "Managers can read messages" ON messages;
CREATE POLICY "Managers can read messages"
  ON messages FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'manager'
    )
  );

DROP POLICY IF EXISTS "Managers can send messages" ON messages;
CREATE POLICY "Managers can send messages"
  ON messages FOR INSERT TO authenticated
  WITH CHECK (
    sender_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'manager'
    )
  );
