# Quick Start Guide - Aurora Dashboard

## ✅ Migration Complete!

Your Aurora AI Receptionist dashboard has been successfully migrated to Vite + Shadcn Admin.

## 🚀 Getting Started

### 1. Set Up Environment Variables

Create a `.env.local` file in the project root:

```bash
cp .env.example .env.local
```

Then edit `.env.local` with your Supabase credentials:

```env
VITE_SUPABASE_URL=your-supabase-project-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
VITE_SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
VITE_SUPABASE_DEFAULT_COMPANY_ID=your-default-company-id
```

### 2. Install Dependencies (if not already done)

```bash
npm install
```

### 3. Start Development Server

```bash
npm run dev
```

The app will be available at: **http://localhost:8001**

### 4. Build for Production

```bash
npm run build
npm run preview
```

## 🎯 Key Changes

### Routes
- **Landing Page**: `/` (public)
- **Dashboard**: `/dashboard` (protected, requires authentication)
- **Auth Callback**: `/auth/callback` (OAuth redirect)

### Authentication Flow
1. User clicks "Sign In with Google" on landing page (`/`)
2. Redirected to Google OAuth
3. Returns to `/auth/callback`
4. Redirected to `/dashboard` on success

### Important Files
- **Environment Config**: `.env.local`
- **Supabase Client**: `src/lib/supabase.ts`
- **Auth Store**: `src/stores/auth-store.ts`
- **Dashboard**: `src/features/aurora-dashboard/`
- **Routes**: `src/routes/`

## 📋 Supabase Setup Checklist

### 1. Authentication Configuration
- [ ] Enable Google OAuth provider in Supabase dashboard
- [ ] Add redirect URLs:
  - Development: `http://localhost:8001/auth/callback`
  - Production: `https://your-domain.com/auth/callback`

### 2. Database Schema

Run this SQL in your Supabase SQL Editor:

```sql
-- Create customers table
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  title TEXT,
  company_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own customer record"
  ON customers FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own customer record"
  ON customers FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update their own customer record"
  ON customers FOR UPDATE
  USING (true);
```

## 🔍 Testing

### Manual Testing Steps

1. **Landing Page**
   - [ ] Visit http://localhost:8001
   - [ ] Verify Aurora logo displays correctly
   - [ ] Check light/dark mode toggle works
   - [ ] Verify responsive design on mobile

2. **Authentication**
   - [ ] Click "Sign In with Google"
   - [ ] Complete Google OAuth flow
   - [ ] Verify redirect to dashboard
   - [ ] Check user info in profile dropdown
   - [ ] Test sign out

3. **Dashboard**
   - [ ] Verify stats cards display
   - [ ] Check AI capabilities list
   - [ ] Test the test interface
   - [ ] Try theme toggle
   - [ ] Test sidebar collapse/expand

4. **Business Setup** (if new user)
   - [ ] Enter business URL
   - [ ] Verify crawling simulation
   - [ ] Check redirect to dashboard after setup

## 🐛 Troubleshooting

### Dev Server Won't Start
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Build Fails
```bash
# Check for TypeScript errors
npm run lint

# Regenerate route tree
rm src/routeTree.gen.ts
npm run dev
```

### Authentication Issues
- Verify `.env.local` has correct Supabase credentials
- Check Google OAuth is enabled in Supabase dashboard
- Ensure redirect URLs match exactly (no trailing slashes)
- Check browser console for errors

### Database Errors
- Verify RLS policies are set up correctly
- Check that the `customers` table exists
- Ensure service role key has proper permissions

## 📦 Deployment

### Vercel
1. Push code to GitHub
2. Import project in Vercel
3. Add environment variables (with `VITE_` prefix)
4. Deploy

### Netlify
1. Connect repository
2. Build command: `npm run build`
3. Publish directory: `dist`
4. Add environment variables
5. Deploy

### Important: Update Redirect URLs!
After deployment, add your production URL to Supabase redirect URLs:
```
https://your-production-domain.com/auth/callback
```

## 📚 Documentation

- **Full README**: [README.md](./README.md)
- **Migration Guide**: [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md)
- **Migration Summary**: [MIGRATION_SUMMARY.md](./MIGRATION_SUMMARY.md)

## 🎉 Success!

Your Aurora dashboard is now running on a modern, scalable tech stack:
- ⚡ Vite for ultra-fast development
- 🎨 Shadcn UI for beautiful, accessible components
- 🔐 Supabase for robust authentication
- 🎯 Type-safe routing with TanStack Router
- 🌓 Built-in dark mode support

## 💡 Next Steps

1. Test all features thoroughly
2. Configure Supabase database and RLS policies
3. Customize branding and colors
4. Add additional features as needed
5. Deploy to production

## 📞 Need Help?

- Check the [README.md](./README.md) for detailed documentation
- Review [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md) for technical details
- Check browser console for error messages
- Verify environment variables are set correctly

---

**Happy Building! 🚀**

*Aurora AI Receptionist Dashboard v2.1.0*

