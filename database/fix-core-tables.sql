-- Fix core tables only (ignore admin tables that don't exist)

-- Disable RLS on core tables
ALTER TABLE categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE diamond_questions DISABLE ROW LEVEL SECURITY;
ALTER TABLE used_questions DISABLE ROW LEVEL SECURITY;

-- Drop any policies that might exist on core tables
DROP POLICY IF EXISTS "Admins can manage categories" ON categories;
DROP POLICY IF EXISTS "Admins can manage questions" ON diamond_questions;
DROP POLICY IF EXISTS "Admins can manage used questions" ON used_questions;

-- Remove any tracking columns that might have been added
ALTER TABLE categories DROP COLUMN IF EXISTS created_by;
ALTER TABLE categories DROP COLUMN IF EXISTS updated_by;
ALTER TABLE categories DROP COLUMN IF EXISTS updated_at;

ALTER TABLE diamond_questions DROP COLUMN IF EXISTS created_by;
ALTER TABLE diamond_questions DROP COLUMN IF EXISTS updated_by;
ALTER TABLE diamond_questions DROP COLUMN IF EXISTS updated_at;

-- Verify tables are accessible
SELECT 'Core tables fixed successfully' as status;
SELECT COUNT(*) as category_count FROM categories;
SELECT COUNT(*) as question_count FROM diamond_questions;