-- Allow cleaners to update stock levels (e.g. after restocking during a clean)

CREATE POLICY "Cleaners can update property inventory"
  ON property_inventory FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'cleaner')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'cleaner')
  );
