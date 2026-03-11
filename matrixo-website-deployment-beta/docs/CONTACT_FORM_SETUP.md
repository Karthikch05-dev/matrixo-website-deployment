# Contact Form Setup Guide

Your contact form is now configured to send emails to **hello@matrixo.in** whenever someone submits the form.

## Setup Steps

### 1. Get Resend API Key (FREE)

1. Go to [resend.com](https://resend.com)
2. Sign up for a free account
3. Verify your email address
4. Go to **API Keys** section
5. Click **Create API Key**
6. Copy the API key (starts with `re_`)

### 2. Add Environment Variable

Create a `.env.local` file in your project root (same folder as `package.json`):

```env
RESEND_API_KEY=re_your_actual_api_key_here
```

**Important:** 
- Do NOT commit `.env.local` to git (it's already in `.gitignore`)
- For Vercel deployment, add this as an environment variable in Vercel dashboard

### 3. Verify Domain (Optional but Recommended)

With the free plan, emails will come from `onboarding@resend.dev`. To use your own domain:

1. In Resend dashboard, go to **Domains**
2. Click **Add Domain**
3. Enter your domain (e.g., `matrixo.com`)
4. Add the DNS records shown (SPF, DKIM, etc.)
5. Wait for verification (usually 5-15 minutes)
6. Update `app/api/contact/route.ts` line 21:
   ```typescript
   from: 'matriXO <contact@yourdomain.com>',
   ```

## For Local Testing

1. Add the `RESEND_API_KEY` to `.env.local`
2. Restart your dev server: `npm run dev`
3. Go to the contact page and submit the form
4. Check your email at **hello@matrixo.in**

## For Vercel Deployment

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add:
   - **Key:** `RESEND_API_KEY`
   - **Value:** Your Resend API key
   - **Environment:** Production, Preview, Development (select all)
4. Click **Save**
5. Redeploy your site

## How It Works

When someone fills out the contact form:

1. Form data is sent to `/api/contact` endpoint
2. The API validates the data
3. Resend sends a formatted email to `hello@matrixo.in`
4. The email includes:
   - Name, email, phone (if provided), subject
   - Full message content
   - Reply-to address set to sender's email (you can reply directly)
5. User sees success/error message

## Email Format

You'll receive emails like this:

**Subject:** New Contact Form: [Subject from form]

**From:** matriXO Contact Form <onboarding@resend.dev>

**Reply-To:** [sender's email]

**Body:**
- Name, email, phone, subject
- Full message content
- Timestamp and source info

## Free Tier Limits

Resend free plan includes:
- 100 emails per day
- 3,000 emails per month
- Unlimited domains
- Full API access

This is more than enough for a contact form!

## Troubleshooting

### "Failed to send message" error
- Check if `RESEND_API_KEY` is set correctly
- Verify the API key is valid in Resend dashboard
- Check browser console for detailed errors

### Not receiving emails
- Check spam/junk folder
- Verify the recipient email in `app/api/contact/route.ts` (line 23)
- Check Resend dashboard → **Logs** to see email status

### Vercel deployment issues
- Make sure environment variable is added in Vercel
- Redeploy after adding the variable
- Check Vercel function logs for errors

## Support

If you need help, check:
- [Resend Documentation](https://resend.com/docs)
- [Resend Discord Community](https://resend.com/discord)
