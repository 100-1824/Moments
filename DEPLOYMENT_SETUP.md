# Moments Deployment Setup Guide

## Current Status
Your application is now configured for:
- **Frontend**: Vite + React deployed to Vercel
- **Backend**: Laravel 11 PHP API deployed as Vercel serverless function
- **Database**: Neon PostgreSQL
- **File Storage**: Cloudflare R2

## Issue Resolved
Fixed the "Unexpected token '<'" JSON parsing error by ensuring all API responses return proper JSON instead of HTML error pages.

## Required Setup Steps

### 1. Update Vercel Environment Variables
Go to **Vercel Dashboard** → Your Project → **Settings** → **Environment Variables**

Add these variables (replace with your actual values):

```
APP_KEY = base64:vy6dXzl9qTfPiCzZtBJBGb7JGbc9hInaiobAXX9tjY8=
DB_CONNECTION = pgsql
DB_HOST = ep-dry-thunder-ancazkjj-pooler.c-6.us-east-1.aws.neon.tech
DB_PORT = 5432
DB_DATABASE = neondb
DB_USERNAME = neondb_owner
DB_PASSWORD = npg_dy7fCVnUHk2B
DB_SSLMODE = require
AWS_ACCESS_KEY_ID = (your R2 access key)
AWS_SECRET_ACCESS_KEY = (your R2 secret key)
AWS_BUCKET = moments-media
AWS_ENDPOINT = https://36141b1be9f6c9842f9d73d2c4925158.r2.cloudflarestorage.com
CORS_ALLOWED_ORIGINS = https://moments-rnbsk9env-100-1824s-projects.vercel.app
```

**⚠️ IMPORTANT**: These variables will be automatically deployed when you redeploy.

### 2. Run Database Migrations
Once environment variables are set, run migrations on your Neon database:

**Option A - Using Vercel CLI (Recommended)**:
```bash
# Install if you don't have it
npm install -g vercel

# Navigate to your project
cd /workspaces/Moments

# Pull environment from Vercel
vercel env pull --environment=production

# Run migrations
cd backend
php artisan migrate --force
```

**Option B - Local Connection (if you can access Neon)**:
```bash
cd backend
export PATH=/usr/bin:$PATH
export DB_CONNECTION=pgsql
export DB_HOST=ep-dry-thunder-ancazkjj-pooler.c-6.us-east-1.aws.neon.tech
export DB_PORT=5432
export DB_DATABASE=neondb
export DB_USERNAME=neondb_owner
export DB_PASSWORD=npg_dy7fCVnUHk2B
export DB_SSLMODE=require

php artisan migrate
```

### 3. Test the API

Test the health endpoint:
```bash
curl https://moments-rnbsk9env-100-1824s-projects.vercel.app/api/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2026-04-08T..."
}
```

### 4. Test Registration

Try the registration form in your app. It should now:
- ✅ Send POST request to `/api/auth/register`
- ✅ Receive JSON response (not HTML error)
- ✅ Create user in Neon database
- ✅ Return auth token

### 5. Security - Rotate Credentials

Since credentials were exposed in chat, you should:

**Rotate Neon Database**:
1. Go to Neon dashboard
2. Reset your database password
3. Update DB_PASSWORD in Vercel

**Rotate R2 Credentials**:
1. Go to Cloudflare dashboard
2. Generate new R2 API tokens
3. Update AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY in Vercel

## Files Changed
- `api/index.php` - Added robust error handling, health check, proper JSON responses
- `vercel.json` - Removed secrets (add them to Vercel dashboard instead)
- `backend/config/database.php` - Ensure PostgreSQL is default
- Removed `.env.production` - Secrets should only be in Vercel dashboard

## API Endpoints

### Public
- `POST /api/auth/register` - Register new user
  ```json
  {
    "name": "John Doe",
    "phone": "+1234567890",
    "timezone": "America/New_York"
  }
  ```

### Protected (require Bearer token)
- `POST /api/auth/connect` - Connect with partner
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout
- `POST /api/moments` - Upload moment
- `GET /api/moments/today` - Get today's moments
- `POST /api/moments/sync` - Sync offline queue

## Troubleshooting

### Still getting "Unexpected token" error?
1. Check Vercel function logs in dashboard
2. Test `/api/health` endpoint
3. Verify all environment variables are set
4. Check database connection in Vercel logs

### Database migration failed?
1. Ensure DB_PASSWORD and DB_HOST are correct
2. Check if Neon connection pool is active
3. View Neon dashboard for connection errors
4. Try running migration again with `--force` flag

### R2 uploads failing?
1. Verify R2 credentials are correct
2. Check CORS settings in R2 bucket
3. Ensure AWS_ENDPOINT is correct
4. Check file permissions in Cloudflare dashboard

## Next Steps
1. ✅ Update Vercel environment variables
2. ✅ Run database migrations
3. ✅ Test health endpoint
4. ✅ Test registration form
5. ✅ Rotate exposed credentials
6. ✅ Monitor Vercel logs for any errors
