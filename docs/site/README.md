# Maintain the FinShield documentation website

[简体中文](README-zh.md)

This public repository owns the website, user guides, plugin usage documentation, homepages, contribution guides and `AGENTS.md`. Edit and review them here. No private checkout, private-source synchronization or product release is required.

## Sources and checks

Edit canonical guides under `docs/en/` and `docs/zh-CN/`. Keep translations, protection limits and version scope consistent. `docs/site/content.json` imports only files from this public checkout. The complete DSH and OpenCode tutorials, in both languages, live under `docs/site/guides/`. Their package READMEs are short installation and documentation entry points; shortening a README must not remove website tutorial content. The manifest's `linkSource` preserves the original relative-link context, not a second content source. The `.generated/` directory is disposable build output. Do not edit it.

From `docs/site/`, with Node.js 22 or later:

```sh
npm ci
npm run check
npm run dev
```

`npm run check` runs preparation and PR-intake tests, builds the site, checks every local link and asset, and verifies canonical URLs, reciprocal language alternatives, sitemap and crawler discovery. Site acceptance also checks locale navigation, protection routes, public architecture scope, client metadata and rejection of damaged output. These checks run in the public Pages workflow. Pull requests build without deployment permission; successful `main` builds deploy.

Standalone `*-diagram.html` pages are full HTML documents. Their Markdown links must use native same-tab navigation (`target="_self"`); they have no VitePress page module. The Markdown renderer applies this automatically, and the output checker rejects unsafe links, including handwritten HTML anchors. A successful direct HTTP request does not test client navigation. Before publication, click all six bilingual diagram entries from a documentation page, follow an anchored diagram link, and return to the documentation. After deployment, repeat these checks against the live domain as well as checking sitemap URLs and resources.

The navigation logo and favicon reuse the existing FinShield desktop brand artwork unchanged, stored as `public/finshield-logo.webp`. Do not replace it with a generic shield. Capability guides describe mechanisms, effective defaults, compatibility exceptions and evidence limits separately; keep both languages consistent when changing a protection claim.

Public readers cannot open the private engineering tracker. Content preparation keeps its citation labels as plain text; it does not assume a private 404 means a reference is missing. The renderer corrects two known third-party GitHub file targets while preserving quoted license text. The output checker rejects these inaccessible targets. External 403 responses, transient server errors and timeouts require separate verification; do not report them as confirmed 404s or remove required license material.

```mermaid
flowchart LR
    A[Review public documentation PR] --> B[Run website checks]
    B --> C[Merge into public main]
    C --> D[Deploy GitHub Pages]
```

Each language uses one stable sidebar tree across documentation routes. Keep the formal whitepaper and its web full text first; do not reorder groups when readers change pages. Other groups stay collapsible and retain their state during client navigation. The former technical whitepaper keeps its URL as a historical mechanisms/evaluation reference, separate from the formal publication; AI bundles link to it without reproducing superseded body text.

## Ownership during product releases

Private engineering documentation and public user documentation have separate owners. Product releases update implementation files, runtime configuration, scripts, binaries, version metadata and required license notices. They preserve public Markdown and HTML guides, including plugin and PII-kit READMEs. Review public usage documentation when released behavior changes; do not restore it from a private snapshot. Do not import private Core, Windows or desktop architecture to repair a link.

## Domain and search setup

### Page summaries and machine-readable sources

`page-descriptions.json` owns one reviewed summary for every public HTML route, including the root language page and standalone diagrams. The route keys must match the generated route inventory exactly. Add summaries for each published language; advertise a translation only after it exists. Page titles come from the visible source heading or title, with imported-page title overrides in `content.json`. Avoid generic repeated summaries and keyword lists; describe the page's actual task, platform and limits.

Preparation generates `metadata.json` from those sources. The site uses it for each page's description, Open Graph, summary sharing card and `WebPage`/`WebSite` JSON-LD. Client navigation updates the same metadata; standalone HTML receives escaped metadata during preparation. Do not invent authors, dates, ratings, customer references or product guarantees for structured data. The 404 page remains `noindex`, and Google's verification file remains unchanged.

| Resource | Scope |
| --- | --- |
| `/llms.txt` | Language selection and machine-resource entry points |
| `/<locale>/llms.txt` | Page titles and summaries grouped by topic, with historical references separate |
| `/<locale>/<topic>/llms.txt` | Focused page selection, such as `development` or `architecture` |
| `/<locale>/llms-full.txt` | Current Markdown bodies with absolute links and source attribution; historical snapshots have links only |
| `/docs.json` | Route, title, summary, language, content kind, canonical URL and Markdown URL for each public page |

These files use only public website inputs. Code examples retain their original text. Images and external resources are linked, not included for offline use. Root and standalone diagram records have a `null` Markdown URL. Do not add private operations material to an index or bundle. Keep each page's key answer in its visible main text and link to evidence with its platform/version scope. The [AI integration guide](../en/development/ai-integration.md) provides a reusable task prompt.

`npm run check` also rejects missing or duplicate descriptions, inconsistent social metadata or JSON-LD, damaged machine catalogs and broken AI-resource links. This verifies generated files, not search ranking or external account state.

### Published whitepapers

The governance publication has a landing page and one continuous full-text page per language under `docs/<locale>/resources/`. The Chinese PDF is the supplied publication, copied unchanged into `public/whitepapers/`. The English PDF is a reviewed translation with adapted layout. Neither publication replaces current installation or integration guides. Keep the dated edition and platform/test limits visible.

`whitepapers.json` records each PDF's edition, publisher, byte count, page count, SHA-256, cover and page routes. Preparation adds the same publication scope to `docs.json`, the `resources/llms.txt` topic and text bundles. Each web page uses its own canonical URL; language alternatives exist only for real translations. PDF indexing remains allowed. Do not point a PDF canonical at the short landing-page summary.

To update a publication, retain its prior versioned PDF, review the new source and translation, then update the matching pages, cover and manifest. The checker compares source and built PDF bytes and checks the visible preview, direct-open fallback, download, full text and references. Inspect PDF rendering and mobile/browser behavior before the PR; an HTTP response alone does not prove inline PDF support.

The English PDF uses the reviewed English Markdown as its content source. To regenerate it, install `reportlab` and `lxml` in a Python environment, render the Markdown to HTML with the site's `createMarkdownRenderer` from `vitepress`, then run `python3 whitepapers/render-english.py <rendered.html> public/whitepapers/agent-security-governance-2026-11-en.pdf` from this directory. Review every rendered page and update the manifest only after checking the output. The renderer embeds ReportLab's bundled Vera fonts and retains the publication title and publisher in PDF metadata; it changes layout, not translation. Extract the English cover from the rendered first page. Never apply this renderer to rewrite the supplied Chinese PDF.

### After deployment

`.vitepress/site.mjs` owns `https://finshield.finogeeks.club` and the root base `/`. Keep the Pages custom-domain setting and DNS aligned with that origin. `public/CNAME` records the domain. If the origin changes, update page metadata, raw Markdown, illustrated pages, LLM indexes, sitemap and robots discovery together.

`public/googlea9662cdfe1496029.html` is Google's original ownership-verification file. Publish it unchanged at the domain root and retain it after verification. It is not a documentation page or sitemap entry. After deployment, confirm the file is accessible, verify the URL-prefix property `https://finshield.finogeeks.club/` in Search Console, and submit `https://finshield.finogeeks.club/sitemap.xml`. Site publication does not prove account verification or indexing. See [Google ownership verification](https://support.google.com/webmasters/answer/9008080).

The build also publishes `/sitemap.txt`, with one absolute canonical URL per line from the same route inventory, including standalone diagrams. Both formats are listed in `robots.txt` and checked against the built pages. If the search platform cannot process the XML sitemap, submit the text version and verify its reading status and discovered URL count. A successful live fetch or submission receipt does not prove sitemap processing or page indexing. See [Google's supported sitemap formats](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap#text).

For Bing, use the platform-issued verification method or import a verified Search Console property. Never add placeholder verification or analytics IDs. Compare complete equal reporting periods for impressions, clicks, CTR, position and indexed pages, split by locale, query and landing page. Keep AI-answer citation checks separate from search metrics; `llms.txt` does not guarantee inclusion or accurate answers.

Inspect the product, installation, WFP, Inspector, integration and enterprise URLs in the search-platform tools after deployment. Confirm crawl access, selected canonical, language alternatives, snippet text and structured-data validity. Test client navigation between different topics and languages so metadata does not stay on the previous page. Record the site release and any indexing errors; submit current sitemap URLs rather than deprecated copies.

For AI visibility checks, use a recorded set of realistic questions about Agent installation, Windows network/desktop limits, PII integration and enterprise contact. Record the engine, date, exact question, answer, cited URL and whether the answer preserves the documented scope. Treat a missing citation separately from a factual error. Repeating a question does not establish a ranking trend. No search or AI account actions run during the site build.

References: [Google snippets](https://developers.google.com/search/docs/appearance/snippet), [Google AI search guidance](https://developers.google.com/search/docs/appearance/ai-features), [structured-data policies](https://developers.google.com/search/docs/appearance/structured-data/sd-policies), and [Cloudflare AI-readable documentation](https://developers.cloudflare.com/style-guide/how-we-docs/ai-consumability/). Google requires no special AI schema or text file for AI search eligibility; machine exports support direct document use and do not guarantee discovery or citations.
