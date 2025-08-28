-- Add description columns to categories table
ALTER TABLE categories 
ADD COLUMN description_ar TEXT,
ADD COLUMN description_en TEXT;

-- Update existing categories with sample descriptions (optional)
UPDATE categories 
SET 
  description_ar = 'وصف تفصيلي لهذه الفئة من الأسئلة المثيرة والمفيدة',
  description_en = 'Detailed description of this exciting and useful question category'
WHERE description_ar IS NULL OR description_en IS NULL;