# 🚀 Railway Deployment - Set Environment Variables

## 🌐 **Your Dashboard is Live on Railway**

Your dashboard is deployed at: **https://aurora-dashboard-production.up.railway.app**

## ⚠️ **CRITICAL: Set Environment Variables in Railway**

You need to set the Supabase environment variables in Railway for the dashboard to work!

### 📋 **Step-by-Step Instructions**

1. Go to: **https://railway.app/**
2. Sign in to your Railway account
3. Find your project (likely named "aurora-dashboard")
4. Click on the **"Environment Variables"** tab (or go to project settings)
5. Add these environment variables:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://dkgkqcngqqknyznrsmnx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRrZ2txY25ncXFrbnl6bnJzbW54Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAyMDAyNDQsImV4cCI6MjA3NTc3NjI0NH0.ffPfkyWedtVpiWo3jRsglRekPSPSYD7N-tqEB_erVL0
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRrZ2txY25ncXFrbnl6bnJzbW54Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDIwMDI0NCwiZXhwIjoyMDc1Nzc2MjQ0fQ.RKf5KOj-O4Kkrlx1U-emN-NXGboGI5dLQctH287qriw
DATABASE_URL=postgresql://postgres.dkgkqcngqqknyznrsmnx:Lee7wak123@@aws-1-eu-west-2.pooler.supabase.com:6543/postgres
```

### 🎯 **For Each Variable**

1. Click **"+ New Variable"**
2. Enter the variable name
3. Enter the value
4. Click **"Add"**
5. Repeat for all 4 variables

### ✅ **After Setting Variables**

1. Railway will **automatically redeploy** your application
2. Wait 2-3 minutes for the deployment to complete
3. Go to https://aurora-dashboard-production.up.railway.app
4. Your dashboard should now work! 🎉

## 📊 **Alternative: Using Railway CLI**

If you have Railway CLI installed and logged in:

```bash
railway login
railway link
railway variables set NEXT_PUBLIC_SUPABASE_URL=https://dkgkqcngqqknyznrsmnx.supabase.co
railway variables set NEXT_PUBLIC_SUPABASE_ANON_KEY=[your key]
railway variables set SUPABASE_SERVICE_ROLE_KEY=[your key]
railway variables set DATABASE_URL=[your url]
```

## 🔍 **What Each Variable Does**

- `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Public anonymous key for client-side access
- `SUPABASE_SERVICE_ROLE_KEY`: Service role key for server-side operations
- `DATABASE_URL`: Direct database connection URL

Once you set these, your dashboard will be fully functional! 🚀
