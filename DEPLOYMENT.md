# Deployment Guide

This guide covers deploying the React DMT application to various platforms.

## 🚀 Quick Deploy Options

### 1. Vercel (Recommended - Easiest)

**Steps:**
1. Install Vercel CLI:
   ```bash
   npm i -g vercel
   ```

2. Deploy:
   ```bash
   vercel
   ```

3. Or deploy from GitHub:
   - Push your code to GitHub
   - Go to [vercel.com](https://vercel.com)
   - Import your repository
   - Vercel will auto-detect Vite and deploy

**Environment Variables in Vercel Dashboard:**
- `VITE_ENVIRONMENT` = `production`
- `VITE_API_BASE_URL` = `https://api.datamatter.tech`
- `VITE_WS_BASE_URL` = `wss://api.datamatter.tech`

**For different environments:**
- Create separate projects in Vercel
- Set environment variables per project
- Or use Vercel's branch-based environment variables

---

### 2. Netlify

**Steps:**
1. Install Netlify CLI:
   ```bash
   npm i -g netlify-cli
   ```

2. Build and deploy:
   ```bash
   npm run build
   netlify deploy --prod
   ```

3. Or deploy from GitHub:
   - Push your code to GitHub
   - Go to [netlify.com](https://netlify.com)
   - Click "New site from Git"
   - Connect your repository
   - Build settings:
     - Build command: `npm run build`
     - Publish directory: `dist`

**Environment Variables in Netlify Dashboard:**
- Go to Site settings → Build & deploy → Environment
- Add variables:
  - `VITE_ENVIRONMENT` = `production`
  - `VITE_API_BASE_URL` = `https://api.datamatter.tech`
  - `VITE_WS_BASE_URL` = `wss://api.datamatter.tech`

**Branch-based deployments:**
- Production branch: `main` or `master`
- Deploy previews automatically created for PRs
- Configure branch-specific environment variables in `netlify.toml`

---

### 3. GitHub Pages

**Steps:**

1. Install gh-pages:
   ```bash
   npm install --save-dev gh-pages
   ```

2. Add deploy script to `package.json`:
   ```json
   {
     "scripts": {
       "deploy": "npm run build && gh-pages -d dist"
     }
   }
   ```

3. Update `vite.config.ts`:
   ```typescript
   export default defineConfig({
     base: '/react_dmt/', // Replace with your repo name
     plugins: [react()],
     envPrefix: 'VITE_',
   })
   ```

4. Deploy:
   ```bash
   npm run deploy
   ```

5. Enable GitHub Pages:
   - Go to repository Settings → Pages
   - Source: `gh-pages` branch
   - Root folder: `/ (root)`

---

### 4. AWS S3 + CloudFront

**Steps:**

1. Build the application:
   ```bash
   npm run build
   ```

2. Upload to S3:
   ```bash
   aws s3 sync dist/ s3://your-bucket-name --delete
   ```

3. Configure CloudFront:
   - Create CloudFront distribution
   - Origin: Your S3 bucket
   - Default root object: `index.html`
   - Error pages: 404 → `/index.html` (200)

**Environment Variables:**
- Set in CloudFront environment variables
- Or build with environment variables:
  ```bash
  VITE_ENVIRONMENT=prod VITE_API_BASE_URL=https://api.datamatter.tech npm run build
  ```

---

### 5. Traditional Server (Nginx/Apache)

**Steps:**

1. Build the application:
   ```bash
   npm run build
   ```

2. Copy `dist` folder to your server

3. **Nginx configuration** (`/etc/nginx/sites-available/your-app`):
   ```nginx
   server {
       listen 80;
       server_name yourdomain.com;
       root /var/www/your-app/dist;
       index index.html;

       location / {
           try_files $uri $uri/ /index.html;
       }
   }
   ```

4. **Apache configuration** (`.htaccess` in dist folder):
   ```apache
   <IfModule mod_rewrite.c>
     RewriteEngine On
     RewriteBase /
     RewriteRule ^index\.html$ - [L]
     RewriteCond %{REQUEST_FILENAME} !-f
     RewriteCond %{REQUEST_FILENAME} !-d
     RewriteRule . /index.html [L]
   </IfModule>
   ```

---

## 🔧 Building for Different Environments

### Production Build
```bash
npm run build:prod
# or
VITE_ENVIRONMENT=prod npm run build
```

### QA Build
```bash
npm run build:qa
```

### UAT Build
```bash
npm run build:uat
```

### Custom Environment Variables
```bash
VITE_ENVIRONMENT=prod VITE_API_BASE_URL=https://api.datamatter.tech npm run build
```

---

## 🌍 Environment-Specific Deployments

### Deploying to QA Environment

1. **Vercel:**
   - Create a new project for QA
   - Set environment variables:
     - `VITE_ENVIRONMENT` = `qa`
     - `VITE_API_BASE_URL` = `https://api-qa.datamatter.tech`

2. **Netlify:**
   - Create a new site for QA
   - Set build environment variables for QA branch
   - Or use branch subdomain

3. **Manual:**
   ```bash
   npm run build:qa
   # Then deploy the dist folder
   ```

### Deploying to UAT Environment

Same as QA, but use:
- `VITE_ENVIRONMENT` = `uat`
- `VITE_API_BASE_URL` = `https://uat.datamatter.tech`

---

## ✅ Pre-Deployment Checklist

- [ ] Test build locally: `npm run build`
- [ ] Verify `dist` folder is generated correctly
- [ ] Test production build: `npm run preview`
- [ ] Set correct environment variables
- [ ] Verify API endpoints are correct
- [ ] Test authentication flow
- [ ] Check CORS settings (if needed)
- [ ] Verify routing works (SPA routing)
- [ ] Test on different browsers
- [ ] Check console for errors

---

## 🐛 Common Issues

### Issue: Routes return 404
**Solution:** Configure your server/hosting to serve `index.html` for all routes (SPA routing).

### Issue: Environment variables not working
**Solution:** 
- Ensure variables start with `VITE_` prefix
- Rebuild after changing environment variables
- Check platform-specific environment variable settings

### Issue: API calls failing (CORS)
**Solution:** 
- Ensure backend API has CORS configured for your domain
- Check API base URL is correct in environment variables

### Issue: Assets not loading
**Solution:**
- Check base path in `vite.config.ts` if deploying to subdirectory
- Verify asset paths are relative

---

## 📦 Build Artifacts

After building, the `dist` folder contains:
- `index.html` - Entry point
- `assets/` - JavaScript, CSS, and other assets
- Other static files

**Do not modify files in `dist` directly** - they are generated by the build process.

---

## 🔄 Continuous Deployment

### Using GitHub Actions

The included `.github/workflows/deploy.yml` can be extended to:
- Deploy to Vercel/Netlify automatically
- Deploy to AWS S3 on push to main
- Run tests before deploying
- Deploy to different environments based on branch

---

## 📝 Environment Variables Reference

| Variable | Development | QA | UAT | Production |
|----------|------------|-----|-----|------------|
| `VITE_ENVIRONMENT` | `dev` | `qa` | `uat` | `prod` |
| `VITE_API_BASE_URL` | `https://api-dev.datamatter.tech` | `https://api-qa.datamatter.tech` | `https://uat.datamatter.tech` | `https://api.datamatter.tech` |
| `VITE_WS_BASE_URL` | `wss://api-dev.datamatter.tech` | `wss://api-qa.datamatter.tech` | `wss://uat.datamatter.tech` | `wss://api.datamatter.tech` |

---

## 🆘 Need Help?

- Check the platform-specific documentation
- Review build logs in deployment platform
- Test build locally first: `npm run build && npm run preview`
- Check environment variables are set correctly

