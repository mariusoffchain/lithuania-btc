const escape = (s) =>
  String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
export function aboutPage({
  homeHTML,
  copy,
  lang,
  origin,
  name,
  repository,
  initiatives,
}) {
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
  const community = JSON.stringify({ initiatives }).replaceAll("<", "\\u003c");
  const labels = en
    ? ["Map", "Events", "Community", "About"]
    : ["Žemėlapis", "Renginiai", "Bendruomenė", "Apie"];
  // Both page types use the exact header and bottom-bar markup in atlas.html.
  const header = homeHTML
    .match(/<header class="navbar">[\s\S]*?<\/header>/)[0]
    .replace(/(<a class="brand" href=")[^"]*/, "$1" + home)
    .replace(
      'class="desktop-about"',
      'class="desktop-about" aria-current="page"',
    );
  let nav = homeHTML.match(/<nav class="mobile-bottom-nav"[\s\S]*?<\/nav>/)[0];
  nav = nav
    .replace(/<button[\s\S]*?<\/button\s*>/g, (button) => {
      const view = button.match(/data-mobile-view="([^"]+)"/)[1];
      const index = ["map", "events", "community"].indexOf(view);
      return button
        .replace(
          /<button[^>]*>/,
          `<a href="${home}${index ? "?view=" + view : ""}">`,
        )
        .replace(/<\/button\s*>/, "</a>")
        .replace(/<span>([^<]*)<\/span>/, `<span>${labels[index]}</span>`);
    })
    .replace(
      'class="mobile-about"',
      'class="mobile-about" aria-current="page"',
    );
  return `${head}<link rel="stylesheet" href="/about.css"><script type="application/ld+json">${schema}</script><script type="module" src="/about.js"></script></head>
<body class="theme-atlas edition-atlas mode-dark about-page">
<script>if(new URLSearchParams(location.search).get('mode')==='light'){document.body.classList.replace('mode-dark','mode-light')}</script>
${header}
<main class="about-content"><header class="about-intro"><span class="about-kicker">${escape(copy.aboutLabel)} / ${escape(name)}</span><h1>${escape(copy.heading)}</h1><p>${escape(copy.intro)}</p></header>
<div class="about-sections">${copy.sections.map((s, i) => `<section><span class="folk-icon ${i % 2 ? "folk-meetup" : "folk-sun"} about-ornament" aria-hidden="true"></span><h2>${escape(s.heading)}</h2>${s.paragraphs.map((p) => `<p>${escape(p)}</p>`).join("")}${i === 0 ? '<a href="https://btcmap.org/add-location">BTC Map ↗</a>' : i === 1 ? `<a href="${home}?view=events">${labels[1]} →</a>` : i === 3 ? `<a href="${home}?view=community">${labels[2]} →</a>` : ""}</section>`).join("")}</div>
<footer class="about-contribute"><h2>${escape(copy.contributeHeading)}</h2><p>${escape(copy.contributeText)}</p><a href="${escape(repository)}">GitHub ↗</a><a href="${home}">${escape(copy.backLabel)} →</a></footer></main>
${nav}<script type="application/json" id="community-config">${community}</script></body></html>`;
}
