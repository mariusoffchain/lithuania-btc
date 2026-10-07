# Search and sharing

## Implemented

- `/` is Lithuanian; `/en/` is English. `/lt/` remains a compatible alias with a canonical pointing to `/`.
- `/` and `/en/` each have one visually hidden H1 matching the page title, and the build prerenders the event list with the application's own classes (`scripts/home-crawlable.mjs`). Crawlers that do not run JavaScript, and visitors without it, read the events; `atlas-app.js` replaces the list once its data loads and keeps the H1 in the active language.
- `/about/` and `/en/about/` contain descriptive HTML at build time, including headings and ordinary links. They do not depend on the map application or JavaScript to expose their content.
- Mobile navigation has a fourth About destination. Desktop has a short brand description and an About link.
- Localized titles, descriptions, canonical URLs, reciprocal `hreflang` alternatives, and WebSite/AboutPage JSON-LD describe the real site. No invented reviews or business identity.
- Every dated event has its own page: `/events/<id>/` in Lithuanian and `/en/events/<id>/` in English, with reciprocal `hreflang`. Each page has one H1, the date, venue, address, organiser, description, official links and image, and Event JSON-LD built only from the event data. Planned events without a date have no page.
- Event cards on the home page are links to these pages, before and after JavaScript; a plain click still opens the modal, and its “Copy link” shares the page URL.
- These pages are the canonical URL of each Lithuanian event. The copies on bitcoinbaltics.com, cryptobaltics.org and cypherbaltics.org point their canonical to `/en/events/<id>/` and carry no Event JSON-LD, so search engines see one event, not four.
- `/sitemap.xml` lists the home, About and Ecosystem pages in both languages, and every event page. `/robots.txt` advertises it.
- Open Graph and Twitter large-image cards use separate EN/LT Atlas JPEGs, 1200 × 630. Both languages show the real logo, self-hosted IBM Plex, the country boundary and a short description.
- About pages and their assets are included in the existing offline shell.

These changes help describe and discover the site; they do not guarantee indexing, ranking or the exact snippet Google chooses.

## Next actions

1. **Search Console, site owner.** Add or use the domain property `lithuaniabtc.com`, complete Google's ownership verification, and submit `https://lithuaniabtc.com/sitemap.xml`. Inspect `/`, `/en/`, `/about/` and `/en/about/` and request indexing if needed. This has not been done by the build or deployment.
2. **Existing community links, site owner.** Point the Offchain Media page and official Meetup/Walks profiles to the preferred canonical URL. Once the old DNS/redirect cache issue has cleared, a deliberate redirect from the old Offchain page can transfer visitors to the appropriate language page. Do not recreate the old root-domain redirect.
3. **Useful ongoing content.** Add verified upcoming events, keep BTC Map listings current and publish community photos with permission. Do not create repetitive keyword pages or false future events.
4. **Event results.** After Google has crawled the event pages, check them with the Rich Results Test and in Search Console. Prices and ticket availability are not published because they are not in the data; add them only when the organiser states them. Keep event ids stable: the other sites point to these URLs.
5. **Review performance.** After Google has crawled the pages, compare impressions and clicks for “Bitcoin Lithuania”, “Bitcoin Lietuvoje”, “Bitcoin Vilnius” and “Bitcoin Lituanie” in Search Console. Check index coverage, selected canonical URLs and mobile usability. A French guide could be useful later if supported by actual visitor demand and a complete translation; no French page is currently published.

## Edit and rebuild

- Descriptive copy: `data/about.json` (EN and LT).
- About layout: `scripts/about-page.mjs`, `about.css`, `about.js`.
- Metadata and sitemap: `scripts/build-release.mjs`.
- Event pages: `scripts/event-page.mjs` (layout, derived from the About page) and `scripts/event-data.mjs` (facts and Event JSON-LD, the same file in all four Baltic site repositories).
- Share-card source: `scripts/build-share-templates.mjs`. Run `node scripts/build-share-templates.mjs`, serve `designs/` locally, and export each rendered HTML at exactly 1200 × 630 as `assets/share-atlas-en-v2.jpg` / `assets/share-atlas-lt-v2.jpg`. Wait for fonts and logo to load before capture. Generated HTML is ignored by Git; JPEGs are tracked. The cards intentionally contain no live merchant counts or dates.
- Country forks must replace the card copy/geography and the Lithuanian wordmark as well as the existing country configuration.
- Run `npm test`, `npm run build`, review desktop/mobile, then deploy. Tests verify metadata, reciprocal language links, static About content, event pages and their Event data, sitemap entries and the offline shell.

Social platforms cache previews independently. New image filenames distinguish these cards from the previous share-card.jpg, but already shared URLs may need a re-scrape through the platform's sharing debugger. Actual messaging-client rendering has not been tested here.

## References

- [Google: build and submit a sitemap](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap)
- [Google: localized versions and hreflang](https://developers.google.com/search/docs/specialty/international/localized-versions)
- [Google: JavaScript SEO basics](https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics)
- [Google: site names](https://developers.google.com/search/docs/appearance/site-names)
- [Google: Event structured data](https://developers.google.com/search/docs/appearance/structured-data/event)
