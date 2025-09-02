-- Create used_questions table to track question usage across games
CREATE TABLE IF NOT EXISTS used_questions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  question_id UUID REFERENCES diamond_questions(id) ON DELETE CASCADE,
  used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_used_questions_question_id ON used_questions(question_id);
CREATE INDEX IF NOT EXISTS idx_used_questions_used_at ON used_questions(used_at);