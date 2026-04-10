# 🚀 Quick Start - Vercel Deployment

Your Moments app is deployed on Vercel but needs environment variables to work.

## 🔧 Setup Required (5 minutes)

Choose one option:

### Option 1: Automated Setup (Recommended)
```bash
bash VERCEL_ENV_SETUP.sh
```
This script will guide you through adding all environment variables using the Vercel CLI.

### Option 2: Manual Setup via UI
Follow the step-by-step guide:
```bash
open VERCEL_ENV_MANUAL_SETUP.md
```
Or read it on GitHub and manually add variables in the Vercel dashboard.

## 📋 What Gets Added

- ✅ Laravel encryption key (APP_KEY)
- ✅ Neon PostgreSQL credentials
- ✅ Cloudflare R2 storage credentials
- ✅ CORS configuration

## ✅ After Setup

1. **Redeploy on Vercel** (automatic or manual)
2. **Run migrations**:
   ```bash
   cd backend && php artisan migrate --force
   ```
3. **Test the API**:
   ```bash
   curl https://moments-us-app.vercel.app/api/health
   ```
   Should return: `{"status":"ok","timestamp":"..."}`

4. **Test registration** - Try the form on your app

## 📚 Full Documentation

- **Deployment Guide**: See `DEPLOYMENT_SETUP.md`
- **Environment Setup**: See `VERCEL_ENV_MANUAL_SETUP.md`
- **API Documentation**: See `backend/routes/api.php`

## ⚠️ Security Warning

Database and storage credentials were shared in chat. After verifying this works:
1. Rotate your Neon database password
2. Rotate your R2 credentials
3. Update them in Vercel environment variables

## 🆘 Issues?

- **"Unexpected token '<'" error**: Environment variables not set yet
- **Timeout on API calls**: Missing database credentials
- **Registration fails**: Run migrations with `php artisan migrate --force`

See `VERCEL_ENV_MANUAL_SETUP.md` troubleshooting section for more help.
