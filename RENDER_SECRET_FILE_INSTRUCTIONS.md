# 🚀 Upload Secret File to Render - Step by Step

## Problem
You're seeing this error on your Render deployment:
```
Configuration Required
Configuration check timed out. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY
```

## Solution: Upload Secret File

Follow these exact steps to fix the issue:

---

## 📋 Step-by-Step Instructions

### Step 1: Copy the Environment Variables

Open the file `.env.render` in your project directory and copy its entire contents:

```
NEXT_PUBLIC_SUPABASE_URL=https://kqdiickzowoffpleavfh.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtxZGlpY2t6b3dvZmZwbGVhdmZoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA2MjIxODcsImV4cCI6MjA3NjE5ODE4N30.5GxQe8p97-CUV426zgHVI7EN5IlFTUJv0aKVXLNQsc8
```

### Step 2: Go to Render Dashboard

1. Open your browser and go to: https://dashboard.render.com
2. Log in to your Render account
3. Find and click on your **"aurora-dashboard"** service

### Step 3: Navigate to Environment Tab

1. Once you're in the service dashboard, look at the top navigation
2. Click on the **"Environment"** tab (next to "Settings", "Logs", etc.)

### Step 4: Add Secret File

1. Scroll down to the **"Secret Files"** section (it's below "Environment Variables")
2. Click the **"Add Secret File"** button
3. Fill in the form:
   - **Filename**: Enter exactly `.env` (including the dot)
   - **Contents**: Paste the contents you copied from Step 1
4. Click **"Save Changes"**

### Step 5: Redeploy Your Service

1. After saving, Render will show a banner at the top saying changes require a redeploy
2. Click the **"Manual Deploy"** button (or just click "Deploy latest commit")
3. Select **"Clear build cache & deploy"** (recommended)
4. Click **"Deploy"**

### Step 6: Wait for Deployment

1. Watch the deployment logs in real-time
2. Wait for the deployment to complete (usually 2-5 minutes)
3. Once you see "Build successful" and "Deploy live", your app is ready

### Step 7: Test Your Application

1. Go to your Render app URL: `https://aurora-dashboard.onrender.com`
2. Click on **"Sign in with Google"**
3. The error should be gone and you should be able to log in successfully! 🎉

---

## ✅ What This Does

- The `.env` secret file is automatically loaded by your Next.js app
- Render mounts this file at `/etc/secrets/.env`
- Your app reads these environment variables at build time and runtime
- The Supabase connection is now properly configured

---

## 🔐 Security Notes

- ✅ Secret Files are more secure than environment variables
- ✅ They are not visible in your service's environment variables list
- ✅ They are encrypted at rest
- ✅ `.env.render` is in your `.gitignore` so it won't be committed to Git

---

## 🐛 Troubleshooting

### Still seeing "Configuration Required" error?

1. **Check the filename**: Must be exactly `.env` (not `.env.local` or anything else)
2. **Check the contents**: Make sure both lines are copied correctly (no extra spaces)
3. **Wait for deployment**: The changes only take effect after a successful redeploy
4. **Clear browser cache**: Hard refresh your browser (Ctrl+Shift+R or Cmd+Shift+R)

### "Invalid Supabase URL" error?

- Double-check that the URL in the secret file is correct: `https://kqdiickzowoffpleavfh.supabase.co`
- Make sure there are no spaces or line breaks in the middle of the URL or key

### Google OAuth not working?

1. Go to your Supabase Dashboard
2. Navigate to Authentication > URL Configuration
3. Make sure your Render URL is in the allowed redirect URLs:
   - `https://aurora-dashboard.onrender.com/auth/callback`

---

## 📞 Need More Help?

- Check the Render logs for any error messages
- Verify your Supabase project is active and accessible
- Make sure the database schema has been applied (run `supabase-schema.sql`)

---

## ✨ You're All Set!

Once deployed successfully, your Aurora Dashboard will be fully functional on Render with proper Supabase integration.
