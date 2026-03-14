-- ============================================================================
-- SEED: Two-profile role-play (Manager + Cleaner)
--
-- Creates two auth users, their profiles, properties, tasks, inventory,
-- conversations with messages — everything needed to test the real app
-- with a manager in one browser and a cleaner in another.
--
-- Credentials:
--   Manager:  dana@softclean.test  /  DanaTest2026!
--   Cleaner:  alex@softclean.test  /  AlexTest2026!
--
-- This migration is IDEMPOTENT — safe to run multiple times.
-- ============================================================================

-- Fixed UUIDs so we can reference them throughout
DO $$
DECLARE
  manager_id UUID := 'a1000000-0000-0000-0000-000000000001';
  cleaner_id UUID := 'a2000000-0000-0000-0000-000000000002';
  prop_bondi UUID;
  prop_surry UUID;
  prop_manly UUID;
  conv_oven UUID;
  conv_stock UUID;
  conv_deep UUID;
  task_1 UUID;
  task_2 UUID;
  task_3 UUID;
  task_4 UUID;
  task_5 UUID;
  task_6 UUID;
  inv_soap UUID;
  inv_towels UUID;
  inv_bins UUID;
  inv_tablets UUID;
  inv_toilet UUID;
  inv_shampoo UUID;
  inv_sponges UUID;
  inv_paper UUID;
  inv_laundry UUID;
  inv_hand_towels UUID;
  inv_glass UUID;
  inv_coffee UUID;
BEGIN

  -- ══════════════════════════════════════════════════════════════════════════
  -- 1. AUTH USERS
  -- ══════════════════════════════════════════════════════════════════════════

  -- Manager: dana@softclean.test / DanaTest2026!
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = manager_id) THEN
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, created_at, updated_at,
      raw_app_meta_data, raw_user_meta_data, confirmation_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      manager_id,
      'authenticated',
      'authenticated',
      'dana@softclean.test',
      crypt('DanaTest2026!', gen_salt('bf')),
      NOW(), NOW(), NOW(),
      '{"provider":"email","providers":["email"]}',
      '{"full_name":"Dana Torres"}',
      ''
    );

    INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
    VALUES (
      manager_id, manager_id,
      jsonb_build_object('sub', manager_id::text, 'email', 'dana@softclean.test'),
      'email', manager_id::text,
      NOW(), NOW(), NOW()
    );
  END IF;

  -- Cleaner: alex@softclean.test / AlexTest2026!
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = cleaner_id) THEN
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, created_at, updated_at,
      raw_app_meta_data, raw_user_meta_data, confirmation_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      cleaner_id,
      'authenticated',
      'authenticated',
      'alex@softclean.test',
      crypt('AlexTest2026!', gen_salt('bf')),
      NOW(), NOW(), NOW(),
      '{"provider":"email","providers":["email"]}',
      '{"full_name":"Alex Kim"}',
      ''
    );

    INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
    VALUES (
      cleaner_id, cleaner_id,
      jsonb_build_object('sub', cleaner_id::text, 'email', 'alex@softclean.test'),
      'email', cleaner_id::text,
      NOW(), NOW(), NOW()
    );
  END IF;

  -- ══════════════════════════════════════════════════════════════════════════
  -- 2. PROFILES
  -- ══════════════════════════════════════════════════════════════════════════

  INSERT INTO profiles (id, role, full_name, phone)
  VALUES
    (manager_id, 'manager', 'Dana Torres', '+61 400 111 222'),
    (cleaner_id, 'cleaner', 'Alex Kim',    '+61 400 333 444')
  ON CONFLICT (id) DO NOTHING;

  -- ══════════════════════════════════════════════════════════════════════════
  -- 3. PROPERTIES
  -- ══════════════════════════════════════════════════════════════════════════

  -- Bondi Beach House
  INSERT INTO properties (name, address, access_instructions, status)
  SELECT 'Bondi Beach House', '42 Campbell Parade, Bondi Beach NSW 2026',
         'Lock-box on side gate. Code: 7291. Reset after entry.', 'active'
  WHERE NOT EXISTS (SELECT 1 FROM properties WHERE name = 'Bondi Beach House');

  SELECT id INTO prop_bondi FROM properties WHERE name = 'Bondi Beach House';

  -- Surry Hills Loft
  INSERT INTO properties (name, address, access_instructions, status)
  SELECT 'Surry Hills Loft', '18/120 Crown St, Surry Hills NSW 2010',
         'Concierge buzzer #18. Key under mat if no answer.', 'active'
  WHERE NOT EXISTS (SELECT 1 FROM properties WHERE name = 'Surry Hills Loft');

  SELECT id INTO prop_surry FROM properties WHERE name = 'Surry Hills Loft';

  -- Manly Harbour View
  INSERT INTO properties (name, address, access_instructions, status)
  SELECT 'Manly Harbour View', '5 East Esplanade, Manly NSW 2095',
         NULL, 'active'
  WHERE NOT EXISTS (SELECT 1 FROM properties WHERE name = 'Manly Harbour View');

  SELECT id INTO prop_manly FROM properties WHERE name = 'Manly Harbour View';

  -- ══════════════════════════════════════════════════════════════════════════
  -- 4. CLEANING TASKS (6 tasks, various statuses)
  -- ══════════════════════════════════════════════════════════════════════════

  -- Task 1: Bondi — in progress today
  INSERT INTO cleaning_tasks (property_id, cleaner_id, scheduled_date, status, notes, started_at, estimated_duration_minutes)
  SELECT prop_bondi, cleaner_id, CURRENT_DATE, 'in_progress',
         'Guest left early — possible extra mess in kitchen. Check oven.',
         (CURRENT_DATE + TIME '09:00')::timestamptz, 90
  WHERE NOT EXISTS (
    SELECT 1 FROM cleaning_tasks
    WHERE property_id = prop_bondi AND scheduled_date = CURRENT_DATE AND status = 'in_progress'
  )
  RETURNING id INTO task_1;

  IF task_1 IS NULL THEN
    SELECT id INTO task_1 FROM cleaning_tasks
    WHERE property_id = prop_bondi AND scheduled_date = CURRENT_DATE AND status = 'in_progress' LIMIT 1;
  END IF;

  -- Task 2: Surry Hills — assigned today
  INSERT INTO cleaning_tasks (property_id, cleaner_id, scheduled_date, status, estimated_duration_minutes)
  SELECT prop_surry, cleaner_id, CURRENT_DATE, 'assigned', 60
  WHERE NOT EXISTS (
    SELECT 1 FROM cleaning_tasks
    WHERE property_id = prop_surry AND scheduled_date = CURRENT_DATE AND status = 'assigned'
  )
  RETURNING id INTO task_2;

  IF task_2 IS NULL THEN
    SELECT id INTO task_2 FROM cleaning_tasks
    WHERE property_id = prop_surry AND scheduled_date = CURRENT_DATE AND status = 'assigned' LIMIT 1;
  END IF;

  -- Task 3: Manly — assigned tomorrow (deep clean)
  INSERT INTO cleaning_tasks (property_id, cleaner_id, scheduled_date, status, notes, estimated_duration_minutes)
  SELECT prop_manly, cleaner_id, CURRENT_DATE + 1, 'assigned',
         'Deep-clean requested — include windows and balcony.', 120
  WHERE NOT EXISTS (
    SELECT 1 FROM cleaning_tasks
    WHERE property_id = prop_manly AND scheduled_date = CURRENT_DATE + 1 AND status = 'assigned'
  )
  RETURNING id INTO task_3;

  -- Task 4: Bondi — completed yesterday
  INSERT INTO cleaning_tasks (property_id, cleaner_id, scheduled_date, status, notes, started_at, completed_at, estimated_duration_minutes)
  SELECT prop_bondi, cleaner_id, CURRENT_DATE - 1, 'completed',
         'All good. Restocked towels.',
         (CURRENT_DATE - 1 + TIME '10:00')::timestamptz,
         (CURRENT_DATE - 1 + TIME '12:00')::timestamptz, 90
  WHERE NOT EXISTS (
    SELECT 1 FROM cleaning_tasks
    WHERE property_id = prop_bondi AND scheduled_date = CURRENT_DATE - 1 AND status = 'completed'
  );

  -- Task 5: Surry Hills — unassigned in 3 days
  INSERT INTO cleaning_tasks (property_id, scheduled_date, status, estimated_duration_minutes)
  SELECT prop_surry, CURRENT_DATE + 3, 'unassigned', 60
  WHERE NOT EXISTS (
    SELECT 1 FROM cleaning_tasks
    WHERE property_id = prop_surry AND scheduled_date = CURRENT_DATE + 3 AND status = 'unassigned'
  );

  -- Task 6: Manly — issue reported today
  INSERT INTO cleaning_tasks (property_id, cleaner_id, scheduled_date, status, notes, started_at, estimated_duration_minutes)
  SELECT prop_manly, cleaner_id, CURRENT_DATE, 'issue_reported',
         'Dishwasher not draining. Reported to manager.',
         (CURRENT_DATE + TIME '08:00')::timestamptz, 90
  WHERE NOT EXISTS (
    SELECT 1 FROM cleaning_tasks
    WHERE property_id = prop_manly AND scheduled_date = CURRENT_DATE AND status = 'issue_reported'
  );

  -- ══════════════════════════════════════════════════════════════════════════
  -- 5. INVENTORY ITEMS + STOCK LEVELS
  -- ══════════════════════════════════════════════════════════════════════════

  -- Create master items (idempotent)
  INSERT INTO inventory_items (name, category, unit) SELECT 'Hand soap',          'consumable', 'bottles' WHERE NOT EXISTS (SELECT 1 FROM inventory_items WHERE name = 'Hand soap');
  INSERT INTO inventory_items (name, category, unit) SELECT 'Bath towels',        'linen',      'pieces'  WHERE NOT EXISTS (SELECT 1 FROM inventory_items WHERE name = 'Bath towels');
  INSERT INTO inventory_items (name, category, unit) SELECT 'Bin liners',         'consumable', 'rolls'   WHERE NOT EXISTS (SELECT 1 FROM inventory_items WHERE name = 'Bin liners');
  INSERT INTO inventory_items (name, category, unit) SELECT 'Dishwasher tablets', 'consumable', 'tablets' WHERE NOT EXISTS (SELECT 1 FROM inventory_items WHERE name = 'Dishwasher tablets');
  INSERT INTO inventory_items (name, category, unit) SELECT 'Toilet rolls',       'consumable', 'rolls'   WHERE NOT EXISTS (SELECT 1 FROM inventory_items WHERE name = 'Toilet rolls');
  INSERT INTO inventory_items (name, category, unit) SELECT 'Shampoo',            'amenity',    'bottles' WHERE NOT EXISTS (SELECT 1 FROM inventory_items WHERE name = 'Shampoo');
  INSERT INTO inventory_items (name, category, unit) SELECT 'Kitchen sponges',    'consumable', 'pieces'  WHERE NOT EXISTS (SELECT 1 FROM inventory_items WHERE name = 'Kitchen sponges');
  INSERT INTO inventory_items (name, category, unit) SELECT 'Paper towels',       'consumable', 'rolls'   WHERE NOT EXISTS (SELECT 1 FROM inventory_items WHERE name = 'Paper towels');
  INSERT INTO inventory_items (name, category, unit) SELECT 'Laundry pods',       'consumable', 'pods'    WHERE NOT EXISTS (SELECT 1 FROM inventory_items WHERE name = 'Laundry pods');
  INSERT INTO inventory_items (name, category, unit) SELECT 'Hand towels',        'linen',      'pieces'  WHERE NOT EXISTS (SELECT 1 FROM inventory_items WHERE name = 'Hand towels');
  INSERT INTO inventory_items (name, category, unit) SELECT 'Glass cleaner',      'maintenance','bottles' WHERE NOT EXISTS (SELECT 1 FROM inventory_items WHERE name = 'Glass cleaner');
  INSERT INTO inventory_items (name, category, unit) SELECT 'Coffee pods',        'amenity',    'pods'    WHERE NOT EXISTS (SELECT 1 FROM inventory_items WHERE name = 'Coffee pods');

  -- Look up item IDs
  SELECT id INTO inv_soap        FROM inventory_items WHERE name = 'Hand soap';
  SELECT id INTO inv_towels      FROM inventory_items WHERE name = 'Bath towels';
  SELECT id INTO inv_bins        FROM inventory_items WHERE name = 'Bin liners';
  SELECT id INTO inv_tablets     FROM inventory_items WHERE name = 'Dishwasher tablets';
  SELECT id INTO inv_toilet      FROM inventory_items WHERE name = 'Toilet rolls';
  SELECT id INTO inv_shampoo     FROM inventory_items WHERE name = 'Shampoo';
  SELECT id INTO inv_sponges     FROM inventory_items WHERE name = 'Kitchen sponges';
  SELECT id INTO inv_paper       FROM inventory_items WHERE name = 'Paper towels';
  SELECT id INTO inv_laundry     FROM inventory_items WHERE name = 'Laundry pods';
  SELECT id INTO inv_hand_towels FROM inventory_items WHERE name = 'Hand towels';
  SELECT id INTO inv_glass       FROM inventory_items WHERE name = 'Glass cleaner';
  SELECT id INTO inv_coffee      FROM inventory_items WHERE name = 'Coffee pods';

  -- Bondi Beach House stock (hand soap LOW)
  INSERT INTO property_inventory (property_id, item_id, current_quantity, minimum_threshold) VALUES
    (prop_bondi, inv_soap,    2, 5),   -- LOW
    (prop_bondi, inv_towels,  8, 4),
    (prop_bondi, inv_bins,   12, 5),
    (prop_bondi, inv_tablets, 6, 3)
  ON CONFLICT (property_id, item_id) DO NOTHING;

  -- Surry Hills Loft stock (toilet rolls & paper towels LOW)
  INSERT INTO property_inventory (property_id, item_id, current_quantity, minimum_threshold) VALUES
    (prop_surry, inv_toilet,  1, 3),   -- LOW
    (prop_surry, inv_shampoo, 4, 2),
    (prop_surry, inv_sponges, 3, 2),
    (prop_surry, inv_paper,   2, 4)    -- LOW
  ON CONFLICT (property_id, item_id) DO NOTHING;

  -- Manly Harbour View stock (hand towels, glass cleaner, coffee pods LOW)
  INSERT INTO property_inventory (property_id, item_id, current_quantity, minimum_threshold) VALUES
    (prop_manly, inv_laundry,     5, 3),
    (prop_manly, inv_hand_towels, 3, 6),   -- LOW
    (prop_manly, inv_glass,       1, 2),   -- LOW
    (prop_manly, inv_coffee,      4, 5)    -- LOW
  ON CONFLICT (property_id, item_id) DO NOTHING;

  -- ══════════════════════════════════════════════════════════════════════════
  -- 6. CONVERSATIONS + PARTICIPANTS + MESSAGES
  -- ══════════════════════════════════════════════════════════════════════════

  -- Conversation 1: Bondi — Oven issue
  INSERT INTO conversations (property_id, topic, status)
  SELECT prop_bondi, 'Oven issue', 'open'
  WHERE NOT EXISTS (SELECT 1 FROM conversations WHERE property_id = prop_bondi AND topic = 'Oven issue')
  RETURNING id INTO conv_oven;

  IF conv_oven IS NULL THEN
    SELECT id INTO conv_oven FROM conversations WHERE property_id = prop_bondi AND topic = 'Oven issue' LIMIT 1;
  END IF;

  IF conv_oven IS NOT NULL THEN
    INSERT INTO conversation_participants (conversation_id, user_id)
    VALUES (conv_oven, manager_id), (conv_oven, cleaner_id)
    ON CONFLICT (conversation_id, user_id) DO NOTHING;

    -- Messages (only insert if conversation was just created, i.e. no messages yet)
    IF NOT EXISTS (SELECT 1 FROM messages WHERE conversation_id = conv_oven) THEN
      INSERT INTO messages (conversation_id, sender_id, body, created_at) VALUES
        (conv_oven, cleaner_id, 'Hey Dana, the oven is really bad — burnt grease everywhere. Should I do a deep clean or flag it for maintenance?', NOW() - INTERVAL '3 hours'),
        (conv_oven, manager_id, 'Can you send a photo? If it''s just grease we can handle it with the degreaser from the supply kit.', NOW() - INTERVAL '2 hours 50 minutes'),
        (conv_oven, cleaner_id, 'It''s heavy but I think degreaser will work. I''ll give it 20 mins. Might push the finish time back a little.', NOW() - INTERVAL '2 hours'),
        (conv_oven, manager_id, 'That''s fine, guest doesn''t check in until 3 PM. Take your time and let me know when you''re done 👍', NOW() - INTERVAL '1 hour 50 minutes');
    END IF;
  END IF;

  -- Conversation 2: Surry Hills — Low stock
  INSERT INTO conversations (property_id, topic, status)
  SELECT prop_surry, 'Low stock', 'open'
  WHERE NOT EXISTS (SELECT 1 FROM conversations WHERE property_id = prop_surry AND topic = 'Low stock')
  RETURNING id INTO conv_stock;

  IF conv_stock IS NULL THEN
    SELECT id INTO conv_stock FROM conversations WHERE property_id = prop_surry AND topic = 'Low stock' LIMIT 1;
  END IF;

  IF conv_stock IS NOT NULL THEN
    INSERT INTO conversation_participants (conversation_id, user_id)
    VALUES (conv_stock, manager_id), (conv_stock, cleaner_id)
    ON CONFLICT (conversation_id, user_id) DO NOTHING;

    IF NOT EXISTS (SELECT 1 FROM messages WHERE conversation_id = conv_stock) THEN
      INSERT INTO messages (conversation_id, sender_id, body, created_at) VALUES
        (conv_stock, manager_id, 'Heads up — Surry Hills is low on toilet rolls and hand soap. Can you grab some on the way tomorrow?', NOW() - INTERVAL '1 day'),
        (conv_stock, cleaner_id, 'Sure, I''ll pick them up in the morning. Anything else needed?', NOW() - INTERVAL '23 hours'),
        (conv_stock, manager_id, 'Maybe check if we need more bin liners too. Thanks Alex!', NOW() - INTERVAL '22 hours 30 minutes');
    END IF;
  END IF;

  -- Conversation 3: Manly — Deep clean prep
  INSERT INTO conversations (property_id, topic, status)
  SELECT prop_manly, 'Deep clean prep', 'open'
  WHERE NOT EXISTS (SELECT 1 FROM conversations WHERE property_id = prop_manly AND topic = 'Deep clean prep')
  RETURNING id INTO conv_deep;

  IF conv_deep IS NULL THEN
    SELECT id INTO conv_deep FROM conversations WHERE property_id = prop_manly AND topic = 'Deep clean prep' LIMIT 1;
  END IF;

  IF conv_deep IS NOT NULL THEN
    INSERT INTO conversation_participants (conversation_id, user_id)
    VALUES (conv_deep, manager_id), (conv_deep, cleaner_id)
    ON CONFLICT (conversation_id, user_id) DO NOTHING;

    IF NOT EXISTS (SELECT 1 FROM messages WHERE conversation_id = conv_deep) THEN
      INSERT INTO messages (conversation_id, sender_id, body, created_at) VALUES
        (conv_deep, manager_id, 'The Manly deep clean is tomorrow. Don''t forget the window squeegee and the balcony mop — it gets salty up there.', NOW() - INTERVAL '4 hours'),
        (conv_deep, cleaner_id, 'Got it. Do I need the extension pole for the upper windows?', NOW() - INTERVAL '3 hours 50 minutes'),
        (conv_deep, manager_id, 'Yes please. There are two tall windows in the living room. Also the guest left a 5-star review last time so let''s keep the standard high!', NOW() - INTERVAL '3 hours');
    END IF;
  END IF;

END $$;
