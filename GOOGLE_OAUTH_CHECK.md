# Google OAuth Configuration Checklist

## ❌ Your Google Login is NOT Working Yet

This is why you're being returned to localhost:3000 instead of the dashboard. Follow these steps **exactly** to fix it:

---

## 📋 Step-by-Step Fix

### 1️⃣ Configure Supabase Redirect URLs

**Go to:** https://supabase.com/dashboard/project/oknakvgnwxlkvhwmocno/auth/url-configuration

**Under "Redirect URLs", add:**
```
http://localhost:3000/auth/callback
```

**Click "Save"** ✅

---

### 2️⃣ Create Google OAuth Credentials

**A. Go to Google Cloud Console:**
https://console.cloud.google.com/

**B. Create/Select Project:**
- Click the project dropdown at the top
- Create a new project OR select an existing one
- Name it something like "Aurora Dashboard"

**C. Enable Google+ API:**
- Go to "APIs & Services" → "Library"
- Search for "Google+ API"
- Click "Enable"

**D. Create OAuth Credentials:**
1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "OAuth client ID"
3. If prompted, configure the OAuth consent screen first:
   - User Type: **External**
   - App name: **Aurora Dashboard**
   - User support email: **Your email**
   - Developer contact: **Your email**
   - Click "Save and Continue"
   - Scopes: Skip this step (click "Save and Continue")
   - Test users: Skip (click "Save and Continue")
4. Back to creating OAuth client ID:
   - Application type: **Web application**
   - Name: **Aurora Web Client**

**E. Add Authorized Redirect URIs:**

⚠️ **IMPORTANT**: Add this **EXACT** URL:
```
https://oknakvgnwxlkvhwmocno.supabase.co/auth/v1/callback
```

This is the Supabase callback URL (NOT your app URL!)

**F. Click "Create"**

**G. Copy your credentials:**
- **Client ID**: Starts with something like `123456789-abc.apps.googleusercontent.com`
- **Client Secret**: Random string

---

### 3️⃣ Add Credentials to Supabase

**Go to:** https://supabase.com/dashboard/project/oknakvgnwxlkvhwmocno/auth/providers

**Find "Google" and:**
1. **Toggle it ON** (enable it)
2. Paste your **Client ID** from Google
3. Paste your **Client Secret** from Google
4. Click **"Save"**

---

## ✅ Test It Now

1. Go to: http://localhost:3000
2. Open browser console (F12) → Console tab
3. Click "Start Free Trial with Google"
4. You should see:
   - Redirect to Google login
   - After selecting account, see console log: "OAuth initiated"
   - Return to your app
   - See console log: "Successfully authenticated user: your@email.com"
   - Redirect to dashboard: http://localhost:3000/dashboard

---

## 🔍 Debugging

### If you get an error message on the page:
- Check the browser console for detailed error messages
- The error will tell you what's wrong

### If you see "redirect_uri_mismatch":
- You didn't add the Supabase callback URL correctly in Google Console
- Go back to Google Console → Credentials → Edit your OAuth client
- Make sure you have: `https://oknakvgnwxlkvhwmocno.supabase.co/auth/v1/callback`

### If you're returned to localhost:3000 without errors:
- Google provider isn't enabled in Supabase
- OR Client ID/Secret are incorrect
- Check the terminal where `npm run dev` is running for server logs

### If nothing happens when you click the button:
- Check browser console for JavaScript errors
- Make sure .env.local has the correct Supabase URL and key

---

## 📝 Quick Checklist

- [ ] Added `http://localhost:3000/auth/callback` in Supabase URL Configuration
- [ ] Created Google OAuth client in Google Cloud Console
- [ ] Added `https://oknakvgnwxlkvhwmocno.supabase.co/auth/v1/callback` in Google Console
- [ ] Copied Client ID and Secret
- [ ] Enabled Google provider in Supabase
- [ ] Pasted Client ID in Supabase
- [ ] Pasted Client Secret in Supabase
- [ ] Clicked "Save" in Supabase
- [ ] Tested the login flow

---

## 🎯 Still Not Working?

Check your terminal logs where `npm run dev` is running. You should see logs when you try to log in. Share those logs if you need help.

The browser console (F12) will also show you what's happening during the OAuth flow.

