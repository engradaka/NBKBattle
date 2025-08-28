-- =====================================================
-- COMPLETE SUPABASE SETUP FOR QUIZ APP
-- Run this entire script in your Supabase SQL Editor
-- =====================================================

-- 1. CREATE TABLES
-- =====================================================

-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name_ar TEXT NOT NULL,
  name_en TEXT NOT NULL,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create questions table with media support
CREATE TABLE IF NOT EXISTS questions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  question_ar TEXT NOT NULL,
  question_en TEXT NOT NULL,
  answer_ar TEXT NOT NULL,
  answer_en TEXT NOT NULL,
  points INTEGER NOT NULL CHECK (points IN (200, 400, 600)),
  question_type TEXT DEFAULT 'text' CHECK (question_type IN ('text', 'video', 'image', 'audio')),
  media_url TEXT,
  media_duration INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create games table
CREATE TABLE IF NOT EXISTS games (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  team1_name TEXT NOT NULL,
  team2_name TEXT NOT NULL,
  team1_score INTEGER DEFAULT 0,
  team2_score INTEGER DEFAULT 0,
  current_team INTEGER DEFAULT 1 CHECK (current_team IN (1, 2)),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'finished')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create game_categories table (tracks which categories each team selected)
CREATE TABLE IF NOT EXISTS game_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  game_id UUID REFERENCES games(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  selected_by_team INTEGER CHECK (selected_by_team IN (1, 2)),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create game_questions table (tracks answered questions)
CREATE TABLE IF NOT EXISTS game_questions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  game_id UUID REFERENCES games(id) ON DELETE CASCADE,
  question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
  answered_by_team INTEGER CHECK (answered_by_team IN (1, 2, 0)), -- 0 means no one answered correctly
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. CREATE INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_questions_category_id ON questions(category_id);
CREATE INDEX IF NOT EXISTS idx_game_categories_game_id ON game_categories(game_id);
CREATE INDEX IF NOT EXISTS idx_game_questions_game_id ON game_questions(game_id);

-- 3. SETUP STORAGE
-- =====================================================

-- Create storage bucket for images and media
INSERT INTO storage.buckets (id, name, public) 
VALUES ('images', 'images', true)
ON CONFLICT (id) DO NOTHING;

-- Disable RLS on storage.objects to avoid upload issues
ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;

-- 4. SETUP AUTHENTICATION
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE games ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_questions ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users (admin access)
CREATE POLICY "Allow all for authenticated users" ON categories FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all for authenticated users" ON questions FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all for authenticated users" ON games FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all for authenticated users" ON game_categories FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all for authenticated users" ON game_questions FOR ALL USING (auth.role() = 'authenticated');

-- Allow anonymous users to read data for the quiz game
CREATE POLICY "Allow anonymous read" ON categories FOR SELECT USING (true);
CREATE POLICY "Allow anonymous read" ON questions FOR SELECT USING (true);
CREATE POLICY "Allow anonymous read" ON games FOR SELECT USING (true);
CREATE POLICY "Allow anonymous read" ON game_categories FOR SELECT USING (true);
CREATE POLICY "Allow anonymous read" ON game_questions FOR SELECT USING (true);

-- Allow anonymous users to insert/update game data
CREATE POLICY "Allow anonymous game operations" ON games FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous game operations" ON games FOR UPDATE USING (true);
CREATE POLICY "Allow anonymous game_categories operations" ON game_categories FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous game_questions operations" ON game_questions FOR INSERT WITH CHECK (true);

-- 5. SEED DATA (OPTIONAL)
-- =====================================================

-- Insert sample categories
INSERT INTO categories (name_ar, name_en, image_url) VALUES
('التاريخ', 'History', '/placeholder.svg'),
('العلوم', 'Science', '/placeholder.svg'),
('الرياضة', 'Sports', '/placeholder.svg'),
('الجغرافيا', 'Geography', '/placeholder.svg'),
('الأدب', 'Literature', '/placeholder.svg'),
('التكنولوجيا', 'Technology', '/placeholder.svg')
ON CONFLICT DO NOTHING;

-- Insert sample questions for History category
INSERT INTO questions (category_id, question_ar, question_en, answer_ar, answer_en, points, question_type)
SELECT 
  c.id,
  'متى تأسست الدولة السعودية الأولى؟',
  'When was the First Saudi State established?',
  '1744م',
  '1744 AD',
  200,
  'text'
FROM categories c WHERE c.name_en = 'History'
ON CONFLICT DO NOTHING;

INSERT INTO questions (category_id, question_ar, question_en, answer_ar, answer_en, points, question_type)
SELECT 
  c.id,
  'من هو أول خليفة راشدي؟',
  'Who was the first Rashidun Caliph?',
  'أبو بكر الصديق',
  'Abu Bakr Al-Siddiq',
  400,
  'text'
FROM categories c WHERE c.name_en = 'History'
ON CONFLICT DO NOTHING;

INSERT INTO questions (category_id, question_ar, question_en, answer_ar, answer_en, points, question_type)
SELECT 
  c.id,
  'متى وقعت معركة حطين؟',
  'When did the Battle of Hattin take place?',
  '1187م',
  '1187 AD',
  600,
  'text'
FROM categories c WHERE c.name_en = 'History'
ON CONFLICT DO NOTHING;

-- Insert sample questions for Science category
INSERT INTO questions (category_id, question_ar, question_en, answer_ar, answer_en, points, question_type)
SELECT 
  c.id,
  'ما هو الرمز الكيميائي للذهب؟',
  'What is the chemical symbol for gold?',
  'Au',
  'Au',
  200,
  'text'
FROM categories c WHERE c.name_en = 'Science'
ON CONFLICT DO NOTHING;

INSERT INTO questions (category_id, question_ar, question_en, answer_ar, answer_en, points, question_type)
SELECT 
  c.id,
  'ما هو أكبر كوكب في النظام الشمسي؟',
  'What is the largest planet in our solar system?',
  'المشتري',
  'Jupiter',
  400,
  'text'
FROM categories c WHERE c.name_en = 'Science'
ON CONFLICT DO NOTHING;

INSERT INTO questions (category_id, question_ar, question_en, answer_ar, answer_en, points, question_type)
SELECT 
  c.id,
  'من اكتشف البنسلين؟',
  'Who discovered penicillin?',
  'ألكسندر فليمنغ',
  'Alexander Fleming',
  600,
  'text'
FROM categories c WHERE c.name_en = 'Science'
ON CONFLICT DO NOTHING;