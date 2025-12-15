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

Go to **"Environment Variables"** section in Coolify and add the following variables:

#### Quick Reference Table

| Variable Name | Required? | Example Value | Where to Find |
|--------------|-----------|---------------|---------------|
| `VITE_SUPABASE_URL` | ✅ Yes | `https://xxx.supabase.co` | Supabase Dashboard → Settings → API → Project URL |
| `VITE_SUPABASE_ANON_KEY` | ✅ Yes | `sb_publishable_xxx...` | Supabase Dashboard → Settings → API → anon/public key |
| `VITE_VAPI_API_KEY` | ✅ Yes | `xxxx-xxxx-xxxx-xxxx` (PRIVATE key) | VAPI Dashboard → Settings → API Keys → Private Key |
| `VITE_SUPABASE_EDGE_FUNCTION_NAME` | ❌ Optional | `n8n-webhook` | Supabase Dashboard → Edge Functions |
| `VITE_SUPABASE_DEFAULT_COMPANY_ID` | ❌ Optional | `1` | Your database/application logic |

#### Detailed Instructions

#### Required Variables:

**1. `VITE_SUPABASE_URL`**
- **What to put**: Your Supabase project URL
- **Format**: Must start with `https://` and end with `.supabase.co`
- **Example**: `https://oknakvgnwxlkvhwmocno.supabase.co`
- **Where to find**:
  1. Go to your [Supabase Dashboard](https://app.supabase.com)
  2. Select your project
  3. Go to **Settings** → **API**
  4. Copy the **Project URL** (under "Project URL")
- **In Coolify**: 
  ```
  Variable Name: VITE_SUPABASE_URL
  Variable Value: https://your-project-id.supabase.co
  ```

**2. `VITE_SUPABASE_ANON_KEY`**
- **What to put**: Your Supabase anonymous/public key (NOT the service role key!)
- **Format**: Usually starts with `sb_publishable_` or `eyJ...` (JWT format)
- **Example**: `sb_publishable_BcC5d3MA2VslQJHRoXdy1Q_yvwEEgp2`
- **Where to find**:
  1. Go to your [Supabase Dashboard](https://app.supabase.com)
  2. Select your project
  3. Go to **Settings** → **API**
  4. Under "Project API keys", copy the **`anon` `public`** key
  5. ⚠️ **DO NOT** use the `service_role` key (it's secret!)
- **In Coolify**:
  ```
  Variable Name: VITE_SUPABASE_ANON_KEY
  Variable Value: sb_publishable_xxxxxxxxxxxxxxxxxxxxx
  ```

**3. `VITE_VAPI_API_KEY`**
- **What to put**: Your VAPI **PRIVATE** API key (this is a global key shared across all dashboards)
- **Format**: UUID format (e.g., `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`)
- **Example**: `9d09c2ec-4223-41af-a1c9-8bb097b8e5ef`
- **⚠️ Important**: Use the **PRIVATE** key, NOT the public key
  - ✅ **Use**: `9d09c2ec-4223-41af-a1c9-8bb097b8e5ef` (private key)
  - ❌ **Don't use**: `fc7a13ad-f97a-48eb-a0a2-8abfbd90e449` (public key)
- **Why**: The dashboard needs full read access to fetch calls and assistant configurations
- **Where to find**:
  1. Go to your [VAPI Dashboard](https://dashboard.vapi.ai)
  2. Navigate to **Settings** → **API Keys**
  3. Copy your **PRIVATE** API key (not the public one)
  4. This key is used to fetch calls and assistant configurations from VAPI
- **In Coolify**:
  ```
  Variable Name: VITE_VAPI_API_KEY
  Variable Value: 9d09c2ec-4223-41af-a1c9-8bb097b8e5ef
  ```

#### Optional Variables:

**4. `VITE_SUPABASE_EDGE_FUNCTION_NAME`** (Optional)
- **What to put**: Name of your Supabase Edge Function for webhook processing
- **Default**: `n8n-webhook`
- **Example**: `n8n-webhook`
- **When to use**: Only if you've deployed a custom edge function with a different name
- **Where to find**:
  1. Go to your Supabase Dashboard
  2. Navigate to **Edge Functions**
  3. Check the name of your deployed function
- **In Coolify**:
  ```
  Variable Name: VITE_SUPABASE_EDGE_FUNCTION_NAME
  Variable Value: n8n-webhook
  ```

**5. `VITE_SUPABASE_DEFAULT_COMPANY_ID`** (Optional)
- **What to put**: Default company ID for new customers (if needed)
- **Example**: `1`
- **When to use**: Only if your application requires a default company ID for customer creation
- **In Coolify**:
  ```
  Variable Name: VITE_SUPABASE_DEFAULT_COMPANY_ID
  Variable Value: 1
  ```

#### Example Complete Configuration:

Here's what your environment variables section should look like in Coolify:

```
VITE_SUPABASE_URL=https://oknakvgnwxlkvhwmocno.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_BcC5d3MA2VslQJHRoXdy1Q_yvwEEgp2
VITE_VAPI_API_KEY=9d09c2ec-4223-41af-a1c9-8bb097b8e5ef
VITE_SUPABASE_EDGE_FUNCTION_NAME=n8n-webhook
```

**⚠️ Critical Notes**:
- These variables are embedded at **build time** (not runtime)
- After changing any variable, you **must rebuild** the container
- Make sure there are **no spaces** around the `=` sign
- Do **not** wrap values in quotes unless the value itself contains quotes
- The `VITE_` prefix is required for Vite to recognize these variables

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

