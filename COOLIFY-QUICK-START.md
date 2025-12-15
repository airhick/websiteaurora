# Quick Start: Deploy to Coolify

This is a quick reference guide for deploying Aurora Dashboard to Coolify. For detailed information, see [DEPLOY.md](./DEPLOY.md).

## Prerequisites

- ✅ Coolify instance running on your VPS
- ✅ Git repository with your code (GitHub, GitLab, etc.)
- ✅ Supabase project URL and anon key
- ✅ VAPI API key

## Step-by-Step Deployment

### 1. Create New Application in Coolify

1. Log into your Coolify dashboard
2. Click **"New Resource"** → **"Application"**
3. Choose **"Git Repository"** as the source

### 2. Connect Your Repository

**Important**: Use **HTTPS URL**, not SSH!

- ✅ **Correct**: `https://github.com/your-username/aurora-dashboard`
- ❌ **Wrong**: `git@github.com:your-username/aurora-dashboard`

**For Private Repositories:**
- Go to **Coolify → Sources** first
- Add your GitHub/GitLab credentials
- Then select the repository from the dropdown

### 3. Configure Build Settings

Coolify should auto-detect your Dockerfile, but verify:

- **Build Pack**: `Dockerfile` (or `Docker Compose` if you prefer)
- **Dockerfile Path**: `Dockerfile`
- **Build Context**: `.` (root directory)
- **Port**: `80`

### 4. Set Environment Variables

Go to **"Environment Variables"** section and add:

#### Required Variables:

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
VITE_VAPI_API_KEY=your-vapi-api-key-here
```

#### Optional Variables:

```bash
VITE_SUPABASE_EDGE_FUNCTION_NAME=n8n-webhook
VITE_SUPABASE_DEFAULT_COMPANY_ID=1
```

**⚠️ Critical**: These variables are embedded at **build time**. After changing them, you **must rebuild** the container!

### 5. Deploy

1. Click **"Deploy"** or **"Save & Deploy"**
2. Monitor the build logs
3. Wait for deployment to complete (usually 3-5 minutes)

### 6. Configure Domain & SSL (Optional)

1. Go to your application settings
2. Add your domain (e.g., `dashboard.yourdomain.com`)
3. Coolify will automatically provision SSL certificate via Let's Encrypt

## Post-Deployment Checklist

### 1. Run Supabase SQL Functions

Execute these SQL files in your Supabase SQL Editor:

- ✅ `supabase-auth-function.sql`
- ✅ `supabase-stats-function.sql`
- ✅ `supabase-get-customer-agents-function.sql`
- ✅ `supabase-get-customer-plan-function.sql`
- ✅ `supabase-call-logs-schema.sql`
- ✅ `supabase-user-events-schema.sql`
- ✅ `supabase-update-missing-durations.sql` (optional, for backfilling durations)

### 2. Test Your Deployment

1. Visit your deployed URL
2. Test login functionality
3. Verify dashboard loads correctly
4. Check that stats cards display data
5. Test webhook notifications (if configured)

## Common Issues & Solutions

### Issue: "Permission denied (publickey)"

**Solution**: Use HTTPS URL instead of SSH URL in Coolify repository settings.

### Issue: Build fails with "VITE_* is not defined"

**Solution**: 
- Make sure environment variables are set in Coolify
- Variables must be available during build (not just runtime)
- Rebuild the container after adding/changing variables

### Issue: Application shows blank page

**Solution**:
- Check build logs for errors
- Verify `dist` folder was created during build
- Check nginx logs: `View container logs` in Coolify

### Issue: 404 errors on routes

**Solution**: This is normal for SPAs. The `nginx.conf` handles client-side routing. If issues persist, verify the nginx config is correctly copied.

### Issue: Environment variables not working

**Solution**: 
- Vite embeds `VITE_*` variables at **build time**
- You must **rebuild** the container after changing environment variables
- Trigger a new deployment in Coolify after changing env vars

## Auto-Deploy Setup

To enable automatic deployments on git push:

1. Go to your application settings in Coolify
2. Enable **"Auto Deploy"**
3. Select the branch (usually `main` or `master`)
4. Now every push to that branch will trigger a new deployment

## Monitoring

- **Logs**: View container logs in Coolify dashboard
- **Health Checks**: The Dockerfile includes a health check (every 30s)
- **Metrics**: Check resource usage in Coolify dashboard

## File Structure Reference

```
.
├── Dockerfile              # Multi-stage build (Node.js → nginx)
├── .coolify.yml           # Coolify configuration
├── docker-compose.yml     # Alternative deployment option
├── nginx.conf            # Nginx config for SPA routing
├── DEPLOY.md             # Detailed deployment guide
└── COOLIFY-QUICK-START.md # This file
```

## Need Help?

- Check [DEPLOY.md](./DEPLOY.md) for detailed troubleshooting
- Review Coolify logs for build/deployment errors
- Verify all environment variables are set correctly
- Ensure Supabase RPC functions are deployed

