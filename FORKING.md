# Reuse for a region or country

1. Fork this repository and install dependencies with `npm ci`.
2. Edit `country-config.js`: site name, origin, timezone, map center/bounds, BTC Map search area and boundary filename. The search circle must cover your region; filtering uses the supplied polygon, including holes. A very large country may require a different API retrieval strategy; inspect BTC Map limits and verify coverage.
3. Replace `data/lithuania.geojson` with your licensed GeoJSON Feature (Polygon or MultiPolygon), update the configured path and record provenance. Update geographic tests to match your region.
4. Replace `data/events.json` and the community links/gallery in `data/site.json`. Use real events and source links. Empty events/gallery arrays are supported. Do not reuse another community's invitation links.
5. Adapt English/Lithuanian translations in `atlas-app.js`, the HTML labels, locale selection and static-page language list in `scripts/build-release.mjs`. Additional languages require code changes; do not claim a language by only changing a label.
6. Replace the Lithuania wordmark, flag pin, folklore graphics, social preview and PWA icon. The code license is separate from photos and marks. Remove photo entries you cannot reuse. Update the manifest name/start URL and HTML descriptions/OG tags. Review all remaining `Lithuania`, `Lietuva`, `Vilnius`, `lt-LT`, `lithuaniabtc.com` references.
7. Regenerate the merchant snapshot. Verify known places inside/outside your boundary and review source data licenses.
8. Change the Worker name and public origin, and remove or replace the Lithuania-specific `routes` in `wrangler.jsonc`. The build uses the configured origin for canonical URLs, sharing metadata and sitemap; inspect generated `/`, `/en/`, `/lt/` before publishing.
9. Run tests, build, formatting and deployment dry run. Test mobile tab switching, map reset, event links, ICS timezone handling, both themes, and offline fallback.
10. Deploy your own `public-build/`. Use your own Cloudflare account/domain. Never commit access tokens, account credentials or private notes.

Keep MapLibre, font, BTC Map/OpenStreetMap and basemap attribution notices. Keep the code's MIT notice. Contributions improving portability are welcome.
