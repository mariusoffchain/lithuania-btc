const escape = (s) =>
  String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
export function aboutPage({ homeHTML, copy, lang, origin, name, repository }) {
  const en = lang === "en",
    home = en ? "/en/" : "/",
    path = en ? "/en/about/" : "/about/";
  let head = homeHTML.slice(0, homeHTML.indexOf("</head>"));
  head = head
    .replace(/<title>[^<]*<\/title>/, `<title>${escape(copy.title)}</title>`)
    .replace(
      /<script\s[^>]*src="(?:atlas-app.js|vendor\/maplibre-gl.js)"[^>]*><\/script>/g,
      "",
    )
    .replace(
      /<link\s+rel="stylesheet"\s+href="vendor\/maplibre-gl.css"\s*\/?\s*>/g,
      "",
    )
    .replace(/<script type="application\/ld\+json">.*?<\/script>/s, "")
    .replace(
      /(<meta\s+(?:name|property)="(?:description|og:description|twitter:description)"\s+content=")[^"]*/g,
      "$1" + escape(copy.description),
    )
    .replace(
      /(<meta\s+(?:name|property)="(?:og:title|twitter:title)"\s+content=")[^"]*/g,
      "$1" + escape(copy.title),
    )
    .replace(
      /(<meta\s+property="og:url"\s+content=")[^"]*/g,
      "$1" + origin + path,
    )
    .replace(/(<link\s+rel="canonical"\s+href=")[^"]*/g, "$1" + origin + path)
    .replace(
      /(<link\s+rel="alternate"\s+hreflang="(?:lt|x-default)"\s+href=")[^"]*/g,
      "$1" + origin + "/about/",
    )
    .replace(
      /(<link\s+rel="alternate"\s+hreflang="en"\s+href=")[^"]*/g,
      "$1" + origin + "/en/about/",
    );
  const schema = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "AboutPage",
    name: copy.title,
    description: copy.description,
    url: origin + path,
    inLanguage: lang,
    isPartOf: { "@id": origin + "/#website" },
  }).replaceAll("<", "\\u003c");
  const labels = en
    ? ["Map", "Events", "Community", "About"]
    : ["Žemėlapis", "Renginiai", "Bendruomenė", "Apie"];
  const icons = [
    '<path d="m3 5 6-2 6 2 6-2v16l-6 2-6-2-6 2Zm6-2v16m6-14v16"/>',
    '<path d="M4 5h16v16H4ZM8 2v6m8-6v6M4 10h16M8 14h2m4 0h2"/>',
    '<path d="M8 3v9l-4 8m4-8 4 8M16 3v9l-4 8m4-8 4 8M8 7l4 3 4-3"/>',
    '<path d="M5 3h14v18H5ZM9 8h6m-6 4h6m-6 4h4"/>',
  ];
  const nav = labels
    .map(
      (label, i) =>
        `<a href="${i === 3 ? path : home + (i ? "?view=" + ["map", "events", "community"][i] : "")}" ${i === 3 ? 'aria-current="page"' : ""}><svg viewBox="0 0 24 24" aria-hidden="true">${icons[i]}</svg><span>${label}</span></a>`,
    )
    .join("");
  return `${head}<link rel="stylesheet" href="/about.css"><script type="application/ld+json">${schema}</script><script defer src="/about.js"></script></head>
<body class="theme-atlas edition-atlas mode-dark about-page">
<script>if(new URLSearchParams(location.search).get('mode')==='light'){document.body.classList.replace('mode-dark','mode-light')}</script>
<header class="navbar"><a class="brand" href="${home}" aria-label="${escape(name)}"><img class="brand-logo" src="/assets/logo.png" alt=""><span class="brand-copy"><span class="brand-name"><span class="wordmark-country">Lithuania</span><span class="wordmark-btc">BTC</span></span><span class="brand-description">${escape(copy.shortTagline)}</span></span></a><nav class="nav-links" aria-label="${en ? "Navigation" : "Naršymas"}"><a class="desktop-about" href="${home}">${escape(copy.backLabel)}</a><button id="about-theme" class="language-button" type="button" aria-label="${en ? "Switch theme" : "Keisti spalvų režimą"}"><span class="folk-icon folk-sun" aria-hidden="true"></span></button><a class="language-button about-language" href="${en ? "/about/" : "/en/about/"}" lang="${en ? "lt" : "en"}" aria-label="${en ? "Perjungti į lietuvių kalbą" : "Switch to English"}">${en ? "LT" : "EN"}</a></nav></header>
<main class="about-content"><header class="about-intro"><span class="about-kicker">${escape(copy.aboutLabel)} / ${escape(name)}</span><h1>${escape(copy.heading)}</h1><p>${escape(copy.intro)}</p></header>
<div class="about-sections">${copy.sections.map((s, i) => `<section><span class="folk-icon ${i % 2 ? "folk-meetup" : "folk-sun"} about-ornament" aria-hidden="true"></span><h2>${escape(s.heading)}</h2>${s.paragraphs.map((p) => `<p>${escape(p)}</p>`).join("")}${i === 0 ? '<a href="https://btcmap.org/add-location">BTC Map ↗</a>' : i === 1 ? `<a href="${home}?view=events">${labels[1]} →</a>` : i === 3 ? `<a href="${home}?view=community">${labels[2]} →</a>` : ""}</section>`).join("")}</div>
<footer class="about-contribute"><h2>${escape(copy.contributeHeading)}</h2><p>${escape(copy.contributeText)}</p><a href="${escape(repository)}">GitHub ↗</a><a href="${home}">${escape(copy.backLabel)} →</a></footer></main>
<nav class="mobile-bottom-nav" aria-label="${en ? "Navigation" : "Naršymas"}">${nav}</nav></body></html>`;
}
