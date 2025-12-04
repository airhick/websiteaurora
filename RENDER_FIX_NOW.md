# ⚡ URGENT FIX - Add Environment Variables to Render

## 🚨 THE PROBLEM

Secret Files DON'T WORK for `NEXT_PUBLIC_*` variables in Next.js!

Next.js needs these variables at **BUILD TIME**, but Secret Files are only available at **RUNTIME**.

## ✅ THE SOLUTION

Add the variables directly in Render's **Environment Variables** section (NOT Secret Files).

---

## 🎯 DO THIS NOW (5 Minutes)

### Step 1: Go to Render Environment Tab

1. Open: https://dashboard.render.com
2. Click on your **"aurora-dashboard"** service
3. Click the **"Environment"** tab

### Step 2: Add Environment Variables (NOT Secret Files!)

Look for the **"Environment Variables"** section at the top (NOT "Secret Files").

Click **"Add Environment Variable"** and add these TWO variables:

#### Variable 1:
- **Key**: `NEXT_PUBLIC_SUPABASE_URL`
- **Value**: `https://kqdiickzowoffpleavfh.supabase.co`

Click "Add" or "Save"

#### Variable 2:
- **Key**: `NEXT_PUBLIC_SUPABASE_ANON_KEY`  
- **Value**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtxZGlpY2t6b3dvZmZwbGVhdmZoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA2MjIxODcsImV4cCI6MjA3NjE5ODE4N30.5GxQe8p97-CUV426zgHVI7EN5IlFTUJv0aKVXLNQsc8`

Click "Add" or "Save"

### Step 3: Remove the Secret File (if you added one)

If you added a `.env` secret file earlier:
1. Scroll down to **"Secret Files"** section
2. Find the `.env` file
3. Click "Delete" or "Remove"
4. Save changes

### Step 4: Save & Redeploy

1. Click **"Save Changes"** at the bottom
2. Render will prompt you to redeploy
3. Click **"Manual Deploy"** → **"Clear build cache & deploy"**

### Step 5: Wait & Test

1. Wait 2-5 minutes for deployment to complete
2. Go to: https://aurora-dashboard.onrender.com
3. Try logging in with Google
4. ✅ It should work now!

---

## 📋 Quick Copy-Paste

Here are the exact values to copy-paste:

**Variable 1 Key:**
```
NEXT_PUBLIC_SUPABASE_URL
```

**Variable 1 Value:**
```
https://kqdiickzowoffpleavfh.supabase.co
```

**Variable 2 Key:**
```
NEXT_PUBLIC_SUPABASE_ANON_KEY
```

**Variable 2 Value:**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtxZGlpY2t6b3dvZmZwbGVhdmZoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA2MjIxODcsImV4cCI6MjA3NjE5ODE4N30.5GxQe8p97-CUV426zgHVI7EN5IlFTUJv0aKVXLNQsc8
```

---

## 🎓 WHY THIS WORKS

- `NEXT_PUBLIC_*` variables are **embedded into your JavaScript bundle** at build time
- Secret Files are only accessible at runtime (after the build is complete)
- Environment Variables are available during the build process
- This is why you MUST use Environment Variables for `NEXT_PUBLIC_*` variables

---

## 🔍 HOW TO VERIFY

After deployment completes, check your Render logs. You should see:

```
Building...
✓ Compiled successfully
✓ Linting and checking validity of types
✓ Collecting page data
✓ Generating static pages
```

And NO warnings about missing Supabase environment variables.

---

## 💡 KEY DIFFERENCE

❌ **Secret Files** = Runtime only (for API keys, database passwords, etc.)  
✅ **Environment Variables** = Build time + Runtime (for `NEXT_PUBLIC_*` variables)

---

## 🆘 IF IT STILL DOESN'T WORK

1. Make sure you saved BOTH variables
2. Make sure you redeployed AFTER saving
3. Check Render build logs for any errors
4. Clear your browser cache (Ctrl+Shift+R / Cmd+Shift+R)
5. Make sure the variables are in "Environment Variables" section, NOT "Secret Files"

---

## ✨ THAT'S IT!

This should fix your issue. The error will disappear and Google OAuth will work perfectly.
