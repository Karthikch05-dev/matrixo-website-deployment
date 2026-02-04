# 🚀 QUICK START - Razorpay Integration Checklist

## ⚠️ IMMEDIATE ACTION REQUIRED

### Payment Error Fix (3 Steps - 2 Minutes)

#### 1️⃣ Get Razorpay Keys
- Visit: https://dashboard.razorpay.com/app/keys
- Click "Generate Test Keys"
- Copy both **Key ID** and **Key Secret**

#### 2️⃣ Update .env.local File
Open `.env.local` in your project root and replace:

```bash
# BEFORE (placeholder - won't work)
RAZORPAY_KEY_ID=your_razorpay_key_id_here

# AFTER (your actual keys)
RAZORPAY_KEY_ID=rzp_test_ABC123XYZ
RAZORPAY_KEY_SECRET=your_actual_secret_key_here
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_ABC123XYZ
```

#### 3️⃣ Restart Server
```powershell
# Press Ctrl+C to stop, then:
npm run dev
```

**Done! Payment should work now. Test with card: 4111 1111 1111 1111**

---

## ✅ Razorpay Verification URLs

When Razorpay asks for policy pages, paste these URLs:

| Required Page | Your URL | Status |
|--------------|----------|--------|
| Contact Us | `https://matrixo.in/contact` | ✅ |
| Terms & Conditions | `https://matrixo.in/terms` | ✅ |
| Privacy Policy | `https://matrixo.in/privacy` | ✅ |
| Cancellations & Refunds | `https://matrixo.in/refund` | ✅ |
| Shipping & Delivery | `https://matrixo.in/shipping` | ✅ |

**Select:** "Yes I have the link for this" → Paste URL

---

## 🐛 Debugging Payment Errors

### Check Browser Console (F12)
1. Press `F12` (Chrome/Edge) or open Developer Tools
2. Go to **Console** tab
3. Click "Pay Now" button
4. Look for error messages

### Common Errors:

#### ❌ "Authentication failed"
**Fix:** Update `.env.local` with real Razorpay keys

#### ❌ "Failed to fetch"
**Fix:** Ensure `npm run dev` is running

#### ❌ "Response status: 500"
**Fix:** Check terminal logs, likely invalid keys

---

## 📋 Test Payment Flow

1. Go to http://localhost:3000/events
2. Click any event → "Register Now"
3. Fill form → Click "Pay Now"
4. **Razorpay modal should open** ✅
5. Test Card Details:
   - **Card:** `4111 1111 1111 1111`
   - **Expiry:** `12/30` (any future date)
   - **CVV:** `123` (any 3 digits)
6. Click "Pay" → Should see success ✅

---

## 📚 Full Documentation

- **Policy Pages:** `RAZORPAY_POLICY_PAGES.md`
- **Payment Debugging:** `DEBUG_PAYMENT_ERRORS.md`
- **Complete Guide:** `RAZORPAY_COMPLETE_GUIDE.md`
- **Deployment:** `DEPLOY.md`

---

## 🚀 Deployment Checklist

Before going live:

- [ ] Add real Razorpay keys to `.env.local`
- [ ] Test payment works locally
- [ ] Deploy to Vercel/Netlify
- [ ] Configure domain (matrixo.in)
- [ ] Test all policy pages load via HTTPS
- [ ] Submit URLs to Razorpay dashboard
- [ ] Complete Razorpay KYC verification

---

## 💡 Quick Tips

✅ **Test Mode:** Use keys starting with `rzp_test_`  
✅ **Test Card:** `4111 1111 1111 1111`  
✅ **Live Mode:** Switch to `rzp_live_` after activation  
✅ **Support Email:** hello@matrixo.in

---

**Need Help?** Check the full documentation files or open browser console (F12) to see exact errors.

**Last Updated:** October 9, 2025
