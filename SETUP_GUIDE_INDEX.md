# Moments Deployment - Complete Setup Guide Index

This directory contains everything needed to deploy and configure Moments on Vercel.

## 📖 Documentation Files

### 1. **START HERE: QUICK_START.md** ⭐
   - Quick reference guide (5 minutes)
   - Two setup options (automated or manual)
   - Next steps after setup
   - Quick troubleshooting

### 2. VERCEL_ENV_SETUP.sh
   - Automated script for environment variable setup
   - Uses Vercel CLI to add all 13 variables at once
   - **Usage**: `bash VERCEL_ENV_SETUP.sh`

### 3. VERCEL_ENV_MANUAL_SETUP.md
   - Step-by-step UI guide for Vercel dashboard
   - List of all 13 environment variables with descriptions
   - Complete troubleshooting section
   - Security recommendations

### 4. DEPLOYMENT_SETUP.md
   - Full deployment architecture explanation
   - Database migration instructions
   - API endpoint documentation
   - Detailed troubleshooting guide

### 5. README.md
   - Project overview and features

## 🔧 What You Need to Configure

Your app is deployed but needs these 13 environment variables in Vercel:

**Database (Neon PostgreSQL)**
- APP_KEY
- DB_CONNECTION
- DB_HOST
- DB_PORT
- DB_DATABASE
- DB_USERNAME
- DB_PASSWORD
- DB_SSLMODE

**Storage (Cloudflare R2)**
- AWS_ACCESS_KEY_ID
- AWS_SECRET_ACCESS_KEY
- AWS_BUCKET
- AWS_ENDPOINT

**Frontend Integration**
- CORS_ALLOWED_ORIGINS

## ✅ Setup Checklist

- [ ] Read QUICK_START.md
- [ ] Choose automated or manual setup
- [ ] Add all 13 environment variables to Vercel
- [ ] Redeploy project on Vercel
- [ ] Run `php artisan migrate --force`
- [ ] Test `/api/health` endpoint
- [ ] Test registration form
- [ ] Rotate exposed credentials
- [ ] Monitor logs in Vercel dashboard

## 🚀 Quick Links

- **Vercel Dashboard**: https://vercel.com/dashboard
- **This Project**: moments-us-app.vercel.app
- **GitHub Repo**: https://github.com/100-1824/Moments

## 📞 Support

If you encounter issues:
1. Check QUICK_START.md troubleshooting section
2. Review VERCEL_ENV_MANUAL_SETUP.md for detailed help
3. Check Vercel function logs in the dashboard
4. Verify all environment variables are set correctly

---

**⚠️ Security Note**: Database and R2 credentials were exposed in chat. 
Please rotate them after verifying the setup works.
