# Lithuania BTC

A community-run Bitcoin map and events website for Lithuania. Vanilla JavaScript, MapLibre, BTC Map data, English/Lithuanian UI, light/dark themes, and an installable PWA. Mobile navigation has Map, Events, Community and About destinations.

## Run locally

Use Node.js 22 or newer and Python 3.

```sh
npm ci
npm test
npm run build
npm run preview
```

Open http://127.0.0.1:8767/en/ or /lt/. Serve `public-build/`, never the repository root. Do not edit generated output.

## Adapt it to your country

Read [FORKING.md](FORKING.md). Country geography, timezone and BTC Map query are isolated in `country-config.js`. Events and community links are JSON files. The project is a working Lithuanian edition, not a fully generic localization framework: translations and visual identity still need editorial adaptation.

## Deploy

Cloudflare Workers Static Assets serves the generated files without a backend or API secret.

```sh
npx wrangler login
npm run build
npm run deploy:check
npm run deploy
```

Before deploying a fork, change the Worker name and remove or replace the Lithuania-specific `routes` in `wrangler.jsonc`. With no routes, the site deploys only to a workers.dev address. To attach your own domain, first verify its zone is in the intended Cloudflare account, then configure its custom domain route. HTTPS is required for PWA features outside localhost.

```json
"routes": [{"pattern": "your-domain.example", "custom_domain": true}]
```

## Maintain content

- `data/events.json`: verified events, ISO timestamps with timezone offsets, translated titles/descriptions, venue, links and optional coordinates. Events automatically move into the archive after their end time. The same detail template handles meetups, conferences and walks (`type: "walk"`). Never invent coordinates for an uncertain venue.
- `data/site.json`: community links and photo metadata.
- `data/about.json`: the English and Lithuanian descriptive pages. See [SEO.md](SEO.md) for metadata, share-card reconstruction and the indexing action plan.
- `npm run refresh:merchants`: update the fallback BTC Map snapshot, filtering through the country boundary. Review the diff before publishing.
- Run build and redeploy after changing content. No automatic event import or background publication is configured.

## Offline behavior

The service worker stores the local application shell, events, photos and fallback data. Previously requested OpenFreeMap resources are cached, up to 256 entries. This is not a complete offline country map. Untouched regions and zoom levels still need connectivity. Browsers can evict storage. Last known merchants may be stale; failed refreshes show their retrieval date. No notifications, tracking or geolocation permission are implemented.

A new service worker waits for older app windows to close. The deployment build hashes its code and local content to version the application cache.

## Sources and licensing

Code is MIT. See [THIRD_PARTY.md](THIRD_PARTY.md) for the separate licenses and exclusions covering fonts, map data, photography and third-party branding. Forking the code does not automatically grant permission to reuse community photos or third-party logos.

## Scope and known gaps

The event archive is manually curated and incomplete. The Lithuanian edition has 5 past events and no confirmed future events at initial release. X/Nostr accounts have not been supplied. One Baltic Brew archive has conflicting source addresses and therefore no map pin. Real-device PWA installation and airplane-mode behavior remain to be checked on iOS/Android after HTTPS deployment.
