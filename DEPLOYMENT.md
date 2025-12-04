# Aurora Dashboard - Render Deployment Guide

## Prerequisites

1. **Supabase Project**: You need a Supabase project with the database schema set up
2. **Google Maps API Key**: For the Google Places Autocomplete feature
3. **VAPI API Key**: For AI agent creation (optional)
4. **GitHub Repository**: Your code should be pushed to GitHub

## Step 1: Set up Supabase

1. Go to [Supabase](https://supabase.com) and create a new project
2. Run the SQL schema from `supabase-schema.sql` in your Supabase SQL editor
3. Note down your project URL and anon key

## Step 2: Configure Supabase OAuth

1. In your Supabase dashboard, go to Authentication > URL Configuration
2. Add your Render URL to the redirect URLs:
   - `https://your-app-name.onrender.com/auth/callback` (for OAuth callback)
   - `https://your-app-name.onrender.com/dashboard` (for email magic links)
3. Add your domain to the site URL: `https://your-app-name.onrender.com`

## Step 3: Deploy to Render

1. Go to [Render](https://render.com) and sign up/login
2. Click "New +" and select "Web Service"
3. Connect your GitHub repository
4. Configure the service:
   - **Name**: `aurora-dashboard` (or your preferred name)
   - **Environment**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Plan**: Free (or paid if you need more resources)

## Step 4: Set Environment Variables

In your Render service dashboard, go to Environment and add:

```
NODE_ENV=production
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
VAPI_API_KEY=your_vapi_api_key
NEXT_PUBLIC_SITE_URL=https://your-app-name.onrender.com
```

## Step 5: Deploy

1. Click "Create Web Service"
2. Render will automatically build and deploy your application
3. Once deployed, your app will be available at `https://your-app-name.onrender.com`

## Troubleshooting

### Common Issues:

1. **Build Fails**: Check that all dependencies are in `package.json`
2. **Environment Variables**: Make sure all required env vars are set
3. **Supabase Connection**: Verify your Supabase URL and key are correct
4. **OAuth Redirects**: Ensure your Supabase redirect URLs match your Render URL

### Database Setup:

Make sure to run the SQL schema in your Supabase project:

```sql
-- Copy and paste the contents of supabase-schema.sql
-- into your Supabase SQL editor and run it
```

## Features Included:

- ✅ User authentication (Google OAuth + Magic Link)
- ✅ AI Receptionist creation and management
- ✅ Call logs and analytics
- ✅ Settings and configuration
- ✅ Responsive design with Aurora theme
- ✅ Session management with cookies

## Support

If you encounter any issues, check:
1. Render service logs
2. Supabase authentication logs
3. Browser console for client-side errors
