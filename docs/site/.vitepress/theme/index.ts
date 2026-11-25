import type { Theme } from 'vitepress'
import DefaultTheme from 'vitepress/theme'
import MermaidDiagram from './MermaidDiagram.vue'
import './custom.css'

export default {
  extends: DefaultTheme,
  enhanceApp({ app, router }) {
    app.component('MermaidDiagram', MermaidDiagram)
    router.onBeforeRouteChange = (href) => {
      if (typeof window === 'undefined') return
      const target = new URL(href, window.location.href)
      const locale = (path: string) => path.match(/\/(en|zh-CN)\//)?.[1]
      // A translated page has translated heading IDs. Open the same page at
      // its start instead of carrying an invalid heading from the other locale.
      if (target.hash && locale(target.pathname) !== locale(window.location.pathname)) {
        target.hash = ''
        void router.go(target.href)
        return false
      }
    }
  },
} satisfies Theme
