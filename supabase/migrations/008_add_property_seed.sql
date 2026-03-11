-- Seed a new property (idempotent)

INSERT INTO properties (name, address, access_instructions, status)
SELECT
  'Harbor View Loft',
  '21 Collins St, Hobart TAS 7000',
  'Lockbox at front gate. Code: 4027. Please lock up after cleaning.',
  'active'
WHERE NOT EXISTS (
  SELECT 1 FROM properties
  WHERE name = 'Harbor View Loft'
    AND address = '21 Collins St, Hobart TAS 7000'
);
