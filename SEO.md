# Search and sharing

## Implemented

- `/` is Lithuanian; `/en/` is English. `/lt/` remains a compatible alias with a canonical pointing to `/`.
- `/about/` and `/en/about/` contain descriptive HTML at build time, including headings and ordinary links. They do not depend on the map application or JavaScript to expose their content.
- Mobile navigation has a fourth About destination. Desktop has a short brand description and an About link.
- Localized titles, descriptions, canonical URLs, reciprocal `hreflang` alternatives, and WebSite/AboutPage JSON-LD describe the real site. No invented reviews or business identity.
- `/sitemap.xml` lists the 4 canonical pages. `/robots.txt` advertises it.
- Open Graph and Twitter large-image cards use separate EN/LT Atlas JPEGs, 1200 × 630. Both languages show the real logo, self-hosted IBM Plex, the country boundary and traditional ornament.
- About pages and their assets are included in the existing offline shell.

These changes help describe and discover the site; they do not guarantee indexing, ranking or the exact snippet Google chooses.

## Next actions

1. **Search Console, site owner.** Add or use the domain property `lithuaniabtc.com`, complete Google's ownership verification, and submit `https://lithuaniabtc.com/sitemap.xml`. Inspect `/`, `/en/`, `/about/` and `/en/about/` and request indexing if needed. This has not been done by the build or deployment.
2. **Existing community links, site owner.** Point the Offchain Media page and official Meetup/Walks profiles to the preferred canonical URL. Once the old DNS/redirect cache issue has cleared, a deliberate redirect from the old Offchain page can transfer visitors to the appropriate language page. Do not recreate the old root-domain redirect.
3. **Useful ongoing content.** Add verified upcoming events, keep BTC Map listings current and publish community photos with permission. Do not create repetitive keyword pages or false future events.
4. **Next development increment.** Generate a stable HTML detail URL per event, with its own title, description, share image and accurate Event structured data. The current `?event=` modal links are usable by visitors but still share the home page's server metadata. Do not claim individual event SEO is implemented.
5. **Review performance.** After Google has crawled the pages, compare impressions and clicks for “Bitcoin Lithuania”, “Bitcoin Lietuvoje”, “Bitcoin Vilnius” and “Bitcoin Lituanie” in Search Console. Check index coverage, selected canonical URLs and mobile usability. A French guide could be useful later if supported by actual visitor demand and a complete translation; no French page is currently published.

## Edit and rebuild

- Descriptive copy: `data/about.json` (EN and LT).
- About layout: `scripts/about-page.mjs`, `about.css`, `about.js`.
- Metadata and sitemap: `scripts/build-release.mjs`.
- Share-card source: `scripts/build-share-templates.mjs`. Run `node scripts/build-share-templates.mjs`, serve `designs/` locally, and export each rendered HTML at exactly 1200 × 630 as `assets/share-atlas-en.jpg` / `assets/share-atlas-lt.jpg`. Wait for fonts and logo to load before capture. Generated HTML is ignored by Git; JPEGs are tracked. The cards intentionally contain no live merchant counts or dates.
- Country forks must replace the card copy/geography and the Lithuanian wordmark as well as the existing country configuration.
- Run `npm test`, `npm run build`, review desktop/mobile, then deploy. Tests verify metadata, reciprocal language links, static About content, sitemap entries and the offline shell.

Social platforms cache previews independently. New image filenames distinguish these cards from the previous share-card.jpg, but already shared URLs may need a re-scrape through the platform's sharing debugger. Actual messaging-client rendering has not been tested here.

## References

- [Google: build and submit a sitemap](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap)
- [Google: localized versions and hreflang](https://developers.google.com/search/docs/specialty/international/localized-versions)
- [Google: JavaScript SEO basics](https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics)
- [Google: site names](https://developers.google.com/search/docs/appearance/site-names)
