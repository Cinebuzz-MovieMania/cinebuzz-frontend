# Local setup

## Prerequisites

- **Node 20+** (check with `node -v`)
- **npm** (or `pnpm`/`yarn`, but `package-lock.json` is npm)
- A running **cinebuzz-backend** (default `http://localhost:8010/cinebuzz`)

## 1. Clone and install

```bash
git clone https://github.com/Cinebuzz-MovieMania/cinebuzz-frontend.git
cd cinebuzz-frontend
npm ci
```

## 2. Point at your API

The app reads `VITE_API_BASE` at **build time**.

For local dev, the default in [`src/services/api.js`](../src/services/api.js) is `http://localhost:8010/cinebuzz` so you usually don't need to set anything.

If you want to talk to a remote API:

```bash
# Vite reads .env.local automatically, but only vars prefixed with VITE_
echo 'VITE_API_BASE=http://YOUR_IP/cinebuzz' > .env.local
```

(no trailing slash; `services/api.js` appends `/api/v1/…`).

## 3. Run the dev server

```bash
npm run dev
```

Vite prints a `http://localhost:5173` URL. The dev server hot-reloads on save.

## 4. Lint

```bash
npm run lint
```

## 5. Build for production (used by deploy)

```bash
VITE_API_BASE=http://YOUR_PUBLIC_IP/cinebuzz npm run build
```

Output goes to `dist/`. The deploy script in `cinebuzz-infra` packs and ships this folder.

## Common gotchas

- Changing `VITE_API_BASE` after a build doesn’t affect the running site — it’s baked into the JS bundle. **Rebuild and redeploy.**
- Browsers cache `index.html`; **hard refresh** (`Cmd+Shift+R`) after a deploy.
- If login works but admin pages 403, check the backend role rules and that the JWT in `localStorage` carries `ROLE_ADMIN` / `ROLE_SUPER_ADMIN`.
