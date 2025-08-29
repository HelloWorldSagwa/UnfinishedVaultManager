# Deployment Guide

## Environment Variables

To deploy this application, you need to set the following environment variables in Vercel:

### Required Variables

```
NEXT_PUBLIC_SUPABASE_URL=https://qmmryvzwzzlirvznbexp.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFtbXJ5dnp3enpsaXJ2em5iZXhwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMxNjc1MjksImV4cCI6MjA2ODc0MzUyOX0.ddbZnPT_Ybudt3ZOfbxjwiyFF9nKARFti57lZmeZpvg
```

## How to Add Environment Variables to Vercel

1. Go to your [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project (UnfinishedVaultManager)
3. Go to "Settings" tab
4. Navigate to "Environment Variables" in the left sidebar
5. Add each variable:
   - Name: `NEXT_PUBLIC_SUPABASE_URL`
   - Value: `https://qmmryvzwzzlirvznbexp.supabase.co`
   - Environment: Select all (Production, Preview, Development)
6. Repeat for `NEXT_PUBLIC_SUPABASE_ANON_KEY`
7. Click "Save"
8. Redeploy your application for changes to take effect

## Local Development

For local development, copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

The `.env.local` file is already gitignored and won't be committed to the repository.

## Test Accounts

The application includes hardcoded test accounts for development:

- **Super Admin**: superadmin / Admin@2024!
- **Admin**: admin / Admin@2024!
- **Moderator**: moderator / Mod@2024!
- **Viewer**: viewer / View@2024!

These accounts work without database connection for testing purposes.