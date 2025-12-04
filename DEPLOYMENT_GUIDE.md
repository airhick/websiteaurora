# 🚀 Aurora Dashboard Deployment Guide

## ✅ **Your Dashboard is Ready to Deploy!**

Your code has been committed locally. Now you need to deploy it to Render.

## 🌐 **Public URL**

Your dashboard will be available at: **https://auroradashboard.onrender.com**

## 📋 **Deployment Steps**

### **Step 1: Create GitHub Repository**

1. Go to https://github.com/new
2. Repository name: `aurora-dashboard-2`
3. Description: "Aurora Dashboard with Vapi AI integration"
4. Keep it **Private** (or Public if you prefer)
5. **Don't** initialize with README, .gitignore, or license
6. Click **"Create repository"**

### **Step 2: Connect Local Repository to GitHub**

Run these commands (replace YOUR_USERNAME with your GitHub username):

```bash
git remote add origin https://github.com/YOUR_USERNAME/aurora-dashboard-2.git
git push -u origin main
```

### **Step 3: Update Render Service**

1. Go to https://dashboard.render.com/web/srv-d3nm6o9gv73c73cf13o0
2. Click **"Settings"** tab
3. Scroll down to **"Service details"**
4. Update **"Repository"** to: `https://github.com/YOUR_USERNAME/aurora-dashboard-2`
5. Click **"Save changes"**
6. Wait for automatic deployment (takes 2-5 minutes)

### **Step 4: Set Environment Variables in Render**

1. Go to https://dashboard.render.com/web/srv-d3nm6o9gv73c73cf13o0
2. Click **"Environment"** tab
3. Add these environment variables:

```bash
# Supabase Client Configuration
NEXT_PUBLIC_SUPABASE_URL=https://dkgkqcngqqknyznrsmnx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRrZ2txY25ncXFrbnl6bnJzbW54Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAyMDAyNDQsImV4cCI6MjA3NTc3NjI0NH0.ffPfkyWedtVpiWo3jRsglRekPSPSYD7N-tqEB_erVL0

# Service Role Key
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRrZ2txY25ncXFrbnl6bnJzbW54Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDIwMDI0NCwiZXhwIjoyMDc1Nzc2MjQ0fQ.RKf5KOj-O4Kkrlx1U-emN-NXGboGI5dLQctH287qriw

# Database URL
DATABASE_URL=postgresql://postgres.dkgkqcngqqknyznrsmnx:Lee7wak123@@aws-1-eu-west-2.pooler.supabase.com:6543/postgres
```

4. Click **"Save changes"**
5. The deployment will automatically restart

### **Step 5: Access Your Dashboard**

Once deployment completes:
- **Public URL**: https://auroradashboard.onrender.com
- Initial load may take 10-20 seconds (free tier spins up after inactivity)

## 🔍 **Troubleshooting**

### **If deployment fails:**
1. Check the Render logs: https://dashboard.render.com/web/srv-d3nm6o9gv73c73cf13o0/logs
2. Verify all environment variables are set
3. Check build logs for errors

### **If the dashboard doesn't load:**
1. Wait 30 seconds (first load is slow on free tier)
2. Check browser console for errors
3. Verify Supabase URL and keys are correct

### **If Vapi calls don't work:**
1. Check browser console for CORS errors
2. Verify environment variables are set
3. Test locally first to ensure everything works

## 📊 **Current Features**

✅ **Supabase Integration** - Real-time data from database
✅ **Google Maps API** - Business search with autocomplete
✅ **Vapi AI Integration** - Voice AI receptionist calls
✅ **n8n Webhook** - Business assistant creation
✅ **Live Call Test** - Test AI calls to any business
✅ **Dashboard Analytics** - View call metrics and data

## 🎯 **Next Steps**

Once deployed, you can:
1. Login to the dashboard at https://auroradashboard.onrender.com
2. Search for any business using Google Maps
3. Test AI receptionist calls to businesses
4. View real-time analytics from Supabase

Your dashboard is ready for deployment! 🎉
