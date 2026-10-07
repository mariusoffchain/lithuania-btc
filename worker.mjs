const CANONICAL_HOST = "lithuaniabtc.com";
const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1"]);

export default {
  fetch(request, env) {
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
    return env.ASSETS.fetch(request);
  },
};
