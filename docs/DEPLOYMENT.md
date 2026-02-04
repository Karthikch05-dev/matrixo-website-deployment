# matriXO Website - Deployment Guide

This guide will help you deploy the matriXO website to production.

## Option 1: Vercel (Recommended)

Vercel is the easiest way to deploy Next.js applications.

### Steps:

1. **Push to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin YOUR_GITHUB_REPO_URL
   git push -u origin main
   ```

2. **Deploy on Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository
   - Configure:
     - Framework Preset: Next.js
     - Root Directory: ./
     - Build Command: `npm run build`
     - Output Directory: .next
   - Click "Deploy"

3. **Custom Domain**
   - Go to Project Settings → Domains
   - Add `matrixo.in`
   - Update your DNS records as instructed

### Environment Variables
Add in Vercel Dashboard → Settings → Environment Variables:
- `MONGODB_URI` (if using MongoDB)
- `NEXT_PUBLIC_SITE_URL=https://matrixo.in`

---

## Option 2: Netlify

### Steps:

1. **Build the project**
   ```bash
   npm run build
   ```

2. **Deploy via Netlify CLI**
   ```bash
   npm install -g netlify-cli
   netlify deploy --prod
   ```

3. **Or use Netlify Dashboard**
   - Connect your GitHub repo
   - Build command: `npm run build`
   - Publish directory: `.next`

---

## Option 3: Self-Hosted (VPS/Server)

### Requirements:
- Node.js 18+
- PM2 (process manager)
- Nginx (web server)

### Steps:

1. **Install dependencies on server**
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   sudo npm install -g pm2
   ```

2. **Clone and build**
   ```bash
   git clone YOUR_REPO_URL matrixo-website
   cd matrixo-website
   npm install
   npm run build
   ```

3. **Start with PM2**
   ```bash
   pm2 start npm --name "matrixo-website" -- start
   pm2 save
   pm2 startup
   ```

4. **Configure Nginx**
   Create `/etc/nginx/sites-available/matrixo.in`:
   ```nginx
   server {
       listen 80;
       server_name matrixo.in www.matrixo.in;

       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

   Enable site:
   ```bash
   sudo ln -s /etc/nginx/sites-available/matrixo.in /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl reload nginx
   ```

5. **SSL Certificate (Let's Encrypt)**
   ```bash
   sudo apt install certbot python3-certbot-nginx
   sudo certbot --nginx -d matrixo.in -d www.matrixo.in
   ```

---

## Option 4: Docker Deployment

### Dockerfile
Create `Dockerfile`:
```dockerfile
FROM node:18-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

FROM node:18-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:18-alpine AS runner
WORKDIR /app
ENV NODE_ENV production
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000
ENV PORT 3000

CMD ["node", "server.js"]
```

### Deploy:
```bash
docker build -t matrixo-website .
docker run -p 3000:3000 matrixo-website
```

---

## Post-Deployment Checklist

✅ **DNS Configuration**
- Point domain to deployment platform
- Configure www subdomain
- Enable SSL/HTTPS

✅ **Performance**
- Enable CDN (Vercel/Netlify do this automatically)
- Configure caching headers
- Enable image optimization

✅ **SEO**
- Submit sitemap to Google Search Console
- Verify robots.txt is accessible
- Test meta tags with social media debuggers

✅ **Analytics**
- Set up Google Analytics
- Configure tracking events
- Monitor Core Web Vitals

✅ **Monitoring**
- Set up error tracking (Sentry)
- Monitor uptime
- Track performance metrics

✅ **Security**
- Enable HTTPS
- Configure security headers
- Set up rate limiting

---

## Updating the Site

### Vercel/Netlify (Auto-deploy)
Simply push to your main branch:
```bash
git add .
git commit -m "Update content"
git push
```

### Self-Hosted
```bash
cd matrixo-website
git pull
npm install
npm run build
pm2 restart matrixo-website
```

---

## Rollback

### Vercel
- Go to Deployments
- Click on previous successful deployment
- Click "Promote to Production"

### PM2
```bash
git reset --hard COMMIT_HASH
npm install
npm run build
pm2 restart matrixo-website
```

---

## Troubleshooting

### Build Fails
- Check Node version (needs 18+)
- Clear `.next` folder and rebuild
- Check for TypeScript errors

### 404 Errors
- Verify all routes are correctly defined
- Check `next.config.js` configuration
- Ensure dynamic routes use `[slug]` pattern

### Slow Performance
- Enable Next.js Image optimization
- Check for large bundle sizes
- Implement lazy loading

---

## Support

For deployment help:
- Email: hello@matrixo.in
- Check Next.js documentation: https://nextjs.org/docs

---

**Happy Deploying! 🚀**
