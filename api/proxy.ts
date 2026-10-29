// Vercel function behind the /_s/* rewrite (vercel.json): the panel's only way to the Master server.
import { clientIpFromVercel, proxyToMaster } from "../src/bff/master-proxy.js";

const handle = (request: Request): Promise<Response> =>
  proxyToMaster(
    request,
    { MASTER_SERVER_URL: process.env.MASTER_SERVER_URL, INTERNAL_KEY_ADMIN_FRONTEND: process.env.INTERNAL_KEY_ADMIN_FRONTEND },
    { clientIp: clientIpFromVercel(request) }
  );

export const GET = handle;
export const POST = handle;
export const PUT = handle;
export const PATCH = handle;
export const DELETE = handle;
