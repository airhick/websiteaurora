# Aurora AI Receptionist Dashboard

A modern, feature-rich dashboard for Aurora AI Receptionist built with Vite, React, Shadcn UI, and Supabase.

![Aurora Dashboard](public/logos/logoblakc.png)

## Features

- 🔐 **Google OAuth Authentication** via Supabase
- 🎨 **Modern UI** with Shadcn UI components (Radix UI + Tailwind CSS)
- 🌓 **Dark/Light Mode** support
- 📱 **Fully Responsive** design
- 🧪 **AI Testing Interface** to simulate receptionist calls
- 📊 **Analytics Dashboard** with call statistics
- 🌐 **Business Website Crawler** to understand your business
- ⚡ **Fast Performance** with Vite build tool
- 🛣️ **Type-safe Routing** with TanStack Router

## Tech Stack

- **Frontend Framework**: React 19 + TypeScript
- **Build Tool**: Vite
- **UI Components**: Shadcn UI (Radix UI + Tailwind CSS)
- **Routing**: TanStack Router
- **State Management**: Zustand
- **Authentication**: Supabase Auth (Google OAuth)
- **Database**: Supabase
- **Icons**: Lucide React
- **Forms**: React Hook Form + Zod

## Quick Start

### Prerequisites

- Node.js 18+ 
- A Supabase project with Google OAuth configured
- Google OAuth credentials

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env.local` and fill in your Supabase credentials:

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
VITE_SUPABASE_URL=your-supabase-project-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
VITE_SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
VITE_SUPABASE_DEFAULT_COMPANY_ID=your-default-company-id
```

### 3. Set Up Supabase

1. Create a Supabase project at https://supabase.com
2. Enable Google OAuth provider in Authentication → Providers
3. Add authorized redirect URLs:
   - Development: `http://localhost:8001/auth/callback`
   - Production: `https://your-domain.com/auth/callback`

#### Database Schema

Create the following table in your Supabase project:

```sql
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  title TEXT,
  company_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- Create policies (adjust as needed)
CREATE POLICY "Users can view their own customer record"
  ON customers FOR SELECT
  USING (auth.uid()::text = id::text);

CREATE POLICY "Users can insert their own customer record"
  ON customers FOR INSERT
  WITH CHECK (auth.uid()::text = id::text);

CREATE POLICY "Users can update their own customer record"
  ON customers FOR UPDATE
  USING (auth.uid()::text = id::text);
```

### 4. Run Development Server

```bash
npm run dev
```

The app will be available at http://localhost:8001

### 5. Build for Production

```bash
npm run build
npm run preview
```

## Project Structure

```
src/
├── assets/              # Static assets (logos, icons)
├── components/          # Reusable UI components
│   ├── layout/         # Layout components (sidebar, header, etc.)
│   └── ui/             # Shadcn UI components
├── context/            # React context providers
├── features/           # Feature-specific components
│   └── aurora-dashboard/  # Aurora dashboard feature
│       ├── components/    # Dashboard-specific components
│       └── index.tsx      # Main dashboard page
├── hooks/              # Custom React hooks
├── lib/                # Utility functions and configs
│   ├── supabase.ts    # Supabase client
│   ├── api.ts         # API functions
│   └── utils.ts       # General utilities
├── routes/             # TanStack Router routes
│   ├── __root.tsx     # Root route
│   ├── index.tsx      # Landing page
│   ├── auth.callback.tsx  # Auth callback
│   └── _authenticated/    # Protected routes
├── stores/             # Zustand stores
│   └── auth-store.ts  # Authentication state
└── main.tsx           # Application entry point
```

## Key Features Explained

### Authentication Flow

1. User clicks "Sign In with Google" on landing page
2. Redirected to Google OAuth consent screen
3. Google authenticates and redirects back to `/auth/callback`
4. Session is established and user is redirected to dashboard
5. Customer record is automatically created/updated in database

### Dashboard Features

#### Stats Cards
- Calls Handled: Track total calls processed
- Uptime: Display 24/7 availability
- Satisfaction: Customer satisfaction metrics
- Status: Current system status

#### AI Capabilities
Display Aurora's key features:
- 24/7 Call Answering
- Smart Scheduling
- FAQ Handling
- Call Transfer
- Detailed Summaries

#### Test Interface
- Simulate AI receptionist calls
- Test different scenarios (scheduling, FAQs, transfers)
- View real-time call status
- Optional phone number testing

#### Business Setup
- First-time user onboarding
- Website URL input
- Automatic content crawling
- Business information extraction

### Protected Routes

All routes under `/_authenticated` require authentication. The `beforeLoad` function checks for a valid Supabase session and redirects to the landing page if not authenticated.

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_SUPABASE_URL` | Your Supabase project URL | Yes |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous key | Yes |
| `VITE_SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | Yes |
| `VITE_SUPABASE_DEFAULT_COMPANY_ID` | Default company ID for new users | No |
| `VITE_APP_NAME` | Application name | No |
| `VITE_APP_PORT` | Development server port | No |

## Deployment

### Vercel

1. Push code to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

### Netlify

1. Connect repository
2. Build command: `npm run build`
3. Publish directory: `dist`
4. Add environment variables
5. Deploy

### Render

1. Create new Web Service
2. Build command: `npm install && npm run build`
3. Start command: `npm run preview`
4. Add environment variables
5. Deploy

**Important**: Update your Supabase redirect URLs with your production domain!

## Development

### Code Style

- Use TypeScript for type safety
- Follow ESLint and Prettier configurations
- Use functional components with hooks
- Organize files by feature

### Adding New Features

1. Create feature directory in `src/features/`
2. Add components in `components/` subdirectory
3. Create route in `src/routes/`
4. Update navigation if needed

### Customizing UI

All UI components are in `src/components/ui/` and can be customized. The project uses Shadcn UI, which allows easy component updates:

```bash
npx shadcn-ui@latest add <component-name>
```

## Troubleshooting

### Authentication Issues

- Verify Supabase credentials in `.env.local`
- Check Google OAuth configuration in Supabase dashboard
- Ensure redirect URLs match exactly (no trailing slashes)

### Build Errors

- Clear `node_modules` and reinstall: `rm -rf node_modules && npm install`
- Check TypeScript errors: `npm run lint`
- Verify all environment variables are set

### Database Issues

- Verify RLS policies are correctly configured
- Check database table schema matches expected structure
- Ensure service role key has proper permissions

## License

Proprietary - Aurora AI Receptionist

## Support

For issues or questions, contact your development team.

---

**Built with ❤️ using Shadcn Admin Template**
