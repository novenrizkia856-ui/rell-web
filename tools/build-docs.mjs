// Builds docs.html from the markdown in content/docs/.
//
// The site has no bundler, so the docs ship as one prerendered page: a sticky
// table of contents on the left, every document stacked as a section on the
// right. Order and titles come from content/docs/SUMMARY.md, so adding a page
// there is the only edit needed. The markdown stays out of the web root so it
// cannot collide with the published /docs URL.
//
// Usage: node tools/build-docs.mjs
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const docsDir = join(root, "content", "docs");

const esc = (s) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const slugOf = (file) => (file === "README.md" ? "introduction" : file.replace(/\.md$/, ""));

// Inline markdown. Code spans are lifted out first so their contents are never
// read as emphasis or a link, then put back at the end.
function inline(text) {
  const spans = [];
  let out = text.replace(/`([^`]+)`/g, (_, code) => {
    spans.push(`<code>${esc(code)}</code>`);
    return `@@code${spans.length - 1}@@`;
  });
  out = esc(out);
  out = out.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, label, href) => {
    const local = href.match(/^([\w.-]+)\.md(#.*)?$/);
    const target = local ? `#${slugOf(`${local[1]}.md`)}` : href;
    const external = /^https?:/.test(target);
    const attrs = external ? ' target="_blank" rel="noopener noreferrer"' : "";
    return `<a href="${esc(target)}"${attrs}>${label}</a>`;
  });
  out = out.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  out = out.replace(/(^|[^*])\*([^*]+)\*/g, "$1<em>$2</em>");
  return out.replace(/@@code(\d+)@@/g, (_, i) => spans[Number(i)]);
}

// A mermaid flowchart, drawn without mermaid. Nodes become steps in the order
// they are declared, and any edge pointing backwards is listed underneath.
function mermaid(src) {
  const labels = new Map();
  const edges = [];
  for (const line of src.split("\n")) {
    const edge = line.trim().match(/^(\w+)(?:\[([^\]]+)\])?\s*-->\s*(\w+)(?:\[([^\]]+)\])?$/);
    if (!edge) continue;
    if (edge[2]) labels.set(edge[1], edge[2]);
    if (edge[4]) labels.set(edge[3], edge[4]);
    edges.push([edge[1], edge[3]]);
  }
  if (!labels.size) return `<pre class="doc-pre"><code>${esc(src)}</code></pre>`;

  const order = [...labels.keys()];
  const steps = order.map((id) => `<li class="doc-flow__step">${esc(labels.get(id))}</li>`).join("");
  const loops = edges
    .filter(([a, b]) => order.indexOf(b) <= order.indexOf(a))
    .map(([a, b]) => `${esc(labels.get(a))} back to ${esc(labels.get(b))}`);
  const note = loops.length ? `<p class="doc-flow__note">Loops back: ${loops.join(", ")}.</p>` : "";
  return `<div class="doc-flow"><ol class="doc-flow__list">${steps}</ol>${note}</div>`;
}

function render(md) {
  const lines = md.split("\n");
  const html = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (!line.trim()) {
      i += 1;
      continue;
    }

    // Fenced code, including the one mermaid diagram.
    if (line.startsWith("```")) {
      const lang = line.slice(3).trim();
      const body = [];
      i += 1;
      while (i < lines.length && !lines[i].startsWith("```")) body.push(lines[i++]);
      i += 1;
      const src = body.join("\n");
      html.push(
        lang === "mermaid" ? mermaid(src) : `<pre class="doc-pre"><code>${esc(src)}</code></pre>`
      );
      continue;
    }

    const heading = line.match(/^(#{1,4})\s+(.*)$/);
    if (heading) {
      // The h1 is the document title and is emitted by the caller.
      if (heading[1].length > 1) {
        const level = heading[1].length;
        html.push(`<h${level}>${inline(heading[2])}</h${level}>`);
      }
      i += 1;
      continue;
    }

    if (/^[-*]\s+/.test(line)) {
      const items = [];
      while (i < lines.length && /^[-*]\s+/.test(lines[i])) {
        items.push(`<li>${inline(lines[i].replace(/^[-*]\s+/, ""))}</li>`);
        i += 1;
      }
      html.push(`<ul class="doc-list">${items.join("")}</ul>`);
      continue;
    }

    if (/^\d+\.\s+/.test(line)) {
      const items = [];
      while (i < lines.length && /^\d+\.\s+/.test(lines[i])) {
        items.push(`<li>${inline(lines[i].replace(/^\d+\.\s+/, ""))}</li>`);
        i += 1;
      }
      html.push(`<ol class="doc-list doc-list--num">${items.join("")}</ol>`);
      continue;
    }

    // Pipe table: header row, separator, then body rows.
    if (line.startsWith("|") && (lines[i + 1] || "").includes("---")) {
      const cells = (row) =>
        row
          .trim()
          .replace(/^\||\|$/g, "")
          .split("|")
          .map((c) => c.trim());
      const head = cells(line)
        .map((c) => `<th>${inline(c)}</th>`)
        .join("");
      i += 2;
      const body = [];
      while (i < lines.length && lines[i].startsWith("|")) {
        body.push(
          `<tr>${cells(lines[i])
            .map((c) => `<td>${inline(c)}</td>`)
            .join("")}</tr>`
        );
        i += 1;
      }
      html.push(
        `<div class="doc-table"><table><thead><tr>${head}</tr></thead><tbody>${body.join(
          ""
        )}</tbody></table></div>`
      );
      continue;
    }

    const para = [];
    while (
      i < lines.length &&
      lines[i].trim() &&
      !/^(#{1,4}\s|[-*]\s|\d+\.\s|\||```)/.test(lines[i])
    ) {
      para.push(lines[i].trim());
      i += 1;
    }
    html.push(`<p>${inline(para.join(" "))}</p>`);
  }

  return html.join("\n            ");
}

// ---- the table of contents drives the page order
const summary = readFileSync(join(docsDir, "SUMMARY.md"), "utf8");
const pages = [...summary.matchAll(/^\*\s+\[([^\]]+)\]\(([^)]+)\)/gm)].map(([, title, file]) => ({
  title,
  file,
  slug: slugOf(file),
}));
if (!pages.length) throw new Error("content/docs/SUMMARY.md listed no pages");

const nav = pages
  .map((p) => `<li><a href="#${p.slug}" data-doc-link>${esc(p.title)}</a></li>`)
  .join("\n            ");

const sections = pages
  .map((p) => {
    const body = render(readFileSync(join(docsDir, p.file), "utf8"));
    return `<section class="doc" id="${p.slug}" aria-labelledby="${p.slug}-title">
            <h2 class="doc__title" id="${p.slug}-title">${esc(p.title)}</h2>
            ${body}
          </section>`;
  })
  .join("\n\n          ");

// The shell shares css/site.css with the app: the fonts, bar and footer of the landing page.
const page = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Docs. RELL</title>
  <meta name="description" content="How RELL reads the rights behind a tokenized stock, and how each claim is sourced and verified.">
  <link rel="canonical" href="https://tryrell.xyz/docs">
  <meta name="robots" content="index, follow">
  <meta property="og:type" content="article">
  <meta property="og:title" content="Docs. RELL">
  <meta property="og:description" content="How RELL reads the rights behind a tokenized stock, and how each claim is sourced and verified.">
  <meta property="og:url" content="https://tryrell.xyz/docs">
  <meta property="og:image" content="https://tryrell.xyz/assets/brand/og-image.png?v=mono">
  <link rel="icon" href="assets/brand/favicon.svg?v=mono" type="image/svg+xml">
  <link rel="apple-touch-icon" href="assets/brand/apple-touch-icon.png?v=mono">

  <link rel="preload" href="assets/fonts/ancizar-serif-400-1.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="stylesheet" href="css/site.css">
  <link rel="stylesheet" href="css/docs.css">
</head>
<body class="docs-body">
  <a class="skip-link" href="#doc-main">Skip to content</a>

  <header class="site-nav" data-header>
    <nav class="site-nav__bar" aria-label="Site">
      <a class="site-nav__brand" href="index.html" aria-label="RELL home">
        <img class="logo--ink" src="assets/brand/logo-lockup.svg?v=mono" width="2305" height="745" alt="Rell">
        <img class="logo--paper" src="assets/brand/logo-lockup-inverse.svg?v=mono" width="2305" height="745" alt="">
      </a>
      <div class="site-nav__links">
        <a class="site-nav__link" href="index.html">Home</a>
        <a class="site-nav__link" href="index.html#map">Rights map</a>
        <a class="site-nav__link is-active" href="docs.html" aria-current="page">Docs</a>
        <button class="site-nav__burger" type="button" data-sheet-open aria-expanded="false" aria-controls="mobile-sheet" aria-label="Open menu"><span></span><span></span></button>
        <a class="btn btn--dark" href="app.html"><span class="btn__label">Open app</span><span class="btn__arrow"><span class="arrow" aria-hidden="true"></span></span></a>
      </div>
    </nav>
  </header>

  <div class="sheet" id="mobile-sheet" data-sheet hidden>
    <div class="sheet__panel" role="dialog" aria-modal="true" aria-label="Menu">
      <div class="sheet__head">
        <a href="index.html" aria-label="RELL home"><img src="assets/brand/logo-lockup.svg?v=mono" width="2305" height="745" alt="Rell"></a>
        <button class="sheet__close" type="button" data-sheet-close aria-label="Close menu"><span></span><span></span></button>
      </div>
      <nav class="sheet__links" aria-label="Mobile">
        <a href="index.html">Home</a>
        <a href="index.html#map">Rights map</a>
        <a href="docs.html" data-sheet-close>Docs</a>
      </nav>
      <div class="sheet__actions">
        <a class="btn btn--dark" href="app.html"><span class="btn__label">Open the app</span><span class="btn__arrow"><span class="arrow" aria-hidden="true"></span></span></a>
      </div>
    </div>
  </div>

  <section class="docs-hero" data-nav-dark>
    <div class="docs-hero__art" aria-hidden="true"><img src="assets/img/step-compass.avif" alt="" width="1536" height="2048"></div>
    <div class="docs-hero__inner">
      <p class="label">Documentation</p>
      <h1 class="display-1">Rights intelligence for tokenized assets.</h1>
      <p class="lede">The concept, the mechanism and the system design behind RELL.</p>
    </div>
  </section>

  <div class="docs-shell">
    <details class="docs-side" id="docs-toc" open>
      <summary class="docs-side__label">Contents</summary>
      <ol class="docs-side__list">
            ${nav}
      </ol>
    </details>

    <main class="docs-main" id="doc-main">
      ${sections}
    </main>
  </div>

  <footer class="site-foot">
    <div class="docs-foot">
      <div class="site-foot__top">
        <div>
          <p class="site-foot__tagline">Read the rights behind every token</p>
          <a class="btn btn--dark" href="app.html"><span class="btn__label">Open the app</span><span class="btn__arrow"><span class="arrow" aria-hidden="true"></span></span></a>
        </div>
        <div class="site-foot__cols">
          <div class="site-foot__col">
            <h2>Product</h2>
            <a href="app.html">RELL app</a>
            <a href="index.html#process">How it works</a>
            <a href="index.html#faq">FAQ</a>
          </div>
          <div class="site-foot__col">
            <h2>Resources</h2>
            <a href="index.html">Home</a>
            <a href="index.html#map">Rights map</a>
            <a href="index.html#contract">Contract address</a>
          </div>
        </div>
      </div>
      <div class="site-foot__base">
        <span>Copyright &copy; <span id="docs-year">2026</span> RELL.</span>
        <span>RELL reports rights. It is not investment advice.</span>
      </div>
    </div>
  </footer>

  <script src="js/header.js"></script>

  <script>
    document.getElementById("docs-year").textContent = String(new Date().getFullYear());
    window.RELL.initHeader();

    /* The contents list is a sidebar on a wide screen and a disclosure on a
       narrow one, where leaving it open would fill the whole first screen. */
    (function () {
      var toc = document.getElementById("docs-toc");
      var narrow = window.matchMedia("(max-width: 959px)");
      var sync = function () { toc.open = !narrow.matches; };
      sync();
      if (narrow.addEventListener) narrow.addEventListener("change", sync);
      toc.addEventListener("click", function (event) {
        if (narrow.matches && event.target.closest("a")) toc.open = false;
      });
    })();

    /* Mark whichever section the reader is in, in the sidebar. */
    (function () {
      var links = Array.prototype.slice.call(document.querySelectorAll("[data-doc-link]"));
      var sections = Array.prototype.slice.call(document.querySelectorAll(".doc"));
      if (!("IntersectionObserver" in window) || !sections.length) return;

      var byId = {};
      links.forEach(function (link) { byId[link.getAttribute("href").slice(1)] = link; });

      var seen = {};
      var observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) { seen[entry.target.id] = entry.isIntersecting; });
        var current = null;
        sections.forEach(function (section) { if (!current && seen[section.id]) current = section.id; });
        links.forEach(function (link) { link.classList.remove("is-current"); });
        if (current && byId[current]) byId[current].classList.add("is-current");
      }, { rootMargin: "-96px 0px -70% 0px" });

      sections.forEach(function (section) { observer.observe(section); });
    })();
  </script>
</body>
</html>
`;

writeFileSync(join(root, "docs.html"), page);
console.log(`wrote docs.html from ${pages.length} pages`);
