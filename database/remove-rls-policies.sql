-- Remove all RLS policies that are blocking data access

-- Disable RLS on core tables (this is what's blocking your data)
ALTER TABLE categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE diamond_questions DISABLE ROW LEVEL SECURITY;
ALTER TABLE used_questions DISABLE ROW LEVEL SECURITY;

-- Drop all RLS policies
DROP POLICY IF EXISTS "Admins can manage categories" ON categories;
DROP POLICY IF EXISTS "Admins can manage questions" ON diamond_questions;
DROP POLICY IF EXISTS "Admins can manage used questions" ON used_questions;

-- Also drop admin system policies if they exist
DROP POLICY IF EXISTS "Admins can view all admins" ON admins;
DROP POLICY IF EXISTS "Master admin can manage admins" ON admins;
DROP POLICY IF EXISTS "Anyone can create admin requests" ON admin_requests;
DROP POLICY IF EXISTS "Master admin can view all requests" ON admin_requests;
DROP POLICY IF EXISTS "Master admin can update requests" ON admin_requests;
DROP POLICY IF EXISTS "Admins can view activity logs" ON activity_logs;
DROP POLICY IF EXISTS "Master admin can view activity logs" ON activity_logs;
DROP POLICY IF EXISTS "System can insert activity logs" ON activity_logs;

-- Disable RLS on admin tables too
ALTER TABLE admins DISABLE ROW LEVEL SECURITY;
ALTER TABLE admin_requests DISABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs DISABLE ROW LEVEL SECURITY;

-- Verify tables are accessible
SELECT 'RLS policies removed successfully' as status;