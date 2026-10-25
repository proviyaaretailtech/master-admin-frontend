/**
 * The panel's own server proxy (BFF). The browser only ever calls this site's `/_s/*`; this code runs on
 * the server (a Vercel function in production, the Vite dev server locally) and forwards the request to
 * the Master server with this site's internal key. The Master server's address and the key live only in
 * server environment settings: they are never in the browser bundle, a response, or the network tab.
 *
 * Kept free of Node and Vite imports so the same function serves production, development and tests.
 */

export interface ProxyEnv {
  /** e.g. https://api.master-admin.onelocal.co (no trailing /api). */
  MASTER_SERVER_URL?: string;
  /** This site's key on the Master server (INTERNAL_KEY_ADMIN_WEB there). */
  INTERNAL_KEY_ADMIN_WEB?: string;
}

/** Query parameter the rewrite uses to carry the path after /_s/. */
export const PATH_PARAM = "__mp";
/** The public prefix the browser calls, and the Master server's API prefix it maps to. */
export const PUBLIC_PREFIX = "/_s";
const MASTER_PREFIX = "/api";

const METHODS = new Set(["GET", "POST", "PUT", "PATCH", "DELETE"]);
const MAX_BODY_BYTES = 1024 * 1024;
const UPSTREAM_TIMEOUT_MS = 25_000;
/** Only these browser headers go on to the Master server; everything else (cookies for other paths are
 * never sent by the browser anyway, but forged x-internal-key / x-client-ip / x-forwarded-* are) is dropped. */
const FORWARD_REQUEST_HEADERS = [
  "accept",
  "accept-language",
  "authorization",
  "content-type",
  "cookie",
  "idempotency-key",
  "origin",
  "x-request-id",
];
const FORWARD_RESPONSE_HEADERS = [
  "cache-control",
  "content-disposition",
  "content-type",
  "retry-after",
  "ratelimit-limit",
  "ratelimit-remaining",
  "ratelimit-reset",
  "ratelimit-policy",
  "x-request-id",
];
const SAFE_PATH = /^[A-Za-z0-9._~\-/]*$/;

const json = (status: number, body: unknown): Response =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

/** Master sets its refresh cookie on /api/auth; the browser must keep sending it to /_s/auth. */
export function rewriteSetCookie(cookie: string): string {
  return cookie
    .split(";")
    .map((part) => part.trim())
    .filter((part) => !/^domain=/i.test(part))
    .map((part) =>
      /^path=/i.test(part)
        ? `Path=${part.slice(5).replace(new RegExp(`^${MASTER_PREFIX}(?=/|$)`), PUBLIC_PREFIX)}`
        : part
    )
    .join("; ");
}

/** The /api/... path on the Master server for a browser request, or null if it is not a safe path. */
export function masterPathFor(url: URL): string | null {
  let rest = url.searchParams.get(PATH_PARAM);
  if (rest === null) {
    if (url.pathname !== PUBLIC_PREFIX && !url.pathname.startsWith(`${PUBLIC_PREFIX}/`)) return null;
    rest = url.pathname.slice(PUBLIC_PREFIX.length);
  }
  rest = rest.replace(/^\/+/, "");
  if (!SAFE_PATH.test(rest) || rest.split("/").some((seg) => seg === ".." || seg === ".")) return null;
  const query = new URLSearchParams(url.search);
  query.delete(PATH_PARAM);
  const qs = query.toString();
  return `${MASTER_PREFIX}/${rest}${qs ? `?${qs}` : ""}`;
}

export async function proxyToMaster(
  request: Request,
  env: ProxyEnv,
  opts: { clientIp?: string; fetchImpl?: typeof fetch } = {}
): Promise<Response> {
  const base = (env.MASTER_SERVER_URL || "").trim().replace(/\/+$/, "");
  const key = (env.INTERNAL_KEY_ADMIN_WEB || "").trim();
  if (!base || key.length < 32) return json(503, { error: "not_configured" });
  if (!METHODS.has(request.method)) return json(405, { error: "method_not_allowed" });

  const path = masterPathFor(new URL(request.url));
  if (!path) return json(404, { error: "not_found" });

  const headers = new Headers();
  for (const name of FORWARD_REQUEST_HEADERS) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }
  headers.set("x-internal-key", key);
  if (opts.clientIp) headers.set("x-client-ip", opts.clientIp);

  let body: ArrayBuffer | undefined;
  if (request.method !== "GET") {
    body = await request.arrayBuffer();
    if (body.byteLength > MAX_BODY_BYTES) return json(413, { error: "payload_too_large" });
  }

  let upstream: Response;
  try {
    upstream = await (opts.fetchImpl ?? fetch)(`${base}${path}`, {
      method: request.method,
      headers,
      body: body && body.byteLength > 0 ? body : undefined,
      redirect: "manual",
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
    });
  } catch {
    // Never echo the upstream address or the error text.
    return json(502, { error: "upstream_unavailable" });
  }

  const out = new Headers();
  for (const name of FORWARD_RESPONSE_HEADERS) {
    const value = upstream.headers.get(name);
    if (value) out.set(name, value);
  }
  for (const cookie of upstream.headers.getSetCookie?.() ?? []) out.append("set-cookie", rewriteSetCookie(cookie));
  // A redirect would point the browser at the Master server; the API does not redirect, so refuse it.
  if (upstream.status >= 300 && upstream.status < 400) return json(502, { error: "upstream_unavailable" });
  return new Response(upstream.status === 204 ? null : await upstream.arrayBuffer(), {
    status: upstream.status,
    headers: out,
  });
}

/** Client IP as Vercel reports it (it overwrites these headers; a browser cannot set them). */
export function clientIpFromVercel(request: Request): string | undefined {
  const real = request.headers.get("x-real-ip")?.trim();
  if (real) return real;
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || undefined;
}
