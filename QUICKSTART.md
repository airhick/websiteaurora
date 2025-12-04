# Quick Start Guide - 3 Steps to Launch

## 📦 Step 1: Install Dependencies
```bash
npm install
```

## 🔑 Step 2: Create Environment File

Run this command to create `.env.local`:

```bash
cat > .env.local << 'EOF'
NEXT_PUBLIC_SUPABASE_URL=https://oknakvgnwxlkvhwmocno.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9rbmFrdmdud3hsa3Zod21vY25vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA2OTE5ODksImV4cCI6MjA3NjI2Nzk4OX0.RnSpDsGRs_Wu8KsJtz2Ijx4JhWXEAWBdCeH9RQciR5U
EOF
```

## 🚀 Step 3: Run the App
```bash
npm run dev
```

Open http://localhost:3000

---

## ⚙️ Configure Google Login (Required before first use)

1. Go to: https://supabase.com/dashboard/project/oknakvgnwxlkvhwmocno/auth/providers
2. Enable "Google" provider
3. Get Google OAuth credentials from: https://console.cloud.google.com
4. Add this redirect URL in Google Console:
   ```
   https://oknakvgnwxlkvhwmocno.supabase.co/auth/v1/callback
   ```
5. Paste Client ID and Secret into Supabase

---

That's it! 🎉

For detailed instructions, see SETUP.md

