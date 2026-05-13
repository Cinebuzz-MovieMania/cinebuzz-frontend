# Build and environment

## npm scripts

| Script | What it does |
|--------|--------------|
| `npm run dev` | Vite dev server with HMR (default `http://localhost:5173`). |
| `npm run build` | Production build → `dist/`. |
| `npm run preview` | Serve the built `dist/` locally for a smoke test. |
| `npm run lint` | ESLint over the project. |

## Environment variables

Vite only exposes vars prefixed with **`VITE_`**.

| Var | Purpose | Default |
|-----|---------|---------|
| `VITE_API_BASE` | Public API base URL **without** trailing slash. | `http://localhost:8010/cinebuzz` |

Files Vite reads (in order, last wins):

1. `.env`
2. `.env.local` (gitignored)
3. `.env.<mode>` (e.g. `.env.production`)
4. `.env.<mode>.local` (gitignored)

For production builds the deploy script sets `VITE_API_BASE` inline:

```bash
VITE_API_BASE=http://<EC2_HOST>/cinebuzz npm run build
```

## Production output

`dist/` contains:

- `index.html`
- `assets/index-<hash>.js`
- `assets/index-<hash>.css`
- copied static files from `public/`

The hashed filenames mean browser caches refresh themselves on each new build. `index.html` is the only file that changes name-stably; that’s why a hard refresh is sometimes needed right after deploy.

## Vite config

[`vite.config.js`](../vite.config.js) is minimal — React plugin only. If you add path aliases, dev-only proxies, or chunking strategy, do it here.

## Deploying

Building is your job; the script in `cinebuzz-infra/scripts/deploy-frontend-ec2.sh` handles **build → tar → upload → swap → reload Nginx**. See `cinebuzz-infra/docs/deploy-scripts.md` for details.
