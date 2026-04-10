# 🚨 URGENT: Fix the JSON Error in 5 Minutes

Your app is deployed but **missing environment variables**. This is why you see "Unexpected token '<'".

## ⚡ Quick Fix (Do this NOW)

### Step 1: Go to Vercel Dashboard
```
https://vercel.com/dashboard/moments
```

### Step 2: Click "Settings" Tab
(At the top of your project page)

### Step 3: Click "Environment Variables" (Left Menu)

### Step 4: Add These 17 Variables

**Copy and paste EXACTLY - one by one:**

| Click Add New | Paste Key | Paste Value | Select |
|---|---|---|---|
| 1 | `APP_KEY` | `base64:vy6dXzl9qTfPiCzZtBJBGb7JGbc9hInaiobAXX9tjY8=` | Production |
| 2 | `APP_ENV` | `production` | Production |
| 3 | `APP_DEBUG` | `false` | Production |
| 4 | `DB_CONNECTION` | `pgsql` | Production |
| 5 | `DB_HOST` | `ep-dry-thunder-ancazkjj-pooler.c-6.us-east-1.aws.neon.tech` | Production |
| 6 | `DB_PORT` | `5432` | Production |
| 7 | `DB_DATABASE` | `neondb` | Production |
| 8 | `DB_USERNAME` | `neondb_owner` | Production |
| 9 | `DB_PASSWORD` | `npg_dy7fCVnUHk2B` | Production |
| 10 | `DB_SSLMODE` | `require` | Production |
| 11 | `AWS_BUCKET` | `moments-media` | Production |
| 12 | `AWS_ENDPOINT` | `https://36141b1be9f6c9842f9d73d2c4925158.r2.cloudflarestorage.com` | Production |
| 13 | `AWS_REGION` | `us-east-1` | Production |
| 14 | `AWS_USE_PATH_STYLE_ENDPOINT` | `true` | Production |
| 15 | `CACHE_DRIVER` | `array` | Production |
| 16 | `SESSION_DRIVER` | `array` | Production |
| 17 | `CORS_ALLOWED_ORIGINS` | `https://moments-us-app.vercel.app` | Production |

**⚠️ IMPORTANT**: 
- **Replace placeholder values** for AWS keys if you have them
- If you don't have `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY`, you MUST get them from Cloudflare R2
- Each variable must be set to **Production** environment

### Step 5: Redeploy
1. Click **Deployments** tab
2. Find the latest deployment (gray X on the right)
3. Click the **three dots (...)**
4. Click **Redeploy**
5. Wait ~2 minutes for it to finish

### Step 6: Test
Go to: `https://moments-us-app.vercel.app/`

The error should be gone! ✅

---

## 🔑 If You're Missing R2 Keys

You need these from Cloudflare:
- `AWS_ACCESS_KEY_ID` 
- `AWS_SECRET_ACCESS_KEY`

**Where to find them:**
1. Go to Cloudflare Dashboard
2. R2 → API Tokens
3. Copy your credentials
4. Add to steps above (items 11-12)

**Don't have them?** You can:
- Check your saved passwords/notes
- Generate new ones in Cloudflare
- Ask the person who set up R2

---

## ✅ Checklist

- [ ] Opened https://vercel.com/dashboard/moments
- [ ] Clicked Settings
- [ ] Clicked Environment Variables
- [ ] Added all 17 variables
- [ ] All variables set to "Production"
- [ ] Clicked Redeploy
- [ ] Waited for deployment to complete
- [ ] Tested the app at https://moments-us-app.vercel.app

---

## 🔧 If It Still Doesn't Work

1. **Error still shows?**
   - Wait 5 minutes after redeploying
   - Clear your browser cache
   - Open in incognito/private mode
   - Check that ALL 17 variables are set

2. **Different error?**
   - Check Vercel function logs: Deployments → Logs
   - Look for database connection errors
   - Verify DB_PASSWORD is correct in Neon dashboard

3. **Database error?**
   - Run: `php artisan migrate --force`
   - This creates the tables

---

## 📞 Need Help?

- Check `VERCEL_ENV_MANUAL_SETUP.md` for detailed info
- Check Vercel logs for specific errors
- Make sure R2 credentials are correct

**The registration form will work once you complete these steps!** 🎉
