-- Admin system database setup

-- 1. Create admins table
CREATE TABLE admins (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('master_admin', 'admin')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- 2. Create admin requests table
CREATE TABLE admin_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by UUID REFERENCES auth.users(id)
);

-- 3. Create activity logs table
CREATE TABLE activity_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_email TEXT NOT NULL,
  action TEXT NOT NULL, -- 'create', 'update', 'delete'
  resource_type TEXT NOT NULL, -- 'category', 'question'
  resource_id TEXT NOT NULL,
  resource_name TEXT NOT NULL,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Add tracking columns to existing tables
ALTER TABLE categories 
ADD COLUMN created_by TEXT,
ADD COLUMN updated_by TEXT,
ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

ALTER TABLE diamond_questions 
ADD COLUMN created_by TEXT,
ADD COLUMN updated_by TEXT,
ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 5. Insert master admin (replace with your email)
INSERT INTO admins (email, role, status) 
VALUES ('your-email@example.com', 'master_admin', 'active');

-- 6. Enable RLS (Row Level Security)
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- 7. Create RLS policies
CREATE POLICY "Admins can view all admins" ON admins
  FOR SELECT USING (auth.jwt() ->> 'email' IN (SELECT email FROM admins WHERE status = 'active'));

CREATE POLICY "Master admin can manage admins" ON admins
  FOR ALL USING (auth.jwt() ->> 'email' IN (SELECT email FROM admins WHERE role = 'master_admin'));

CREATE POLICY "Anyone can create admin requests" ON admin_requests
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Master admin can view all requests" ON admin_requests
  FOR SELECT USING (auth.jwt() ->> 'email' IN (SELECT email FROM admins WHERE role = 'master_admin'));

CREATE POLICY "Master admin can update requests" ON admin_requests
  FOR UPDATE USING (auth.jwt() ->> 'email' IN (SELECT email FROM admins WHERE role = 'master_admin'));

CREATE POLICY "Admins can view activity logs" ON activity_logs
  FOR SELECT USING (auth.jwt() ->> 'email' IN (SELECT email FROM admins WHERE status = 'active'));