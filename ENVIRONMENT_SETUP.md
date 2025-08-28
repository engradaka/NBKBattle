# Complete Setup Guide for Quiz App

## 1. Create New Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Create new project
3. Wait for project to be ready
4. Go to Settings → API
5. Copy your project URL and anon key

## 2. Run Database Setup

1. Go to SQL Editor in your Supabase dashboard
2. Copy and paste the entire content of `COMPLETE_SUPABASE_SETUP.sql`
3. Click "Run" to execute all commands

## 3. Create Admin User

1. Go to Authentication → Users in Supabase dashboard
2. Click "Add user"
3. Enter email and password for admin access
4. Click "Create user"

## 4. Environment Variables

Create `.env.local` file with:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 5. Deploy to Vercel

1. Push code to GitHub repository
2. Go to [vercel.com](https://vercel.com)
3. Import your GitHub repository
4. Add environment variables in Vercel dashboard:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
5. Deploy

## 6. Features Included

### Database Tables:
- `categories` - Quiz categories with Arabic/English names
- `questions` - Questions with multiple types (text, video, image, audio)
- `games` - Game sessions with team scores
- `game_categories` - Track selected categories per team
- `game_questions` - Track answered questions

### Question Types:
- **Text** - Traditional text questions
- **Video** - Video clips with questions
- **Image** - Image-based questions
- **Audio** - Audio/lyrics questions

### Storage:
- File uploads for category images and question media
- RLS disabled for easy uploads

### Authentication:
- Admin login for dashboard access
- Anonymous access for quiz gameplay

## 7. Admin Access

- Login URL: `your-domain.com/login`
- Dashboard URL: `your-domain.com/dashboard`
- Use the admin credentials you created in step 3

## 8. File Structure

```
/app
  /dashboard - Admin panel
  /login - Admin login
  /game - Quiz gameplay
  /category-selection - Category selection
  /team-setup - Team setup
  /results - Game results
/lib
  /supabase.ts - Database client
/scripts
  /COMPLETE_SUPABASE_SETUP.sql - Complete database setup
```

That's it! Your quiz app should be fully functional with file uploads, multiple question types, and proper authentication.