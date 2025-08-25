-- Insert sample categories
INSERT INTO categories (name_ar, name_en, image_url) VALUES
('التاريخ', 'History', '/placeholder.svg?height=200&width=200'),
('العلوم', 'Science', '/placeholder.svg?height=200&width=200'),
('الرياضة', 'Sports', '/placeholder.svg?height=200&width=200'),
('الجغرافيا', 'Geography', '/placeholder.svg?height=200&width=200'),
('الأدب', 'Literature', '/placeholder.svg?height=200&width=200'),
('التكنولوجيا', 'Technology', '/placeholder.svg?height=200&width=200');

-- Insert sample questions for History category
INSERT INTO questions (category_id, question_ar, question_en, answer_ar, answer_en, points)
SELECT 
  c.id,
  'متى تأسست الدولة السعودية الأولى؟',
  'When was the First Saudi State established?',
  '1744م',
  '1744 AD',
  200
FROM categories c WHERE c.name_en = 'History';

INSERT INTO questions (category_id, question_ar, question_en, answer_ar, answer_en, points)
SELECT 
  c.id,
  'من هو أول خليفة راشدي؟',
  'Who was the first Rashidun Caliph?',
  'أبو بكر الصديق',
  'Abu Bakr Al-Siddiq',
  200
FROM categories c WHERE c.name_en = 'History';

INSERT INTO questions (category_id, question_ar, question_en, answer_ar, answer_en, points)
SELECT 
  c.id,
  'في أي عام سقطت الدولة العثمانية؟',
  'In which year did the Ottoman Empire fall?',
  '1922م',
  '1922 AD',
  400
FROM categories c WHERE c.name_en = 'History';

INSERT INTO questions (category_id, question_ar, question_en, answer_ar, answer_en, points)
SELECT 
  c.id,
  'من هو قائد الفتح الإسلامي لمصر؟',
  'Who led the Islamic conquest of Egypt?',
  'عمرو بن العاص',
  'Amr ibn al-As',
  400
FROM categories c WHERE c.name_en = 'History';

INSERT INTO questions (category_id, question_ar, question_en, answer_ar, answer_en, points)
SELECT 
  c.id,
  'متى وقعت معركة حطين؟',
  'When did the Battle of Hattin take place?',
  '1187م',
  '1187 AD',
  600
FROM categories c WHERE c.name_en = 'History';

INSERT INTO questions (category_id, question_ar, question_en, answer_ar, answer_en, points)
SELECT 
  c.id,
  'من هو مؤسس الدولة الأموية؟',
  'Who founded the Umayyad Caliphate?',
  'معاوية بن أبي سفيان',
  'Muawiya ibn Abi Sufyan',
  600
FROM categories c WHERE c.name_en = 'History';

-- Insert sample questions for Science category
INSERT INTO questions (category_id, question_ar, question_en, answer_ar, answer_en, points)
SELECT 
  c.id,
  'ما هو الرمز الكيميائي للذهب؟',
  'What is the chemical symbol for gold?',
  'Au',
  'Au',
  200
FROM categories c WHERE c.name_en = 'Science';

INSERT INTO questions (category_id, question_ar, question_en, answer_ar, answer_en, points)
SELECT 
  c.id,
  'كم عدد عظام جسم الإنسان البالغ؟',
  'How many bones are in an adult human body?',
  '206',
  '206',
  200
FROM categories c WHERE c.name_en = 'Science';

INSERT INTO questions (category_id, question_ar, question_en, answer_ar, answer_en, points)
SELECT 
  c.id,
  'ما هو أسرع حيوان في العالم؟',
  'What is the fastest animal in the world?',
  'الفهد',
  'Cheetah',
  400
FROM categories c WHERE c.name_en = 'Science';

INSERT INTO questions (category_id, question_ar, question_en, answer_ar, answer_en, points)
SELECT 
  c.id,
  'ما هو أكبر كوكب في النظام الشمسي؟',
  'What is the largest planet in our solar system?',
  'المشتري',
  'Jupiter',
  400
FROM categories c WHERE c.name_en = 'Science';

INSERT INTO questions (category_id, question_ar, question_en, answer_ar, answer_en, points)
SELECT 
  c.id,
  'من اكتشف البنسلين؟',
  'Who discovered penicillin?',
  'ألكسندر فليمنغ',
  'Alexander Fleming',
  600
FROM categories c WHERE c.name_en = 'Science';

INSERT INTO questions (category_id, question_ar, question_en, answer_ar, answer_en, points)
SELECT 
  c.id,
  'ما هي وحدة قياس القوة؟',
  'What is the unit of measurement for force?',
  'نيوتن',
  'Newton',
  600
FROM categories c WHERE c.name_en = 'Science';
