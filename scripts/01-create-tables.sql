-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name_ar TEXT NOT NULL,
  name_en TEXT NOT NULL,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create questions table
CREATE TABLE IF NOT EXISTS questions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  question_ar TEXT NOT NULL,
  question_en TEXT NOT NULL,
  answer_ar TEXT NOT NULL,
  answer_en TEXT NOT NULL,
  points INTEGER NOT NULL CHECK (points IN (200, 400, 600)),
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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_questions_category_id ON questions(category_id);
CREATE INDEX IF NOT EXISTS idx_game_categories_game_id ON game_categories(game_id);
CREATE INDEX IF NOT EXISTS idx_game_questions_game_id ON game_questions(game_id);
