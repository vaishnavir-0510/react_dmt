# 🚀 Complete GitHub Pages Deployment Guide

This guide will help you deploy your React DMT application to GitHub Pages using the **api-dev** API endpoint.

## 📋 Prerequisites - What You Need to Install

### 1. Node.js (if not already installed)
- Download from: https://nodejs.org/
- Install version 18.x or higher
- Verify installation:
  ```bash
  node --version
  npm --version
  ```

### 2. Git (if not already installed)
- Download from: https://git-scm.com/downloads
- Verify installation:
  ```bash
  git --version
  ```

### 3. GitHub Account
- Make sure you have a GitHub account: https://github.com

---

## 🔧 Step-by-Step Deployment Instructions

### Step 1: Configure Git (Already Done - Just Verify)

Your Git is already configured:
- Username: `vaishnavir-0510`
- Email: `vaishurathor7@gmail.com`

Verify with:
```bash
git config --global user.name
git config --global user.email
```

### Step 2: Install Required Packages

Open PowerShell/Terminal in your project directory and run:

```bash
# Install dependencies (if not already done)
npm install

# Install gh-pages package for GitHub Pages deployment
npm install --save-dev gh-pages
```

### Step 3: Update Repository Name in vite.config.ts

**IMPORTANT**: You need to know your GitHub repository name. 

Replace `YOUR_REPO_NAME` with your actual repository name (e.g., `react_dmt`, `dmt-app`, etc.)

The vite.config.ts file is already configured, but you may need to update the base path if your repo name is different.

### Step 4: Build and Deploy

```bash
# Build the application with dev API settings
npm run build:github

# Deploy to GitHub Pages
npm run deploy
```

This will:
1. Build your app with `api-dev.datamatter.tech` API URL
2. Deploy to the `gh-pages` branch
3. Make it available at: `https://vaishnavir-0510.github.io/YOUR_REPO_NAME/`

---

## ⚙️ Configuration Details

### Environment Variables for GitHub Pages

The deployment is configured to use:
- **API Base URL**: `https://api-dev.datamatter.tech`
- **WebSocket URL**: `wss://api-dev.datamatter.tech`
- **Environment**: `dev`

### Repository Structure

After deployment, your repository will have:
- `main` branch - Your source code
- `gh-pages` branch - Built/deployed files (auto-generated)

---

## 🎯 Complete Deployment Commands

Copy and paste these commands in order:

```bash
# 1. Navigate to project directory
cd C:\Users\Bhuvn\react-projects\react_dmt

# 2. Install dependencies
npm install

# 3. Install gh-pages
npm install --save-dev gh-pages

# 4. Build and deploy
npm run build:github
npm run deploy
```

---

## 🌐 Enable GitHub Pages

After running `npm run deploy`, enable GitHub Pages:

1. Go to your GitHub repository
2. Click **Settings**
3. Scroll to **Pages** (left sidebar)
4. Under **Source**, select: **Deploy from a branch**
5. Select branch: **gh-pages**
6. Select folder: **/ (root)**
7. Click **Save**

Your site will be available at:
`https://vaishnavir-0510.github.io/YOUR_REPO_NAME/`

---

## 🔄 Updating Deployment

To update your deployed site:

```bash
npm run build:github
npm run deploy
```

---

## 🐛 Troubleshooting

### Issue: "gh-pages: command not found"
**Solution**: Install gh-pages:
```bash
npm install --save-dev gh-pages
```

### Issue: Build fails
**Solution**: Check for errors:
```bash
npm run build
```

### Issue: Pages not showing
**Solution**: 
1. Wait 5-10 minutes for GitHub Pages to update
2. Check GitHub repository Settings → Pages
3. Verify the branch is `gh-pages`

### Issue: 404 errors when navigating
**Solution**: Make sure `vite.config.ts` has the correct `base` path matching your repository name.

---

## 📝 What Each Command Does

- `npm install` - Installs all project dependencies
- `npm install --save-dev gh-pages` - Installs GitHub Pages deployment tool
- `npm run build:github` - Builds app with GitHub Pages configuration
- `npm run deploy` - Deploys built files to GitHub Pages branch

---

## ✅ Verification Checklist

After deployment, verify:

- [ ] `npm install` completed successfully
- [ ] `gh-pages` package installed
- [ ] `npm run build:github` completed without errors
- [ ] `npm run deploy` completed successfully
- [ ] GitHub Pages enabled in repository settings
- [ ] Site accessible at GitHub Pages URL
- [ ] API calls using `api-dev.datamatter.tech`

---

## 🆘 Need Help?

If you encounter issues:
1. Check the error message
2. Verify all dependencies are installed
3. Ensure Git is properly configured
4. Check GitHub repository settings

---

**Ready to deploy? Follow the commands in "Complete Deployment Commands" section above!**

