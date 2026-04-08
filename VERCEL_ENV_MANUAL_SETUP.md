# Vercel Environment Variables - Manual Setup Guide

## Why This is Needed
Your Moments app needs database and storage credentials to work. These should **never be committed to Git** - they must be added via Vercel's secure environment variable system.

## Step-by-Step Guide

### 1. Go to Vercel Dashboard
- Open https://vercel.com/dashboard
- Click on your **moments** project
- Click **Settings** → **Environment Variables**

### 2. Add Each Variable

Click **Add New** for each variable below and enter both the Key and Value:

#### Database Configuration (Neon PostgreSQL)

**APP_KEY**
- Key: `APP_KEY`
- Value: `base64:vy6dXzl9qTfPiCzZtBJBGb7JGbc9hInaiobAXX9tjY8=`
- Environment: Production

**DB_CONNECTION**
- Key: `DB_CONNECTION`
- Value: `pgsql`
- Environment: Production

**DB_HOST**
- Key: `DB_HOST`
- Value: `ep-dry-thunder-ancazkjj-pooler.c-6.us-east-1.aws.neon.tech`
- Environment: Production

**DB_PORT**
- Key: `DB_PORT`
- Value: `5432`
- Environment: Production

**DB_DATABASE**
- Key: `DB_DATABASE`
- Value: `neondb`
- Environment: Production

**DB_USERNAME**
- Key: `DB_USERNAME`
- Value: `neondb_owner`
- Environment: Production

**DB_PASSWORD**
- Key: `DB_PASSWORD`
- Value: `npg_dy7fCVnUHk2B`
- Environment: Production

**DB_SSLMODE**
- Key: `DB_SSLMODE`
- Value: `require`
- Environment: Production

#### Storage Configuration (Cloudflare R2)

**AWS_ACCESS_KEY_ID**
- Key: `AWS_ACCESS_KEY_ID`
- Value: (Your R2 access key)
- Environment: Production

**AWS_SECRET_ACCESS_KEY**
- Key: `AWS_SECRET_ACCESS_KEY`
- Value: (Your R2 secret key)
- Environment: Production

**AWS_BUCKET**
- Key: `AWS_BUCKET`
- Value: `moments-media`
- Environment: Production

**AWS_ENDPOINT**
- Key: `AWS_ENDPOINT`
- Value: `https://36141b1be9f6c9842f9d73d2c4925158.r2.cloudflarestorage.com`
- Environment: Production

#### CORS Configuration

**CORS_ALLOWED_ORIGINS**
- Key: `CORS_ALLOWED_ORIGINS`
- Value: `https://moments-us-app.vercel.app`
- Environment: Production

### 3. Verify All Variables Are Set
- You should have 13 total environment variables
- All should be set to **Production** environment
- No values should be visible in plaintext once saved

### 4. Redeploy Your Project
After adding all variables:
1. Go to **Deployments** tab
2. Click the three dots on the latest deployment
3. Click **Redeploy**
4. Wait for deployment to complete

Or use CLI:
```bash
vercel redeploy --prod
```

### 5. Test the API

Test the health endpoint to verify it's working:
```bash
curl https://moments-us-app.vercel.app/api/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2026-04-08T..."
}
```

### 6. Run Database Migrations

Once the API is working, run migrations to create tables:

**Option A - Using Vercel CLI:**
```bash
vercel env pull
cd backend
php artisan migrate --force
```

**Option B - Direct connection (if you have Neon access):**
```bash
cd backend
export DB_CONNECTION=pgsql
export DB_HOST=ep-dry-thunder-ancazkjj-pooler.c-6.us-east-1.aws.neon.tech
export DB_PORT=5432
export DB_DATABASE=neondb
export DB_USERNAME=neondb_owner
export DB_PASSWORD=npg_dy7fCVnUHk2B
export DB_SSLMODE=require
php artisan migrate
```

## Troubleshooting

### API still returning HTML error?
- ❌ **Problem**: Environment variables not set yet
- ✅ **Solution**: Make sure you've set all 13 variables and redeployed

### Database connection timeout?
- ❌ **Problem**: DB_HOST or credentials are incorrect
- ✅ **Solution**: Verify they match your Neon dashboard exactly

### 502 Bad Gateway?
- ❌ **Problem**: PHP error in the serverless function
- ✅ **Solution**: Check Vercel function logs (Deployments → Logs)

### Registration form still says "Unexpected token '<'"?
- ❌ **Problem**: API is returning HTML instead of JSON
- ✅ **Solution**: Check `/api/health` endpoint first - if that returns JSON, migrations haven't run yet

## Security Notes

⚠️ **These credentials were exposed in chat**. You should:
1. Rotate your Neon database password after verifying this works
2. Rotate your R2 credentials 
3. Update them in Vercel environment variables
4. Never commit secrets to Git (they're in .gitignore on the repo, but be careful)

## Next Steps After Setup

1. ✅ Add environment variables to Vercel
2. ✅ Redeploy project
3. ✅ Run database migrations
4. ✅ Test `/api/health` endpoint
5. ✅ Test registration form
6. ✅ Rotate exposed credentials
7. ✅ Monitor logs in Vercel dashboard
