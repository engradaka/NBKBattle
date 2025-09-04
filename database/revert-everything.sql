-- REVERT EVERYTHING - Go back to working state

-- Drop admin tables if they exist
DROP TABLE IF EXISTS activity_logs CASCADE;
DROP TABLE IF EXISTS admin_requests CASCADE; 
DROP TABLE IF EXISTS admins CASCADE;

-- Make sure your core tables have no restrictions
ALTER TABLE categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE diamond_questions DISABLE ROW LEVEL SECURITY;
ALTER TABLE used_questions DISABLE ROW LEVEL SECURITY;

-- Verify your data is safe
SELECT 'REVERTED TO ORIGINAL STATE' as status;
SELECT COUNT(*) as categories_safe FROM categories;
SELECT COUNT(*) as questions_safe FROM diamond_questions;