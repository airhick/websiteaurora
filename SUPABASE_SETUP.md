# Supabase Setup Guide for Aurora Dashboard

This guide will help you set up Supabase authentication and database for the Aurora Dashboard.

## 🔐 Authentication Flow

### How It Works:

1. **User Registration** (Google OAuth or Email/Password):
   - User credentials are securely stored in Supabase `auth.users` table
   - A customer record is automatically created in `customers` table via database trigger
   
2. **User Login** (Google OAuth or Email/Password):
   - Credentials are verified against Supabase `auth.users`
   - Customer record is verified/created if missing
   - Session token is generated and stored

3. **Session Management**:
   - Authentication state is managed globally via Zustand store
   - Sessions are automatically refreshed by Supabase
   - Customer data is linked to the authenticated user

## 📋 Step 1: Create Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Click "Start your project"
3. Create a new organization (if you don't have one)
4. Click "New Project"
5. Fill in:
   - **Project Name**: `aurora-dashboard` (or your preferred name)
   - **Database Password**: Create a strong password (save it securely!)
   - **Region**: Choose closest to your users
   - **Pricing Plan**: Free (or paid if needed)
6. Click "Create new project"
7. Wait 2-3 minutes for the project to be provisioned

## 📋 Step 2: Configure Environment Variables

1. In your Supabase project dashboard, go to **Settings** → **API**
2. Copy the following values:
   - **Project URL**
   - **anon/public key**

3. Create or update `.env.local` file in your project root:

```bash
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

## 📋 Step 3: Set Up Database Schema

1. In your Supabase dashboard, go to **SQL Editor**
2. Click **"New query"**
3. Copy the entire contents of `supabase-schema.sql` file
4. Paste it into the SQL editor
5. Click **"Run"** to execute the schema

This will create:
- `companies` table for business information
- `customers` table for user data (linked to auth.users)
- Database triggers to auto-create customer records
- Row Level Security (RLS) policies for data protection
- Indexes for better performance

## 📋 Step 4: Enable Authentication Providers

### Google OAuth (Recommended):

1. In Supabase dashboard, go to **Authentication** → **Providers**
2. Find **Google** and click to expand
3. Toggle **"Enable Sign in with Google"** to ON
4. Follow the instructions to create OAuth credentials:
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select existing
   - Enable Google+ API
   - Go to **Credentials** → **Create Credentials** → **OAuth 2.0 Client ID**
   - Application type: **Web application**
   - Authorized redirect URIs: Add your Supabase callback URL
     ```
     https://your-project-id.supabase.co/auth/v1/callback
     ```
5. Copy **Client ID** and **Client Secret** into Supabase
6. Click **Save**

### Email/Password Authentication:

1. In Supabase dashboard, go to **Authentication** → **Providers**
2. Find **Email** and click to expand
3. Toggle **"Enable Email provider"** to ON
4. Configure email settings:
   - **Enable email confirmations**: OFF (for development) or ON (for production)
   - **Enable email change confirmations**: ON (recommended)
   - **Secure email change**: ON (recommended)
5. Click **Save**

### Configure Email Templates (Optional but Recommended):

1. Go to **Authentication** → **Email Templates**
2. Customize templates for:
   - Confirmation email
   - Reset password email
   - Magic link email
3. Add your branding and company name

## 📋 Step 5: Configure URL Redirects

1. In Supabase dashboard, go to **Authentication** → **URL Configuration**
2. Add your Site URL:
   - **Development**: `http://localhost:8001`
   - **Production**: `https://yourdomain.com`
3. Add Redirect URLs:
   - `http://localhost:8001/auth/callback` (development)
   - `https://yourdomain.com/auth/callback` (production)
4. Click **Save**

## 📋 Step 6: Test Authentication

### Test Google OAuth:

1. Start your dev server: `npm run dev`
2. Visit `http://localhost:8001`
3. You'll see your landing page
4. Navigate to `/dashboard` (or click a link to dashboard)
5. Click "Sign In with Google"
6. Complete Google OAuth flow
7. You should be redirected to the dashboard

### Test Email/Password (if you want to add this feature):

The system is ready to support email/password auth. You can create a sign-up form using:

```typescript
import { useAuthStore } from '@/stores/auth-store'

function SignUpForm() {
  const { signUpWithEmail } = useAuthStore((state) => state.auth)
  
  const handleSubmit = async (e) => {
    e.preventDefault()
    const { error } = await signUpWithEmail(
      email,
      password,
      { first_name: firstName, last_name: lastName }
    )
    
    if (!error) {
      // Success! User is registered and logged in
    }
  }
  
  // ... rest of form
}
```

## 📋 Step 7: Verify Database Records

After a user signs in:

1. Go to **Table Editor** in Supabase dashboard
2. Check the `customers` table
3. You should see a record with:
   - `user_id`: Links to auth.users
   - `email`: User's email
   - `first_name`, `last_name`: From Google profile or form
   - `created_at`, `updated_at`: Timestamps

## 🔒 Security Features

### What's Protected:

1. **Row Level Security (RLS)**:
   - Users can only see their own data
   - Automatic filtering based on `auth.uid()`

2. **Automatic Customer Record Creation**:
   - Database trigger creates customer record on signup
   - Fallback verification in application code

3. **Secure Authentication**:
   - Passwords are hashed and never stored in plain text
   - OAuth tokens are securely managed by Supabase
   - Sessions use JWT tokens with automatic refresh

4. **API Security**:
   - Anonymous key only allows public operations
   - RLS policies enforce data isolation
   - Service role key (never exposed to client) for admin operations

## 📊 Database Schema Overview

```
auth.users (managed by Supabase)
├── id (UUID)
├── email
├── encrypted_password
├── email_confirmed_at
├── created_at
└── raw_user_meta_data (JSON)

public.customers (your app data)
├── id (UUID)
├── user_id (FK → auth.users.id)
├── email
├── first_name
├── last_name
├── phone
├── title
├── company_id (FK → companies.id)
├── business_url
├── crawled_content
└── crawled_at

public.companies
├── id (UUID)
├── name
├── website_url
├── business_description
├── crawled_content
└── crawled_at
```

## 🧪 Testing the Authentication Flow

### Manual Test:

1. Clear browser storage (Application → Clear storage)
2. Visit `http://localhost:8001`
3. You should see the landing page
4. Click link to dashboard
5. Sign in with Google (or email/password)
6. Check:
   - ✅ Redirected to dashboard after auth
   - ✅ User info displayed in profile dropdown
   - ✅ Customer record created in database
   - ✅ Can refresh page without losing session
   - ✅ Sign out works correctly

### Check Database:

```sql
-- See all authenticated users
SELECT * FROM auth.users;

-- See all customer records
SELECT * FROM public.customers;

-- See customers with their auth data (admin view only)
SELECT 
  c.*,
  u.email as auth_email,
  u.created_at as auth_created_at
FROM public.customers c
LEFT JOIN auth.users u ON c.user_id = u.id;
```

## 🚀 Production Checklist

Before deploying to production:

- [ ] Change database password from default
- [ ] Enable email confirmations
- [ ] Add production domain to URL configuration
- [ ] Set up custom email SMTP (not default Supabase emails)
- [ ] Enable MFA (Multi-Factor Authentication) if needed
- [ ] Set up database backups
- [ ] Configure rate limiting
- [ ] Review and test RLS policies
- [ ] Set up monitoring and alerts
- [ ] Add CSP headers for security

## 🐛 Troubleshooting

### "Invalid API key" error:
- Check that VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are correct
- Restart dev server after changing .env.local

### Google OAuth not working:
- Check redirect URI in Google Cloud Console matches Supabase
- Verify Google OAuth is enabled in Supabase
- Check browser console for specific errors

### Customer record not created:
- Check database trigger is created: `SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';`
- Check RLS policies allow insert: Test in SQL editor
- Look for errors in browser console

### Session not persisting:
- Check browser allows cookies
- Verify Supabase URL is correct
- Check for CORS issues in browser console

## 📚 Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Auth Guide](https://supabase.com/docs/guides/auth)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Google OAuth Setup](https://supabase.com/docs/guides/auth/social-login/auth-google)

---

## ✅ You're All Set!

Once you've completed all steps, your Aurora Dashboard will:
- ✅ Store user credentials securely in Supabase
- ✅ Verify credentials on every login
- ✅ Automatically create customer records
- ✅ Protect user data with RLS
- ✅ Support both Google OAuth and email/password auth

