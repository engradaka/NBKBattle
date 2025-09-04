-- SAFE ADMIN SYSTEM SETUP
-- This will NOT touch your existing categories or questions data

-- Step 1: Create admin tables (separate from your data)
CREATE TABLE IF NOT EXISTS admins (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('master_admin', 'admin')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS admin_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by TEXT
);

CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_email TEXT NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('create', 'update', 'delete')),
  resource_type TEXT NOT NULL CHECK (resource_type IN ('category', 'question')),
  resource_id TEXT NOT NULL,
  resource_name TEXT NOT NULL,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 2: Add you as master admin
INSERT INTO admins (email, role, status) 
VALUES ('engradaka@gmail.com', 'master_admin', 'active')
ON CONFLICT (email) DO UPDATE SET 
  role = 'master_admin',
  status = 'active';

-- Step 3: Enable RLS ONLY on admin tables (NOT on your data tables)
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- Step 4: Create policies ONLY for admin tables
CREATE POLICY "Master admin can manage admins" ON admins
  FOR ALL USING (auth.jwt() ->> 'email' = 'engradaka@gmail.com');

CREATE POLICY "Anyone can create admin requests" ON admin_requests
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Master admin can manage requests" ON admin_requests
  FOR ALL USING (auth.jwt() ->> 'email' = 'engradaka@gmail.com');

CREATE POLICY "Master admin can view activity logs" ON activity_logs
  FOR SELECT USING (auth.jwt() ->> 'email' = 'engradaka@gmail.com');

CREATE POLICY "System can insert activity logs" ON activity_logs
  FOR INSERT WITH CHECK (true);

-- Step 5: Verification (your data should be untouched)
SELECT 'ADMIN SYSTEM CREATED SUCCESSFULLY' as status;
SELECT 'Master admin:' as info, email, role FROM admins WHERE role = 'master_admin';
SELECT 'Your categories are safe:' as info, COUNT(*) as count FROM categories;
SELECT 'Your questions are safe:' as info, COUNT(*) as count FROM diamond_questions;