# Render Deployment Setup

## ⚠️ IMPORTANT: Use Environment Variables (NOT Secret Files!)

**For Next.js `NEXT_PUBLIC_*` variables, you MUST use Environment Variables, NOT Secret Files.**

Secret Files don't work because Next.js needs these variables at BUILD TIME, but Secret Files are only available at RUNTIME.

---

## 🚀 Quick Setup (CORRECT METHOD)

### Step 1: Add Environment Variables in Render

1. Go to your [Render Dashboard](https://dashboard.render.com)
2. Select your `aurora-dashboard` service
3. Navigate to the **"Environment"** tab
4. Find the **"Environment Variables"** section (at the top)
5. Click **"Add Environment Variable"** and add each of these:

### Required Environment Variables (Add These Now)

**Variable 1:**
- **Key**: `NEXT_PUBLIC_SUPABASE_URL`
- **Value**: `https://kqdiickzowoffpleavfh.supabase.co`

**Variable 2:**
- **Key**: `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **Value**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtxZGlpY2t6b3dvZmZwbGVhdmZoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA2MjIxODcsImV4cCI6MjA3NjE5ODE4N30.5GxQe8p97-CUV426zgHVI7EN5IlFTUJv0aKVXLNQsc8`

**Variable 3:**
- **Key**: `NEXT_PUBLIC_SITE_URL`
- **Value**: `https://aurora-dashboard.onrender.com`

### Optional Environment Variables

**Variable 4 (Optional):**
- **Key**: `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`
- **Value**: Your Google Maps API key (for Places integration)

**Variable 5 (Optional):**
- **Key**: `VAPI_API_KEY`
- **Value**: Your Vapi API key (for AI receptionist)

**Variable 6 (Optional):**
- **Key**: `N8N_WEBHOOK_URL`
- **Value**: Your n8n webhook URL (for workflow automation)

### Step 2: Save and Redeploy

1. Click **"Save Changes"** at the bottom
2. Click **"Manual Deploy"** (top right)
3. Select **"Clear build cache & deploy"** (recommended)
4. Wait 3-5 minutes for deployment to complete
5. Test your app at https://aurora-dashboard.onrender.com

---

## 🔐 Security Notes

- **For `NEXT_PUBLIC_*` variables**: Must use Environment Variables (they're embedded in the client-side JavaScript anyway)
- **For sensitive API keys**: Use Environment Variables or Secret Files (both work at runtime)
- **Secret Files vs Environment Variables**: 
  - Secret Files = Runtime only (not available during build)
  - Environment Variables = Build time + Runtime
- Never commit `.env.render` or `.env.local` to your repository (they're in .gitignore)
- Only use the `anon` key in the frontend (never use `service_role` key in client-side code)

---

## 📦 Files Included for Render

- `.env.render` - Secret file template with your Supabase credentials
- `render.yaml` - Render service configuration

---

## 🧪 Testing After Deployment

After setting up and redeploying:

1. ✅ **OAuth Login**: Test Google sign-in flow
2. ✅ **Dashboard**: Verify metrics and data load correctly
3. ✅ **Database**: Ensure user profiles are created in Supabase
4. ✅ **API Routes**: Test agent creation and call logging

---

## 🐛 Troubleshooting

### "Configuration Required" Error

If you see this error:
- Verify the Secret File was uploaded correctly
- Check the filename is exactly `.env` (not `.env.local`)
- Ensure the file contents match the format in `.env.render`
- Redeploy after making changes

### Database Connection Issues

- Verify Supabase URL and key are correct
- Check that your Supabase project is active
- Ensure RLS policies are properly configured

### OAuth Not Working

- Check that redirect URLs are configured in Supabase
- Verify `NEXT_PUBLIC_SITE_URL` matches your Render URL
- Ensure Google OAuth is enabled in Supabase
