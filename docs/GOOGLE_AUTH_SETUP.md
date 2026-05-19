# Google OAuth Setup Guide

This guide walks you through enabling Google authentication for Al-Mudawwana.

## Prerequisites

- A Google account
- Access to [Google Cloud Console](https://console.cloud.google.com/)
- Access to [Supabase Dashboard](https://supabase.com/dashboard/project/aoojpafediogwfdacqww/auth/providers)

## Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click **Select a project** > **New Project**
3. Name it: `Al-Mudawwana` (or any name)
4. Click **Create**

## Step 2: Configure OAuth Consent Screen

1. Go to **APIs & Services** > **OAuth consent screen**
2. Choose **External** user type > **Create**
3. Fill in:
   - **App name**: `المدوّنة — Al-Mudawwana`
   - **User support email**: your email
   - **App logo**: upload the app icon (optional)
   - **App domain**: `https://almudawwana-v3.vercel.app`
   - **Authorized domains**: `almudawwana-v3.vercel.app` and `supabase.co`
   - **Developer contact email**: your email
4. Click **Save and Continue**
5. **Scopes**: click **Add or Remove Scopes**, select `email` and `profile`, then **Update** > **Save and Continue**
6. **Test users**: skip (or add your email for testing) > **Save and Continue**
7. Click **Back to Dashboard**

## Step 3: Create OAuth Credentials

1. Go to **APIs & Services** > **Credentials**
2. Click **+ Create Credentials** > **OAuth client ID**
3. **Application type**: `Web application`
4. **Name**: `Al-Mudawwana Web`
5. **Authorized JavaScript origins**:
   - `https://almudawwana-v3.vercel.app`
   - `http://localhost:3000` (for local dev)
6. **Authorized redirect URIs**:
   - `https://aoojpafediogwfdacqww.supabase.co/auth/v1/callback`
7. Click **Create**
8. **Copy the Client ID and Client Secret** — you'll need them in the next step

## Step 4: Configure Supabase

1. Go to [Supabase Auth Providers](https://supabase.com/dashboard/project/aoojpafediogwfdacqww/auth/providers)
2. Find **Google** in the list and click on it
3. Toggle **Enable Sign in with Google** ON
4. Paste:
   - **Client IDs**: your Google OAuth Client ID (looks like `xxxx.apps.googleusercontent.com`)
   - **Client Secret**: your Google OAuth Client Secret
5. Click **Save**

## Step 5: Verify

1. Go to `https://almudawwana-v3.vercel.app/login`
2. Click **"الدخول بـ Google"**
3. You should be redirected to Google's consent screen
4. After authorizing, you'll be redirected back to the app

## URL Configuration (already done)

These settings have already been configured in Supabase:

- **Site URL**: `https://almudawwana-v3.vercel.app`
- **Redirect URLs**:
  - `https://almudawwana-v3.vercel.app/auth/callback`
  - `http://localhost:3000/auth/callback`

## How It Works (Technical)

1. User clicks "Google login" button
2. `supabase.auth.signInWithOAuth({ provider: 'google' })` redirects to Google
3. Google authenticates and redirects to Supabase callback URL
4. Supabase exchanges the code and redirects to `/auth/callback` (our app)
5. Our server-side route handler (`app/auth/callback/route.ts`) exchanges the Supabase code for a session
6. The handler upserts the user profile in the `profiles` table
7. User is redirected to the homepage, now authenticated

## Files Involved

- `app/login/page.tsx` — Login page with Google button
- `app/register/page.tsx` — Register page with Google button
- `app/auth/callback/route.ts` — Server-side OAuth callback handler
- `app/auth/callback/page.tsx` — Loading/error UI during OAuth flow
- `lib/supabase/client.ts` — Browser Supabase client (used for `signInWithOAuth`)
- `lib/supabase/server.ts` — Server Supabase client (used in callback route)

## Publishing to Production

When you're ready to go live (not just testing):

1. Go to Google Cloud Console > **OAuth consent screen**
2. Click **Publish App** to move from Testing to Production
3. Google may require verification if you're requesting sensitive scopes
4. For basic `email` + `profile` scopes, verification is usually quick
