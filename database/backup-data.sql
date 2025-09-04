-- BACKUP YOUR DATA - Run this first to save your work

-- Export categories
SELECT 'CATEGORIES BACKUP:' as backup_type;
SELECT * FROM categories ORDER BY created_at;

-- Export questions  
SELECT 'QUESTIONS BACKUP:' as backup_type;
SELECT * FROM diamond_questions ORDER BY created_at;

-- Count verification
SELECT 
  'DATA SUMMARY:' as summary,
  (SELECT COUNT(*) FROM categories) as total_categories,
  (SELECT COUNT(*) FROM diamond_questions) as total_questions;

-- Save this output to a file for safety!