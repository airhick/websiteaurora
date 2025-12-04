# Setup Instructions

Follow these steps to get your Aurora dashboard up and running.

## Step 1: Install Node.js

Make sure you have Node.js installed (version 18 or higher):
```bash
node --version
```

## Step 2: Install Dependencies

```bash
npm install
```

## Step 3: Configure Environment Variables

Create a file named `.env.local` in the root directory with:

```
NEXT_PUBLIC_SUPABASE_URL=https://oknakvgnwxlkvhwmocno.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9rbmFrdmdud3hsa3Zod21vY25vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA2OTE5ODksImV4cCI6MjA3NjI2Nzk4OX0.RnSpDsGRs_Wu8KsJtz2Ijx4JhWXEAWBdCeH9RQciR5U
```

## Step 4: Configure Google OAuth in Supabase

1. Visit https://supabase.com/dashboard/project/oknakvgnwxlkvhwmocno
2. Go to Authentication → Providers
3. Find "Google" and enable it
4. Configure the redirect URL in Authentication → URL Configuration:
   - Add `http://localhost:3000/auth/callback` for development
   - Add your production URL + `/auth/callback` for production
5. You'll need Google OAuth credentials:

### Get Google OAuth Credentials:

1. Go to https://console.cloud.google.com
2. Create a new project or select one
3. Go to APIs & Services → Credentials
4. Click "Create Credentials" → "OAuth client ID"
5. Choose "Web application"
6. Add authorized redirect URIs:
   ```
   https://oknakvgnwxlkvhwmocno.supabase.co/auth/v1/callback
   ```
7. Copy the Client ID and Client Secret
8. Paste them into Supabase Google provider settings

## Step 5: Run the Development Server

```bash
npm run dev
```

Visit http://localhost:3000

## Step 6: Test the Application

1. Click "Start Free Trial with Google"
2. Sign in with your Google account
3. You'll be redirected to the dashboard
4. Test the AI receptionist features

## Troubleshooting

### "Invalid login credentials" error
- Make sure Google OAuth is properly configured in Supabase
- Check that redirect URLs are correct

### Environment variables not loading
- Make sure `.env.local` exists in the root directory
- Restart the development server after creating `.env.local`

### Build errors
- Delete `node_modules` and `.next` folders
- Run `npm install` again
- Try `npm run dev` again

## Production Deployment

### Deploy to Vercel (Recommended)

1. Push your code to GitHub
2. Go to https://vercel.com
3. Import your repository
4. Add environment variables in Vercel dashboard
5. Deploy!

Remember to update Google OAuth redirect URLs with your production domain.

## File Structure

```
aurora-dashboard/
├── app/                    # Next.js app directory
│   ├── dashboard/         # Protected dashboard page
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Landing page
├── lib/                   # Utilities
│   └── supabase.ts        # Supabase client
├── .env.local            # Environment variables (CREATE THIS)
├── package.json          # Dependencies
└── README.md             # Documentation
```

## Next Steps

- Customize the AI receptionist test scenarios
- Add real phone integration
- Set up call recording and analytics
- Configure email notifications
- Add payment processing for subscriptions

