import DefaultTheme from 'vitepress/theme'
import { Theme } from 'vitepress'
import './custom.css'

export default {
  extends: DefaultTheme,
  enhanceApp({ app, router, siteData }) {
    // Register global components or add app-level logic here
  }
} satisfies Theme