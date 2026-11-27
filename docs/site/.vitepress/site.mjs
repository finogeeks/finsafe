// One production origin for pages, static diagrams, crawlers and Markdown.
export const siteOrigin = 'https://finshield.finogeeks.club'
export const siteBase = '/'

export function publicLink(value) {
  // Retain citation labels without inviting public readers into a private repo.
  if (/^https?:\/\/github\.com\/geeksfino\/finsafe(?:[/?#]|$)/i.test(value)) return null
  // Keep bundled license text intact; correct only its rendered link target.
  return value.replace(/^(https:\/\/github\.com\/rober42539\/lao-dictionary)\/(LICENSE\.txt|laodict\.txt)$/,
    '$1/blob/main/$2')
}

// Standalone HTML has no VitePress page module. Let the browser load it.
export function configurePublicLinks(md) {
  const renderLink = md.renderer.rules.link_open
  md.renderer.rules.link_open = (tokens, index, options, env, self) => {
    renderLink(tokens, index, options, env, self)
    const token = tokens[index]
    const href = publicLink(token.attrGet('href'))
    if (href !== null) token.attrSet('href', href)
    const url = new URL(token.attrGet('href'), siteOrigin)
    if (url.origin === siteOrigin && url.pathname.endsWith('-diagram.html') && token.attrGet('target') === null) {
      token.attrSet('target', '_self')
    }
    return self.renderToken(tokens, index, options)
  }
}

export function canonicalPath(route) {
  return '/' + route.replace(/^\//, '').replace(/\.md$/, '.html').replace(/(^|\/)index\.html$/, '$1')
}

export function siteUrl(route) {
  return new URL(canonicalPath(route), siteOrigin).href
}

export function pageHead(route, routes) {
  if (route === '404.html') return [['meta', { name: 'robots', content: 'noindex' }]]
  const head = [['link', { rel: 'canonical', href: siteUrl(route) }]]
  const translated = /^(en|zh-CN)\//.test(route)
  const suffix = translated ? route.replace(/^(en|zh-CN)\//, '') : 'index.html'
  const pair = ['en', 'zh-CN'].map((locale) => [locale, locale + '/' + suffix])
  if ((translated || route === 'index.html') && pair.every(([, path]) => routes.includes(path))) {
    for (const [locale, path] of pair) head.push(['link', { rel: 'alternate', hreflang: locale, href: siteUrl(path) }])
    head.push(['link', { rel: 'alternate', hreflang: 'x-default', href: siteUrl(translated ? pair[0][1] : 'index.html') }])
  }
  return head
}

// Discovery metadata uses authored summaries and the visible source title.
export function contentHead(page) {
  const url = siteUrl(page.route)
  const language = page.route.startsWith('zh-CN/') ? 'zh-CN' : 'en'
  const image = siteOrigin + '/finshield-logo.webp'
  const graph = {
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'WebSite', '@id': siteOrigin + '/#website', url: siteOrigin + '/',
        name: 'FinShield Documentation', inLanguage: ['en', 'zh-CN'] },
      { '@type': 'WebPage', '@id': url + '#webpage', url, name: page.title,
        description: page.description, inLanguage: page.route === 'index.html' ? ['en', 'zh-CN'] : language,
        isPartOf: { '@id': siteOrigin + '/#website' } },
    ],
  }
  return [
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { property: 'og:site_name', content: 'FinShield' }],
    ['meta', { property: 'og:title', content: page.title }],
    ['meta', { property: 'og:description', content: page.description }],
    ['meta', { property: 'og:url', content: url }],
    ['meta', { property: 'og:image', content: image }],
    ['meta', { property: 'og:image:alt', content: 'FinShield' }],
    ['meta', { name: 'twitter:card', content: 'summary' }],
    ['meta', { name: 'twitter:title', content: page.title }],
    ['meta', { name: 'twitter:description', content: page.description }],
    ['meta', { name: 'twitter:image', content: image }],
    ['meta', { name: 'twitter:image:alt', content: 'FinShield' }],
    ['script', { type: 'application/ld+json' }, JSON.stringify(graph).replaceAll('<', '\\u003c')],
  ]
}

// Standalone diagrams bypass VitePress's head renderer.
export function renderHead(entries) {
  const escape = (value) => String(value).replaceAll('&', '&amp;').replaceAll('"', '&quot;')
    .replaceAll('<', '&lt;').replaceAll('>', '&gt;')
  return entries.map(([tag, attributes, body]) => {
    const start = `<${tag} ${Object.entries(attributes).map(([name, value]) => `${name}="${escape(value)}"`).join(' ')}>`
    return tag === 'script' ? start + body + '</script>' : start
  }).join('\n')
}
