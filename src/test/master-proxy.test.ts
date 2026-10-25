import { describe, it, expect, vi } from "vitest";
import { masterPathFor, proxyToMaster, rewriteSetCookie, clientIpFromVercel } from "../bff/master-proxy";

const ENV = { MASTER_SERVER_URL: "https://master.internal.test/", INTERNAL_KEY_ADMIN_WEB: "k".repeat(40) };

function upstream(status = 200, headers: Record<string, string | string[]> = {}, body = '{"ok":true}') {
  return vi.fn(async (_url: string | URL | Request, _init?: RequestInit) => {
    const h = new Headers({ "content-type": "application/json" });
    for (const [k, v] of Object.entries(headers)) for (const one of [v].flat()) h.append(k, one);
    return new Response(status === 204 ? null : body, { status, headers: h });
  });
}

describe("panel proxy (/_s → Master server)", () => {
  it("maps /_s paths (direct or via the rewrite parameter) to the Master /api path, keeping the query", () => {
    expect(masterPathFor(new URL("https://p.test/_s/orders?limit=5"))).toBe("/api/orders?limit=5");
    expect(masterPathFor(new URL("https://p.test/api/proxy?__mp=auth/refresh&x=1"))).toBe("/api/auth/refresh?x=1");
    expect(masterPathFor(new URL("https://p.test/_s/../secret"))).toBeNull(); // normalised to /secret: outside /_s
    expect(masterPathFor(new URL("https://p.test/api/proxy?__mp=../health"))).toBeNull();
    expect(masterPathFor(new URL("https://p.test/api/proxy?__mp=a%0d%0ab"))).toBeNull();
    expect(masterPathFor(new URL("https://p.test/other"))).toBeNull();
  });

  it("adds this site's key and the client IP, and drops anything the browser tries to forge", async () => {
    const fetchImpl = upstream();
    const req = new Request("https://p.test/_s/me/context", {
      headers: {
        authorization: "Bearer t",
        "x-internal-key": "forged",
        "x-client-ip": "1.2.3.4",
        "x-forwarded-for": "9.9.9.9",
        "x-evil": "1",
        origin: "https://p.test",
      },
    });
    const res = await proxyToMaster(req, ENV, { clientIp: "203.0.113.9", fetchImpl });
    expect(res.status).toBe(200);
    const [url, init] = fetchImpl.mock.calls[0];
    expect(url).toBe("https://master.internal.test/api/me/context");
    const sent = new Headers(init?.headers);
    expect(sent.get("x-internal-key")).toBe(ENV.INTERNAL_KEY_ADMIN_WEB);
    expect(sent.get("x-client-ip")).toBe("203.0.113.9");
    expect(sent.get("authorization")).toBe("Bearer t");
    expect(sent.get("origin")).toBe("https://p.test");
    expect(sent.get("x-forwarded-for")).toBeNull();
    expect(sent.get("x-evil")).toBeNull();
    expect(init?.redirect).toBe("manual");
  });

  it("forwards the body and passes the Master status and body through", async () => {
    const fetchImpl = upstream(409, {}, '{"error":"conflict"}');
    const req = new Request("https://p.test/_s/roles", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: '{"name":"x"}',
    });
    const res = await proxyToMaster(req, ENV, { fetchImpl });
    expect(res.status).toBe(409);
    expect(await res.json()).toEqual({ error: "conflict" });
    expect(new TextDecoder().decode(fetchImpl.mock.calls[0][1]?.body as ArrayBuffer)).toBe('{"name":"x"}');
  });

  it("moves the refresh cookie from /api/auth to /_s/auth and strips any Domain", async () => {
    expect(rewriteSetCookie("ma_refresh=abc; Path=/api/auth; HttpOnly; SameSite=Strict; Domain=master.internal.test")).toBe(
      "ma_refresh=abc; Path=/_s/auth; HttpOnly; SameSite=Strict"
    );
    const fetchImpl = upstream(200, { "set-cookie": ["ma_refresh=abc; Path=/api/auth; HttpOnly", "b=1; Path=/api"] });
    const res = await proxyToMaster(new Request("https://p.test/_s/auth/login", { method: "POST" }), ENV, { fetchImpl });
    expect(res.headers.getSetCookie()).toEqual(["ma_refresh=abc; Path=/_s/auth; HttpOnly", "b=1; Path=/_s"]);
  });

  it("never reveals the Master server: unreachable, redirects and missing settings give a bare error", async () => {
    const down = vi.fn(async () => {
      throw new Error("connect ECONNREFUSED master.internal.test");
    });
    const r1 = await proxyToMaster(new Request("https://p.test/_s/x"), ENV, { fetchImpl: down });
    expect(r1.status).toBe(502);
    expect(await r1.text()).not.toMatch(/master\.internal/);

    const redirect = upstream(302, { location: "https://master.internal.test/elsewhere" });
    const r2 = await proxyToMaster(new Request("https://p.test/_s/x"), ENV, { fetchImpl: redirect });
    expect(r2.status).toBe(502);
    expect(r2.headers.get("location")).toBeNull();

    const r3 = await proxyToMaster(new Request("https://p.test/_s/x"), { MASTER_SERVER_URL: ENV.MASTER_SERVER_URL }, {});
    expect(r3.status).toBe(503);
  });

  it("refuses odd methods and oversized bodies before calling the Master server", async () => {
    const fetchImpl = upstream();
    expect((await proxyToMaster(new Request("https://p.test/_s/x", { method: "OPTIONS" }), ENV, { fetchImpl })).status).toBe(405);
    const big = new Request("https://p.test/_s/x", { method: "POST", body: "x".repeat(1024 * 1024 + 1) });
    expect((await proxyToMaster(big, ENV, { fetchImpl })).status).toBe(413);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("takes the client IP from Vercel's own headers", () => {
    expect(clientIpFromVercel(new Request("https://p.test", { headers: { "x-real-ip": "1.1.1.1" } }))).toBe("1.1.1.1");
    expect(clientIpFromVercel(new Request("https://p.test", { headers: { "x-forwarded-for": "2.2.2.2, 10.0.0.1" } }))).toBe("2.2.2.2");
    expect(clientIpFromVercel(new Request("https://p.test"))).toBeUndefined();
  });
});
