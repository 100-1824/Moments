# Copy and Paste These Exact Values to Vercel

## 5 Missing Environment Variables

Copy each line exactly and add to Vercel (Settings > Environment Variables):

```
DB_CONNECTION=pgsql
CACHE_DRIVER=array
SESSION_DRIVER=array
FILESYSTEM_DISK=s3
QUEUE_CONNECTION=sync
```

---

## How to Add Each One to Vercel

For each variable above:

1. **Click "Add New"** button in Environment Variables page
2. **Copy the Key** (left side):
   - Paste: `DB_CONNECTION`
   - Paste: `CACHE_DRIVER`
   - Paste: `SESSION_DRIVER`
   - Paste: `FILESYSTEM_DISK`
   - Paste: `QUEUE_CONNECTION`

3. **Copy the Value** (right side):
   - Paste: `pgsql`
   - Paste: `array`
   - Paste: `array`
   - Paste: `s3`
   - Paste: `sync`

4. **Select**: Production
5. **Click**: Save

---

## Quick Table Format

| Key | Value |
|-----|-------|
| DB_CONNECTION | pgsql |
| CACHE_DRIVER | array |
| SESSION_DRIVER | array |
| FILESYSTEM_DISK | s3 |
| QUEUE_CONNECTION | sync |

---

## ✅ After Adding These 5:

You'll have all 19 required variables. Then:

1. Go to **Deployments** tab
2. Click **...** (three dots) on latest deployment
3. Click **Redeploy**
4. Wait for "Ready" status
5. Test: https://moments-us-app.vercel.app/

**The JSON error will be gone!** 🎉
