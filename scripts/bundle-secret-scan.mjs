#!/usr/bin/env node
// Fails the build if the browser bundle (dist/) contains anything that must stay on the server: the
// Master server's address, an internal key, or a Supabase secret. Run after `vite build`.
import fs from "node:fs";
import path from "node:path";

const DIST = path.resolve(process.argv[2] || "dist");
const forbidden = [
  /api\.master-admin\.onelocal\.co/i,
  /MASTER_SERVER_URL/,
  /INTERNAL_KEY_[A-Z_]+/,
  /x-internal-key/i,
  /sb_secret_[A-Za-z0-9_-]{10,}/,
  /service_role/,
];
// Values actually configured for this build must not appear either.
for (const name of ["MASTER_SERVER_URL", "INTERNAL_KEY_ADMIN_FRONTEND"]) {
  const value = (process.env[name] || "").trim();
  if (value.length >= 8) forbidden.push(new RegExp(value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
}

const files = (dir) =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    return e.isDirectory() ? files(p) : /\.(js|mjs|html|css|json|map|txt)$/.test(e.name) ? [p] : [];
  });

if (!fs.existsSync(DIST)) {
  console.error(`bundle-secret-scan: ${DIST} not found (run the build first)`);
  process.exit(1);
}
const hits = [];
for (const file of files(DIST)) {
  const text = fs.readFileSync(file, "utf8");
  for (const re of forbidden) if (re.test(text)) hits.push(`${path.relative(DIST, file)}: ${re.source.slice(0, 40)}`);
}
if (hits.length) {
  console.error("bundle-secret-scan: server-only values found in the browser bundle:\n  " + hits.join("\n  "));
  process.exit(1);
}
console.log(`bundle-secret-scan: clean (${files(DIST).length} files)`);
