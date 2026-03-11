# 🚀 Quick Deployment Guide - Before Razorpay Submission

## Why Deploy First?

Razorpay verification team will visit your policy pages to verify they exist. They need to be live on the internet, not just on your local machine (localhost).

---

## 🌐 Option 1: Deploy to Vercel (RECOMMENDED - 5 minutes)

### Step 1: Create Vercel Account
1. Go to https://vercel.com
2. Sign up with GitHub (recommended)

### Step 2: Deploy Your Project

#### Method A: Using Vercel CLI
```powershell
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy (from your project folder)
vercel

# Follow prompts:
# - Set up and deploy? Y
# - Which scope? (select your account)
# - Link to existing project? N
# - Project name? matrixo-website
# - In which directory? ./
# - Override settings? N
```

#### Method B: Using Vercel Website
1. Go to https://vercel.com/new
2. Import Git Repository (or drag & drop your folder)
3. Configure project:
   - **Framework Preset:** Next.js
   - **Root Directory:** ./
   - **Build Command:** `npm run build`
   - **Output Directory:** (leave default)
4. Add Environment Variables:
   ```
   RAZORPAY_KEY_ID=rzp_test_YOUR_KEY
   RAZORPAY_KEY_SECRET=YOUR_SECRET
   NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_YOUR_KEY
   ```
5. Click **Deploy**

### Step 3: Configure Custom Domain
1. In Vercel Dashboard → Settings → Domains
2. Add domain: `matrixo.in`
3. Follow DNS configuration instructions
4. Wait for DNS propagation (5-30 minutes)

### Step 4: Verify Policy Pages
Test that all pages load:
- https://matrixo.in/contact ✅
- https://matrixo.in/terms ✅
- https://matrixo.in/privacy ✅
- https://matrixo.in/refund ✅
- https://matrixo.in/shipping ✅

### Step 5: Submit to Razorpay
Now you can submit the URLs to Razorpay! ✅

---

## 🌐 Option 2: Deploy to Netlify

### Quick Deploy
```powershell
# Install Netlify CLI
npm install -g netlify-cli

# Login
netlify login

# Initialize
netlify init

# Deploy
netlify deploy --prod
```

### Configure Domain
1. Netlify Dashboard → Domain Settings
2. Add custom domain: `matrixo.in`
3. Follow DNS setup

---

## 🔧 Environment Variables (IMPORTANT)

When deploying, add these environment variables in your hosting platform:

```bash
RAZORPAY_KEY_ID=rzp_test_YOUR_ACTUAL_KEY_ID
RAZORPAY_KEY_SECRET=YOUR_ACTUAL_SECRET_KEY
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_YOUR_ACTUAL_KEY_ID
```

**Where to add:**
- **Vercel:** Settings → Environment Variables
- **Netlify:** Site Settings → Environment Variables

---

## 📝 Pre-Deployment Checklist

Before deploying:

- [ ] All policy pages created (✅ Already done)
- [ ] Footer links updated (✅ Already done)
- [ ] `.env.local` has real Razorpay keys (⚠️ Update this)
- [ ] Test payment locally (works with test keys)
- [ ] Remove any console.logs in production code
- [ ] Test website on mobile/desktop locally

---

## 🎯 Post-Deployment Checklist

After deploying:

- [ ] Website loads at your domain
- [ ] All 5 policy pages accessible via HTTPS
- [ ] SSL certificate is active (🔒 in browser)
- [ ] Payment flow works on production
- [ ] Mobile responsive
- [ ] No console errors in browser

---

## 🚫 Option B: Use Localhost URLs (NOT RECOMMENDED)

If you want to test Razorpay verification before deploying:

**You CAN'T use:** `http://localhost:3000/contact`  
**Razorpay won't accept:** Localhost URLs

**Alternative for testing:**
1. Use ngrok to expose localhost:
   ```powershell
   # Install ngrok
   # Download from https://ngrok.com/download
   
   # Run ngrok
   ngrok http 3000
   ```
2. Use the ngrok URL (e.g., `https://abc123.ngrok.io`)
3. Submit URLs like: `https://abc123.ngrok.io/contact`

**However, this is temporary and will expire!** Not recommended for actual Razorpay activation.

---

## 🔗 Domain Setup (matrixo.in)

If you already own `matrixo.in`, configure DNS:

### For Vercel:
Add these DNS records at your domain registrar:

```
Type: A
Name: @
Value: 76.76.21.21

Type: CNAME
Name: www
Value: cname.vercel-dns.com
```

### For Netlify:
```
Type: A
Name: @
Value: 75.2.60.5

Type: CNAME  
Name: www
Value: your-site.netlify.app
```

---

## 📞 Quick Deploy Help

### Vercel Deployment Issues:
- **Build fails:** Check `npm run build` works locally
- **Environment variables:** Add them in Vercel dashboard
- **Domain not working:** Check DNS propagation (can take 24 hours)

### Common Errors:
- **"Module not found":** Run `npm install` before deploying
- **"Build failed":** Check for TypeScript/ESLint errors
- **"Page not found":** Verify file paths are correct

---

## ✅ Recommended Timeline

1. **Today:** Deploy to Vercel (15 minutes)
2. **Today:** Configure domain DNS (5 minutes)
3. **Wait:** DNS propagation (5-30 minutes)
4. **Today:** Test all pages load via HTTPS
5. **Today:** Submit URLs to Razorpay
6. **1-2 days:** Razorpay verification review
7. **After approval:** Switch to live keys

---

## 🎉 After Successful Deployment

Once your site is live:

1. ✅ Test all policy pages load
2. ✅ Test payment flow works
3. ✅ Submit URLs to Razorpay form
4. ✅ Click "Submit" button
5. ✅ Wait for Razorpay verification email
6. ✅ Complete any additional KYC if required

---

**Ready to deploy?** I recommend **Vercel** - it's the easiest and fastest for Next.js projects!

**Last Updated:** October 9, 2025
