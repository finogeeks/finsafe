// One production origin for pages, static diagrams, crawlers and Markdown.
export const siteOrigin = 'https://finshield.finogeeks.club'
export const siteBase = '/'

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
