-- Create media bucket for question media files
INSERT INTO storage.buckets (id, name, public) 
VALUES ('media', 'media', true)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policies for media bucket
CREATE POLICY "Public Access Media" ON storage.objects 
FOR SELECT USING (bucket_id = 'media');

CREATE POLICY "Authenticated users can upload media" ON storage.objects 
FOR INSERT WITH CHECK (bucket_id = 'media' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update media" ON storage.objects 
FOR UPDATE USING (bucket_id = 'media' AND auth.role() = 'authenticated');

CREATE POLICY "Users can delete media" ON storage.objects 
FOR DELETE USING (bucket_id = 'media' AND auth.role() = 'authenticated');