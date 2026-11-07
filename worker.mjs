const CANONICAL_HOST = "lithuaniabtc.com";
const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1"]);
// Public, read-only data that other community sites may load from the browser.
const SHARED_PATHS = [/^\/data\/[^/]+\.json$/, /^\/llms\.txt$/, /^\/read\//];

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (
      !LOCAL_HOSTS.has(url.hostname) &&
      (url.hostname !== CANONICAL_HOST || url.protocol === "http:")
    ) {
      url.hostname = CANONICAL_HOST;
      url.protocol = "https:";
      url.port = "";
      return Response.redirect(url.href, 301);
    }
    if (!SHARED_PATHS.some((p) => p.test(url.pathname)))
      return env.ASSETS.fetch(request);
    if (request.method === "OPTIONS")
      return new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
          "Access-Control-Max-Age": "86400",
        },
      });
    const response = await env.ASSETS.fetch(request);
    const shared = new Response(response.body, response);
    shared.headers.set("Access-Control-Allow-Origin", "*");
    return shared;
  },
};
