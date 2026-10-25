import { defineConfig, loadEnv, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { PUBLIC_PREFIX, proxyToMaster, type ProxyEnv } from "./src/bff/master-proxy";

/**
 * Local development runs the same /_s proxy as production (api/proxy.ts), so the browser never sees the
 * Master server here either. MASTER_SERVER_URL and INTERNAL_KEY_ADMIN_WEB come from .env.local (not
 * committed; no VITE_ prefix, so Vite never puts them in the bundle).
 */
function masterProxy(env: ProxyEnv): Plugin {
  return {
    name: "master-proxy",
    configureServer(server) {
      server.middlewares.use(PUBLIC_PREFIX, async (req, res) => {
        const chunks: Buffer[] = [];
        for await (const chunk of req) chunks.push(chunk as Buffer);
        const headers = new Headers();
        for (const [name, value] of Object.entries(req.headers)) {
          if (typeof value === "string") headers.set(name, value);
          else if (Array.isArray(value)) headers.set(name, value.join(", "));
        }
        const hasBody = chunks.length > 0 && req.method !== "GET" && req.method !== "HEAD";
        const request = new Request(`http://${req.headers.host}${PUBLIC_PREFIX}${req.url}`, {
          method: req.method,
          headers,
          body: hasBody ? Buffer.concat(chunks) : undefined,
        });
        const response = await proxyToMaster(request, env, { clientIp: req.socket.remoteAddress });
        res.statusCode = response.status;
        response.headers.forEach((value, name) => {
          if (name !== "set-cookie") res.setHeader(name, value);
        });
        const cookies = response.headers.getSetCookie();
        if (cookies.length) res.setHeader("set-cookie", cookies);
        res.end(Buffer.from(await response.arrayBuffer()));
      });
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  return {
    plugins: [
      react(),
      masterProxy({
        MASTER_SERVER_URL: env.MASTER_SERVER_URL || "http://localhost:8000",
        INTERNAL_KEY_ADMIN_WEB: env.INTERNAL_KEY_ADMIN_WEB,
      }),
    ],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    server: {
      port: 5173,
      open: false,
    },
  };
});
