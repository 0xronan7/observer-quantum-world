# GitHub Pages Deployment for Observer Quantum World

## Quick Setup

### 1. Enable GitHub Pages

Go to: **https://github.com/0xronan7/observer-quantum-world/settings/pages**

**Source:** Deploy from a branch
**Branch:** `gh-pages`
**Folder:** `/ (root)`

Click **Save**

---

### 2. Deploy

```bash
cd /home/nanoron/.nanobot/workspace/observer-quantum-world

# Build for production
pnpm run build

# Deploy to gh-pages branch
npx gh-pages -d dist
```

---

### 3. Access

Your site will be live at:
**https://0xronan7.github.io/observer-quantum-world/**

(Allow 1-2 minutes for GitHub Pages to propagate)

---

## Alternative: GitHub Actions (Auto-deploy)

If you want automatic deployment on every push to `main`:

### Create Workflow File

```bash
mkdir -p .github/workflows
```

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: "pages"
  cancel-in-progress: false

jobs:
  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 10

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install

      - name: Build
        run: pnpm run build

      - name: Setup Pages
        uses: actions/configure-pages@v5

      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: './dist'

      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

### Commit and Push

```bash
git add .github/workflows/deploy.yml
git commit -m "ci: add GitHub Pages auto-deploy workflow"
git push origin main
```

GitHub Actions will automatically:
1. Build the project
2. Deploy to GitHub Pages
3. Show deployment status in Actions tab

---

## Manual Deploy Script

Add to `package.json`:

```json
{
  "scripts": {
    "deploy": "pnpm run build && npx gh-pages -d dist"
  }
}
```

Then run:
```bash
pnpm run deploy
```

---

## Troubleshooting

### 404 Error
- Wait 1-2 minutes for propagation
- Check GitHub Pages is enabled in repo settings
- Verify `gh-pages` branch exists with `dist/` contents

### Build Fails
- Run `pnpm install` first
- Check Node.js version (v20+)
- Clear cache: `rm -rf node_modules dist && pnpm install`

### Blank Page
- Open browser console (F12)
- Check for errors
- Verify base path if using custom domain

---

## Custom Domain (Optional)

Add `CNAME` file to `demo/` folder:

```
yourdomain.com
```

Then configure DNS and add domain in GitHub Pages settings.

---

## Current Status

✅ Build working
✅ Vite configured
✅ PIXI.js v7 compatible
✅ Ready to deploy

**Next:** Run `npx gh-pages -d dist` and enable GitHub Pages in settings!
