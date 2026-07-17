# IEEE NITW · Operations Dashboard

Internal operations dashboard for the IEEE Student Branch at NIT Warangal.
React + Vite + Tailwind CSS frontend, Supabase (Postgres, Auth, RLS, Storage) backend,
with a 3-tier RBAC system (super_admin / admin / member) enforced by Row Level Security.

## 1. Supabase setup (one time)

1. Create a project at [supabase.com](https://supabase.com).
2. Open **SQL Editor**, paste the entire contents of `supabase/schema.sql`, and run it.
   This creates all tables, triggers, RLS policies, and the `crm-files` storage bucket.
3. In **Authentication → Sign In / Providers → Email**, turn **off** "Allow new users to sign up"
   (accounts are provisioned, never self-registered).
4. In **Authentication → Users**, click **Add user → Create new user** and create your own
   account (email + password, auto-confirm). **The first user created becomes super_admin
   automatically.** Every later user starts as `member`; promote them from the app's Team page.

## 2. Run locally

```bash
cp .env.example .env   # fill in VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
npm install
npm run dev
```

The URL and anon key are under **Project Settings → API** in Supabase.

## 3. Deploy

The app is a static SPA — any static host works. SPA fallback configs are already included
for both Vercel (`vercel.json`) and Netlify (`public/_redirects`).

### Vercel

```bash
npm i -g vercel
vercel
```

Or import the repo at [vercel.com/new](https://vercel.com/new) (framework preset: **Vite**).
Then add the two environment variables under **Settings → Environment Variables**:
`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` — and redeploy.

### Netlify

Import the repo at [app.netlify.com](https://app.netlify.com). Build command `npm run build`,
publish directory `dist`, and set the same two environment variables.

> Vite inlines `VITE_*` variables at **build time**, so they must be configured on the host
> before the build runs. The anon key is safe to expose — all authorization is enforced by RLS.

### After deploying

In Supabase, **Authentication → URL Configuration**, set the **Site URL** to your deployed
domain so auth redirects/password recovery links point at production.

## Roles

| Role | Access |
|---|---|
| `super_admin` | Everything + role management on the Team page |
| `admin` | Create/edit/delete across Events, Tasks, Budget, and CRM modules |
| `member` | Read-only; all edit controls are hidden and writes are blocked by RLS |
