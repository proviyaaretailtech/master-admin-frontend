# master-admin-web

Proviyaa Master Admin panel (Operations + Finance), served at `master-admin.onelocal.co`.
Split from the Master Admin monorepo (`frontend/`) with history.

## Safety rules

- The browser calls only this site's `/_s/*`. A server function (`api/proxy.ts`, shared code in
  `src/bff/master-proxy.ts`) forwards to the Master server (`master-admin-api`) with this site's internal key.
- The Master server's address and the key are server-only env values (`MASTER_SERVER_URL`,
  `INTERNAL_KEY_ADMIN_WEB`, no `VITE_` prefix). They are never in the bundle; `scripts/bundle-secret-scan.mjs`
  fails the build if they are.
- This repo is public: no secrets in code or history. Real values live only in the deployment's environment settings.

## Local

```bash
cp .env.example .env.local   # set INTERNAL_KEY_ADMIN_WEB to the same value as in master-admin-api's .env
npm ci
npm run dev                  # http://localhost:5173, /_s → http://localhost:8000/api
npm test && npm run build && node scripts/bundle-secret-scan.mjs
```

The permission parity test reads the sibling checkout `../master-admin-api`; it is skipped without it.
