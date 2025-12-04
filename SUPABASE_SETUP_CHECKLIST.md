# Supabase Setup Checklist for Google OAuth

Follow these steps **IN ORDER** to enable Google login:

## ✅ Step 1: Configure Redirect URLs in Supabase

1. Go to: https://supabase.com/dashboard/project/oknakvgnwxlkvhwmocno/auth/url-configuration
2. Under **Redirect URLs**, add these URLs:
   ```
   http://localhost:3000/auth/callback
   ```
3. Click **Save**

## ✅ Step 2: Enable Google Provider

1. Go to: https://supabase.com/dashboard/project/oknakvgnwxlkvhwmocno/auth/providers
2. Find **Google** in the list
3. Enable it (toggle switch)
4. You'll need to add Google OAuth credentials (next step)

## ✅ Step 3: Get Google OAuth Credentials

1. Go to: https://console.cloud.google.com
2. Select or create a project
3. Go to **APIs & Services** → **Credentials**
4. Click **Create Credentials** → **OAuth client ID**
5. Choose **Web application**
6. Add **Authorized redirect URIs**:
   ```
   https://oknakvgnwxlkvhwmocno.supabase.co/auth/v1/callback
   ```
   ⚠️ **Important**: This is the Supabase callback URL, NOT your app URL
7. Click **Create**
8. Copy the **Client ID** and **Client Secret**

## ✅ Step 4: Add Google Credentials to Supabase

1. Back in Supabase (Google provider settings)
2. Paste the **Client ID** from Google
3. Paste the **Client Secret** from Google
4. Click **Save**

## ✅ Step 5: Test the Login Flow

1. Open: http://localhost:3000
2. Click **"Start Free Trial with Google"**
3. You should be redirected to Google login
4. After login, you should be redirected to: http://localhost:3000/dashboard
5. You should see your profile picture and email in the dashboard

## 🔍 Troubleshooting

### "redirect_uri_mismatch" error
- Make sure you added the correct Supabase callback URL in Google Console:
  `https://oknakvgnwxlkvhwmocno.supabase.co/auth/v1/callback`

### Still redirected to home page after login
- Check that you added `http://localhost:3000/auth/callback` in Supabase redirect URLs
- Clear your browser cache and cookies
- Try in an incognito/private window

### "Invalid login credentials"
- Make sure Google provider is enabled in Supabase
- Check that Client ID and Secret are correctly pasted
- Verify the Supabase redirect URL is saved

## 📝 Summary of URLs

| Purpose | URL |
|---------|-----|
| Your app callback | `http://localhost:3000/auth/callback` |
| Supabase OAuth callback | `https://oknakvgnwxlkvhwmocno.supabase.co/auth/v1/callback` |
| Dashboard after login | `http://localhost:3000/dashboard` |

---

**After completing these steps, your Google login should work perfectly!** 🎉

