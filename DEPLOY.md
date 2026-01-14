# Deployment Guide - Espanjapeli v2

This document explains how to deploy the Espanjapeli v2 Svelte app to GitHub Pages.

## Understanding GitHub Pages Deployment Methods

This project uses **GitHub Actions** for deployment, which works differently from the traditional branch-based method:

**Branch-Based Deployment (Old `/docs` folder)**:
- GitHub Pages serves files directly from a specific folder (like `/docs`) in your git repository
- Files are served as-is from the branch
- This is what the old vanilla JS version uses

**GitHub Actions Deployment (New `/svelte` app)**:
- The workflow builds the Svelte app dynamically during CI/CD
- Only the compiled output (`svelte/build/`) is uploaded as an artifact
- This artifact is deployed to GitHub Pages (never committed to git)
- The source code in `/svelte/src` is NOT directly served

**Important**: GitHub Pages can only serve **one source at a time**. When you enable GitHub Actions deployment, it will replace whatever was previously being served (like the `/docs` folder). The `/docs` folder will remain in your repository but won't be publicly accessible via GitHub Pages. If you need both versions live simultaneously, consider deploying the new version to a separate repository.

## Prerequisites

- Your code is pushed to a GitHub repository
- You have admin access to the repository

## One-Time Setup

### 1. Enable GitHub Pages

1. Go to your repository on GitHub
2. Click **Settings** → **Pages** (in the left sidebar)
3. Under **Source**, select:
   - **Source**: GitHub Actions
4. Click **Save**

### 2. Update Base Path (if needed)

The `svelte.config.js` file is configured to use `/espanjapeli` as the base path. 

- If your repo is named **`espanjapeli`** and deploying to `username.github.io/espanjapeli`, you're all set!
- If deploying to a **custom domain** or **`username.github.io`** (user/org site), update `svelte.config.js`:

```javascript
paths: {
  base: process.env.NODE_ENV === 'production' ? '' : ''
}
```

- If your repo has a **different name**, update the base path in `svelte.config.js`:

```javascript
paths: {
  base: process.env.NODE_ENV === 'production' ? '/your-repo-name' : ''
}
```

## Automatic Deployment

Once set up, deployment is automatic:

1. **Push to main/master branch**:
   ```bash
   git add .
   git commit -m "Your commit message"
   git push origin main
   ```

2. **GitHub Actions will automatically**:
   - Install dependencies
   - Build the Svelte app
   - Deploy to GitHub Pages

3. **Check deployment status**:
   - Go to your repo → **Actions** tab
   - Watch the "Deploy to GitHub Pages" workflow
   - Takes about 2-3 minutes

4. **Visit your site**:
   - `https://username.github.io/espanjapeli` (or your configured URL)

## Manual Deployment

You can also trigger a deployment manually:

1. Go to your repo → **Actions** tab
2. Click on **Deploy to GitHub Pages** workflow
3. Click **Run workflow** → **Run workflow**

## Local Testing

To test the production build locally:

```bash
cd svelte
npm run build
npm run preview
```

This will:
- Build the static site
- Start a local preview server
- Show you exactly what will be deployed

## Build Configuration

The app is configured for static deployment:

- **Adapter**: `@sveltejs/adapter-static`
- **Output**: `svelte/build/` directory
- **Prerendering**: Enabled (all pages are pre-rendered at build time)
- **SSR**: Enabled (for better SEO and initial load)

## Troubleshooting

### Site shows 404

1. Check that GitHub Pages is enabled in Settings → Pages
2. Verify the base path in `svelte.config.js` matches your repo name
3. Check the Actions tab for deployment errors

### CSS/JS not loading

- The base path is likely incorrect
- Update `svelte.config.js` to match your deployment URL

### Deployment fails

1. Check the Actions tab for error messages
2. Ensure `package-lock.json` is committed
3. Verify Node.js version compatibility (using Node 20)

### Changes not showing up

1. Hard refresh your browser: Ctrl+Shift+R (or Cmd+Shift+R on Mac)
2. Check that the deployment finished in the Actions tab
3. GitHub Pages can take 1-2 minutes to propagate changes

## Custom Domain (Optional)

To use a custom domain:

1. Add a `CNAME` file to `svelte/static/`:
   ```
   your-domain.com
   ```

2. Update `svelte.config.js`:
   ```javascript
   paths: {
     base: ''
   }
   ```

3. Configure DNS settings with your domain provider:
   - Add a CNAME record pointing to `username.github.io`

4. In GitHub Settings → Pages → Custom domain:
   - Enter your domain
   - Enable "Enforce HTTPS"

## Development Workflow

```bash
# Start development server
cd svelte
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Format code
npm run format

# Lint code
npm run lint

# Type check
npm run check
```

## Project Structure

```
espanjapeli/
├── svelte/                  # Svelte app (new v2)
│   ├── src/
│   │   ├── routes/         # Pages and layouts
│   │   ├── lib/            # Reusable components and utilities
│   │   └── app.html        # HTML template
│   ├── static/             # Static assets (copied to build/)
│   │   └── .nojekyll       # Tells GitHub Pages to serve all files
│   ├── build/              # Production build (generated)
│   └── package.json
├── .github/
│   └── workflows/
│       └── deploy.yml      # Deployment automation
└── README.md
```
