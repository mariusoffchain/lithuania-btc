# Contributing

Use a focused branch and explain the user-facing change. Run `npm test`, `npm run build` and `npm run format:check`. Keep third-party vendor files unchanged. Do not include credentials, generated builds or screenshots in patches.

Preserve the English and Lithuanian UI, mobile tab behavior, accessibility labels, map attribution, and timezone-aware calendar exports. Source any new event or merchant data; use BTC Map for merchant corrections rather than silently overriding upstream records.

When changing cache behavior, test initial installation, update waiting, offline navigation, unvisited tiles, and storage failure. Notifications are deliberately out of scope for this version.
