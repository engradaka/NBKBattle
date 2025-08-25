-- Add new columns to questions table for different question types
ALTER TABLE questions 
ADD COLUMN IF NOT EXISTS question_type TEXT DEFAULT 'text' CHECK (question_type IN ('text', 'video', 'image', 'audio'));

ALTER TABLE questions 
ADD COLUMN IF NOT EXISTS media_url TEXT;

ALTER TABLE questions 
ADD COLUMN IF NOT EXISTS media_duration INTEGER; -- for video/audio duration in seconds

-- Update existing questions to have 'text' type
UPDATE questions SET question_type = 'text' WHERE question_type IS NULL;