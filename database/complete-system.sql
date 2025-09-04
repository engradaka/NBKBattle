-- COMPLETE QUIZ SYSTEM DATABASE SETUP
-- Run this entire script in Supabase SQL Editor

-- =============================================
-- 1. CORE TABLES (Categories and Questions)
-- =============================================

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name_ar TEXT NOT NULL,
  name_en TEXT NOT NULL,
  description_ar TEXT,
  description_en TEXT,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by TEXT,
  updated_by TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Diamond questions table
CREATE TABLE IF NOT EXISTS diamond_questions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  question_ar TEXT NOT NULL,
  question_en TEXT NOT NULL,
  answer_ar TEXT NOT NULL,
  answer_en TEXT NOT NULL,
  diamonds INTEGER NOT NULL CHECK (diamonds IN (10, 25, 50, 75, 100)),
  question_type TEXT DEFAULT 'text' CHECK (question_type IN ('text', 'image', 'video', 'audio')),
  media_url TEXT,
  media_duration INTEGER,
  answer_type TEXT DEFAULT 'text' CHECK (answer_type IN ('text', 'image', 'video', 'audio')),
  answer_media_url TEXT,
  answer_media_duration INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by TEXT,
  updated_by TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Used questions tracking
CREATE TABLE IF NOT EXISTS used_questions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  question_id UUID REFERENCES diamond_questions(id) ON DELETE CASCADE,
  used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- 2. ADMIN SYSTEM TABLES
-- =============================================

-- Admins table
CREATE TABLE IF NOT EXISTS admins (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('master_admin', 'admin')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Admin requests table
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

-- Activity logs table
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

-- =============================================
-- 3. ADD MISSING COLUMNS TO EXISTING TABLES
-- =============================================

DO $$ 
BEGIN
    -- Add tracking columns to categories if they don't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='categories' AND column_name='created_by') THEN
        ALTER TABLE categories ADD COLUMN created_by TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='categories' AND column_name='updated_by') THEN
        ALTER TABLE categories ADD COLUMN updated_by TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='categories' AND column_name='updated_at') THEN
        ALTER TABLE categories ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;

    -- Add tracking columns to diamond_questions if they don't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='diamond_questions' AND column_name='created_by') THEN
        ALTER TABLE diamond_questions ADD COLUMN created_by TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='diamond_questions' AND column_name='updated_by') THEN
        ALTER TABLE diamond_questions ADD COLUMN updated_by TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='diamond_questions' AND column_name='updated_at') THEN
        ALTER TABLE diamond_questions ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
END $$;

-- =============================================
-- 4. INSERT MASTER ADMIN (REPLACE EMAIL!)
-- =============================================

-- IMPORTANT: Replace 'your-email@example.com' with your actual email
INSERT INTO admins (email, role, status) 
VALUES ('your-email@example.com', 'master_admin', 'active')
ON CONFLICT (email) DO UPDATE SET 
  role = 'master_admin',
  status = 'active';

-- =============================================
-- 5. ROW LEVEL SECURITY (RLS) SETUP
-- =============================================

-- Enable RLS on admin tables
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- Enable RLS on core tables (optional but recommended)
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE diamond_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE used_questions ENABLE ROW LEVEL SECURITY;

-- =============================================
-- 6. RLS POLICIES
-- =============================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admins can view all admins" ON admins;
DROP POLICY IF EXISTS "Master admin can manage admins" ON admins;
DROP POLICY IF EXISTS "Anyone can create admin requests" ON admin_requests;
DROP POLICY IF EXISTS "Master admin can view all requests" ON admin_requests;
DROP POLICY IF EXISTS "Master admin can update requests" ON admin_requests;
DROP POLICY IF EXISTS "Admins can view activity logs" ON activity_logs;
DROP POLICY IF EXISTS "Admins can manage categories" ON categories;
DROP POLICY IF EXISTS "Admins can manage questions" ON diamond_questions;
DROP POLICY IF EXISTS "Admins can manage used questions" ON used_questions;

-- Admin table policies
CREATE POLICY "Admins can view all admins" ON admins
  FOR SELECT USING (auth.jwt() ->> 'email' IN (SELECT email FROM admins WHERE status = 'active'));

CREATE POLICY "Master admin can manage admins" ON admins
  FOR ALL USING (auth.jwt() ->> 'email' IN (SELECT email FROM admins WHERE role = 'master_admin' AND status = 'active'));

-- Admin requests policies
CREATE POLICY "Anyone can create admin requests" ON admin_requests
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Master admin can view all requests" ON admin_requests
  FOR SELECT USING (auth.jwt() ->> 'email' IN (SELECT email FROM admins WHERE role = 'master_admin' AND status = 'active'));

CREATE POLICY "Master admin can update requests" ON admin_requests
  FOR UPDATE USING (auth.jwt() ->> 'email' IN (SELECT email FROM admins WHERE role = 'master_admin' AND status = 'active'));

-- Activity logs policies
CREATE POLICY "Master admin can view activity logs" ON activity_logs
  FOR SELECT USING (auth.jwt() ->> 'email' IN (SELECT email FROM admins WHERE role = 'master_admin' AND status = 'active'));

CREATE POLICY "System can insert activity logs" ON activity_logs
  FOR INSERT WITH CHECK (true);

-- Core tables policies (allow all admins to manage)
CREATE POLICY "Admins can manage categories" ON categories
  FOR ALL USING (auth.jwt() ->> 'email' IN (SELECT email FROM admins WHERE status = 'active'));

CREATE POLICY "Admins can manage questions" ON diamond_questions
  FOR ALL USING (auth.jwt() ->> 'email' IN (SELECT email FROM admins WHERE status = 'active'));

CREATE POLICY "Admins can manage used questions" ON used_questions
  FOR ALL USING (auth.jwt() ->> 'email' IN (SELECT email FROM admins WHERE status = 'active'));

-- =============================================
-- 7. INDEXES FOR PERFORMANCE
-- =============================================

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_diamond_questions_category_id ON diamond_questions(category_id);
CREATE INDEX IF NOT EXISTS idx_diamond_questions_diamonds ON diamond_questions(diamonds);
CREATE INDEX IF NOT EXISTS idx_used_questions_question_id ON used_questions(question_id);
CREATE INDEX IF NOT EXISTS idx_used_questions_used_at ON used_questions(used_at);
CREATE INDEX IF NOT EXISTS idx_activity_logs_admin_email ON activity_logs(admin_email);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_admins_email ON admins(email);
CREATE INDEX IF NOT EXISTS idx_admin_requests_email ON admin_requests(email);
CREATE INDEX IF NOT EXISTS idx_admin_requests_status ON admin_requests(status);

-- =============================================
-- 8. VERIFICATION QUERIES
-- =============================================

-- Check if everything was created successfully
SELECT 'Tables created successfully' as status;
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('categories', 'diamond_questions', 'used_questions', 'admins', 'admin_requests', 'activity_logs');
SELECT 'Master admin added:' as status, email, role FROM admins WHERE role = 'master_admin';