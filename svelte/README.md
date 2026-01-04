# Espanjapeli v2 - SvelteKit

This is the new version of Espanjapeli built with SvelteKit, Tailwind CSS, and DaisyUI.

## Development

```bash
# Install dependencies
npm install

# Start dev server (localhost:5173)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Tech Stack

- **SvelteKit** - Full-stack framework
- **TypeScript** - Type safety
- **Tailwind CSS v4** - Styling with Vite plugin
- **DaisyUI** - Component library with 30+ themes
- **Vite** - Build tool
- **ESLint + Prettier** - Code quality and formatting

## Deployment

The app is configured for static deployment to GitHub Pages. See [DEPLOY.md](../DEPLOY.md) for detailed instructions.

## Project Structure

```
svelte/
├── src/
│   ├── routes/              # Pages and layouts
│   │   ├── +page.svelte    # Home page
│   │   ├── +layout.svelte  # Root layout
│   │   ├── +layout.ts      # Layout config (prerender)
│   │   └── layout.css      # Global styles + Tailwind
│   ├── lib/                 # Reusable code
│   │   ├── components/     # UI components
│   │   ├── services/       # Business logic
│   │   └── stores/         # State management
│   └── app.html            # HTML template
├── static/                  # Static assets
│   └── .nojekyll           # GitHub Pages config
├── build/                   # Production output
└── svelte.config.js        # SvelteKit configuration
```

## Features

- ✅ TypeScript support
- ✅ Tailwind CSS v4 with Vite plugin
- ✅ DaisyUI component library
- ✅ Static site generation (SSG)
- ✅ GitHub Pages deployment
- ✅ ESLint + Prettier
- ✅ Mobile-first responsive design

## Next Steps

See [TODO.md](../TODO.md) for the migration roadmap.
