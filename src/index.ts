import { routePartykitRequest } from "partyserver";
import type { Env } from "./types";
import { landingPage } from "./html/landing";
import { dashboardPage } from "./html/dashboard";

export { DigestObject } from "./digest-object";

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    // Landing page
    if (path === "/" && method === "GET") {
      return new Response(landingPage(), {
        headers: { "content-type": "text/html;charset=utf-8" },
      });
    }

    // Create new digest — just generate a UUID, DO is created lazily on connect
    if (path === "/api/create" && method === "POST") {
      const id = crypto.randomUUID();
      return Response.json({ id });
    }

    // Dashboard page
    const dashMatch = path.match(/^\/d\/([a-f0-9-]{36})$/);
    if (dashMatch && method === "GET") {
      return new Response(dashboardPage(dashMatch[1]), {
        headers: { "content-type": "text/html;charset=utf-8" },
      });
    }

    // Party routes — /parties/digest-object/{room}/...
    const partyResponse = await routePartykitRequest(request, env);
    if (partyResponse) return partyResponse;

    // Fall through to static assets
    return env.ASSETS.fetch(request);
  },
};
