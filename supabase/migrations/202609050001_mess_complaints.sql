-- Mess complaint system: unified complaints + mess-specific categories.
--
-- 1. complaint_categories.is_mess flags a category as a "mess" category so the
--    mess board (/mess) can show only mess complaints while they still live in
--    the same unified complaints table/board.
-- 2. complaints.meal_session captures which meal session (breakfast/lunch/
--    dinner/snacks) a mess complaint refers to.

ALTER TABLE complaint_categories ADD COLUMN IF NOT EXISTS is_mess boolean NOT NULL DEFAULT false;
ALTER TABLE complaints ADD COLUMN IF NOT EXISTS meal_session text;

-- Mark existing categories that are clearly mess-related so old complaints
-- stay visible on the mess board.
UPDATE complaint_categories
SET is_mess = true
WHERE is_mess = false
  AND lower(name) IN (
    'mess',
    'food quality',
    'quantity',
    'hygiene',
    'menu not followed',
    'staff behavior',
    'staff behaviour',
    'facility & maintenance'
  );

-- Seed the standard mess category set for every institution (idempotent).
INSERT INTO complaint_categories (institution_id, name, is_active, is_mess, sort_order)
SELECT i.id, m.name, true, true, 100 + m.idx
FROM institutions i
CROSS JOIN (
  VALUES
    ('Mess', 0),
    ('Food Quality', 1),
    ('Quantity', 2),
    ('Hygiene', 3),
    ('Menu Not Followed', 4),
    ('Staff Behavior', 5),
    ('Facility & Maintenance', 6)
) AS m(name, idx)
ON CONFLICT (institution_id, name) DO NOTHING;