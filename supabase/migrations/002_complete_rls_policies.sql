-- Complete RLS policies for tables not covered in 001_initial_schema.sql
-- Helper pattern: EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = '<role>')

-- ============================================================================
-- BOOKINGS
-- ============================================================================

-- Managers: full access
CREATE POLICY "Managers full access to bookings"
  ON bookings FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'manager'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'manager'));

-- Cleaners: read bookings for properties they have tasks on
CREATE POLICY "Cleaners can read bookings for their task properties"
  ON bookings FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM cleaning_tasks
      WHERE cleaning_tasks.property_id = bookings.property_id
        AND cleaning_tasks.cleaner_id = auth.uid()
    )
  );

-- Suppliers: read-only
CREATE POLICY "Suppliers can read bookings"
  ON bookings FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'supplier')
  );

-- ============================================================================
-- CHECKLIST TEMPLATES
-- ============================================================================

-- Managers: full access
CREATE POLICY "Managers full access to checklist templates"
  ON checklist_templates FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'manager'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'manager'));

-- Cleaners: read templates for properties they're assigned tasks on
CREATE POLICY "Cleaners can read templates for their task properties"
  ON checklist_templates FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM cleaning_tasks
      WHERE cleaning_tasks.property_id = checklist_templates.property_id
        AND cleaning_tasks.cleaner_id = auth.uid()
    )
  );

-- ============================================================================
-- CHECKLIST COMPLETIONS
-- ============================================================================

-- Managers: full access
CREATE POLICY "Managers full access to checklist completions"
  ON checklist_completions FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'manager'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'manager'));

-- Cleaners: read their own completions (via task_id → cleaning_tasks.cleaner_id)
CREATE POLICY "Cleaners can read own checklist completions"
  ON checklist_completions FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM cleaning_tasks
      WHERE cleaning_tasks.id = checklist_completions.task_id
        AND cleaning_tasks.cleaner_id = auth.uid()
    )
  );

-- Cleaners: insert completions for their own tasks
CREATE POLICY "Cleaners can insert checklist completions for own tasks"
  ON checklist_completions FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM cleaning_tasks
      WHERE cleaning_tasks.id = checklist_completions.task_id
        AND cleaning_tasks.cleaner_id = auth.uid()
    )
  );

-- Cleaners: update their own completions
CREATE POLICY "Cleaners can update own checklist completions"
  ON checklist_completions FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM cleaning_tasks
      WHERE cleaning_tasks.id = checklist_completions.task_id
        AND cleaning_tasks.cleaner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM cleaning_tasks
      WHERE cleaning_tasks.id = checklist_completions.task_id
        AND cleaning_tasks.cleaner_id = auth.uid()
    )
  );

-- ============================================================================
-- TASK PHOTOS
-- ============================================================================

-- Managers: full access
CREATE POLICY "Managers full access to task photos"
  ON task_photos FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'manager'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'manager'));

-- Cleaners: read photos for their own tasks
CREATE POLICY "Cleaners can read photos for own tasks"
  ON task_photos FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM cleaning_tasks
      WHERE cleaning_tasks.id = task_photos.task_id
        AND cleaning_tasks.cleaner_id = auth.uid()
    )
  );

-- Cleaners: insert photos for their own tasks
CREATE POLICY "Cleaners can insert photos for own tasks"
  ON task_photos FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM cleaning_tasks
      WHERE cleaning_tasks.id = task_photos.task_id
        AND cleaning_tasks.cleaner_id = auth.uid()
    )
  );

-- ============================================================================
-- ISSUES
-- ============================================================================

-- Managers: full access
CREATE POLICY "Managers full access to issues"
  ON issues FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'manager'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'manager'));

-- Cleaners: read issues they reported
CREATE POLICY "Cleaners can read own reported issues"
  ON issues FOR SELECT TO authenticated
  USING (reported_by = auth.uid());

-- Cleaners: insert new issues (must be reported by themselves)
CREATE POLICY "Cleaners can insert issues"
  ON issues FOR INSERT TO authenticated
  WITH CHECK (reported_by = auth.uid());

-- ============================================================================
-- INVENTORY ITEMS (master catalog)
-- ============================================================================

-- All authenticated users: read-only
CREATE POLICY "Inventory items readable by all authenticated users"
  ON inventory_items FOR SELECT TO authenticated
  USING (true);

-- Managers: insert
CREATE POLICY "Managers can insert inventory items"
  ON inventory_items FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'manager'));

-- Managers: update
CREATE POLICY "Managers can update inventory items"
  ON inventory_items FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'manager'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'manager'));

-- Managers: delete
CREATE POLICY "Managers can delete inventory items"
  ON inventory_items FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'manager'));

-- ============================================================================
-- PROPERTY INVENTORY
-- ============================================================================

-- Managers: full access
CREATE POLICY "Managers full access to property inventory"
  ON property_inventory FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'manager'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'manager'));

-- Cleaners: read-only
CREATE POLICY "Cleaners can read property inventory"
  ON property_inventory FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'cleaner')
  );

-- Suppliers: read-only
CREATE POLICY "Suppliers can read property inventory"
  ON property_inventory FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'supplier')
  );

-- ============================================================================
-- SUPPLY ORDERS
-- ============================================================================

-- Managers: full access
CREATE POLICY "Managers full access to supply orders"
  ON supply_orders FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'manager'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'manager'));

-- Suppliers: read orders assigned to them
CREATE POLICY "Suppliers can read own supply orders"
  ON supply_orders FOR SELECT TO authenticated
  USING (supplier_id = auth.uid());

-- Suppliers: update orders assigned to them
CREATE POLICY "Suppliers can update own supply orders"
  ON supply_orders FOR UPDATE TO authenticated
  USING (supplier_id = auth.uid())
  WITH CHECK (supplier_id = auth.uid());

-- ============================================================================
-- ORDER LINE ITEMS
-- ============================================================================

-- Managers: full access
CREATE POLICY "Managers full access to order line items"
  ON order_line_items FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'manager'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'manager'));

-- Suppliers: read line items for their orders
CREATE POLICY "Suppliers can read own order line items"
  ON order_line_items FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM supply_orders
      WHERE supply_orders.id = order_line_items.order_id
        AND supply_orders.supplier_id = auth.uid()
    )
  );

-- Suppliers: update line items for their orders
CREATE POLICY "Suppliers can update own order line items"
  ON order_line_items FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM supply_orders
      WHERE supply_orders.id = order_line_items.order_id
        AND supply_orders.supplier_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM supply_orders
      WHERE supply_orders.id = order_line_items.order_id
        AND supply_orders.supplier_id = auth.uid()
    )
  );

-- ============================================================================
-- CONVERSATIONS
-- ============================================================================

-- Managers: full access
CREATE POLICY "Managers full access to conversations"
  ON conversations FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'manager'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'manager'));

-- Others: read conversations they participate in
CREATE POLICY "Participants can read their conversations"
  ON conversations FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM conversation_participants
      WHERE conversation_participants.conversation_id = conversations.id
        AND conversation_participants.user_id = auth.uid()
    )
  );

-- ============================================================================
-- CONVERSATION PARTICIPANTS
-- ============================================================================

-- Managers: full access
CREATE POLICY "Managers full access to conversation participants"
  ON conversation_participants FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'manager'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'manager'));

-- Others: read their own participation records
CREATE POLICY "Users can read own participation records"
  ON conversation_participants FOR SELECT TO authenticated
  USING (user_id = auth.uid());
