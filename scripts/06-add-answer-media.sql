-- Add answer media support to diamond_questions table
ALTER TABLE diamond_questions 
ADD COLUMN IF NOT EXISTS answer_type TEXT DEFAULT 'text' CHECK (answer_type IN ('text', 'video', 'image', 'audio'));

ALTER TABLE diamond_questions 
ADD COLUMN IF NOT EXISTS answer_media_url TEXT;

ALTER TABLE diamond_questions 
ADD COLUMN IF NOT EXISTS answer_media_duration INTEGER;

-- Update existing questions to have 'text' answer type
UPDATE diamond_questions SET answer_type = 'text' WHERE answer_type IS NULL;