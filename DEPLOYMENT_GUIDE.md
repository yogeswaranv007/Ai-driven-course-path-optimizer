# Deployment Guide - Vercel & Render

Quick guide to deploy Learning Path Optimizer to Vercel (frontend) and Render (backend).

## 📋 Prerequisites

- GitHub account with repository
- Vercel account (https://vercel.com)
- Render account (https://render.com)
- MongoDB Atlas account or MongoDB URI
- Groq API key

## 🚀 Frontend Deployment (Vercel)

### Step 1: Prepare Repository

Ensure `.gitignore` and `client/.vercelignore` are configured:

```bash
git add .gitignore client/.vercelignore
git commit -m "chore: add gitignore and vercelignore"
git push origin main
```

### Step 2: Connect to Vercel

1. Go to https://vercel.com/dashboard
2. Click "New Project"
3. Import your GitHub repository
4. Select `client` directory as root
5. Framework: **Vite**
6. Build Command: `npm run build`
7. Output Directory: `dist`
8. Install Command: `npm install`

### Step 3: Environment Variables (Vercel)

In Vercel project settings:

```
VITE_API_BASE_URL = https://your-backend-url.onrender.com
```

### Step 4: Deploy

Click "Deploy" - Vercel will automatically build and deploy!

**Frontend URL**: `https://your-project.vercel.app`

---

## 🔧 Backend Deployment (Render)

### Step 1: Prepare Repository

Ensure `render.yaml` is in root directory (already created).

```bash
git add render.yaml
git commit -m "chore: add render deployment config"
git push origin main
```

### Step 2: Connect to Render

1. Go to https://dashboard.render.com
2. Click "New +" → "Web Service"
3. Connect GitHub repository
4. Select **Node** as environment
5. Build Command: `npm install`
6. Start Command: `npm run start` (from server)
7. Click "Advanced" and use `render.yaml`

### Step 3: Environment Variables (Render)

In Render dashboard, add these environment variables:

```
NODE_ENV              = production
PORT                  = 3000
MONGO_URI             = mongodb+srv://username:password@cluster.mongodb.net/learning-path-optimizer
JWT_SECRET            = your_super_secret_key (generate random string)
GROQ_API_KEY          = gsk_your_groq_api_key
CLIENT_URL            = https://your-frontend.vercel.app
CORS_ORIGINS          = https://your-frontend.vercel.app
```

### Step 4: Deploy

Click "Deploy" - Render will start deployment!

**Backend URL**: `https://your-backend.onrender.com`

---

## ✅ Post-Deployment Checklist

- [ ] Frontend loads at Vercel URL
- [ ] API calls work (check browser console for errors)
- [ ] Backend health check: `GET https://your-backend.onrender.com/health`
- [ ] Login functionality works
- [ ] Can generate roadmaps
- [ ] Environment variables are secure (never commit .env files)

## 🔒 Security Notes

**DO NOT commit:**

- `.env` files with real credentials
- API keys
- JWT secrets
- MongoDB credentials

**Instead:**

- Use platform-specific environment variable management
- For local development: use `.env.local` (already in .gitignore)
- For production: set via dashboard (Vercel/Render)

## 📝 Files Ignored from Git

The `.gitignore` file now excludes:

```
# Sensitive
.env
.env.*
!.env.example

# Build outputs
dist/
build/
.next/

# Vercel/Render specific
.vercel/
.render/

# Development
node_modules/
.vscode/
.cache/
logs/

# OS & IDE
.DS_Store
Thumbs.db
.idea/
```

## 🐛 Common Issues

### Vercel: "Module not found"

- Check `client/vite.config.js` paths
- Verify `VITE_API_BASE_URL` is set

### Render: "Cannot find module"

- Run `npm install` locally first
- Check `package.json` has all dependencies
- Verify Node version compatibility (>=18)

### CORS Errors

- Ensure `CLIENT_URL` in backend matches Vercel frontend URL
- Verify `CORS_ORIGINS` environment variable

### MongoDB Connection Failed

- Check `MONGO_URI` is correct and IP whitelist includes Render IPs
- Use MongoDB Atlas and add `0.0.0.0/0` for testing

### Groq API Errors

- Verify `GROQ_API_KEY` is valid
- Check API quota and rate limits
- Review Groq console for errors

## 📞 Support

For detailed documentation, see `MASTER_DOCUMENTATION.md`

---

**Last Updated**: March 24, 2026
