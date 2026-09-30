# Bitcoin Baltics data sources

- Country boundaries: Natural Earth 1:10m, https://github.com/nvkelso/natural-earth-vector/blob/master/geojson/ne_10m_admin_0_countries.geojson (public domain). LT, LV, EE features retained, including islands. Retrieved 2026-09-30.
- Merchants: BTC Map v4 public search, 500 km around 57.05, 24.45. Filtered against those boundaries; duplicates removed. BTC Map and OpenStreetMap attribution retained.
- Lithuanian events, community links and gallery: the main data/ files, reused at build time.
- Additional community links: sources in site.json; these are directory listings, not partnerships.
- Tallinn event: original Meetup page cited in events.json. No unverified coordinates or dates added.
- Latvian events: no dated entry yet; organisers linked in Community. Riga Walk source shows inconsistent recurring/special-edition details, so no recurrence is inferred.

- Bitcoin symbol SVG: Simple Icons, https://github.com/simple-icons/simple-icons/blob/develop/icons/bitcoin.svg (CC0 project licence). Pin outline original; neutral regional colours.
