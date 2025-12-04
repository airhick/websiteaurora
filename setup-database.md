# Database Setup Instructions

## Quick Setup for Aurora Dashboard

To fix the 404 errors you're seeing, you need to create the database tables in your Supabase project.

### Option 1: Use Supabase SQL Editor (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor** in the left sidebar
3. Copy and paste the entire contents of `supabase-schema.sql` into the editor
4. Click **Run** to execute the SQL

### Option 2: Run the Schema File

The `supabase-schema.sql` file contains all the necessary tables and policies. This will create:

- `organizations` - For managing business organizations
- `user_profiles` - For user profile information
- `receptionist_settings` - For AI agent configuration
- `call_logs` - For storing call history
- `daily_metrics` - For caching daily statistics
- Row Level Security (RLS) policies for data protection

### What This Fixes

After running the schema, you'll no longer see these 404 errors:
- `user_profiles` table not found
- `daily_metrics` table not found  
- `call_logs` table not found
- `receptionist_settings` table not found

### After Setup

Once the database is set up:
1. The dashboard will load properly with default values
2. User profiles will be created automatically on login
3. The green dot indicator will show in the top right
4. OAuth redirect will work correctly

### Testing

After running the schema:
1. Try logging in with Google OAuth
2. You should be redirected to `/dashboard`
3. The dashboard should load without 404 errors
4. You should see a green dot next to your profile picture
