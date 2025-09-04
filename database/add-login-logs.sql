-- Add login logs table to track admin sign-ins

CREATE TABLE IF NOT EXISTS login_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_email TEXT NOT NULL,
  login_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ip_address TEXT,
  user_agent TEXT,
  session_duration INTEGER, -- in minutes
  logout_time TIMESTAMP WITH TIME ZONE
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_login_logs_admin_email ON login_logs(admin_email);
CREATE INDEX IF NOT EXISTS idx_login_logs_login_time ON login_logs(login_time);

-- Verify table creation
SELECT 'Login logs table created successfully' as status;