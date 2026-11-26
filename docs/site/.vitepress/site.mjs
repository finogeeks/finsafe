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
