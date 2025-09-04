-- Admin system database setup (Fixed version)

-- 1. Create admins table
CREATE TABLE IF NOT EXISTS admins (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('master_admin', 'admin')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- 2. Create admin requests table
CREATE TABLE IF NOT EXISTS admin_requests (
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
CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_email TEXT NOT NULL,
  action TEXT NOT NULL, -- 'create', 'update', 'delete'
  resource_type TEXT NOT NULL, -- 'category', 'question'
  resource_id TEXT NOT NULL,
  resource_name TEXT NOT NULL,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Add tracking columns to existing tables (only if they don't exist)
DO $$ 
BEGIN
    -- Add columns to categories table
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='categories' AND column_name='created_by') THEN
        ALTER TABLE categories ADD COLUMN created_by TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='categories' AND column_name='updated_by') THEN
        ALTER TABLE categories ADD COLUMN updated_by TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='categories' AND column_name='updated_at') THEN
        ALTER TABLE categories ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;

    -- Add columns to diamond_questions table
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='diamond_questions' AND column_name='created_by') THEN
        ALTER TABLE diamond_questions ADD COLUMN created_by TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='diamond_questions' AND column_name='updated_by') THEN
        ALTER TABLE diamond_questions ADD COLUMN updated_by TEXT;
    END IF;
    
    -- Only add updated_at if it doesn't exist (this was causing the error)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='diamond_questions' AND column_name='updated_at') THEN
        ALTER TABLE diamond_questions ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
END $$;

-- 5. Insert master admin (replace with your email) - only if not exists
INSERT INTO admins (email, role, status) 
VALUES ('your-email@example.com', 'master_admin', 'active')
ON CONFLICT (email) DO NOTHING;

-- 6. Enable RLS (Row Level Security)
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- 7. Drop existing policies if they exist, then create new ones
DROP POLICY IF EXISTS "Admins can view all admins" ON admins;
DROP POLICY IF EXISTS "Master admin can manage admins" ON admins;
DROP POLICY IF EXISTS "Anyone can create admin requests" ON admin_requests;
DROP POLICY IF EXISTS "Master admin can view all requests" ON admin_requests;
DROP POLICY IF EXISTS "Master admin can update requests" ON admin_requests;
DROP POLICY IF EXISTS "Admins can view activity logs" ON activity_logs;

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